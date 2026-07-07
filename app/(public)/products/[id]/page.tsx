'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductGrid from '@/app/components/products/ProductGrid';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Loading from '@/app/components/ui/Loading';
import { addToCart } from '@/lib/cart';
import type { ApiResponse, Product } from '@/lib/types';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id]
  );

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const productResponse = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
        if (!productResponse.ok) {
          throw new Error('Producto no encontrado');
        }

        const productResult: ApiResponse<Product> = await productResponse.json();
        const nextProduct = productResult.data || null;
        setProduct(nextProduct);
        setQuantity(1);

        if (!nextProduct?.category?.slug) {
          setRelatedProducts([]);
          return;
        }

        const relatedResponse = await fetch(
          `/api/products?category=${encodeURIComponent(nextProduct.category.slug)}`,
          { cache: 'no-store' }
        );

        if (!relatedResponse.ok) {
          setRelatedProducts([]);
          return;
        }

        const relatedResult: ApiResponse<Product[]> = await relatedResponse.json();
        setRelatedProducts(
          (relatedResult.data || [])
            .filter((relatedProduct) => relatedProduct.id !== nextProduct.id)
            .slice(0, 4)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const clampQuantity = (nextQuantity: number) => {
    if (!product) {
      return 1;
    }

    return Math.min(Math.max(1, nextQuantity), product.stock);
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    addToCart(
      {
        productId: product.id,
        quantity,
        price: product.price,
      },
      { maxStock: product.stock }
    );

    setFeedback(`${quantity} unidad${quantity === 1 ? '' : 'es'} agregada${quantity === 1 ? '' : 's'} al carrito.`);
    window.setTimeout(() => setFeedback(null), 2500);
  };

  const handleRelatedAddToCart = (relatedProductId: string) => {
    const relatedProduct = relatedProducts.find((item) => item.id === relatedProductId);
    if (!relatedProduct) {
      return;
    }

    addToCart(
      {
        productId: relatedProduct.id,
        quantity: 1,
        price: relatedProduct.price,
      },
      { maxStock: relatedProduct.stock }
    );

    setFeedback(`${relatedProduct.name} se agregó al carrito.`);
    window.setTimeout(() => setFeedback(null), 2500);
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

  const imageUrl = product.image || '/placeholder-product.jpg';

  return (
    <div className="space-y-8">
      <nav className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
          </li>
          <li>&gt;</li>
          <li>
            <Link href="/products" className="hover:text-blue-600">
              Productos
            </Link>
          </li>
          {product.category && (
            <>
              <li>&gt;</li>
              <li>
                <Link
                  href={`/products?category=${encodeURIComponent(product.category.slug)}`}
                  className="hover:text-blue-600"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li>&gt;</li>
          <li className="font-medium text-gray-900">{product.name}</li>
        </ol>
      </nav>

      {feedback && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 rounded-2xl bg-white p-6 shadow md:grid-cols-2 md:p-8">
        <div className="relative min-h-[320px] overflow-hidden rounded-xl bg-gray-100">
          <Image src={imageUrl} alt={product.name} fill className="object-cover" priority />
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              {product.category && (
                <p className="mt-2 text-sm text-gray-500">Categoría: {product.category.name}</p>
              )}
            </div>
            {product.featured && <Badge variant="warning">Destacado</Badge>}
          </div>

          <p className="text-4xl font-bold text-blue-600">Q{product.price.toFixed(2)}</p>

          <div className="flex flex-wrap gap-3">
            <Badge variant={product.stock > 0 ? 'success' : 'danger'} size="lg">
              {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
            </Badge>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Descripción</h2>
            <p className="leading-7 text-gray-700">
              {product.description?.trim() || 'Este producto no tiene descripción disponible.'}
            </p>
          </div>

          {product.stock > 0 ? (
            <div className="space-y-4 rounded-xl border border-gray-200 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Cantidad</label>
                <div className="flex max-w-xs items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setQuantity((current) => clampQuantity(current - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(event) => setQuantity(clampQuantity(Number(event.target.value) || 1))}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setQuantity((current) => clampQuantity(current + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">Máximo disponible: {product.stock}</p>
              </div>

              <Button type="button" size="lg" className="w-full" onClick={handleAddToCart}>
                Agregar al carrito
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Este producto está agotado por el momento.
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Productos relacionados</h2>
            <p className="text-sm text-gray-500">Más opciones dentro de la misma categoría.</p>
          </div>
          <ProductGrid products={relatedProducts} onAddToCart={handleRelatedAddToCart} />
        </section>
      )}
    </div>
  );
}
