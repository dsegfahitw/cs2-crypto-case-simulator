'use client';

import { useState, useEffect } from 'react';
import { ItemData, UserProfile } from '@/app/page';

interface InventoryRecord {
  id: string;
  item: ItemData;
}

interface Props {
  user: UserProfile;
  allItems: ItemData[];
  onUpdateBalance: (b: number) => void;
}

export default function UpgradeView({ user, allItems, onUpdateBalance }: Props) {
  const [myInventory, setMyInventory] = useState<InventoryRecord[]>([]);
  const [selectedMyItem, setSelectedMyItem] = useState<InventoryRecord | null>(null);
  const [selectedTargetItem, setSelectedTargetItem] = useState<ItemData | null>(null);
  
  const [spinning, setSpinning] = useState(false);
  const [rollAngle, setRollAngle] = useState(0);
  const [resultData, setResultData] = useState<{ isWin: boolean; text: string; item: ItemData | null } | null>(null);

  const fetchInventory = async () => {
    const res = await fetch('/api/inventory', { cache: 'no-store' });
    const data = await res.json();
    if (data.success) setMyInventory(data.inventory);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  let chance = 0;
  if (selectedMyItem && selectedTargetItem) {
    chance = (selectedMyItem.item.price / selectedTargetItem.price) * 100;
    if (chance > 95) chance = 95;
  }

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const winDashLength = (chance / 100) * circumference;

  // ЛОГІКА АВТОВИБОРУ РИЗИКУ (Множники)
  const handleRiskSelect = (multiplier: number) => {
    if (!selectedMyItem) {
      alert("Please select your skin first!");
      return;
    }
    const targetPrice = selectedMyItem.item.price * multiplier;
    
    // Знаходимо всі предмети, які близькі до цієї ціни (похибка 20%)
    const validTargets = allItems.filter(item => 
      item.price >= targetPrice * 0.8 && item.price <= targetPrice * 1.5
    );

    let chosenTarget;
    if (validTargets.length > 0) {
      // Беремо випадковий з підходящих
      chosenTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
    } else {
      // Якщо немає підходящих, беремо найближчий за ціною взагалі
      chosenTarget = allItems.reduce((prev, curr) => {
        return (Math.abs(curr.price - targetPrice) < Math.abs(prev.price - targetPrice) ? curr : prev);
      });
    }
    setSelectedTargetItem(chosenTarget);
  };

  const handleUpgrade = async () => {
    if (!selectedMyItem || !selectedTargetItem) return;
    setSpinning(true);
    setResultData(null);
    setRollAngle(0);

    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: selectedMyItem.id,
          targetItemId: selectedTargetItem.id
        })
      });
      const data = await res.json();

      if (data.success) {
        const finalAngle = (data.roll / 100) * 360;
        const extraSpins = 360 * 6; // 6 швидких обертів
        const totalRotation = extraSpins + finalAngle;

        setTimeout(() => setRollAngle(totalRotation), 50);

        setTimeout(() => {
          setSpinning(false);
          setResultData({
            isWin: data.isWin,
            text: data.isWin ? 'SUCCESS!' : 'CRASHED!',
            item: data.isWin ? selectedTargetItem : selectedMyItem.item
          });
          
          setSelectedMyItem(null);
          setSelectedTargetItem(null);
          fetchInventory(); 
        }, 4000); 

      } else {
        alert(data.message);
        setSpinning(false);
      }
    } catch (e) {
      alert("Server error");
      setSpinning(false);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto animate-fade-in flex flex-col gap-6 pb-10">
      <div className="text-center mb-2">
        <h2 className="text-4xl font-black text-white tracking-wide uppercase drop-shadow-md">Upgrades</h2>
        <p className="text-gray-400 mt-2">Sacrifice your cheap skins for a chance to win something legendary.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-gray-900/50 p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
        
        {/* ЛІВА ЧАСТИНА */}
        <div className="glass-panel p-6 rounded-xl flex flex-col items-center h-72 justify-center border-l-4 border-blue-500 relative z-10">
          <h3 className="absolute top-3 left-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Your Skin</h3>
          {selectedMyItem ? (
            <div className="flex flex-col items-center animate-fade-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedMyItem.item.imageUrl || ''} className="w-28 h-28 object-contain mb-3 drop-shadow-lg" alt="" />
              <div className="text-sm font-bold text-white text-center w-full">{selectedMyItem.item.name}</div>
              <div className="text-xs text-yellow-400 font-mono font-bold mt-1">{Math.floor(selectedMyItem.item.price)} pts</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Select a skin from below</div>
          )}
        </div>

        {/* ЦЕНТР: КОЛЕСО (З ФІКСОМ КНОПКИ ТА КОЛЬОРІВ) */}
        <div className="flex flex-col items-center justify-center relative z-10 w-full h-72">
          <div className="relative w-60 h-60 flex items-center justify-center">
            
            {/* SVG Колесо Фортуни */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] z-0">
              {/* Базова частина (Lose - Червона) */}
              <circle cx="120" cy="120" r={radius} stroke="#ef4444" strokeWidth="12" fill="none" className="opacity-30" />
              {/* Лінія шансу (Win - Зелена) */}
              <circle 
                cx="120" cy="120" r={radius} 
                stroke="#22c55e" strokeWidth="12" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${winDashLength} ${circumference}`}
                className="transition-all duration-500"
              />
            </svg>

            {/* Стрілка (ФІКС: pointer-events-none щоб не блокувати кнопку) */}
            <div 
              className="absolute inset-0 w-full h-full z-20 pointer-events-none"
              style={{ 
                transform: `rotate(${rollAngle}deg)`,
                transition: spinning ? 'transform 3.5s cubic-bezier(0.1, 0.9, 0.2, 1)' : 'none'
              }}
            >
              <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-4 h-8 bg-white rounded-b-full shadow-[0_0_15px_white] border-2 border-gray-900 z-30"></div>
            </div>

            {/* Внутрішність кола (Кнопка) */}
            <div className="z-10 flex flex-col items-center bg-gray-900 w-48 h-48 rounded-full justify-center shadow-inner border-4 border-gray-800">
              {resultData ? (
                <div className="flex flex-col items-center animate-fade-in">
                  <div className={`text-2xl font-black tracking-widest uppercase ${resultData.isWin ? 'text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}>
                    {resultData.isWin ? 'WIN!' : 'CRASH'}
                  </div>
                  <button 
                    onClick={() => setResultData(null)}
                    className="mt-3 text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1 rounded"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] font-mono">
                    {chance > 0 ? chance.toFixed(2) : '0.00'}%
                  </div>
                  <button
                    onClick={handleUpgrade}
                    disabled={!selectedMyItem || !selectedTargetItem || spinning}
                    className={`mt-4 px-6 py-2 rounded-full font-black uppercase tracking-wider transition-all text-sm
                      ${spinning ? 'bg-gray-700 text-gray-500' 
                        : chance > 0 ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                        : 'bg-gray-800 text-gray-500'}`}
                  >
                    {spinning ? 'Rolling...' : 'Upgrade'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ПРАВА ЧАСТИНА */}
        <div className="glass-panel p-6 rounded-xl flex flex-col items-center h-72 justify-center border-r-4 border-green-500 relative z-10">
          <h3 className="absolute top-3 right-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Target Skin</h3>
          {selectedTargetItem ? (
            <div className="flex flex-col items-center animate-fade-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedTargetItem.imageUrl || ''} className="w-28 h-28 object-contain mb-3 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" alt="" />
              <div className="text-sm font-bold text-white text-center w-full">{selectedTargetItem.name}</div>
              <div className="text-xs text-green-400 font-mono font-bold mt-1">{Math.floor(selectedTargetItem.price)} pts</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Select target or risk level</div>
          )}
        </div>
      </div>

      {/* ВИБІР ПРЕДМЕТІВ ТА МНОЖНИКИ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
        
        {/* Мій інвентар */}
        <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 h-96 flex flex-col shadow-inner">
          <div className="text-xs font-bold text-blue-400 mb-4 uppercase tracking-widest">1. Select Your Skin</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto no-scrollbar pb-4 pr-1">
            {myInventory.map(inv => (
              <div 
                key={inv.id} 
                onClick={() => { if(!spinning) setSelectedMyItem(inv) }}
                className={`p-3 rounded-xl bg-gray-800 border cursor-pointer transition-all flex flex-col items-center text-center
                  ${spinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  ${selectedMyItem?.id === inv.id ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-gray-700' : 'border-gray-700'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inv.item.imageUrl || ''} className="w-12 h-12 object-contain mb-2" alt="" />
                <span className="text-[10px] font-bold text-gray-200 truncate w-full">{inv.item.name}</span>
                <span className="text-[10px] font-mono text-yellow-500">{Math.floor(inv.item.price)} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Рівні Ризику та Всі предмети */}
        <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 h-96 flex flex-col shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs font-bold text-green-400 uppercase tracking-widest">2. Select Target / Risk</div>
            
            {/* КНОПКИ РИЗИКУ */}
            <div className="flex gap-2">
              {[1.5, 2, 5, 10].map(mult => (
                <button
                  key={mult}
                  onClick={() => handleRiskSelect(mult)}
                  disabled={!selectedMyItem || spinning}
                  className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 px-3 py-1 rounded text-[10px] font-black text-gray-300 transition-colors"
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto no-scrollbar pb-4 pr-1">
            {allItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => { if(!spinning) setSelectedTargetItem(item) }}
                className={`p-3 rounded-xl bg-gray-800 border cursor-pointer transition-all flex flex-col items-center text-center
                  ${spinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  ${selectedTargetItem?.id === item.id ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] bg-gray-700' : 'border-gray-700'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl || ''} className="w-12 h-12 object-contain mb-2" alt="" />
                <span className="text-[10px] font-bold text-gray-200 truncate w-full">{item.name}</span>
                <span className="text-[10px] font-mono text-green-400">{Math.floor(item.price)} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}