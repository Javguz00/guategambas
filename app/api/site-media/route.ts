import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.mediaMapping.findMany({ where: { productId: "__site__" }, orderBy: { updatedAt: "desc" } });
    const mapping = rows.reduce<Record<string, Array<{ filename: string; grade?: string; slot?: string; title?: string }>>>((acc, row) => {
      acc[row.productId] = acc[row.productId] || [];
      acc[row.productId].push({ filename: row.filename, grade: row.grade || undefined, slot: row.slot || undefined, title: row.title || undefined });
      return acc;
    }, {});
    return NextResponse.json({ mapping });
  } catch {
    return NextResponse.json({ mapping: {} });
  }
}
