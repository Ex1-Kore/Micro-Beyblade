import { NextResponse } from "next/server";
import { getProjectByIdPublic, updateProject, deleteProject } from "@/lib/project-data";
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

export async function GET(_request: Request, context: RouteContext) {
  const id = await resolveId(context);
  const project = await getProjectByIdPublic(id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await guardApiSession();
  if (denied) return denied;
  const id = await resolveId(context);
  try {
    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await guardApiSession();
  if (denied) return denied;
  const id = await resolveId(context);
  const body = await request.json();

  try {
    const updated = await updateProject(id, {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Operation failed" }, { status: 400 });
  }
}
