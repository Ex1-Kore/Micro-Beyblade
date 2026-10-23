import { NextRequest, NextResponse } from "next/server";
import { getAllMenuItems, createMenuItem } from "@/lib/menu-data";
import { guardApiSession } from "@/lib/security/api-policy";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const items = await getAllMenuItems(user ? {} : { visibleOnly: true });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { label, url, isExternal, showInNavbar, showInSidebar, showInFooter } = await request.json();
    if (!label || !url) return NextResponse.json({ error: "label and url required" }, { status: 400 });
    const item = await createMenuItem({
      label,
      url,
      isExternal,
      showInNavbar: showInNavbar ?? true,
      showInSidebar: showInSidebar ?? false,
      showInFooter: showInFooter ?? false,
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
