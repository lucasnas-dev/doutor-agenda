import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso às rotas de autenticação sem verificar sessão
  if (
    pathname.startsWith("/authentication") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/authentication", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/patients",
    "/doctors",
    "/appointments",
    "/subscription",
    "/new-subscription",
    // Remover o matcher muito amplo que estava causando problemas
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|authentication).*)",
  ],
};
