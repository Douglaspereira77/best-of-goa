import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch favorites with item details using the database function
  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }

  // Fetch item details for each favorite
  const favoritesWithDetails = await Promise.all(
    favorites.map(async (favorite) => {
      let itemDetails = null;

      // Map item_type to table name
      const tableMap: Record<string, string> = {
        restaurant: 'restaurants',
        hotel: 'hotels',
        mall: 'malls',
        attraction: 'attractions',
        fitness: 'fitness_places',
        school: 'schools',
      };

      const tableName = tableMap[favorite.item_type];

      if (tableName) {
        const { data } = await supabase
          .from(tableName)
          .select('name, slug, hero_image, area, bok_score, google_rating')
          .eq('id', favorite.item_id)
          .single();

        if (data) {
          itemDetails = {
            name: data.name,
            slug: data.slug,
            hero_image: data.hero_image,
            area: data.area,
            rating: data.bok_score || data.google_rating,
          };
        }
      }

      return {
        ...favorite,
        item: itemDetails,
      };
    })
  );

  return NextResponse.json({ favorites: favoritesWithDetails });
}

export async function POST(request: Request) {
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { itemType, itemId } = body;

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: 'itemType and itemId are required' },
      { status: 400 }
    );
  }

  // Validate item type
  const validTypes = ['restaurant', 'hotel', 'mall', 'attraction', 'fitness', 'school'];
  if (!validTypes.includes(itemType)) {
    return NextResponse.json(
      { error: 'Invalid item type' },
      { status: 400 }
    );
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Item already favorited' },
      { status: 409 }
    );
  }

  // Add favorite
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      item_type: itemType,
      item_id: itemId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }

  return NextResponse.json({ favorite: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { itemType, itemId } = body;

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: 'itemType and itemId are required' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
