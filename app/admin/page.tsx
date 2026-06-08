'use client';

export default function AdminDashboard() {
  return (
    <div className="animate-fade-in flex flex-col gap-8">
      
      <div>
        <h1 className="text-3xl font-black text-white tracking-wide uppercase">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Welcome back. Here is what&apos;s happening with SkinBank today.</p>
      </div>

      {/* СТАТИСТИКА (Віджети) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-[#161a27] border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Users</h3>
          <div className="text-3xl font-black text-white mt-2 font-mono">1,248</div>
          <div className="text-xs text-blue-400 font-bold mt-2">+12 today</div>
        </div>

        <div className="bg-[#161a27] border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank Deposits (USD)</h3>
          <div className="text-3xl font-black text-white mt-2 font-mono">$4,250.00</div>
          <div className="text-xs text-emerald-400 font-bold mt-2">+$340 today</div>
        </div>

        <div className="bg-[#161a27] border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl"></div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Liability (Pts)</h3>
          <div className="text-3xl font-black text-white mt-2 font-mono">845,000</div>
          <div className="text-xs text-gray-500 font-bold mt-2">Points currently on users&apos; balances</div>
        </div>

        <div className="bg-[#161a27] border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"></div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cases Opened</h3>
          <div className="text-3xl font-black text-white mt-2 font-mono">12,045</div>
          <div className="text-xs text-purple-400 font-bold mt-2">Highly active!</div>
        </div>

      </div>

      <div className="bg-[#161a27] border border-gray-800 rounded-2xl p-6 shadow-lg h-64 flex items-center justify-center">
        <span className="text-gray-500 font-bold uppercase tracking-widest">Detailed charts coming soon...</span>
      </div>

    </div>
  );
}