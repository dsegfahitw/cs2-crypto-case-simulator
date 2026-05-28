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

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 SkinBank Beta успішно запущено на http://localhost:${process.env.PORT || 3000}`);
});