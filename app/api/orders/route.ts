import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, createdResponse, errorResponse } from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';
import type { Order } from '@/lib/types';

const isDatabaseUnavailableError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("Can't reach database server") ||
    error.message.includes('PrismaClientInitializationError'));

interface OrderRequestItem {
  productId: string;
  quantity: number;
  price: number;
}

function buildWhatsAppOrderUrl(input: {
  number: string;
  customerName: string;
  whatsapp: string;
  city: string;
  departamento?: string;
  paymentMethod: string;
  notes?: string;
  items: Array<{ name: string; variantLabel: string; quantity: number }>;
  subtotal: number;
  shippingCost: number;
  shippingMessage?: string;
  orderId: string;
}) {
  const lines = [
    'Hola, quiero confirmar este pedido:',
    ...input.items.map((it) => `${it.name} - ${it.variantLabel} x ${it.quantity}`),
    '',
    `Pedido: ${input.orderId}`,
    `Cliente: ${input.customerName}`,
    `WhatsApp: ${input.whatsapp}`,
    `Ciudad: ${input.city}`,
    `Departamento: ${input.departamento || 'N/A'}`,
    `Método de pago: ${input.paymentMethod === 'DEPOSITO_PREVIO' ? 'Depósito previo' : input.paymentMethod === 'PAGO_CONTRAENTREGA' ? 'Pago contra entrega' : 'Tarjeta'}`,
    input.notes ? `Notas: ${input.notes}` : '',
    '---',
    `Subtotal: Q ${input.subtotal.toFixed(2)}`,
    input.shippingMessage ? `Envío: ${input.shippingMessage}` : `Envío: Q ${input.shippingCost.toFixed(2)}`,
    `Total: Q ${(input.subtotal + input.shippingCost).toFixed(2)}`,
  ].filter(Boolean);

  return `https://wa.me/${input.number.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
}

const normalizeOrderItems = (value: unknown): OrderRequestItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Partial<OrderRequestItem>;
      const quantity = Number(candidate.quantity);
      const price = Number(candidate.price);

      if (
        typeof candidate.productId !== 'string' ||
        candidate.productId.trim().length === 0 ||
        Number.isNaN(quantity) ||
        Number.isNaN(price)
      ) {
        return null;
      }

      return {
        productId: candidate.productId,
        quantity: Math.max(1, Math.floor(quantity)),
        price: Math.max(0, price),
      };
    })
    .filter((item): item is OrderRequestItem => item !== null);
};

export async function GET() {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return errorResponse('Unauthorized', 401);
    }

    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (isDatabaseUnavailableError(error)) {
      return successResponse([] as Order[], 'Sin base de datos configurada aun');
    }
    return errorResponse('Error fetching orders', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      city,
      department,
      address,
      notes,
      items: rawItems,
      subtotal,
      shippingCost = 0,
      total,
      paymentMethod = 'CONTRAENTREGA',
    } = body;
    const items = normalizeOrderItems(rawItems);

    if (!customerName || !customerEmail || !customerPhone || !city || items.length === 0) {
      return errorResponse('Missing required fields', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return errorResponse('Invalid email format', 400);
    }

    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      return errorResponse('One or more products not found', 400);
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return errorResponse(`Insufficient stock for product: ${product?.name}`, 400);
      }
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        city,
        department,
        address,
        notes,
        subtotal: parseFloat(subtotal.toString()),
        shippingCost: parseFloat(shippingCost.toString()),
        total: parseFloat(total.toString()),
        paymentMethod,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    const businessWhatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.ADMIN_WHATSAPP_NUMBER || '50243132549').trim();
    const whatsappUrl = buildWhatsAppOrderUrl({
      number: businessWhatsapp,
      customerName,
      whatsapp: customerPhone,
      city,
      departamento: department,
      paymentMethod,
      notes,
      items: items.map((item, index) => ({
        name: products[index]?.name || 'Producto',
        variantLabel: products[index]?.slug || 'unidad',
        quantity: item.quantity,
      })),
      subtotal: parseFloat(total.toString()),
      shippingCost: parseFloat(shippingCost.toString()),
      orderId: order.id,
    });

    console.info('WhatsApp order URL generated', whatsappUrl);

    return createdResponse(order, 'Order created successfully');
  } catch (error) {
    console.error('Error creating order:', error);
    if (isDatabaseUnavailableError(error)) {
      return errorResponse('Base de datos no disponible. Configura PostgreSQL para guardar ordenes.', 503);
    }
    return errorResponse('Error creating order', 500);
  }
}
