import { getRuntimeEnv, isRemoteAnalyticsEnabledFromEnv } from './runtimeConfig.js';
export type AnalyticsEventPayloadMap = {
  app_opened: { source: 'browser' };
  tab_switched: { to_tab: 'dashboard' | 'scan' | 'explorer' | 'stylist' };
  scan_started: { source: 'upload' | 'live'; mode: 'cloth' | 'qr' };
  scan_completed: {
    source: 'upload' | 'live';
    mode: 'cloth' | 'qr';
    items_detected: number;
    latency_ms: number;
  };
  scan_failed: {
    source: 'upload' | 'live';
    mode: 'cloth' | 'qr';
    reason: 'processing_error' | 'capture_error' | 'empty_result' | 'validation_error';
  };
  scan_item_edited: {
    item_id: string;
    fields: Array<'category' | 'patternType' | 'subcategory' | 'colorName' | 'colorFamily'>;
  };
  scan_deleted: { items_removed: number };
  closet_reset: { items_before_reset: number; scans_before_reset: number };
  outfits_requested: {
    occasion: string;
    persona: string;
    weather_present: boolean;
    inventory_size: number;
  };
  outfits_generated: { count: number };
  outfits_generation_failed: {
    reason: 'service_error' | 'empty_result' | 'insufficient_inventory' | 'timeout';
    persona: string;
    occasion: string;
  };
  outfit_saved: { outfit_id: string };
  outfit_unsaved: { outfit_id: string };
  outfit_feedback_given: { outfit_id: string; feedback: 'love' | 'skip'; source: 'curator' | 'lookbook' };
  stylist_chat_opened: { persona: string };
  stylist_chat_message_sent: { persona: string; message_length: number };
  chat_failed: { reason: 'send_error' | 'session_unavailable'; persona: string };
  dashboard_gap_suggestion_requested: { inventory_size: number };
  dashboard_gap_suggestion_generated: {
    item_type: string;
    suggested_color: string;
    priority: 'high' | 'medium' | 'low';
  };
  dashboard_gap_suggestion_failed: { reason: 'no_gap' | 'service_error' };
};

export type AnalyticsEventName = keyof AnalyticsEventPayloadMap;
export const ANALYTICS_SCHEMA_VERSION = 1;
export const EVENT_STORAGE_KEY = 'chromacloset_analytics_events';
export const REMOTE_MIRROR_STORAGE_KEY = 'chromacloset_analytics_remote_mirror';
export const ANALYTICS_SESSION_ID_STORAGE_KEY = 'chromacloset_analytics_session_id';
const MAX_EVENTS = 200;

type StoredPayload<T extends AnalyticsEventName> = AnalyticsEventPayloadMap[T] & { schema_version: number };

export interface AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> {
  name: T;
  timestamp: string;
  payload: StoredPayload<T>;
}

export interface AnalyticsSessionSummary {
  session_id: string;
  started_at: string | null;
  ended_at: string | null;
  event_count: number;
  event_names: AnalyticsEventName[];
  transports: {
    local_count: number;
    remote_mirror_count: number;
    remote_enabled: boolean;
    parity_status: 'unavailable' | 'matched' | 'mismatch';
  };
}

export interface AnalyticsSessionBundle {
  summary: AnalyticsSessionSummary;
  events: AnalyticsEvent[];
  remoteMirrorEvents: AnalyticsEvent[];
}

export interface AnalyticsTransport {
  name: 'local_storage' | 'remote_http';
  enabled: boolean;
  send: (event: AnalyticsEvent) => void | Promise<void>;
}

const canUseStorage = (): boolean => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const isAnalyticsEvent = (value: unknown): value is AnalyticsEvent => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AnalyticsEvent>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.timestamp === 'string' &&
    !!candidate.payload &&
    typeof candidate.payload === 'object' &&
    typeof (candidate.payload as { schema_version?: unknown }).schema_version === 'number'
  );
};

export const hydrateAnalyticsEvents = (raw: string | null): AnalyticsEvent[] => {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAnalyticsEvent);
  } catch {
    return [];
  }
};

const writeStoredEvents = (storageKey: string, events: AnalyticsEvent[]) => {
  if (!canUseStorage()) return;
  localStorage.setItem(storageKey, JSON.stringify(events.slice(0, MAX_EVENTS)));
};

const readStoredEvents = (storageKey: string): AnalyticsEvent[] => {
  if (!canUseStorage()) return [];
  return hydrateAnalyticsEvents(localStorage.getItem(storageKey));
};

