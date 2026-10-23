import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-slate-900 hover:text-red-600 transition tracking-tight">
          BEYBLADE <span className="text-red-600">X</span>
        </Link>
        <nav className="flex gap-6">
          <Link href="/" className="text-slate-600 hover:text-red-600 transition font-semibold">
            Home
          </Link>
          <Link href="/projects" className="text-slate-600 hover:text-red-600 transition font-semibold">
            Blades
          </Link>
        </nav>
      </div>
    </header>
  );
}
