'use client';

import { CartItem } from '@/lib/types';
import Button from '@/app/components/ui/Button';

interface CartSummaryProps {
  items: CartItem[];
  onContinue?: () => void;
}

export default function CartSummary({ items, onContinue }: CartSummaryProps) {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shippingCost = 50;
  const total = subtotal + shippingCost;

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-20">
      <h3 className="text-lg font-bold mb-4">Resumen de Compra</h3>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Items:</span>
          <span className="font-medium">{items.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">Q{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Envío:</span>
          <span className="font-medium">Q{shippingCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t pt-4 mb-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="text-blue-600">Q{total.toFixed(2)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onContinue}
        disabled={items.length === 0}
      >
        {items.length === 0 ? 'Carrito vacío' : 'Continuar'}
      </Button>
    </div>
  );
}
