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
  stylist_chat_opened: { persona: string };
  stylist_chat_message_sent: { persona: string; message_length: number };
  chat_failed: { reason: 'send_error'; persona: string };
};

export type AnalyticsEventName = keyof AnalyticsEventPayloadMap;

export interface AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> {
  name: T;
  timestamp: string;
  payload: AnalyticsEventPayloadMap[T];
}

const EVENT_STORAGE_KEY = 'chromacloset_analytics_events';
const MAX_EVENTS = 200;

const canUseStorage = (): boolean => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const trackEvent = <T extends AnalyticsEventName>(name: T, payload: AnalyticsEventPayloadMap[T]) => {
  const event: AnalyticsEvent<T> = {
    name,
    payload,
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
