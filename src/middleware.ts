import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VERIFY_PATH = "/feedback-portal-verify.txt";

const verifyHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === VERIFY_PATH) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: verifyHeaders });
    }

    const response = NextResponse.next();
    for (const [key, value] of Object.entries(verifyHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  if (pathname.startsWith("/admin")) {
    const userRole = request.cookies.get("user_role")?.value;
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/feedback-portal-verify.txt"],
};
