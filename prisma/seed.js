require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with case data...');

  await prisma.inventory.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.case.deleteMany({});

  // Category 1: FREE CASES
  await prisma.case.create({
    data: {
      id: 'free-case-1',
      title: 'Free Starter Case',
      price: 0.00,
      category: 'FREE',
      imageUrl: 'https://placehold.co/300x300/1e1b4b/38bdf8?text=FREE+CASE',
      items: {
        create: [
          { name: 'P250 | Sand Dune', price: 1.00, chance: 95.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=P250' },
          { name: 'M4A4 | Magnesium', price: 25.00, chance: 4.9, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=M4A4' },
          { name: 'AK-47 | Asiimov', price: 500.00, chance: 0.1, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=AK-47' }
        ]
      }
    }
  });

  // Category 2: FEATURED CASES
  await prisma.case.create({
    data: {
      id: 'spring-hype',
      title: 'Spring Hype Case',
      price: 50.00,
      category: 'FEATURED',
      imageUrl: 'https://placehold.co/300x300/1f2937/4ade80?text=Spring+Hype',
      items: {
        create: [
          { name: 'AK-47 | Asiimov', price: 500.00, chance: 2.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=AK-47' },
          { name: 'M4A4 | Magnesium', price: 25.00, chance: 18.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=M4A4' },
          { name: 'P250 | Sand Dune', price: 1.00, chance: 80.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=P250' }
        ]
      }
    }
  });

  await prisma.case.create({
    data: {
      id: 'neon-rider',
      title: 'Neon Rider Case',
      price: 120.00,
      category: 'FEATURED',
      imageUrl: 'https://placehold.co/300x300/1f2937/ec4899?text=Neon+Rider',
      items: {
        create: [
          { name: 'MAC-10 | Neon Rider', price: 350.00, chance: 5.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=MAC-10' },
          { name: 'AWP | Chromatic Aberration', price: 180.00, chance: 15.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=AWP' },
          { name: 'Glock-18 | Highlander', price: 15.00, chance: 80.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Glock' }
        ]
      }
    }
  });

  // Category 3: KNIFE CASES
  await prisma.case.create({
    data: {
      id: 'knife-hype',
      title: 'Knife Major Case',
      price: 1000.00,
      category: 'KNIFE',
      imageUrl: 'https://placehold.co/300x300/1f2937/f59e0b?text=Knife+Hype',
      items: {
        create: [
          { name: 'Karambit | Fade', price: 12000.00, chance: 0.5, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Karambit' },
          { name: 'Butterfly Knife | Marble Fade', price: 8000.00, chance: 1.5, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Butterfly' },
          { name: 'Bayonet | Boreal Forest', price: 700.00, chance: 98.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Bayonet' }
        ]
      }
    }
  });

  await prisma.promoCode.upsert({
    where: { code: 'WELCOME5' },
    update: {},
    create: { code: 'WELCOME5', reward: 50.00, maxUses: 500 }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
