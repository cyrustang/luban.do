import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Completely disable the middleware redirects and let client-side handle auth
export function middleware(request: NextRequest) {
  // Just log the path but don't redirect
  console.log("Middleware running on path:", request.nextUrl.pathname)

  // Always allow access without redirecting
  return NextResponse.next()
}

// Keep the matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - also exclude api routes that handle auth
     */
    "/((?!_next/static|_next/image|favicon.ico|public|manifest.json|sw.js|register-sw.js|api/auth).*)",
  ],
}

