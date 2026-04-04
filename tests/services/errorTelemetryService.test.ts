import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
