'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  brand: string;
  images: string[];
}

type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

const initialFormState: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
  brand: '',
  images: [],
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

  return errors;
};

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormState>(initialFormState);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setPageError(null);

        const response = await fetch('/api/categories', { cache: 'no-store' });
        const result: ApiResponse<Category[]> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'No se pudieron cargar las categorías');
        }

        setCategories(result.data || []);
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => {
      if (name === 'name' && !slugTouched) {
        return {
          ...currentFormData,
          name: value,
          slug: slugify(value),
        };
      }

      return {
        ...currentFormData,
        [name]: value,
      };
    });

    if (name === 'slug') {
      setSlugTouched(true);
    }

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

    try {
      setSaving(true);
      setPageError(null);

      const response = await fetch('/api/products', {
        method: 'POST',
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
          brand: formData.brand.trim() || null,
          images: formData.images,
        }),
      });

      const result: ApiResponse<Product> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo crear el producto');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'No se pudo crear el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      setPageError('Selecciona un archivo para subir.');
      return;
    }

    try {
      setUploadingImage(true);
      setPageError(null);

      const uploadData = new FormData();
      uploadData.append('file', selectedImageFile);
      uploadData.append('scope', 'product');
      uploadData.append('title', selectedImageFile.name || '');

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: uploadData,
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.url) {
        throw new Error(result.error || 'No se pudo subir la imagen');
      }

      setFormData((current) => ({
        ...current,
        images: [...current.images, result.data.url],
      }));
      setSelectedImageFile(null);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddMediaUrl = () => {
    const trimmed = mediaUrlInput.trim();
    if (!trimmed) {
      return;
    }

    if (!isValidImageUrl(trimmed)) {
      setErrors((current) => ({ ...current, images: 'Ingresa una URL válida.' }));
      return;
    }

    setFormData((current) => ({ ...current, images: [...current.images, trimmed] }));
    setMediaUrlInput('');
    setErrors((current) => ({ ...current, images: undefined }));
  };

  const handleRemoveMediaAt = (index: number) => {
    setFormData((current) => ({
      ...current,
      images: current.images.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  if (loadingCategories) {
    return <Loading size="lg" message="Cargando formulario..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crear Producto</h1>
        <p className="text-sm text-gray-500">
          Completa la información básica para agregar un producto al catálogo.
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
              helperText="Se usará en la URL del producto."
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
                Opcional, pero recomendada para mejorar el catálogo.
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
            <Input
              label="Marca"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Ej. Guategambas"
              helperText="Opcional."
            />
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
                  ? 'Elige la categoría a la que pertenece el producto.'
                  : 'No hay categorías disponibles.'}
              </p>
            )}
          </div>

          <div className="admin-form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes y videos</label>
            {formData.images.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3">
                {formData.images.map((url, index) => (
                  <div key={url + index} className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                    {isVideoMediaUrl(url) ? (
                      <video src={url} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <img src={url} alt={`Vista previa ${index + 1}`} className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMediaAt(index)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                      aria-label={`Quitar imagen ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.images && <p className="mb-2 text-sm text-red-500">{errors.images}</p>}

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={mediaUrlInput}
                onChange={(event) => setMediaUrlInput(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <Button type="button" variant="secondary" onClick={handleAddMediaUrl}>
                Agregar URL
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
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
                Subir y agregar
              </Button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Agrega una o varias imágenes o videos. El primero de la lista se usará como portada.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" isLoading={saving} disabled={categories.length === 0}>
              Guardar producto
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
