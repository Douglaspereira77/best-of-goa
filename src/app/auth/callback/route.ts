import { createServerAuthClient } from '@/lib/supabase/server-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('[Auth Callback] Received:', { code: !!code, token_hash: !!token_hash, type, next, origin });

  const supabase = await createServerAuthClient();

  // Handle PKCE flow (code exchange) - used by OAuth providers like Google
  if (code) {
    console.log('[Auth Callback] Processing PKCE code exchange...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log('[Auth Callback] Code exchange result:', {
      success: !!data.session,
      userId: data.user?.id,
      error: error?.message
    });

    if (!error && data.session) {
      // Ensure profile exists (safety check, trigger should handle this)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!profile) {
        console.warn('[Auth Callback] Profile not found, creating manually...');
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
        }).select().single();
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${origin}${next}`;
      }

      console.log('[Auth Callback] Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    } else {
      console.error('[Auth Callback] Code exchange failed:', error);
    }
  }

  // Handle email confirmation/recovery with token_hash (NOT for OAuth)
  if (token_hash && type) {
    console.log('[Auth Callback] Processing token verification for type:', type);

    // Recovery tokens should go to reset-password page
    if (type === 'recovery') {
      console.log('[Auth Callback] Redirecting recovery to reset-password page');
      return NextResponse.redirect(`${origin}/reset-password?code=${code || ''}`);
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email',
    });
    console.log('[Auth Callback] Token verification result:', { error: error?.message });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  console.error('[Auth Callback] No valid authentication method found, redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
