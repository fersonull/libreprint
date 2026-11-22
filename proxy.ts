import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isStaffHeaderAuthenticated } from "@/shared/server/staff-session";

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

  // Protect staff API routes (except auth login) and uploaded documents
  const isStaffApi = pathname.startsWith("/api/staff") && !pathname.startsWith("/api/staff/auth");
  if (isStaffApi || pathname.startsWith("/api/files")) {
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
    "/api/files/:path*",
  ],
};
