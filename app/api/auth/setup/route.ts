import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getDatabaseBootstrapStatus } from '@/lib/system/database-status';
import { setSessionCookies } from '@/lib/auth';

export async function GET() {
  const status = await getDatabaseBootstrapStatus();
  return NextResponse.json({
    needsSetup: status.needsSetup,
    bootstrap: status,
  });
}

export async function POST(request: NextRequest) {
  try {
    const status = await getDatabaseBootstrapStatus();

    if (!status.hasDatabaseUrl || !status.canConnect || !status.schemaReady) {
      return NextResponse.json({ error: status.message }, { status: 503 });
    }

    if (!status.needsSetup) {
      return NextResponse.json(
        { error: 'Setup already completed. Please login.' },
        { status: 403 },
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'superadmin',
        mustChangePassword: true,
      },
    });

    await setSessionCookies(user.id, true);

    return NextResponse.json({ success: true, mustChangePassword: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Setup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
