'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge, Button, Input } from '@/components/ui';

interface ProductDetailProps {
  name: string;
  price: number;
  description?: string;
  image?: string;
  images?: string[];
  stock: number;
  category?: string;
  sku?: string;
}

export default function ProductDetail({
  name,
  price,
  description,
  image,
  images = [],
  stock,
  category,
  sku,
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(image || images[0] || '');

  const isLowStock = stock < 5;
  const isOutOfStock = stock === 0;
  const allImages = image ? [image, ...images] : images;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image Section */}
      <div>
        {/* Main Image */}
        <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 h-96 relative">
          {selectedImage ? (
            <Image
              src={selectedImage}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🦐
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === img ? 'border-primary' : 'border-gray-200'
                }`}
              >
                <Image 
                  src={img} 
                  alt={`Thumbnail ${idx}`} 
                  width={80}
                  height={80}
                  className="object-cover" 
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div>
        {category && (
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{category}</p>
        )}

        <h1 className="text-3xl font-bold text-dark mb-4">{name}</h1>

        {/* Price */}
        <p className="text-4xl font-bold text-primary mb-4">Q{price.toFixed(2)}</p>

        {/* Stock */}
        <div className="mb-6">
          {isOutOfStock ? (
            <Badge variant="danger">Agotado</Badge>
          ) : isLowStock ? (
            <Badge variant="warning">Últimas unidades ({stock})</Badge>
          ) : (
            <Badge variant="success">{stock} en stock</Badge>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Descripción</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>
        )}

        {/* SKU */}
        {sku && (
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-semibold">SKU:</span> {sku}
          </p>
        )}

        {/* Add to Cart */}
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                label="Cantidad"
                type="number"
                min="1"
                max={stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isOutOfStock}
              />
            </div>
            <Button
              className="flex-1"
              size="lg"
              disabled={isOutOfStock || quantity > stock}
            >
              {isOutOfStock ? 'Agotado' : 'Agregar al carrito'}
            </Button>
          </div>

          {quantity > stock && stock > 0 && (
            <p className="text-danger text-sm">
              Solo hay {stock} unidades disponibles
            </p>
          )}
        </div>

        {/* Share */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold mb-3">Compartir:</p>
          <div className="flex gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              📱 WhatsApp
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              👍 Facebook
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              📧 Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
