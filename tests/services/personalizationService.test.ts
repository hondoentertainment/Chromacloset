import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPreferenceMemory, getStyleBriefSuggestion, rerankOutfitsWithPreferences } from '../../services/personalizationService.js';
import { Category, PatternType, type OutfitRecommendation, type WardrobeItem } from '../../types.js';

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
  item('top-blue', Category.TOP, 'Blue', 'shirt'),
  item('bottom-black', Category.BOTTOM, 'Black', 'trouser'),
  item('top-red', Category.TOP, 'Red', 'blouse'),
  item('bottom-neutral', Category.BOTTOM, 'Neutral', 'skirt'),
];

const savedOutfits: OutfitRecommendation[] = [
  {
    id: 'saved-1',
    title: 'Loved work look',
    description: 'desc',
    stylistTip: 'tip',
    itemIds: ['top-blue', 'bottom-black'],
    occasion: 'Business Meeting',
    styleVibe: 'Minimalist',
    weatherFocus: 'cold',
    outfitFeedback: 'love',
  },
  {
    id: 'saved-2',
    title: 'Skipped look',
    description: 'desc',
    stylistTip: 'tip',
    itemIds: ['top-red', 'bottom-neutral'],
    occasion: 'Date Night',
    styleVibe: 'Bold & Eclectic',
    weatherFocus: 'warm',
    outfitFeedback: 'skip',
  },
];

test('buildPreferenceMemory derives top colors, categories, and brief preferences', () => {
  const memory = buildPreferenceMemory(savedOutfits, items);
  assert.deepEqual(memory.topColorFamilies.slice(0, 2), ['Blue', 'Black']);
  assert.equal(memory.favoritePersona, 'Minimalist');
  assert.equal(memory.favoriteOccasion, 'Business Meeting');
  assert.equal(memory.favoriteWeatherFocus, 'cold');
  assert.equal(memory.lovedOutfitCount, 1);
  assert.equal(memory.skippedOutfitCount, 1);
});

test('rerankOutfitsWithPreferences boosts outfits that match learned preferences', () => {
  const candidates: OutfitRecommendation[] = [
    {
      id: 'candidate-match',
      title: 'Match',
      description: 'desc',
      stylistTip: 'tip',
      itemIds: ['top-blue', 'bottom-black'],
      occasion: 'Business Meeting',
      styleVibe: 'Minimalist',
      weatherFocus: 'cold',
      score: 1,
      generationSource: 'model',
    },
    {
      id: 'candidate-other',
      title: 'Other',
      description: 'desc',
      stylistTip: 'tip',
      itemIds: ['top-red', 'bottom-neutral'],
      occasion: 'Date Night',
      styleVibe: 'Bold & Eclectic',
      weatherFocus: 'warm',
      score: 5,
      generationSource: 'model',
    },
  ];

  const ranked = rerankOutfitsWithPreferences(candidates, savedOutfits, items, {
    persona: 'Minimalist',
    occasion: 'Business Meeting',
    weather: 'cold weather',
  });

  assert.equal(ranked[0].id, 'candidate-match');
  assert.match(ranked[0].recommendedBecause ?? '', /because you consistently like/i);
  assert.ok((ranked[0].personalizationScore ?? 0) > (ranked[1].personalizationScore ?? 0));
});

test('getStyleBriefSuggestion reflects the strongest learned brief', () => {
  const suggestion = getStyleBriefSuggestion(buildPreferenceMemory(savedOutfits, items));
  assert.equal(suggestion.persona, 'Minimalist');
  assert.equal(suggestion.occasion, 'Business Meeting');
  assert.equal(suggestion.weather, 'cold weather');
});
