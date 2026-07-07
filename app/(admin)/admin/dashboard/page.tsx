'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/app/components/ui/Button';
import Loading from '@/app/components/ui/Loading';
import type { ApiResponse, Order, Product } from '@/lib/types';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
}

const LOW_STOCK_THRESHOLD = 5;

const formatCurrency = (value: number) => `Q${value.toFixed(2)}`;

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsResponse, ordersResponse] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/orders', { cache: 'no-store' }),
        ]);

        if (!productsResponse.ok || !ordersResponse.ok) {
          throw new Error('No se pudieron cargar las estadísticas');
        }

        const productsResult: ApiResponse<Product[]> = await productsResponse.json();
        const ordersResult: ApiResponse<Order[]> = await ordersResponse.json();

        setProducts(productsResult.data || []);
        setOrders(ordersResult.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = useMemo<DashboardStats>(
    () => ({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      lowStockProducts: products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length,
    }),
    [orders, products]
  );

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  if (loading) {
    return <Loading size="lg" message="Cargando dashboard..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">Resumen rápido de productos, órdenes e ingresos.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Productos" value={stats.totalProducts.toString()} accent="blue" />
        <StatCard label="Órdenes" value={stats.totalOrders.toString()} accent="indigo" />
        <StatCard label="Ingresos" value={formatCurrency(stats.totalRevenue)} accent="green" />
        <StatCard label="Stock bajo" value={stats.lowStockProducts.toString()} accent="yellow" />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Acciones rápidas</h2>
          <div className="space-y-3">
            <Link href="/admin/products/new" className="block">
              <Button size="lg" className="w-full">
                Crear producto
              </Button>
            </Link>
            <Link href="/admin/products" className="block">
              <Button size="lg" variant="secondary" className="w-full">
                Administrar productos
              </Button>
            </Link>
            <Link href="/admin/orders" className="block">
              <Button size="lg" variant="secondary" className="w-full">
                Ver órdenes
              </Button>
            </Link>
            <Link href="/admin/inventory" className="block">
              <Button size="lg" variant="ghost" className="w-full border border-gray-200">
                Revisar inventario
              </Button>
            </Link>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Últimas órdenes</h2>
              <p className="text-sm text-gray-500">Las 5 órdenes más recientes.</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Ver todas
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.status}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('es-GT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No hay órdenes aún.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'blue' | 'indigo' | 'green' | 'yellow';
}) {
  const accentStyles = {
    blue: 'border-blue-500 bg-blue-50',
    indigo: 'border-indigo-500 bg-indigo-50',
    green: 'border-green-500 bg-green-50',
    yellow: 'border-yellow-500 bg-yellow-50',
  };

  return (
    <div className={`rounded-xl border-l-4 p-6 shadow-sm ${accentStyles[accent]}`}>
      <p className="text-sm font-medium uppercase tracking-wide text-gray-600">{label}</p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
