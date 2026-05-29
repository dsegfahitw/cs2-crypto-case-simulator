'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import HomeView from '@/components/HomeView';
import CaseView from '@/components/CaseView';
import ProfileView from '@/components/ProfileView';
import FaqView from '@/components/FaqView';

export type View = 'home' | 'case' | 'profile' | 'faq';

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
      const res = await fetch('/api/cases');
      const data = await res.json();
      if (data.success) {
        const map: Record<string, CaseData> = {};
        data.cases.forEach((c: CaseData) => { map[c.id] = c; });
        setCases(map);
      }
    } catch (e) {
      console.error('Failed to load cases', e);
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

  return (
    <>
      <Header
        user={user}
        currentView={view}
        onNavigate={setView}
        onLoadProfile={() => setView('profile')}
      />
      <main className="w-full max-w-6xl mx-auto mt-8 flex flex-col items-center px-4 pb-12">
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
      </main>
    </>
  );
}
