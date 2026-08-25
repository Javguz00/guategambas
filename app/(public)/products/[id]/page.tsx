'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductGrid from '@/components/products/ProductGrid';
import { Button, Input, Loading } from '@/components/ui';
import { addToCart, openCartDrawer } from '@/lib/cart';
import { getProductMediaList, isVideoMediaUrl } from '@/lib/media';
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
  const [grade, setGrade] = useState<'ALTO' | 'NORMAL'>('ALTO');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [imageSrc, setImageSrc] = useState('/placeholder-product.svg');
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
        const media = nextProduct ? getProductMediaList(nextProduct) : [];
        setActiveMediaIndex(0);
        setImageSrc(media[0] || '/placeholder-product.svg');
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

    const currentCategorySlug =
      typeof product.category === 'string' ? '' : (product.category?.slug || '');
    const hasGrade = currentCategorySlug === 'neocaridinas' || currentCategorySlug === 'caridinas';
    const currentPrice =
      hasGrade && grade === 'NORMAL'
        ? Number((product.price * 0.85).toFixed(2))
        : product.price;

    addToCart(
      {
        productId: product.id,
        variantKey: `${product.id}:${hasGrade ? grade : 'STD'}`,
        grade: hasGrade ? grade : undefined,
        quantity,
        price: currentPrice,
      },
      { maxStock: product.stock }
    );

    setFeedback(`${quantity} unidad${quantity === 1 ? '' : 'es'} agregada${quantity === 1 ? '' : 's'} al carrito.`);
    openCartDrawer();
    window.setTimeout(() => setFeedback(null), 2500);
  };

  if (loading) {
    return <Loading fullScreen text="Cargando producto..." />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold mb-4">Error: {error || 'Producto no encontrado'}</p>
          <Button asChild>
            <Link href="/products">Volver a productos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const imageUrl = imageSrc || '/placeholder-product.svg';
  const isVideo = isVideoMediaUrl(imageUrl);
  const mediaList = getProductMediaList(product);
  const isLowStock = product.stock > 0 && product.stock < 5;
  const categorySlug =
    typeof product.category === 'string' ? '' : (product.category?.slug || '');
  const supportsGrade = categorySlug === 'neocaridinas' || categorySlug === 'caridinas';
  const unitPrice =
    supportsGrade && grade === 'NORMAL'
      ? Number((product.price * 0.85).toFixed(2))
      : product.price;

  return (
    <div className="space-y-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/products" className="hover:text-primary transition-colors">
              Productos
            </Link>
          </li>
          {product.category && (
            <>
              <li>/</li>
              <li>
                <Link
                  href={`/products?category=${encodeURIComponent(product.category.slug)}`}
                  className="hover:text-primary transition-colors"
                >
                  {typeof product.category === 'string' ? product.category : product.category.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="font-medium text-dark">{product.name}</li>
        </ol>
      </nav>

      {/* Feedback Alert */}
      {feedback && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-soft">
          ✓ {feedback}
        </div>
      )}

      {/* Product Detail */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100 shadow-card">
            {isVideo ? (
              <video
                src={imageUrl}
                className="h-full w-full object-cover"
                controls
                muted
                loop
                playsInline
              />
            ) : (
              <Image 
                src={imageUrl} 
                alt={product.name} 
                fill 
                className="object-cover hover:scale-105 transition-transform duration-300"
                priority 
                onError={() => setImageSrc('/placeholder-product.svg')}
              />
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">AGOTADO</span>
              </div>
            )}
          </div>

          {mediaList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {mediaList.map((mediaUrl, index) => (
                <button
                  key={mediaUrl + index}
                  type="button"
                  onClick={() => {
                    setActiveMediaIndex(index);
                    setImageSrc(mediaUrl);
                  }}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-gray-100 transition-colors ${
                    index === activeMediaIndex ? 'border-primary' : 'border-transparent hover:border-gray-300'
                  }`}
                  aria-label={`Ver imagen ${index + 1}`}
                >
                  {isVideoMediaUrl(mediaUrl) ? (
                    <video src={mediaUrl} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <Image src={mediaUrl} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            {product.category && (
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                {typeof product.category === 'string' ? product.category : product.category.name}
              </p>
            )}
            {product.brand && (
              <p className="text-sm font-semibold text-gray-500">{product.brand}</p>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold text-dark">
              {product.name}
            </h1>
            {product.featured && (
              <div className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                ⭐ Destacado
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Precio</p>
            <p className="text-4xl font-bold text-primary">
              Q{unitPrice.toFixed(2)}
            </p>
            {supportsGrade && grade === 'NORMAL' && (
              <p className="text-sm text-gray-500 line-through">
                Precio grado alto: Q{product.price.toFixed(2)}
              </p>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {product.stock === 0 ? (
              <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold text-sm">
                ✗ Agotado
              </div>
            ) : isLowStock ? (
              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-semibold text-sm">
                ⚠ Solo {product.stock} disponibles
              </div>
            ) : (
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm">
                ✓ En stock
              </div>
            )}
          </div>

          {/* Description */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-dark mb-3">Descripción</h2>
            <p className="text-gray-700 leading-relaxed text-sm lg:text-base">
              {product.description?.trim() || 'Este producto no tiene descripción disponible.'}
            </p>
          </div>

          {/* Add to Cart Section */}
          {product.stock > 0 ? (
            <div className="border-t pt-6 space-y-4">
              {supportsGrade && (
                <div>
                  <label className="block text-sm font-semibold text-dark mb-3">Grado:</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setGrade('ALTO')}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                        grade === 'ALTO'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Grado alto (Q{product.price.toFixed(2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrade('NORMAL')}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                        grade === 'NORMAL'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Grado normal (-15%) Q{(product.price * 0.85).toFixed(2)}
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-semibold text-dark mb-3">Cantidad:</label>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity((current) => clampQuantity(current - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(event) => setQuantity(clampQuantity(Number(event.target.value) || 1))}
                    className="w-16 text-center"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity((current) => clampQuantity(current + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleAddToCart}
              >
                🛒 Agregar al carrito
              </Button>

              <Button 
                variant="outline"
                size="lg" 
                className="w-full"
                asChild
              >
                <Link href="/products">Continuar comprando</Link>
              </Button>
            </div>
          ) : (
            <div className="border-t pt-6">
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
                <p className="font-semibold mb-2">Producto agotado</p>
                <p className="text-sm">Este producto está agotado por el momento. Vuelve pronto.</p>
              </div>
              <Button 
                size="lg" 
                className="w-full mt-4"
                asChild
              >
                <Link href="/products">Explorar otros productos</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t pt-12 space-y-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-dark">
              Productos relacionados
            </h2>
            <p className="text-gray-500 mt-1">
              Más opciones dentro de la categoría {typeof product.category === 'string' ? product.category : product.category?.name}
            </p>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
