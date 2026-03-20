import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductionReadinessSnapshot,
  buildSyncReadinessSummary,
  buildWeeklyPlannerPreview,
  detectDuplicateCandidates,
  prioritizeClosetGaps,
} from '../../services/productionReadinessService.js';
import { Category, PatternType, type OutfitRecommendation, type ScanResult, type WardrobeItem } from '../../types.js';

const item = (id: string, category: Category, colorFamily: string, subcategory: string): WardrobeItem => ({
  id,
  category,
  subcategory,
  brand: 'Test',
  imageUrl: 'image',
  dominantColorHex: '#000000',
  paletteHex: ['#000000'],
  colorFamily,
  colorName: colorFamily,
  patternType: PatternType.SOLID,
  confidence: 1,
  createdAt: 1,
});

const items = [
  item('1', Category.TOP, 'Blue', 'shirt'),
  item('2', Category.TOP, 'Blue', 'shirt'),
  item('3', Category.BOTTOM, 'Black', 'trouser'),
];

const savedOutfits: OutfitRecommendation[] = [{
  id: 'look-1',
  title: 'Monday Look',
  description: 'desc',
  stylistTip: 'tip',
  itemIds: ['1', '3'],
  occasion: 'Business Meeting',
  styleVibe: 'Minimalist',
  outfitFeedback: 'love',
}];

const scans: ScanResult[] = [{ items, timestamp: 1 }];

test('detectDuplicateCandidates finds likely duplicate items', () => {
  const duplicates = detectDuplicateCandidates(items);
  assert.equal(duplicates.length, 1);
  assert.match(duplicates[0].reason, /appears more than once/i);
});

test('buildWeeklyPlannerPreview fills planner slots from saved outfits', () => {
  const planner = buildWeeklyPlannerPreview(savedOutfits);
  assert.equal(planner.length, 5);
  assert.equal(planner[0].title, 'Monday Look');
  assert.equal(planner[4].title, 'Planner slot open');
});

test('prioritizeClosetGaps surfaces highest-need category first', () => {
  const gaps = prioritizeClosetGaps(items);
  assert.equal(gaps[0].priority, 'high');
  assert.match(gaps[0].reasoning, /unlocks more outfit combinations/i);
});

test('buildSyncReadinessSummary scores completeness across major datasets', () => {
  const summary = buildSyncReadinessSummary(items, scans, savedOutfits);
  assert.equal(summary.syncReadinessScore, 100);
});

test('buildProductionReadinessSnapshot assembles five agent cards', () => {
  const snapshot = buildProductionReadinessSnapshot(items, scans, savedOutfits);
  assert.equal(snapshot.agentCards.length, 5);
  assert.equal(snapshot.agentCards[0].id, 'ingestion');
  assert.equal(snapshot.weeklyPlan.length, 5);
});
