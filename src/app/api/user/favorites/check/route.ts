import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemType = searchParams.get('itemType');
  const itemId = searchParams.get('itemId');

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: 'itemType and itemId are required' },
      { status: 400 }
    );
  }

  const supabase = await createServerAuthClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ isFavorited: false });
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();

  if (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }

  return NextResponse.json({ isFavorited: !!data });
}
