import { Category, type OutfitRecommendation, type StylePersona, type WardrobeItem } from '../types.js';

export interface PreferenceMemory {
  topColorFamilies: string[];
  topCategories: Array<{ category: Category; score: number }>;
  favoritePersona?: StylePersona;
  favoriteOccasion?: string;
  favoriteWeatherFocus?: OutfitRecommendation['weatherFocus'];
  lovedOutfitCount: number;
  skippedOutfitCount: number;
}

export interface StyleBriefSuggestion {
  persona?: StylePersona;
  occasion?: string;
  weather?: string;
}

const getOutfitItems = (outfit: OutfitRecommendation, items: WardrobeItem[]) =>
  outfit.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is WardrobeItem => Boolean(item));

export const buildPreferenceMemory = (savedOutfits: OutfitRecommendation[], items: WardrobeItem[]): PreferenceMemory => {
  const colorScores = new Map<string, number>();
  const categoryScores = new Map<Category, number>();
  const personaScores = new Map<string, number>();
  const occasionScores = new Map<string, number>();
  const weatherScores = new Map<string, number>();
  let lovedOutfitCount = 0;
  let skippedOutfitCount = 0;

  for (const outfit of savedOutfits) {
    const weight = outfit.outfitFeedback === 'love' ? 3 : outfit.outfitFeedback === 'skip' ? -2 : 1;
    if (outfit.outfitFeedback === 'love') lovedOutfitCount += 1;
    if (outfit.outfitFeedback === 'skip') skippedOutfitCount += 1;

    personaScores.set(outfit.styleVibe, (personaScores.get(outfit.styleVibe) ?? 0) + weight);
    occasionScores.set(outfit.occasion, (occasionScores.get(outfit.occasion) ?? 0) + weight);
    if (outfit.weatherFocus) {
      weatherScores.set(outfit.weatherFocus, (weatherScores.get(outfit.weatherFocus) ?? 0) + weight);
    }

    for (const item of getOutfitItems(outfit, items)) {
      colorScores.set(item.colorFamily, (colorScores.get(item.colorFamily) ?? 0) + weight);
      categoryScores.set(item.category, (categoryScores.get(item.category) ?? 0) + weight);
    }
  }

  return {
    topColorFamilies: [...colorScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(([, score]) => score > 0)
      .slice(0, 3)
      .map(([color]) => color),
    topCategories: [...categoryScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, score]) => ({ category, score })),
    favoritePersona: [...personaScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as StylePersona | undefined,
    favoriteOccasion: [...occasionScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
    favoriteWeatherFocus: [...weatherScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as OutfitRecommendation['weatherFocus'] | undefined,
    lovedOutfitCount,
    skippedOutfitCount,
  };
};

const buildReason = (outfit: OutfitRecommendation, items: WardrobeItem[], memory: PreferenceMemory, context: { persona: StylePersona; occasion: string; weather?: string | null }) => {
  const reasonParts: string[] = [];
  const outfitItems = getOutfitItems(outfit, items);
  const colorFamilies = outfitItems.map((item) => item.colorFamily);

  const matchingColors = memory.topColorFamilies.filter((color) => colorFamilies.includes(color));
  if (matchingColors.length) {
    reasonParts.push(`because you consistently like ${matchingColors.join(' and ')} pieces`);
  }

  if (memory.favoritePersona && memory.favoritePersona === context.persona) {
    reasonParts.push(`because ${context.persona} is your strongest persona signal`);
  }

  if (memory.favoriteOccasion && memory.favoriteOccasion === context.occasion) {
    reasonParts.push(`because you save looks for ${context.occasion.toLowerCase()}`);
  }

  if (!reasonParts.length && outfit.generationSource === 'fallback') {
    reasonParts.push('because the system used a safe fallback built from your existing staples');
  }

  return reasonParts[0] ? `Recommended ${reasonParts[0]}.` : 'Recommended based on your current wardrobe balance and active brief.';
};

export const rerankOutfitsWithPreferences = (
  outfits: OutfitRecommendation[],
  savedOutfits: OutfitRecommendation[],
  items: WardrobeItem[],
  context: { persona: StylePersona; occasion: string; weather?: string | null },
): OutfitRecommendation[] => {
  const memory = buildPreferenceMemory(savedOutfits, items);

  return outfits
    .map((outfit) => {
      const outfitItems = getOutfitItems(outfit, items);
      const lovedBoost = outfitItems.reduce((total, item) => total + (memory.topColorFamilies.includes(item.colorFamily) ? 2 : 0), 0);
      const categoryBoost = outfitItems.reduce((total, item) => {
        const match = memory.topCategories.find((entry) => entry.category === item.category);
        return total + (match?.score ?? 0);
      }, 0);
      const personaBoost = memory.favoritePersona === context.persona ? 3 : 0;
      const occasionBoost = memory.favoriteOccasion === context.occasion ? 2 : 0;
      const weatherBoost = memory.favoriteWeatherFocus && outfit.weatherFocus === memory.favoriteWeatherFocus ? 2 : 0;
      const skipPenalty = outfit.outfitFeedback === 'skip' ? -6 : 0;
      const personalizationScore = lovedBoost + categoryBoost + personaBoost + occasionBoost + weatherBoost + skipPenalty;

      return {
        ...outfit,
        personalizationScore,
        recommendedBecause: buildReason(outfit, items, memory, context),
        score: (outfit.score ?? 0) + personalizationScore,
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
};

export const getStyleBriefSuggestion = (memory: PreferenceMemory): StyleBriefSuggestion => ({
  persona: memory.favoritePersona,
  occasion: memory.favoriteOccasion,
  weather: memory.favoriteWeatherFocus ? `${memory.favoriteWeatherFocus} weather` : undefined,
});
