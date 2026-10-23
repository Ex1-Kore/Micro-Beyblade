import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * HTTP boundary guard: route handlers for write operations and admin
 * namespace must call this first and return its response when non-null.
 * Public GET endpoints stay open (see public read filtering rules).
 */
export async function guardApiSession(): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
