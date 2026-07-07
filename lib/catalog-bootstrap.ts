import { UserRole } from '@prisma/client';
import { prisma } from './db';
import { hashPassword } from './auth';
import { getFallbackCatalogData } from './fallback-catalog';

let bootstrapPromise: Promise<void> | null = null;

async function seedCatalogIfEmpty() {
  const [categoryCount, productCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);

  if (categoryCount > 0 && productCount > 0) {
    return;
  }

  const fallback = getFallbackCatalogData();

  for (const category of fallback.categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
      },
    });
  }

  const dbCategories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });
  const categoryIdBySlug = new Map(dbCategories.map((category) => [category.slug, category.id]));

  for (const product of fallback.products) {
    const categorySlug = product.category?.slug;
    if (!categorySlug) {
      continue;
    }

    const categoryId = categoryIdBySlug.get(categorySlug);
    if (!categoryId) {
      continue;
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId,
        image: product.image,
        active: product.active,
        featured: product.featured,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId,
        image: product.image,
        active: product.active,
        featured: product.featured,
      },
    });
  }
}

async function ensureDefaultAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'javguz00').trim().toLowerCase();
  const email = (process.env.ADMIN_EMAIL || `${username}@guategambas.com`).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'T0m1llo!';

  await prisma.user.upsert({
    where: { email },
    update: {
      name: username,
      role: UserRole.OWNER,
      active: true,
    },
    create: {
      email,
      password: hashPassword(password),
      name: username,
      role: UserRole.OWNER,
      active: true,
    },
  });
}

export async function ensureCatalogBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await seedCatalogIfEmpty();
      await ensureDefaultAdmin();
    })().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
}

