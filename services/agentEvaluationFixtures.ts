import { Category, PatternType, type OutfitRecommendation, type WardrobeItem } from '../types.js';

const createItem = (id: string, category: Category, subcategory: string, colorFamily: string): WardrobeItem => ({
  id,
  category,
  subcategory,
  brand: 'Fixture',
  imageUrl: 'fixture',
  dominantColorHex: '#000000',
  paletteHex: ['#000000'],
  colorFamily,
  colorName: colorFamily,
  patternType: PatternType.SOLID,
  confidence: 1,
  createdAt: 1,
});

export const STYLIST_EVALUATION_FIXTURES: Array<{
  id: 'good_outfit' | 'bad_outfit' | 'scan_correction_needed';
  description: string;
  items: WardrobeItem[];
  rawOutfits: OutfitRecommendation[];
  weather?: string;
  expectedValidOutfitCount: number;
}> = [
  {
    id: 'good_outfit',
    description: 'A valid wardrobe mix with top, bottom, and supportive layers should survive normalization.',
    items: [
      createItem('top-1', Category.TOP, 'shirt', 'Blue'),
      createItem('bottom-1', Category.BOTTOM, 'trouser', 'Black'),
      createItem('shoe-1', Category.SHOES, 'loafer', 'Black'),
    ],
    rawOutfits: [{
      id: 'fixture-good',
      title: 'Good look',
      description: 'A balanced outfit',
      stylistTip: 'Tip',
      itemIds: ['top-1', 'bottom-1', 'shoe-1'],
      occasion: 'Work',
      styleVibe: 'Minimalist',
    }],
    weather: 'mild',
    expectedValidOutfitCount: 1,
  },
  {
    id: 'bad_outfit',
    description: 'A look missing a bottom should be rejected.',
    items: [
      createItem('top-2', Category.TOP, 'tee', 'White'),
      createItem('shoe-2', Category.SHOES, 'sneaker', 'White'),
    ],
    rawOutfits: [{
      id: 'fixture-bad',
      title: 'Bad look',
      description: 'Missing a bottom',
      stylistTip: 'Tip',
      itemIds: ['top-2', 'shoe-2'],
      occasion: 'Weekend',
      styleVibe: 'Streetwear',
    }],
    weather: 'warm',
    expectedValidOutfitCount: 0,
  },
  {
    id: 'scan_correction_needed',
    description: 'A duplicated/raw noisy outfit should collapse to one valid normalized result.',
    items: [
      createItem('top-3', Category.TOP, 'blouse', 'Green'),
      createItem('bottom-3', Category.BOTTOM, 'skirt', 'Neutral'),
      createItem('outer-3', Category.OUTERWEAR, 'coat', 'Camel'),
    ],
    rawOutfits: [
      {
        id: 'fixture-dup-a',
        title: 'Look A',
        description: 'Duplicate one',
        stylistTip: 'Tip',
        itemIds: ['top-3', 'bottom-3', 'outer-3'],
        occasion: 'Dinner',
        styleVibe: 'Quiet Luxury',
      },
      {
        id: 'fixture-dup-b',
        title: 'Look B',
        description: 'Duplicate two',
        stylistTip: 'Tip',
        itemIds: ['outer-3', 'bottom-3', 'top-3'],
        occasion: 'Dinner',
        styleVibe: 'Quiet Luxury',
      },
    ],
    weather: 'cold',
    expectedValidOutfitCount: 1,
  },
];
