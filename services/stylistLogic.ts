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

export const normalizeOutfits = (raw: OutfitRecommendation[], items: WardrobeItem[], weather?: string): OutfitRecommendation[] => {
  const byId = new Map(items.map(i => [i.id, i]));
  const seenSignatures = new Set<string>();
  const weatherFocus = getWeatherFocus(weather);

  return raw
    .map((outfit, idx) => {
      const validItemIds = outfit.itemIds.filter(id => byId.has(id));
      const categoryList = validItemIds
        .map(id => byId.get(id)?.category)
        .filter((category): category is Category => Boolean(category));
      const categories = new Set(categoryList);

      const hasTop = categories.has(Category.TOP);
      const hasBottom = categories.has(Category.BOTTOM);
      const validCount = new Set(validItemIds).size === validItemIds.length;
      const isValidComposition =
        hasTop &&
        hasBottom &&
        validItemIds.length >= 2 &&
        validItemIds.length <= 5 &&
        validCount;

      if (!isValidComposition) return null;

      const signature = [...validItemIds].sort().join('|');
      if (seenSignatures.has(signature)) return null;
      seenSignatures.add(signature);

      const weatherScore = getWeatherScore(categoryList, weatherFocus);
      const diversityScore = new Set(validItemIds.map((id) => byId.get(id)?.colorFamily)).size;

      return {
        ...outfit,
        id: outfit.id || `outfit-${Date.now()}-${idx}`,
        itemIds: validItemIds,
        weatherFocus,
        score: weatherScore + diversityScore,
      };
    })
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .sort((a, b) => (b.score || 0) - (a.score || 0));
};
