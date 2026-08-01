import type { Product } from '@/lib/types';

type InventoryEntry = {
  productId: string;
  variantLabel: string;
  stock: number;
  price: number | null;
};

type CatalogInventory = Array<{
  label: string;
  stock: number;
  price: number | null;
}>;

export function inventoryToMap(rows: InventoryEntry[]) {
  return rows.reduce<Record<string, CatalogInventory>>((acc, row) => {
    if (!acc[row.productId]) {
      acc[row.productId] = [];
    }

    acc[row.productId].push({
      label: row.variantLabel,
      stock: row.stock,
      price: row.price,
    });

    return acc;
  }, {});
}

export function mergeCatalogInventory(products: Product[], inventory: Record<string, CatalogInventory>) {
  return products.map((product) => ({
    ...product,
    inventory: inventory[product.id] ?? [],
  }) as Product & { inventory?: CatalogInventory });
}

export function mergeCatalogProductState(
  products: Array<Product & { inventory?: CatalogInventory }>,
  overrides: Record<string, { name?: string | null; category?: string | null; description?: string | null; highlight?: string | null; note?: string | null }>
) {
  return products.map((product) => {
    const override = overrides[product.id];

    return {
      ...product,
      name: override?.name ?? product.name,
      category: override?.category ?? product.category?.name ?? product.category?.slug ?? null,
      description: override?.description ?? product.description ?? null,
      highlight: override?.highlight ?? null,
      note: override?.note ?? null,
    } as Product & { inventory?: CatalogInventory; category?: string | null; description?: string | null; highlight?: string | null; note?: string | null };
  });
}

export function extractInventoryRows(catalog: Array<{ id: string; inventory?: CatalogInventory }>) {
  return catalog.flatMap((product) =>
    (product.inventory ?? []).map((entry, index) => ({
      productId: product.id,
      variantLabel: entry.label || `Opción ${index + 1}`,
      stock: entry.stock,
      price: entry.price,
    }))
  );
}
