import { updateSession } from '@/lib/supabase/proxy'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

function clearSessionAndRedirect(request: NextRequest) {
  const redirectResponse = NextResponse.redirect(new URL('/auth/login', request.url))
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')) {
      redirectResponse.cookies.delete(cookie.name)
    }
  })
  return redirectResponse
}

export async function middleware(request: NextRequest) {
  let response: NextResponse
  try {
    response = await updateSession(request)
  } catch (e) {
    return clearSessionAndRedirect(request)
  }

  // Create a supabase client to check auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    },
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    return clearSessionAndRedirect(request)
  }

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users away from protected routes
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/auth/login' || pathname === '/auth/signup' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
