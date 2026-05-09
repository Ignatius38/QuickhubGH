import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/error?reason=${error}&description=${errorDescription || ''}`,
        request.url
      )
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );

    if (exchangeError) {
      return NextResponse.redirect(
        new URL(
          `/auth/error?reason=exchange_failed&description=${exchangeError.message}`,
          request.url
        )
      );
    }

    // Optional: Check user profile and handle onboarding
    // Currently redirecting directly to feed since onboarding page not implemented
    // In the future, we could check if user needs to complete onboarding
    
    // Redirect to feed on successful auth
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // No code or error
  return NextResponse.redirect(new URL('/', request.url));
}
