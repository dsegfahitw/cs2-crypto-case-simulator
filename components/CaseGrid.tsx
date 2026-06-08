'use client';

import { CaseData } from '@/app/page';

interface Props {
  cases: Record<string, CaseData>;
  onOpenCase: (caseId: string) => void;
}

function CaseCard({ caseData, onOpenCase }: { caseData: CaseData; onOpenCase: (id: string) => void }) {
  const isHot = caseData.category === 'FEATURED' || caseData.category === 'KNIFE';
  return (
    <div
      onClick={() => onOpenCase(caseData.id)}
      className="glass-panel rounded-xl p-5 flex flex-col items-center cursor-pointer case-card-hover group relative overflow-hidden"
    >
      {isHot && (
        <div className="absolute -right-8 top-3 bg-red-600 text-white text-[9px] font-black px-8 py-1 rotate-45 shadow-lg uppercase tracking-widest z-20">
          HOT
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/90 z-0"></div>
      <div className="w-32 h-32 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 z-10 relative">
        <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={caseData.imageUrl || 'https://placehold.co/300'}
          className="w-full h-full object-cover drop-shadow-2xl"
          alt={caseData.title}
        />
      </div>
      <div className="z-10 flex flex-col items-center w-full">
        <h3 className="text-sm font-black text-gray-100 mb-3 text-center tracking-wider uppercase drop-shadow-md truncate w-full">
          {caseData.title}
        </h3>
        <div className="w-full flex justify-between items-center bg-black/40 border border-gray-700/50 rounded-lg p-2 group-hover:border-green-500/40 transition-colors">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Price</span>
          <span className="text-yellow-400 font-mono font-black text-sm">{Math.floor(caseData.price)} pts</span>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  title,
  icon,
  iconColor,
  cases,
  onOpenCase,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  cases: CaseData[];
  onOpenCase: (id: string) => void;
}) {
  if (cases.length === 0) return null;
  return (
    <div className="space-y-5 mt-4">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-2">
        <div className={`w-8 h-8 rounded flex items-center justify-center ${iconColor}`}>{icon}</div>
        <h2 className="text-2xl font-black text-white tracking-wide uppercase">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {cases.map(c => (
          <CaseCard key={c.id} caseData={c} onOpenCase={onOpenCase} />
        ))}
      </div>
    </div>
  );
}

export default function CaseGrid({ cases, onOpenCase }: Props) {
  const all = Object.values(cases);
  const free = all.filter(c => c.category === 'FREE');
  const featured = all.filter(c => c.category === 'FEATURED');
  const knife = all.filter(c => c.category === 'KNIFE');

  if (all.length === 0) {
    return (
      <div className="w-full flex flex-col gap-8 mt-4">
        {['Starter Cases', 'Hype Collection', 'Exclusive'].map(title => (
          <div key={title} className="space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-800 pb-2">
              <div className="w-8 h-8 rounded bg-gray-700 animate-pulse"></div>
              <div className="h-7 w-40 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel rounded-xl p-5 flex flex-col items-center gap-3">
                  <div className="w-32 h-32 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 w-full bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <CategorySection
        title="Starter Cases"
        iconColor="bg-blue-500/10 text-blue-400"
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3.5A.5.5 0 0 1 7 8.5v-4A.5.5 0 0 1 8 4z"/></svg>}
        cases={free}
        onOpenCase={onOpenCase}
      />
      <CategorySection
        title="Hype Collection"
        iconColor="bg-green-500/10 text-green-400"
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/></svg>}
        cases={featured}
        onOpenCase={onOpenCase}
      />
      <CategorySection
        title="Exclusive"
        iconColor="bg-yellow-500/10 text-yellow-400"
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M15.5 0A.5.5 0 0 1 16 .5v4a.5.5 0 0 1-1 0V1.707l-4.5 4.5a.5.5 0 0 1-.707-.707l4.5-4.5H11.5a.5.5 0 0 1 0-1h4zM1 10.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-2.793l4.5 4.5a.5.5 0 0 1-.707.707l-4.5-4.5V14.5a.5.5 0 0 1-1 0v-4z"/></svg>}
        cases={knife}
        onOpenCase={onOpenCase}
      />
    </>
  );
}
