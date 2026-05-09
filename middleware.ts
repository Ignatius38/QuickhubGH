import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasActiveSubscription } from '@/lib/subscription'

type CookieOptions = {
  name: string
  value: string
  options: {
    httpOnly?: boolean
    secure?: boolean
    maxAge?: number
    path?: string
    sameSite?: 'lax' | 'strict' | 'none'
    domain?: string
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions['options']) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions['options']) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Define platform routes that require authentication
  const platformRoutes = [
    '/feed',
    '/jobs',
    '/profile',
    '/subscribe',
    '/notifications',
  ]

  const currentPath = request.nextUrl.pathname
  const isPlatformRoute = platformRoutes.some(route => 
    currentPath === route || currentPath.startsWith(`${route}/`)
  )

  if (isPlatformRoute) {
    // If no user and trying to access platform route, redirect to landing page
    if (!user || error) {
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Check subscription for gated routes
    const gatedRoutes = ['/jobs/new']
    
    // Check if current path matches any gated route
    const isGatedRoute = gatedRoutes.some(route => 
      currentPath === route || currentPath.startsWith(`${route}/`)
    )
    
    if (isGatedRoute) {
      const hasSubscription = await hasActiveSubscription(supabase, user.id)
      if (!hasSubscription) {
        const redirectUrl = new URL('/subscribe', request.url)
        redirectUrl.searchParams.set('reason', 'post')
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}