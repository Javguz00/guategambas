import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, createdResponse, errorResponse } from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
      items,
      subtotal,
      shippingCost = 0,
      total,
      paymentMethod = 'CONTRAENTREGA',
    } = body;

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
    const productIds = items.map((item: any) => item.productId);
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
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity.toString()),
            price: parseFloat(item.price.toString()),
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
            decrement: parseInt(item.quantity.toString()),
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
