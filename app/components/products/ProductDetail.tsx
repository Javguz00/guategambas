'use client';

import Image from 'next/image';
import { useState } from 'react';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import type { Product } from '@/lib/types';

interface ProductDetailProps {
  product: Product;
  onAddToCart?: (productId: string, quantity: number) => void;
}

export default function ProductDetail({ product, onAddToCart }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);

  const imageUrl = product.image || '/placeholder-product.jpg';

  const handleAddToCart = () => {
    if (quantity > 0 && quantity <= product.stock) {
      onAddToCart?.(product.id, quantity);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative w-full h-96 overflow-hidden rounded-lg bg-gray-200">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          priority={true}
        />
      </div>

      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.category && (
              <p className="text-gray-500 mt-1">Categoría: {product.category.name}</p>
            )}
          </div>
          {product.featured && (
            <Badge variant="warning">Destacado</Badge>
          )}
        </div>

        <div className="mb-6">
          <p className="text-4xl font-bold text-blue-600">Q{product.price.toFixed(2)}</p>
        </div>

        <div className="mb-6">
          <Badge 
            variant={product.stock > 0 ? 'success' : 'danger'}
            size="lg"
          >
            {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
          </Badge>
        </div>

        {product.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Descripción</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>
        )}

        {product.stock > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Cantidad</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
              />
              <Button
                size="lg"
                variant="primary"
                onClick={handleAddToCart}
                className="flex-1"
              >
                Agregar al carrito
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
