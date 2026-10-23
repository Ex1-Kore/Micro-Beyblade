import { NextRequest, NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';
import { getCurrentUser } from '@/lib/auth';
import { guardApiSession } from "@/lib/security/api-policy";
import { checkRateLimit } from '@/lib/security/rate-limit';
import { inspectUpload } from '@/lib/security/upload-guard';

const MAX_SIZE = 5 * 1024 * 1024;

const UPLOAD_RATE_LIMIT_MAX = nonNegativeIntEnv('UPLOAD_RATE_LIMIT_MAX', 30);
const UPLOAD_RATE_LIMIT_WINDOW_MS = nonNegativeIntEnv('UPLOAD_RATE_LIMIT_WINDOW_MS', 60_000);

function nonNegativeIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

export async function POST(request: NextRequest) {
  const denied = await guardApiSession();
  if (denied) return denied;

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const user = await getCurrentUser();
  const bucketKey = `upload:${user?.id ?? clientIp}`;

  const rate = checkRateLimit(bucketKey, {
    limit: UPLOAD_RATE_LIMIT_MAX,
    windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)),
        },
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const inspection = inspectUpload(file.type, buffer);
    if (!inspection.allowed) {
      return NextResponse.json({ error: inspection.error }, { status: 400 });
    }

    const adapter = getStorageAdapter();
    const uploaded = await adapter.upload({
      buffer,
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json({
      provider: uploaded.provider,
      key: uploaded.key,
      url: uploaded.url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
