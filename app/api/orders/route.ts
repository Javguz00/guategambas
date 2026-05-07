import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeOrderPayload } from "@/lib/security";

const allowedStatus = ["PENDING", "CONFIRMED", "DELIVERED"] as const;

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
  const sanitized = sanitizeOrderPayload(await request.json());

  if (!sanitized) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      customerName: sanitized.customerName,
      whatsapp: sanitized.whatsapp,
      city: sanitized.city,
      notes: sanitized.notes,
      items: sanitized.items as unknown as Prisma.InputJsonValue,
      total: sanitized.total
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
