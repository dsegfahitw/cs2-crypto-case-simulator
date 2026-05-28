const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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

// НОВИЙ ЕНДПОІНТ: Отримання списку кейсів для фронтенду
app.get('/api/cases', (req, res) => {
  try {
    const allCases = JSON.parse(fs.readFileSync('./cases.json', 'utf-8'));
    res.json({ success: true, cases: allCases });
  } catch (error) {
    res.status(500).json({ success: false, message: "Помилка завантаження кейсів" });
  }
});

app.get('/api/open-case', (req, res) => {
  try {
    const allCases = JSON.parse(fs.readFileSync('./cases.json', 'utf-8'));
    const allUsers = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));

    const userId = "bro_user_1"; 
    const user = allUsers[userId];
    const caseType = req.query.caseType || 'spring-hype';
    const currentCase = allCases[caseType];

    if (!currentCase) {
      return res.status(404).json({ success: false, message: "Кейсу не існує!" });
    }
    if (user.balance < currentCase.price) {
      return res.status(400).json({ success: false, message: "Недостатньо коштів на балансі!" });
    }

    const oldBalance = user.balance;
    user.balance -= currentCase.price;

    const serverSeed = "super_secret_server_seed_key";
    const clientSeed = req.query.clientSeed || "default_bro_seed";
    const nonce = Date.now(); 
    
    const dropResult = openCaseProvablyFair(currentCase.items, serverSeed, clientSeed, nonce);

    user.balance += dropResult.item.price;
    user.inventory.push({
      name: dropResult.item.name,
      price: dropResult.item.price,
      droppedAt: new Date()
    });

    fs.writeFileSync('./users.json', JSON.stringify(allUsers, null, 2), 'utf-8');

    res.json({
      success: true,
      caseTitle: currentCase.title,
      casePrice: currentCase.price,
      user: {
        username: user.username,
        previousBalance: oldBalance.toFixed(2),
        balanceAfterBuy: (oldBalance - currentCase.price).toFixed(2),
        finalBalance: user.balance.toFixed(2)
      },
      drop: dropResult.item,
      provablyFair: { hash: dropResult.hash, number: dropResult.randomNumber.toFixed(4) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Помилка сервера." });
  }
});

app.get('/api/user-profile', (req, res) => {
  try {
    const allUsers = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
    const user = allUsers["bro_user_1"];
    res.json({ success: true, username: user.username, balance: user.balance });
  } catch (error) {
    res.status(500).json({ success: false, message: "Помилка сервера" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер з економікою запущено на порту ${PORT}!`);
});