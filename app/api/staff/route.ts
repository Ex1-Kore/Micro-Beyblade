import { NextResponse } from "next/server";
import {
  createStaffMember,
  getAllStaffMembers,
  type StaffMemberInput,
} from "@/modules/staff-member/lib/staff-member-data";
import { guardApiSession } from "@/lib/security/api-policy";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePayload(body: Record<string, unknown>): StaffMemberInput {
  if (!body.name || !body.slug || !body.role) {
    throw new Error("name, slug and role are required");
  }

  const repos = Array.isArray(body.repos)
    ? body.repos.map((repo: unknown) => {
        if (!isRecord(repo)) {
          throw new Error("Each repository must be an object");
        }

        return {
          name: String(repo.name || "Untitled Repo"),
          demoUrl: repo.demoUrl ? String(repo.demoUrl) : null,
          sourceUrl: repo.sourceUrl ? String(repo.sourceUrl) : null,
          landingUrl: repo.landingUrl ? String(repo.landingUrl) : null,
        };
      })
    : [];

  return {
    slug: String(body.slug).trim().toLowerCase(),
    name: String(body.name).trim(),
    role: String(body.role).trim(),
    email: body.email ? String(body.email).trim() : null,
    bio: body.bio ? String(body.bio) : "",
    avatarUrl: body.avatarUrl ? String(body.avatarUrl).trim() : null,
    accentColor: body.accentColor ? String(body.accentColor) : "blue",
    githubUrl: body.githubUrl ? String(body.githubUrl).trim() : null,
    projectUrl: body.projectUrl ? String(body.projectUrl).trim() : null,
    projectHighlights: Array.isArray(body.projectHighlights)
      ? body.projectHighlights.map((item) => String(item))
      : [],
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : Number(body.sortOrder ?? 0),
    featured: Boolean(body.featured),
    skills: Array.isArray(body.skills) ? body.skills.map((skill) => String(skill)) : [],
    repos,
  };
}

export async function GET() {
  try {
    const members = await getAllStaffMembers();
    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = validatePayload(body);
    const member = await createStaffMember(payload);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create staff member";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
