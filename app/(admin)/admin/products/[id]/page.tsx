'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Loading from '@/app/components/ui/Loading';
import type { ApiResponse, Category, Product } from '@/lib/types';
import { isVideoMediaUrl } from '@/lib/media';

interface ProductFormState {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  image: string;
}

type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

const isValidImageUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  if (trimmed.startsWith('/')) {
    return true;
  }

  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
};

const validateForm = (formData: ProductFormState): ProductFormErrors => {
  const errors: ProductFormErrors = {};
  const price = Number(formData.price);
  const stock = Number(formData.stock);

  if (formData.name.trim().length < 3) {
    errors.name = 'El nombre debe tener al menos 3 caracteres.';
  }

  if (!formData.slug.trim()) {
    errors.slug = 'El slug es requerido.';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
    errors.slug = 'Usa solo letras minúsculas, números y guiones.';
  }

  if (!formData.categoryId) {
    errors.categoryId = 'Selecciona una categoría.';
  }

  if (formData.price.trim() === '') {
    errors.price = 'El precio es requerido.';
  } else if (Number.isNaN(price) || price < 0) {
    errors.price = 'Ingresa un precio válido mayor o igual a 0.';
  }

  if (formData.stock.trim() === '') {
    errors.stock = 'El stock es requerido.';
  } else if (!Number.isInteger(stock) || stock < 0) {
    errors.stock = 'Ingresa un stock entero mayor o igual a 0.';
  }

  if (formData.description.trim().length > 0 && formData.description.trim().length < 10) {
    errors.description = 'La descripción debe tener al menos 10 caracteres o quedar vacía.';
  }

  if (!isValidImageUrl(formData.image)) {
    errors.image = 'Ingresa una URL válida para la imagen.';
  }

  return errors;
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormState>({
    name: '',
    slug: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    image: '',
  });
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) {
        setPageError('Producto inválido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError(null);

        const [productResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/products/${productId}`, { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);

        const productResult: ApiResponse<Product> = await productResponse.json();
        const categoriesResult: ApiResponse<Category[]> = await categoriesResponse.json();

        if (!productResponse.ok || !productResult.success || !productResult.data) {
          throw new Error(productResult.error || 'No se pudo cargar el producto');
        }

        if (!categoriesResponse.ok || !categoriesResult.success) {
          throw new Error(categoriesResult.error || 'No se pudieron cargar las categorías');
        }

        const product = productResult.data;

        setCategories(categoriesResult.data || []);
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          price: String(product.price ?? ''),
          stock: String(product.stock ?? ''),
          categoryId: product.categoryId || '',
          image: product.image || '',
        });
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'No se pudo cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }));
    setPageError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!productId) {
      setPageError('Producto inválido.');
      return;
    }

    try {
      setSaving(true);
      setPageError(null);

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          price: Number(formData.price),
          stock: Number(formData.stock),
          categoryId: formData.categoryId,
          image: formData.image.trim() || null,
        }),
      });

      const result: ApiResponse<Product> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo actualizar el producto');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'No se pudo actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile || !productId) {
      setPageError('Selecciona un archivo para subir.');
      return;
    }

    try {
      setUploadingImage(true);
      setPageError(null);

      const formData = new FormData();
      formData.append('file', selectedImageFile);
      formData.append('scope', 'product');
      formData.append('productId', productId);
      formData.append('title', selectedImageFile.name || '');

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.url) {
        throw new Error(result.error || 'No se pudo subir la imagen');
      }

      setFormData((current) => ({
        ...current,
        image: result.data.url,
      }));
      setSelectedImageFile(null);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <Loading size="lg" message="Cargando producto..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Producto</h1>
        <p className="text-sm text-gray-500">
          Actualiza los datos del producto y guarda los cambios.
        </p>
      </div>

      <div className="max-w-3xl rounded-lg bg-white p-8 shadow">
        <form onSubmit={handleSubmit} className="admin-form">
          {pageError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          )}

          <div className="admin-form-group">
            <Input
              label="Nombre"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Ej. Camarón jumbo fresco"
            />
          </div>

          <div className="admin-form-group">
            <Input
              label="Slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              error={errors.slug}
              helperText="Actualiza la URL pública si es necesario."
              placeholder="camaron-jumbo-fresco"
            />
          </div>

          <div className="admin-form-group">
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe el producto, presentación y beneficios."
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description ? (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                Puedes dejarla vacía o usar una descripción más detallada.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="admin-form-group">
              <Input
                label="Precio"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                error={errors.price}
                placeholder="0.00"
              />
            </div>

            <div className="admin-form-group">
              <Input
                label="Stock"
                name="stock"
                type="number"
                step="1"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                error={errors.stock}
                placeholder="0"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                {categories.length > 0
                  ? 'Selecciona la categoría actual del producto.'
                  : 'No hay categorías disponibles.'}
              </p>
            )}
          </div>

          <div className="admin-form-group">
            <Input
              label="URL de imagen o video"
              name="image"
              value={formData.image}
              onChange={handleChange}
              error={errors.image}
              placeholder="https://..."
            />
            {formData.image && (
              <div className="mt-3">
                {isVideoMediaUrl(formData.image) ? (
                  <video
                    src={formData.image}
                    className="h-32 w-32 rounded-lg object-cover border border-gray-200"
                    controls
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={formData.image}
                    alt="Vista previa"
                    className="h-32 w-32 rounded-lg object-cover border border-gray-200"
                  />
                )}
              </div>
            )}
          </div>

          <div className="admin-form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subir multimedia</label>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => setSelectedImageFile(event.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleUploadImage}
                isLoading={uploadingImage}
                disabled={!selectedImageFile}
              >
                Subir
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" isLoading={saving} disabled={categories.length === 0}>
              Guardar cambios
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/admin/products')}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
