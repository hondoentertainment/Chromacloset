
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScanModule } from './components/ScanModule';
import { Dashboard } from './components/Dashboard';
import { ColorExplorer } from './components/ColorExplorer';
import { StylistModule } from './components/StylistModule';
import { WardrobeItem, ScanResult } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scan' | 'explorer' | 'stylist'>('dashboard');
  
  // Persisted items
  const [items, setItems] = useState<WardrobeItem[]>(() => {
    try {
      const saved = localStorage.getItem('chromacloset_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persisted scan history
  const [scans, setScans] = useState<ScanResult[]>(() => {
    try {
      const saved = localStorage.getItem('chromacloset_scans');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Cumulative total scanned count (Lifetime)
  const [totalScannedCount, setTotalScannedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('chromacloset_total_scanned');
      return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
      return 0;
    }
  });

  // Global Brand Icon
  const [closetIcon, setClosetIcon] = useState<string | null>(() => {
    return localStorage.getItem('chromacloset_brand_icon');
  });

  useEffect(() => {
    try {
      localStorage.setItem('chromacloset_items', JSON.stringify(items));
      localStorage.setItem('chromacloset_scans', JSON.stringify(scans));
      localStorage.setItem('chromacloset_total_scanned', totalScannedCount.toString());
      if (closetIcon) {
        localStorage.setItem('chromacloset_brand_icon', closetIcon);
      }
    } catch (e) {
      console.warn("Storage quota warning", e);
    }
  }, [items, scans, totalScannedCount, closetIcon]);

  const handleScanComplete = (newItems: WardrobeItem[]) => {
    setItems(prev => [...prev, ...newItems]);
    setTotalScannedCount(prev => prev + newItems.length);
    
    const newScan: ScanResult = {
      items: newItems,
      timestamp: Date.now()
    };
    setScans(prev => [newScan, ...prev].slice(0, 20));
    setActiveTab('dashboard');
  };

  const deleteScan = (timestamp: number) => {
    const scanToDelete = scans.find(s => s.timestamp === timestamp);
    if (!scanToDelete) return;

    if (confirm(`Remove this scan record and its ${scanToDelete.items.length} items from your closet?`)) {
      const itemIdsToRemove = new Set(scanToDelete.items.map(i => i.id));
      setItems(prev => prev.filter(item => !itemIdsToRemove.has(item.id)));
      setScans(prev => prev.filter(s => s.timestamp !== timestamp));
    }
  };

  const clearCloset = () => {
    if (confirm("Are you sure you want to clear your entire inventory? This cannot be undone.")) {
      setItems([]);
      setScans([]);
      setTotalScannedCount(0);
      setClosetIcon(null);
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        closetIcon={closetIcon} 
      />
      
      <main className="max-w-6xl mx-auto px-4 pb-20">
        {activeTab === 'dashboard' && (
          <>
            {(items.length > 0 || totalScannedCount > 0) && (
              <div className="flex justify-end pt-6 -mb-4">
                <button 
                  onClick={clearCloset}
                  className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
                >
                  Reset Entire Closet
                </button>
              </div>
            )}
            <Dashboard 
              items={items} 
              scans={scans} 
              onDeleteScan={deleteScan} 
              totalScannedCount={totalScannedCount}
              closetIcon={closetIcon}
              onIconUpdate={setClosetIcon}
            />
          </>
        )}
        
        {activeTab === 'scan' && (
          <ScanModule onScanComplete={handleScanComplete} />
        )}
        
        {activeTab === 'explorer' && (
          <ColorExplorer items={items} />
        )}

        {activeTab === 'stylist' && (
          <StylistModule items={items} />
        )}

        {items.length === 0 && activeTab === 'dashboard' && (
          <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-100 mb-10 overflow-hidden border-2 border-slate-50">
              {closetIcon ? (
                <img src={closetIcon} alt="Closet Identity" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                </svg>
              )}
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Your Virtual Closet awaits</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed text-lg">
              Unlock a deep analysis of your wardrobe's color DNA and get personalized styling with Gemini AI.
            </p>
            <button
              onClick={() => setActiveTab('scan')}
              className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all text-lg"
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
