import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { products } from "@/lib/data";
import { buildVariantKey, extractInventoryRows, inventoryToMap, mergeCatalogInventory } from "@/lib/catalog";

async function loadMergedCatalog() {
  const rows = await prisma.catalogVariantState.findMany();
  const inventory = inventoryToMap(rows);
  return mergeCatalogInventory(products, inventory);
}

export async function GET() {
  try {
    const catalog = await loadMergedCatalog();
    return NextResponse.json({ products: catalog, inventory: extractInventoryRows(catalog) });
  } catch {
    return NextResponse.json({ products, inventory: [] });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    productId?: string;
    variantId?: string;
    stockAvailable?: number | string | null;
    isActive?: boolean;
    priceOverride?: number | string | null;
  };

  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const variantId = typeof body.variantId === "string" ? body.variantId.trim() : "";
  const stockValue = body.stockAvailable;
  const stockAvailable = stockValue === null || stockValue === undefined || stockValue === "" ? null : Number(stockValue);
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
  const priceValue = body.priceOverride;
  const priceOverride =
    priceValue === null || priceValue === undefined || priceValue === "" ? null : Number(priceValue);

  if (
    !productId ||
    !variantId ||
    (stockAvailable !== null && (!Number.isFinite(stockAvailable) || stockAvailable < 0)) ||
    (priceOverride !== null && (!Number.isFinite(priceOverride) || priceOverride <= 0))
  ) {
    return NextResponse.json({ error: "Invalid catalog payload" }, { status: 400 });
  }

  const productExists = products.some((product) =>
    product.id === productId && product.variants.some((variant) => variant.id === variantId)
  );

  if (!productExists) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const state = await prisma.catalogVariantState.upsert({
    where: {
      productId_variantId: {
        productId,
        variantId
      }
    },
    create: {
      productId,
      variantId,
      stockAvailable: stockAvailable === null ? null : Math.floor(stockAvailable),
      isActive,
      priceOverride: priceOverride === null ? null : priceOverride
    },
    update: {
      stockAvailable: stockAvailable === null ? null : Math.floor(stockAvailable),
      isActive,
      priceOverride: priceOverride === null ? null : priceOverride
    }
  });

  return NextResponse.json({ ok: true, state, key: buildVariantKey(state.productId, state.variantId) });
}
