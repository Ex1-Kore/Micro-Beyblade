import { NextRequest, NextResponse } from "next/server";
import { updateMenuItem, deleteMenuItem } from "@/lib/menu-data";
import { guardApiSession } from "@/lib/security/api-policy";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = await request.json();
    const item = await updateMenuItem(id, data);
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    await deleteMenuItem(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
