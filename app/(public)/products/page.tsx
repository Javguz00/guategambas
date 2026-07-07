'use client';

import { useEffect, useState } from 'react';
import ProductGrid from '@/app/components/products/ProductGrid';
import Loading from '@/app/components/ui/Loading';
import type { Product } from '@/lib/types';

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (productId: string) => {
    console.log('Added to cart:', productId);
    // TODO: Implementar lógica del carrito
  };

  if (loading) {
    return <Loading size="lg" message="Cargando productos..." />;
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Catálogo de Gambas</h1>
      <ProductGrid products={products} onAddToCart={handleAddToCart} />
    </div>
  );
}
