'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/app/page';

interface InventoryRecord {
  id: string;
  droppedAt: string;
  status: string;
  item: { id: string; name: string; price: number; chance: number; imageUrl: string | null };
}

interface Props {
  user: UserProfile;
  onUpdateBalance: (b: number) => void;
}

export default function ProfileView({ user, onUpdateBalance }: Props) {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [tradeUrl, setTradeUrl] = useState(user.tradeUrl || '');
  const [promoCode, setPromoCode] = useState('');
  const [tradeMsg, setTradeMsg] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('price-desc');
  const [copiedSteamId, setCopiedSteamId] = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setInventory(data.inventory);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setTradeUrl(user.tradeUrl || '');
    loadInventory();
  }, [user.tradeUrl, loadInventory]);

  const handleSaveTrade = async () => {
    try {
      const res = await fetch('/api/user/update-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeUrl }),
      });
      const data = await res.json();
      setTradeMsg(data.success ? 'Trade URL saved!' : data.message || 'Error saving.');
      setTimeout(() => setTradeMsg(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivatePromo = async () => {
    try {
      const res = await fetch('/api/promo/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      setPromoMsg(data.message || (data.success ? 'Success!' : 'Error.'));
      if (data.success) {
        onUpdateBalance(data.newBalance);
        setPromoCode('');
      }
      setTimeout(() => setPromoMsg(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSellItem = async (inventoryId: string) => {
    try {
      const res = await fetch('/api/sell-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateBalance(data.newBalance);
        setInventory(prev => prev.filter(r => r.id !== inventoryId));
      } else {
        alert(data.error || 'Failed to sell item.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copySteamId = () => {
    if (user.steamId) {
      navigator.clipboard.writeText(user.steamId);
      setCopiedSteamId(true);
      setTimeout(() => setCopiedSteamId(false), 2000);
    }
  };

  const filtered = inventory
    .filter(r => {
      if (rarityFilter === 'rare') return r.item.chance < 2;
      if (rarityFilter === 'classified') return r.item.chance >= 2 && r.item.chance < 15;
      if (rarityFilter === 'common') return r.item.chance >= 15;
      return true;
    })
    .sort((a, b) => {
      if (sortFilter === 'price-asc') return a.item.price - b.item.price;
      if (sortFilter === 'date-desc') return new Date(b.droppedAt).getTime() - new Date(a.droppedAt).getTime();
      return b.item.price - a.item.price;
    });

  const totalValue = inventory.reduce((sum, r) => sum + r.item.price, 0);

  const getRarityNeon = (chance: number) => {
    if (chance < 2) return 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
    if (chance < 15) return 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]';
    return 'border-gray-700 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]';
  };

  return (
    <section className="w-full flex flex-col gap-6 max-w-6xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col gap-5 shadow-2xl relative">
          <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user.avatarUrl || ''} className="w-20 h-20 rounded-full border-2 border-green-400 shadow-md" alt="Avatar" />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-white tracking-wide truncate">{user.username}</h3>
              <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/30 uppercase tracking-widest">
                {user.role}
              </span>
              <div
                onClick={copySteamId}
                className="flex items-center gap-1.5 mt-2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer group"
                title="Click to copy"
              >
                <span className="text-xs font-mono truncate max-w-[140px]">
                  ID: {copiedSteamId ? <span className="text-green-400">Copied!</span> : user.steamId}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Steam Trade URL</label>
              <div className="tooltip-container relative inline-block cursor-help text-purple-400 hover:text-purple-300">
                <span className="text-xs border border-purple-500/50 rounded-full w-4 h-4 flex items-center justify-center font-serif">i</span>
                <span className="tooltip-text">Your Steam Trade URL lets others send you trade offers without adding you as a friend.</span>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tradeUrl}
                onChange={e => setTradeUrl(e.target.value)}
                placeholder="https://steamcommunity.com/tradeoffer/new/..."
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-green-500 transition-colors"
              />
              <button
                onClick={handleSaveTrade}
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded text-sm transition-colors shrink-0"
              >
                Save
              </button>
            </div>
            {tradeMsg && <p className="text-xs text-green-400">{tradeMsg}</p>}
            <a
              href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1 pt-1 w-fit"
            >
              Find your URL in Steam ↗
            </a>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-700/50">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Promo Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder="% PROMO"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-yellow-400 font-mono font-bold uppercase tracking-widest focus:outline-none focus:border-yellow-500 transition-colors"
              />
              <button
                onClick={handleActivatePromo}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded text-sm transition-colors shadow-[0_0_15px_rgba(168,85,247,0.2)] shrink-0"
              >
                Apply
              </button>
            </div>
            {promoMsg && (
              <p className={`text-xs ${promoMsg.startsWith('Success') ? 'text-green-400' : 'text-red-400'}`}>
                {promoMsg}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Cases Opened', value: user.nonce ?? 0, color: 'text-green-400' },
            { label: 'Contracts Made', value: 0, color: 'text-purple-400' },
            { label: 'Current Balance', value: `${Math.floor(user.balance ?? 0)} pts`, color: 'text-yellow-400' },
            { label: 'Skins Sold', value: user.stats?.totalSold ?? 0, color: 'text-red-400' },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col justify-between shadow-md"
            >
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
              <span className={`text-4xl font-black font-mono mt-4 ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl mt-2 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-700 pb-4">
          <div>
            <h3 className="text-xl font-black text-white tracking-wide uppercase">Your Skins</h3>
            <div className="text-xs text-gray-400 mt-1">
              Total inventory value:{' '}
              <span className="text-yellow-400 font-bold font-mono">{Math.floor(totalValue)} pts</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={rarityFilter}
              onChange={e => setRarityFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-green-500 cursor-pointer"
            >
              <option value="all">All Rarities</option>
              <option value="rare">Knife / Covert (&lt;2%)</option>
              <option value="classified">Classified (&lt;15%)</option>
              <option value="common">Mil-Spec (&ge;15%)</option>
            </select>
            <select
              value={sortFilter}
              onChange={e => setSortFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-green-500 cursor-pointer"
            >
              <option value="price-desc">Price: Highest first</option>
              <option value="price-asc">Price: Lowest first</option>
              <option value="date-desc">Date: Newest first</option>
            </select>
            <span className="bg-gray-900 px-3 py-1.5 rounded text-xs font-bold text-gray-400 font-mono shrink-0">
              {filtered.length} items
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-sm">
            No items match your current filters. Time to open a case!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(record => (
              <div
                key={record.id}
                className={`bg-gray-900 border ${getRarityNeon(record.item.chance)} rounded-lg p-4 flex flex-col items-center text-center relative transition-transform hover:scale-[1.02] animate-fade-in`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={record.item.imageUrl || 'https://placehold.co/150'}
                  className="w-16 h-16 object-contain mb-2"
                  alt={record.item.name}
                />
                <span className="text-xs font-bold text-gray-200 mb-3 block truncate w-full" title={record.item.name}>
                  {record.item.name}
                </span>
                <button
                  onClick={() => handleSellItem(record.id)}
                  className="w-full bg-red-500/10 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white transition-all py-1.5 rounded text-[11px] font-black uppercase tracking-wider"
                >
                  Sell for {Math.floor(record.item.price)} pts
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
