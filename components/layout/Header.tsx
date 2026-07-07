'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-soft">
      <div className="container py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🦐</span>
          </div>
          <span className="hidden sm:inline font-bold text-xl text-dark">Guategambas</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/products" className="text-dark hover:text-primary transition-colors font-medium">
            Productos
          </Link>
          <Link href="#contact" className="text-dark hover:text-primary transition-colors font-medium">
            Contacto
          </Link>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <Link href="/checkout" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">0</span>
          </Link>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin/dashboard">Admin</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-gray-50 border-t border-gray-200 py-4">
          <div className="container flex flex-col gap-3">
            <Link href="/products" className="px-4 py-2 text-dark hover:bg-gray-100 rounded transition-colors">
              Productos
            </Link>
            <Link href="#contact" className="px-4 py-2 text-dark hover:bg-gray-100 rounded transition-colors">
              Contacto
            </Link>
            <hr className="my-2" />
            <Button variant="outline" size="sm" className="w-full">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button size="sm" className="w-full">
              <Link href="/admin/dashboard">Admin</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
