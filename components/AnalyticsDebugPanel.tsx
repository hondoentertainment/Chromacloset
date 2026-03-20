import React, { useMemo, useState } from 'react';
import {
  buildAnalyticsSessionBundle,
  clearTrackedEvents,
  exportAnalyticsSessionBundle,
  exportTrackedEvents,
  getTrackedEvents,
} from '../services/analyticsService';
import { clearTrackedEvents, exportTrackedEvents, getTrackedEvents } from '../services/analyticsService';

const MAX_SHOWN = 50;

const downloadTextFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const AnalyticsDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const allEvents = useMemo(() => getTrackedEvents(), [refreshTick]);

  const events = useMemo(() => {
    const filtered = selectedEvent === 'all'
      ? allEvents
      : allEvents.filter((event) => event.name === selectedEvent);
    return filtered.slice(0, MAX_SHOWN);
  }, [allEvents, selectedEvent]);

  const sessionBundle = useMemo(() => buildAnalyticsSessionBundle(allEvents), [allEvents]);

  const eventNames = useMemo(() => {
    const names = Array.from(new Set(allEvents.map((event) => event.name)));
    return names.sort();
  }, [allEvents]);

  const handleCopy = async (content: string, label: string) => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setStatusMessage(`${label} copied to clipboard.`);
      setRefreshTick((tick) => tick + 1);
    } catch (error) {
      console.warn(`Unable to copy ${label}`, error);
      setStatusMessage(`${label} copy failed.`);
    }
  };

  const handleDownload = (filename: string, content: string, mimeType: string, label: string) => {
    if (!content) return;
    downloadTextFile(filename, content, mimeType);
    setStatusMessage(`${label} downloaded.`);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    const content = exportTrackedEvents(format);
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setRefreshTick((t) => t + 1);
    } catch (error) {
      console.warn('Unable to copy analytics export', error);
    }
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[250]">
      {isOpen && (
        <div className="w-[26rem] max-h-[72vh] bg-slate-950 text-slate-100 rounded-2xl border border-slate-700 shadow-2xl mb-3 overflow-hidden">
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

          <div className="px-4 py-3 border-b border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-800">
                <p className="text-slate-500 uppercase tracking-[0.2em] font-black">Session</p>
                <p className="mt-1 text-slate-100 font-semibold break-all">{sessionBundle.summary.session_id}</p>
              </div>
              <div className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-800">
                <p className="text-slate-500 uppercase tracking-[0.2em] font-black">Parity</p>
                <p className={`mt-1 font-semibold ${sessionBundle.summary.transports.parity_status === 'matched' ? 'text-emerald-300' : sessionBundle.summary.transports.parity_status === 'mismatch' ? 'text-amber-300' : 'text-slate-300'}`}>
                  {sessionBundle.summary.transports.parity_status}
                </p>
                <p className="text-slate-400 mt-1">
                  local {sessionBundle.summary.transports.local_count} · remote {sessionBundle.summary.transports.remote_mirror_count}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                onClick={() => setRefreshTick((tick) => tick + 1)}
                className="text-xs px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  clearTrackedEvents();
                  setStatusMessage('Analytics events cleared.');
                  setRefreshTick((tick) => tick + 1);
                }}
                className="text-xs px-2 py-1 rounded-md bg-rose-700 hover:bg-rose-600"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCopy(exportTrackedEvents('json'), 'Events JSON')}
                className="text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
              >
                Copy events JSON
              </button>
              <button
                onClick={() => handleCopy(exportTrackedEvents('csv'), 'Events CSV')}
                className="text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
              >
                Copy events CSV
              </button>
              <button
                onClick={() => handleDownload('chromacloset-analytics-session.json', exportAnalyticsSessionBundle('json'), 'application/json', 'Session JSON')}
                className="text-xs px-2 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600"
              >
                Download session JSON
              </button>
              <button
                onClick={() => handleDownload('chromacloset-analytics-session.csv', exportAnalyticsSessionBundle('csv'), 'text/csv;charset=utf-8', 'Session CSV')}
                className="text-xs px-2 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600"
              >
                Download session CSV
              </button>
            </div>

            {statusMessage && (
              <p className="text-[10px] text-slate-400">{statusMessage}</p>
            )}
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
            <button
              onClick={() => handleExport('json')}
              className="text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
            >
              Copy JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
            >
              Copy CSV
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
          setRefreshTick((tick) => tick + 1);
          setIsOpen((value) => !value);
        }}
        className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg hover:bg-black"
      >
        {isOpen ? 'Hide Analytics' : 'Analytics'}
      </button>
    </div>
  );
};
