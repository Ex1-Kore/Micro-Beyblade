import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { checkLoginLimit, resetLoginLimit } from "@/lib/security/login-limit";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const limit = checkLoginLimit({ ip: clientIp(request), username: String(username) });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
        }
      );
    }

    const result = await login(username, password);
    resetLoginLimit(String(username));
    return NextResponse.json({ success: true, mustChangePassword: result.mustChangePassword });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}