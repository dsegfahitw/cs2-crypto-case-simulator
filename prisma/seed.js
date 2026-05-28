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

  // 1. Очищаємо старі дані (щоб уникнути дублікатів)
  await prisma.inventory.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.case.deleteMany({});

  // 2. Створюємо кейс "Весняний Хайп"
  await prisma.case.create({
    data: {
      id: 'spring-hype',
      title: 'Весняний Хайп',
      price: 5.00,
      imageUrl: 'https://placehold.co/300x300/1f2937/4ade80?text=Spring+Hype', 
      items: {
        create: [
          { name: 'AK-47 | Азімов', price: 50.00, chance: 1.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=AK-47' },
          { name: 'M4A4 | Магній', price: 2.50, chance: 14.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=M4A4' },
          { name: 'P250 | Піщані Дюни', price: 0.10, chance: 85.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=P250' }
        ]
      }
    }
  });

  // 3. Створюємо кейс "Суто Ножі"
  await prisma.case.create({
    data: {
      id: 'knife-hype',
      title: 'Суто Ножі (Для Мажорів)',
      price: 100.00,
      imageUrl: 'https://placehold.co/300x300/1f2937/f59e0b?text=Knife+Hype',
      items: {
        create: [
          { name: 'Керамбіт | Градієнт', price: 1200.00, chance: 0.5, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Karambit' },
          { name: 'Ніж-метелик | Хвилі', price: 800.00, chance: 1.5, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Butterfly' },
          { name: 'Штик-ніж | Борець', price: 70.00, chance: 98.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Bayonet' }
        ]
      }
    }
  });

  console.log('✅ База даних успішно наповнена тестовими кейсами!');
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