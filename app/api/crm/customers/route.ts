import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { cleanText, normalizeWhatsapp } from "@/lib/security";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    fullName?: unknown;
    whatsapp?: unknown;
    email?: unknown;
    department?: unknown;
    notes?: unknown;
  };

  const fullName = cleanText(body.fullName, 80);
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  const email = cleanText(body.email, 120);
  const department = cleanText(body.department, 80) || undefined;
  const notes = cleanText(body.notes, 240) || undefined;

  if (!fullName || !whatsapp) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const customer = await prisma.customer.upsert({
    where: { whatsapp },
    create: { fullName, whatsapp, email: email || undefined, department, notes },
    update: { fullName, email: email || undefined, department, notes }
  });

  return NextResponse.json({ ok: true, customer }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: unknown; fullName?: unknown; whatsapp?: unknown; email?: unknown; department?: unknown; notes?: unknown };
  const id = cleanText(body.id, 80);
  const fullName = cleanText(body.fullName, 80);
  const whatsapp = normalizeWhatsapp(body.whatsapp);

  if (!id || !fullName || !whatsapp) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      fullName,
      whatsapp,
      email: cleanText(body.email, 120) || null,
      department: cleanText(body.department, 80) || null,
      notes: cleanText(body.notes, 240) || null
    }
  });

  return NextResponse.json({ ok: true, customer });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = (await request.json()) as { id?: unknown };
  const customerId = cleanText(id, 80);
  if (!customerId) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  await prisma.customer.delete({ where: { id: customerId } });
  return NextResponse.json({ ok: true });
}