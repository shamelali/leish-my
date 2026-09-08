import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authToken = request.cookies.get('leish_auth_session')?.value

  if (pathname.startsWith('/artists/dashboard') && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/api/cron') && request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/artists/dashboard/:path*', '/api/cron/:path*']
}