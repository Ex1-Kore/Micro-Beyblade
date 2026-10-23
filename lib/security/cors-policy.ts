export function parseAllowedOrigins(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim().replace(/\/$/, ""))
    .filter((part) => part.length > 0 && part !== "*");
}

export function resolveCorsOrigin(
  requestOrigin: string | null | undefined,
  allowed: string[]
): string | null {
  if (!requestOrigin) return null;
  const origin = requestOrigin.replace(/\/$/, "");
  if (origin.length === 0) return null;
  return allowed.includes(origin) ? origin : null;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}
