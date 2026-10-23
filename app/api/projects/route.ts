import { NextResponse } from "next/server";
import { createProject, getAllProjectsPublic } from "@/lib/project-data";
import { guardApiSession } from "@/lib/security/api-policy";

export async function GET() {
  const projects = await getAllProjectsPublic();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const denied = await guardApiSession();
  if (denied) return denied;
  const body = await request.json();

  if (!body.title || !body.categoryId || !body.date) {
    return NextResponse.json(
      { error: "title, categoryId and date are required" },
      { status: 400 }
    );
  }

  const newProject = await createProject({
    title: String(body.title),
    description: String(body.description || ""),
    categoryId: String(body.categoryId),
    date: new Date(body.date),
    thumbnail: body.thumbnail ? String(body.thumbnail) : null,
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    videoLink: body.videoLink ? String(body.videoLink) : null,
    projectUrl: body.projectUrl ? String(body.projectUrl) : null,
    toolsUsed: Array.isArray(body.toolsUsed) ? body.toolsUsed : [],
  });

  return NextResponse.json(newProject, { status: 201 });
}
