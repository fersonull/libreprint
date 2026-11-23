import { NextResponse } from "next/server";
import {
  verifyStaffPassword,
  setStaffSession,
  clearStaffSession,
  isStaffAuthenticated,
  getConfiguredPassword,
} from "@/shared/server/staff-session";
import { clientIp, isRateLimited, resetRateLimit } from "@/shared/server/rate-limit";

export async function GET() {
  const authed = await isStaffAuthenticated();
  return NextResponse.json({ authenticated: authed });
}

export async function POST(request: Request) {
  try {
    if (getConfiguredPassword() === null) {
      return NextResponse.json(
        { error: "Staff sign-in is off until STAFF_PASSWORD is set on the server." },
        { status: 503 }
      );
    }

    const limitKey = `login:${clientIp(request.headers)}`;
    if (isRateLimited(limitKey, 10, 15 * 60_000)) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Wait 15 minutes and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (typeof password !== "string" || !verifyStaffPassword(password)) {
      return NextResponse.json(
        { error: "Incorrect staff password. Please check and try again." },
        { status: 401 }
      );
    }

    resetRateLimit(limitKey);
    // Cloudflare Tunnel reaches us over http but tells us the visitor used https.
    const secure = request.headers.get("x-forwarded-proto") === "https" || new URL(request.url).protocol === "https:";
    await setStaffSession({ secure });
    return NextResponse.json({ success: true, message: "Logged in as staff" });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearStaffSession();
  return NextResponse.json({ success: true, message: "Logged out" });
}
