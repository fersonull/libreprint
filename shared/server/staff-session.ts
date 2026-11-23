import { createHmac, randomBytes, timingSafeEqual, createHash } from "crypto";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";

const STAFF_COOKIE_NAME = "pq_staff_session";
const SESSION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

let cachedSecret: string | null = null;

/** STAFF_SESSION_SECRET, or a random one generated once and kept in data/ so sessions survive restarts. */
function getSecret(): string {
  if (process.env.STAFF_SESSION_SECRET) return process.env.STAFF_SESSION_SECRET;
  if (cachedSecret) return cachedSecret;
  const file = path.join(process.cwd(), "data", ".session-secret");
  try {
    cachedSecret = fs.readFileSync(file, "utf8").trim();
  } catch {
    cachedSecret = randomBytes(32).toString("hex");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, cachedSecret, { mode: 0o600 });
  }
  return cachedSecret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  // Hash first so lengths always match and nothing leaks through timing.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** A fresh token per sign-in: "<expiry>.<nonce>.<signature>". */
function createToken() {
  const payload = `${Date.now() + SESSION_MS}.${randomBytes(16).toString("base64url")}`;
  return `${payload}.${sign(payload)}`;
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return false;
  const payload = token.slice(0, lastDot);
  if (!safeEqual(token.slice(lastDot + 1), sign(payload))) return false;
  return Number(payload.split(".")[0]) > Date.now();
}

/** null when no password is configured in production, so the shop can't go online with the default. */
export function getConfiguredPassword(): string | null {
  const configured = process.env.STAFF_PASSWORD?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : "admin";
}

export function verifyStaffPassword(inputPassword: string): boolean {
  const configured = getConfiguredPassword();
  return configured !== null && safeEqual(inputPassword.trim(), configured);
}

/** `secure` must match how the visitor reached us: browsers drop Secure cookies on plain-http LAN addresses. */
export async function setStaffSession({ secure }: { secure: boolean }): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: STAFF_COOKIE_NAME,
    value: createToken(),
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export async function clearStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE_NAME);
}

export async function isStaffAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidToken(cookieStore.get(STAFF_COOKIE_NAME)?.value);
}

export function isStaffHeaderAuthenticated(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${STAFF_COOKIE_NAME}=([^;]*)`));
  return isValidToken(match ? decodeURIComponent(match[1]) : undefined);
}
