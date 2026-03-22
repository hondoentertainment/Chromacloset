import { Category, type OutfitRecommendation, type WardrobeItem } from '../types.js';

const WEATHER_KEYWORDS = {
  warm: ['sun', 'hot', 'humid', 'summer', 'warm'],
  cold: ['cold', 'chilly', 'winter', 'snow', 'freezing'],
  rain: ['rain', 'storm', 'drizzle', 'wet'],
};

export const getWeatherFocus = (weather?: string): OutfitRecommendation['weatherFocus'] => {
  if (!weather) return 'mild';
  const lower = weather.toLowerCase();
  if (WEATHER_KEYWORDS.rain.some((term) => lower.includes(term))) return 'rain';
  if (WEATHER_KEYWORDS.cold.some((term) => lower.includes(term))) return 'cold';
  if (WEATHER_KEYWORDS.warm.some((term) => lower.includes(term))) return 'warm';
  return 'mild';
};

export const getWeatherScore = (categories: Category[], weatherFocus: OutfitRecommendation['weatherFocus']): number => {
  const hasOuterwear = categories.includes(Category.OUTERWEAR);
  const hasShoes = categories.includes(Category.SHOES);
  const hasAccessories = categories.includes(Category.ACCESSORIES);

  switch (weatherFocus) {
    case 'cold':
      return (hasOuterwear ? 2 : 0) + (hasShoes ? 1 : 0);
    case 'rain':
      return (hasOuterwear ? 2 : 0) + (hasShoes ? 2 : 0);
    case 'warm':
      return (hasOuterwear ? -1 : 1) + (hasAccessories ? 1 : 0);
    default:
      return hasAccessories ? 1 : 0;
  }
};

const CORE_CATEGORIES = [Category.TOP, Category.BOTTOM] as const;

const getCoreItemIds = (itemIds: string[], byId: Map<string, WardrobeItem>): string[] =>
  itemIds.filter((id) => CORE_CATEGORIES.includes(byId.get(id)?.category as typeof CORE_CATEGORIES[number]));

const buildSignature = (itemIds: string[]): string => [...itemIds].sort().join('|');

export const normalizeOutfits = (raw: OutfitRecommendation[], items: WardrobeItem[], weather?: string): OutfitRecommendation[] => {
  const byId = new Map(items.map(i => [i.id, i]));
  const weatherFocus = getWeatherFocus(weather);
  const normalized = raw
    .map((outfit, idx) => {
      const validItemIds = outfit.itemIds.filter(id => byId.has(id));
      const uniqueItemIds = [...new Set(validItemIds)];
      const categoryList = uniqueItemIds
        .map(id => byId.get(id)?.category)
        .filter((category): category is Category => Boolean(category));
      const categories = new Set(categoryList);

      const hasTop = categories.has(Category.TOP);
      const hasBottom = categories.has(Category.BOTTOM);
      const isValidComposition =
        hasTop &&
        hasBottom &&
        uniqueItemIds.length >= 2 &&
        uniqueItemIds.length <= 5 &&
        uniqueItemIds.length === validItemIds.length;

      if (!isValidComposition) return null;

      const fullSignature = buildSignature(uniqueItemIds);
      const coreItemIds = getCoreItemIds(uniqueItemIds, byId);
      if (coreItemIds.length < 2) return null;

      const coreSignature = buildSignature(coreItemIds);
      const weatherScore = getWeatherScore(categoryList, weatherFocus);
      const diversityScore = new Set(uniqueItemIds.map((id) => byId.get(id)?.colorFamily)).size;
      const compositionBonus = categoryList.reduce((score, category) => {
        if (category === Category.OUTERWEAR || category === Category.SHOES) return score + 1;
        if (category === Category.ACCESSORIES) return score + 0.5;
        return score;
      }, 0);

      return {
        ...outfit,
        id: outfit.id || `outfit-${Date.now()}-${idx}`,
        itemIds: uniqueItemIds,
        weatherFocus,
        score: weatherScore + diversityScore + compositionBonus,
        coreSignature,
        fullSignature,
      };
    })
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .sort((left, right) => (right.score || 0) - (left.score || 0));

  const seenFullSignatures = new Set<string>();
  const seenCoreSignatures = new Set<string>();

  return normalized.filter((outfit) => {
    if (seenFullSignatures.has(outfit.fullSignature)) {
      return false;
    }
    seenFullSignatures.add(outfit.fullSignature);

    if (seenCoreSignatures.has(outfit.coreSignature)) {
      return false;
    }
    seenCoreSignatures.add(outfit.coreSignature);
    return true;
  }).map(({ coreSignature: _coreSignature, fullSignature: _fullSignature, ...outfit }) => outfit);
};
