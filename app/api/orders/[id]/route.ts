import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';

const isDatabaseUnavailableError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("Can't reach database server") ||
    error.message.includes('PrismaClientInitializationError'));

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return notFoundResponse('Order not found');
    }

    return successResponse(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    if (isDatabaseUnavailableError(error)) {
      return successResponse(null, 'Sin base de datos configurada aun');
    }
    return errorResponse('Error fetching order', 500);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Check admin authentication
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await context.params;

    const body = await request.json();
    const { status, paymentStatus } = body;

    // Verify order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return notFoundResponse('Order not found');
    }

    // Validate status values if provided
    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    if (status && !validStatuses.includes(status)) {
      return errorResponse('Invalid status value', 400);
    }

    const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'CANCELLED'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return errorResponse('Invalid payment status value', 400);
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: { items: { include: { product: true } } },
    });

    return successResponse(order, 'Order updated successfully');
  } catch (error) {
    console.error('Error updating order:', error);
    if (isDatabaseUnavailableError(error)) {
      return errorResponse(
        'Base de datos no disponible. Configura PostgreSQL para actualizar ordenes.',
        503
      );
    }
    return errorResponse('Error updating order', 500);
  }
}
