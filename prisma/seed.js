require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Налаштовуємо стабільне підключення через адаптер
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Початок наповнення бази даних...');

  await prisma.inventory.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.case.deleteMany({});

  // 1. Весняний Хайп (Було $5.00 -> Стало 50 Балів)
  await prisma.case.create({
    data: {
      id: 'spring-hype',
      title: 'Весняний Хайп',
      price: 50.00,
      imageUrl: 'https://placehold.co/300x300/1f2937/4ade80?text=Spring+Hype', 
      items: {
        create: [
          { name: 'AK-47 | Азімов', price: 500.00, chance: 1.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=AK-47' },
          { name: 'M4A4 | Магній', price: 25.00, chance: 14.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=M4A4' },
          { name: 'P250 | Піщані Дюни', price: 1.00, chance: 85.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=P250' }
        ]
      }
    }
  });

  // 2. Суто Ножі (Було $100.00 -> Стало 1000 Балів)
  await prisma.case.create({
    data: {
      id: 'knife-hype',
      title: 'Суто Ножі (Для Мажорів)',
      price: 1000.00,
      imageUrl: 'https://placehold.co/300x300/1f2937/f59e0b?text=Knife+Hype',
      items: {
        create: [
          { name: 'Керамбіт | Градієнт', price: 12000.00, chance: 0.5, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Karambit' },
          { name: 'Ніж-метелик | Хвилі', price: 8000.00, chance: 1.5, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Butterfly' },
          { name: 'Штик-ніж | Борець', price: 700.00, chance: 98.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Bayonet' }
        ]
      }
    }
  });

  console.log('✅ База даних успішно наповнена тестовими кейсами (Економіка Балів)!');
}

main()
  .catch((e) => {
    console.error('❌ Помилка під час наповнення:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Закриваємо пул з'єднань
  });