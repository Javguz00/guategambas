import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

type CategoryInput = {
  name: string;
  slug: string;
  description: string;
  icon: string;
};

type ProductInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categorySlug: string;
  image?: string;
  featured?: boolean;
};

const categoryInputs: CategoryInput[] = [
  {
    name: 'Caridinas',
    slug: 'caridinas',
    description: 'Caridinas ornamentales para gambarios especializados.',
    icon: '💎',
  },
  {
    name: 'Neocaridinas',
    slug: 'neocaridinas',
    description: 'Neocaridinas de grado alto y normal.',
    icon: '🦐',
  },
  {
    name: 'Suplementos',
    slug: 'suplementos',
    description: 'Alimentos, bacterias y suplementos para gambas.',
    icon: '🧪',
  },
  {
    name: 'Accesorios',
    slug: 'accesorios',
    description: 'Insumos para gambarios y acuarios.',
    icon: '⚙️',
  },
];

const productInputs: ProductInput[] = [
  { name: 'Golden Bee (5 unidades)', slug: 'golden-bee-5-unidades', description: 'Pack de 5 por Q200. Opcion de grado normal en detalle (-15%).', price: 200, stock: 20, categorySlug: 'caridinas', image: '/photos/golden-bee/golden-bee.jpg', featured: true },
  { name: 'TiBee (5 unidades)', slug: 'tibee-5-unidades', description: 'Pack de 5 por Q200. Opcion de grado normal en detalle (-15%).', price: 200, stock: 15, categorySlug: 'caridinas', image: '/photos/tibee/tibee.jpg' },
  { name: 'CRS (5 unidades)', slug: 'crs-5-unidades', description: 'Pack de 5 por Q200. Opcion de grado normal en detalle (-15%).', price: 200, stock: 15, categorySlug: 'caridinas', image: '/photos/cliente/crs.jpg' },
  { name: 'CBS (5 unidades)', slug: 'cbs-5-unidades', description: 'Pack de 5 por Q200. Opcion de grado normal en detalle (-15%).', price: 200, stock: 12, categorySlug: 'caridinas', image: '/photos/taiwan-cbs/taiwan-cbs.jpg' },
  { name: 'BlueBolt (5 unidades)', slug: 'bluebolt-5-unidades', description: 'Pack de 5 por Q1000. Opcion de grado normal en detalle (-15%).', price: 1000, stock: 8, categorySlug: 'caridinas', image: '/photos/cliente/blue-bolt.jpg', featured: true },
  { name: 'Bloody Mary (5 unidades)', slug: 'bloody-mary-5-unidades', description: 'Pack de 5 por Q200. Opcion de grado normal en detalle (-15%).', price: 200, stock: 30, categorySlug: 'neocaridinas', image: '/photos/cliente/bloody-mary-alto-grado.jpg', featured: true },
  { name: 'Green Jade (unidad)', slug: 'green-jade-unidad', description: 'Q125 cada una (5 por Q625). Opcion de grado normal en detalle (-15%).', price: 125, stock: 25, categorySlug: 'neocaridinas', image: '/photos/cliente/green-jade-1.jpg' },
  { name: 'Orange (5 unidades)', slug: 'orange-5-unidades', description: 'Pack de 5 por Q150. Opcion de grado normal en detalle (-15%).', price: 150, stock: 20, categorySlug: 'neocaridinas', image: '/photos/orange/orange.jpg' },
  { name: 'Blue Diamond (5 unidades)', slug: 'blue-diamond-5-unidades', description: 'Pack de 5 por Q200. Opcion de grado normal en detalle (-15%).', price: 200, stock: 15, categorySlug: 'neocaridinas', image: '/photos/blue-velvet/blue-velvet.jpg' },
  { name: 'Cherries (unidad)', slug: 'cherries-unidad', description: 'Q15 cada una. Promocion: 10 por Q150. Opcion de grado normal en detalle (-15%).', price: 15, stock: 80, categorySlug: 'neocaridinas', image: '/photos/cherries/cherrys.jpg' },
  { name: 'Black (5 unidades)', slug: 'black-5-unidades', description: 'Pack de 5 por Q175. Opcion de grado normal en detalle (-15%).', price: 175, stock: 20, categorySlug: 'neocaridinas', image: '/photos/black-neocaridina/black.jpg' },
  { name: 'Salty Shrimp GH+ (porcion 20 litros)', slug: 'salty-shrimp-gh-20-litros', description: 'Q10 por porcion. 3 porciones por Q25.', price: 10, stock: 200, categorySlug: 'suplementos', image: '/photos/salty-shrimp-gh/salty-shrimp-gh.jpg', featured: true },
  { name: 'Bacter AE (10 gramos)', slug: 'bacter-ae-10-gramos', description: 'Q35.', price: 35, stock: 45, categorySlug: 'suplementos', image: '/photos/cliente/bacter-ae.jpg' },
  { name: 'Magic Powder SL Aqua (10 gramos)', slug: 'magic-powder-sl-aqua-10-gramos', description: 'Q35.', price: 35, stock: 40, categorySlug: 'suplementos', image: '/photos/magic-powder/magic-powder.jpg' },
  { name: 'Tronco de Cholla (restos)', slug: 'tronco-cholla-restos', description: 'Q5.', price: 5, stock: 100, categorySlug: 'accesorios' },
  { name: 'Tronco de Cholla 4 pulgadas', slug: 'tronco-cholla-4-pulgadas', description: 'Q10.', price: 10, stock: 60, categorySlug: 'accesorios', image: '/photos/tronco-cholla/tronco-cholla.jpg' },
  { name: 'Tronco de Cholla 5 pulgadas', slug: 'tronco-cholla-5-pulgadas', description: 'Q15.', price: 15, stock: 60, categorySlug: 'accesorios' },
  { name: 'Tronco de Cholla 6 pulgadas', slug: 'tronco-cholla-6-pulgadas', description: 'Q20.', price: 20, stock: 60, categorySlug: 'accesorios' },
  { name: 'Tronco de Cholla 6 pulgadas grueso', slug: 'tronco-cholla-6-pulgadas-grueso', description: 'Q25.', price: 25, stock: 40, categorySlug: 'accesorios' },
  { name: 'Red expansible', slug: 'red-expansible', description: 'Q25 cada una.', price: 25, stock: 30, categorySlug: 'accesorios' },
  { name: 'Valvula de flujo de aire', slug: 'valvula-flujo-aire', description: 'Q5 cada una.', price: 5, stock: 80, categorySlug: 'accesorios' },
  { name: 'Hojas de almendro (10 unidades)', slug: 'hojas-almendro-10-unidades', description: '10 por Q35.', price: 35, stock: 40, categorySlug: 'accesorios', image: '/photos/almendro-hojas-10/almendro-hojas-10.jpg' },
  { name: 'Filtro de pulmon con material filtrante', slug: 'filtro-pulmon-material-filtrante', description: 'Q110.', price: 110, stock: 20, categorySlug: 'accesorios', image: '/photos/filtro-pulmon-material/filtro-pulmon-material.jpg' },
  { name: 'Bomba de aire Sobo (1 salida)', slug: 'bomba-aire-sobo-1-salida', description: 'Q45.', price: 45, stock: 25, categorySlug: 'accesorios', image: '/photos/bomba-sobo/bomba-sobo.jpg' },
  { name: 'Bomba de aire Sobo (2 salidas)', slug: 'bomba-aire-sobo-2-salidas', description: 'Q70.', price: 70, stock: 20, categorySlug: 'accesorios' },
  { name: 'Sustrato Fluval Stratum (libra)', slug: 'sustrato-fluval-stratum-libra', description: 'Q55 la libra.', price: 55, stock: 100, categorySlug: 'accesorios', image: '/photos/fluval-stratum/sustrato-fluval-stratum.jpg', featured: true },
  { name: 'Shrimp Sand (libra)', slug: 'shrimp-sand-libra', description: 'Q35 la libra.', price: 35, stock: 120, categorySlug: 'accesorios', image: '/photos/shrimp-sand/shrimp-sand.jpg' },
  { name: 'Lampara WA One Energy 30 cm', slug: 'lampara-wa-one-energy-30-cm', description: 'Q100 cada una.', price: 100, stock: 35, categorySlug: 'accesorios', image: '/photos/wanenergy-30/wanenergy-30.jpg' },
  { name: 'Lampara WA One Energy 60 cm', slug: 'lampara-wa-one-energy-60-cm', description: 'Q150 cada una.', price: 150, stock: 35, categorySlug: 'accesorios', image: '/photos/wanenergy-60/wanenergy-60.jpg' },
];

async function main() {
  console.log('Starting seed...');

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@guategambas.com',
      password: hashPassword(process.env.ADMIN_PASSWORD || 'admin123'),
      name: 'Admin GuateGambas',
      role: 'OWNER',
      active: true,
    },
  });
  console.log('Admin user created:', admin.email);

  const categoryMap = new Map<string, string>();
  for (const input of categoryInputs) {
    const category = await prisma.category.create({ data: input });
    categoryMap.set(input.slug, category.id);
  }

  for (const input of productInputs) {
    await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        price: input.price,
        stock: input.stock,
        categoryId: categoryMap.get(input.categorySlug) as string,
        image: input.image || null,
        active: true,
        featured: Boolean(input.featured),
      },
    });
  }

  console.log(`Seed completed with ${categoryInputs.length} categories and ${productInputs.length} products.`);
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

