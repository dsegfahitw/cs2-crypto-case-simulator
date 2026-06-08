'use client';

import { useState, useRef, useEffect } from 'react';
import { View, UserProfile } from '@/app/page';

interface Props {
  user: UserProfile;
  currentView: View;
  onNavigate: (v: View) => void;
  onLoadProfile: () => void;
  onOpenDeposit?: () => void; // НОВИЙ ПРОП ДЛЯ ВІДКРИТТЯ БАНКУ
}

export default function Header({ user, onNavigate, onLoadProfile, onOpenDeposit }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закриття меню при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-gray-900 border-b border-gray-800 p-3 shadow-md flex justify-between items-center max-w-7xl mx-auto rounded-b-xl z-40 relative">
      {/* ЛОГОТИП ТА НАВІГАЦІЯ */}
      <div className="flex items-center gap-8 pl-2">
        <h1
          onClick={() => onNavigate('home')}
          className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 cursor-pointer hover:scale-105 transition-transform"
        >
          SKINBANK
        </h1>

        
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onNavigate('upgrade')}
            className="text-sm font-black text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5 uppercase tracking-wider drop-shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/>
            </svg>
            UPGRADES
          </button>
          <button
            onClick={() => onNavigate('faq')}
            className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wider"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            FAQ
          </button>
        </nav>
      </div>

      {/* АВТОРИЗАЦІЯ АБО ПРОФІЛЬ */}
      <div className="flex gap-4 items-center pr-2">
        {!user.authorized ? (
          <a
            href="/api/auth/steam"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm flex items-center gap-2 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0.329 10.333l2.521-1.04a7.35 7.35 0 0 1 1.054-1.699l-1.077-3.084a4.137 4.137 0 1 1 5.926 5.56l-3.053 1.066a3.242 3.242 0 1 1-2.072-2.115l-1.084 3.104a1.861 1.861 0 1 0 1.954-2.529z"/>
              <path d="M9.13 6.94a1.97 1.97 0 1 0 0-3.94 1.97 1.97 0 0 0 0 3.94z"/>
            </svg>
            Sign in via Steam
          </a>
        ) : (
          <div className="flex items-center gap-4">
            
            {/* БЛОК БАЛАНСУ ТА ДЕПОЗИТУ */}
            <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700 rounded-lg p-1 shadow-inner">
              <div className="flex items-center gap-2 pl-3 pr-1">
                {/* Іконка монет */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#facc15" viewBox="0 0 16 16">
                  <path d="M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-1.067c1.005-.083 1.684-.49 1.684-1.15 0-1.06-1.528-1.167-2.612-1.31-1.25-.164-1.669-.328-1.669-.814 0-.44.51-.806 1.346-.806.915 0 1.5.385 1.536 1.006h.983c-.044-1.22-1.044-1.89-2.115-2.025V4.5h-.6v1.072c-.886.115-1.54.51-1.54 1.15 0 1.05 1.52 1.16 2.612 1.31 1.25.165 1.669.329 1.669.815 0 .44-.51.806-1.346.806-.915 0-1.5-.385-1.536-1.006H5.5z"/>
                  <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4z"/>
                </svg>
                <span className="text-yellow-400 font-bold font-mono text-sm">{Math.floor(user.balance ?? 0)}</span>
              </div>
              
              {/* КНОПКА DEPOSIT */}
              <button 
                onClick={onOpenDeposit}
                className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black px-4 py-1.5 rounded-md flex items-center gap-1.5 transition-colors uppercase text-[11px] tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
                </svg>
                Deposit
              </button>
            </div>

            {/* ПРОФІЛЬ ТА DROPDOWN МЕНЮ */}
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatarUrl || ''}
                  className="w-10 h-10 rounded-full border-2 border-gray-600"
                  alt="Avatar"
                />
                <div className="hidden md:flex flex-col">
                  <span className="text-gray-200 font-bold text-xs">{user.username}</span>
                  <span className="text-gray-500 font-bold text-[10px] uppercase">Lv. 1</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#9ca3af" className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                </svg>
              </div>

              {/* САМ DROPDOWN */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col py-2 overflow-hidden animate-fade-in">
                  
                  <button 
                    onClick={() => { onLoadProfile(); setDropdownOpen(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-bold transition-colors w-full text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
                    Profile
                  </button>

                  <button 
                    onClick={() => { alert('Transactions coming soon!'); setDropdownOpen(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 text-gray-300 hover:text-white text-sm font-bold transition-colors w-full text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/></svg>
                    Transactions
                  </button>

                  <div className="h-px bg-gray-700/50 my-1 w-full"></div>

                  <a 
                    href="/api/auth/logout" 
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-sm font-bold transition-colors w-full text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/><path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/></svg>
                    Logout
                  </a>

                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </header>
  );
}