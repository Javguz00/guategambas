import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout';
import { getSession } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.role !== 'ADMIN' && session.role !== 'OWNER')) {
    redirect('/login');
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="ml-64 min-h-screen flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
