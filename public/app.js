document.addEventListener("DOMContentLoaded", () => {
  // Елементи UI
  const balanceDisplay = document.getElementById('balanceDisplay');
  const usernameDisplay = document.getElementById('usernameDisplay');
  
  // В'юшки (Views)
  const homeView = document.getElementById('homeView');
  const caseView = document.getElementById('caseView');
  
  // Елементи Home View
  const casesGrid = document.getElementById('casesGrid');
  const logoBtn = document.getElementById('logoBtn');
  
  // Елементи Case View
  const backBtn = document.getElementById('backBtn');
  const currentCaseTitle = document.getElementById('currentCaseTitle');
  const currentCasePrice = document.getElementById('currentCasePrice');
  const openCaseBtn = document.getElementById('openCaseBtn');
  const rouletteTrack = document.getElementById('rouletteTrack');
  const caseContentsGrid = document.getElementById('caseContentsGrid');
  
  // Елементи Модалки
  const winModal = document.getElementById('winModal');
  const winItemName = document.getElementById('winItemName');
  const winItemPrice = document.getElementById('winItemPrice');
  const collectBtn = document.getElementById('collectBtn');

  // Стейт додатку
  let currentFinalBalance = 0;
  let allCasesData = {}; 
  let activeCaseId = null; // Зберігаємо ID обраного кейсу

  // Ініціалізація
  async function loadInitialData() {
    try {
      const profileRes = await fetch('/api/user-profile');
      const profileData = await profileRes.json();
      if (profileData.success) {
        usernameDisplay.textContent = profileData.username;
        balanceDisplay.textContent = Number(profileData.balance).toFixed(2);
      }

      const casesRes = await fetch('/api/cases');
      const casesData = await casesRes.json();
      if (casesData.success) {
        allCasesData = casesData.cases;
        renderHomeGrid(); // Малюємо головну сторінку
      }
    } catch (error) {
      console.error("Помилка завантаження даних:", error);
    }
  }

  // МАРШРУТИЗАЦІЯ (Роутінг)
  function showHome() {
    homeView.classList.remove('hidden');
    caseView.classList.add('hidden');
    activeCaseId = null;
  }

  function showCase(caseId) {
    activeCaseId = caseId;
    const caseData = allCasesData[caseId];
    
    // Оновлюємо заголовки
    currentCaseTitle.textContent = caseData.title;
    currentCasePrice.textContent = `$${caseData.price.toFixed(2)}`;
    
    // Малюємо вміст кейсу (нижня сітка)
    renderCaseContents(caseData.items);
    
    // Підготовлюємо рулетку
    renderDummyTrack(caseId);

    // Перемикаємо видимість
    homeView.classList.add('hidden');
    caseView.classList.remove('hidden');
    caseView.classList.add('flex'); // Повертаємо flex після зняття hidden
  }

  // РЕНДЕР: Головна сітка кейсів
  function renderHomeGrid() {
    casesGrid.innerHTML = '';
    for (const [caseId, caseData] of Object.entries(allCasesData)) {
      const card = document.createElement('div');
      card.className = "bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:border-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all group";
      card.innerHTML = `
        <div class="w-32 h-32 bg-gray-700 rounded-md mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
          <span class="text-4xl">📦</span> 
        </div>
        <h3 class="text-lg font-bold text-white mb-2 text-center">${caseData.title}</h3>
        <div class="bg-gray-900 px-4 py-1 rounded text-green-400 font-mono">$${caseData.price.toFixed(2)}</div>
      `;
      
      // Клік по кейсу перекидає на його сторінку
      card.addEventListener('click', () => showCase(caseId));
      casesGrid.appendChild(card);
    }
  }

  // РЕНДЕР: Вміст конкретного кейсу
  function renderCaseContents(items) {
    caseContentsGrid.innerHTML = '';
    // Сортуємо предмети за ціною (від найдорожчого)
    const sortedItems = [...items].sort((a, b) => b.price - a.price);

    sortedItems.forEach(item => {
      // Визначаємо колір рамки залежно від шансу (імітація рідкості)
      let rarityColor = 'border-gray-600'; // Ширпотреб
      if (item.chance < 5) rarityColor = 'border-red-500'; // Таємне/Ніж
      else if (item.chance < 20) rarityColor = 'border-purple-500'; // Засекречене

      const itemCard = document.createElement('div');
      itemCard.className = `bg-gray-800 border-b-4 ${rarityColor} rounded p-4 flex flex-col items-center text-center`;
      itemCard.innerHTML = `
        <span class="text-sm font-bold text-gray-200 mb-1">${item.name}</span>
        <span class="text-xs text-gray-400 mb-2">Шанс: ${item.chance}%</span>
        <span class="text-sm font-mono text-green-400">$${item.price.toFixed(2)}</span>
      `;
      caseContentsGrid.appendChild(itemCard);
    });
  }

  // РЕНДЕР: Підготовка стрічки рулетки (ФІКС ЦІН)
  function renderDummyTrack(caseId) {
    if (!allCasesData[caseId]) return;
    const items = allCasesData[caseId].items;
    let trackHTML = '';
    
    for (let i = 0; i < 80; i++) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      trackHTML += `
        <div class="weapon-card">
          <span class="weapon-name">${randomItem.name}</span>
          <span class="weapon-price">$${randomItem.price.toFixed(2)}</span> </div>
      `;
    }
    
    rouletteTrack.classList.remove('roulette-spin');
    rouletteTrack.style.transform = 'translateX(0px)';
    rouletteTrack.innerHTML = trackHTML;
  }

  // ЛОГІКА РУЛЕТКИ
  openCaseBtn.addEventListener('click', async () => {
    if (!activeCaseId) return;

    openCaseBtn.disabled = true;
    backBtn.style.pointerEvents = 'none'; // Блокуємо вихід під час спіну
    backBtn.classList.add('opacity-50');
    
    rouletteTrack.classList.remove('roulette-spin');
    rouletteTrack.style.transform = 'translateX(0px)';
    void rouletteTrack.offsetWidth; 

    try {
      const res = await fetch(`/api/open-case?caseType=${activeCaseId}`);
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

      const TOTAL_CARDS = 80;
      const WINNING_INDEX = 65; 
      const currentItems = allCasesData[activeCaseId].items; 
      
      let trackHTML = '';
      for (let i = 0; i < TOTAL_CARDS; i++) {
        if (i === WINNING_INDEX) {
          trackHTML += `
            <div class="weapon-card" style="border-color: #4ade80; box-shadow: inset 0 0 15px rgba(74, 222, 128, 0.3);">
              <span class="weapon-name text-green-400 font-bold">${data.drop.name}</span>
              <span class="weapon-price text-green-400">$${data.drop.price.toFixed(2)}</span>
            </div>
          `;
        } else {
          const randomItem = currentItems[Math.floor(Math.random() * currentItems.length)];
          trackHTML += `
            <div class="weapon-card">
              <span class="weapon-name">${randomItem.name}</span>
              <span class="weapon-price text-gray-400">$${randomItem.price.toFixed(2)}</span>
            </div>
          `;
        }
      }
      rouletteTrack.innerHTML = trackHTML;

      const cardWidth = 150; 
      const gap = 16; 
      const containerWidth = rouletteTrack.parentElement.offsetWidth;
      
      const targetCardCenterPosition = (WINNING_INDEX * (cardWidth + gap)) + (cardWidth / 2);
      const randomOffset = Math.floor(Math.random() * 100) - 50; 
      const finalTranslate = -(targetCardCenterPosition - (containerWidth / 2) + randomOffset);

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

    } catch (error) {
      console.error(error);
      alert("Помилка з'єднання з сервером.");
      openCaseBtn.disabled = false;
      backBtn.style.pointerEvents = 'auto';
      backBtn.classList.remove('opacity-50');
    }
  });

  // Модалка "Забрати"
  collectBtn.addEventListener('click', () => {
    winModal.classList.add('opacity-0');
    winModal.querySelector('div').classList.add('scale-95');
    
    setTimeout(() => {
      winModal.classList.add('hidden');
      balanceDisplay.textContent = currentFinalBalance;
      
      // Розблоковуємо кнопки
      openCaseBtn.disabled = false;
      backBtn.style.pointerEvents = 'auto';
      backBtn.classList.remove('opacity-50');
    }, 300); 
  });

  // Обробники навігації
  backBtn.addEventListener('click', showHome);
  logoBtn.addEventListener('click', showHome);

  // Старт
  loadInitialData();
});