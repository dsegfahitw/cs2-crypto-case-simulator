// public/app.js
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById('loginBtn');
  const userProfileInfo = document.getElementById('userProfileInfo');
  const userAvatar = document.getElementById('userAvatar');
  const usernameDisplay = document.getElementById('usernameDisplay');
  const balanceDisplay = document.getElementById('balanceDisplay');
  
  const homeView = document.getElementById('homeView');
  const caseView = document.getElementById('caseView');
  const casesGrid = document.getElementById('casesGrid');
  const logoBtn = document.getElementById('logoBtn');
  const backBtn = document.getElementById('backBtn');
  
  const currentCaseTitle = document.getElementById('currentCaseTitle');
  const currentCasePrice = document.getElementById('currentCasePrice');
  const openCaseBtn = document.getElementById('openCaseBtn');
  const rouletteTrack = document.getElementById('rouletteTrack');
  const caseContentsGrid = document.getElementById('caseContentsGrid');
  
  const winModal = document.getElementById('winModal');
  const winItemName = document.getElementById('winItemName');
  const winItemPrice = document.getElementById('winItemPrice');
  const collectBtn = document.getElementById('collectBtn');

  let currentFinalBalance = 0;
  let allCasesData = {}; 
  let activeCaseId = null;

  // 1. ПЕРЕВІРКА АВТОРИЗАЦІЇ
  async function checkAuth() {
    try {
      const res = await fetch('/api/user-profile');
      const data = await res.json();
      if (data.success && data.authorized) {
        loginBtn.classList.add('hidden');
        userProfileInfo.classList.remove('hidden');
        userAvatar.src = data.avatarUrl;
        usernameDisplay.textContent = data.username;
        balanceDisplay.textContent = Number(data.balance).toFixed(2);
      } else {
        loginBtn.classList.remove('hidden');
        userProfileInfo.classList.add('hidden');
      }
    } catch (e) {
      console.error("Помилка профілю", e);
    }
  }

  // 2. ЗАВАНТАЖЕННЯ КЕЙСІВ З БД
  async function loadCases() {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.success) {
        // Трансформуємо масив з БД у зручний об'єкт для фронту
        data.cases.forEach(c => {
          allCasesData[c.id] = c;
        });
        renderHomeGrid();
      }
    } catch (e) {
      console.error("Помилка завантаження кейсів", e);
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
        <div class="bg-gray-900 px-4 py-1 rounded text-green-400 font-mono font-bold">$${caseData.price.toFixed(2)}</div>
      `;
      card.addEventListener('click', () => showCase(id));
      casesGrid.appendChild(card);
    });
  }

  function showCase(caseId) {
    activeCaseId = caseId;
    const caseData = allCasesData[caseId];
    currentCaseTitle.textContent = caseData.title;
    currentCasePrice.textContent = `$${caseData.price.toFixed(2)}`;
    
    renderCaseContents(caseData.items);
    renderDummyTrack(caseId);

    homeView.classList.add('hidden');
    caseView.classList.remove('hidden');
    caseView.classList.add('flex');
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
        <span class="text-xs text-gray-400 mb-2">Шанс: ${item.chance}%</span>
        <span class="text-sm font-mono text-green-400 font-bold">$${item.price.toFixed(2)}</span>
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
          <span class="weapon-price">$${item.price.toFixed(2)}</span>
        </div>
      `;
    }
    rouletteTrack.classList.remove('roulette-spin');
    rouletteTrack.style.transform = 'translateX(0px)';
    rouletteTrack.innerHTML = trackHTML;
  }

  // КЛІК: ВІДКРИТИ КЕЙС (Передаємо POST з JSON)
  openCaseBtn.addEventListener('click', async () => {
    if (!activeCaseId) return;

    openCaseBtn.disabled = true;
    backBtn.style.pointerEvents = 'none';
    backBtn.classList.add('opacity-50');
    
    rouletteTrack.classList.remove('roulette-spin');
    rouletteTrack.style.transform = 'translateX(0px)';
    void rouletteTrack.offsetWidth; 

    try {
      const res = await fetch('/api/open-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: activeCaseId, clientSeed: "my_lucky_seed_777" })
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        openCaseBtn.disabled = false;
        backBtn.style.pointerEvents = 'auto';
        backBtn.classList.remove('opacity-50');
        return;
      }

      balanceDisplay.textContent = data.user.balanceAfterBuy;
      currentFinalBalance = data.user.finalBalance;

      const WINNING_INDEX = 65; 
      const currentItems = allCasesData[activeCaseId].items; 
      
      let trackHTML = '';
      for (let i = 0; i < 80; i++) {
        if (i === WINNING_INDEX) {
          trackHTML += `
            <div class="weapon-card" style="border-color: #4ade80; box-shadow: inset 0 0 15px rgba(74, 222, 128, 0.2);">
              <img src="${data.drop.imageUrl || 'https://placehold.co/150'}" class="w-12 h-12 object-contain mb-1">
              <span class="weapon-name text-green-400 font-bold truncate w-full">${data.drop.name}</span>
              <span class="weapon-price text-green-400 font-bold">$${data.drop.price.toFixed(2)}</span>
            </div>
          `;
        } else {
          const item = currentItems[Math.floor(Math.random() * currentItems.length)];
          trackHTML += `
            <div class="weapon-card">
              <img src="${item.imageUrl || 'https://placehold.co/150'}" class="w-12 h-12 object-contain mb-1">
              <span class="weapon-name truncate w-full">${item.name}</span>
              <span class="weapon-price text-gray-400">$${item.price.toFixed(2)}</span>
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
        winItemPrice.textContent = `$${data.drop.price.toFixed(2)}`;
        winModal.classList.remove('hidden');
        setTimeout(() => {
          winModal.classList.remove('opacity-0');
          winModal.querySelector('div').classList.remove('scale-95');
        }, 50);
      }, 6000);

    } catch (e) {
      console.error(e);
      alert("Помилка з'єднання з сервером.");
      openCaseBtn.disabled = false;
      backBtn.style.pointerEvents = 'auto';
      backBtn.classList.remove('opacity-50');
    }
  });

  collectBtn.addEventListener('click', () => {
    winModal.classList.add('opacity-0');
    winModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
      winModal.classList.add('hidden');
      balanceDisplay.textContent = currentFinalBalance;
      openCaseBtn.disabled = false;
      backBtn.style.pointerEvents = 'auto';
      backBtn.classList.remove('opacity-50');
    }, 300); 
  });

  backBtn.addEventListener('click', () => { homeView.classList.remove('hidden'); caseView.classList.add('hidden'); activeCaseId = null; });
  logoBtn.addEventListener('click', () => { homeView.classList.remove('hidden'); caseView.classList.add('hidden'); activeCaseId = null; });

  // Старт
  checkAuth();
  loadCases();
});