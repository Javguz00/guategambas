import { Product, ProductMedia, ProductVariant } from "@/lib/types";

export type CatalogInventoryState = {
  stockAvailable?: number | null;
  isActive?: boolean | null;
  priceOverride?: number | null;
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

export function getVariantDisplayLabel(variant: ProductVariant) {
  const grade = variant.gradeLabel || variant.highlight;
  return grade ? `${grade} · ${variant.label}` : variant.label;
}

export function getVariantGradeLabel(variant: ProductVariant) {
  return variant.gradeLabel || variant.highlight || "";
}

export function groupVariantsByGrade(product: Product) {
  const gradeOrder = ["Grado Alto", "Grado Normal"];
  const groups = product.variants.reduce<Record<string, ProductVariant[]>>((acc, variant) => {
    const grade = getVariantGradeLabel(variant) || "Sin grado";
    if (!acc[grade]) {
      acc[grade] = [];
    }
    acc[grade].push(variant);
    return acc;
  }, {});

  return Object.entries(groups).sort((left, right) => {
    const leftIndex = gradeOrder.indexOf(left[0]);
    const rightIndex = gradeOrder.indexOf(right[0]);

    if (leftIndex === -1 && rightIndex === -1) return left[0].localeCompare(right[0]);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

export function mergeCatalogInventory(products: Product[], inventory: CatalogInventoryMap) {
  return products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) => {
      const state = inventory[buildVariantKey(product.id, variant.id)];
      if (!state) return variant;

      const overridePrice = typeof state.priceOverride === "number" && Number.isFinite(state.priceOverride)
        ? state.priceOverride
        : null;

      return {
        ...variant,
        ...(state.stockAvailable === undefined ? {} : { stockAvailable: state.stockAvailable ?? undefined }),
        ...(state.isActive === undefined ? {} : { isActive: state.isActive ?? undefined }),
        ...(overridePrice === null ? {} : { price: overridePrice, priceOverride: overridePrice })
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
    priceOverride?: number | null;
  }>
) {
  return rows.reduce<CatalogInventoryMap>((acc, row) => {
    acc[buildVariantKey(row.productId, row.variantId)] = {
      stockAvailable: row.stockAvailable,
      isActive: row.isActive,
      priceOverride: row.priceOverride ?? null
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
      isActive: variant.isActive !== false,
      priceOverride: typeof (variant as ProductVariant & { priceOverride?: number | null }).priceOverride === "number"
        ? (variant as ProductVariant & { priceOverride?: number | null }).priceOverride
        : null
    }))
  );
}
