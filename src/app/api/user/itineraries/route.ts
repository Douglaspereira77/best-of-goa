import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { NextResponse } from 'next/server';

// GET - List all user's itineraries
export async function GET() {
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: itineraries, error } = await supabase
    .from('itineraries')
    .select(`
      *,
      items:itinerary_items(count)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json({ error: 'Failed to fetch itineraries' }, { status: 500 });
  }

  // Transform to include item count
  const itinerariesWithCount = itineraries.map((itinerary) => ({
    ...itinerary,
    item_count: itinerary.items?.[0]?.count || 0,
    items: undefined, // Remove the raw items array
  }));

  return NextResponse.json({ itineraries: itinerariesWithCount });
}

// POST - Create new itinerary
export async function POST(request: Request) {
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description } = body;

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('itineraries')
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating itinerary:', error);
    return NextResponse.json({ error: 'Failed to create itinerary' }, { status: 500 });
  }

  return NextResponse.json({ itinerary: data }, { status: 201 });
}
