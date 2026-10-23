import { prisma } from "./prisma";
import type { Prisma, Project as ProjectModel } from "@prisma/client";

export type Project = ProjectModel & {
  category: {
    id: string;
    name: string;
  };
};

export const PUBLIC_PROJECT_SELECT = {
  id: true,
  title: true,
  description: true,
  categoryId: true,
  date: true,
  thumbnail: true,
  gallery: true,
  videoLink: true,
  projectUrl: true,
  toolsUsed: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.ProjectSelect;

export type PublicProject = Prisma.ProjectGetPayload<{
  select: typeof PUBLIC_PROJECT_SELECT;
}>;

export async function getAllProjectsPublic(): Promise<PublicProject[]> {
  return await prisma.project.findMany({
    select: PUBLIC_PROJECT_SELECT,
    orderBy: { date: "desc" },
  });
}

export async function getProjectByIdPublic(id: string): Promise<PublicProject | null> {
  return await prisma.project.findUnique({
    where: { id },
    select: PUBLIC_PROJECT_SELECT,
  });
}

export async function getAllProjects(): Promise<Project[]> {
  return await prisma.project.findMany({
    include: { category: true },
    orderBy: { date: "desc" },
  });
}

export async function getProjectById(id: string): Promise<Project | null> {
  return await prisma.project.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function createProject(data: Omit<ProjectModel, "id" | "createdAt" | "updatedAt">): Promise<Project> {
  return await prisma.project.create({
    data,
    include: { category: true },
  });
}

export async function updateProject(id: string, data: Partial<Omit<ProjectModel, "id" | "createdAt" | "updatedAt">>): Promise<Project> {
  return await prisma.project.update({
    where: { id },
    data,
    include: { category: true },
  });
}

export async function deleteProject(id: string): Promise<Project> {
  return await prisma.project.delete({
    where: { id },
    include: { category: true },
  });
}

