
import React, { useState } from 'react';
import { WardrobeItem } from '../types';

interface ColorExplorerProps {
  items: WardrobeItem[];
}

export const ColorExplorer: React.FC<ColorExplorerProps> = ({ items }) => {
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  const families = Array.from(new Set(items.map(i => i.colorFamily)));
  const filteredItems = selectedFamily 
    ? items.filter(i => i.colorFamily === selectedFamily)
    : items;
  const paletteCoverage = families.length > 0 ? Math.min(100, Math.round((families.length / 10) * 100)) : 0;

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 md:p-10 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
              Chromatic intelligence
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Color Spectrum</h2>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl mt-2">
                Analyze every shade, family, and pattern in your collection through a gallery designed like an editorial materials board.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Visible items', value: filteredItems.length },
              { label: 'Color families', value: families.length },
              { label: 'Palette coverage', value: `${paletteCoverage}%` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                <p className="mt-2 text-xl font-black text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-8">
          <button
            onClick={() => setSelectedFamily(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedFamily === null ? 'bg-white text-slate-950 shadow-md' : 'bg-white/5 text-slate-200 border border-white/10 hover:border-cyan-300/40'
            }`}
          >
            All
          </button>
          {families.map(family => (
            <button
              key={family}
              onClick={() => setSelectedFamily(family)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFamily === family ? 'bg-white text-slate-950 shadow-md' : 'bg-white/5 text-slate-200 border border-white/10 hover:border-cyan-300/40'
              }`}
            >
              {family}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="group bg-white/90 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_24px_70px_rgba(15,23,42,0.18)] hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(15,23,42,0.24)] transition-all">
            <div className="relative h-48">
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: item.dominantColorHex }}
              >
                <div className="text-center">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/30 uppercase tracking-widest">
                    {item.dominantColorHex}
                  </span>
                </div>
              </div>
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold text-slate-900 shadow-sm uppercase">
                {item.category}
              </div>
              <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-400"></span>
                {(item.confidence * 100).toFixed(0)}% Precise
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 capitalize">{item.colorName} {item.subcategory}</h4>
                  <p className="text-sm text-slate-500 font-medium">{item.brand !== 'Unknown' ? item.brand : 'Basic Item'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 py-3">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {item.colorFamily}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                  {item.patternType}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Color Family</span>
                  <span className="text-sm font-semibold text-slate-700">{item.colorFamily}</span>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pattern</span>
                  <span className="text-sm font-semibold text-slate-700 capitalize">{item.patternType}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 backdrop-blur-xl p-12 text-center">
          <p className="text-lg font-bold text-white">No pieces match this family yet.</p>
          <p className="text-sm text-slate-400 mt-2">Try another filter or scan more inventory to expand your color landscape.</p>
        </div>
      )}
    </div>
  );
};
