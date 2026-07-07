'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/products', label: 'Catálogo' },
    { href: '#contact', label: 'Contacto' },
    { href: '#about', label: 'Nosotros' },
  ];

  return (
    <nav className={className}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`pb-1 transition-colors ${
              isActive
                ? 'border-b-2 border-primary text-primary font-semibold'
                : 'text-gray-600 hover:text-primary'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
