'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import {
  CART_OPEN_EVENT,
  CART_UPDATED_EVENT,
  getCartItemCount,
  readCart,
  writeCart,
} from '@/lib/cart';
import { isVideoMediaUrl } from '@/lib/media';
import type { ApiResponse, CartItem, Product } from '@/lib/types';

interface DrawerItem extends CartItem {
  product?: Product | null;
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<DrawerItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(false);

  const refreshCart = async () => {
    const normalizedItems = readCart().items;
    setCartCount(getCartItemCount(normalizedItems));

    if (normalizedItems.length === 0) {
      setCartItems([]);
      return;
    }

    setLoadingCart(true);
    try {
      const responses = await Promise.all(
        normalizedItems.map(async (item) => {
          try {
            const response = await fetch(`/api/products/${item.productId}`, { cache: 'no-store' });
            if (!response.ok) {
              return null;
            }
            const result: ApiResponse<Product> = await response.json();
            return result.data || null;
          } catch {
            return null;
          }
        })
      );

      const productsById = new Map(
        responses
          .filter((product): product is Product => product !== null)
          .map((product) => [product.id, product])
      );

      setCartItems(
        normalizedItems.map((item) => ({
          ...item,
          product: productsById.get(item.productId) || null,
        }))
      );
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    refreshCart();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'cart') {
        refreshCart();
      }
    };
    const handleCartUpdate = () => {
      refreshCart();
    };
    const handleOpenCart = () => {
      refreshCart();
      setCartOpen(true);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    window.addEventListener(CART_OPEN_EVENT, handleOpenCart);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
      window.removeEventListener(CART_OPEN_EVENT, handleOpenCart);
    };
  }, []);

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const updateDrawerItemQuantity = (variantKey: string, nextQuantity: number) => {
    const normalizedQuantity = Math.max(1, Math.floor(nextQuantity));
    const nextItems = cartItems.map((item) => {
      const key = item.variantKey || item.productId;
      if (key !== variantKey) {
        return item;
      }

      const maxStock = item.product?.stock || Number.MAX_SAFE_INTEGER;
      return {
        ...item,
        quantity: Math.min(normalizedQuantity, maxStock),
      };
    });

    writeCart({
      items: nextItems.map((item) => ({
        productId: item.productId,
        variantKey: item.variantKey,
        grade: item.grade,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  };

  const removeDrawerItem = (variantKey: string) => {
    const nextItems = cartItems.filter((item) => (item.variantKey || item.productId) !== variantKey);
    writeCart({
      items: nextItems.map((item) => ({
        productId: item.productId,
        variantKey: item.variantKey,
        grade: item.grade,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  };

  return (
    <>
    <header className="sticky top-0 z-40 bg-white shadow-soft">
      <div className="container py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/photos/cliente/logo.jpg"
            alt="Logo Guategambas"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover border border-white/50 shadow-soft"
            priority
          />
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
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Abrir carrito"
          >
            <svg className="w-6 h-6 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1">
              {cartCount}
            </span>
          </button>

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
    {cartOpen && (
      <div className="fixed inset-0 z-50">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          onClick={() => setCartOpen(false)}
          aria-label="Cerrar carrito"
        />
        <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-dark">Carrito</h2>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="rounded p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Cerrar carrito"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loadingCart ? (
              <p className="text-sm text-gray-500">Cargando carrito...</p>
            ) : cartItems.length === 0 ? (
              <p className="text-sm text-gray-500">Tu carrito está vacío.</p>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const key = item.variantKey || item.productId;
                  const mediaUrl = item.product?.image || '/placeholder-product.svg';
                  const mediaIsVideo = isVideoMediaUrl(mediaUrl);

                  return (
                    <div key={key} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          {mediaIsVideo ? (
                            <video
                              src={mediaUrl}
                              className="h-full w-full object-cover"
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <Image
                              src={mediaUrl}
                              alt={item.product?.name || 'Producto'}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-dark">
                            {item.product?.name || `Producto ${item.productId.slice(0, 8)}`}
                          </p>
                          {item.grade && (
                            <p className="text-xs font-medium text-primary">
                              {item.grade === 'NORMAL' ? 'Grado normal (-15%)' : 'Grado alto'}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">Q{item.price.toFixed(2)} c/u</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="h-7 w-7 rounded border border-gray-300 text-sm"
                            onClick={() => updateDrawerItemQuantity(key, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            className="h-7 w-7 rounded border border-gray-300 text-sm"
                            onClick={() => updateDrawerItemQuantity(key, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-primary">
                            Q{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                            onClick={() => removeDrawerItem(key)}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-dark">Q{cartSubtotal.toFixed(2)}</span>
            </div>
            <Button className="w-full" asChild>
              <Link href="/checkout" onClick={() => setCartOpen(false)}>
                Ir al checkout
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    )}
    </>
  );
}
