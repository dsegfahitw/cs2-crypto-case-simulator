document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById('loginBtn');
  const userProfileInfo = document.getElementById('userProfileInfo');
  const userAvatar = document.getElementById('userAvatar');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const balanceDisplay = document.getElementById('balanceDisplay');
  
  const homeView = document.getElementById('homeView');
  const caseView = document.getElementById('caseView');
  const inventoryView = document.getElementById('inventoryView');
  const faqView = document.getElementById('faqView');
  const casesGrid = document.getElementById('casesGrid');
  const inventoryGrid = document.getElementById('inventoryGrid');
  const inventoryCount = document.getElementById('inventoryCount');
  const emptyInventoryMsg = document.getElementById('emptyInventoryMsg');
  
  const logoBtn = document.getElementById('logoBtn');
  const inventoryBtn = document.getElementById('inventoryBtn');
  const faqBtn = document.getElementById('faqBtn');
  const backToHomeBtns = document.querySelectorAll('.backToHomeBtn');
  
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
  
  let lastDroppedInventoryId = null;
  let currentFinalBalance = 0;
  let allCasesData = {}; 
  let activeCaseId = null;
  let isAuthorized = false;

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
        balanceDisplay.textContent = Math.floor(data.balance); // Бали заокруглюємо
      } else {
        isAuthorized = false;
        loginBtn.classList.remove('hidden');
        userProfileInfo.classList.add('hidden');
      }
    } catch (e) {
      console.error("Auth error", e);
    }
  }

  // 2. КЕЙСИ
  async function loadCases() {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.success) {
        data.cases.forEach(c => allCasesData[c.id] = c);
        renderHomeGrid();
      }
    } catch (e) {
      console.error("Cases load error", e);
    }
  }

  function renderHomeGrid() {
    casesGrid.innerHTML = '';
    Object.entries(allCasesData).forEach(([id, caseData]) => {
      const card = document.createElement('div');
      card.className = "bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all group";
      card.innerHTML = `
        <div class="w-32 h-32 bg-gray-700 rounded-md mb-4 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
          <img src="${caseData.imageUrl || 'https://placehold.co/300'}" class="w-full h-full object-cover">
        </div>
        <h3 class="text-lg font-bold text-white mb-2 text-center">${caseData.title}</h3>
        <div class="bg-gray-900 px-4 py-1 rounded text-yellow-400 font-mono font-bold">${Math.floor(caseData.price)} Б</div>
      `;
      card.addEventListener('click', () => showCase(id));
      casesGrid.appendChild(card);
    });
  }

  // 3. ІНВЕНТАР ТА ПРОДАЖ
  async function loadInventory() {
    if (!isAuthorized) return alert("Будь ласка, увійдіть в акаунт!");
    
    showView(inventoryView);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        renderInventory(data.inventory);
      }
    } catch (e) {
      console.error("Inventory load error", e);
    }
  }

  function renderInventory(items) {
    inventoryGrid.innerHTML = '';
    inventoryCount.textContent = `${items.length} предметів`;
    
    if (items.length === 0) {
      emptyInventoryMsg.classList.remove('hidden');
    } else {
      emptyInventoryMsg.classList.add('hidden');
      // Сортуємо від найдорожчих до найдешевших
      items.sort((a, b) => b.item.price - a.item.price).forEach(invRecord => {
        const item = invRecord.item;
        const card = document.createElement('div');
        card.className = `bg-gray-800 border border-gray-700 rounded p-4 flex flex-col items-center text-center relative overflow-hidden`;
        card.innerHTML = `
          <img src="${item.imageUrl || 'https://placehold.co/150'}" class="w-16 h-16 object-contain mb-2">
          <span class="text-sm font-bold text-gray-200 mb-3 block truncate w-full">${item.name}</span>
          <button onclick="sellItem('${invRecord.id}', ${item.price})" class="w-full bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/50 transition-colors py-1.5 rounded text-xs font-bold">
            ПРОДАТИ ЗА ${Math.floor(item.price)} Б
          </button>
        `;
        inventoryGrid.appendChild(card);
      });
    }
  }

  // Глобальна функція для продажу з HTML
  window.sellItem = async (inventoryId, price) => {
    try {
      const res = await fetch('/api/sell-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId })
      });
      const data = await res.json();
      if (data.success) {
        balanceDisplay.textContent = Math.floor(data.newBalance);
        loadInventory(); // Перезавантажуємо сітку
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Помилка продажу!");
    }
  };

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

      // Баланс оновлюється на суму "ПІСЛЯ ПОКУПКИ" (без вартості дропу, бо баг пофікшено!)
      balanceDisplay.textContent = Math.floor(data.user.balanceAfterBuy);
      currentFinalBalance = data.user.finalBalance; // Має бути таким самим

      const WINNING_INDEX = 65; 
      const currentItems = allCasesData[activeCaseId].items;

      // ХОВАЄМО ID ТА ОНОВЛЮЄМО ТЕКСТ КНОПКИ
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
  // КЛІК: МИТТЄВЕ ВІДКРИТТЯ (Без анімації рулетки)
  openCaseFastBtn.addEventListener('click', async () => {
    if (!isAuthorized) return alert("Спочатку увійдіть в акаунт!");
    if (!activeCaseId) return;

    // Блокуємо обидві кнопки під час запиту
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

      // 1. Оновлюємо баланс та кешуємо ID для продажу
      balanceDisplay.textContent = Math.floor(data.user.balanceAfterBuy);
      currentFinalBalance = data.user.finalBalance;
      lastDroppedInventoryId = data.inventoryId;
      sellInstantlyBtn.textContent = `ПРОДАТИ ЗА ${Math.floor(data.drop.price)} Б`;

      // 2. МИТТЄВО відкриваємо модалку виграшу (без setTimeout на 6 секунд)
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
  collectBtn.addEventListener('click', () => {
    winModal.classList.add('opacity-0');
    winModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
      winModal.classList.add('hidden');
      balanceDisplay.textContent = Math.floor(currentFinalBalance);
      openCaseBtn.disabled = false;
      openCaseFastBtn.disabled = false;
      document.querySelector('.backToHomeBtn').style.pointerEvents = 'auto';
    }, 300); 
  });

  // КЛІК: МИТТЄВИЙ ПРОДАЖ З МОДАЛКИ ВИГРАШУ
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
        // Оновлюємо баланс користувача балами за продаж
        balanceDisplay.textContent = Math.floor(data.newBalance);
        currentFinalBalance = data.newBalance;

        // Плавно закриваємо модальне вікно
        winModal.classList.add('opacity-0');
        winModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
          winModal.classList.add('hidden');
          openCaseBtn.disabled = false;
          openCaseFastBtn.disabled = false;
          document.querySelector('.backToHomeBtn').style.pointerEvents = 'auto';
        }, 300);
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Помилка швидкого продажу предмета.");
    }
  });

  // 5. НАВІГАЦІЯ
  function showView(viewElement) {
    [homeView, caseView, inventoryView, faqView].forEach(el => {
      if (el === viewElement) {
        el.classList.remove('hidden');
        if(el === caseView) el.classList.add('flex');
      } else {
        el.classList.add('hidden');
        el.classList.remove('flex');
      }
    });
  }

  logoBtn.addEventListener('click', () => showView(homeView));
  backToHomeBtns.forEach(btn => btn.addEventListener('click', () => showView(homeView)));
  inventoryBtn.addEventListener('click', loadInventory);
  faqBtn.addEventListener('click', () => showView(faqView));

  // СТАРТ
  checkAuth();
  loadCases();
});