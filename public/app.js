document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById('loginBtn');
  const userProfileInfo = document.getElementById('userProfileInfo');
  const userAvatar = document.getElementById('userAvatar');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const balanceDisplay = document.getElementById('balanceDisplay');
  
  const homeView = document.getElementById('homeView');
  const caseView = document.getElementById('caseView');
  const faqView = document.getElementById('faqView');
  const profileView = document.getElementById('profileView');
  const casesGrid = document.getElementById('casesGrid');
  
  const inventoryGrid = document.getElementById('inventoryGrid');
  const inventoryCount = document.getElementById('inventoryCount');
  const emptyInventoryMsg = document.getElementById('emptyInventoryMsg');
  
  const logoBtn = document.getElementById('logoBtn');
  const profileTrigger = document.getElementById('profileTrigger');
  const faqBtn = document.getElementById('faqBtn');
  const backToHomeBtns = document.querySelectorAll('.backToHomeBtn');

  // Елементи всередині картки профілю
  const profAvatar = document.getElementById('profAvatar');
  const profRoleBadge = document.getElementById('profRoleBadge');
  const profUsername = document.getElementById('profUsername');
  const profJoinDate = document.getElementById('profJoinDate');
  const profBalance = document.getElementById('profBalanceV2'); // V2 згідно з твоїм HTML
  const profTotalOpened = document.getElementById('profTotalOpened');
  const profContractsCount = document.getElementById('profContractsCount');
  const profTotalSold = document.getElementById('profTotalSold');
  
  const currentCaseTitle = document.getElementById('currentCaseTitle');
  const currentCasePrice = document.getElementById('currentCasePrice');
  const openCaseBtn = document.getElementById('openCaseBtn');
  const openCaseFastBtn = document.getElementById('openCaseFastBtn');
  const rouletteTrack = document.getElementById('rouletteTrack');
  const caseContentsGrid = document.getElementById('caseContentsGrid');
  
  const winModal = document.getElementById('winModal');
  const winItemName = document.getElementById('winItemName');
  const winItemPrice = document.getElementById('winItemPrice');
  const collectBtn = document.getElementById('collectBtn');
  const sellInstantlyBtn = document.getElementById('sellInstantlyBtn');
  
  const claimDailyBtn = document.getElementById('claimDailyBtn');
  const dailyModal = document.getElementById('dailyModal');
  const dailyModalImg = document.getElementById('dailyModalImg');
  const dailyModalName = document.getElementById('dailyModalName');
  const dailyModalPrice = document.getElementById('dailyModalPrice');
  const closeDailyModalBtn = document.getElementById('closeDailyModalBtn');
  
  let dailyCaseInterval = null; 
  let lastDroppedInventoryId = null;
  let currentFinalBalance = 0;
  let allCasesData = {}; 
  let activeCaseId = null;
  let isAuthorized = false;

  let currentInventoryArray = []; 
  let cachedSteamId = "";

  // 1. АВТОРИЗАЦІЯ ТА БАЛАНС
  async function checkAuth() {
    try {
      const res = await fetch('/api/user-profile');
      const data = await res.json();
      if (data.success && data.authorized) {
        isAuthorized = true;
        loginBtn.classList.add('hidden');
        userProfileInfo.classList.remove('hidden');
        userAvatar.src = data.avatarUrl;
        usernameDisplay.textContent = data.username;
        balanceDisplay.textContent = Math.floor(data.balance); 
        
        checkDailyCaseStatus(); 
        syncInventory(); // Завантажуємо інвентар у фон при старті
      } else {
        isAuthorized = false;
        loginBtn.classList.remove('hidden');
        userProfileInfo.classList.add('hidden');
        checkDailyCaseStatus(); 
      }
    } catch (e) {
      console.error("Auth error", e);
    }
  }

