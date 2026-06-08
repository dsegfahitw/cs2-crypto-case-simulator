'use client';

import { useState, useRef } from 'react';
import { CaseData, ItemData, UserProfile } from '@/app/page';
import WinModal from './WinModal';

interface Props {
  caseData: CaseData;
  user: UserProfile;
  onNavigateHome: () => void;
  onUpdateBalance: (b: number) => void;
}

function getRarityBorder(chance: number) {
  if (chance < 2) return 'border-red-500';
  if (chance < 15) return 'border-purple-500';
  return 'border-gray-600';
}

const CARD_WIDTH = 134;
const CARD_GAP = 16;
const WINNING_INDEX = 65;
const TRACK_COUNT = 80;

function buildTrack(items: ItemData[], winningItem?: ItemData): ItemData[] {
  const track: ItemData[] = [];
  for (let i = 0; i < TRACK_COUNT; i++) {
    if (winningItem && i === WINNING_INDEX) {
      track.push(winningItem);
    } else {
      track.push(items[Math.floor(Math.random() * items.length)]);
    }
  }
  return track;
}

export default function CaseView({ caseData, user, onNavigateHome, onUpdateBalance }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [track, setTrack] = useState<ItemData[]>(() => buildTrack(caseData.items));
  const [winData, setWinData] = useState<{ item: ItemData; inventoryId: string } | null>(null);
  const [winModalOpen, setWinModalOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const sorted = [...caseData.items].sort((a, b) => b.price - a.price);

  const doOpen = async (fast: boolean) => {
    if (!user.authorized) { alert('Please sign in to open cases!'); return; }
    if (spinning) return;
    setSpinning(true);

    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = 'translateX(0px)';
    }

    try {
      const res = await fetch('/api/open-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: caseData.id, clientSeed: `client_${Date.now()}` }),
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message || 'Failed to open case.');
        setSpinning(false);
        return;
      }

      onUpdateBalance(parseFloat(data.user.balanceAfterBuy));

      const newTrack = buildTrack(caseData.items, data.drop);
      setTrack(newTrack);
      setWinData({ item: data.drop, inventoryId: data.inventoryId });

      if (fast) {
        setSpinning(false);
        setWinModalOpen(true);
        return;
      }

      await new Promise(r => setTimeout(r, 50));

      if (trackRef.current) {
        const containerWidth = trackRef.current.parentElement?.offsetWidth ?? 800;
        const targetCenter = WINNING_INDEX * (CARD_WIDTH + CARD_GAP) + CARD_WIDTH / 2;
        const randomOffset = Math.floor(Math.random() * 80) - 40;
        const finalTranslate = -(targetCenter - containerWidth / 2 + randomOffset);

        trackRef.current.style.transition = 'transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)';
        trackRef.current.style.transform = `translateX(${finalTranslate}px)`;
      }

      setTimeout(() => {
        setSpinning(false);
        setWinModalOpen(true);
      }, 6200);
    } catch (e) {
      console.error(e);
      alert('Server error. Please try again.');
      setSpinning(false);
    }
  };

  const handleCollect = () => {
    setWinModalOpen(false);
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = 'translateX(0px)';
    }
    setTrack(buildTrack(caseData.items));
  };

  const handleSell = async () => {
    if (!winData) return;
    try {
      const res = await fetch('/api/sell-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId: winData.inventoryId }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateBalance(data.newBalance);
        setWinModalOpen(false);
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = 'translateX(0px)';
        }
        setTrack(buildTrack(caseData.items));
      } else {
        alert(data.error || 'Failed to sell item.');
      }
    } catch (e) {
      console.error(e);
      alert('Server error. Please try again.');
    }
  };

  return (
    <section className="w-full flex flex-col items-center animate-fade-in">
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={onNavigateHome}
          disabled={spinning}
          className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-40"
        >
          ← Back
        </button>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-white mb-2">{caseData.title}</h2>
        <p className="text-gray-400">
          Cost: <span className="text-yellow-400 font-mono font-bold">{Math.floor(caseData.price)} pts</span>
        </p>
      </div>

      <div className="mb-8 flex gap-4 w-full max-w-md">
        <button
          onClick={() => doOpen(false)}
          disabled={spinning}
          className="w-1/2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-md shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all disabled:opacity-50 text-base"
        >
          SPIN
        </button>
        <button
          onClick={() => doOpen(true)}
          disabled={spinning}
          className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-md shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 text-base flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"/>
          </svg>
          INSTANT
        </button>
      </div>

      <div className="relative w-full max-w-4xl h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl mb-12">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-400 z-10 shadow-[0_0_10px_rgba(250,204,21,1)] -translate-x-1/2"></div>
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-800 to-transparent"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-800 to-transparent"></div>
        </div>
        <div
          ref={trackRef}
          className="flex items-center h-full gap-4 absolute left-0 will-change-transform"
          style={{ paddingLeft: '16px' }}
        >
          {track.map((item, i) => (
            <div
              key={i}
              className="weapon-card flex-shrink-0"
              style={
                winData && i === WINNING_INDEX
                  ? { borderColor: '#facc15', boxShadow: 'inset 0 0 15px rgba(250,204,21,0.2)' }
                  : {}
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl || 'https://placehold.co/150'}
                className="w-12 h-12 object-contain mb-1"
                alt={item.name}
              />
              <span
                className="weapon-name"
                style={winData && i === WINNING_INDEX ? { color: '#facc15', fontWeight: 'bold' } : {}}
              >
                {item.name}
              </span>
              <span
                className="weapon-price"
                style={{ color: winData && i === WINNING_INDEX ? '#facc15' : 'rgba(107,114,128,1)' }}
              >
                {Math.floor(item.price)} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full">
        <h3 className="text-xl font-bold mb-4 text-gray-300 border-b border-gray-700 pb-2">Case Contents</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map(item => (
            <div
              key={item.id}
              className={`bg-gray-800 border-b-4 ${getRarityBorder(item.chance)} rounded p-4 flex flex-col items-center text-center`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl || 'https://placehold.co/150'}
                className="w-16 h-16 object-contain mb-2"
                alt={item.name}
              />
              <span className="text-sm font-bold text-gray-200 mb-1 block truncate w-full">{item.name}</span>
              <span className="text-xs text-gray-400 mb-2">{item.chance}%</span>
              <span className="text-sm font-mono text-yellow-400 font-bold">{Math.floor(item.price)} pts</span>
            </div>
          ))}
        </div>
      </div>

      {winModalOpen && winData && (
        <WinModal
          item={winData.item}
          onCollect={handleCollect}
          onSell={handleSell}
        />
      )}
    </section>
  );
}
