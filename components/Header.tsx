'use client';

import { View, UserProfile } from '@/app/page';

interface Props {
  user: UserProfile;
  currentView: View;
  onNavigate: (v: View) => void;
  onLoadProfile: () => void;
}

export default function Header({ user, onNavigate, onLoadProfile }: Props) {
  return (
    <header className="w-full bg-gray-800 p-4 shadow-md flex justify-between items-center max-w-6xl mx-auto rounded-b-lg">
      <div className="flex items-center gap-6">
        <h1
          onClick={() => onNavigate('home')}
          className="text-xl font-bold tracking-wider text-green-400 cursor-pointer hover:text-green-300 transition-colors"
        >
          SKINBANK
        </h1>
        <button
          onClick={() => onNavigate('upgrade')}
          className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
        >
          UPGRADES
        </button>
        <button
          onClick={() => onNavigate('faq')}
          className="text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          FAQ
        </button>
      </div>

      <div className="flex gap-4 items-center">
        {!user.authorized ? (
          <a
            href="/api/auth/steam"
            className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0.329 10.333l2.521-1.04a7.35 7.35 0 0 1 1.054-1.699l-1.077-3.084a4.137 4.137 0 1 1 5.926 5.56l-3.053 1.066a3.242 3.242 0 1 1-2.072-2.115l-1.084 3.104a1.861 1.861 0 1 0 1.954-2.529z"/>
              <path d="M9.13 6.94a1.97 1.97 0 1 0 0-3.94 1.97 1.97 0 0 0 0 3.94z"/>
            </svg>
            Sign in via Steam
          </a>
        ) : (
          <div className="flex items-center gap-3">
            <div
              onClick={onLoadProfile}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              title="Open profile"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl || ''}
                className="w-8 h-8 rounded-full border border-green-400"
                alt="Avatar"
              />
              <span className="text-gray-300 font-semibold text-sm hidden sm:block">{user.username}</span>
            </div>
            <div className="bg-gray-700 px-3 py-1.5 rounded font-mono text-yellow-400 text-sm font-bold shadow-inner">
              {Math.floor(user.balance ?? 0)} pts
            </div>
            <a href="/api/auth/logout" className="text-xs text-red-400 hover:text-red-300 transition-colors pl-2">
              Logout
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