// 1.1 ЄДИНА ФУНКЦІЯ СИНХРОНІЗАЦІЇ ІНВЕНТАРЮ (ФІКС БАГА З КЕШЕМ)
  async function syncInventory() {
    if (!isAuthorized) return;
    try {
      // Додаємо { cache: 'no-store' }, щоб отримувати завжди свіжі дані з БД
      const invRes = await fetch('/api/inventory', { cache: 'no-store' });
      const invData = await invRes.json();
      if (invData.success) {
        currentInventoryArray = invData.inventory;
        calculateTotalInventoryValue();
        applyInventoryFilters();
      }
    } catch (e) {
      console.error("Помилка синхронізації інвентарю:", e);
    }
  }

  // 2. ЗАВАНТАЖЕННЯ КЕЙСІВ ТА РОЗПОДІЛ ЗА КАТЕГОРІЯМИ
  async function loadCases() {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.success) {
        allCasesData = {};
        data.cases.forEach(c => {
          allCasesData[c.id] = c;
        });
        renderCategorizedHomeGrid();
      }
    } catch (e) {
      console.error("Помилка завантаження кейсів", e);
    }
  }

function renderCategorizedHomeGrid() {
    const freeGrid = document.getElementById('grid-FREE');
    const featuredGrid = document.getElementById('grid-FEATURED');
    const knifeGrid = document.getElementById('grid-KNIFE');
    
    if(freeGrid) freeGrid.innerHTML = '';
    if(featuredGrid) featuredGrid.innerHTML = '';
    if(knifeGrid) knifeGrid.innerHTML = '';

    Object.entries(allCasesData).forEach(([id, caseData]) => {
      // Додаємо бейдж HOT для крутих кейсів
      let hotBadge = '';
      if (caseData.category === 'FEATURED' || caseData.category === 'KNIFE') {
        hotBadge = `<div class="absolute -right-8 top-3 bg-red-600 text-white text-[9px] font-black px-8 py-1 rotate-45 shadow-lg uppercase tracking-widest z-20">HOT</div>`;
      }

      const card = document.createElement('div');
      // Використовуємо наш новий CSS-клас case-card-hover та glass-panel
      card.className = "glass-panel rounded-xl p-5 flex flex-col items-center cursor-pointer case-card-hover group relative overflow-hidden";
      card.innerHTML = `
        ${hotBadge}
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/90 z-0"></div>
        <div class="w-32 h-32 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 z-10 relative">
          <div class="absolute inset-0 bg-green-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <img src="${caseData.imageUrl || 'https://placehold.co/300'}" class="w-full h-full object-cover drop-shadow-2xl">
        </div>
        
        <div class="z-10 flex flex-col items-center w-full">
          <h3 class="text-sm font-black text-gray-100 mb-3 text-center tracking-wider uppercase drop-shadow-md truncate w-full">${caseData.title}</h3>
          
          <div class="w-full flex justify-between items-center bg-black/40 border border-gray-700/50 rounded-lg p-2 group-hover:border-green-500/40 transition-colors">
            <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ціна</span>
            <span class="text-yellow-400 font-mono font-black text-sm">${Math.floor(caseData.price)} Б</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => showCase(id));
      
      if (caseData.category === 'FREE' && freeGrid) freeGrid.appendChild(card);
      else if (caseData.category === 'FEATURED' && featuredGrid) featuredGrid.appendChild(card);
      else if (caseData.category === 'KNIFE' && knifeGrid) knifeGrid.appendChild(card);
    });
  }
  // 4. ВІДКРИТТЯ КЕЙСУ
  function showCase(caseId) {
    activeCaseId = caseId;
    const caseData = allCasesData[caseId];
    currentCaseTitle.textContent = caseData.title;
    currentCasePrice.textContent = `${Math.floor(caseData.price)} Б`;
    
    renderCaseContents(caseData.items);
    renderDummyTrack(caseId);
    showView(caseView);
  }

  function renderCaseContents(items) {
    caseContentsGrid.innerHTML = '';
    const sorted = [...items].sort((a, b) => b.price - a.price);
    sorted.forEach(item => {
      let rarity = 'border-gray-600';
      if (item.chance < 2) rarity = 'border-red-500';
      else if (item.chance < 15) rarity = 'border-purple-500';

      const itemCard = document.createElement('div');
      itemCard.className = `bg-gray-800 border-b-4 ${rarity} rounded p-4 flex flex-col items-center text-center`;
      itemCard.innerHTML = `
        <img src="${item.imageUrl || 'https://placehold.co/150'}" class="w-16 h-16 object-contain mb-2">
        <span class="text-sm font-bold text-gray-200 mb-1 block truncate w-full">${item.name}</span>
        <span class="text-xs text-gray-400 mb-2">${item.chance}%</span>
        <span class="text-sm font-mono text-yellow-400 font-bold">${Math.floor(item.price)} Б</span>
      `;
      caseContentsGrid.appendChild(itemCard);
    });
  }

  function renderDummyTrack(caseId) {
    const items = allCasesData[caseId].items;
    let trackHTML = '';
    for (let i = 0; i < 80; i++) {
      const item = items[Math.floor(Math.random() * items.length)];
      trackHTML += `
        <div class="weapon-card">
          <img src="${item.imageUrl || 'https://placehold.co/150'}" class="w-12 h-12 object-contain mb-1">
          <span class="weapon-name truncate w-full">${item.name}</span>
          <span class="weapon-price text-yellow-400/50">${Math.floor(item.price)} Б</span>
        </div>
      `;
    }
    rouletteTrack.classList.remove('roulette-spin');
    rouletteTrack.style.transform = 'translateX(0px)';
    rouletteTrack.innerHTML = trackHTML;
  }

  openCaseBtn.addEventListener('click', async () => {
    if (!isAuthorized) return alert("Спочатку увійдіть в акаунт!");
    if (!activeCaseId) return;

    openCaseBtn.disabled = true;
    openCaseFastBtn.disabled = true;
    document.querySelector('.backToHomeBtn').style.pointerEvents = 'none';
    
    rouletteTrack.classList.remove('roulette-spin');
    rouletteTrack.style.transform = 'translateX(0px)';
    void rouletteTrack.offsetWidth; 

    try {
      const res = await fetch('/api/open-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: activeCaseId, clientSeed: "my_lucky_seed" })
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        openCaseBtn.disabled = false;
        openCaseFastBtn.disabled = false;
        document.querySelector('.backToHomeBtn').style.pointerEvents = 'auto';
        return;
      }

      balanceDisplay.textContent = Math.floor(data.user.balanceAfterBuy);
      currentFinalBalance = data.user.finalBalance; 

      const WINNING_INDEX = 65; 
      const currentItems = allCasesData[activeCaseId].items;

      lastDroppedInventoryId = data.inventoryId;
      sellInstantlyBtn.textContent = `ПРОДАТИ ЗА ${Math.floor(data.drop.price)} Б`; 
      
      let trackHTML = '';
      for (let i = 0; i < 80; i++) {
        if (i === WINNING_INDEX) {
          trackHTML += `
            <div class="weapon-card" style="border-color: #facc15; box-shadow: inset 0 0 15px rgba(250, 204, 21, 0.2);">
              <img src="${data.drop.imageUrl || 'https://placehold.co/150'}" class="w-12 h-12 object-contain mb-1">
              <span class="weapon-name text-yellow-400 font-bold truncate w-full">${data.drop.name}</span>
              <span class="weapon-price text-yellow-400 font-bold">${Math.floor(data.drop.price)} Б</span>
            </div>
          `;
        } else {
          const item = currentItems[Math.floor(Math.random() * currentItems.length)];
          trackHTML += `
            <div class="weapon-card">
              <img src="${item.imageUrl || 'https://placehold.co/150'}" class="w-12 h-12 object-contain mb-1">
              <span class="weapon-name truncate w-full">${item.name}</span>
              <span class="weapon-price text-gray-500">${Math.floor(item.price)} Б</span>
            </div>
          `;
        }
      }
      rouletteTrack.innerHTML = trackHTML;

      const cardWidth = 150; 
      const gap = 16; 
      const containerWidth = rouletteTrack.parentElement.offsetWidth;
      const targetCardCenter = (WINNING_INDEX * (cardWidth + gap)) + (cardWidth / 2);
      const randomOffset = Math.floor(Math.random() * 100) - 50; 
      const finalTranslate = -(targetCardCenter - (containerWidth / 2) + randomOffset);

      rouletteTrack.classList.add('roulette-spin');
      rouletteTrack.style.transform = `translateX(${finalTranslate}px)`;

      setTimeout(() => {
        winItemName.textContent = data.drop.name;
        winItemPrice.textContent = `${Math.floor(data.drop.price)} Б`;
        winModal.classList.remove('hidden');
        setTimeout(() => {
          winModal.classList.remove('opacity-0');
          winModal.querySelector('div').classList.remove('scale-95');
        }, 50);
      }, 6000);

    } catch (e) {
      console.error(e);
      alert("Помилка сервера.");
      openCaseBtn.disabled = false;
      openCaseFastBtn.disabled = false;
      document.querySelector('.backToHomeBtn').style.pointerEvents = 'auto';
    }
  });

  // КЛІК: МИТТЄВЕ ВІДКРИТТЯ
  openCaseFastBtn.addEventListener('click', async () => {
    if (!isAuthorized) return alert("Спочатку увійдіть в акаунт!");
    if (!activeCaseId) return;

    openCaseBtn.disabled = true;
    openCaseFastBtn.disabled = true;
    document.querySelector('.backToHomeBtn').style.pointerEvents = 'none';

    try {
      const res = await fetch('/api/open-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: activeCaseId, clientSeed: "fast_bro_seed" })
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        openCaseBtn.disabled = false;
        openCaseFastBtn.disabled = false;
        document.querySelector('.backToHomeBtn').style.pointerEvents = 'auto';
        return;
      }

      balanceDisplay.textContent = Math.floor(data.user.balanceAfterBuy);
      currentFinalBalance = data.user.finalBalance;
      lastDroppedInventoryId = data.inventoryId;
      sellInstantlyBtn.textContent = `ПРОДАТИ ЗА ${Math.floor(data.drop.price)} Б`;

      winItemName.textContent = data.drop.name;
      winItemPrice.textContent = `${Math.floor(data.drop.price)} Б`;
      winModal.classList.remove('hidden');
      setTimeout(() => {
        winModal.classList.remove('opacity-0');
        winModal.querySelector('div').classList.remove('scale-95');
      }, 10);

    } catch (e) {
      console.error(e);
      alert("Помилка з'єднання з сервером.");
      openCaseBtn.disabled = false;
      openCaseFastBtn.disabled = false;
      document.querySelector('.backToHomeBtn').style.pointerEvents = 'auto';
    }
  });

  // ОПЕРАЦІЯ "В ІНВЕНТАР" (ФІКС СИНХРОНІЗАЦІЇ)
  collectBtn.addEventListener('click', () => {
    winModal.classList.add('opacity-0');
    winModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
      winModal.classList.add('hidden');
      balanceDisplay.textContent = Math.floor(currentFinalBalance);
      openCaseBtn.disabled = false;
      openCaseFastBtn.disabled = false;
      document.querySelector('.backToHomeBtn').style.pointerEvents = 'auto';
      syncInventory(); // Оновлюємо інвентар щоб предмет відразу з'явився
    }, 300); 
  });

  // ОПЕРАЦІЯ "МИТТЄВИЙ ПРОДАЖ" (ФІКС СИНХРОНІЗАЦІЇ)
  sellInstantlyBtn.addEventListener('click', async () => {
    if (!lastDroppedInventoryId) return;

    try {
      const res = await fetch('/api/sell-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId: lastDroppedInventoryId })
      });
      const data = await res.json();

      if (data.success) {
        balanceDisplay.textContent = Math.floor(data.newBalance);
        currentFinalBalance = data.newBalance;

        winModal.classList.add('opacity-0');
        winModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
          winModal.classList.add('hidden');
          openCaseBtn.disabled = false;
          openCaseFastBtn.disabled = false;
          document.querySelector('.backToHomeBtn').style.pointerEvents = 'auto';
          syncInventory(); // Очищаємо локальний кеш, щоб "привиди" проданих скінів не залишались
        }, 300);
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Помилка швидкого продажу предмета.");
    }
  });

  // 5. НАВІГАЦІЯ МІЖ СТОРІНКАМИ (SPA)
  function showView(viewElement) {
    [homeView, caseView, faqView, profileView].forEach(el => {
      if (el === viewElement) {
        el.classList.remove('hidden');
        if (el === caseView) el.classList.add('flex');
      } else {
        el.classList.add('hidden');
        el.classList.remove('flex');
      }
    });
  }

  // ОБРОБНИКИ НАВІГАЦІЇ
  logoBtn.addEventListener('click', () => showView(homeView));
  faqBtn.addEventListener('click', () => showView(faqView));
  document.querySelectorAll('.backToHomeBtn').forEach(btn => btn.addEventListener('click', () => showView(homeView)));
  profileTrigger.addEventListener('click', loadProfile);

  // 6. ФУНКЦІОНАЛ КАБІНЕТУ КОРИСТУВАЧА V2
    async function loadProfile() {
    if (!isAuthorized) return alert("Будь ласка, увійдіть в акаунт!");
    
    showView(profileView);
    try {
      // Додаємо заборону кешування і сюди
      const userRes = await fetch('/api/user-profile', { cache: 'no-store' });
      const userData = await userRes.json();
      
      if (userData.success && userData.authorized) {
        profAvatar.src = userData.avatarUrl;
        profUsername.textContent = userData.username;
        profRoleBadge.textContent = userData.role;
        profBalance.textContent = Math.floor(userData.balance);
        profTotalOpened.textContent = userData.nonce;
        profContractsCount.textContent = userData.contractsCount || 0;
        profTotalSold.textContent = userData.stats.totalSold;
        document.getElementById('tradeUrlInput').value = userData.tradeUrl || '';
        
        cachedSteamId = userData.steamId || "Немає (Google)";
        document.getElementById('profSteamIdText').textContent = cachedSteamId;
        
        const date = new Date(userData.createdAt);
        profJoinDate.textContent = `Реєстрація: ${date.toLocaleDateString('uk-UA')}`;
      }

      await syncInventory(); // Синхронізуємо сітку скінів

    } catch (e) {
      console.error("Помилка завантаження кабінету:", e);
    }
  }

  // ОБРАХУНОК ЗАГАЛЬНОЇ ВАРТОСТІ ІНВЕНТАРЮ
  function calculateTotalInventoryValue() {
    const total = currentInventoryArray.reduce((sum, record) => sum + record.item.price, 0);
    document.getElementById('totalInventoryValue').textContent = `${Math.floor(total)} Б`;
  }

  // ФІЛЬТРАЦІЯ ТА СОРТУВАННЯ СКІНІВ
  function applyInventoryFilters() {
    const rarityFilter = document.getElementById('filterRarity').value;
    const sortFilter = document.getElementById('filterSort').value;
    
    let filtered = currentInventoryArray.filter(record => {
      if (rarityFilter === 'all') return true;
      if (rarityFilter === 'rare') return record.item.chance < 2;
      if (rarityFilter === 'classified') return record.item.chance >= 2 && record.item.chance < 15;
      if (rarityFilter === 'common') return record.item.chance >= 15;
      return true;
    });

    if (sortFilter === 'price-desc') {
      filtered.sort((a, b) => b.item.price - a.item.price);
    } else if (sortFilter === 'price-asc') {
      filtered.sort((a, b) => a.item.price - b.item.price);
    } else if (sortFilter === 'date-desc') {
      filtered.sort((a, b) => new Date(b.droppedAt) - new Date(a.droppedAt));
    }

    renderProfileInventory(filtered);
  }

  // МАТРИЦЯ СКІНІВ В КАБІНЕТІ
  function renderProfileInventory(items) {
    inventoryGrid.innerHTML = '';
    inventoryCount.textContent = `${items.length} предметів`;
    
    if (items.length === 0) {
      emptyInventoryMsg.classList.remove('hidden');
    } else {
      emptyInventoryMsg.classList.add('hidden');
      
      items.forEach(invRecord => {
        const item = invRecord.item;
        
        let borderNeon = 'border-gray-700 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]';
        if (item.chance < 2) borderNeon = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
        else if (item.chance < 15) borderNeon = 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]';

        const card = document.createElement('div');
        card.className = `bg-gray-900 border ${borderNeon} rounded-lg p-4 flex flex-col items-center text-center relative transition-transform hover:scale-[1.02] animate-fade-in`;
        card.innerHTML = `
          <img src="${item.imageUrl || 'https://placehold.co/150'}" class="w-16 h-16 object-contain mb-2">
          <span class="text-xs font-bold text-gray-200 mb-3 block truncate w-full" title="${item.name}">${item.name}</span>
          <button onclick="sellItemFromProfile('${invRecord.id}')" class="w-full bg-red-500/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white transition-all py-1.5 rounded text-[11px] font-black uppercase tracking-wider">
            Продати за ${Math.floor(item.price)} Б
          </button>
        `;
        inventoryGrid.appendChild(card);
      });
    }
  }

// Продаж предмета з сітки (МИТТЄВИЙ UX)
  window.sellItemFromProfile = async (inventoryId) => {
    try {
      const res = await fetch('/api/sell-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId })
      });
      const data = await res.json();
      
      if (data.success) {
        // Оновлюємо баланс
        balanceDisplay.textContent = Math.floor(data.newBalance);
        
        // МИТТЄВО видаляємо проданий скін з локального масиву
        currentInventoryArray = currentInventoryArray.filter(item => item.id !== inventoryId);
        
        // Одразу перемальовуємо сітку та суму без сервера
        calculateTotalInventoryValue();
        applyInventoryFilters();

        // Фоново перезавантажуємо статистику кабінету (щоб оновити плашку "Скінів продано")
        loadProfile(); 
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Помилка при продажу.");
    }
  };

  // КОПІЮВАННЯ STEAMID
  document.getElementById('copySteamIdBtn').addEventListener('click', () => {
    if (!cachedSteamId || cachedSteamId.includes("---")) return;
    navigator.clipboard.writeText(cachedSteamId).then(() => {
      const textSpan = document.getElementById('profSteamIdText');
      const originalText = textSpan.textContent;
      textSpan.textContent = "Скопійовано! ✔";
      textSpan.style.color = "#4ade80";
      setTimeout(() => {
        textSpan.textContent = originalText;
        textSpan.style.color = "";
      }, 1500);
    });
  });

  document.getElementById('filterRarity').addEventListener('change', applyInventoryFilters);
  document.getElementById('filterSort').addEventListener('change', applyInventoryFilters);

  document.getElementById('saveTradeBtn').addEventListener('click', async () => {
    const tradeUrl = document.getElementById('tradeUrlInput').value;
    try {
      const res = await fetch('/api/user/update-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeUrl })
      });
      const data = await res.json();
      alert(data.message);
    } catch (e) {
      alert("Не вдалося зберегти трейд-посилання.");
    }
  });

  document.getElementById('activatePromoBtn').addEventListener('click', async () => {
    const codeInput = document.getElementById('promoInput');
    const code = codeInput.value;
    try {
      const res = await fetch('/api/promo/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        balanceDisplay.textContent = Math.floor(data.newBalance);
        codeInput.value = '';
        loadProfile();
      }
    } catch (e) {
      alert("Помилка активації промокоду.");
    }
  });

  // 7. LIVE DROP FEED
  async function updateLiveDropsFeed() {
    try {
      const res = await fetch('/api/live-drops');
      const data = await res.json();
      
      if (data.success && data.drops) {
        const feedContainer = document.getElementById('liveDropsFeed');
        if (!feedContainer) return;

        feedContainer.innerHTML = '';
        
        if (data.drops.length === 0) {
          feedContainer.innerHTML = `<div class="text-xs text-gray-500 w-full text-center">Тут з'являться перші виграші системи</div>`;
          return;
        }

        data.drops.forEach(drop => {
          const item = drop.item;
          let rarityColor = 'border-gray-700';
          if (item.chance < 2) rarityColor = 'border-red-500 bg-red-950/20';
          else if (item.chance < 15) rarityColor = 'border-purple-500 bg-purple-950/20';
          else rarityColor = 'border-blue-500 bg-blue-950/10';

          const dropBadge = document.createElement('div');
          dropBadge.className = `flex items-center gap-2 border-b-2 ${rarityColor} p-2 h-14 rounded min-w-[170px] max-w-[170px] shrink-0 animate-fade-in relative group`;
          dropBadge.innerHTML = `
            <img src="${item.imageUrl || 'https://placehold.co/50'}" class="w-10 h-10 object-contain">
            <div class="flex flex-col min-w-0 flex-1">
              <span class="text-[10px] font-bold text-gray-200 truncate pr-1" title="${item.name}">${item.name}</span>
              <span class="text-[9px] text-yellow-400 font-mono font-bold">${Math.floor(item.price)} Б</span>
            </div>
            <div class="absolute inset-0 bg-gray-900/90 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 px-2 pointer-events-none">
              <img src="${drop.user?.avatarUrl || 'https://placehold.co/20'}" class="w-4 h-4 rounded-full">
              <span class="text-[9px] text-gray-300 font-bold truncate">${drop.user?.username || 'Гість'}</span>
            </div>
          `;
          feedContainer.appendChild(dropBadge);
        });
      }
    } catch (e) {
      console.error("Live feed error:", e);
    }
  }

  // 8. СИСТЕМА ЩОДЕННОГО БЕЗКОШТОВНОГО КЕЙСУ
  async function checkDailyCaseStatus() {
    if (!isAuthorized) {
      claimDailyBtn.textContent = "Увійдіть для отримання";
      claimDailyBtn.disabled = true;
      return;
    }

    try {
      const res = await fetch('/api/daily-case/status');
      const data = await res.json();

      clearInterval(dailyCaseInterval);

      if (data.available) {
        claimDailyBtn.textContent = "Забрати бонус";
        claimDailyBtn.disabled = false;
        claimDailyBtn.classList.remove('bg-gray-800');
        claimDailyBtn.classList.add('bg-yellow-500');
      } else {
        startDailyCooldownTimer(data.timeLeft);
      }
    } catch (e) {
      console.error("Помилка перевірки статусу щоденного кейсу:", e);
    }
  }

  function startDailyCooldownTimer(durationMs) {
    let timeLeft = durationMs;
    claimDailyBtn.disabled = true;
    claimDailyBtn.classList.remove('bg-yellow-500');
    claimDailyBtn.classList.add('bg-gray-800');

    function updateTimerString() {
      if (timeLeft <= 0) {
        clearInterval(dailyCaseInterval);
        claimDailyBtn.textContent = "Забрати бонус";
        claimDailyBtn.disabled = false;
        claimDailyBtn.classList.remove('bg-gray-800');
        claimDailyBtn.classList.add('bg-yellow-500');
        return;
      }
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      const hStr = hours.toString().padStart(2, '0');
      const mStr = minutes.toString().padStart(2, '0');
      const sStr = seconds.toString().padStart(2, '0');

      claimDailyBtn.textContent = `${hStr}:${mStr}:${sStr}`;
      timeLeft -= 1000;
    }

    updateTimerString();
    dailyCaseInterval = setInterval(updateTimerString, 1000);
  }

  claimDailyBtn.addEventListener('click', async () => {
    if (claimDailyBtn.disabled) return;

    try {
      claimDailyBtn.disabled = true;
      claimDailyBtn.textContent = "Відкриття...";

      const res = await fetch('/api/daily-case/open', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        dailyModalImg.src = data.item.imageUrl || 'https://placehold.co/150';
        dailyModalName.textContent = data.item.name;
        dailyModalPrice.textContent = `${Math.floor(data.item.price)} Б`;

        dailyModal.classList.remove('hidden');
        dailyModal.classList.add('flex');

        checkDailyCaseStatus();
        if (typeof updateLiveDropsFeed === 'function') updateLiveDropsFeed();
      } else {
        alert(data.message);
        checkDailyCaseStatus();
      }
    } catch (e) {
      alert("Не вдалося відкрити щоденний кейс.");
      checkDailyCaseStatus();
    }
  });

  closeDailyModalBtn.addEventListener('click', () => {
    dailyModal.classList.remove('flex');
    dailyModal.classList.add('hidden');
    syncInventory(); // Оновлюємо інвентар після закриття щоденки!
  });

  // Старт системи
  updateLiveDropsFeed();
  setInterval(updateLiveDropsFeed, 4000);
  checkAuth();
  loadCases();
});