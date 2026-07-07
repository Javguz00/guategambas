import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import type { Product } from '@/lib/types';

export default function ProductCard(product: Product) {
  const { id, name, price, image, stock, category } = product;
  const isLowStock = stock < 5;
  const isOutOfStock = stock === 0;

  return (
    <div className="card group overflow-hidden hover:shadow-hover transition-shadow">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200 rounded-lg overflow-hidden mb-4">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl">
            🦐
          </div>
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
        >
          {isOutOfStock ? 'Agotado' : 'Agregar'}
        </Button>
      </div>
    </div>
  );
}
