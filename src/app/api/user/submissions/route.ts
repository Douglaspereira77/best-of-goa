import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { NextResponse } from 'next/server';

// GET - List user's submissions
export async function GET() {
  const supabase = await createServerAuthClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: submissions, error } = await supabase
    .from('business_submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }

  return NextResponse.json({ submissions });
}
