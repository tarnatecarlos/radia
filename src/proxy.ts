import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/invite"];
const SESSION_COOKIE = "radia_session";

function getRedirectUrl(pathname: string, request: NextRequest): URL {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return new URL(pathname, siteUrl);
  }
  return new URL(pathname, request.url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Only protect /dashboard and /setup routes
  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/setup")) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    const loginUrl = getRedirectUrl("/login", request);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify session by calling the /api/auth/me endpoint
  // We can't use SQLite directly in middleware (edge), so we check via API
  try {
    const meUrl = new URL("/api/auth/me", request.url);
    const res = await fetch(meUrl.toString(), {
      headers: { cookie: `${SESSION_COOKIE}=${sessionId}` },
    });

    if (!res.ok) {
      const loginUrl = getRedirectUrl("/login", request);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check setup_completed for dashboard routes
    if (pathname.startsWith("/dashboard")) {
      const data = await res.json();
      if (data.profile && !data.profile.setup_completed) {
        return NextResponse.redirect(getRedirectUrl("/setup", request));
      }
    }
  } catch {
    // If API is unreachable, allow access (dev mode resilience)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/setup"],
};
