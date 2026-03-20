import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANALYTICS_SCHEMA_VERSION,
  buildAnalyticsEvent,
  buildAnalyticsSessionBundle,
  createAnalyticsTransports,
  formatAnalyticsEventsAsCsv,
  formatAnalyticsSessionBundleAsCsv,
  hydrateAnalyticsEvents,
} from '../../services/analyticsService.js';

test('hydrateAnalyticsEvents keeps only valid events', () => {
  const raw = JSON.stringify([
    buildAnalyticsEvent('app_opened', { source: 'browser' }),
    { nope: true },
    { name: 'scan_started', timestamp: '2025-01-01T00:00:00.000Z', payload: {} },
  ]);

  const events = hydrateAnalyticsEvents(raw);
  assert.equal(events.length, 1);
  assert.equal(events[0].payload.schema_version, ANALYTICS_SCHEMA_VERSION);
});

test('hydrateAnalyticsEvents returns empty arrays for malformed payloads', () => {
  assert.deepEqual(hydrateAnalyticsEvents('{bad json'), []);
  assert.deepEqual(hydrateAnalyticsEvents(JSON.stringify({ nope: true })), []);
});

test('formatAnalyticsEventsAsCsv escapes embedded payload quotes', () => {
  const event = buildAnalyticsEvent('scan_failed', {
    source: 'upload',
    mode: 'cloth',
    reason: 'processing_error',
  });

  const csv = formatAnalyticsEventsAsCsv([event]);
  assert.match(csv, /timestamp,name,schema_version,payload/);
  assert.match(csv, /scan_failed/);
  assert.match(csv, /""reason"":""processing_error""/);
});

test('buildAnalyticsSessionBundle reports parity against remote mirror events', () => {
  const events = [
    buildAnalyticsEvent('app_opened', { source: 'browser' }),
    buildAnalyticsEvent('tab_switched', { to_tab: 'scan' }),
  ];
  const remoteMirror = [events[0]];

  const bundle = buildAnalyticsSessionBundle(events, remoteMirror);
  assert.equal(bundle.summary.event_count, 2);
  assert.equal(bundle.summary.transports.local_count, 2);
  assert.equal(bundle.summary.transports.remote_mirror_count, 1);
});

test('formatAnalyticsSessionBundleAsCsv includes summary and transport parity rows', () => {
  const events = [buildAnalyticsEvent('app_opened', { source: 'browser' })];
  const bundle = buildAnalyticsSessionBundle(events, events);

  const csv = formatAnalyticsSessionBundleAsCsv(bundle);
  assert.match(csv, /# analytics_session_summary/);
  assert.match(csv, /# local_events/);
  assert.match(csv, /# remote_mirror_events/);
});

test('createAnalyticsTransports always includes local storage transport metadata', () => {
  const transports = createAnalyticsTransports();
  assert.ok(transports.some((transport) => transport.name === 'local_storage'));
  assert.ok(transports.some((transport) => transport.name === 'remote_http'));
});
