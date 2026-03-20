import { Type } from "@google/genai";
import { WardrobeItem, OutfitRecommendation, WardrobeGap, StylePersona, Category, AgentMode } from "../types.js";
import { AGENT_MODE_CONFIG, AI_RUNTIME_PROFILE, buildOutfitGenerationPrompt, buildStylingChatSystemInstruction, buildWardrobeGapPrompt } from "./aiConfig.js";
import { createGeminiClient } from "./aiClient.js";
import { getWeatherFocus, normalizeOutfits } from "./stylistLogic.js";
import { GoogleGenAI, Type } from "@google/genai";
import { WardrobeItem, OutfitRecommendation, WardrobeGap, StylePersona, Category, AgentMode } from "../types";

const WEATHER_KEYWORDS = {
  warm: ['sun', 'hot', 'humid', 'summer', 'warm'],
  cold: ['cold', 'chilly', 'winter', 'snow', 'freezing'],
  rain: ['rain', 'storm', 'drizzle', 'wet'],
};

const AGENT_MODE_INSTRUCTIONS: Record<AgentMode, string> = {
  Precision: 'Prioritize practicality, item compatibility, and low-risk combinations. Favor clarity over novelty.',
  Balanced: 'Balance creativity, practicality, and wardrobe reuse. Keep combinations versatile and polished.',
  Editorial: 'Push toward fashion-forward styling, stronger contrast, and statement layering while staying wearable.',
};

const getWeatherFocus = (weather?: string): OutfitRecommendation['weatherFocus'] => {
  if (!weather) return 'mild';
  const lower = weather.toLowerCase();
  if (WEATHER_KEYWORDS.rain.some((term) => lower.includes(term))) return 'rain';
  if (WEATHER_KEYWORDS.cold.some((term) => lower.includes(term))) return 'cold';
  if (WEATHER_KEYWORDS.warm.some((term) => lower.includes(term))) return 'warm';
  return 'mild';
};

