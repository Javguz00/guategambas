import { Product, ProductMedia, ProductVariant } from "@/lib/types";

export type CatalogInventoryState = {
  stockAvailable?: number | null;
  isActive?: boolean | null;
};

export type CatalogInventoryMap = Record<string, CatalogInventoryState>;

export function buildVariantKey(productId: string, variantId: string) {
  return `${productId}:${variantId}`;
}

export function getVariantAvailabilityLabel(variant: ProductVariant) {
  if (variant.isActive === false) {
    return "No disponible";
  }

  if (typeof variant.stockAvailable === "number") {
    if (variant.stockAvailable <= 0) {
      return "Agotado";
    }

    if (typeof variant.lowStockThreshold === "number" && variant.stockAvailable <= variant.lowStockThreshold) {
      return `Pocas unidades: ${variant.stockAvailable}`;
    }

    return `Disponibles: ${variant.stockAvailable}`;
  }

  return "Disponible";
}

export function getVariantMedia(product: Product | null | undefined, variant?: ProductVariant | null): ProductMedia | undefined {
  if (!product) {
    return variant?.media;
  }

  return variant?.media || product.media;
}

export function mergeCatalogInventory(products: Product[], inventory: CatalogInventoryMap) {
  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => {
      const state = inventory[buildVariantKey(product.id, variant.id)];
      if (!state) return variant;

      return {
        ...variant,
        ...(state.stockAvailable === undefined ? {} : { stockAvailable: state.stockAvailable ?? undefined }),
        ...(state.isActive === undefined ? {} : { isActive: state.isActive ?? undefined })
      };
    })
  }));
}

export function inventoryToMap(
  rows: Array<{
    productId: string;
    variantId: string;
    stockAvailable: number | null;
    isActive: boolean;
  }>
) {
  return rows.reduce<CatalogInventoryMap>((acc, row) => {
    acc[buildVariantKey(row.productId, row.variantId)] = {
      stockAvailable: row.stockAvailable,
      isActive: row.isActive
    };
    return acc;
  }, {});
}

export function extractInventoryRows(products: Product[]) {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      productId: product.id,
      productName: product.name,
      category: product.category,
      variantId: variant.id,
      variantLabel: variant.label,
      stockAvailable: variant.stockAvailable ?? null,
      isActive: variant.isActive !== false
    }))
  );
}
