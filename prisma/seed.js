require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Налаштовуємо стабільне підключення через адаптер
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Наповнення бази розширеними категоріями кейсів...');

  await prisma.inventory.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.case.deleteMany({});

  // Категорія 1: БЕЗКОШТОВНІ КЕЙСИ (FREE)
  await prisma.case.create({
    data: {
      id: 'free-case-1',
      title: 'Безкоштовний Кейс #1',
      price: 0.00,
      category: 'FREE',
      imageUrl: 'https://placehold.co/300x300/1e1b4b/38bdf8?text=FREE+CASE',
      items: {
        create: [
          { name: 'P250 | Піщані Дюни', price: 1.00, chance: 95.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=P250' },
          { name: 'M4A4 | Магній', price: 25.00, chance: 4.9, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=M4A4' },
          { name: 'AK-47 | Азімов', price: 500.00, chance: 0.1, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=AK-47' }
        ]
      }
    }
  });

  // Категорія 2: ТОПОВІ / ХАЙПОВІ КЕЙСИ (FEATURED)
  await prisma.case.create({
    data: {
      id: 'spring-hype',
      title: 'Весняний Хайп',
      price: 50.00,
      category: 'FEATURED',
      imageUrl: 'https://placehold.co/300x300/1f2937/4ade80?text=Spring+Hype', 
      items: {
        create: [
          { name: 'AK-47 | Азімов', price: 500.00, chance: 2.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=AK-47' },
          { name: 'M4A4 | Магній', price: 25.00, chance: 18.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=M4A4' },
          { name: 'P250 | Піщані Дюни', price: 1.00, chance: 80.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=P250' }
        ]
      }
    }
  });

  await prisma.case.create({
    data: {
      id: 'neon-rider',
      title: 'Кіберпанк Неон',
      price: 120.00,
      category: 'FEATURED',
      imageUrl: 'https://placehold.co/300x300/1f2937/ec4899?text=Neon+Rider',
      items: {
        create: [
          { name: 'MAC-10 | Неоновий вершник', price: 350.00, chance: 5.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=MAC-10' },
          { name: 'AWP | Хроматична аберація', price: 180.00, chance: 15.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=AWP' },
          { name: 'Glock-18 | Горець', price: 15.00, chance: 80.0, imageUrl: 'https://placehold.co/150x150/111827/ffffff?text=Glock' }
        ]
      }
    }
  });

  // Категорія 3: ЕЛІТНІ / НОЖОВІ КЕЙСИ (KNIFE)
  await prisma.case.create({
    data: {
      id: 'knife-hype',
      title: 'Суто Ножі (Мажор)',
      price: 1000.00,
      category: 'KNIFE',
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

  // Промокод для тесту
  await prisma.promoCode.upsert({
    where: { code: 'WELCOME5' },
    update: {},
    create: { code: 'WELCOME5', reward: 50.00, maxUses: 500 }
  });

  console.log('✅ База даних успішно оновлена новими категоріями кейсів!');
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
  console.log("🎟 Тестовий промокод WELCOME5 створено!");