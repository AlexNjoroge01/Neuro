import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Early return for excluded paths
  const EXCLUDED_PATHS = [
    "/api/mpesa/callback",
    "/_next",
    "/static",
    "/uploads",
    "/favicon.ico",
    "/images",
    "/api/auth",
  ];

  const EXCLUDED_EXTENSIONS =
    /\.(jpg|jpeg|png|gif|svg|ico|webp|avif|mp4|woff2?)$/i;

  if (
    EXCLUDED_PATHS.some((path) => pathname.startsWith(path)) ||
    EXCLUDED_EXTENSIONS.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Define route patterns
  const PUBLIC_PATHS = [
    "/",
    "/shop",
    "/auth/login",
    "/auth/register",
    "/login",
    "/register",
    "/api",
  ];

  const CUSTOMER_PATHS = ["/account", "/cart", "/orders"];

  const ADMIN_PATHS = [
    "/dashboard",
    "/products",
    "/inventory",
    "/sales",
    "/pos",
    "/accounting",
    "/hr",
    "/reports",
    "/settings",
  ];

  // Helper function for exact and prefix matching
  const matchesPath = (url: string, paths: string[]): boolean => {
    return paths.some((path) => {
      // Exact match or starts with path followed by / or end of string
      return url === path || url.startsWith(`${path}/`);
    });
  };

  // Allow public paths
  if (matchesPath(pathname, PUBLIC_PATHS)) {
    return NextResponse.next();
  }

  // Get authentication token
  const token = await getToken({ req, secret: env.NEXTAUTH_SECRET });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // SUPERUSER has access to everything
  if (token.role === "SUPERUSER") {
    return NextResponse.next();
  }

  // Customer route protection
  if (matchesPath(pathname, CUSTOMER_PATHS)) {
    if (token.role === "CUSTOMER" || token.role === "ADMIN") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/shop", req.url));
  }

  // Admin route protection
  if (matchesPath(pathname, ADMIN_PATHS)) {
    if (token.role === "ADMIN") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/shop", req.url));
  }

  // Default: allow access (for any other routes not explicitly defined)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Static assets (images, videos, fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp|avif|mp4|woff2?)).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
