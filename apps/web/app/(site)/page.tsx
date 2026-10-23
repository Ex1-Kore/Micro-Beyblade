import Link from "next/link";
import { api } from "@/lib/api-client";
import type { Project, SiteConfig } from "@/lib/types";
import { ApiErrorState } from "@/components/api-error";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home",
};

const PRODUCT_LINES = [
  { name: "BX Line", desc: "Basic series", color: "from-blue-600 to-indigo-700", emoji: "🔵" },
  { name: "UX Line", desc: "Ultimate series", color: "from-purple-600 to-pink-600", emoji: "🟣" },
  { name: "CX Line", desc: "Custom series", color: "from-orange-500 to-red-600", emoji: "🟠" },
  { name: "Tools", desc: "Launchers & accessories", color: "from-emerald-500 to-teal-600", emoji: "🛠️" },
  { name: "X-Over Project", desc: "Crossover collabs", color: "from-slate-700 to-slate-900", emoji: "✖️" },
  { name: "IP Collaborations", desc: "Licensed editions", color: "from-yellow-500 to-amber-600", emoji: "🤝" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function HomePage() {
  let config: SiteConfig | null = null;
  let projects: Project[] = [];
  let error: unknown = null;

  try {
    const [cfg, list] = await Promise.all([api.siteConfig.get(), api.projects.list()]);
    config = cfg;
    projects = list;
  } catch (e) {
    error = e;
  }

  const siteName = config?.siteName || "Micro-Beyblade";
  const heroHeading = config?.heroHeading || "BEYBLADE X";
  const heroSubheading =
    config?.heroSubheading ||
    "Spin. Battle. Win. Explore the latest Beyblade X lineup and join the arena.";
  const heroBtnLabel = config?.heroBtnLabel || "Explore Blades";
  const primaryColor = config?.primaryColor || "#dc2626";

  const latest = projects.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#dc2626,transparent_40%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-red-400 mb-4">
            {siteName}
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            {heroHeading}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
            {heroSubheading}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/projects"
              className="rounded-xl px-8 py-4 font-bold text-white shadow-lg hover:shadow-xl transition transform hover:scale-105"
              style={{ backgroundColor: primaryColor }}
            >
              {heroBtnLabel}
            </Link>
            <Link
              href="/projects"
              className="rounded-xl border-2 border-white/30 px-8 py-4 font-bold text-white hover:bg-white/10 transition"
            >
              View All Blades
            </Link>
          </div>
        </div>
      </section>

      {error != null && (
        <div className="mx-auto max-w-6xl px-6 py-8">
          <ApiErrorState error={error} />
        </div>
      )}

      {/* Product Lines */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Product Lines</h2>
          <p className="text-slate-600 mb-10">Choose your series and build your perfect Beyblade.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_LINES.map((line) => (
              <Link
                key={line.name}
                href="/projects"
                className={`group rounded-2xl bg-gradient-to-br ${line.color} p-6 text-white shadow-md hover:shadow-xl transition transform hover:-translate-y-1`}
              >
                <div className="text-4xl mb-3">{line.emoji}</div>
                <h3 className="text-xl font-black mb-1">{line.name}</h3>
                <p className="text-sm opacity-90">{line.desc}</p>
                <span className="inline-block mt-4 text-xs font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blades */}
      {latest.length > 0 && (
        <section className="px-6 py-20 bg-slate-50">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Latest Blades</h2>
                <p className="text-slate-600">Fresh from the arena.</p>
              </div>
              <Link href="/projects" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                View all →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latest.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-white hover:border-indigo-600 hover:shadow-lg transition"
                >
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-5xl">⚔️</div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                        {project.category.name}
                      </span>
                      <time className="text-xs text-slate-400">{formatDate(project.date)}</time>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{project.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        View details →
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-20 bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Battle?</h2>
          <p className="text-lg text-indigo-100 mb-8">
            Browse the full Beyblade X catalog and find your next winning combo.
          </p>
          <Link
            href="/projects"
            className="inline-block rounded-xl bg-white px-8 py-4 font-bold text-indigo-600 shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Browse All Blades
          </Link>
        </div>
      </section>
    </div>
  );
}