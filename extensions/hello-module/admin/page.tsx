'use client';

import { useState } from 'react';

const HIGHLIGHTS = [
  'The whole package lives under extensions/hello-module.',
  'extension.json declares the module contract and its entrypoints.',
  'The admin page and API route are optional and referenced from the manifest.',
];

export default function HelloModuleAdminPage() {
  const [count, setCount] = useState(0);

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500">Sample Module</p>
      <h1 className="text-3xl font-black tracking-tight text-slate-950">Hello Module</h1>
      <p className="text-sm leading-7 text-slate-600">
        This page is a reference implementation. It renders inside the admin shell once the module is
        wired in, and it never mutates core files.
      </p>
      <ul className="space-y-2">
        {HIGHLIGHTS.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600"
          >
            {item}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setCount((value) => value + 1)}
        className="w-fit rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
      >
        Clicked {count} {count === 1 ? 'time' : 'times'}
      </button>
    </section>
  );
}
