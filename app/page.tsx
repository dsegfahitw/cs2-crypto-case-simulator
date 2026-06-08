'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import HomeView from '@/components/HomeView';
import CaseView from '@/components/CaseView';
import ProfileView from '@/components/ProfileView';
import FaqView from '@/components/FaqView';
import UpgradeView from '@/components/UpgradeView';
import DepositModal from '@/components/DepositModal';

export type View = 'home' | 'case' | 'profile' | 'faq' | 'upgrade';

export interface UserProfile {
  authorized: boolean;
  steamId?: string;
  username?: string;
  balance?: number;
  avatarUrl?: string;
  role?: string;
  nonce?: number;
  createdAt?: string;
  tradeUrl?: string;
  stats?: { currentItems: number; totalSold: number };
}

export interface CaseData {
  id: string;
  title: string;
  price: number;
  category: string;
  imageUrl: string | null;
  items: ItemData[];
}

export interface ItemData {
  id: string;
  name: string;
  price: number;
  chance: number;
  imageUrl: string | null;
  caseId: string;
}

export default function HomePage() {
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<UserProfile>({ authorized: false });
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [cases, setCases] = useState<Record<string, CaseData>>({});
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  // Створюємо плоский масив усіх предметів
  const allItems = Object.values(cases).flatMap(c => c.items);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/user-profile', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.authorized) {
        setUser({ authorized: true, ...data });
      } else {
        setUser({ authorized: false });
      }
    } catch (e) {
      console.error('Auth check failed', e);
    }
  }, []);

  const fetchCases = useCallback(async () => {
    try {
      const res = await fetch('/api/cases', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success) {
        const map: Record<string, CaseData> = {};
        
        // Адаптуємо дані з API під інтерфейси нашого фронтенду
        data.cases.forEach((c: any) => { 
          map[c.id] = {
            id: c.id,
            title: c.name,       // API: name -> UI: title
            price: c.price,
            category: c.category,
            imageUrl: c.image,   // API: image -> UI: imageUrl
            items: c.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              price: i.price,
              chance: i.chance,
              imageUrl: i.image, // API: image -> UI: imageUrl
              caseId: c.id
            }))
          }; 
        });
        
        setCases(map);
      }
    } catch (e) {
      console.error('Failed to load cases', e);
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchCases();
  }, [fetchUser, fetchCases]);

  const updateBalance = (newBalance: number) => {
    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  const openCase = (caseId: string) => {
    setActiveCaseId(caseId);
    setView('case');
  };

  // Показуємо спінер, поки кейси завантажуються з БД
  if (isLoadingCases) {
    return (
      <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
      </div>
    );
  }

  return (
    <>
      <Header
        user={user}
        currentView={view}
        onNavigate={setView}
        onLoadProfile={() => setView('profile')}
        onOpenDeposit={() => setIsDepositOpen(true)}
      />
      <main className="w-full max-w-6xl mx-auto mt-8 flex flex-col items-center px-4 pb-12 animate-fade-in">
        {view === 'home' && (
          <HomeView
            user={user}
            cases={cases}
            onOpenCase={openCase}
            onUpdateBalance={updateBalance}
          />
        )}
        {view === 'case' && activeCaseId && cases[activeCaseId] && (
          <CaseView
            caseData={cases[activeCaseId]}
            user={user}
            onNavigateHome={() => setView('home')}
            onUpdateBalance={updateBalance}
          />
        )}
        {view === 'profile' && (
          <ProfileView
            user={user}
            onUpdateBalance={updateBalance}
          />
        )}
        {view === 'faq' && <FaqView />}
        {view === 'upgrade' && (
          <UpgradeView
            user={user}
            allItems={allItems}
            onUpdateBalance={updateBalance}
          />
        )}
      </main>
      <DepositModal 
        isOpen={isDepositOpen} 
        onClose={() => setIsDepositOpen(false)} 
        onUpdateBalance={updateBalance} 
      />
    </>
  );
}