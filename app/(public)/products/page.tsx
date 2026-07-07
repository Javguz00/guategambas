'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProductGrid } from '@/components/products';
import { Button, Input, Loading, Badge } from '@/components/ui';
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

  if (loading) {
    return <Loading size="lg" text="Cargando productos..." fullScreen />;
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <Badge variant="danger">Error: {error}</Badge>
      </div>
    );
  }

  return (
    <div className="container py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-dark mb-2">Catálogo de Gambas</h1>
          <p className="text-gray-600">
            Explora <span className="font-semibold text-primary">{filteredProducts.length}</span> producto{filteredProducts.length === 1 ? '' : 's'} disponible{filteredProducts.length === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="w-full md:max-w-md">
          <Input
            label="Buscar"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre..."
            icon={<span>🔍</span>}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="card h-fit sticky top-24">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dark">Categorías</h2>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-semibold text-primary hover:text-red-700 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>Todas</span>
              <Badge variant={selectedCategory === 'all' ? 'info' : 'info'} className="ml-2">
                {products.length}
              </Badge>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.slug)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  selectedCategory === category.slug
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.name}</span>
                <Badge variant="info" className="ml-2">{category._count?.products ?? 0}</Badge>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <div className="space-y-8">
          <ProductGrid products={paginatedProducts} loading={false} />

          {/* Pagination */}
          {filteredProducts.length > ITEMS_PER_PAGE && (
            <div className="card">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Página <span className="font-semibold">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    ← Anterior
                  </Button>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    Siguiente →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
