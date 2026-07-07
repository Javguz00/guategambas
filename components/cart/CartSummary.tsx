import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { isVideoMediaUrl } from '@/lib/media';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
  tax?: number;
  shipping?: number;
  loading?: boolean;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  onPrimaryAction?: () => void;
}

export default function CartSummary({
  items,
  subtotal,
  tax = 0,
  shipping = 0,
  loading = false,
  primaryActionLabel = 'Proceder al pago',
  primaryActionDisabled = false,
  onPrimaryAction,
}: CartSummaryProps) {
  const total = subtotal + tax + shipping;

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
        <Button asChild>
          <Link href="/products">Seguir comprando</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Items */}
      <div className="card overflow-hidden">
        <h2 className="text-xl font-bold mb-4 pb-4 border-b border-gray-200">
          Resumen de compra
        </h2>

        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex gap-4">
              {item.image && (
                isVideoMediaUrl(item.image) ? (
                  <video
                    src={item.image}
                    className="w-16 h-16 object-cover rounded"
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded"
                  />
                )
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-gray-600">
                  {item.quantity}x Q{item.price.toFixed(2)}
                </p>
              </div>
              <p className="font-semibold">Q{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="card space-y-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal:</span>
          <span>Q{subtotal.toFixed(2)}</span>
        </div>

        {tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Impuesto (IVA):</span>
            <span>Q{tax.toFixed(2)}</span>
          </div>
        )}

        {shipping > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Envío:</span>
            <span>Q{shipping.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-xl font-bold text-primary">
            <span>Total:</span>
            <span>Q{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          type="button"
          className="w-full"
          disabled={primaryActionDisabled}
          onClick={onPrimaryAction}
        >
          {primaryActionLabel}
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/products">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  );
}
