'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const menuGroups = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Projects', href: '/admin/projects' },
      { label: 'Staff Members', href: '/admin/staff' },
      { label: 'Pages', href: '/admin/pages' },
      { label: 'Categories', href: '/admin/categories' },
    ],
  },
  {
    title: 'Delivery',
    items: [
      { label: 'Media Library', href: '/admin/media' },
      { label: 'Navigation', href: '/admin/menu' },
      { label: 'Site Config', href: '/admin/configuration' },
      { label: 'Site Design', href: '/admin/design' },
      { label: 'Automation', href: '/admin/automation' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Modules', href: '/admin/modules' },
      { label: 'Templates', href: '/admin/templates' },
      { label: 'Marketplace', href: '/admin/marketplace' },
      { label: 'Bootstrap Status', href: '/admin/database' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    if (!confirm('Do you want to sign out?')) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="relative flex h-screen w-80 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#081120_0%,#0c1730_100%)] text-slate-100 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/18 to-transparent" />
        <div className="absolute -left-10 top-24 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-64 h-52 w-52 rounded-full bg-indigo-500/12 blur-3xl" />
      </div>

      <div className="relative border-b border-white/10 p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-500 text-xl font-black text-white shadow-[0_16px_30px_-18px_rgba(99,102,241,0.9)]">
            M
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight !text-white">MICRO CMS</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-300">
              PORTABLE HEADLESS CONTROL
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <nav className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-8 pb-6">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                  {group.title}
                </h3>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 ${
                          isActive
                            ? 'translate-x-1 bg-gradient-to-r from-cyan-400/90 via-indigo-500 to-violet-500 text-white shadow-[0_20px_35px_-20px_rgba(99,102,241,0.95)]'
                            : 'border border-transparent text-slate-300 hover:translate-x-1 hover:border-white/8 hover:bg-white/6 hover:text-slate-100'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>›</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="relative border-t border-white/10 px-6 py-6">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur !text-slate-200 shadow-[0_14px_24px_-18px_rgba(15,23,42,0.9)] transition-all hover:border-cyan-400/20 hover:bg-white/8 hover:!text-white"
          >
            <span className="!text-slate-200 text-xs font-black uppercase tracking-[0.22em] group-hover:!text-white">SIGN OUT</span>
            <span className="!text-slate-400 transition-transform group-hover:translate-x-1 group-hover:!text-white">→</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
