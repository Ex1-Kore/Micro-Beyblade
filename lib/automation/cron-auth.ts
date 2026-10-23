import { timingSafeEqual } from "node:crypto";

export interface HeaderSource {
  get(name: string): string | null | undefined;
}

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Fail-closed: when AUTOMATION_CRON_SECRET is not configured the endpoint
 * must reject every request instead of falling open.
 */
export function isCronAuthorized(
  headers: HeaderSource,
  secret: string | undefined | null
): boolean {
  const expected = secret?.trim();
  if (!expected) return false;

  const bearer = headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = headers.get("x-automation-token") || bearer || "";
  if (!provided) return false;

  return safeEqualString(provided, expected);
}
