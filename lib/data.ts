import {
  getFallbackCatalogData,
  getFallbackCategories,
  getFallbackProductById,
  getFallbackProducts,
} from '@/lib/fallback-catalog';

export const products = getFallbackProducts();
export const categories = getFallbackCategories();
export const catalogData = getFallbackCatalogData();

export function getProductById(id: string) {
  return getFallbackProductById(id);
}

export { getFallbackCatalogData, getFallbackCategories, getFallbackProductById, getFallbackProducts };
