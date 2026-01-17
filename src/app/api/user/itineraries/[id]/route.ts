import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { NextRequest, NextResponse } from 'next/server';

// Helper to get item details
async function getItemDetails(supabase: any, itemType: string, itemId: string) {
  const tableMap: Record<string, string> = {
    restaurant: 'restaurants',
    hotel: 'hotels',
    mall: 'malls',
    attraction: 'attractions',
    fitness: 'fitness_places',
    school: 'schools',
  };

  const tableName = tableMap[itemType];
  if (!tableName) return null;

  const { data } = await supabase
    .from(tableName)
    .select('name, slug, hero_image, area, bok_score, google_rating')
    .eq('id', itemId)
    .single();

  if (!data) return null;

  return {
    name: data.name,
    slug: data.slug,
    hero_image: data.hero_image,
    area: data.area,
    rating: data.bok_score || data.google_rating,
  };
}

// GET - Get single itinerary with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerAuthClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch itinerary (RLS will handle public vs private)
  const { data: itinerary, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !itinerary) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
  }

  // Check access - must be owner or public
  if (!itinerary.is_public && itinerary.user_id !== user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('itinerary_id', id)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    console.error('Error fetching items:', itemsError);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }

  // Fetch details for each item
  const itemsWithDetails = await Promise.all(
    (items || []).map(async (item) => {
      const details = await getItemDetails(supabase, item.item_type, item.item_id);
      return { ...item, details };
    })
  );

  return NextResponse.json({
    itinerary: {
      ...itinerary,
      items: itemsWithDetails,
      is_owner: user?.id === itinerary.user_id,
    },
  });
}

// PUT - Update itinerary
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, is_public } = body;

  // Verify ownership
  const { data: existing } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (is_public !== undefined) updates.is_public = is_public;

  // Generate share token if making public for first time
  if (is_public === true) {
    const { data: current } = await supabase
      .from('itineraries')
      .select('share_token')
      .eq('id', id)
      .single();

    if (!current?.share_token) {
      updates.share_token = crypto.randomUUID().slice(0, 12);
    }
  }

  const { data, error } = await supabase
    .from('itineraries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating itinerary:', error);
    return NextResponse.json({ error: 'Failed to update itinerary' }, { status: 500 });
  }

  return NextResponse.json({ itinerary: data });
}

// DELETE - Delete itinerary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { error } = await supabase
    .from('itineraries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting itinerary:', error);
    return NextResponse.json({ error: 'Failed to delete itinerary' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
