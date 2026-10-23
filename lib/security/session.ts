import { createHmac, timingSafeEqual } from "node:crypto";

export interface SessionPayload {
  u: string;
  e: number;
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const ALGO = "sha256";

function encodeBody(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBody(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signSessionToken(
  userId: string,
  secret: string,
  expiresAtEpochSeconds: number
): string {
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  if (!userId) {
    throw new Error("userId is required");
  }
  const body = encodeBody(JSON.stringify({ u: userId, e: expiresAtEpochSeconds }));
  const sig = createHmac(ALGO, secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  nowEpochSeconds: number = Math.floor(Date.now() / 1000)
): SessionPayload | null {
  if (!token || !secret) return null;
  const idx = token.indexOf(".");
  if (idx <= 0) return null;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!body || !sig) return null;

  const expected = createHmac(ALGO, secret).update(body).digest();
  const actual = Buffer.from(sig, "base64url");
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(decodeBody(body));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  const { u, e } = payload as SessionPayload;
  if (typeof u !== "string" || u.length === 0) return null;
  if (typeof e !== "number" || !Number.isFinite(e)) return null;
  if (e <= nowEpochSeconds) return null;
  return { u, e };
}
