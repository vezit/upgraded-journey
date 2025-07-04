import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseConfigured } from '@/lib/supabaseClient'

export async function middleware(req: NextRequest) {
  const res  = NextResponse.next()
  if (!supabaseConfigured) {
    return res
  }

  const supa = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supa.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/invoice')) {
    const login = req.nextUrl.clone()
    login.pathname = '/login'
    login.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(login)
  }
  return res
}

export const config = { matcher: ['/invoice/:path*'] }
