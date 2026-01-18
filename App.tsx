
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScanModule } from './components/ScanModule';
import { Dashboard } from './components/Dashboard';
import { ColorExplorer } from './components/ColorExplorer';
import { WardrobeItem } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'explorer'>('dashboard');
  const [items, setItems] = useState<WardrobeItem[]>(() => {
    try {
      const saved = localStorage.getItem('chromacloset_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Storage load error:", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('chromacloset_items', JSON.stringify(items));
    } catch (e) {
      console.warn("LocalStorage is full. Some data might not be saved.", e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert("Your storage is full! Please clear some items or browser data to continue saving.");
      }
    }
  }, [items]);

  const handleScanComplete = (newItems: WardrobeItem[]) => {
    setItems(prev => [...prev, ...newItems]);
    setActiveTab('dashboard');
  };

  const clearCloset = () => {
    if (confirm("Are you sure you want to clear your entire inventory? This cannot be undone.")) {
      setItems([]);
      localStorage.removeItem('chromacloset_items');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-6xl mx-auto px-4">
        {activeTab === 'dashboard' && (
          <>
            {items.length > 0 && (
              <div className="flex justify-end pt-6 -mb-4">
                <button 
                  onClick={clearCloset}
                  className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            )}
            <Dashboard items={items} />
          </>
        )}
        
        {activeTab === 'scan' && (
          <ScanModule onScanComplete={handleScanComplete} />
        )}
        
        {activeTab === 'explorer' && (
          <ColorExplorer items={items} />
        )}

        {items.length === 0 && activeTab === 'dashboard' && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100 mb-8 animate-bounce">
              <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Your Virtual Closet is Empty</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
              Scan your wardrobe to get a deep analysis of your clothing counts, color balance, and style metrics.
            </p>
            <button
              onClick={() => setActiveTab('scan')}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
            >
              Start First Scan
            </button>
          </div>
        )}
      </main>
      
      <footer className="py-12 text-center text-slate-400 text-sm">
        <p>&copy; 2026 Chromacloset Wardrobe Intelligence</p>
      </footer>
    </div>
  );
};

export default App;
