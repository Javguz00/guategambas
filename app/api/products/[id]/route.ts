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
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: { category: true },
    });

    if (!product) {
      return notFoundResponse('Product not found');
    }

    return successResponse(product);
  } catch (error) {
    return errorResponse('Error fetching product', 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const { name, slug, description, price, stock, categoryId, image, active } = body;

    const product = await db.product.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        categoryId,
        image,
        active,
      },
      include: { category: true },
    });

    return successResponse(product, 'Product updated successfully');
  } catch (error) {
    return errorResponse('Error updating product', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const product = await db.product.delete({
      where: { id: params.id },
    });

    return successResponse(product, 'Product deleted successfully');
  } catch (error) {
    return errorResponse('Error deleting product', 500);
  }
}