const getWeatherScore = (categories: Category[], weatherFocus: OutfitRecommendation['weatherFocus']): number => {
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

const buildFallbackOutfits = (
  items: WardrobeItem[],
  occasion: string,
  persona: StylePersona,
  weather?: string,
  agentMode: AgentMode = 'Balanced'
): OutfitRecommendation[] => {
  const tops = items.filter((item) => item.category === Category.TOP);
  const bottoms = items.filter((item) => item.category === Category.BOTTOM);
  const outerwear = items.filter((item) => item.category === Category.OUTERWEAR);
  const shoes = items.filter((item) => item.category === Category.SHOES);
  const accessories = items.filter((item) => item.category === Category.ACCESSORIES);
  const weatherFocus = getWeatherFocus(weather);
  const results: OutfitRecommendation[] = [];
  const seenSignatures = new Set<string>();

  for (const top of tops) {
    for (const bottom of bottoms) {
      const itemIds = [top.id, bottom.id];
      if (weatherFocus !== 'warm' && outerwear[0]) itemIds.push(outerwear[0].id);
      if (shoes[0]) itemIds.push(shoes[0].id);
      if (accessories[0] && weatherFocus !== 'rain') itemIds.push(accessories[0].id);

      const signature = [...itemIds].sort().join('|');
      if (seenSignatures.has(signature)) continue;
      seenSignatures.add(signature);

      results.push({
        id: `fallback-${results.length}`,
        title: `${agentMode} ${persona} ${occasion} Look ${results.length + 1}`,
        description: `${top.colorName} ${top.subcategory} paired with ${bottom.colorName} ${bottom.subcategory}.`,
        stylistTip: `${AGENT_MODE_CONFIG[agentMode].instructions} Lead with balance: anchor the look with a ${top.colorFamily.toLowerCase()} top and build around it for ${occasion.toLowerCase()}.`,
        stylistTip: `${AGENT_MODE_INSTRUCTIONS[agentMode]} Lead with balance: anchor the look with a ${top.colorFamily.toLowerCase()} top and build around it for ${occasion.toLowerCase()}.`,
        itemIds,
        occasion,
        styleVibe: persona,
        weatherFocus,
      });

      if (results.length === 3) {
        return results;
      }
    }
  }

  return results;
};

const WEATHER_KEYWORDS = {
  warm: ['sun', 'hot', 'humid', 'summer', 'warm'],
  cold: ['cold', 'chilly', 'winter', 'snow', 'freezing'],
  rain: ['rain', 'storm', 'drizzle', 'wet'],
};

const getWeatherFocus = (weather?: string): OutfitRecommendation['weatherFocus'] => {
  if (!weather) return 'mild';
  const lower = weather.toLowerCase();
  if (WEATHER_KEYWORDS.rain.some((term) => lower.includes(term))) return 'rain';
  if (WEATHER_KEYWORDS.cold.some((term) => lower.includes(term))) return 'cold';
  if (WEATHER_KEYWORDS.warm.some((term) => lower.includes(term))) return 'warm';
  return 'mild';
};

const getWeatherScore = (categories: Category[], weatherFocus: OutfitRecommendation['weatherFocus']): number => {
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

const buildFallbackOutfits = (
  items: WardrobeItem[],
  occasion: string,
  persona: StylePersona,
  weather?: string
): OutfitRecommendation[] => {
  const tops = items.filter((item) => item.category === Category.TOP);
  const bottoms = items.filter((item) => item.category === Category.BOTTOM);
  const outerwear = items.filter((item) => item.category === Category.OUTERWEAR);
  const shoes = items.filter((item) => item.category === Category.SHOES);
  const accessories = items.filter((item) => item.category === Category.ACCESSORIES);
  const weatherFocus = getWeatherFocus(weather);
  const results: OutfitRecommendation[] = [];
  const seenSignatures = new Set<string>();

  for (const top of tops) {
    for (const bottom of bottoms) {
      const itemIds = [top.id, bottom.id];
      if (weatherFocus !== 'warm' && outerwear[0]) itemIds.push(outerwear[0].id);
      if (shoes[0]) itemIds.push(shoes[0].id);
      if (accessories[0] && weatherFocus !== 'rain') itemIds.push(accessories[0].id);

      const signature = [...itemIds].sort().join('|');
      if (seenSignatures.has(signature)) continue;
      seenSignatures.add(signature);

      results.push({
        id: `fallback-${results.length}`,
        title: `${persona} ${occasion} Look ${results.length + 1}`,
        description: `${top.colorName} ${top.subcategory} paired with ${bottom.colorName} ${bottom.subcategory}.`,
        stylistTip: `Lead with balance: anchor the look with a ${top.colorFamily.toLowerCase()} top and build around it for ${occasion.toLowerCase()}.`,
        itemIds,
        occasion,
        styleVibe: persona,
        weatherFocus,
        generationSource: 'fallback',
        generationVersion: AI_RUNTIME_PROFILE.outfitGeneration.promptVersion,
      });

      if (results.length === 3) {
        return results;
      }
    }
  }

  return results;
};

const OUTFIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    stylistTip: { type: Type.STRING, description: "Professional advice on how to wear this look." },
    itemIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    occasion: { type: Type.STRING },
    styleVibe: { type: Type.STRING }
  },
  required: ["id", "title", "description", "stylistTip", "itemIds", "occasion", "styleVibe"]
};

