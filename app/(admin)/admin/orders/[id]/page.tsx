'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Loading from '@/app/components/ui/Loading';
import {
  OrderStatus,
  PaymentStatus,
  type ApiResponse,
  type Order,
} from '@/lib/types';

const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PENDING,
  PaymentStatus.PAID,
  PaymentStatus.FAILED,
  PaymentStatus.CANCELLED,
];

const currencyFormatter = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

interface OrderFormState {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [formState, setFormState] = useState<OrderFormState>({
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Orden inválida.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const result: ApiResponse<Order> = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || 'No se pudo cargar la orden');
        }

        setOrder(result.data);
        setFormState({
          status: result.data.status,
          paymentStatus: result.data.paymentStatus,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!orderId) {
      setError('Orden inválida.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setFeedback(null);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const result: ApiResponse<Order> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'No se pudo actualizar la orden');
      }

      setOrder(result.data);
      setFormState({
        status: result.data.status,
        paymentStatus: result.data.paymentStatus,
      });
      setFeedback(result.message || 'Orden actualizada correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la orden');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading size="lg" message="Cargando orden..." />;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'No se encontró la orden.'}
        </div>
        <Button variant="secondary" onClick={() => router.push('/admin/orders')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orden #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-gray-500">
            Creada el {new Date(order.createdAt).toLocaleString('es-GT')}
          </p>
        </div>

        <Button variant="secondary" onClick={() => router.push('/admin/orders')}>
          Volver al listado
        </Button>
      </div>

      {feedback && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Items de la orden</h2>

            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-medium text-gray-900">
                          {item.product?.name || item.productId}
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{currencyFormatter.format(item.price)}</td>
                      <td>{currencyFormatter.format(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Datos del cliente</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Método de pago</p>
                <p className="font-medium text-gray-900">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ciudad</p>
                <p className="font-medium text-gray-900">{order.city}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Departamento</p>
                <p className="font-medium text-gray-900">{order.department || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900">{order.address || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Notas</p>
                <p className="font-medium text-gray-900">{order.notes || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Actualizar orden</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((currentFormState) => ({
                      ...currentFormState,
                      status: event.target.value as OrderStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ORDER_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Estado de pago
                </label>
                <select
                  value={formState.paymentStatus}
                  onChange={(event) =>
                    setFormState((currentFormState) => ({
                      ...currentFormState,
                      paymentStatus: event.target.value as PaymentStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAYMENT_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currencyFormatter.format(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>{currencyFormatter.format(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{currencyFormatter.format(order.total)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={saving}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
