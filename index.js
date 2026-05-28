require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

// 1. Підключаємо модулі для роботи з БД
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// 2. Налаштовуємо адаптер PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 3. Ініціалізуємо Prisma 7 через адаптер
const prisma = new PrismaClient({ adapter });


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Налаштування сесій
app.use(session({
  secret: 'super-secret-local-bro-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Захист від спаму кнопкою
const openCaseLimiter = rateLimit({
  windowMs: 1500, 
  max: 1, 
  message: { success: false, message: "Ей, бро, не спам! Стрічка ще крутиться." }
});

// Роут імітації входу (Фейк-Стім)
app.get('/auth/fake-login', async (req, res) => {
  try {
    const testSteamId = "76561198000000000";
    let user = await prisma.user.findUnique({ where: { steamId: testSteamId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          steamId: testSteamId,
          username: "Сеньйор Розробник (Beta)",
          avatarUrl: "https://placehold.co/100x100/1f2937/4ade80?text=Dev",
          balance: 150.00
        }
      });
      console.log("🆕 Тестового користувача створено в Supabase!");
    }

    req.session.userId = user.id;
    res.redirect('/');
  } catch (error) {
    console.error("Помилка авторизації:", error);
    res.status(500).send("Помилка сервера при вході.");
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, authorized: false, message: "Спочатку увійдіть в акаунт!" });
  }
  next();
}

// API: Профіль користувача
app.get('/api/user-profile', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ success: false, authorized: false });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    res.json({
      success: true,
      authorized: true,
      username: user.username,
      balance: user.balance,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Помилка завантаження профілю." });
  }
});

// API: Список кейсів з БД Supabase
app.get('/api/cases', async (req, res) => {
  try {
    const cases = await prisma.case.findMany({ include: { items: true } });
    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: "Помилка завантаження кейсів з БД." });
  }
});

// Алгоритм чесності Provably Fair
function openCaseProvablyFair(items, serverSeed, clientSeed, nonce) {
  const combinedString = `${serverSeed}-${clientSeed}-${nonce}`;
  const hash = crypto.createHash('sha256').update(combinedString).digest('hex');
  const hexSubstring = hash.substring(0, 8);
  const intNumber = parseInt(hexSubstring, 16);
  const randomNumber = (intNumber / 4294967295) * 100;

  let currentBound = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    currentBound += item.chance;
    if (randomNumber <= currentBound) {
      return { item, hash, randomNumber };
    }
  }
}

// API: Відкриття кейсу (POST з ACID-транзакцією)
app.post('/api/open-case', openCaseLimiter, isAuthenticated, async (req, res) => {
  const { caseId, clientSeed } = req.body;
  const userId = req.session.userId;

  try {
    const currentCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: { items: true }
    });

    if (!currentCase) {
      return res.status(404).json({ success: false, message: "Кейс не знайдено." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (user.balance < currentCase.price) {
        throw new Error("Недостатньо коштів на балансі, бро!");
      }

      const balanceAfterBuy = user.balance - currentCase.price;
      
      const serverSeed = "super_secret_server_seed_key";
      const nonce = Date.now();
      const userSeed = clientSeed || "default_bro_seed";
      
      const dropResult = openCaseProvablyFair(currentCase.items, serverSeed, userSeed, nonce);
      const finalBalance = balanceAfterBuy + dropResult.item.price;

      await tx.user.update({
        where: { id: userId },
        data: { balance: finalBalance }
      });

      await tx.inventory.create({
        data: {
          userId: user.id,
          itemId: dropResult.item.id,
          status: "IN_INVENTORY"
        }
      });

      return {
        drop: dropResult.item,
        hash: dropResult.hash,
        randomNumber: dropResult.randomNumber,
        previousBalance: user.balance,
        balanceAfterBuy,
        finalBalance
      };
    });

    res.json({
      success: true,
      caseTitle: currentCase.title,
      casePrice: currentCase.price,
      user: {
        previousBalance: result.previousBalance.toFixed(2),
        balanceAfterBuy: result.balanceAfterBuy.toFixed(2),
        finalBalance: result.finalBalance.toFixed(2)
      },
      drop: result.drop,
      provablyFair: { hash: result.hash, number: result.randomNumber.toFixed(4) }
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SkinBank Beta успішно запущено на http://localhost:${PORT}`);
});