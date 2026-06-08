'use client';

import { useState, useEffect } from 'react';

interface SkinItem {
  id: string;
  name: string;
  price: number;
  chance: number;
  image: string;
  rarity: string;
}

interface CaseData {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  isActive: boolean;
  items: SkinItem[];
}

export default function CaseManager() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [editingCase, setEditingCase] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/admin/cases', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCases(data.cases);
      }
    } catch (e) {
      console.error("Failed to fetch cases");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const totalChance = editingCase 
    ? editingCase.items.reduce((sum, item) => sum + (Number(item.chance) || 0), 0) 
    : 0;
  
  const isChanceValid = Math.abs(totalChance - 100) < 0.01;

  const handleEditCase = (c: CaseData) => {
    setEditingCase(JSON.parse(JSON.stringify(c)));
  };

  const handleCreateNewCase = () => {
    const newCase: CaseData = {
      id: `new-${Date.now()}`,
      name: 'New Case',
      price: 10,
      image: '',
      category: 'NEW',
      isActive: false, // За замовчуванням нові кейси сховані (приватні)
      items: []
    };
    setEditingCase(newCase);
  };

  const handleAddNewItem = () => {
    if (!editingCase) return;
    const newItem: SkinItem = {
      id: `item-${Date.now()}`,
      name: 'New Skin',
      price: 1,
      chance: 0,
      image: '',
      rarity: 'Mil-Spec'
    };
    setEditingCase({ ...editingCase, items: [...editingCase.items, newItem] });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!editingCase) return;
    setEditingCase({ ...editingCase, items: editingCase.items.filter(i => i.id !== itemId) });
  };

  const handleSaveChanges = async () => {
    if (!editingCase || !isChanceValid) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/admin/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCase)
      });
      const data = await res.json();

      if (data.success) {
        alert('Case saved successfully!');
        await fetchCases(); 
        setEditingCase(data.case); 
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Error saving case.');
    } finally {
      setIsSaving(false);
    }
  };

  // НОВА ФУНКЦІЯ ВИДАЛЕННЯ
  const handleDeleteCase = async () => {
    if (!editingCase) return;
    if (editingCase.id.startsWith('new-')) {
      setEditingCase(null);
      return;
    }

    const confirmDelete = confirm(`Are you absolutely sure you want to delete "${editingCase.name}"? This action cannot be undone!`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/cases?id=${editingCase.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Case deleted.');
        setEditingCase(null);
        await fetchCases();
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Error deleting case.');
    }
  };

  if (isLoading) return <div className="p-10 text-white font-bold animate-pulse">Loading cases...</div>;

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-wide uppercase">Case Manager</h1>
          <p className="text-gray-400 mt-1">Create, edit, and balance your drop tables.</p>
        </div>
        <button 
          onClick={handleCreateNewCase}
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        >
          + New Case
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* ЛІВА КОЛОНКА */}
        <div className="lg:col-span-4 flex flex-col gap-3 bg-[#161a27] border border-gray-800 rounded-2xl p-4 overflow-y-auto shadow-lg no-scrollbar">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-2">Active Cases ({cases.length})</div>
          
          {cases.map((c) => (
            <div 
              key={c.id} 
              onClick={() => handleEditCase(c)}
              className={`p-4 rounded-xl cursor-pointer transition-all border-2 flex items-center gap-4 relative
                ${editingCase?.id === c.id 
                  ? 'border-emerald-500 bg-gray-800/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'border-transparent bg-gray-900 hover:bg-gray-800'}`}
            >
              {!c.isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_red]" title="Private Case"></div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.image ? <img src={c.image} alt="" className="w-12 h-12 object-contain drop-shadow-md" /> : <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-600">No Img</div>}
              <div className="flex-1">
                <div className="font-black text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
                  {c.name || 'Unnamed'}
                  {!c.isActive && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">PRIVATE</span>}
                </div>
                <div className="text-xs text-yellow-500 font-mono font-bold">{c.price || 0} pts</div>
              </div>
            </div>
          ))}
        </div>

        {/* ПРАВА КОЛОНКА (РЕДАКТОР) */}
        <div className="lg:col-span-8 bg-[#161a27] border border-gray-800 rounded-2xl shadow-lg flex flex-col overflow-hidden">
          {editingCase ? (
            <>
              <div className="p-6 border-b border-gray-800 bg-[#11141e] flex justify-between items-start">
                <div className="flex gap-6 items-center w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {editingCase.image ? <img src={editingCase.image} alt="" className="w-20 h-20 object-contain" /> : <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 text-[10px] text-center">No Img</div>}
                  <div className="flex flex-col gap-2 flex-1">
                    <input 
                      type="text" 
                      value={editingCase.name || ''}
                      onChange={(e) => setEditingCase({...editingCase, name: e.target.value})}
                      placeholder="CASE NAME"
                      className="bg-transparent border-b border-gray-700 outline-none text-2xl font-black text-white uppercase w-full pb-1 focus:border-emerald-500 transition-colors"
                    />
                    <div className="flex flex-wrap gap-4 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Price:</span>
                        <input type="number" value={editingCase.price ?? 0} onChange={(e) => setEditingCase({...editingCase, price: Number(e.target.value)})} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 outline-none text-yellow-500 font-mono font-bold w-20 text-sm"/>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Category:</span>
                        <input type="text" value={editingCase.category || ''} onChange={(e) => setEditingCase({...editingCase, category: e.target.value.toUpperCase()})} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 outline-none text-gray-300 font-bold w-28 text-sm uppercase"/>
                      </div>
                      
                      {/* ТУМБЛЕР ПРИВАТНОСТІ */}
                      <label className="flex items-center gap-2 cursor-pointer ml-auto bg-gray-800 px-3 py-1 rounded border border-gray-700 hover:bg-gray-700 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={editingCase.isActive} 
                          onChange={(e) => setEditingCase({...editingCase, isActive: e.target.checked})}
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className={`text-xs font-bold uppercase ${editingCase.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {editingCase.isActive ? 'Public (Visible)' : 'Private (Test Mode)'}
                        </span>
                      </label>

                      <div className="flex items-center gap-2 w-full mt-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Image URL:</span>
                        <input type="text" value={editingCase.image || ''} onChange={(e) => setEditingCase({...editingCase, image: e.target.value})} placeholder="https://..." className="bg-gray-800 border border-gray-700 rounded px-2 py-1 outline-none text-blue-400 font-mono w-full text-xs"/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-2 text-center text-[10px] font-black uppercase tracking-widest transition-colors ${isChanceValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                Drop Table Chances: {totalChance.toFixed(2)}% / 100%
                {!isChanceValid && <span className="ml-2">— MUST BE EXACTLY 100%!</span>}
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 no-scrollbar">
                {/* Оновлені заголовки таблиці */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 mb-1">
                  <div className="col-span-4">Item Name</div>
                  <div className="col-span-3">Rarity</div>
                  <div className="col-span-2">Value (pts)</div>
                  <div className="col-span-2">Chance (%)</div>
                  <div className="col-span-1 text-center">Del</div>
                </div>

                {editingCase.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-gray-900 border border-gray-800 p-3 rounded-lg hover:border-gray-700 transition-colors">
                    <div className="col-span-4 flex flex-col gap-1">
                      <input type="text" value={item.name || ''} onChange={(e) => { const newItems = [...editingCase.items]; newItems[index].name = e.target.value; setEditingCase({...editingCase, items: newItems}); }} placeholder="Skin Name" className="bg-transparent outline-none text-sm font-bold text-gray-200 w-full"/>
                      <input type="text" value={item.image || ''} onChange={(e) => { const newItems = [...editingCase.items]; newItems[index].image = e.target.value; setEditingCase({...editingCase, items: newItems}); }} placeholder="Image URL" className="bg-transparent outline-none text-[10px] text-gray-500 font-mono w-full"/>
                    </div>
                    
                    {/* ВИБІР РІДКОСТІ */}
                    <div className="col-span-3">
                      <select 
                        value={item.rarity || 'Mil-Spec'}
                        onChange={(e) => { const newItems = [...editingCase.items]; newItems[index].rarity = e.target.value; setEditingCase({...editingCase, items: newItems}); }}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 outline-none text-xs font-bold text-gray-300 w-full cursor-pointer"
                      >
                        <option value="Consumer Grade">Consumer (White)</option>
                        <option value="Industrial">Industrial (Light Blue)</option>
                        <option value="Mil-Spec">Mil-Spec (Blue)</option>
                        <option value="Restricted">Restricted (Purple)</option>
                        <option value="Classified">Classified (Pink)</option>
                        <option value="Covert">Covert (Red)</option>
                        <option value="Exceedingly Rare">Knife / Gloves (Gold)</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input type="number" value={item.price ?? 0} onChange={(e) => { const newItems = [...editingCase.items]; newItems[index].price = Number(e.target.value); setEditingCase({...editingCase, items: newItems}); }} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 outline-none text-yellow-500 font-mono font-bold w-full text-sm focus:border-yellow-500"/>
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={item.chance ?? 0} onChange={(e) => { const newItems = [...editingCase.items]; newItems[index].chance = Number(e.target.value); setEditingCase({...editingCase, items: newItems}); }} step="0.01" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 outline-none text-white font-mono font-bold w-full text-sm focus:border-emerald-500"/>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => handleRemoveItem(item.id)} className="text-gray-500 hover:text-red-500 transition-colors p-2">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={handleAddNewItem} className="mt-2 border-2 border-dashed border-gray-700 hover:border-emerald-500 text-gray-500 hover:text-emerald-500 font-bold uppercase tracking-widest text-xs py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                  + Add New Item
                </button>
              </div>

              <div className="p-4 border-t border-gray-800 bg-[#11141e] flex justify-between items-center">
                
                {/* КНОПКА ВИДАЛЕННЯ */}
                <button 
                  onClick={handleDeleteCase}
                  className="text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors border border-transparent hover:border-red-500/50"
                >
                  Delete Case
                </button>

                <button 
                  onClick={handleSaveChanges}
                  disabled={!isChanceValid || isSaving}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-black px-8 py-2.5 rounded-lg transition-colors uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
              <span className="font-bold uppercase tracking-widest text-sm">Select a case to edit or create new</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}