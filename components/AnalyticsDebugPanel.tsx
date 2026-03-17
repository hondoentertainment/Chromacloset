import React, { useMemo, useState } from 'react';
import { clearTrackedEvents, getTrackedEvents } from '../services/analyticsService';

const MAX_SHOWN = 50;

export const AnalyticsDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  const events = useMemo(() => {
    const allEvents = getTrackedEvents();
    const filtered = selectedEvent === 'all'
      ? allEvents
      : allEvents.filter(e => e.name === selectedEvent);
    return filtered.slice(0, MAX_SHOWN);
  }, [refreshTick, selectedEvent]);

  const eventNames = useMemo(() => {
    const names = Array.from(new Set(getTrackedEvents().map(e => e.name)));
    return names.sort();
  }, [refreshTick]);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[250]">
      {isOpen && (
        <div className="w-[22rem] max-h-[60vh] bg-slate-950 text-slate-100 rounded-2xl border border-slate-700 shadow-2xl mb-3 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold">Analytics Debug</h4>
              <p className="text-[10px] text-slate-400">Showing latest {events.length} events</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
            >
              Close
            </button>
          </div>

          <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded-md px-2 py-1"
            >
              <option value="all">All events</option>
              {eventNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              onClick={() => setRefreshTick(t => t + 1)}
              className="text-xs px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                clearTrackedEvents();
                setRefreshTick(t => t + 1);
              }}
              className="text-xs px-2 py-1 rounded-md bg-rose-700 hover:bg-rose-600"
            >
              Clear
            </button>
          </div>

          <div className="overflow-y-auto max-h-[42vh] divide-y divide-slate-800">
            {events.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">No events tracked yet.</p>
            ) : (
              events.map((event, idx) => (
                <div key={`${event.timestamp}-${idx}`} className="px-4 py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-indigo-300 truncate">{event.name}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-[10px] bg-slate-900 rounded-md p-2 overflow-x-auto text-slate-300">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setRefreshTick(t => t + 1);
          setIsOpen(v => !v);
        }}
        className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg hover:bg-black"
      >
        {isOpen ? 'Hide Analytics' : 'Analytics'}
      </button>
    </div>
  );
};
