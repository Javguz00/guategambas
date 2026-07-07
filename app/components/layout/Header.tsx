'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            🦐 Guategambas
          </Link>
          <nav className="flex gap-6">
            <Link href="/products" className="text-gray-600 hover:text-gray-900">
              Catálogo
            </Link>
            <Link href="/checkout" className="text-gray-600 hover:text-gray-900">
              Carrito
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
