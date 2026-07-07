'use client';

import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const imageUrl = product.image || '/placeholder-product.jpg';

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
      <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-gray-200">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          priority={false}
        />
        {product.featured && (
          <Badge variant="warning" size="sm" className="absolute top-2 right-2">
            Destacado
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        )}
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-blue-600">Q{product.price.toFixed(2)}</span>
          <Badge variant={product.stock > 0 ? 'success' : 'danger'} size="sm">
            {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">
              Ver
            </Button>
          </Link>
          {product.stock > 0 && (
            <Button
              size="sm"
              variant="primary"
              className="flex-1"
              onClick={() => onAddToCart?.(product.id)}
            >
              Agregar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
