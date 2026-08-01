import { NextRequest, NextResponse } from "next/server";
import { ensureAdminStorage } from "@/lib/admin-storage";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { withSchemaProtection } from "@/lib/middleware/with-schema-protection";

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

async function handleGET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await ensureAdminStorage();
  } catch (err) {
    console.error("ensureAdminStorage failed (GET /api/admin/media/mapping)", err);
    return NextResponse.json({ error: "Fallo de esquema en la base de datos. Ejecuta las migraciones (prisma migrate deploy) o habilita permisos DDL." }, { status: 500 });
  }
  const rows = await prisma.mediaMapping.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ mapping: groupMappings(rows) });
}

async function handlePOST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await ensureAdminStorage();
  } catch (err) {
    console.error("ensureAdminStorage failed (POST /api/admin/media/mapping)", err);
    return NextResponse.json({ error: "Fallo de esquema en la base de datos. Ejecuta las migraciones (prisma migrate deploy) o habilita permisos DDL." }, { status: 500 });
  }
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

async function handleDELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await ensureAdminStorage();
  } catch (err) {
    console.error("ensureAdminStorage failed (DELETE /api/admin/media/mapping)", err);
    return NextResponse.json({ error: "Fallo de esquema en la base de datos. Ejecuta las migraciones (prisma migrate deploy) o habilita permisos DDL." }, { status: 500 });
  }
  const body = await request.json();
  const { productId, filename } = body as { productId?: unknown; filename?: unknown };
  if (!productId || typeof productId !== "string" || !filename || typeof filename !== "string") return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  await prisma.mediaMapping.deleteMany({ where: { productId, filename } });
  return NextResponse.json({ ok: true });
}

export const GET = withSchemaProtection(async (request) => {
  void request;
  return handleGET();
});
export const POST = withSchemaProtection(async (request) => handlePOST(request as NextRequest));
export const DELETE = withSchemaProtection(async (request) => handleDELETE(request as NextRequest));
