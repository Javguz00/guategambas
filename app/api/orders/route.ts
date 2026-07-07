import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, createdResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const orders = await db.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(orders);
  } catch (error) {
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
      items,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
    } = body;

    if (!customerName || !customerEmail || !customerPhone || !city || !items || items.length === 0) {
      return errorResponse('Missing required fields', 400);
    }

    const order = await db.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        city,
        department,
        address,
        notes,
        subtotal: parseFloat(subtotal),
        shippingCost: parseFloat(shippingCost),
        total: parseFloat(total),
        paymentMethod,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    return createdResponse(order, 'Order created successfully');
  } catch (error) {
    return errorResponse('Error creating order', 500);
  }
}
