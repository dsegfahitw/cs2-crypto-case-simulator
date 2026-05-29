export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-black text-green-400 tracking-wider">SKINBANK</h1>
      <p className="text-gray-400 text-sm">Phase 2 scaffold — DB connection test below</p>
      <DbStatus />
    </main>
  );
}

async function DbStatus() {
  let status = 'Checking...';
  let ok = false;
  try {
    const { getPrisma } = await import('@/lib/prisma');
    const prisma = getPrisma();
    const count = await prisma.case.count();
    status = `Connected! Found ${count} case(s) in the database.`;
    ok = true;
  } catch (e: unknown) {
    status = `DB Error: ${e instanceof Error ? e.message : String(e)}`;
  }
  return (
    <div className={`mt-4 px-6 py-3 rounded-lg text-sm font-mono border ${ok ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10'}`}>
      {status}
    </div>
  );
}
