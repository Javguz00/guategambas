'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-red-600 to-secondary py-20 md:py-32">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-white">
            <span className="inline-block text-4xl mb-4">🦐</span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Gambas Frescas de la Mejor Calidad
            </h1>
            <p className="text-xl text-red-50 mb-8 leading-relaxed">
              Directamente a tu puerta. Cultivadas en Guatemala con estándares internacionales. Frescas, deliciosas y disponibles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100" asChild>
                <Link href="/products">
                  Explorar Catálogo →
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link href="#contact">
                  Contactarnos
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative h-96 md:h-full min-h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl flex items-center justify-center text-9xl shadow-2xl">
              🦐
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-light">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">¿Por qué elegir Guategambas?</h2>
            <p className="text-lg text-gray-600">Características que nos hacen diferentes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '⭐',
                title: 'Calidad Premium',
                description: 'Seleccionamos las mejores gambas para garantizar frescura, sabor y textura óptimos.',
              },
              {
                icon: '🚚',
                title: 'Entrega Rápida',
                description: 'Envío directo a tu domicilio en las principales ciudades de Guatemala en 24-48h.',
              },
              {
                icon: '💰',
                title: 'Mejor Precio',
                description: 'Compra directa del productor sin intermediarios innecesarios. Calidad a precio justo.',
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

      {/* Products Preview Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">Productos Destacados</h2>
            <p className="text-lg text-gray-600">Explora nuestra variedad de gambas premium</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { name: 'Gambas Jumbo', price: 'Q89.99', icon: '🦐' },
              { name: 'Gambas Medianas', price: 'Q59.99', icon: '🦐' },
              { name: 'Gambas Pequeñas', price: 'Q39.99', icon: '🦐' },
              { name: 'Mix Gambas', price: 'Q69.99', icon: '🦐' },
            ].map((product, idx) => (
              <div key={idx} className="card hover:shadow-hover transition-all">
                <div className="h-40 bg-gradient-to-br from-secondary to-teal-100 rounded-lg flex items-center justify-center mb-4 text-6xl">
                  {product.icon}
                </div>
                <h3 className="font-semibold text-lg text-dark mb-2">{product.name}</h3>
                <p className="text-2xl font-bold text-primary mb-4">{product.price}</p>
                <Button size="sm" className="w-full">Ver detalles</Button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" asChild>
              <Link href="/products">Ver todos los productos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-light">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">Lo que dicen nuestros clientes</h2>
            <p className="text-lg text-gray-600">Experiencias reales de clientes satisfechos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'María González',
                role: 'Chef Profesional',
                text: '¡Excelente calidad! Las gambas llegan frescas y el servicio es impecable.',
                rating: 5,
              },
              {
                name: 'Carlos López',
                role: 'Restaurante El Patio',
                text: 'Proveedor confiable. Cumplen con los tiempos de entrega y la calidad es consistente.',
                rating: 5,
              },
              {
                name: 'Ana Rodríguez',
                role: 'Cliente Regular',
                text: 'Las mejores gambas que he probado en Guatemala. Altamente recomendado.',
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="card">
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">{testimonial.text}</p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-semibold text-dark">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-16 md:py-24 bg-gradient-to-r from-primary to-red-700">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-white mb-6">¿Listo para pedir?</h2>
          <p className="text-xl text-red-50 mb-8">
            Explora nuestro catálogo completo y realiza tu pedido. Primera compra con envío especial.
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-gray-100" asChild>
            <Link href="/products">Ir al Catálogo →</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
