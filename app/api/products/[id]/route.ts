import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';
import { getFallbackProductById } from '@/lib/fallback-catalog';

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
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return notFoundResponse('Product not found');
    }

    return successResponse(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    if (isDatabaseUnavailableError(error)) {
      const { id } = await context.params;
      const fallbackProduct = getFallbackProductById(id);
      if (!fallbackProduct) {
        return notFoundResponse('Product not found');
      }
      return successResponse(fallbackProduct);
    }
    return errorResponse('Error fetching product', 500);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    // Check admin authentication
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { name, slug, description, price, stock, categoryId, image, active, featured } =
      body;

    // Verify product exists
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Product not found');
    }

    // If slug is being changed, check it's not taken
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return errorResponse('Product with this slug already exists', 400);
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price.toString()) }),
        ...(stock !== undefined && { stock: parseInt(stock.toString(), 10) }),
        ...(categoryId && { categoryId }),
        ...(image !== undefined && { image }),
        ...(active !== undefined && { active }),
        ...(featured !== undefined && { featured }),
      },
      include: { category: true },
    });

    return successResponse(product, 'Product updated successfully');
  } catch (error) {
    console.error('Error updating product:', error);
    if (isDatabaseUnavailableError(error)) {
      return errorResponse(
        'Base de datos no disponible. Configura PostgreSQL para editar productos.',
        503
      );
    }
    return errorResponse('Error updating product', 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    // Check admin authentication
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return errorResponse('Unauthorized', 401);
    }

    const product = await prisma.product.delete({
      where: { id },
    });

    return successResponse(product, 'Product deleted successfully');
  } catch (error) {
    console.error('Error deleting product:', error);
    if (isDatabaseUnavailableError(error)) {
      return errorResponse(
        'Base de datos no disponible. Configura PostgreSQL para eliminar productos.',
        503
      );
    }
    return errorResponse('Error deleting product', 500);
  }
}
