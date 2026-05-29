'use client';

interface Props {
  item: { name: string; price: number; imageUrl: string | null };
  onCollect: () => void;
  onSell: () => void;
}

export default function WinModal({ item, onCollect, onSell }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl text-center max-w-sm w-full animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-green-400">WIN!</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl || 'https://placehold.co/150'}
          className="w-24 h-24 object-contain mx-auto my-4"
          alt={item.name}
        />
        <p className="text-lg font-semibold text-white mb-1">{item.name}</p>
        <p className="text-yellow-400 font-mono font-bold mb-6">{Math.floor(item.price)} pts</p>
        <div className="flex gap-3">
          <button
            onClick={onCollect}
            className="w-1/2 bg-gray-700 hover:bg-gray-600 font-bold py-3 rounded-md transition-colors text-sm tracking-wide"
          >
            TO INVENTORY
          </button>
          <button
            onClick={onSell}
            className="w-1/2 bg-red-600 hover:bg-red-700 font-bold py-3 rounded-md transition-colors text-sm tracking-wide shadow-[0_0_15px_rgba(220,38,38,0.2)]"
          >
            SELL FOR {Math.floor(item.price)} pts
          </button>
        </div>
      </div>
    </div>
  );
}
