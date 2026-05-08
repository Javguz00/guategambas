import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cleanText, normalizeWhatsapp } from "@/lib/security";
import { getCuboConfig, getCuboReadinessMessage, isCuboReady } from "@/lib/cubo";

export async function GET() {
  const config = getCuboConfig();
  return NextResponse.json({ ready: isCuboReady(config), message: getCuboReadinessMessage(config) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: unknown;
    amount?: unknown;
    currency?: unknown;
    customerName?: unknown;
    customerWhatsapp?: unknown;
    metadata?: unknown;
  };

  const orderId = cleanText(body.orderId, 80) || undefined;
  const amount = Number(body.amount);
  const currency = cleanText(body.currency, 8) || "GTQ";
  const customerName = cleanText(body.customerName, 80);
  const customerWhatsapp = normalizeWhatsapp(body.customerWhatsapp);

  if (!customerName || !customerWhatsapp || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const config = getCuboConfig();
  const ready = isCuboReady(config);

  const paymentAttempt = await prisma.paymentAttempt.create({
    data: {
      orderId,
      amount,
      currency,
      status: ready ? "PENDING" : "DRAFT",
      customerName,
      customerWhatsapp,
      metadata: typeof body.metadata === "object" && body.metadata !== null ? (body.metadata as Prisma.InputJsonValue) : undefined
    }
  });

  return NextResponse.json({
    ready,
    provider: "CUBO",
    message: getCuboReadinessMessage(config),
    checkoutUrl: ready ? config.checkoutUrl || null : null,
    paymentAttempt
  });
}