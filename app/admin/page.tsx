import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/admin-dashboard-data';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAuth();
  const { projectCount, staffCount, pageCount, mediaCount, categoryCount, latestProjects, latestPages, featuredStaff } =
    await getAdminDashboardData();

  const stats = [
    { label: 'Projects', value: projectCount, href: '/admin/projects', tone: 'from-cyan-400 via-sky-500 to-indigo-500' },
    { label: 'Staff Members', value: staffCount, href: '/admin/staff', tone: 'from-indigo-500 via-violet-500 to-fuchsia-500' },
    { label: 'Pages', value: pageCount, href: '/admin/pages', tone: 'from-emerald-400 via-teal-500 to-cyan-500' },
    { label: 'Media Files', value: mediaCount, href: '/admin/media', tone: 'from-amber-400 via-orange-500 to-rose-500' },
    { label: 'Categories', value: categoryCount, href: '/admin/categories', tone: 'from-fuchsia-400 via-pink-500 to-rose-500' },
  ];

  const quickActions = [
    { label: 'Create Project', href: '/admin/projects' },
    { label: 'Add Staff Member', href: '/admin/staff' },
    { label: 'Edit Pages', href: '/admin/pages' },
    { label: 'Manage Menu', href: '/admin/menu' },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
      <header className="border-b border-white/30 bg-white/55 px-8 py-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-indigo-500">Headless CMS Dashboard</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">System Overview</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Your content engine is ready. Manage structured modules here and serve your consumer applications through stable APIs.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.55)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group overflow-hidden rounded-[1.75rem] border border-white/35 bg-white/70 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-[0_25px_65px_-28px_rgba(79,70,229,0.35)]"
              >
                <div className={`h-1.5 bg-gradient-to-r ${stat.tone}`} />
                <div className="p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{stat.value}</p>
                  <p className="mt-3 text-sm text-slate-500 transition-colors group-hover:text-slate-700">Open module</p>
                </div>
              </Link>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[2rem] border border-white/35 bg-white/72 p-6 shadow-[0_20px_55px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Recent Project Updates</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Projects module activity</h2>
                </div>
                <Link href="/admin/projects" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                  Open Projects
                </Link>
              </div>
              <div className="mt-6 space-y-3">
                {latestProjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-6 text-sm text-slate-500">
                    No projects yet. Use the Projects module to publish the first item.
                  </div>
                ) : (
                  latestProjects.map((project: { id: string; title: string; updatedAt: Date }) => (
                    <div key={project.id} className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/55 px-4 py-3 backdrop-blur">
                      <div>
                        <p className="font-bold text-slate-900">{project.title}</p>
                        <p className="text-xs text-slate-500">Updated {new Date(project.updatedAt).toLocaleString('en-US')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/35 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-slate-100 shadow-[0_25px_65px_-30px_rgba(15,23,42,0.65)]">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300/80">Content Routing</p>
              <h2 className="mt-2 text-2xl font-black text-white">How this CMS should be used</h2>
              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                <li>Manage content here, but render it in your consumer applications.</li>
                <li>Use Projects, Pages, Staff, Menu, and Site Config as reusable API-driven modules.</li>
                <li>Keep consumer-specific presentation logic outside this repository.</li>
              </ul>
              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Recommended flow</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  Admin edits content in this backend, the data is stored in Neon through Prisma, and each consuming app uses the API with its own routes and UI.
                </p>
              </div>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-white/35 bg-white/72 p-6 shadow-[0_20px_55px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Latest Pages</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Content entries</h2>
                </div>
                <Link href="/admin/pages" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                  Open Pages
                </Link>
              </div>
              <div className="mt-6 space-y-3">
                {latestPages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-6 text-sm text-slate-500">
                    No pages available yet.
                  </div>
                ) : (
                  latestPages.map((page: { id: string; title: string; slug: string; updatedAt: Date; isPublished: boolean }) => (
                    <div key={page.id} className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/55 px-4 py-3 backdrop-blur">
                      <div>
                        <p className="font-bold text-slate-900">{page.title}</p>
                        <p className="text-xs text-slate-500">/{page.slug} • Updated {new Date(page.updatedAt).toLocaleString('en-US')}</p>
                      </div>
                      <div className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${page.isPublished ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {page.isPublished ? 'Published' : 'Draft'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/35 bg-white/72 p-6 shadow-[0_20px_55px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Staff Directory</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Recently updated staff</h2>
                </div>
                <Link href="/admin/staff" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                  Open Staff
                </Link>
              </div>
              <div className="mt-6 space-y-3">
                {featuredStaff.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-6 text-sm text-slate-500">
                    No staff members added yet.
                  </div>
                ) : (
                  featuredStaff.map((staff: { id: string; name: string; role: string; featured: boolean }) => (
                    <div key={staff.id} className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/55 px-4 py-3 backdrop-blur">
                      <div>
                        <p className="font-bold text-slate-900">{staff.name}</p>
                        <p className="text-xs text-slate-500">{staff.role}</p>
                      </div>
                      {staff.featured && (
                        <div className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                          Featured
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
