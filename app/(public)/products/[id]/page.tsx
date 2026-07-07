'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductDetail from '@/app/components/products/ProductDetail';
import Loading from '@/app/components/ui/Loading';
import type { Product } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar producto');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = (productId: string, quantity: number) => {
    console.log('Added to cart:', productId, quantity);
    // TODO: Implementar lógica del carrito
  };

  if (loading) {
    return <Loading size="lg" message="Cargando producto..." />;
  }

  if (error || !product) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 text-lg">Error: {error || 'Producto no encontrado'}</p>
      </div>
    );
  }

  return <ProductDetail product={product} onAddToCart={handleAddToCart} />;
}
