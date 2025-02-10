import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/home'];
const publicRoutes = ['/'];

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has('auth-token');
  const { pathname } = request.nextUrl;

  // Redirect protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect public routes if authenticated
  if (publicRoutes.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}