import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createdResponse, errorResponse } from '@/lib/api-helpers';
import { validateEmail, validatePhone } from '@/lib/validators';

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
      paymentMethod = 'CONTRAENTREGA',
    } = body;

    // Validar datos
    if (!customerName || customerName.trim().length < 2) {
      return errorResponse('Invalid customer name', 400);
    }

    if (!validateEmail(customerEmail)) {
      return errorResponse('Invalid email', 400);
    }

    if (!validatePhone(customerPhone)) {
      return errorResponse('Invalid phone number', 400);
    }

    if (!city || city.trim().length === 0) {
      return errorResponse('City is required', 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse('Cart is empty', 400);
    }

    // Calcular totales y validar stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return errorResponse(`Product ${item.productId} not found`, 404);
      }

      if (product.stock < item.quantity) {
        return errorResponse(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          400
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const shippingCost = 50; // Default shipping cost in GTQ
    const total = subtotal + shippingCost;

    // Crear orden
    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        city,
        department,
        address,
        notes,
        subtotal,
        shippingCost,
        total,
        paymentMethod,
        items: {
          create: orderItems,
        },
      },
      include: { items: { include: { product: true } } },
    });

    // Actualizar stock de productos
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
    console.error('Checkout error:', error);
    return errorResponse('Error processing checkout', 500);
  }
}
