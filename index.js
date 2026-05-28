require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;

// 1. Підключаємо модулі для роботи з БД
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// 2. Налаштовуємо адаптер PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 3. Ініціалізуємо Prisma 7 через адаптер
const prisma = new PrismaClient({ adapter });

passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: process.env.STEAM_API_KEY
  },
  function(identifier, profile, done) {
    // Steam повертає профіль юзера, передаємо його далі
    return done(null, profile);
  }
));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Налаштування сесій
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-local-bro-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    httpOnly: true, 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Ініціалізація Passport
app.use(passport.initialize());
app.use(passport.session());

// Захист від спаму кнопкою
const openCaseLimiter = rateLimit({
  windowMs: 1500, 
  max: 1, 
  message: { success: false, message: "Ей, бро, не спам! Стрічка ще крутиться." }
});

// 1. Ініціалізація входу (перекидає на сторінку Steam)
app.get('/auth/steam', passport.authenticate('steam', { failureRedirect: '/' }));

// 2. Повернення зі Steam після успішного входу
app.get('/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/', session: false }), async (req, res) => {
  try {
    const steamProfile = req.user; // Дані, які віддав Steam
    const steamId = steamProfile.id;
    const username = steamProfile.displayName;
    const avatarUrl = steamProfile._json.avatarfull;

    // Шукаємо гравця в нашій базі
    let user = await prisma.user.findUnique({ where: { steamId: steamId } });

    if (!user) {
      // Якщо це новий гравець — створюємо йому профіль і даємо стартові бали
      user = await prisma.user.create({
        data: {
          steamId: steamId,
          username: username,
          avatarUrl: avatarUrl,
          balance: 150.00, // Вітальний бонус 150 Балів
          nonce: 0
        }
      });
      console.log(`🆕 Новий гравець приєднався: ${username}`);
    } else {
      // Якщо гравець вже є — оновлюємо його аватарку та нік (раптом він змінив їх у Steam)
      user = await prisma.user.update({
        where: { id: user.id },
        data: { username: username, avatarUrl: avatarUrl }
      });
      console.log(`👋 З поверненням, ${username}`);
    }

    // Записуємо його ID у нашу надійну сесію
    req.session.userId = user.id;
    res.redirect('/');
  } catch (error) {
    console.error("Помилка Steam Auth:", error);
    res.status(500).send("Помилка авторизації.");
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

// API: Перевірка статусу щоденного кейсу
app.get('/api/daily-case/status', isAuthenticated, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    
    if (!user.lastDailyCaseAt) {
      return res.json({ available: true });
    }

    const now = new Date();
    const lastOpened = new Date(user.lastDailyCaseAt);
    const cooldown = 24 * 60 * 60 * 1000; // 24 години у мілісекундах
    const timePassed = now - lastOpened;

    if (timePassed >= cooldown) {
      return res.json({ available: true });
    } else {
      const timeLeft = cooldown - timePassed; // залишок часу в мс
      return res.json({ available: false, timeLeft });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Помилка перевірки щоденного кейсу." });
  }
});

// API: Відкриття щоденного кейсу (Зі збереженням в інвентар)
app.post('/api/daily-case/open', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      // 1. Повторна сувора перевірка таймеру на сервері
      if (user.lastDailyCaseAt) {
        const timePassed = new Date() - new Date(user.lastDailyCaseAt);
        const cooldown = 24 * 60 * 60 * 1000;
        if (timePassed < cooldown) {
          throw new Error("Час ще не минув! Спроба обману системи.");
        }
      }

      // 2. Беремо предмети, які належать безкоштовному кейсу
      // (Використовуємо наш free-case-1, який ми створили в seed.js)
      const dailyCase = await tx.case.findUnique({
        where: { id: 'free-case-1' },
        include: { items: true }
      });

      if (!dailyCase || dailyCase.items.length === 0) {
        throw new Error("Щоденний кейс тимчасово не налаштований адміністрацією.");
      }

      // 3. Алгоритм рандому на основі шансів (як і в звичайних кейсах)
      const rolledRoll = Math.random() * 100;
      let rolledItem = null;
      let accumulatedChance = 0;

      for (const item of dailyCase.items) {
        accumulatedChance += item.chance;
        if (rolledRoll <= accumulatedChance) {
          rolledItem = item;
          break;
        }
      }
      if (!rolledItem) rolledItem = dailyCase.items[dailyCase.items.length - 1];

      // 4. Фіксуємо новий час відкриття кейсу
      await tx.user.update({
        where: { id: userId },
        data: { lastDailyCaseAt: new Date() }
      });

      // 5. Записуємо виграний скін в інвентар гравця
      const newInventoryRecord = await tx.inventory.create({
        data: {
          userId: userId,
          itemId: rolledItem.id,
          status: "IN_INVENTORY"
        },
        include: { item: true }
      });

      return newInventoryRecord.item;
    });

    res.json({ success: true, item: result });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// API: Профіль користувача
