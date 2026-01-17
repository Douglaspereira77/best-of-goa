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

// GET - Get shared itinerary by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createServerAuthClient();

  // Fetch itinerary by share token
  const { data: itinerary, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('share_token', token)
    .eq('is_public', true)
    .single();

  if (error || !itinerary) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
  }

  // Fetch owner profile
  const { data: owner } = await supabase
    .from('profiles')
    .select('full_name, preferred_name')
    .eq('id', itinerary.user_id)
    .single();

  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('itinerary_id', itinerary.id)
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
      owner_name: owner?.preferred_name || owner?.full_name || 'Anonymous',
    },
  });
}
