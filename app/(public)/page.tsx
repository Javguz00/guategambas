'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import type { ApiResponse, Product } from '@/lib/types';

interface HeroMediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  title?: string | null;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [heroItems, setHeroItems] = useState<HeroMediaItem[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroImageSrc, setHeroImageSrc] = useState('/placeholder-product.svg');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsResponse, heroResponse] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/media/hero', { cache: 'no-store' }),
        ]);

        if (productsResponse.ok) {
          const productsResult: ApiResponse<Product[]> = await productsResponse.json();
          const products = productsResult.data || [];
          setFeaturedProducts(products.filter((product) => product.featured).slice(0, 4));
        }

        if (heroResponse.ok) {
          const heroResult: ApiResponse<HeroMediaItem[]> = await heroResponse.json();
          const media = heroResult.data || [];
          setHeroItems(media);
          if (media.length > 0 && media[0].mimeType.startsWith('image/')) {
            setHeroImageSrc(media[0].url);
          }
        }
      } catch {
        setFeaturedProducts([]);
        setHeroItems([]);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (heroItems.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroItems.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [heroItems.length]);

  useEffect(() => {
    const activeItem = heroItems[heroIndex];
    if (activeItem && activeItem.mimeType.startsWith('image/')) {
      setHeroImageSrc(activeItem.url);
    }
  }, [heroIndex, heroItems]);

  const currentHero = useMemo(() => heroItems[heroIndex] || null, [heroItems, heroIndex]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-sky-700 to-secondary py-20 md:py-32">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-white">
            <div className="mb-4">
              <Image
                src="/photos/cliente/logo.jpg"
                alt="Logo Guategambas"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover border border-white/40 shadow-lg"
                priority
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Gambas Ornamentales para tu Gambario
            </h1>
            <p className="text-xl text-sky-50 mb-8 leading-relaxed">
              Especialistas en Neocaridinas, Caridinas e insumos para gambarios y acuarios en Guatemala.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100" asChild>
                <Link href="/products">Explorar Catálogo →</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link href="#contact">Contactarnos</Link>
              </Button>
            </div>
          </div>

          <div className="relative h-96 md:h-full min-h-96 overflow-hidden rounded-2xl shadow-2xl bg-black/10">
            {currentHero ? (
              currentHero.mimeType.startsWith('video/') ? (
                <video
                  key={currentHero.id}
                  src={currentHero.url}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              ) : (
                <img
                  src={heroImageSrc}
                  alt={currentHero.title || 'Hero multimedia'}
                  className="h-full w-full object-cover"
                  onError={() => setHeroImageSrc('/placeholder-product.svg')}
                />
              )
            ) : (
              <img
                src="/placeholder-product.svg"
                alt="Hero multimedia pendiente"
                className="h-full w-full object-cover"
              />
            )}

            {currentHero?.title && (
              <div className="absolute inset-x-0 bottom-0 bg-black/45 px-4 py-3 text-sm text-white">
                {currentHero.title}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-light">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">¿Por qué elegir Guategambas?</h2>
            <p className="text-lg text-gray-600">Características que nos hacen diferentes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🧬',
                title: 'Genética Seleccionada',
                description: 'Líneas de Neocaridina y Caridina cuidadas para color, salud y reproducción estable.',
              },
              {
                icon: '🧪',
                title: 'Insumos Especializados',
                description: 'Bacterias, alimentos y minerales para mantener parámetros ideales en tu gambario.',
              },
              {
                icon: '📦',
                title: 'Envíos Nacionales',
                description: 'Coordinamos envíos a toda Guatemala con atención personalizada por WhatsApp.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="card text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-dark mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">Productos Destacados</h2>
            <p className="text-lg text-gray-600">Gambas ornamentales e insumos para acuarios y gambarios</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <div key={product.id} className="card hover:shadow-hover transition-all">
                  <div className="h-40 rounded-lg overflow-hidden mb-4 bg-gray-100">
                    <img
                      src={product.image || '/placeholder-product.svg'}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = '/placeholder-product.svg';
                      }}
                    />
                  </div>
                  <h3 className="font-semibold text-lg text-dark mb-2">{product.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-4">Q{product.price.toFixed(2)}</p>
                  <Button size="sm" className="w-full" asChild>
                    <Link href={`/products/${product.id}`}>Ver detalles</Link>
                  </Button>
                </div>
              ))
            ) : (
              [1, 2, 3, 4].map((item) => (
                <div key={item} className="card hover:shadow-hover transition-all">
                  <div className="h-40 rounded-lg overflow-hidden mb-4 bg-gray-100">
                    <img src="/placeholder-product.svg" alt="Producto pendiente" className="h-full w-full object-cover" />
                  </div>
                  <h3 className="font-semibold text-lg text-dark mb-2">Producto destacado</h3>
                  <p className="text-2xl font-bold text-primary mb-4">Q0.00</p>
                  <Button size="sm" className="w-full" asChild>
                    <Link href="/products">Ver catálogo</Link>
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="text-center">
            <Button size="lg" asChild>
              <Link href="/products">Ver todos los productos</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 md:py-24 bg-gradient-to-r from-primary to-sky-800">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-white mb-6">¿Listo para mejorar tu gambario?</h2>
          <p className="text-xl text-sky-50 mb-8">
            Revisa neocaridinas, caridinas y todos los insumos para mantener un acuario sano y estable.
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-gray-100" asChild>
            <Link href="/products">Ir al Catálogo →</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
