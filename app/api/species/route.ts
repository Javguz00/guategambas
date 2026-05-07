import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { products } from "@/lib/data";
import { inventoryToMap, mergeCatalogInventory } from "@/lib/catalog";

export async function GET() {
  const rows = await prisma.catalogVariantState.findMany();
  const inventory = inventoryToMap(rows);
  const catalog = mergeCatalogInventory(products, inventory);
  return NextResponse.json({ products: catalog });
}
