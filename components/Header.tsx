import React from 'react';

interface HeaderProps {
  activeTab: 'dashboard' | 'scan' | 'explorer' | 'stylist' | 'internal';
  setActiveTab: (tab: 'dashboard' | 'scan' | 'explorer' | 'stylist' | 'internal') => void;
  closetIcon?: string | null;
  itemsCount: number;
  totalScannedCount: number;
  showInternalTab?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, closetIcon, itemsCount, totalScannedCount, showInternalTab = false }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'scan', label: 'Scan', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
    { id: 'explorer', label: 'Colors', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343' },
    { id: 'stylist', label: 'Stylist', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    ...(showInternalTab ? [{ id: 'internal', label: 'Internal', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }] : []),
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, closetIcon, itemsCount, totalScannedCount }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center overflow-hidden shadow-[0_16px_40px_rgba(99,102,241,0.35)] border border-white/10 transition-transform group-hover:scale-105">
            {closetIcon ? (
              <img src={closetIcon} alt="Chromacloset" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </div>
          <div>
            <span className="block text-xl font-black text-white tracking-tight">Chromacloset</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Luxury wardrobe command center</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Inventory', value: itemsCount },
              { label: 'Scans', value: totalScannedCount },
              { label: 'Mode', value: activeTab },
            ].map((pill) => (
              <div key={pill.label} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200">
                <span className="text-slate-400 mr-2">{pill.label}</span>
                <span className="text-white capitalize">{pill.value}</span>
              </div>
            ))}
          </div>

          <nav className="flex gap-1 rounded-[1.25rem] border border-white/10 bg-white/5 p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-950 shadow-2xl'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        </div>
        
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Inventory', value: itemsCount },
              { label: 'Scans', value: totalScannedCount },
              { label: 'Mode', value: activeTab },
            ].map((pill) => (
              <div key={pill.label} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200">
                <span className="text-slate-400 mr-2">{pill.label}</span>
                <span className="text-white capitalize">{pill.value}</span>
              </div>
            ))}
          </div>

        <nav className="flex gap-1 rounded-[1.25rem] border border-white/10 bg-white/5 p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
          {[
            { id: 'dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'scan', label: 'Scan', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
            { id: 'explorer', label: 'Colors', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343' },
            { id: 'stylist', label: 'Stylist', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-950 shadow-2xl'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
        </div>
      </div>
    </header>
  );
};
