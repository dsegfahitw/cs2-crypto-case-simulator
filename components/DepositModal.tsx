'use client';

import { useState } from 'react';
import { playSound } from '@/lib/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdateBalance: (newBalance: number) => void;
}

const PAYMENT_METHODS = [
  { id: 'visa', name: 'Visa / Mastercard', icon: '💳', gradient: 'from-blue-800 to-indigo-900', border: 'border-blue-500' },
  { id: 'crypto', name: 'Cryptocurrency', icon: '🪙', gradient: 'from-orange-800 to-yellow-900', border: 'border-yellow-500' },
  { id: 'skins', name: 'Pay by Skins', icon: '🔫', gradient: 'from-gray-800 to-gray-900', border: 'border-gray-500' },
  { id: 'gift', name: 'Gift Cards', icon: '🎁', gradient: 'from-emerald-800 to-teal-900', border: 'border-emerald-500' },
];

const QUICK_AMOUNTS = [10, 40, 60, 100, 200, 500];

// НАШІ МАРКЕТИНГОВІ ОФЕРИ
const OFFERS = [
  {
    id: 'welcome',
    type: 'DEPOSIT + CASES',
    reward: '10% Deposit Bonus (min $10) + 3 Free Cases',
    code: 'WELCOME5',
    minDeposit: 10,
    bonusPercent: 10
  },
  {
    id: 'special',
    type: 'DEPOSIT',
    reward: '15% Weekend Deposit Bonus (min $40)',
    code: 'WEEKEND15',
    minDeposit: 40,
    bonusPercent: 15
  },
  {
    id: 'whale',
    type: 'DEPOSIT + VIP',
    reward: '25% Huge Bonus + VIP Status (min $200)',
    code: 'WHALE25',
    minDeposit: 200,
    bonusPercent: 25
  }
];

