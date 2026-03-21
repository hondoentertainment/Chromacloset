import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOutfits } from '../../services/stylistLogic.js';
import { STYLIST_EVALUATION_FIXTURES } from '../../services/agentEvaluationFixtures.js';
import { getActiveStylistProfile } from '../../services/stylistService.js';
import { Category, PatternType, type WardrobeItem, type OutfitRecommendation } from '../../types.js';

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

test('normalizeOutfits drops invalid/duplicate outfits and ranks valid results', () => {
  const items = [
    item('top-1', Category.TOP, 'Blue', 'shirt'),
    item('bottom-1', Category.BOTTOM, 'Black', 'trouser'),
    item('outer-1', Category.OUTERWEAR, 'Gray', 'coat'),
    item('shoe-1', Category.SHOES, 'Black', 'loafer'),
  ];

  const raw: OutfitRecommendation[] = [
    {
      id: 'best',
      title: 'Best',
      description: 'Valid rain look',
      stylistTip: 'Tip',
      itemIds: ['top-1', 'bottom-1', 'outer-1', 'shoe-1'],
      occasion: 'Work',
      styleVibe: 'Minimalist',
    },
    {
      id: 'dup',
      title: 'Duplicate',
      description: 'Duplicate item mix',
      stylistTip: 'Tip',
      itemIds: ['shoe-1', 'outer-1', 'bottom-1', 'top-1'],
      occasion: 'Work',
      styleVibe: 'Minimalist',
    },
    {
      id: 'invalid',
      title: 'Invalid',
      description: 'Missing bottom',
      stylistTip: 'Tip',
      itemIds: ['top-1'],
      occasion: 'Work',
      styleVibe: 'Minimalist',
    },
  ];

  const normalized = normalizeOutfits(raw, items, 'cold rain');
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].id, 'best');
  assert.equal(normalized[0].weatherFocus, 'rain');
  assert.ok((normalized[0].score ?? 0) > 0);
});

test('normalizeOutfits suppresses near-duplicate outfits that reuse the same core pieces', () => {
  const items = [
    item('top-1', Category.TOP, 'Blue', 'shirt'),
    item('bottom-1', Category.BOTTOM, 'Black', 'trouser'),
    item('outer-1', Category.OUTERWEAR, 'Gray', 'coat'),
    item('outer-2', Category.OUTERWEAR, 'Camel', 'jacket'),
    item('shoe-1', Category.SHOES, 'Black', 'loafer'),
  ];

  const raw: OutfitRecommendation[] = [
    {
      id: 'with-coat',
      title: 'With coat',
      description: 'Same base look with coat',
      stylistTip: 'Tip',
      itemIds: ['top-1', 'bottom-1', 'outer-1', 'shoe-1'],
      occasion: 'Work',
      styleVibe: 'Minimalist',
    },
    {
      id: 'with-jacket',
      title: 'With jacket',
      description: 'Same base look with jacket',
      stylistTip: 'Tip',
      itemIds: ['top-1', 'bottom-1', 'outer-2', 'shoe-1'],
      occasion: 'Work',
      styleVibe: 'Minimalist',
    },
  ];

  const normalized = normalizeOutfits(raw, items, 'cold');
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].id, 'with-coat');
});

test('stylist evaluation fixtures stay stable across normalization checks', () => {
  for (const fixture of STYLIST_EVALUATION_FIXTURES) {
    const normalized = normalizeOutfits(fixture.rawOutfits, fixture.items, fixture.weather);
    assert.equal(normalized.length, fixture.expectedValidOutfitCount, fixture.id);
  }
});

test('active stylist profile exposes versioned prompt and fallback metadata', () => {
  const profile = getActiveStylistProfile('Balanced');
  assert.match(profile.promptVersion, /stylist-outfits-v/);
  assert.match(profile.chatPromptVersion, /stylist-chat-v/);
  assert.equal(profile.fallbackStrategy, 'deterministic_capsule_builder');
  assert.ok(profile.timeoutMs > 0);
});
