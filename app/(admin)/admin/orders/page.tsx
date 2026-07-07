'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Loading from '@/app/components/ui/Loading';
import { OrderStatus, type ApiResponse, type Order } from '@/lib/types';

const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

const currencyFormatter = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

const sortOrdersByDate = (orders: Order[]) =>
  [...orders].sort(
    (leftOrder, rightOrder) =>
      new Date(rightOrder.createdAt).getTime() - new Date(leftOrder.createdAt).getTime()
  );

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/orders', { cache: 'no-store' });
      const result: ApiResponse<Order[]> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudieron cargar las órdenes');
      }

      setOrders(sortOrdersByDate(result.data || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);
      setFeedback(null);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result: ApiResponse<Order> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'No se pudo actualizar el estado');
      }

      setOrders((currentOrders) =>
        sortOrdersByDate(
          currentOrders.map((currentOrder) =>
            currentOrder.id === orderId ? result.data || currentOrder : currentOrder
          )
        )
      );
      setFeedback(result.message || 'Estado actualizado correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return <Loading size="lg" message="Cargando órdenes..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestionar Órdenes</h1>
        <p className="text-sm text-gray-500">
          Revisa las compras recientes y actualiza su estado.
        </p>
      </div>

      {feedback && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={fetchOrders}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-sm text-gray-700">{order.id.slice(0, 8)}...</td>
                  <td>
                    <div className="font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerEmail}</div>
                  </td>
                  <td>{currencyFormatter.format(order.total)}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        handleStatusChange(order.id, event.target.value as OrderStatus)
                      }
                      disabled={updatingOrderId === order.id}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ORDER_STATUSES.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString('es-GT')}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No hay órdenes registradas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
