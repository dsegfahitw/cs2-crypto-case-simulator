'use client';

interface Props {
  item: { name: string; price: number; imageUrl: string | null };
  onClose: () => void;
}

export default function DailyModal({ item, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl text-center max-w-sm w-full animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-yellow-400">DAILY BONUS!</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl || 'https://placehold.co/150'}
          className="w-24 h-24 object-contain mx-auto my-4"
          alt={item.name}
        />
        <p className="text-lg font-semibold text-white mb-1">{item.name}</p>
        <p className="text-yellow-400 font-mono font-bold mb-6">{Math.floor(item.price)} pts</p>
        <button
          onClick={onClose}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md transition-colors text-sm tracking-wide"
        >
          TO INVENTORY
        </button>
      </div>
    </div>
  );
}
