import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const requestUrl = req.nextUrl;          // ✅ renamed from 'url' to avoid collision
  const pathname = requestUrl.pathname;
  // Allow static assets, _next, uploads, favicon, images, etc.
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/static") ||
    req.nextUrl.pathname.startsWith("/uploads") ||
    req.nextUrl.pathname.startsWith("/favicon.ico") ||
    req.nextUrl.pathname.startsWith("/images")||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|avif|mp4|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const PUBLIC_PATHS = ["/shop", "/auth/login", "/auth/register", "/login", "/register", "/shop/"];
  const CUSTOMER_PATHS = ["/account", "/cart", "/orders"];
  const ADMIN_PATHS = [
    "/dashboard", "/products", "/inventory", "/sales", "/pos", "/accounting", "/hr", "/reports", "/settings"
  ];

  const url = req.nextUrl.pathname;
  if (PUBLIC_PATHS.some((p) => url.startsWith(p))) return NextResponse.next();
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  if (token.role === "SUPERUSER") return NextResponse.next();
  if (CUSTOMER_PATHS.some((p) => url.startsWith(p))) {
    if (token.role === "CUSTOMER") return NextResponse.next();
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (ADMIN_PATHS.some((p) => url.startsWith(p))) {
    if (token.role === "ADMIN") return NextResponse.next();
    return NextResponse.redirect(new URL("/shop", req.url));
  }
  return NextResponse.next();
}
