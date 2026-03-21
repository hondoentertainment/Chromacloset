
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { WardrobeItem } from '../types';
import { generateClosetIcon } from '../services/geminiService';
import { analyzeWardrobeGaps } from '../services/stylistService';
import { trackEvent } from '../services/analyticsService';
import { useCloset } from '../contexts/ClosetContext';

const STYLE_VIBES = [
  { id: 'minimalist', label: 'Minimalist', desc: 'Clean lines, airy space' },
  { id: 'avant-garde', label: 'Avant-Garde', desc: 'Bold, artistic, unique' },
  { id: 'vintage', label: 'Vintage', desc: 'Classic, warm, nostalgic' },
  { id: 'brutalist', label: 'Brutalist', desc: 'Raw, edgy, geometric' },
  { id: 'organic', label: 'Organic', desc: 'Soft shapes, natural' }
];

export const Dashboard: React.FC = () => {
  const { items, totalScannedCount, closetIcon, savedOutfits, scans, deleteScan, setClosetIcon } = useCloset();
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState(STYLE_VIBES[0]);
  const [genProgress, setGenProgress] = useState(0);
  const [isGapLoading, setIsGapLoading] = useState(false);
  const [gapSuggestion, setGapSuggestion] = useState<{ itemType: string; suggestedColor: string; reasoning: string; priority: 'high' | 'medium' | 'low' } | null>(null);
  const [gapError, setGapError] = useState<string | null>(null);



  const stats = useMemo(() => {
    const total = items.length;
    const colors = Array.from(new Set(items.map(i => i.dominantColorHex))).length;
    const families = Array.from(new Set(items.map(i => i.colorFamily))).length;
    
    const familyCounts = items.reduce((acc, item) => {
      acc[item.colorFamily] = (acc[item.colorFamily] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const leastRepresentedFamilyEntry = Object.entries(familyCounts)
      .sort((a, b) => (a[1] as number) - (b[1] as number))[0];

    const mostCommonColorFamily = items.length > 0 
      ? Object.entries(familyCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
      : 'vibrant colors';
    const categoryValues = Object.values(categoryCounts) as number[];
    const colorBalanceScore = items.length > 0
      ? Math.max(35, Math.round((families / Math.max(1, total)) * 100 + 45))
      : 0;
    const wardrobeDiversityScore = categoryValues.length > 0
      ? Math.max(30, Math.round((Math.min(...categoryValues) / Math.max(...categoryValues)) * 100))
      : 0;
    const mostWornLookType: Record<string, number> = savedOutfits.length > 0
      ? savedOutfits
          .reduce((acc, outfit) => {
            acc[outfit.styleVibe] = (acc[outfit.styleVibe] || 0) + (outfit.lastWorn ? 2 : 1);
            return acc;
          }, {} as Record<string, number>)
      : {};
    const dominantLookType = Object.keys(mostWornLookType).length > 0
      ? Object.entries(mostWornLookType).sort((a, b) => b[1] - a[1])[0][0]
      : 'Not enough wear data yet';

    return { 
      total, colors, families, 
      mostCommonColorFamily,
      leastRepresentedFamily: leastRepresentedFamilyEntry?.[0] || 'Neutral',
      colorBalanceScore,
      wardrobeDiversityScore,
      dominantLookType,
      familyData: Object.entries(familyCounts).map(([name, value]) => ({ name, value })),
      categoryData: Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
    };
  }, [items, savedOutfits]);

  const handleGenerateInStudio = async () => {
    setIsGenerating(true);
    setGenProgress(10);
    const interval = setInterval(() => {
      setGenProgress(p => p < 90 ? p + Math.random() * 15 : p);
    }, 800);

    try {
      const colorContext = items.length > 0 
        ? `a palette focused on ${stats.mostCommonColorFamily} shades`
        : "a beautiful spectrum of vibrant colors";
      
      const iconUrl = await generateClosetIcon(selectedVibe.id, colorContext);
      setClosetIcon(iconUrl);
      setGenProgress(100);
      setTimeout(() => setGenProgress(0), 1000);
    } catch (err) {
      alert("Design Studio encountered a glitch. Please try again.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };


  const fetchGapSuggestion = async () => {
    if (items.length === 0) return;

    setIsGapLoading(true);
    setGapError(null);
    trackEvent('dashboard_gap_suggestion_requested', { inventory_size: items.length });

    try {
      const gaps = await analyzeWardrobeGaps(items);
      setGapSuggestion(gaps[0] || null);
      if (!gaps.length) {
        trackEvent('dashboard_gap_suggestion_failed', { reason: 'no_gap' });
        setGapError('No clear gap found yet — your closet may already be well balanced.');
      } else {
        trackEvent('dashboard_gap_suggestion_generated', {
          item_type: gaps[0].itemType,
          suggested_color: gaps[0].suggestedColor,
          priority: gaps[0].priority
        });
      }
    } catch (error) {
      trackEvent('dashboard_gap_suggestion_failed', { reason: 'service_error' });
      setGapError('Could not generate a suggestion right now. Please retry.');
    } finally {
      setIsGapLoading(false);
    }
  };

  const handleDeleteScan = (timestamp: number, itemCount: number) => {
    if (confirm(`Remove this scan record and its ${itemCount} items from your closet?`)) {
      trackEvent('scan_deleted', { items_removed: itemCount });
      deleteScan(timestamp);
    }
  };

  if (items.length === 0 && totalScannedCount === 0) {
    return null;
  }

  return (
    <div className="space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 md:p-10 shadow-[0_24px_90px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-indigo-200">
              Wardrobe performance overview
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Luxury intelligence for every piece you own.</h2>
              <p className="text-slate-300 mt-3 max-w-2xl leading-relaxed">
                Track collection density, identify underrepresented tones, and spot the next move your closet needs from a single editorial-style command surface.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Closet depth', value: `${stats.total} pieces` },
              { label: 'Dominant family', value: stats.mostCommonColorFamily },
              { label: 'Balance score', value: `${stats.colorBalanceScore}/100` },
              { label: 'Style signal', value: stats.dominantLookType },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{kpi.label}</p>
                <p className="mt-2 text-lg font-black text-white capitalize">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Design Studio Modal */}
      {isStudioOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
            {/* Left: Previews */}
            <div className="md:w-1/2 bg-slate-50 p-8 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
              <div className="absolute top-8 left-8">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Brand Studio</span>
              </div>
              
              <div className="relative group">
                <div className={`w-48 h-48 rounded-[3rem] bg-white shadow-2xl overflow-hidden border-8 border-white transition-all ${isGenerating ? 'scale-95 grayscale' : ''}`}>
                  {closetIcon ? (
                    <img src={closetIcon} alt="Brand Art" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className="w-full grid grid-cols-3 gap-4">
                 {[
                   { label: 'App Icon', class: 'rounded-2xl shadow-lg border-2 border-white' },
                   { label: 'Hang Tag', class: 'rounded-sm shadow-md h-24 w-12 border border-slate-200' },
                   { label: 'Tote Bag', class: 'rounded-t-3xl shadow-lg h-24 w-24 bg-white border border-slate-100' }
                 ].map((mock, i) => (
                   <div key={i} className="flex flex-col items-center gap-2">
                     <div className={`${mock.class} overflow-hidden bg-white flex items-center justify-center`}>
                        {closetIcon && <img src={closetIcon} className="w-full h-full object-cover opacity-80" />}
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{mock.label}</span>
                   </div>
                 ))}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="md:w-1/2 p-10 flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-3xl font-black text-slate-900">Design Studio</h3>
                <button onClick={() => setIsStudioOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 space-y-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Select Artistic Vibe</label>
                  <div className="space-y-2">
                    {STYLE_VIBES.map(v => (
                      <button 
                        key={v.id}
                        onClick={() => setSelectedVibe(v)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                          selectedVibe.id === v.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'border-slate-100 hover:border-indigo-100'
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-bold ${selectedVibe.id === v.id ? 'text-indigo-900' : 'text-slate-800'}`}>{v.label}</p>
                          <p className="text-xs text-slate-500">{v.desc}</p>
                        </div>
                        {selectedVibe.id === v.id && (
                          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                   <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Contextual Palette</span>
                   <p className="text-xs text-slate-600 leading-relaxed">Studio will prioritize <strong>{stats.mostCommonColorFamily}</strong> hues based on your wardrobe DNA.</p>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                {isGenerating && (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${genProgress}%` }}></div>
                  </div>
                )}
                <button 
                  onClick={handleGenerateInStudio}
                  disabled={isGenerating}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isGenerating ? 'Rendering Brand...' : 'Generate Brand Art'}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 00.547 1.022l1.414 1.414a2 2 0 001.022.547l2.387.477a2 2 0 001.96-1.414l.477-2.387a2 2 0 00-.547-1.022l-1.414-1.414z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.757 14.757l3.182-3.182M12 21a9 9 0 110-18 9 9 0 010 18zM9 9a1 1 0 000 2h3m-3 3h3" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}





      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Current Items', value: stats.total, icon: '👕' },
            { label: 'Lifetime Scans', value: totalScannedCount, icon: '📈' },
            { label: 'Unique Colors', value: stats.colors, icon: '🎨' },
            { label: 'Color Families', value: stats.families, icon: '🌈' },
            { label: 'Top Family', value: stats.mostCommonColorFamily, icon: '✨' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{stat.label}</div>
              <div className="text-xl font-bold text-slate-900 truncate">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Brand Identity Card */}
        <div 
          onClick={() => setIsStudioOpen(true)}
          className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-200 hover:shadow-lg transition-all"
        >
          <div className="relative">
            <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-inner flex items-center justify-center bg-slate-50 transition-all`}>
              {closetIcon ? (
                <img src={closetIcon} alt="Closet Identity" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                </svg>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Design Studio</p>
            <p className="text-xs font-bold text-slate-800 mt-1">Refine Identity</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: 'Color Balance Score',
                value: `${stats.colorBalanceScore}/100`,
                note: stats.colorBalanceScore >= 75 ? 'Great spread across color families.' : `Add more ${stats.leastRepresentedFamily.toLowerCase()} pieces for balance.`,
              },
              {
                label: 'Wardrobe Diversity',
                value: `${stats.wardrobeDiversityScore}/100`,
                note: stats.wardrobeDiversityScore >= 70 ? 'Category mix looks healthy.' : 'Your closet leans heavily into a few categories.',
              },
              {
                label: 'Most Worn Look Type',
                value: stats.dominantLookType,
                note: savedOutfits.length > 0 ? 'Based on saved looks and wear marks.' : 'Save and wear outfits to unlock this insight.',
              }
            ].map((insight) => (
              <div key={insight.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{insight.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-2">{insight.value}</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{insight.note}</p>
              </div>
            ))}
          </div>

          {items.length > 0 ? (
            <>
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Inventory by Family</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.familyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Inventory by Category</h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="h-64 w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.categoryData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
                    {stats.categoryData.map((entry, index) => (
                      <div key={index} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'][index % 5] }}></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.name}</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800">{entry.value} Items</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h4 className="font-bold text-slate-800">No Inventory Data</h4>
              <p className="text-sm text-slate-500 max-w-xs mt-2">Add items to see your wardrobe analytics and color balance.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Suggested Next Item</h3>
              <button
                onClick={fetchGapSuggestion}
                disabled={isGapLoading || items.length === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isGapLoading ? 'Analyzing...' : (gapSuggestion ? 'Refresh' : 'Generate')}
              </button>
            </div>

            {gapSuggestion ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                    gapSuggestion.priority === 'high'
                      ? 'bg-rose-100 text-rose-700'
                      : gapSuggestion.priority === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {gapSuggestion.priority} confidence
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {gapSuggestion.suggestedColor} {gapSuggestion.itemType}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">{gapSuggestion.reasoning}</p>
                <p className="text-[11px] text-indigo-600 font-semibold">
                  Insight: your lightest coverage today is in {stats.leastRepresentedFamily.toLowerCase()} tones.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Get one AI recommendation to improve outfit versatility.</p>
                <p className="text-xs text-slate-400">Current nudge: look for more {stats.leastRepresentedFamily.toLowerCase()} options to diversify your palette.</p>
              </div>
            )}

            {gapError && <p className="text-xs text-rose-600 mt-3">{gapError}</p>}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Closet History
              </h3>
            </div>
            
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
              {scans.length > 0 ? (
                scans.map((scan) => (
                  <div key={scan.timestamp} className="relative pl-8 group">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 z-10"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(scan.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-bold text-slate-800 mt-1">Added {scan.items.length} items</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteScan(scan.timestamp, scan.items.length)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic pl-8">No closet history yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
