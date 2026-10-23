import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "./security/session";

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not configured — cannot issue a signed session"
    );
  }
  return secret;
}

export function createSessionToken(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  return signSessionToken(userId, getSessionSecret(), expiresAt);
}

export async function setSessionCookies(
  userId: string,
  mustChangePassword: boolean
) {
  const cookieStore = await cookies();
  cookieStore.set("session", createSessionToken(userId), sessionCookieOptions);
  if (mustChangePassword) {
    cookieStore.set("must_change_pw", "1", sessionCookieOptions);
  } else {
    cookieStore.delete({ name: "must_change_pw", path: "/" });
  }
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  await setSessionCookies(user.id, user.mustChangePassword);

  return { mustChangePassword: user.mustChangePassword };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: "session", path: "/" });
  cookieStore.delete({ name: "must_change_pw", path: "/" });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = verifySessionToken(token, process.env.SESSION_SECRET?.trim());
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.u } });
  if (!user) return null;
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
