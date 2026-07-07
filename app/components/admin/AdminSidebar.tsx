'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">👨‍💼</span>
          <span>Admin</span>
        </Link>
      </div>

      <nav className="px-4 py-6 space-y-2">
        <NavLink
          href="/admin/dashboard"
          label="Dashboard"
          icon="📊"
          isActive={isActive('/admin/dashboard')}
        />
        <NavLink
          href="/admin/products"
          label="Productos"
          icon="🦐"
          isActive={isActive('/admin/products')}
        />
        <NavLink
          href="/admin/orders"
          label="Órdenes"
          icon="📦"
          isActive={isActive('/admin/orders')}
        />
        <NavLink
          href="/admin/categories"
          label="Categorías"
          icon="📂"
          isActive={isActive('/admin/categories')}
        />
        <div className="border-t border-gray-700 pt-4 mt-4">
          <NavLink
            href="/api/auth/logout"
            label="Salir"
            icon="🚪"
            isActive={false}
            onClick={() => {
              // Handle logout
              fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                window.location.href = '/login';
              });
            }}
          />
        </div>
      </nav>
    </aside>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavLink({ href, label, icon, isActive, onClick }: NavLinkProps) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
      </div>
    </Link>
  );
}
