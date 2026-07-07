import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-helpers';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    return successResponse(order);
  } catch (error) {
    return errorResponse('Error fetching order', 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const { status, paymentStatus } = body;

    const order = await db.order.update({
      where: { id: params.id },
      data: {
        status,
        paymentStatus,
      },
      include: { items: { include: { product: true } } },
    });

    return successResponse(order, 'Order updated successfully');
  } catch (error) {
    return errorResponse('Error updating order', 500);
  }
}
