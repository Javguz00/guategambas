'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/app/components/ui/Button';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
  });

  useEffect(() => {
    // TODO: Fetch stats from API
    setStats({
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      lowStockProducts: 0,
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="admin-stat">
          <div className="admin-stat-label">Productos Totales</div>
          <div className="admin-stat-value">{stats.totalProducts}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Órdenes Totales</div>
          <div className="admin-stat-value">{stats.totalOrders}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-label">Ingresos Totales</div>
          <div className="admin-stat-value">Q{stats.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="admin-stat border-l-yellow-500">
          <div className="admin-stat-label">Bajo Stock</div>
          <div className="admin-stat-value">{stats.lowStockProducts}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            <Link href="/admin/products/new">
              <Button size="lg" variant="primary" className="w-full mb-2">
                Crear Producto
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button size="lg" variant="secondary" className="w-full mb-2">
                Ver Productos
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button size="lg" variant="secondary" className="w-full">
                Ver Órdenes
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Últimas Órdenes</h2>
          <p className="text-gray-500">No hay órdenes aún.</p>
        </div>
      </div>
    </div>
  );
}
