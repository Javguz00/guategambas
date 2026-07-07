import type { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validateMethod,
  getQueryParam,
} from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const category = getQueryParam(request, 'category');

    const where: Prisma.ProductWhereInput = { active: true };
    if (category) {
      where.category = {
        slug: category,
      };
    }

    const products = await prisma.product.findMany({
      include: { category: true },
      where,
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return errorResponse('Error fetching products', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return errorResponse('Unauthorized', 401);
    }

    if (!validateMethod(request, ['POST'])) {
      return errorResponse('Method not allowed', 405);
    }

    const body = await request.json();
    const { name, slug, description, price, stock, categoryId, image } = body;

    if (!name || !slug || !categoryId || price === undefined || stock === undefined) {
      return errorResponse('Missing required fields', 400);
    }

    // Check if slug already exists
    const existing = await prisma.product.findUnique({
      where: { slug },
    });
    if (existing) {
      return errorResponse('Product with this slug already exists', 400);
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price.toString()),
        stock: parseInt(stock.toString(), 10),
        categoryId,
        image,
      },
      include: { category: true },
    });

    return createdResponse(product, 'Product created successfully');
  } catch (error) {
    console.error('Error creating product:', error);
    return errorResponse('Error creating product', 500);
  }
}
