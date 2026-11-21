import { cookies } from "next/headers";

const STAFF_COOKIE_NAME = "pq_staff_session";

function getExpectedToken(): string {
  return process.env.STAFF_SESSION_SECRET || "pq-default-secure-staff-token-2026";
}

export function verifyStaffPassword(inputPassword: string): boolean {
  const configuredPassword = process.env.STAFF_PASSWORD || "admin";
  return inputPassword.trim() === configuredPassword.trim();
}

export async function setStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: STAFF_COOKIE_NAME,
    value: getExpectedToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE_NAME);
}

export async function isStaffAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  return token === getExpectedToken();
}

export function isStaffHeaderAuthenticated(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${STAFF_COOKIE_NAME}=([^;]*)`));
  if (!match) return false;
  return decodeURIComponent(match[1]) === getExpectedToken();
}
