import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { NextRequest, NextResponse } from 'next/server';

// POST - Add item to itinerary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itineraryId } = await params;
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', itineraryId)
    .single();

  if (!itinerary || itinerary.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { itemType, itemId, notes } = body;

  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 });
  }

  // Validate item type
  const validTypes = ['restaurant', 'hotel', 'mall', 'attraction', 'fitness', 'school'];
  if (!validTypes.includes(itemType)) {
    return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
  }

  // Check if already in itinerary
  const { data: existing } = await supabase
    .from('itinerary_items')
    .select('id')
    .eq('itinerary_id', itineraryId)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Item already in itinerary' }, { status: 409 });
  }

  // Get max sort_order
  const { data: maxOrder } = await supabase
    .from('itinerary_items')
    .select('sort_order')
    .eq('itinerary_id', itineraryId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrder?.sort_order || 0) + 1;

  // Add item
  const { data, error } = await supabase
    .from('itinerary_items')
    .insert({
      itinerary_id: itineraryId,
      item_type: itemType,
      item_id: itemId,
      notes: notes?.trim() || null,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding item:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }

  // Update itinerary's updated_at
  await supabase
    .from('itineraries')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', itineraryId);

  return NextResponse.json({ item: data }, { status: 201 });
}

// DELETE - Remove item from itinerary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itineraryId } = await params;
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', itineraryId)
    .single();

  if (!itinerary || itinerary.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { itemType, itemId } = body;

  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('itinerary_id', itineraryId)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (error) {
    console.error('Error removing item:', error);
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }

  // Update itinerary's updated_at
  await supabase
    .from('itineraries')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', itineraryId);

  return NextResponse.json({ success: true });
}
