import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, createdResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const categories = await db.category.findMany({
      include: { _count: { select: { products: true } } },
    });
    return successResponse(categories);
  } catch (error) {
    return errorResponse('Error fetching categories', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, icon } = body;

    if (!name || !slug) {
      return errorResponse('Missing required fields', 400);
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        description,
        icon,
      },
    });

    return createdResponse(category, 'Category created successfully');
  } catch (error) {
    return errorResponse('Error creating category', 500);
  }
}
