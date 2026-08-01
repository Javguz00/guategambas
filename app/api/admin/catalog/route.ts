import { NextRequest, NextResponse } from "next/server";
import { ensureAdminStorage } from "@/lib/admin-storage";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { withSchemaProtection } from "@/lib/middleware/with-schema-protection";
import { products } from "@/lib/data";
import { extractInventoryRows, inventoryToMap, mergeCatalogInventory, mergeCatalogProductState } from "@/lib/catalog";

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

type CatalogProductStateRow = {
  productId: string;
  name: string | null;
  category: string | null;
  description: string | null;
  highlight: string | null;
  note: string | null;
};

type CatalogVariantStateRow = {
  productId: string;
  variantLabel: string;
  stock: number;
  price: number | null;
};

async function loadCatalogState() {
  await ensureAdminStorage();

  const [variantRows, productRows] = await Promise.all([
    prisma.$queryRawUnsafe<CatalogVariantStateRow[]>(`SELECT "productId", "variantLabel", "stock", "price" FROM "CatalogVariantState"`).catch(() => [] as CatalogVariantStateRow[]),
    prisma.$queryRawUnsafe<CatalogProductStateRow[]>(`SELECT "productId", "name", "category", "description", "highlight", "note" FROM "CatalogProductState"`).catch(() => [] as CatalogProductStateRow[])
  ]);

  return { variantRows, productRows };
}

async function loadMergedCatalog() {
  const { variantRows, productRows } = await loadCatalogState();

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

async function handleGET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await ensureAdminStorage();
  } catch (err) {
    console.error("ensureAdminStorage failed (GET /api/admin/catalog)", err);
    return NextResponse.json({ error: "Fallo de esquema en la base de datos. Ejecuta las migraciones (prisma migrate deploy) o habilita permisos DDL." }, { status: 500 });
  }

  const [{ variantRows, productRows }, catalog] = await Promise.all([
    loadCatalogState(),
    loadMergedCatalog()
  ]);

  const productStates = productRows.reduce<Record<string, { name?: string | null; category?: string | null; description?: string | null; highlight?: string | null; note?: string | null }>>((acc, row) => {
    acc[row.productId] = {
      name: row.name,
      category: row.category,
      description: row.description,
      highlight: row.highlight,
      note: row.note
    };
    return acc;
  }, {});

  return NextResponse.json({
    products: catalog,
    productStates,
    inventory: extractInventoryRows(catalog)
  });
}

async function handlePATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await ensureAdminStorage();
  } catch (err) {
    console.error("ensureAdminStorage failed (PATCH /api/admin/catalog)", err);
    return NextResponse.json({ error: "Fallo de esquema en la base de datos. Ejecuta las migraciones (prisma migrate deploy) o habilita permisos DDL." }, { status: 500 });
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
    await prisma.$executeRaw`DELETE FROM "CatalogProductState" WHERE "productId" = ${productId}`;
    const catalog = await loadMergedCatalog();
    return NextResponse.json({ ok: true, productId, product: catalog.find((item) => item.id === productId) || null });
  }

  await prisma.$executeRaw`
    INSERT INTO "CatalogProductState" ("productId", "name", "category", "description", "highlight", "note", "updatedAt", "createdAt")
    VALUES (${productId}, ${name || null}, ${category || null}, ${description || null}, ${highlight || null}, ${note || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("productId") DO UPDATE SET
      "name" = EXCLUDED."name",
      "category" = EXCLUDED."category",
      "description" = EXCLUDED."description",
      "highlight" = EXCLUDED."highlight",
      "note" = EXCLUDED."note",
      "updatedAt" = CURRENT_TIMESTAMP
  `;

  const catalog = await loadMergedCatalog();
  return NextResponse.json({ ok: true, productId, product: catalog.find((item) => item.id === productId) || null });
}

async function handleDELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureAdminStorage();

  const body = (await request.json()) as { productId?: unknown };
  const productId = normalizeText(body.productId, 80);
  if (!productId) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  await prisma.$executeRaw`DELETE FROM "CatalogProductState" WHERE "productId" = ${productId}`;
  return NextResponse.json({ ok: true });
}

export const GET = withSchemaProtection(async (request) => {
  void request;
  return handleGET();
});
export const PATCH = withSchemaProtection(async (request) => handlePATCH(request as NextRequest));
export const DELETE = withSchemaProtection(async (request) => handleDELETE(request as NextRequest));
