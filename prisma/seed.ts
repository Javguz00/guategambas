import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create admin user
  const adminPassword = hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@guategambas.com',
      password: adminPassword,
      name: 'Admin GuateGambas',
      role: 'ADMIN',
      active: true,
    },
  });
  console.log('✓ Admin user created:', admin.email);

  // 2. Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Neocaridinas',
        slug: 'neocaridinas',
        description: 'Variedades neocaridina resistentes y de gran coloracion',
        icon: '🦐',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Caridinas',
        slug: 'caridinas',
        description: 'Caridinas selectas para gambarios maduros',
        icon: '💎',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Alimentos y bacterias',
        slug: 'alimentos-bacterias',
        description: 'Nutricion y suplementacion para colonias saludables',
        icon: '🧪',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Insumos para gambario y acuario',
        slug: 'insumos-gambario-acuario',
        description: 'Sustratos, minerales y accesorios especializados',
        icon: '⚙️',
      },
    }),
  ]);
  console.log('✓ Categories created:', categories.length);

  // 3. Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Neocaridina Bloody Mary',
        slug: 'neocaridina-bloody-mary',
        description: 'Color rojo intenso y excelente adaptacion para gambarios plantados',
        price: 25.0,
        stock: 45,
        categoryId: categories[0].id,
        image: '/photos/cliente/bloody-mary-alto-grado.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Neocaridina Green Jade',
        slug: 'neocaridina-green-jade',
        description: 'Variedad verde muy buscada para acuarios de exhibicion',
        price: 28.0,
        stock: 30,
        categoryId: categories[0].id,
        image: '/photos/cliente/green-jade-1.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Caridina CRS',
        slug: 'caridina-crs',
        description: 'Crystal Red Shrimp para criadores y parametros controlados',
        price: 55.0,
        stock: 24,
        categoryId: categories[1].id,
        image: '/photos/cliente/crs.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Caridina Blue Bolt',
        slug: 'caridina-blue-bolt',
        description: 'Blue Bolt de alta seleccion para gambarios especializados',
        price: 75.0,
        stock: 15,
        categoryId: categories[1].id,
        image: '/photos/cliente/blue-bolt.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Caridina Golden Bee',
        slug: 'caridina-golden-bee',
        description: 'Golden Bee para proyectos de reproduccion y cruces selectivos',
        price: 68.0,
        stock: 20,
        categoryId: categories[1].id,
        image: '/photos/golden-bee/golden-bee.jpg',
        active: true,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bacter AE',
        slug: 'bacter-ae',
        description: 'Suplemento bacteriano para fomentar biofilm y crecimiento sano',
        price: 135.0,
        stock: 18,
        categoryId: categories[2].id,
        image: '/photos/cliente/bacter-ae.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Alimento premium 20g',
        slug: 'alimento-premium-20g',
        description: 'Alimento completo para neocaridinas y caridinas',
        price: 45.0,
        stock: 35,
        categoryId: categories[2].id,
        image: '/photos/cliente/alimento-20-gramos.jpg',
        active: true,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fluval Stratum',
        slug: 'fluval-stratum',
        description: 'Sustrato activo para gambarios y acuarios plantados',
        price: 230.0,
        stock: 10,
        categoryId: categories[3].id,
        image: '/photos/fluval-stratum/sustrato-fluval-stratum.jpg',
        active: true,
        featured: false,
      },
    }),
  ]);
  console.log('✓ Products created:', products.length);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📝 Admin credentials:');
  console.log('   Email: admin@guategambas.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
