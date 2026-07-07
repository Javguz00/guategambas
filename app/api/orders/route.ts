import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, createdResponse, errorResponse } from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';

interface OrderRequestItem {
  productId: string;
  quantity: number;
  price: number;
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
    // Only admin can see all orders
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

    // Validation
    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !city ||
      !items ||
      items.length === 0
    ) {
      return errorResponse('Missing required fields', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return errorResponse('Invalid email format', 400);
    }

    // Validate and fetch products
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      return errorResponse('One or more products not found', 400);
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return errorResponse(
          `Insufficient stock for product: ${product?.name}`,
          400
        );
      }
    }

    // Create order
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

    // Update product stock
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

    return createdResponse(order, 'Order created successfully');
  } catch (error) {
    console.error('Error creating order:', error);
    return errorResponse('Error creating order', 500);
  }
}
