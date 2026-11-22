import { NextResponse } from "next/server";
import {
  verifyStaffPassword,
  setStaffSession,
  clearStaffSession,
  isStaffAuthenticated,
} from "@/shared/server/staff-session";

export async function GET() {
  const authed = await isStaffAuthenticated();
  return NextResponse.json({ authenticated: authed });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || !verifyStaffPassword(password)) {
      return NextResponse.json(
        { error: "Incorrect staff password. Please check and try again." },
        { status: 401 }
      );
    }

    await setStaffSession();
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
