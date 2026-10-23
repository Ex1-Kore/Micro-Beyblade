import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApiSession } from "@/lib/security/api-policy";
import { getCurrentUser } from "@/lib/auth";
import { resolvePageContent } from "@/lib/content/page-input";

// GET: ดึงหน้าเพจ (ผู้ไม่ล็อกอินเห็นเฉพาะที่ publish แล้ว)
export async function GET() {
  try {
    const user = await getCurrentUser();
    const pages = await prisma.page.findMany({
      orderBy: { createdAt: 'desc' },
      ...(user ? {} : { where: { isPublished: true } }),
    });
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

// POST: สร้างหน้าเพจใหม่
export async function POST(req: Request) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { title, slug, isPublished } = body;

    const resolved = resolvePageContent(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content: resolved.data.content,
        contentJson: resolved.data.contentJson ?? undefined,
        contentVer: resolved.data.contentVer ?? 1,
        isPublished: isPublished ?? true,
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
