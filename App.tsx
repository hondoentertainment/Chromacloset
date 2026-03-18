
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScanModule } from './components/ScanModule';
import { Dashboard } from './components/Dashboard';
import { ColorExplorer } from './components/ColorExplorer';
import { StylistModule } from './components/StylistModule';
import { AnalyticsDebugPanel } from './components/AnalyticsDebugPanel';
import { WardrobeItem, ScanResult } from './types';
import type { ScanTelemetry } from './components/ScanModule';
import { trackEvent } from './services/analyticsService';

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
    trackEvent('app_opened', { source: 'browser' });
  }, []);

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

  const handleScanComplete = (newItems: WardrobeItem[], telemetry?: ScanTelemetry) => {
    setItems(prev => [...prev, ...newItems]);
    setTotalScannedCount(prev => prev + newItems.length);
    if (telemetry) {
      trackEvent('scan_completed', {
        source: telemetry.source,
        mode: telemetry.mode,
        items_detected: newItems.length,
        latency_ms: telemetry.latencyMs,
      });
    }
    
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
      trackEvent('scan_deleted', { items_removed: scanToDelete.items.length });
      const itemIdsToRemove = new Set(scanToDelete.items.map(i => i.id));
      setItems(prev => prev.filter(item => !itemIdsToRemove.has(item.id)));
      setScans(prev => prev.filter(s => s.timestamp !== timestamp));
    }
  };

  const clearCloset = () => {
    if (confirm("Are you sure you want to clear your entire inventory? This cannot be undone.")) {
      trackEvent('closet_reset', { items_before_reset: items.length, scans_before_reset: scans.length });
      setItems([]);
      setScans([]);
      setTotalScannedCount(0);
      setClosetIcon(null);
      localStorage.clear();
    }
  };

  const handleTabChange = (tab: 'dashboard' | 'scan' | 'explorer' | 'stylist') => {
    if (tab !== activeTab) {
      trackEvent('tab_switched', { to_tab: tab });
    }
    setActiveTab(tab);
  };

  const shellStats = [
    { label: 'Live inventory', value: items.length, icon: 'Closet' },
    { label: 'Lifetime scans', value: totalScannedCount, icon: 'Scans' },
    { label: 'Active workspace', value: activeTab.charAt(0).toUpperCase() + activeTab.slice(1), icon: 'View' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <Header 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        closetIcon={closetIcon} 
        itemsCount={items.length}
        totalScannedCount={totalScannedCount}
      />
      
      <main className="max-w-7xl mx-auto px-4 pb-20 relative">
        <section className="pt-8 pb-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_30px_120px_rgba(15,23,42,0.45)] overflow-hidden">
            <div className="grid lg:grid-cols-[1.4fr,0.9fr] gap-8 p-8 lg:p-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.25em] text-indigo-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.8)]" />
                  Premium wardrobe operating system
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white max-w-3xl">
                    A couture-grade interface for wardrobe intelligence, planning, and styling.
                  </h1>
                  <p className="text-slate-300 max-w-2xl text-base md:text-lg leading-relaxed">
                    Chromacloset now opens like a modern luxury control room: high-signal navigation, ambient context, and fast action paths for scan, insight, and styling workflows.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleTabChange('scan')}
                    className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-bold shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all"
                  >
                    Launch Scan Studio
                  </button>
                  <button
                    onClick={() => handleTabChange('stylist')}
                    className="px-6 py-3 rounded-2xl border border-white/15 bg-white/5 text-white font-bold hover:bg-white/10 transition-all"
                  >
                    Open Style Concierge
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-4">
                {shellStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.75rem] border border-white/10 bg-slate-900/50 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{stat.icon}</p>
                    <p className="mt-3 text-2xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {activeTab === 'dashboard' && (
          <>
            {(items.length > 0 || totalScannedCount > 0) && (
              <div className="flex justify-end pt-4 -mb-2">
                <button 
                  onClick={clearCloset}
                  className="text-xs text-slate-400 hover:text-red-300 font-medium transition-colors"
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
            <div className="w-full max-w-3xl rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-10 md:p-14 shadow-[0_40px_120px_rgba(15,23,42,0.5)]">
              <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-100 mb-10 overflow-hidden border-2 border-slate-50 mx-auto">
              {closetIcon ? (
                <img src={closetIcon} alt="Closet Identity" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                </svg>
              )}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Your virtual closet, redesigned like a luxury operating system.</h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed text-lg">
                Scan pieces, understand your color story, and generate polished looks from a workspace built to feel cinematic, fast, and editorial.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleTabChange('scan')}
                  className="px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg"
                >
                  Start First Scan
                </button>
                <button
                  onClick={() => handleTabChange('stylist')}
                  className="px-10 py-5 border border-white/15 bg-white/5 text-white rounded-[1.5rem] font-bold hover:bg-white/10 transition-all text-lg"
                >
                  Explore Styling
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-12 text-center text-slate-500 text-sm relative">
        <p>&copy; 2026 Chromacloset Wardrobe Intelligence</p>
      </footer>

      <AnalyticsDebugPanel />
    </div>
  );
};

export default App;