export default function DepositModal({ isOpen, onClose, onUpdateBalance }: Props) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'offers'>('deposit');
  const [selectedMethod, setSelectedMethod] = useState('visa');
  const [amount, setAmount] = useState<number | string>(40);
  const [promo, setPromo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // РОЗУМНА ВАЛІДАЦІЯ ПРОМОКОДІВ
  const appliedOffer = OFFERS.find(o => o.code === promo.toUpperCase());
  const numAmount = Number(amount) || 0;
  const isOfferValid = appliedOffer ? numAmount >= appliedOffer.minDeposit : false;

  let pointsToGet = Math.floor(numAmount * 100);
  if (isOfferValid && appliedOffer) {
    pointsToGet = Math.floor(pointsToGet * (1 + appliedOffer.bonusPercent / 100));
  }

  // Блокуємо кнопку, якщо йде завантаження АБО якщо введено промокод, але сума замала
  const isDepositDisabled = isProcessing || (appliedOffer && !isOfferValid) || numAmount < 2;

  // Динамічні стилі для поля промокоду
  const promoBoxClass = appliedOffer 
    ? (isOfferValid ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]') 
    : 'border-gray-800';

  const handleApplyOffer = (offerCode: string, minDeposit: number) => {
    playSound('click', 0.5);
    setPromo(offerCode);
    if (numAmount < minDeposit) {
      setAmount(minDeposit);
    }
    setActiveTab('deposit');
  };

  const handleDeposit = async () => {
    if (numAmount < 2) {
      alert("Minimum deposit is $2.00");
      return;
    }

    setIsProcessing(true);
    playSound('click', 0.5);

    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, method: selectedMethod.toUpperCase() })
      });
      const data = await res.json();

      if (data.success) {
        playSound('win', 0.8);
        
        let finalBalance = data.newBalance;
        if (isOfferValid && appliedOffer) {
           const bonusPoints = Math.floor((numAmount * 100) * (appliedOffer.bonusPercent / 100));
           finalBalance += bonusPoints;
        }

        onUpdateBalance(finalBalance);
        onClose(); 
      } else {
        playSound('crash', 0.6);
        alert(data.message);
      }
    } catch (e) {
      alert("Payment failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-[#11141e] border border-gray-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col relative">
        
        <button 
          onClick={onClose} 
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
        </button>

        <div className="flex border-b border-gray-800 bg-[#161a27] px-6 pt-4 gap-6 relative z-10">
          <button 
            onClick={() => setActiveTab('deposit')}
            className={`pb-3 font-black tracking-widest uppercase text-sm border-b-2 transition-colors ${activeTab === 'deposit' ? 'text-white border-green-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/></svg>
              Deposit
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('offers')}
            className={`pb-3 font-black tracking-widest uppercase text-sm border-b-2 transition-colors ${activeTab === 'offers' ? 'text-white border-yellow-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/></svg>
              Offers
            </span>
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'offers' ? (
            <div className="flex flex-col gap-4 animate-fade-in max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
              <div className="grid grid-cols-12 gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest px-4 pb-2 border-b border-gray-800">
                <div className="col-span-3">Offer Type</div>
                <div className="col-span-6">Reward</div>
                <div className="col-span-3 text-right">Promocode</div>
              </div>

              {OFFERS.map((offer) => (
                <div key={offer.id} className="bg-[#1a1f2e] border border-gray-700/50 hover:border-gray-500 transition-colors rounded-xl p-4 grid grid-cols-12 items-center gap-4 group">
                  <div className="col-span-3 flex flex-col gap-1">
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-max tracking-wider">
                      {offer.type.split('+')[0]}
                    </span>
                    {offer.type.includes('+') && (
                      <span className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded w-max tracking-wider">
                        {offer.type.split('+')[1]}
                      </span>
                    )}
                  </div>
                  <div className="col-span-6 text-sm font-bold text-gray-200">
                    {offer.reward}
                  </div>
                  <div className="col-span-3 flex flex-col items-end gap-2">
                    <span className="text-yellow-400 font-mono font-black text-sm tracking-widest uppercase">
                      {offer.code}
                    </span>
                    <button 
                      onClick={() => handleApplyOffer(offer.code, offer.minDeposit)}
                      className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black px-6 py-1.5 rounded transition-colors text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-fade-in">
              <div className="md:col-span-4 flex flex-col gap-3">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Payment Method</div>
                {PAYMENT_METHODS.map(m => (
                  <div 
                    key={m.id}
                    onClick={() => { if(!isProcessing) setSelectedMethod(m.id) }}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all flex items-center gap-4 bg-gradient-to-r ${m.gradient} border-2 ${selectedMethod === m.id ? m.border + ' scale-[1.02] shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="font-black text-sm uppercase tracking-wide">{m.name}</span>
                    {selectedMethod === m.id && (
                      <div className="absolute right-4 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="md:col-span-8 flex flex-col gap-6">
                
                {/* ОНОВЛЕНИЙ БЛОК ПРОМОКОДУ */}
                <div className={`bg-[#1a1f2e] border rounded-xl p-4 flex gap-4 transition-colors ${promoBoxClass}`}>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Promocode 
                      {appliedOffer && isOfferValid && (
                        <span className="text-yellow-400 normal-case tracking-normal ml-2">({appliedOffer.bonusPercent}% Bonus Active!)</span>
                      )}
                      {appliedOffer && !isOfferValid && (
                        <span className="text-red-400 normal-case tracking-normal ml-2">(Min ${appliedOffer.minDeposit} deposit required)</span>
                      )}
                    </label>
                    <input 
                      type="text" 
                      placeholder="Insert your promo code" 
                      value={promo}
                      onChange={(e) => setPromo(e.target.value.toUpperCase())}
                      disabled={isProcessing}
                      className="bg-transparent border-none outline-none text-sm text-yellow-400 font-mono font-bold w-full uppercase"
                    />
                  </div>
                  {!appliedOffer && (
                    <button 
                      onClick={() => setActiveTab('offers')}
                      disabled={isProcessing} 
                      className="bg-gray-800 hover:bg-gray-700 text-xs font-bold px-4 py-2 rounded uppercase tracking-wider text-gray-300 transition-colors"
                    >
                      View Offers
                    </button>
                  )}
                </div>

                <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Deposit Amount (Min $2.00)
                    </label>
                    <div className="flex items-center gap-2 bg-[#11141e] px-3 py-1.5 rounded border border-gray-800">
                      <span className="text-gray-500 font-bold text-sm">$</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isProcessing}
                        className="bg-transparent border-none outline-none text-white font-mono font-bold w-20 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {QUICK_AMOUNTS.map(val => (
                      <button
                        key={val}
                        onClick={() => setAmount(val)}
                        disabled={isProcessing}
                        className={`py-3 rounded-lg font-mono font-bold text-sm transition-colors border ${Number(amount) === val ? 'bg-green-500/10 text-green-400 border-green-500' : 'bg-[#11141e] text-gray-400 border-gray-800 hover:border-gray-600'}`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl flex items-center justify-between mt-auto shadow-inner">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">You will get</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white font-mono font-black text-xl">${Number(amount || 0).toFixed(2)}</span>
                      <span className="text-gray-500 text-sm">=</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#facc15" viewBox="0 0 16 16"><path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-1.067c1.005-.083 1.684-.49 1.684-1.15 0-1.06-1.528-1.167-2.612-1.31-1.25-.164-1.669-.328-1.669-.814 0-.44.51-.806 1.346-.806.915 0 1.5.385 1.536 1.006h.983c-.044-1.22-1.044-1.89-2.115-2.025V4.5h-.6v1.072c-.886.115-1.54.51-1.54 1.15 0 1.05 1.52 1.16 2.612 1.31 1.25.165 1.669.329 1.669.815 0 .44-.51.806-1.346.806-.915 0-1.5-.385-1.536-1.006H5.5z"/><path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4z"/></svg>
                      <span className="text-yellow-400 font-black font-mono text-xl">
                        {pointsToGet} pts
                      </span>
                    </div>
                  </div>
                  
                  {/* ДИНАМІЧНА КНОПКА ДЕПОЗИТУ */}
                  <button 
                    onClick={handleDeposit}
                    disabled={isDepositDisabled}
                    className={`px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all
                      ${isDepositDisabled 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]'}`}
                  >
                    {isProcessing ? 'Processing...' : (appliedOffer && !isOfferValid ? 'Increase Amount' : 'Confirm Deposit')}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}