'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import Loading from '@/app/components/ui/Loading';
import type { ApiResponse, Product } from '@/lib/types';

const currencyFormatter = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2,
});

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/products', { cache: 'no-store' });
      const result: ApiResponse<Product[]> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudieron cargar los productos');
      }

      setProducts(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const renderStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="danger">Agotado</Badge>;
    }

    if (stock < 10) {
      return <Badge variant="warning">Bajo ({stock})</Badge>;
    }

    return <Badge variant="success">{stock} unidades</Badge>;
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);
      setFeedback(null);

      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<Product> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo eliminar el producto');
      }

      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id));
      setFeedback(result.message || 'Producto eliminado correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <Loading size="lg" message="Cargando productos..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionar Productos</h1>
          <p className="text-sm text-gray-500">
            Administra el catálogo, inventario y acciones disponibles.
          </p>
        </div>

        <Button onClick={() => router.push('/admin/products/new')}>Crear producto</Button>
      </div>

      {feedback && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={fetchProducts}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.slug}</div>
                  </td>
                  <td>{product.category?.name || 'Sin categoría'}</td>
                  <td>{currencyFormatter.format(product.price)}</td>
                  <td>{renderStockBadge(product.stock)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/admin/products/${product.id}`)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={deletingId === product.id}
                        onClick={() => handleDelete(product.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No hay productos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
