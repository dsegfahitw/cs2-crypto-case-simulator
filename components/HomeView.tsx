'use client';

import { CaseData, UserProfile } from '@/app/page';
import LiveDropFeed from './LiveDropFeed';
import DailyBonusBanner from './DailyBonusBanner';
import CaseGrid from './CaseGrid';

interface Props {
  user: UserProfile;
  cases: Record<string, CaseData>;
  onOpenCase: (caseId: string) => void;
  onUpdateBalance: (b: number) => void;
}

export default function HomeView({ user, cases, onOpenCase, onUpdateBalance }: Props) {
  return (
    <section className="w-full flex flex-col gap-8 animate-fade-in">
      <LiveDropFeed />
      <DailyBonusBanner user={user} onUpdateBalance={onUpdateBalance} />
      <CaseGrid cases={cases} onOpenCase={onOpenCase} />
    </section>
  );
}
