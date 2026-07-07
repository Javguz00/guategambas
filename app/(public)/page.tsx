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
              Gambas Ornamentales para tu Gambario
            </h1>
            <p className="text-xl text-red-50 mb-8 leading-relaxed">
              Especialistas en Neocaridinas, Caridinas e insumos para gambarios y acuarios en Guatemala.
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

      {/* Products Preview Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-4">Productos Destacados</h2>
            <p className="text-lg text-gray-600">Gambas ornamentales e insumos para acuarios y gambarios</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { name: 'Neocaridina Bloody Mary', price: 'Q25.00', icon: '🦐' },
              { name: 'Caridina CRS', price: 'Q55.00', icon: '💎' },
              { name: 'Bacter AE', price: 'Q135.00', icon: '🧪' },
              { name: 'Fluval Stratum', price: 'Q230.00', icon: '⚙️' },
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
            <p className="text-lg text-gray-600">Experiencias de criadores y acuaristas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Kevin Morales',
                role: 'Criador de neocaridinas',
                text: 'Excelente coloración y adaptación. Las Bloody Mary llegaron en perfecto estado.',
                rating: 5,
              },
              {
                name: 'Andrea Castillo',
                role: 'Acuarista',
                text: 'Me ayudaron con insumos y parámetros para mis caridinas. Muy buena asesoría.',
                rating: 5,
              },
              {
                name: 'Luis Mejía',
                role: 'Hobby Shrimp Keeper',
                text: 'Los alimentos y bacterias sí se sienten en la salud de la colonia. Recomendados.',
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
          <h2 className="text-4xl font-bold text-white mb-6">¿Listo para mejorar tu gambario?</h2>
          <p className="text-xl text-red-50 mb-8">
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
