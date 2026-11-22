import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isStaffHeaderAuthenticated } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect staff dashboard pages
  if (pathname.startsWith("/staff/dashboard")) {
    const cookieHeader = request.headers.get("cookie");
    const isAuthenticated = isStaffHeaderAuthenticated(cookieHeader);

    if (!isAuthenticated) {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect staff API routes (except auth login)
  if (pathname.startsWith("/api/staff") && !pathname.startsWith("/api/staff/auth")) {
    const cookieHeader = request.headers.get("cookie");
    const isAuthenticated = isStaffHeaderAuthenticated(cookieHeader);

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized staff access." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/staff/dashboard/:path*",
    "/api/staff/:path*",
  ],
};
