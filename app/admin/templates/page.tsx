'use client';

import { useEffect, useState } from 'react';

type TemplateTokens = {
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  layoutStyle?: string;
  mode?: string;
};

type TemplateManifest = {
  id: string;
  name: string;
  version: string;
  apiVersion: string;
  kind?: 'template' | 'theme';
  description?: string;
  author?: string;
  website?: string;
  previewImage?: string;
  tokens?: TemplateTokens;
};

type TemplateMeta = {
  installedAt: string;
  updatedAt: string;
  lastValidatedAt: string | null;
  source?: string | null;
};

type TemplateItem = {
  directoryName: string;
  status: 'ready' | 'invalid';
  errors: string[];
  manifest: TemplateManifest | null;
  meta: TemplateMeta | null;
};

type TemplatesResponse = {
  apiVersion: string;
  installMode: string;
  templatesDir: string;
  state: { activeTemplateId: string | null; updatedAt: string };
  items: TemplateItem[];
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Operation failed';
}

function formatDate(value?: string | null) {
  if (!value) return 'Not yet';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function TemplateAdmin() {
  const [data, setData] = useState<TemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installingUrl, setInstallingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates', { cache: 'no-store' });
      const payload = (await res.json()) as TemplatesResponse;
      if (!res.ok) throw new Error(payload && 'error' in payload ? String((payload as { error?: string }).error) : 'Failed to fetch templates');
      setData(payload);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleInstall(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setInstalling(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        body: formData,
      });
      const payload = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(payload.error || 'Install failed');
      setSuccess(payload.message || 'Template installed successfully.');
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setInstalling(false);
      e.target.value = '';
    }
  }

  async function handleInstallFromUrl() {
    const url = urlInput.trim();
    if (!url) return;

    setInstallingUrl(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const payload = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(payload.error || 'Install failed');
      setSuccess(payload.message || 'Template installed successfully.');
      setUrlInput('');
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setInstallingUrl(false);
    }
  }

  async function runAction(id: string, action: 'activate' | 'deactivate' | 'validate' | 'uninstall') {
    setPendingId(id);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = `/api/admin/templates/${encodeURIComponent(id)}`;
      const res = await fetch(endpoint, action === 'uninstall'
        ? { method: 'DELETE' }
        : {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error || 'Operation failed');

      const labels: Record<typeof action, string> = {
        activate: 'Template activated.',
        deactivate: 'Template deactivated.',
        validate: 'Template validated.',
        uninstall: 'Template uninstalled.',
      };

      setSuccess(labels[action]);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  const items = data?.items ?? [];
  const activeId = data?.state.activeTemplateId ?? null;
  const readyCount = items.filter((item) => item.status === 'ready').length;
  const canWrite = data?.installMode === 'filesystem-write';

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
      <header className="border-b border-white/30 bg-white/55 px-8 py-6 backdrop-blur-xl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-600">Public UI Packs</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Templates</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Install theme packs that style the public web app. A template publishes design tokens only — the headless web app reads the active template over the public API and applies the tokens as CSS variables.
            </p>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-3 xl:items-end">
            <div className="flex w-full items-center gap-2 rounded-2xl border border-white/50 bg-white/70 p-1.5 backdrop-blur">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleInstallFromUrl();
                }}
                placeholder="https://example.com/template.zip"
                disabled={installingUrl || !canWrite}
                className="w-full flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void handleInstallFromUrl()}
                disabled={installingUrl || !urlInput.trim() || !canWrite}
                className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {installingUrl ? 'Downloading...' : 'Install from URL'}
              </button>
            </div>
            <label className={`inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_35px_-22px_rgba(99,102,241,0.65)] transition-all hover:-translate-y-0.5 ${installing || !canWrite ? 'opacity-60' : ''}`}>
              <span>{installing ? 'Installing...' : 'Upload ZIP Package'}</span>
              <span>+</span>
              <input type="file" accept=".zip" onChange={handleInstall} disabled={installing || !canWrite} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[1.25rem] border border-white/35 bg-white/72 p-6 shadow-[0_20px_55px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">How templates work</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Tokens, not code</h2>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                <li>Templates install into `templates/`, never into the core app.</li>
                <li>Every package must include `template.json` and declare a matching API version.</li>
                <li>The active template is published at `GET /api/templates/active` for the public web app.</li>
                <li>Only design tokens leave the CMS — no paths, scripts, or executable code.</li>
              </ul>
            </article>

            <article className="rounded-[1.25rem] border border-white/35 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-slate-100 shadow-[0_25px_65px_-30px_rgba(15,23,42,0.65)]">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300/80">Registry status</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Ready</p>
                  <p className="mt-2 text-3xl font-black text-white">{readyCount}</p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Active</p>
                  <p className="mt-2 text-sm font-bold text-slate-100">{activeId ?? 'None'}</p>
                </div>
                <div className="rounded-[1rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Install mode</p>
                  <p className="mt-2 text-sm font-bold text-slate-100">{data?.installMode ?? 'loading...'}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-300">
                Registry path: <span className="font-mono text-slate-100">{data?.templatesDir ?? 'loading...'}</span>
              </p>
            </article>
          </section>

          {(error || success) && (
            <div className={`rounded-xl px-5 py-4 text-sm font-bold ${error ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error ?? success}
            </div>
          )}

          <section className="rounded-[1.25rem] border border-white/35 bg-white/72 p-6 shadow-[0_20px_55px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Installed packages</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Template registry</h2>
              </div>
            </div>

            {loading && <p className="mt-6 text-sm text-slate-500">Loading templates...</p>}

            {!loading && items.length === 0 && (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white/50 px-4 py-6 text-sm text-slate-500">
                No templates are installed yet.
              </div>
            )}

            <div className="mt-6 space-y-3">
              {items.map((item) => {
                const id = item.manifest?.id ?? item.directoryName;
                const disabled = pendingId === id;
                const isActive = activeId !== null && item.manifest?.id === activeId;
                const tokens = item.manifest?.tokens ?? {};

                return (
                  <div key={item.directoryName} className="rounded-[1rem] border border-white/30 bg-white/55 p-4 backdrop-blur">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{item.manifest?.name ?? item.directoryName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.manifest?.id ?? item.directoryName} • v{item.manifest?.version ?? 'unknown'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.manifest?.kind && (
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                            {item.manifest.kind}
                          </span>
                        )}
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${item.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.status === 'ready' ? 'Ready' : 'Needs attention'}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-700">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    {item.manifest?.description && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.manifest.description}</p>
                    )}

                    {Object.keys(tokens).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(tokens).map(([key, value]) => (
                          <span key={key} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-bold text-slate-600">
                            {typeof value === 'string' && /^#/.test(value) && (
                              <span className="inline-block h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: value }} />
                            )}
                            {key}={String(value)}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.meta?.source && (
                      <div className="mt-3 text-xs text-slate-500">
                        Source: <span className="font-mono text-slate-700">{item.meta.source}</span>
                      </div>
                    )}

                    <div className="mt-4 grid gap-3 text-xs text-slate-500 md:grid-cols-3">
                      <div>
                        <p className="font-bold uppercase tracking-[0.18em] text-slate-400">Installed</p>
                        <p className="mt-1 text-sm text-slate-700">{formatDate(item.meta?.installedAt)}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-[0.18em] text-slate-400">Updated</p>
                        <p className="mt-1 text-sm text-slate-700">{formatDate(item.meta?.updatedAt)}</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-[0.18em] text-slate-400">Validated</p>
                        <p className="mt-1 text-sm text-slate-700">{formatDate(item.meta?.lastValidatedAt)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={disabled || item.status !== 'ready' || isActive}
                        onClick={() => void runAction(id, 'activate')}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Activate
                      </button>
                      <button
                        type="button"
                        disabled={disabled || !isActive}
                        onClick={() => void runAction(id, 'deactivate')}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => void runAction(id, 'validate')}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Validate
                      </button>
                      <button
                        type="button"
                        disabled={disabled || !canWrite}
                        onClick={() => void runAction(id, 'uninstall')}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Uninstall
                      </button>
                    </div>

                    {item.errors.length > 0 && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {item.errors.join(' ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
