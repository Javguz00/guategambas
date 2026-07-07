import type { Category, Product } from '@/lib/types';

const now = new Date();

const categories: Category[] = [
  {
    id: 'cat-caridinas',
    name: 'Caridinas',
    slug: 'caridinas',
    description: 'Caridinas ornamentales para gambarios especializados.',
    icon: '💎',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat-neocaridinas',
    name: 'Neocaridinas',
    slug: 'neocaridinas',
    description: 'Neocaridinas de grado alto y normal.',
    icon: '🦐',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat-suplementos',
    name: 'Suplementos',
    slug: 'suplementos',
    description: 'Alimentos, bacterias y suplementos para gambas.',
    icon: '🧪',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat-accesorios',
    name: 'Accesorios',
    slug: 'accesorios',
    description: 'Insumos para gambarios y acuarios.',
    icon: '⚙️',
    createdAt: now,
    updatedAt: now,
  },
];

const categoryBySlug = (slug: string): Category =>
  categories.find((category) => category.slug === slug) || categories[0];

const product = (
  id: string,
  name: string,
  slug: string,
  price: number,
  stock: number,
  categorySlug: string,
  description: string,
  image?: string,
  featured = false
): Product => ({
  id,
  name,
  slug,
  price,
  stock,
  categoryId: categoryBySlug(categorySlug).id,
  category: categoryBySlug(categorySlug),
  description,
  image: image || null,
  active: true,
  featured,
  createdAt: now,
  updatedAt: now,
});

