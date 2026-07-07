'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Loading from '@/app/components/ui/Loading';
import type { Product } from '@/lib/types';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        const data = await response.json();
        setFormData(data.data);
      } catch (error) {
        alert('Error al cargar producto');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : name === 'stock' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update product');
      alert('Producto actualizado exitosamente');
      router.push('/admin/products');
    } catch (error) {
      alert('Error al actualizar producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading size="lg" message="Cargando producto..." />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Editar Producto</h1>

      <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form-group">
            <Input
              label="Nombre"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form-group">
            <Input
              label="Slug"
              name="slug"
              value={formData.slug || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="admin-form-group">
              <Input
                label="Precio (Q)"
                type="number"
                step="0.01"
                name="price"
                value={formData.price || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <Input
                label="Stock"
                type="number"
                name="stock"
                value={formData.stock || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="admin-form-group mb-8">
            <Input
              label="URL Imagen"
              name="image"
              value={formData.image || ''}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary" isLoading={saving}>
              Actualizar Producto
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
