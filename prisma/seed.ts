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
        name: 'Gambas Criadas',
        slug: 'gambas-criadas',
        description: 'Gambas criadas en cautiverio con alimento de calidad',
        icon: '🦐',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Gambas Silvestres',
        slug: 'gambas-silvestres',
        description: 'Gambas capturadas en su hábitat natural',
        icon: '🌊',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Gambas Premium',
        slug: 'gambas-premium',
        description: 'Selección premium de las mejores gambas',
        icon: '👑',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Gambas Orgánicas',
        slug: 'gambas-organicas',
        description: 'Certificadas como orgánicas y sostenibles',
        icon: '🌿',
      },
    }),
  ]);
  console.log('✓ Categories created:', categories.length);

  // 3. Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Gambas Criadas Extra Grande',
        slug: 'gambas-criadas-extra-grande',
        description: 'Gambas criadas de tamaño extra grande, perfectas para eventos',
        price: 85.0,
        stock: 50,
        categoryId: categories[0].id,
        image: 'gambas-criadas-xl.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gambas Criadas Medianas',
        slug: 'gambas-criadas-medianas',
        description: 'Gambas criadas de tamaño mediano, ideales para ensaladas',
        price: 55.0,
        stock: 75,
        categoryId: categories[0].id,
        image: 'gambas-criadas-med.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gambas Silvestres Frescas',
        slug: 'gambas-silvestres-frescas',
        description: 'Gambas silvestres recién capturadas del Pacífico guatemalteco',
        price: 95.0,
        stock: 30,
        categoryId: categories[1].id,
        image: 'gambas-silvestres.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gambas Silvestres Congeladas',
        slug: 'gambas-silvestres-congeladas',
        description: 'Gambas silvestres congeladas en su punto perfecto',
        price: 75.0,
        stock: 60,
        categoryId: categories[1].id,
        image: 'gambas-silvestres-congeladas.jpg',
        active: true,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Premium Jumbo Gambas',
        slug: 'premium-jumbo-gambas',
        description: 'Las gambas más grandes y exóticas, selección premium',
        price: 150.0,
        stock: 20,
        categoryId: categories[2].id,
        image: 'premium-jumbo.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Premium Tigre Gambas',
        slug: 'premium-tigre-gambas',
        description: 'Gambas tipo tigre con rayas características',
        price: 120.0,
        stock: 25,
        categoryId: categories[2].id,
        image: 'premium-tigre.jpg',
        active: true,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gambas Orgánicas Certificadas',
        slug: 'gambas-organicas-certificadas',
        description: 'Certificadas como orgánicas, sin químicos ni aditivos',
        price: 110.0,
        stock: 40,
        categoryId: categories[3].id,
        image: 'gambas-organicas.jpg',
        active: true,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gambas Orgánicas Pequeñas',
        slug: 'gambas-organicas-pequenas',
        description: 'Pequeñas gambas orgánicas, perfectas para camarones',
        price: 65.0,
        stock: 45,
        categoryId: categories[3].id,
        image: 'gambas-organicas-small.jpg',
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
