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
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: { products: true },
    });

    if (!category) {
      return notFoundResponse('Category not found');
    }

    return successResponse(category);
  } catch (error) {
    return errorResponse('Error fetching category', 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const { name, slug, description, icon } = body;

    const category = await db.category.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description,
        icon,
      },
    });

    return successResponse(category, 'Category updated successfully');
  } catch (error) {
    return errorResponse('Error updating category', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const category = await db.category.delete({
      where: { id: params.id },
    });

    return successResponse(category, 'Category deleted successfully');
  } catch (error) {
    return errorResponse('Error deleting category', 500);
  }
}
