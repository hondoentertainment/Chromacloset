import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_FAILURE_REASONS,
  OUTFIT_GENERATION_FAILURE_REASONS,
  SCAN_FAILURE_REASONS,
  getChatFailureMessage,
  getOutfitGenerationFailureMessage,
  getScanFailureMessage,
} from '../../services/errorTelemetryService.js';

test('getScanFailureMessage maps empty-result failures by mode/source', () => {
  assert.equal(
    getScanFailureMessage('empty_result', 'upload', 'cloth'),
    'No items were confidently detected. Try a brighter image or adjust the framing.',
  );
  assert.equal(
    getScanFailureMessage('empty_result', 'live', 'qr'),
    'No tag data was detected. Reposition the code in frame and retry.',
  );
});

test('getOutfitGenerationFailureMessage maps all reason buckets', () => {
  assert.equal(
    getOutfitGenerationFailureMessage('insufficient_inventory'),
    'Add at least one top and one bottom before generating outfits.',
  );
  assert.equal(
    getOutfitGenerationFailureMessage('timeout'),
    'Outfit generation timed out. Retry now or simplify the request.',
  );
});

test('getChatFailureMessage maps chat failure reason buckets', () => {
  assert.equal(
    getChatFailureMessage('session_unavailable'),
    'The style consultant is not ready yet. Reinitialize chat to retry.',
  );
  assert.equal(
    getChatFailureMessage('send_error'),
    'Message failed to send. Please retry in a moment.',
  );
});

test('all scan failure reasons map to non-empty user messages', () => {
  const sources = ['upload', 'live'] as const;
  const modes = ['cloth', 'qr'] as const;

  for (const reason of SCAN_FAILURE_REASONS) {
    for (const source of sources) {
      for (const mode of modes) {
        assert.ok(getScanFailureMessage(reason, source, mode).trim().length > 0);
      }
    }
  }
});

test('all outfit generation failure reasons map to non-empty user messages', () => {
  for (const reason of OUTFIT_GENERATION_FAILURE_REASONS) {
    assert.ok(getOutfitGenerationFailureMessage(reason).trim().length > 0);
  }
});

test('all chat failure reasons map to non-empty user messages', () => {
  for (const reason of CHAT_FAILURE_REASONS) {
    assert.ok(getChatFailureMessage(reason).trim().length > 0);
  }
});
