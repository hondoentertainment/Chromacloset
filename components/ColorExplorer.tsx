
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

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Color Spectrum</h2>
          <p className="text-slate-500 text-sm">Analyze every shade and hue in your collection.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFamily(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedFamily === null ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            All
          </button>
          {families.map(family => (
            <button
              key={family}
              onClick={() => setSelectedFamily(family)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedFamily === family ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              {family}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all">
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
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-900 shadow-sm uppercase">
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
    </div>
  );
};
