'use client';

import { useEffect, useState } from 'react';
import Loading from '@/app/components/ui/Loading';
import Badge from '@/app/components/ui/Badge';
import type { Product } from '@/lib/types';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <Loading size="lg" message="Cargando inventario..." />;
  }

  const lowStockProducts = products.filter((p) => p.stock < 10);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Inventario</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="admin-stat border-l-yellow-500">
          <div className="admin-stat-label">Bajo Stock (&lt;10)</div>
          <div className="admin-stat-value">{lowStockProducts.length}</div>
        </div>
        <div className="admin-stat border-l-red-500">
          <div className="admin-stat-label">Agotados</div>
          <div className="admin-stat-value">{outOfStockProducts.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={product.stock < 10 ? 'bg-yellow-50' : ''}>
                <td className="font-medium">{product.name}</td>
                <td>{product.category?.name || 'N/A'}</td>
                <td>Q{product.price.toFixed(2)}</td>
                <td className="font-semibold">{product.stock}</td>
                <td>
                  {product.stock === 0 ? (
                    <Badge variant="danger">Agotado</Badge>
                  ) : product.stock < 10 ? (
                    <Badge variant="warning">Bajo Stock</Badge>
                  ) : (
                    <Badge variant="success">Ok</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No hay productos.
          </div>
        )}
      </div>
    </div>
  );
}
