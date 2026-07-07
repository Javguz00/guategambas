import { prisma } from '@/lib/db';
import { successResponse, createdResponse, errorResponse } from '@/lib/api-helpers';
import { isAdmin } from '@/lib/auth';
import { getFallbackCategories } from '@/lib/fallback-catalog';

const isDatabaseUnavailableError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("Can't reach database server") ||
    error.message.includes('PrismaClientInitializationError'));

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    if (isDatabaseUnavailableError(error)) {
      return successResponse(
        getFallbackCategories(),
        'Categorias en modo local mientras configuras la base de datos'
      );
    }
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
    if (isDatabaseUnavailableError(error)) {
      return errorResponse(
        'Base de datos no disponible. Configura PostgreSQL para administrar categorias.',
        503
      );
    }
    return errorResponse('Error creating category', 500);
  }
}
