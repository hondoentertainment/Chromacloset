import type { AnalyticsEventPayloadMap } from './analyticsService';

export type ScanFailureReason = AnalyticsEventPayloadMap['scan_failed']['reason'];
export type ScanFailureSource = AnalyticsEventPayloadMap['scan_failed']['source'];
export type ScanFailureMode = AnalyticsEventPayloadMap['scan_failed']['mode'];
export type OutfitGenerationFailureReason = AnalyticsEventPayloadMap['outfits_generation_failed']['reason'];
export type ChatFailureReason = AnalyticsEventPayloadMap['chat_failed']['reason'];

export const SCAN_FAILURE_REASONS: readonly ScanFailureReason[] = [
  'processing_error',
  'capture_error',
  'empty_result',
  'validation_error',
] as const;

export const OUTFIT_GENERATION_FAILURE_REASONS: readonly OutfitGenerationFailureReason[] = [
  'service_error',
  'empty_result',
  'insufficient_inventory',
  'timeout',
] as const;

export const CHAT_FAILURE_REASONS: readonly ChatFailureReason[] = [
  'send_error',
  'session_unavailable',
] as const;

const assertNever = (value: never): never => {
  throw new Error(`Unhandled failure reason: ${String(value)}`);
};

export const getScanFailureMessage = (
  reason: ScanFailureReason,
  source: ScanFailureSource,
  mode: ScanFailureMode,
): string => {
  switch (reason) {
    case 'validation_error':
      return 'Please provide both subcategory and color name for all items before saving.';
    case 'capture_error':
      return source === 'live'
        ? 'Camera capture failed. Please retry.'
        : 'Upload capture failed. Please retry.';
    case 'empty_result':
      if (mode === 'qr') {
        return source === 'live'
          ? 'No tag data was detected. Reposition the code in frame and retry.'
          : 'We could not read that tag. Try centering the code or upload a sharper image.';
      }
      return source === 'live'
        ? 'No wardrobe items were found. Step back slightly and retry with better lighting.'
        : 'No items were confidently detected. Try a brighter image or adjust the framing.';
    case 'processing_error':
      return source === 'live'
        ? 'Live scan failed. Ensure subject is well lit and retry.'
        : 'Upload scan failed. Try a clearer image or retry.';
    default:
      return assertNever(reason);
  }
};

export const getOutfitGenerationFailureMessage = (reason: OutfitGenerationFailureReason): string => {
  switch (reason) {
    case 'insufficient_inventory':
      return 'Add at least one top and one bottom before generating outfits.';
    case 'empty_result':
      return 'We could not build a complete look from the current inventory. Try a new occasion or add more staples.';
    case 'timeout':
      return 'Outfit generation timed out. Retry now or simplify the request.';
    case 'service_error':
      return 'We could not generate outfits right now. Please retry.';
    default:
      return assertNever(reason);
  }
};

export const getChatFailureMessage = (reason: ChatFailureReason): string => {
  switch (reason) {
    case 'send_error':
      return 'Message failed to send. Please retry in a moment.';
    case 'session_unavailable':
      return 'The style consultant is not ready yet. Reinitialize chat to retry.';
    default:
      return assertNever(reason);
  }
};