export const formatAnalyticsEventsAsCsv = (events: AnalyticsEvent[]): string => {
  const headers = ['timestamp', 'name', 'schema_version', 'payload'];
  const rows = events.map((event) => {
    const schemaVersion = event.payload?.schema_version ?? '';
    const payload = JSON.stringify(event.payload).replace(/"/g, '""');
    return `"${event.timestamp}","${event.name}","${schemaVersion}","${payload}"`;
  });

  return [headers.join(','), ...rows].join('\n');
};

export const formatAnalyticsSessionBundleAsCsv = (bundle: AnalyticsSessionBundle): string => {
  const summaryHeaders = ['session_id', 'started_at', 'ended_at', 'event_count', 'local_count', 'remote_mirror_count', 'remote_enabled', 'parity_status'];
  const summaryRow = [
    bundle.summary.session_id,
    bundle.summary.started_at ?? '',
    bundle.summary.ended_at ?? '',
    bundle.summary.event_count,
    bundle.summary.transports.local_count,
    bundle.summary.transports.remote_mirror_count,
    bundle.summary.transports.remote_enabled,
    bundle.summary.transports.parity_status,
  ].join(',');

  return [
    '# analytics_session_summary',
    summaryHeaders.join(','),
    summaryRow,
    '',
    '# local_events',
    formatAnalyticsEventsAsCsv(bundle.events),
    '',
    '# remote_mirror_events',
    formatAnalyticsEventsAsCsv(bundle.remoteMirrorEvents),
  ].join('\n');
};

export const buildAnalyticsEvent = <T extends AnalyticsEventName>(name: T, payload: AnalyticsEventPayloadMap[T]): AnalyticsEvent<T> => ({
  name,
  payload: {
    ...payload,
    schema_version: ANALYTICS_SCHEMA_VERSION,
  },
  timestamp: new Date().toISOString(),
});

export const getAnalyticsSessionId = (): string => {
  if (!canUseStorage()) return 'serverless-session';

  const existing = localStorage.getItem(ANALYTICS_SESSION_ID_STORAGE_KEY);
  if (existing) return existing;

  const created = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(ANALYTICS_SESSION_ID_STORAGE_KEY, created);
  return created;
};

const appendStoredEvent = (storageKey: string, event: AnalyticsEvent) => {
  const existing = readStoredEvents(storageKey);
  writeStoredEvents(storageKey, [event, ...existing]);
};

export const isRemoteAnalyticsEnabled = (): boolean => isRemoteAnalyticsEnabledFromEnv();

export const createAnalyticsTransports = (): AnalyticsTransport[] => {
  const transports: AnalyticsTransport[] = [
    {
      name: 'local_storage',
      enabled: canUseStorage(),
      send: (event) => {
        appendStoredEvent(EVENT_STORAGE_KEY, event);
      },
    },
  ];

  const endpoint = getRuntimeEnv('VITE_ANALYTICS_REMOTE_ENDPOINT');
  const remoteEnabled = isRemoteAnalyticsEnabled() && Boolean(endpoint);

  transports.push({
    name: 'remote_http',
    enabled: remoteEnabled,
    send: async (event) => {
      if (!remoteEnabled || !endpoint) return;

      appendStoredEvent(REMOTE_MIRROR_STORAGE_KEY, event);

      if (typeof fetch !== 'function') return;

      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Chromacloset-Session': getAnalyticsSessionId(),
          },
          body: JSON.stringify(event),
        });
      } catch (error) {
        console.warn('Remote analytics transport failed', error);
      }
    },
  });

  return transports;
};

export const trackEvent = <T extends AnalyticsEventName>(name: T, payload: AnalyticsEventPayloadMap[T]) => {
  const event = buildAnalyticsEvent(name, payload);

  try {
    for (const transport of createAnalyticsTransports()) {
      if (!transport.enabled) continue;
      void transport.send(event);
    }
  } catch (error) {
    console.warn('Analytics transport unavailable', error);
  }

  console.info('[analytics]', event);
};

export const getTrackedEvents = (): AnalyticsEvent[] => readStoredEvents(EVENT_STORAGE_KEY);

export const getRemoteMirrorEvents = (): AnalyticsEvent[] => readStoredEvents(REMOTE_MIRROR_STORAGE_KEY);

export const buildAnalyticsSessionBundle = (
  events: AnalyticsEvent[] = getTrackedEvents(),
  remoteMirrorEvents: AnalyticsEvent[] = getRemoteMirrorEvents(),
): AnalyticsSessionBundle => {
  const timestamps = events.map((event) => event.timestamp).sort();
  const session_id = getAnalyticsSessionId();
  const remote_enabled = isRemoteAnalyticsEnabled();
  const local_count = events.length;
  const remote_mirror_count = remoteMirrorEvents.length;
  const parity_status = !remote_enabled
    ? 'unavailable'
    : local_count === remote_mirror_count
      ? 'matched'
      : 'mismatch';

  return {
    summary: {
      session_id,
      started_at: timestamps[0] ?? null,
      ended_at: timestamps.at(-1) ?? null,
      event_count: events.length,
      event_names: Array.from(new Set(events.map((event) => event.name))) as AnalyticsEventName[],
      transports: {
        local_count,
        remote_mirror_count,
        remote_enabled,
        parity_status,
      },
    },
    events,
    remoteMirrorEvents,
  };
};

export const exportTrackedEvents = (format: 'json' | 'csv' = 'json'): string => {
  const events = getTrackedEvents();
  return format === 'json' ? JSON.stringify(events, null, 2) : formatAnalyticsEventsAsCsv(events);
};

export const exportAnalyticsSessionBundle = (format: 'json' | 'csv' = 'json'): string => {
  const bundle = buildAnalyticsSessionBundle();
  return format === 'json' ? JSON.stringify(bundle, null, 2) : formatAnalyticsSessionBundleAsCsv(bundle);
};

export const clearTrackedEvents = () => {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(EVENT_STORAGE_KEY);
    localStorage.removeItem(REMOTE_MIRROR_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear analytics events', error);
  }
};
