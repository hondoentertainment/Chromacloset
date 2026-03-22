import React, { useMemo } from 'react';
import { useCloset } from '../contexts/ClosetContext';
import { buildProductionReadinessSnapshot } from '../services/productionReadinessService';
import { buildAnalyticsSessionBundle, getTrackedEvents } from '../services/analyticsService';

export const InternalToolsPanel: React.FC = () => {
  const { items, scans, savedOutfits } = useCloset();
  const productionSnapshot = useMemo(() => buildProductionReadinessSnapshot(items, scans, savedOutfits), [items, scans, savedOutfits]);
  const analyticsBundle = useMemo(() => buildAnalyticsSessionBundle(getTrackedEvents()), []);

  return (
    <div className="py-10 max-w-6xl mx-auto px-4 space-y-8 animate-in fade-in duration-500">
      <section className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 md:p-10 shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
              Internal QA + debug surface
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-white">Operational insights for roadmap, analytics, and readiness checks.</h1>
            <p className="mt-3 max-w-3xl text-slate-300 leading-relaxed">
              Keep internal production-readiness metrics and analytics QA away from the customer dashboard while preserving a fast path for validation in development.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Events tracked', value: analyticsBundle.summary.event_count },
              { label: 'Parity', value: analyticsBundle.summary.transports.parity_status },
              { label: 'Sync readiness', value: `${productionSnapshot.syncSummary.syncReadinessScore}/100` },
              { label: 'Saved looks', value: productionSnapshot.syncSummary.savedLooks },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
                <p className="mt-2 text-lg font-black text-white capitalize">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.22em]">Multi-agent production center</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Five production agents driving the next roadmap phases.</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">This internal workspace keeps ingestion, planning, memory, gap prioritization, and sync readiness visible without crowding the customer dashboard.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Sync readiness</p>
            <p className="mt-2 text-xl font-black text-slate-900">{productionSnapshot.syncSummary.syncReadinessScore}/100</p>
            <p className="text-xs text-slate-500">{productionSnapshot.syncSummary.items} items · {productionSnapshot.syncSummary.scans} scans · {productionSnapshot.syncSummary.savedLooks} saved looks</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          {productionSnapshot.agentCards.map((agent) => (
            <div key={agent.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{agent.phase}</p>
                  <h4 className="text-sm font-bold text-slate-900">{agent.title}</h4>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${agent.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : agent.status === 'needs_attention' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                  {agent.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{agent.headline}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{agent.detail}</p>
              <p className="text-[11px] text-indigo-600 font-semibold">{agent.testingNote}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
