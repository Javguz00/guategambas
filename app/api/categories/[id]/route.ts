import { db } from '@/lib/db';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-helpers';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const category = await db.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      return notFoundResponse('Category not found');
    }

    return successResponse(category);
  } catch {
    return errorResponse('Error fetching category', 500);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, slug, description, icon } = body;

    const category = await db.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        icon,
      },
    });

    return successResponse(category, 'Category updated successfully');
  } catch {
    return errorResponse('Error updating category', 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const category = await db.category.delete({
      where: { id },
    });

    return successResponse(category, 'Category deleted successfully');
  } catch {
    return errorResponse('Error deleting category', 500);
  }
}
