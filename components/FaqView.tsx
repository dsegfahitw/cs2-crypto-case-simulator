'use client';

export default function FaqView() {
  return (
    <section className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-6 border-b border-gray-700 pb-2">
        <h2 className="text-3xl font-bold text-gray-200">Help & FAQ</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-500 transition-colors">
          <h3 className="text-xl font-bold text-green-400 mb-2">Are real money used here?</h3>
          <p className="text-gray-300 leading-relaxed">
            No. <strong>SkinBank Beta</strong> is purely an educational case-opening simulator. The entire economy is built on virtual{' '}
            &quot;Points&quot; (pts). You cannot make a real deposit, withdraw funds, or transfer skins to your real Steam account. Play for fun!
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-500 transition-colors">
          <h3 className="text-xl font-bold text-green-400 mb-2">How does Provably Fair work?</h3>
          <p className="text-gray-300 leading-relaxed mb-2">
            We use the <strong>SHA-256</strong> cryptographic algorithm. Every roll uses three inputs:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 mb-3 ml-2">
            <li><span className="text-gray-300 font-mono bg-gray-900 px-1 rounded">Server Seed</span> (our server&apos;s secret key)</li>
            <li><span className="text-gray-300 font-mono bg-gray-900 px-1 rounded">Client Seed</span> (your personal key)</li>
            <li><span className="text-gray-300 font-mono bg-gray-900 px-1 rounded">Nonce</span> (your exact game counter in the DB)</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            The system combines these and generates a hash <em>before</em> the roulette starts spinning. This mathematically guarantees the
            result is determined in advance and cannot be manipulated during the animation.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-500 transition-colors">
          <h3 className="text-xl font-bold text-green-400 mb-2">How do I get more Points?</h3>
          <p className="text-gray-300 leading-relaxed">
            Every new player automatically receives a welcome bonus of <strong>150 Points</strong> upon Steam login. You can also sell skins
            from your Inventory back to the system to keep spinning. Use the daily free case and promo codes for extra rewards!
          </p>
        </div>
      </div>
    </section>
  );
}
