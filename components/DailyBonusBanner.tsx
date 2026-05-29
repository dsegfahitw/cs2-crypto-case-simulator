'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserProfile } from '@/app/page';
import DailyModal from './DailyModal';

interface Props {
  user: UserProfile;
  onUpdateBalance: (b: number) => void;
}

function formatTime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function DailyBonusBanner({ user, onUpdateBalance }: Props) {
  const [available, setAvailable] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalItem, setModalItem] = useState<{ name: string; price: number; imageUrl: string | null } | null>(null);

  const checkStatus = useCallback(async () => {
    if (!user.authorized) return;
    try {
      const res = await fetch('/api/daily-case/status');
      const data = await res.json();
      setAvailable(data.available);
      setTimeLeft(data.timeLeft || 0);
    } catch (e) {
      console.error(e);
    }
  }, [user.authorized]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) { setAvailable(true); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleClaim = async () => {
    if (!user.authorized) {
      alert('Please sign in to claim your daily bonus!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/daily-case/open', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAvailable(false);
        setTimeLeft(24 * 60 * 60 * 1000);
        setModalItem(data.item);
      } else {
        alert(data.message || 'Failed to claim daily bonus.');
      }
    } catch (e) {
      console.error(e);
      alert('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full animated-gradient-bg border border-purple-500/30 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden neon-pulse group">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>

        <div className="space-y-4 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-black/40 border border-purple-500/30 rounded-full px-3 py-1 backdrop-blur-md">
            <span className="text-[10px] text-purple-300 font-black uppercase tracking-widest">Beta</span>
            <span className="w-1 h-1 bg-purple-400 rounded-full"></span>
            <span className="text-[10px] text-gray-300 uppercase tracking-widest">Season 1</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight drop-shadow-lg">
            START WITH A BONUS
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-lg leading-relaxed">
            Enter promo code{' '}
            <span className="text-yellow-400 font-mono font-bold bg-black/50 px-2 py-0.5 rounded border border-yellow-500/30">
              WELCOME5
            </span>{' '}
            in your profile and instantly receive{' '}
            <span className="text-white font-bold border-b border-yellow-500">50 Points</span> for your first opens!
          </p>
        </div>

        <div className="relative z-10 shrink-0 w-full md:w-auto">
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center border-t border-l border-white/10 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)] transform rotate-3 hover:rotate-0 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#111827" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3.5A.5.5 0 0 1 7 8.5v-4A.5.5 0 0 1 8 4z"/>
              </svg>
            </div>
            <div>
              <div className="text-[11px] text-gray-300 font-bold uppercase tracking-widest mb-1">Daily Case</div>
              <button
                onClick={handleClaim}
                disabled={!available || loading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-black px-6 py-2.5 rounded-lg uppercase tracking-wider text-xs transition-colors shadow-lg disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Opening...'
                  : !user.authorized
                  ? 'Sign In to Claim'
                  : available
                  ? 'Claim Bonus'
                  : formatTime(timeLeft)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalItem && (
        <DailyModal
          item={modalItem}
          onClose={() => setModalItem(null)}
        />
      )}
    </>
  );
}
