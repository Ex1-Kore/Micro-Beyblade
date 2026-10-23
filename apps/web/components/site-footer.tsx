export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="text-2xl font-black tracking-tight">
            BEYBLADE <span className="text-red-500">X</span>
          </div>
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/beyblade_asia/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition text-sm font-semibold"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition text-sm font-semibold"
            >
              Facebook
            </a>
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition text-sm font-semibold"
            >
              YouTube
            </a>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © 2026 Micro-Beyblade. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs">
            Powered by Microtronic{" "}
            <a
              href="https://microtronic.biz/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              © 2026 Microtronic Co., Ltd.
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}