import type { Category, Product } from '@/lib/types';

const now = new Date();

const categories: Category[] = [
  {
    id: 'cat-neocaridinas',
    name: 'Neocaridinas',
    slug: 'neocaridinas',
    description: 'Líneas Neocaridina para gambarios plantados y de bajo mantenimiento.',
    icon: '🦐',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat-caridinas',
    name: 'Caridinas',
    slug: 'caridinas',
    description: 'Caridinas selectas para criadores y gambarios especializados.',
    icon: '💎',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat-alimentos',
    name: 'Alimentos y bacterias',
    slug: 'alimentos-bacterias',
    description: 'Nutricion y suplementos para mantener colonias saludables.',
    icon: '🥬',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat-insumos',
    name: 'Insumos para gambario y acuario',
    slug: 'insumos-gambario-acuario',
    description: 'Sustratos, minerales, filtros y accesorios para tus urnas.',
    icon: '⚙️',
    createdAt: now,
    updatedAt: now,
  },
];

const findCategory = (slug: string): Category =>
  categories.find((category) => category.slug === slug) || categories[0];

const products: Product[] = [
  {
    id: 'prod-bloody-mary',
    name: 'Neocaridina Bloody Mary',
    slug: 'neocaridina-bloody-mary',
    description: 'Color rojo intenso, ideal para colonias vistosas en gambario plantado.',
    price: 25,
    stock: 45,
    categoryId: 'cat-neocaridinas',
    category: findCategory('neocaridinas'),
    image: '/photos/cliente/bloody-mary-alto-grado.jpg',
    active: true,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-green-jade',
    name: 'Neocaridina Green Jade',
    slug: 'neocaridina-green-jade',
    description: 'Variedad verde vibrante, muy buscada para aquascaping.',
    price: 28,
    stock: 30,
    categoryId: 'cat-neocaridinas',
    category: findCategory('neocaridinas'),
    image: '/photos/cliente/green-jade-1.jpg',
    active: true,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-cherry',
    name: 'Neocaridina Cherry',
    slug: 'neocaridina-cherry',
    description: 'Excelente opcion para iniciar en el mundo de las gambas ornamentales.',
    price: 18,
    stock: 60,
    categoryId: 'cat-neocaridinas',
    category: findCategory('neocaridinas'),
    image: '/photos/cherries/cherrys.jpg',
    active: true,
    featured: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-crs',
    name: 'Caridina CRS',
    slug: 'caridina-crs',
    description: 'Crystal Red Shrimp para gambarios maduros de parametros estables.',
    price: 55,
    stock: 24,
    categoryId: 'cat-caridinas',
    category: findCategory('caridinas'),
    image: '/photos/cliente/crs.jpg',
    active: true,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-blue-bolt',
    name: 'Caridina Blue Bolt',
    slug: 'caridina-blue-bolt',
    description: 'Coloracion azul y blanca premium, excelente para lineas selectas.',
    price: 75,
    stock: 15,
    categoryId: 'cat-caridinas',
    category: findCategory('caridinas'),
    image: '/photos/cliente/blue-bolt.jpg',
    active: true,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-golden-bee',
    name: 'Caridina Golden Bee',
    slug: 'caridina-golden-bee',
    description: 'Variedad clara y elegante para acuarios de exhibicion.',
    price: 68,
    stock: 20,
    categoryId: 'cat-caridinas',
    category: findCategory('caridinas'),
    image: '/photos/golden-bee/golden-bee.jpg',
    active: true,
    featured: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-bacter-ae',
    name: 'Bacter AE',
    slug: 'bacter-ae',
    description: 'Suplemento bacteriano para biofilm y mejor desarrollo de crias.',
    price: 135,
    stock: 18,
    categoryId: 'cat-alimentos',
    category: findCategory('alimentos-bacterias'),
    image: '/photos/cliente/bacter-ae.jpg',
    active: true,
    featured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-food-20g',
    name: 'Alimento premium 20g',
    slug: 'alimento-premium-20g',
    description: 'Alimento balanceado para neocaridinas y caridinas.',
    price: 45,
    stock: 35,
    categoryId: 'cat-alimentos',
    category: findCategory('alimentos-bacterias'),
    image: '/photos/cliente/alimento-20-gramos.jpg',
    active: true,
    featured: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-salty-shrimp',
    name: 'Salty Shrimp GH+',
    slug: 'salty-shrimp-gh-plus',
    description: 'Mineralizador para preparar agua estable para caridinas.',
    price: 160,
    stock: 12,
    categoryId: 'cat-insumos',
    category: findCategory('insumos-gambario-acuario'),
    image: '/photos/salty-shrimp-gh/salty-shrimp-gh.jpg',
    active: true,
    featured: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'prod-fluval-stratum',
    name: 'Fluval Stratum',
    slug: 'fluval-stratum',
    description: 'Sustrato activo recomendado para gambarios y acuarios plantados.',
    price: 230,
    stock: 10,
    categoryId: 'cat-insumos',
    category: findCategory('insumos-gambario-acuario'),
    image: '/photos/fluval-stratum/sustrato-fluval-stratum.jpg',
    active: true,
    featured: false,
    createdAt: now,
    updatedAt: now,
  },
];

export function getFallbackCategories(): Array<Category & { _count: { products: number } }> {
  return categories.map((category) => ({
    ...category,
    _count: {
      products: products.filter((product) => product.categoryId === category.id).length,
    },
  }));
}

export function getFallbackProducts(categorySlug?: string): Product[] {
  const activeProducts = products.filter((product) => product.active);
  if (!categorySlug) {
    return activeProducts;
  }

  return activeProducts.filter((product) => product.category?.slug === categorySlug);
}

export function getFallbackProductById(id: string): Product | null {
  return products.find((product) => product.id === id) || null;
}
