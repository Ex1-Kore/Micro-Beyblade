import { prisma } from "./prisma";

export async function getAdminDashboardData() {
  const [projectCount, staffCount, pageCount, mediaCount, categoryCount, latestProjects, latestPages, featuredStaff] =
    await Promise.all([
      prisma.project.count(),
      prisma.staffMember.count(),
      prisma.page.count(),
      prisma.media.count(),
      prisma.category.count(),
      prisma.project.findMany({
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.page.findMany({
        select: { id: true, title: true, slug: true, updatedAt: true, isPublished: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.staffMember.findMany({
        select: { id: true, name: true, role: true, featured: true },
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
        take: 5,
      }),
    ]);

  return {
    projectCount,
    staffCount,
    pageCount,
    mediaCount,
    categoryCount,
    latestProjects,
    latestPages,
    featuredStaff,
  };
}
