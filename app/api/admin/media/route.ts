import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorageAdapter } from '@/lib/storage';
import { guardApiSession } from "@/lib/security/api-policy";
import { inspectUpload } from '@/lib/security/upload-guard';

const MAX_SIZE = 10 * 1024 * 1024;

export async function GET() {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(media);
  } catch (error) {
    console.error('Media fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
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

    const media = await prisma.media.create({
      data: {
        name: file.name,
        url: uploaded.url,
        type: file.type,
        size: file.size,
        storageProvider: uploaded.provider,
        storageKey: uploaded.key,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