export const getActiveStylistProfile = (agentMode: AgentMode) => ({
  agentMode,
  title: AGENT_MODE_CONFIG[agentMode].title,
  description: AGENT_MODE_CONFIG[agentMode].description,
  promptVersion: AI_RUNTIME_PROFILE.outfitGeneration.promptVersion,
  chatPromptVersion: AI_RUNTIME_PROFILE.stylistChat.promptVersion,
  generationModel: AI_RUNTIME_PROFILE.outfitGeneration.model,
  chatModel: AI_RUNTIME_PROFILE.stylistChat.model,
  timeoutMs: AI_RUNTIME_PROFILE.outfitGeneration.timeoutMs,
  fallbackStrategy: 'deterministic_capsule_builder',
});
const normalizeOutfits = (raw: OutfitRecommendation[], items: WardrobeItem[], weather?: string): OutfitRecommendation[] => {
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

// Create a new GoogleGenAI instance inside each function to ensure it always uses the most current API key from process.env.
export const generateOutfits = async (
  items: WardrobeItem[],
  occasion: string,
  persona: StylePersona,
  weather?: string,
  agentMode: AgentMode = 'Balanced'
): Promise<OutfitRecommendation[]> => {
  if (items.length < 2) return [];

  const ai = createGeminiClient();

  const itemManifest = items.map(i => ({
    id: i.id,
    desc: `${i.colorName} ${i.subcategory} (${i.category})`,
    family: i.colorFamily
  }));

  try {
    const response = await ai.models.generateContent({
      model: AI_RUNTIME_PROFILE.outfitGeneration.model,
      contents: {
        parts: [{
          text: buildOutfitGenerationPrompt({
            persona,
            agentMode,
            occasion,
            weather,
            itemManifest,
          })
          text: `You are a high-end fashion concierge. The user's style persona is "${persona}".
          The active styling agent mode is "${agentMode}". ${AGENT_MODE_INSTRUCTIONS[agentMode]}
          Using ONLY these wardrobe items: ${JSON.stringify(itemManifest)}, curate 3 outfits for "${occasion}".
          ${weatherContext}
          Every outfit MUST include at least one top and one bottom.
          Optional pieces may include outerwear, shoes, and accessories, but do not repeat the same exact combination.
          Prefer weather-appropriate layering when weather is provided.
          Return a JSON array. Each outfit must include a "stylistTip" that references color theory or styling principles.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: OUTFIT_SCHEMA
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]") as OutfitRecommendation[];
    const normalized = normalizeOutfits(parsed, items, weather).map((outfit) => ({
      ...outfit,
      generationSource: 'model' as const,
      generationVersion: AI_RUNTIME_PROFILE.outfitGeneration.promptVersion,
    }));
    const normalized = normalizeOutfits(parsed, items, weather);
    return normalized.length > 0 ? normalized : buildFallbackOutfits(items, occasion, persona, weather, agentMode);
  } catch (error) {
    console.error("Stylist Error:", error);
    return buildFallbackOutfits(items, occasion, persona, weather, agentMode);
  }
};

export const createStylingChat = (items: WardrobeItem[], persona: StylePersona, agentMode: AgentMode = 'Balanced') => {
  const ai = createGeminiClient();
    return normalized.length > 0 ? normalized : buildFallbackOutfits(items, occasion, persona, weather);
  } catch (error) {
    console.error("Stylist Error:", error);
    return buildFallbackOutfits(items, occasion, persona, weather);
  }
};

// Ensure GoogleGenAI instance is fresh for chat session creation.
export const createStylingChat = (items: WardrobeItem[], persona: StylePersona, agentMode: AgentMode = 'Balanced') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const itemManifest = items.map(i => `${i.colorName} ${i.subcategory}`).join(", ");

  return ai.chats.create({
    model: AI_RUNTIME_PROFILE.stylistChat.model,
    config: {
      systemInstruction: buildStylingChatSystemInstruction(items, persona, agentMode)
      systemInstruction: `You are the Chromacloset Style Concierge. The user has these items: ${itemManifest}.
      Their style persona is ${persona}. The active styling agent mode is ${agentMode}: ${AGENT_MODE_INSTRUCTIONS[agentMode]}
      Help them with specific styling questions, outfit advice, and mixing colors.
      Be encouraging, sophisticated, and concise. Always suggest specific items from their inventory when possible.`
    }
  });
};

export const searchForGapItems = async (gap: WardrobeGap) => {
  const ai = createGeminiClient();
  const response = await ai.models.generateContent({
    model: AI_RUNTIME_PROFILE.shoppingSearch.model,
    contents: `Find shopping recommendations for a ${gap.suggestedColor} ${gap.itemType}. Focus on brands like Everlane, Uniqlo, or high-quality basics.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text,
    sources: grounding.map((chunk: any) => chunk.web).filter(Boolean)
  };
};

export const analyzeWardrobeGaps = async (items: WardrobeItem[]): Promise<WardrobeGap[]> => {
  if (items.length === 0) return [];

  const ai = createGeminiClient();
  const itemManifest = items.map(i => ({
    category: i.category,
    type: i.subcategory,
    color: i.colorName,
    family: i.colorFamily
  }));

  try {
    const response = await ai.models.generateContent({
      model: AI_RUNTIME_PROFILE.wardrobeGaps.model,
      contents: {
        parts: [{
          text: buildWardrobeGapPrompt(itemManifest)
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemType: { type: Type.STRING },
              suggestedColor: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              priority: { type: Type.STRING }
            },
            required: ["itemType", "suggestedColor", "reasoning", "priority"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]') as WardrobeGap[];
  } catch (error) {
    console.error('Wardrobe gap analysis error:', error);
    return [];
  }
};
