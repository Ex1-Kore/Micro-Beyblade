import { NextRequest, NextResponse } from "next/server";
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/category-data";
import { guardApiSession } from "@/lib/security/api-policy";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function resolveId(context: RouteContext): Promise<string> {
  if (!context?.params) throw new Error("Missing params");
  if (context.params instanceof Promise) {
    const resolved = await context.params;
    return resolved.id;
  }
  return context.params.id;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const id = await resolveId(context);
  try {
    const category = await getCategoryById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const denied = await guardApiSession();
  if (denied) return denied;
  const id = await resolveId(context);
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await updateCategory(id, { name });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const denied = await guardApiSession();
  if (denied) return denied;
  const id = await resolveId(context);
  try {
    await deleteCategory(id);
    return NextResponse.json({ message: "Category deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}