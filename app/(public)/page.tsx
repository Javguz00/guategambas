'use client';

import Link from 'next/link';
import Button from '@/app/components/ui/Button';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🦐 Bienvenido a Guategambas
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Gambas frescas de la mejor calidad, directamente a tu puerta. Cultivadas en Guatemala con estándares internacionales.
          </p>
          <div className="flex gap-4">
            <Link href="/products">
              <Button size="lg" variant="primary">
                Ver Catálogo
              </Button>
            </Link>
            <Link href="/checkout">
              <Button size="lg" variant="secondary">
                Ver Carrito
              </Button>
            </Link>
          </div>
        </div>
        <div className="bg-blue-100 rounded-lg h-96 flex items-center justify-center">
          <p className="text-center text-gray-600 text-lg">
            [Imagen de gambas]
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-gray-900">Calidad Premium</h3>
          <p className="text-gray-600">Seleccionamos las mejores gambas para garantizar frescura y sabor.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-gray-900">Entrega Rápida</h3>
          <p className="text-gray-600">Envío directo a tu domicilio en las principales ciudades de Guatemala.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-gray-900">Mejor Precio</h3>
          <p className="text-gray-600">Compra directa del productor sin intermediarios innecesarios.</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white p-8 rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">¿Listo para pedir?</h2>
        <p className="text-lg mb-6 opacity-90">Explora nuestro catálogo y realiza tu pedido ahora.</p>
        <Link href="/products">
          <Button size="lg" variant="primary">
            Ir al Catálogo
          </Button>
        </Link>
      </div>
    </div>
  );
}
