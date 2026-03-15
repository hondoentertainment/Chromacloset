export type AnalyticsEventName =
  | 'app_opened'
  | 'tab_switched'
  | 'scan_started'
  | 'scan_completed'
  | 'scan_deleted'
  | 'closet_reset'
  | 'outfits_requested'
  | 'outfits_generated'
  | 'outfit_saved'
  | 'outfit_unsaved'
  | 'stylist_chat_opened'
  | 'stylist_chat_message_sent';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  timestamp: string;
  payload?: Record<string, unknown>;
}

const EVENT_STORAGE_KEY = 'chromacloset_analytics_events';
const MAX_EVENTS = 200;

export const trackEvent = (name: AnalyticsEventName, payload?: Record<string, unknown>) => {
  const event: AnalyticsEvent = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(EVENT_STORAGE_KEY);
    const existing: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    const next = [event, ...existing].slice(0, MAX_EVENTS);
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Analytics storage unavailable', error);
  }

  // Keep a debug trail during local development.
  console.info('[analytics]', event);
};
