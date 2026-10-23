'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type BootstrapStatus = {
  hasDatabaseUrl: boolean;
  canConnect: boolean;
  schemaReady: boolean;
  needsSetup: boolean;
  message: string;
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/setup')
      .then((res) => res.json())
      .then((data) => {
        if (data.bootstrap) {
          setBootstrap(data.bootstrap as BootstrapStatus);
        }
        if (data.needsSetup) {
          router.replace('/setup');
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      window.location.href = data.mustChangePassword ? '/admin/change-password' : '/admin';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-400">Checking setup status...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-center text-2xl font-bold">Login to Admin</h1>

          {bootstrap && (!bootstrap.hasDatabaseUrl || !bootstrap.canConnect || !bootstrap.schemaReady) && (
            <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-700">
              {bootstrap.message} <Link href="/setup" className="font-bold underline">Open setup</Link>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
              <input id="login-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" required autoComplete="username" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" required autoComplete="current-password" />
            </div>

            <button id="login-submit" type="submit" disabled={loading} className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
