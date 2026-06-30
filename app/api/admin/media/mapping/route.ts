import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function groupMappings(rows: Array<{ productId: string; filename: string; grade?: string | null; slot?: string | null; title?: string | null }>) {
  return rows.reduce<Record<string, Array<{ filename: string; grade?: string; slot?: string; title?: string }>>>((acc, row) => {
    acc[row.productId] = acc[row.productId] || [];
    acc[row.productId].push({
      filename: row.filename,
      grade: row.grade || undefined,
      slot: row.slot || undefined,
      title: row.title || undefined
    });
    return acc;
  }, {});
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await prisma.mediaMapping.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ mapping: groupMappings(rows) });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const { productId, filename, grade, slot, title } = body as { productId?: unknown; filename?: unknown; grade?: unknown; slot?: unknown; title?: unknown };
  if (!productId || typeof productId !== "string" || !filename || typeof filename !== "string") return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  const normalizedSlot = typeof slot === "string" ? slot : undefined;
  const normalizedGrade = typeof grade === "string" ? grade : null;
  const normalizedTitle = typeof title === "string" ? title : null;

  if (normalizedSlot && normalizedSlot !== "gallery") {
    await prisma.mediaMapping.deleteMany({ where: { productId, slot: normalizedSlot } });
  } else if (normalizedSlot === "gallery") {
    await prisma.mediaMapping.deleteMany({ where: { productId, filename, grade: normalizedGrade || undefined, slot: normalizedSlot } });
  } else {
    await prisma.mediaMapping.deleteMany({ where: { productId, filename } });
  }

  await prisma.mediaMapping.create({
    data: {
      productId,
      filename,
      grade: normalizedGrade,
      slot: normalizedSlot,
      title: normalizedTitle
    }
  });

  const rows = await prisma.mediaMapping.findMany({ where: { productId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ ok: true, mapping: rows, productId });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  const { productId, filename } = body as { productId?: unknown; filename?: unknown };
  if (!productId || typeof productId !== "string" || !filename || typeof filename !== "string") return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  await prisma.mediaMapping.deleteMany({ where: { productId, filename } });
  return NextResponse.json({ ok: true });
}
