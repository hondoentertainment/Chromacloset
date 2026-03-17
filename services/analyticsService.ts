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
    reason: 'processing_error' | 'capture_error';
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
  outfits_generation_failed: { reason: 'service_error'; persona: string; occasion: string };
  outfit_saved: { outfit_id: string };
  outfit_unsaved: { outfit_id: string };
  outfit_feedback_given: { outfit_id: string; feedback: 'love' | 'skip'; source: 'curator' | 'lookbook' };
  stylist_chat_opened: { persona: string };
  stylist_chat_message_sent: { persona: string; message_length: number };
  chat_failed: { reason: 'send_error'; persona: string };
  dashboard_gap_suggestion_requested: { inventory_size: number };
  dashboard_gap_suggestion_generated: {
    item_type: string;
    suggested_color: string;
    priority: 'high' | 'medium' | 'low';
  };
  dashboard_gap_suggestion_failed: { reason: 'no_gap' | 'service_error' };
};

export type AnalyticsEventName = keyof AnalyticsEventPayloadMap;

type StoredPayload<T extends AnalyticsEventName> = AnalyticsEventPayloadMap[T] & { schema_version: number };

export interface AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> {
  name: T;
  timestamp: string;
  payload: StoredPayload<T>;
}

const EVENT_STORAGE_KEY = 'chromacloset_analytics_events';
const MAX_EVENTS = 200;
const SCHEMA_VERSION = 1;

const canUseStorage = (): boolean => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const trackEvent = <T extends AnalyticsEventName>(name: T, payload: AnalyticsEventPayloadMap[T]) => {
  const event: AnalyticsEvent<T> = {
    name,
    payload: {
      ...payload,
      schema_version: SCHEMA_VERSION,
    },
    timestamp: new Date().toISOString(),
  };

  if (canUseStorage()) {
    try {
      const raw = localStorage.getItem(EVENT_STORAGE_KEY);
      const existing: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
      const next = [event, ...existing].slice(0, MAX_EVENTS);
      localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('Analytics storage unavailable', error);
    }
  }

  console.info('[analytics]', event);
};

export const getTrackedEvents = (): AnalyticsEvent[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(EVENT_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as AnalyticsEvent[] : [];
  } catch {
    return [];
  }
};

export const clearTrackedEvents = () => {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(EVENT_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear analytics events', error);
  }
};
