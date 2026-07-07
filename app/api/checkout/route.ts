import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createdResponse, errorResponse } from '@/lib/api-helpers';
import { validateEmail, validatePhone } from '@/lib/validators';

interface CheckoutItem {
  productId: string;
  quantity: number;
  price: number;
  grade?: 'ALTO' | 'NORMAL';
}

const isDatabaseUnavailableError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("Can't reach database server") ||
    error.message.includes('PrismaClientInitializationError'));

const toMoney = (value: number) => Number(value.toFixed(2));

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
    const normalizedEmail =
      typeof customerEmail === 'string' && validateEmail(customerEmail.trim())
        ? customerEmail.trim()
        : `sin-correo+${Date.now()}@guategambas.local`;

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

    for (const item of items as CheckoutItem[]) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { category: true },
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

      const itemPrice = Number(item.price);
      if (Number.isNaN(itemPrice) || itemPrice <= 0) {
        return errorResponse(`Invalid price for ${product.name}`, 400);
      }

      const isOrnamentalCategory =
        product.category.slug === 'neocaridinas' || product.category.slug === 'caridinas';
      const highGradePrice = toMoney(product.price);
      const normalGradePrice = toMoney(product.price * 0.85);
      const expectedPrice =
        isOrnamentalCategory && item.grade === 'NORMAL' ? normalGradePrice : highGradePrice;

      if (toMoney(itemPrice) !== expectedPrice) {
        return errorResponse(`Invalid selected grade price for ${product.name}`, 400);
      }

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    const shippingCost = subtotal > 100 ? 0 : 50;
    const total = subtotal + shippingCost;

    // Crear orden
    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail: normalizedEmail,
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
    if (isDatabaseUnavailableError(error)) {
      return errorResponse(
        'Base de datos no disponible. Configura PostgreSQL para procesar pedidos.',
        503
      );
    }
    return errorResponse('Error processing checkout', 500);
  }
}
