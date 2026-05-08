import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { cleanText } from "@/lib/security";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const products = await prisma.cRMProduct.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: unknown;
    category?: unknown;
    description?: unknown;
    basePrice?: unknown;
    stock?: unknown;
    active?: unknown;
    gradeLabel?: unknown;
    unitLabel?: unknown;
    notes?: unknown;
  };

  const name = cleanText(body.name, 120);
  const category = cleanText(body.category, 40);
  const description = cleanText(body.description, 240) || undefined;
  const basePrice = Number(body.basePrice);
  const stock = body.stock === null || body.stock === undefined || body.stock === "" ? null : Number(body.stock);
  const active = typeof body.active === "boolean" ? body.active : true;
  const gradeLabel = cleanText(body.gradeLabel, 40) || undefined;
  const unitLabel = cleanText(body.unitLabel, 40) || undefined;
  const notes = cleanText(body.notes, 240) || undefined;

  if (!name || !category || !Number.isFinite(basePrice) || basePrice <= 0) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const product = await prisma.cRMProduct.create({
    data: {
      name,
      category,
      description,
      basePrice,
      stock: stock === null ? null : Math.floor(stock),
      active,
      gradeLabel,
      unitLabel,
      notes
    }
  });

  return NextResponse.json({ ok: true, product }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: unknown; name?: unknown; category?: unknown; description?: unknown; basePrice?: unknown; stock?: unknown; active?: unknown; gradeLabel?: unknown; unitLabel?: unknown; notes?: unknown };
  const id = cleanText(body.id, 80);
  const name = cleanText(body.name, 120);
  const category = cleanText(body.category, 40);
  const basePrice = Number(body.basePrice);
  const stock = body.stock === null || body.stock === undefined || body.stock === "" ? null : Number(body.stock);
  const active = typeof body.active === "boolean" ? body.active : true;

  if (!id || !name || !category || !Number.isFinite(basePrice) || basePrice <= 0) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const product = await prisma.cRMProduct.update({
    where: { id },
    data: {
      name,
      category,
      description: cleanText(body.description, 240) || null,
      basePrice,
      stock: stock === null ? null : Math.floor(stock),
      active,
      gradeLabel: cleanText(body.gradeLabel, 40) || null,
      unitLabel: cleanText(body.unitLabel, 40) || null,
      notes: cleanText(body.notes, 240) || null
    }
  });

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = (await request.json()) as { id?: unknown };
  const productId = cleanText(id, 80);
  if (!productId) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  await prisma.cRMProduct.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}