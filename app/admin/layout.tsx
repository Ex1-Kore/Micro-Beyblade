import { requireAuth } from '@/lib/auth';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="admin-shell flex h-screen w-screen overflow-hidden bg-white">
      <AdminSidebar />
      <div className="admin-main relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex min-h-0 flex-1 flex-col bg-white">{children}</div>
      </div>
    </div>
  );
}
