import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEditToItem, applyFieldToSimilarItems, buildScanReviewSummary, createBaselineItems, resetItemToBaseline, sortScanReviewItems } from '../../services/scanReviewService.js';
import { applyEditToItem, applyFieldToSimilarItems, createBaselineItems, resetItemToBaseline } from '../../services/scanReviewService.js';
import { Category, PatternType, type WardrobeItem } from '../../types.js';

const item = (id: string, subcategory: string, colorName = 'Navy'): WardrobeItem => ({
  id,
  category: Category.TOP,
  subcategory,
  brand: 'Test',
  imageUrl: 'image',
  dominantColorHex: '#000000',
  paletteHex: ['#000000'],
  colorFamily: 'Blue',
  colorName,
  patternType: PatternType.SOLID,
  confidence: 1,
  createdAt: 1,
});

test('applyEditToItem marks edits and resetItemToBaseline restores original values', () => {
  const original = item('1', 'shirt');
  const baseline = createBaselineItems([original])['1'];

  const edited = applyEditToItem(original, 'colorName', 'Sky Blue', baseline);
  assert.equal(edited.isEdited, true);
  assert.equal(edited.colorName, 'Sky Blue');

  const reset = resetItemToBaseline(edited, baseline);
  assert.equal(reset.isEdited, false);
  assert.equal(reset.colorName, 'Navy');
});

test('applyFieldToSimilarItems updates only matching subcategories', () => {
  const first = item('1', 'shirt');
  const similar = item('2', 'shirt', 'Blue');
  const different = item('3', 'hoodie', 'Green');
  const items = [first, similar, different];
  const baselines = createBaselineItems(items);

  const updated = applyFieldToSimilarItems(items, '1', 'colorFamily', 'Neutral', baselines);
  assert.equal(updated.find((entry) => entry.id === '2')?.colorFamily, 'Neutral');
  assert.equal(updated.find((entry) => entry.id === '2')?.isEdited, true);
  assert.equal(updated.find((entry) => entry.id === '3')?.colorFamily, 'Blue');
});

test('sortScanReviewItems prioritizes incomplete and low-confidence items first', () => {
  const completeHighConfidence = item('1', 'shirt');
  const lowConfidence = { ...item('2', 'shirt', 'Blue'), confidence: 0.62 };
  const missingMetadata = { ...item('3', '', '   '), confidence: 0.91 };

  const ordered = sortScanReviewItems([completeHighConfidence, lowConfidence, missingMetadata]);
  assert.deepEqual(ordered.map((entry) => entry.id), ['3', '2', '1']);
});

test('buildScanReviewSummary reports queue health details', () => {
  const edited = { ...item('1', 'shirt'), isEdited: true };
  const lowConfidence = { ...item('2', 'trouser', 'Black'), confidence: 0.55 };
  const missingMetadata = { ...item('3', '', ' '), confidence: 0.95 };

  const summary = buildScanReviewSummary([edited, lowConfidence, missingMetadata]);
  assert.equal(summary.totalItems, 3);
  assert.equal(summary.lowConfidenceCount, 1);
  assert.equal(summary.editedCount, 1);
  assert.equal(summary.missingCoreMetadataCount, 1);
  assert.equal(summary.averageConfidence, 83);
});
