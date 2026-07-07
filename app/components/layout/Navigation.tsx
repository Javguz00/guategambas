'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive(href) ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <nav className="flex gap-4">
      <Link href="/products" className={linkClass('/products')}>
        Catálogo
      </Link>
      <Link href="/checkout" className={linkClass('/checkout')}>
        Carrito
      </Link>
      {/* Admin links estarán en admin layout */}
    </nav>
  );
}
