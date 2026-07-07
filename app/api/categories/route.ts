import { prisma } from '@/lib/db';
import { successResponse, createdResponse, errorResponse } from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return errorResponse('Error fetching categories', 500);
  }
}

export async function POST(request: Request) {
  try {
    // Check admin authentication
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { name, slug, description, icon } = body;

    if (!name || !slug) {
      return errorResponse('Missing required fields: name and slug are required', 400);
    }

    // Check if name or slug already exists
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return errorResponse(
        'Category with this name or slug already exists',
        400
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
      },
    });

    return createdResponse(category, 'Category created successfully');
  } catch (error) {
    console.error('Error creating category:', error);
    return errorResponse('Error creating category', 500);
  }
}
