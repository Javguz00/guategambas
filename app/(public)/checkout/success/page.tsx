'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Button from '@/app/components/ui/Button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-10 text-center shadow">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">¡Pedido realizado!</h1>
      <p className="mb-2 text-gray-600">Gracias por tu compra. Tu orden fue creada exitosamente.</p>
      <p className="mb-8 text-sm text-gray-500">
        {orderId ? `Número de orden: ${orderId}` : 'Recibirás la confirmación pronto.'}
      </p>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/products">
          <Button variant="secondary">Seguir comprando</Button>
        </Link>
        <Link href="/">
          <Button>Ir al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
