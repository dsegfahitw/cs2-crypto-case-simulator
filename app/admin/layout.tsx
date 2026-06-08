'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/user-profile', { cache: 'no-store' });
        const data = await res.json();
        
        // Перевіряємо чи юзер залогінений і чи має він роль ADMIN
        if (data.success && data.authorized && data.role === 'ADMIN') {
          setIsAuthorized(true);
        } else {
          router.push('/'); // Викидаємо звичайних гравців на головну
        }
      } catch (e) {
        router.push('/');
      }
    }
    checkAdmin();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Case Manager', path: '/admin/cases', icon: '📦' },
    { name: 'Promo Codes', path: '/admin/promo', icon: '🎁' },
    { name: 'Users & CRM', path: '/admin/users', icon: '👥' },
  ];

  return (
    <div className="flex h-screen bg-[#0f1219] text-white font-sans overflow-hidden animate-fade-in">
      
      {/* SIDEBAR (Бокове меню) */}
      <aside className="w-64 bg-[#161a27] border-r border-gray-800 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-gray-950 font-black">A</div>
          <h1 className="text-xl font-black tracking-widest text-white">ADMIN</h1>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 pl-2">Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                  ${isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'}`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-colors border border-gray-700"
          >
            ← Back to Site
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT (Динамічна частина) */}
      <main className="flex-1 overflow-y-auto bg-[#0b0d14] relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        <div className="p-8 md:p-12 relative z-10">
          {children}
        </div>
      </main>

    </div>
  );
}