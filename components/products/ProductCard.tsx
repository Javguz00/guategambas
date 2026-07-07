import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { addToCart, openCartDrawer } from '@/lib/cart';
import { isVideoMediaUrl } from '@/lib/media';
import type { Product } from '@/lib/types';

export default function ProductCard(product: Product) {
  const { id, name, price, image, stock, category } = product;
  const [imageSrc, setImageSrc] = useState(image || '/placeholder-product.svg');
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [feedback, setFeedback] = useState('');
  const isLowStock = stock < 5;
  const isOutOfStock = stock === 0;
  const categorySlug = typeof category === 'string' ? '' : category?.slug || '';
  const supportsGrade = categorySlug === 'caridinas' || categorySlug === 'neocaridinas';
  const isVideo = isVideoMediaUrl(imageSrc);

  const addItem = (grade?: 'ALTO' | 'NORMAL') => {
    const selectedGrade = supportsGrade ? (grade || 'ALTO') : undefined;
    const currentPrice =
      supportsGrade && selectedGrade === 'NORMAL'
        ? Number((price * 0.85).toFixed(2))
        : price;

    addToCart(
      {
        productId: id,
        variantKey: `${id}:${selectedGrade || 'STD'}`,
        grade: selectedGrade,
        quantity: 1,
        price: currentPrice,
      },
      { maxStock: stock }
    );

    setShowGradePicker(false);
    setFeedback(selectedGrade ? `Agregado (${selectedGrade === 'NORMAL' ? 'normal' : 'alto'})` : 'Agregado');
    openCartDrawer();
    window.setTimeout(() => setFeedback(''), 1500);
  };

  return (
    <div className="card group overflow-hidden hover:shadow-hover transition-shadow">
      {/* Image Container */}
      <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
        {isVideo ? (
          <video
            src={imageSrc}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            controls
          />
        ) : (
          <Image
            src={imageSrc}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageSrc('/placeholder-product.svg')}
          />
        )}

        {/* Stock Badge */}
        {isOutOfStock ? (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            Agotado
          </div>
        ) : isLowStock ? (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            Últimas unidades
          </div>
        ) : (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            En stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        {category && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {typeof category === 'string' ? category : category.name}
          </p>
        )}
        <h3 className="font-semibold text-lg text-dark line-clamp-2 mb-2">
          {name}
        </h3>

        {/* Price */}
        <p className="text-2xl font-bold text-primary mb-2">
          Q{price.toFixed(2)}
        </p>

        {/* Stock Info */}
        <p className={`text-sm mb-4 ${isLowStock ? 'text-yellow-600 font-semibold' : 'text-gray-500'}`}>
          {isOutOfStock ? (
            'No disponible'
          ) : (
            <>
              {stock} unidades disponibles
            </>
          )}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {showGradePicker && supportsGrade && !isOutOfStock && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-white"
              onClick={() => addItem('ALTO')}
            >
              Grado alto
            </button>
            <button
              type="button"
              className="rounded-md border border-primary/40 px-2 py-2 text-xs font-semibold text-primary hover:bg-white"
              onClick={() => addItem('NORMAL')}
            >
              Normal -15%
            </button>
          </div>
        )}

        <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          asChild
        >
          <Link href={`/products/${id}`}>Ver detalles</Link>
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={isOutOfStock}
          onClick={() => {
            if (supportsGrade) {
              setShowGradePicker((current) => !current);
              return;
            }
            addItem();
          }}
        >
          {isOutOfStock ? 'Agotado' : 'Agregar'}
        </Button>
        </div>
        {feedback && <p className="text-xs font-semibold text-green-700">{feedback}</p>}
      </div>
    </div>
  );
}
