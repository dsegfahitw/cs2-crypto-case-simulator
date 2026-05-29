'use client';

import { useEffect, useState } from 'react';

interface Drop {
  id: string;
  droppedAt: string;
  item: { name: string; price: number; imageUrl: string | null; chance: number };
  user: { username: string; avatarUrl: string | null };
}

export default function LiveDropFeed() {
  const [drops, setDrops] = useState<Drop[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/live-drops');
        const data = await res.json();
        if (data.success) setDrops(data.drops);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const getRarityColor = (chance: number) => {
    if (chance < 2) return 'border-red-500 bg-red-500/10';
    if (chance < 15) return 'border-purple-500 bg-purple-500/10';
    return 'border-gray-600 bg-gray-800/60';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center px-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </span>
        </div>
        <div>Live Drop Feed</div>
      </div>
      <div className="w-full bg-gray-900/80 border border-gray-800/80 rounded-xl h-16 overflow-hidden relative shadow-inner backdrop-blur-sm">
        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent w-16 z-10"></div>
        <div className="flex items-center gap-3 h-full px-4 overflow-x-auto no-scrollbar scroll-smooth">
          {drops.length === 0 ? (
            <div className="text-xs text-gray-600 w-full text-center">No drops yet — be the first to open a case!</div>
          ) : (
            drops.map(drop => (
              <div
                key={drop.id}
                className={`flex-shrink-0 flex items-center gap-2 border rounded-lg px-3 py-1.5 ${getRarityColor(drop.item.chance)}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={drop.item.imageUrl || 'https://placehold.co/32'} className="w-8 h-8 object-contain" alt={drop.item.name} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{drop.user.username}</span>
                  <span className="text-[10px] font-bold text-yellow-400 font-mono">{Math.floor(drop.item.price)} pts</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent w-16 z-10"></div>
      </div>
    </div>
  );
}
