import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { products } from "@/lib/data";
import { extractInventoryRows, inventoryToMap, mergeCatalogInventory, mergeCatalogProductState } from "@/lib/catalog";

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

async function loadMergedCatalog() {
  const [variantRows, productRows] = await Promise.all([
    prisma.catalogVariantState.findMany(),
    prisma.catalogProductState.findMany()
  ]);

  const inventory = inventoryToMap(variantRows);
  const overrides = productRows.reduce<Record<string, { name?: string | null; category?: string | null; description?: string | null; highlight?: string | null; note?: string | null }>>((acc, row) => {
    acc[row.productId] = {
      name: row.name,
      category: row.category,
      description: row.description,
      highlight: row.highlight,
      note: row.note
    };
    return acc;
  }, {});

  return mergeCatalogProductState(mergeCatalogInventory(products, inventory), overrides);
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [catalog, productStates] = await Promise.all([loadMergedCatalog(), prisma.catalogProductState.findMany()]);
  return NextResponse.json({
    products: catalog,
    productStates: productStates.reduce<Record<string, { name?: string | null; category?: string | null; description?: string | null; highlight?: string | null; note?: string | null }>>((acc, row) => {
      acc[row.productId] = {
        name: row.name,
        category: row.category,
        description: row.description,
        highlight: row.highlight,
        note: row.note
      };
      return acc;
    }, {}),
    inventory: extractInventoryRows(catalog)
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    productId?: unknown;
    name?: unknown;
    category?: unknown;
    description?: unknown;
    highlight?: unknown;
    note?: unknown;
  };

  const productId = normalizeText(body.productId, 80);
  const name = normalizeText(body.name, 120);
  const category = normalizeText(body.category, 40);
  const description = normalizeText(body.description, 240);
  const highlight = normalizeText(body.highlight, 80);
  const note = normalizeText(body.note, 240);

  if (!productId) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const isEmpty = !name && !category && !description && !highlight && !note;
  if (isEmpty) {
    await prisma.catalogProductState.deleteMany({ where: { productId } });
    const catalog = await loadMergedCatalog();
    return NextResponse.json({ ok: true, productId, product: catalog.find((item) => item.id === productId) || null });
  }

  const state = await prisma.catalogProductState.upsert({
    where: { productId },
    create: {
      productId,
      name: name || null,
      category: category || null,
      description: description || null,
      highlight: highlight || null,
      note: note || null
    },
    update: {
      name: name || null,
      category: category || null,
      description: description || null,
      highlight: highlight || null,
      note: note || null
    }
  });

  const catalog = await loadMergedCatalog();
  return NextResponse.json({ ok: true, state, product: catalog.find((item) => item.id === productId) || null });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { productId?: unknown };
  const productId = normalizeText(body.productId, 80);
  if (!productId) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  await prisma.catalogProductState.deleteMany({ where: { productId } });
  return NextResponse.json({ ok: true });
}
