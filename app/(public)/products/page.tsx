'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductGrid from '@/app/components/products/ProductGrid';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Loading from '@/app/components/ui/Loading';
import { addToCart } from '@/lib/cart';
import type { ApiResponse, Category, Product } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

interface CategoryWithCount extends Category {
  _count?: {
    products: number;
  };
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const categoryFromUrl =
      typeof window === 'undefined'
        ? null
        : new URLSearchParams(window.location.search).get('category');
    setSelectedCategory(categoryFromUrl || 'all');
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);

        if (!productsResponse.ok || !categoriesResponse.ok) {
          throw new Error('No se pudo cargar el catálogo');
        }

        const productsResult: ApiResponse<Product[]> = await productsResponse.json();
        const categoriesResult: ApiResponse<CategoryWithCount[]> = await categoriesResponse.json();

        setProducts(productsResult.data || []);
        setCategories(categoriesResult.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category?.slug === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch) ||
        product.category?.name.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredProducts]);

  const handleAddToCart = (productId: string) => {
    const product = products.find((catalogProduct) => catalogProduct.id === productId);
    if (!product) {
      return;
    }

    addToCart(
      {
        productId: product.id,
        quantity: 1,
        price: product.price,
      },
      { maxStock: product.stock }
    );

    setFeedback(`${product.name} se agregó al carrito.`);
    window.setTimeout(() => setFeedback(null), 2500);
  };

  if (loading) {
    return <Loading size="lg" message="Cargando productos..." />;
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Gambas</h1>
          <p className="mt-2 text-sm text-gray-500">
            Explora {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'}{' '}
            disponibles.
          </p>
        </div>
        <div className="w-full md:max-w-md">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, descripción o categoría"
          />
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Categorías</h2>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>Todas</span>
              <span>{products.length}</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.slug)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedCategory === category.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.name}</span>
                <span>{category._count?.products ?? 0}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <ProductGrid products={paginatedProducts} onAddToCart={handleAddToCart} />

          {filteredProducts.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row">
              <p className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
