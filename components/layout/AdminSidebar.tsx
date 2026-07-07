'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: '📊',
    },
    {
      href: '/admin/products',
      label: 'Productos',
      icon: '📦',
    },
    {
      href: '/admin/orders',
      label: 'Órdenes',
      icon: '📋',
    },
    {
      href: '/admin/inventory',
      label: 'Inventario',
      icon: '🏪',
    },
    {
      href: '/admin/media',
      label: 'Multimedia',
      icon: '🎬',
    },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 left-4 z-50 p-2 bg-primary text-white rounded-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed md:relative w-64 h-screen bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 ${
        isOpen ? 'left-0' : '-left-64 md:left-0'
      } md:translate-x-0 z-40`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <Image
              src="/photos/cliente/logo.jpg"
              alt="Logo Guategambas"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover border border-gray-200"
            />
            <span className="font-bold text-lg text-dark">Admin</span>
          </Link>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary rounded-lg transition-colors"
          >
            <span>🏠</span>
            <span>Volver al sitio</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 pt-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
