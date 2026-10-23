'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '@/components/admin/page-header';

const SUGGESTED_URL = 'https://micro-marketplace-iota.vercel.app';

export default function MarketplacePage() {
  const [marketplaceUrl, setMarketplaceUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fetchConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/site-config');
      const data = await res.json();
      setMarketplaceUrl(data.marketplaceUrl || '');
      setError(null);
    } catch {
      setError('ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchConfig);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSuccess(null);

    try {
      const res = await fetch('/api/site-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ marketplaceUrl: marketplaceUrl.trim() }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'เกิดข้อผิดพลาด');
      }

      const data = await res.json();
      setMarketplaceUrl(data.marketplaceUrl || '');
      setSuccess('บันทึกลิงก์ Marketplace เรียบร้อยแล้ว');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        moduleName="Marketplace"
        title="Marketplace Link"
        description="เชื่อมต่อเว็บ Marketplace สำหรับขายโมดูลและเทมเพลต"
        recordCount="Integration"
      />

      {(error || success) && (
        <div className="shrink-0 border-b border-white/30 px-8 py-3 bg-gradient-to-b from-white/10 to-transparent">
          {error && (
            <div className="rounded-xl border border-red-300/50 bg-red-50/80 backdrop-blur-sm px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-300/50 bg-emerald-50/80 backdrop-blur-sm px-4 py-3 text-sm text-emerald-700">
              ✅ {success}
            </div>
          )}
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-8 py-6">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
              <p className="text-sm text-slate-500">Loading marketplace settings...</p>
            </div>
          </div>
        ) : (
          <section className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur p-8 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.55)] max-w-2xl">
            <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-indigo-600">Marketplace Endpoint</h3>
            <p className="mb-6 text-sm leading-7 text-slate-600">
              ลิงก์นี้จะถูกใช้เป็นปลายทางของปุ่ม Marketplace บนหน้าเว็บสาธารณะ
              และเป็นค่าเริ่มต้นของ env <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_MARKETPLACE_URL</code>
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Marketplace URL</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  type="url"
                  inputMode="url"
                  value={marketplaceUrl}
                  placeholder={SUGGESTED_URL}
                  onChange={(e) => setMarketplaceUrl(e.target.value)}
                />
              </div>

              {!marketplaceUrl.trim() && (
                <button
                  type="button"
                  onClick={() => setMarketplaceUrl(SUGGESTED_URL)}
                  className="text-xs font-bold uppercase tracking-wide text-indigo-600 hover:text-indigo-700"
                >
                  ใช้ค่าเริ่มต้น: {SUGGESTED_URL}
                </button>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-sm uppercase tracking-wider"
                >
                  {saving ? 'บันทึก...' : 'บันทึกลิงก์'}
                </button>
                <a
                  href={marketplaceUrl.trim() || SUGGESTED_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-lg border-2 border-indigo-600 px-5 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition uppercase tracking-wider ${
                    marketplaceUrl.trim() ? '' : 'opacity-60'
                  }`}
                >
                  เปิด Marketplace ↗
                </a>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
