import { api } from "@/lib/api-client";
import type { Project } from "@/lib/types";
import { ApiErrorState } from "@/components/api-error";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ProjectsPage() {
  let projects: Project[] | null = null;
  let error: unknown = null;

  try {
    projects = await api.projects.list();
  } catch (e) {
    error = e;
  }

  return (
    <div>
      <section className="px-6 py-16 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-200">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-black text-slate-900 mb-4">Projects</h1>
          <p className="text-xl text-slate-600">Portfolio of projects managed through THOTH headless CMS.</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          {error != null && <ApiErrorState error={error} />}

          {projects && projects.length === 0 && (
            <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-slate-600 font-semibold">ยังไม่มีโครงการในระบบ</p>
              <p className="text-slate-500 text-sm mt-2">เพิ่มโครงการผ่าน CMS แล้วจะแสดงที่นี่</p>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
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
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-5xl">📁</div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                        {project.category.name}
                      </span>
                      <time className="text-xs text-slate-400">{formatDate(project.date)}</time>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">{project.title}</h2>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{project.description}</p>

                    {project.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.toolsUsed.map((tool) => (
                          <span key={tool} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          View project →
                        </a>
                      )}
                      {project.videoLink && (
                        <a
                          href={project.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          Video →
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
