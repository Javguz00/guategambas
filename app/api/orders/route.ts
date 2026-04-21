import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedStatus = ["PENDING", "CONFIRMED", "DELIVERED"] as const;

type ApiOrderItem = {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  category: string;
  unit: string;
  unitPrice: number;
  quantity: number;
};

function buildDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city")?.trim();
  const from = buildDate(url.searchParams.get("from"));
  const to = buildDate(url.searchParams.get("to"));

  const orders = await prisma.order.findMany({
    where: {
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {})
            }
          }
        : {})
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    customerName: string;
    whatsapp: string;
    city: string;
    notes?: string;
    items: ApiOrderItem[];
    total: number;
  };

  if (!body.customerName || !body.whatsapp || !body.city || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const invalidItem = body.items.find(
    (item) =>
      !item.productId ||
      !item.variantId ||
      !item.name ||
      !item.variantLabel ||
      !item.category ||
      !item.unit ||
      Number(item.unitPrice) <= 0 ||
      Number(item.quantity) <= 0
  );

  if (invalidItem) {
    return NextResponse.json({ error: "Items invalidos en el pedido" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      customerName: body.customerName,
      whatsapp: body.whatsapp,
      city: body.city,
      notes: body.notes || "",
      items: body.items,
      total: Number(body.total || 0)
    }
  });

  return NextResponse.json({ ok: true, order }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: string; status?: string };

  if (!body.id || !body.status || !allowedStatus.includes(body.status as (typeof allowedStatus)[number])) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id: body.id },
    data: {
      status: body.status as "PENDING" | "CONFIRMED" | "DELIVERED"
    }
  });

  return NextResponse.json({ ok: true, order });
}
