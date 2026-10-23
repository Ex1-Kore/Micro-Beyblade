import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApiSession } from "@/lib/security/api-policy";
import { resolvePageContent } from "@/lib/content/page-input";
import { getCurrentUser } from "@/lib/auth";

// GET: ดึงข้อมูลหน้าเพจ (รองรับทั้ง ID และ Slug; ผู้ไม่ล็อกอินเห็นเฉพาะที่ publish แล้ว)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const page = await prisma.page.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const user = await getCurrentUser();
    if (!user && !page.isPublished) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

// PATCH: แก้ไขหน้าเพจ
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, slug, isPublished } = body;

    const resolved = resolvePageContent(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        title,
        slug,
        content: resolved.data.content,
        contentJson: resolved.data.contentJson ?? undefined,
        contentVer: resolved.data.contentVer ?? undefined,
        isPublished,
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

// DELETE: ลบหน้าเพจ
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.page.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