const products: Product[] = [
  // Caridinas (precio base grado alto)
  product(
    'prod-car-golden-bee',
    'Golden Bee (5 unidades)',
    'golden-bee-5-unidades',
    200,
    20,
    'caridinas',
    'Pack de 5 por Q200. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/golden-bee/golden-bee.jpg',
    true
  ),
  product(
    'prod-car-tibee',
    'TiBee (5 unidades)',
    'tibee-5-unidades',
    200,
    15,
    'caridinas',
    'Pack de 5 por Q200. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/tibee/product4.jpg'
  ),
  product(
    'prod-car-crs',
    'CRS (5 unidades)',
    'crs-5-unidades',
    200,
    15,
    'caridinas',
    'Pack de 5 por Q200. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/cliente/crs.jpg'
  ),
  product(
    'prod-car-cbs',
    'CBS (5 unidades)',
    'cbs-5-unidades',
    200,
    12,
    'caridinas',
    'Pack de 5 por Q200. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/taiwan-cbs/cbs.jpg'
  ),
  product(
    'prod-car-bluebolt',
    'BlueBolt (5 unidades)',
    'bluebolt-5-unidades',
    1000,
    8,
    'caridinas',
    'Pack de 5 por Q1000. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/cliente/blue-bolt.jpg',
    true
  ),

  // Neocaridinas (precio base grado alto)
  product(
    'prod-neo-bloody-mary',
    'Bloody Mary (5 unidades)',
    'bloody-mary-5-unidades',
    200,
    30,
    'neocaridinas',
    'Pack de 5 por Q200. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/cliente/bloody-mary-alto-grado.jpg',
    true
  ),
  product(
    'prod-neo-green-jade',
    'Green Jade (unidad)',
    'green-jade-unidad',
    125,
    25,
    'neocaridinas',
    'Q125 cada una (5 por Q625). En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/cliente/green-jade-1.jpg'
  ),
  product(
    'prod-neo-orange',
    'Orange (5 unidades)',
    'orange-5-unidades',
    150,
    20,
    'neocaridinas',
    'Pack de 5 por Q150. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/importacion-plantas/orange.jpeg'
  ),
  product(
    'prod-neo-blue-diamond',
    'Blue Diamond (5 unidades)',
    'blue-diamond-5-unidades',
    200,
    15,
    'neocaridinas',
    'Pack de 5 por Q200. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/importacion-plantas/blue velvet.jpeg'
  ),
  product(
    'prod-neo-cherries',
    'Cherries (unidad)',
    'cherries-unidad',
    15,
    80,
    'neocaridinas',
    'Q15 cada una. Promocion: 10 por Q150. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/cherries/cherrys.jpg'
  ),
  product(
    'prod-neo-black',
    'Black (5 unidades)',
    'black-5-unidades',
    175,
    20,
    'neocaridinas',
    'Pack de 5 por Q175. En detalle puedes elegir grado normal con 15% de descuento.',
    '/photos/black-neocaridina/black.jpg'
  ),

  // Suplementos
  product(
    'prod-sup-salty-shrimp',
    'Salty Shrimp GH+ (porcion 20 litros)',
    'salty-shrimp-gh-20-litros',
    10,
    200,
    'suplementos',
    'Q10 por porcion. Promocion 3 porciones por Q25.',
    '/photos/salty-shrimp-gh/alimento-para-gambas.jpg',
    true
  ),
  product(
    'prod-sup-bacter-ae',
    'Bacter AE (10 gramos)',
    'bacter-ae-10-gramos',
    35,
    45,
    'suplementos',
    'Suplemento bacteriano para biofilm y desarrollo de crias.',
    '/photos/cliente/bacter-ae.jpg'
  ),
  product(
    'prod-sup-magic-powder',
    'Magic Powder SL Aqua (10 gramos)',
    'magic-powder-sl-aqua-10-gramos',
    35,
    40,
    'suplementos',
    'Alimento en polvo para juveniles y mantenimiento de colonia.',
    '/photos/magic-powder/magic-powder-10g.jpg'
  ),

  // Accesorios
  product(
    'prod-acc-cholla-restos',
    'Tronco de Cholla (restos)',
    'tronco-cholla-restos',
    5,
    100,
    'accesorios',
    'Restos de cholla para biofilm y refugio.'
  ),
  product(
    'prod-acc-cholla-4',
    'Tronco de Cholla 4 pulgadas',
    'tronco-cholla-4-pulgadas',
    10,
    60,
    'accesorios',
    'Tronco de cholla 4 pulgadas.',
    '/photos/tronco-cholla/troncos-de-cholla.jpg'
  ),
  product(
    'prod-acc-cholla-5',
    'Tronco de Cholla 5 pulgadas',
    'tronco-cholla-5-pulgadas',
    15,
    60,
    'accesorios',
    'Tronco de cholla 5 pulgadas.'
  ),
  product(
    'prod-acc-cholla-6',
    'Tronco de Cholla 6 pulgadas',
    'tronco-cholla-6-pulgadas',
    20,
    60,
    'accesorios',
    'Tronco de cholla 6 pulgadas.'
  ),
  product(
    'prod-acc-cholla-6-grueso',
    'Tronco de Cholla 6 pulgadas grueso',
    'tronco-cholla-6-pulgadas-grueso',
    25,
    40,
    'accesorios',
    'Tronco de cholla 6 pulgadas version gruesa.'
  ),
  product(
    'prod-acc-redes',
    'Red expansible',
    'red-expansible',
    25,
    30,
    'accesorios',
    'Red para manejo y traslado seguro de gambas.'
  ),
  product(
    'prod-acc-valvula-aire',
    'Valvula de flujo de aire',
    'valvula-flujo-aire',
    5,
    80,
    'accesorios',
    'Valvula para regular oxigenacion.'
  ),
  product(
    'prod-acc-hojas-almendro',
    'Hojas de almendro (10 unidades)',
    'hojas-almendro-10-unidades',
    35,
    40,
    'accesorios',
    'Pack de 10 hojas de almendro para acondicionar agua.',
    '/photos/almendro-hojas-10/hojas-de-almendro.jpg'
  ),
  product(
    'prod-acc-filtro-pulmon',
    'Filtro de pulmon con material filtrante',
    'filtro-pulmon-material-filtrante',
    110,
    20,
    'accesorios',
    'Filtro completo para gambarios.',
    '/photos/filtro-pulmon-material/filtro.jpg'
  ),
  product(
    'prod-acc-bomba-sobo-1',
    'Bomba de aire Sobo (1 salida)',
    'bomba-aire-sobo-1-salida',
    45,
    25,
    'accesorios',
    'Bomba de aire de 1 salida.',
    '/photos/bomba-sobo/sobo-548a.jpg'
  ),
  product(
    'prod-acc-bomba-sobo-2',
    'Bomba de aire Sobo (2 salidas)',
    'bomba-aire-sobo-2-salidas',
    70,
    20,
    'accesorios',
    'Bomba de aire de 2 salidas.'
  ),
  product(
    'prod-acc-fluval-libra',
    'Sustrato Fluval Stratum (libra)',
    'sustrato-fluval-stratum-libra',
    55,
    100,
    'accesorios',
    'Q55 por libra.',
    '/photos/fluval-stratum/sustrato-fluval-stratum.jpg',
    true
  ),
  product(
    'prod-acc-shrimp-sand-libra',
    'Shrimp Sand (libra)',
    'shrimp-sand-libra',
    35,
    120,
    'accesorios',
    'Q35 por libra.',
    '/photos/shrimp-sand/shrim-sand.jpg'
  ),
  product(
    'prod-acc-wa-30',
    'Lampara WA One Energy 30 cm',
    'lampara-wa-one-energy-30-cm',
    100,
    35,
    'accesorios',
    'Lampara WA One Energy 30 cm.',
    '/photos/wanenergy-30/wanenergy-28-cm.jpg'
  ),
  product(
    'prod-acc-wa-60',
    'Lampara WA One Energy 60 cm',
    'lampara-wa-one-energy-60-cm',
    150,
    35,
    'accesorios',
    'Lampara WA One Energy 60 cm.',
    '/photos/wanenergy-60/wanenergy-58-cm.jpg'
  ),
];

export function getFallbackCategories(): Array<Category & { _count: { products: number } }> {
  return categories.map((category) => ({
    ...category,
    _count: {
      products: products.filter((item) => item.categoryId === category.id).length,
    },
  }));
}

export function getFallbackProducts(categorySlug?: string): Product[] {
  const activeProducts = products.filter((item) => item.active);
  if (!categorySlug) {
    return activeProducts;
  }

  return activeProducts.filter((item) => item.category?.slug === categorySlug);
}

export function getFallbackProductById(id: string): Product | null {
  return products.find((item) => item.id === id) || null;
}
