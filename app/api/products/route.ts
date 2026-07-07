import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, createdResponse, errorResponse, validateMethod } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany({
      include: { category: true },
      where: { active: true },
    });
    return successResponse(products);
  } catch (error) {
    return errorResponse('Error fetching products', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateMethod(request, ['POST'])) {
      return errorResponse('Method not allowed', 405);
    }

    const body = await request.json();
    const { name, slug, description, price, stock, categoryId, image } = body;

    if (!name || !slug || !categoryId) {
      return errorResponse('Missing required fields', 400);
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        categoryId,
        image,
      },
      include: { category: true },
    });

    return createdResponse(product, 'Product created successfully');
  } catch (error) {
    return errorResponse('Error creating product', 500);
  }
}
