import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Non-approved users: redirect to /auth/pending
    // (Skip this check for the pending page itself and auth routes)
    if (
      token?.status &&
      token.status !== 'approved' &&
      !pathname.startsWith('/auth/')
    ) {
      return NextResponse.redirect(new URL('/auth/pending', req.url))
    }

    // Admin routes: require admin role
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/onboarding/:path*', '/onboarding'],
}