app.get('/api/user-profile', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ success: false, authorized: false });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    
    // Рахуємо статистику інвентарю для профілю
    const currentInventoryCount = await prisma.inventory.count({ 
      where: { userId: req.session.userId, status: "IN_INVENTORY" } 
    });
    const soldInventoryCount = await prisma.inventory.count({ 
      where: { userId: req.session.userId, status: "SOLD" } 
    });

    res.json({
      success: true,
      authorized: true,
      steamId: user.steamId,
      username: user.username,
      balance: user.balance,
      avatarUrl: user.avatarUrl,
      role: user.role,
      nonce: user.nonce, // Порядковий лічильник ігор Provably Fair
      createdAt: user.createdAt,
      tradeUrl: user.tradeUrl,
      stats: {
        currentItems: currentInventoryCount,
        totalSold: soldInventoryCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Помилка завантаження профілю." });
  }
});

// API: Останні 15 дропів для Live-стрічки на головній сторінці
app.get('/api/live-drops', async (req, res) => {
  try {
    const recentDrops = await prisma.inventory.findMany({
      take: 15,
      orderBy: { droppedAt: 'desc' },
      include: {
        item: true,
        user: { select: { username: true, avatarUrl: true } } // підтягуємо хто саме вибив
      }
    });
    res.json({ success: true, drops: recentDrops });
  } catch (error) {
    res.status(500).json({ success: false, error: "Не вдалося завантажити стрічку дропів." });
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

  // Fallback: if rounding or malformed chances skip selection, return the last item
  return { item: items[items.length - 1], hash, randomNumber };
}

// API: Відкриття кейсу (POST з ACID-транзакцією та справжнім Provably Fair)
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
        throw new Error("Недостатньо балів на балансі, бро!");
      }

      const balanceAfterBuy = user.balance - currentCase.price;
      
      // Справжній Provably Fair 
      const serverSeed = process.env.SERVER_SEED || "fallback_server_seed";
      const nonce = user.nonce; // Беремо точний порядковий номер гри юзера з БД
      const userSeed = clientSeed || "default_bro_seed";
      
      const dropResult = openCaseProvablyFair(currentCase.items, serverSeed, userSeed, nonce);
      const finalBalance = balanceAfterBuy + dropResult.item.price;

      // Оновлюємо баланс та ЗБІЛЬШУЄМО nonce на 1
      await tx.user.update({
        where: { id: userId },
        data: { 
          balance: balanceAfterBuy,
          nonce: { increment: 1 } // Наступна гра матиме новий хеш
        }
      });

      const newInventoryItem = await tx.inventory.create({
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
        finalBalance: balanceAfterBuy,
        inventoryId: newInventoryItem.id,
        nonce: nonce                      
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
      inventoryId: result.inventoryId,
      provablyFair: { hash: result.hash, number: result.randomNumber.toFixed(4), nonce: result.nonce }
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/inventory', isAuthenticated, async (req, res) => {
  try {
    const data = await prisma.inventory.findMany({ where: { userId: req.session.userId, status: "IN_INVENTORY" }, include: { item: true } });
    res.json({ success: true, inventory: data });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: String(err) }); }
});

app.post('/api/sell-item', isAuthenticated, async (req, res) => {
  const { inventoryId } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findUnique({ where: { id: inventoryId }, include: { item: true } });
      if (!inv || inv.userId !== req.session.userId || inv.status !== 'IN_INVENTORY') throw new Error('Invalid inventory item');
      await tx.inventory.update({ where: { id: inventoryId }, data: { status: 'SOLD' } });
      const updatedUser = await tx.user.update({ where: { id: req.session.userId }, data: { balance: { increment: inv.item.price } } });
      return updatedUser;
    });
    res.json({ success: true, newBalance: result.balance });
  } catch (err) { console.error(err); res.status(400).json({ success: false, error: String(err) }); }
});

// API: Оновлення Trade URL користувача
app.post('/api/user/update-trade', isAuthenticated, async (req, res) => {
  const { tradeUrl } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.session.userId },
      data: { tradeUrl }
    });
    res.json({ success: true, message: "Трейд-посилання успішно збережено!", tradeUrl: updatedUser.tradeUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: "Помилка оновлення посилання." });
  }
});

// API: Активація промокоду для поповнення балансу (Транзакційно)
app.post('/api/promo/activate', isAuthenticated, async (req, res) => {
  const { code } = req.body;
  const userId = req.session.userId;

  if (!code || code.trim() === "") {
    return res.status(400).json({ success: false, message: "Введіть промокод!" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Шукаємо промокод
      const promo = await tx.promoCode.findUnique({
        where: { code: code.toUpperCase().trim() },
        include: { activations: true }
      });

      if (!promo) {
        throw new Error("Такого промокоду не існує, бро!");
      }

      // 2. Перевіряємо загальний ліміт використань
      if (promo.activations.length >= promo.maxUses) {
        throw new Error("Цей промокод уже вичерпав свій ліміт!");
      }

      // 3. Перевіряємо, чи цей користувач його вже не активував
      const alreadyActivated = promo.activations.some(act => act.userId === userId);
      if (alreadyActivated) {
        throw new Error("Ти вже активував цей промокод!");
      }

      // 4. Фіксуємо активацію
      await tx.promoActivation.create({
        data: {
          userId: userId,
          promoId: promo.id
        }
      });

      // 5. Нараховуємо бали користувачу
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: promo.reward } }
      });

      return {
        newBalance: updatedUser.balance,
        reward: promo.reward
      };
    });

    res.json({ 
      success: true, 
      message: `Успішно! Нараховано +${result.reward} Б до твого балансу!`, 
      newBalance: result.newBalance 
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 SkinBank Beta успішно запущено на http://localhost:${process.env.PORT || 3000}`);
});