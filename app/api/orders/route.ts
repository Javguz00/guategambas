import { NextResponse } from "next/server";
import { Prisma, type PaymentMethod as PrismaPaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sanitizeOrderPayload } from "@/lib/security";
import { calculateShipping } from "@/lib/shipping";
import { sendWhatsAppNotification } from "@/lib/notify";

const allowedStatus = ["PENDING", "CONFIRMED", "DELIVERED"] as const;

function buildDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const city = url.searchParams.get("city")?.trim();
  const q = url.searchParams.get("q")?.trim();
  const paymentMethod = url.searchParams.get("paymentMethod")?.trim();
  const from = buildDate(url.searchParams.get("from"));
  const to = buildDate(url.searchParams.get("to"));

  try {
    const orders = await prisma.order.findMany({
      where: {
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(paymentMethod ? { paymentMethod: paymentMethod as PrismaPaymentMethod } : {}),
        ...(q
          ? {
              OR: [
                { customerName: { contains: q, mode: "insensitive" } },
                { whatsapp: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } }
              ]
            }
          : {}),
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
  } catch {
    return NextResponse.json({ orders: [] });
  }
}

export async function POST(request: Request) {
  const raw = await request.json();

  // simple honeypot anti-bot
  if (raw && typeof raw === "object" && "hp" in raw && Boolean((raw as Record<string, unknown>)["hp"])) {
    return NextResponse.json({ error: "Bot detectado" }, { status: 400 });
  }

  const sanitized = sanitizeOrderPayload(raw);

  if (!sanitized) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // server-side shipping validation
  const cartItems = sanitized.items.map((it) => ({ productId: it.productId, variantId: it.variantId, quantity: it.quantity, price: it.unitPrice }));
  const shippingCheck = calculateShipping({ departamento: sanitized.departamento, paymentMethod: sanitized.paymentMethod, orderTotal: sanitized.total, cartItems });
  if (!shippingCheck.isValid) {
    return NextResponse.json({ error: shippingCheck.message || "Envio no disponible" }, { status: 400 });
  }

  const shippingCost = shippingCheck.shippingCost;

  const orderPayload = {
    customerName: sanitized.customerName,
    email: sanitized.email || null,
    whatsapp: sanitized.whatsapp,
    city: sanitized.city,
    departamento: sanitized.departamento,
    paymentMethod: sanitized.paymentMethod,
    paymentStatus: "PENDING" as const,
    paymentProvider: sanitized.paymentMethod === "TARJETA_CUBO" ? "CUBO" : "MANUAL",
    paymentReference: null,
    notes: sanitized.notes,
    items: sanitized.items as unknown as Prisma.InputJsonValue,
    total: sanitized.total,
    shippingCost,
    status: "PENDING" as const,
    createdAt: new Date().toISOString(),
    persisted: true
  };

  let order = {
    id: "",
    ...orderPayload
  };

  try {
    await prisma.customer.upsert({
      where: { whatsapp: sanitized.whatsapp },
      create: {
        fullName: sanitized.customerName,
        whatsapp: sanitized.whatsapp,
        department: sanitized.departamento || null,
        notes: sanitized.notes || null
      },
      update: {
        fullName: sanitized.customerName,
        department: sanitized.departamento || null,
        notes: sanitized.notes || null
      }
    });

    const createdOrder = await prisma.order.create({
      data: {
        customerName: sanitized.customerName,
        email: sanitized.email || null,
        whatsapp: sanitized.whatsapp,
        city: sanitized.city,
        departamento: sanitized.departamento,
        paymentMethod: sanitized.paymentMethod,
        paymentStatus: "PENDING",
        paymentProvider: sanitized.paymentMethod === "TARJETA_CUBO" ? "CUBO" : "MANUAL",
        notes: sanitized.notes,
        items: sanitized.items as unknown as Prisma.InputJsonValue,
        total: sanitized.total,
        shippingCost
      }
    });

    order = { ...orderPayload, id: createdOrder.id, createdAt: createdOrder.createdAt.toISOString() };
  } catch {
    order = { ...orderPayload, id: `manual-${Date.now()}` };
  }

  // Notify admin via WhatsApp if possible (best-effort)
  try {
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || "50243132549";
    const itemsList = (sanitized.items || []) as Array<{ name?: string; variantLabel?: string; quantity?: number }>;
    const lines = [
      "Nuevo pedido registrado:",
      ...itemsList.map((it) => `${it.name || "item"} - ${it.variantLabel || "-"} x ${it.quantity || 0}`),
      "",
      `Cliente: ${sanitized.customerName}`,
      `WhatsApp: ${sanitized.whatsapp}`,
      `Ciudad: ${sanitized.city}`,
      `Departamento: ${sanitized.departamento}`,
      `Metodo: ${sanitized.paymentMethod}`,
      `Subtotal: Q ${sanitized.total.toFixed(2)}`,
      `Envio: Q ${shippingCost.toFixed(2)}`,
      shippingCheck.message ? `Nota de envío: ${shippingCheck.message}` : "",
      `Total: Q ${(sanitized.total + shippingCost).toFixed(2)}`
    ];

    const msg = lines.join("\n");
    // best-effort, do not block order creation
    void sendWhatsAppNotification(adminNumber, msg);
  } catch {
    // ignore notification failures
  }

  // send email receipt to customer when email provided (best-effort)
  try {
    if (sanitized.email) {
      const { sendEmailReceipt, renderReceiptTemplate } = await import("@/lib/mailer");
      const html = renderReceiptTemplate({ ...sanitized });
      void sendEmailReceipt(sanitized.email, "Confirmación de tu pedido — GuateGambas", html);
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, order }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
