import { Type } from "@google/genai";
import { WardrobeItem, OutfitRecommendation, WardrobeGap, StylePersona, Category, AgentMode } from "../types.js";
import { AGENT_MODE_CONFIG, AI_RUNTIME_PROFILE, buildOutfitGenerationPrompt, buildStylingChatSystemInstruction, buildWardrobeGapPrompt } from "./aiConfig.js";
import { createGeminiClient } from "./aiClient.js";
import { getWeatherFocus, normalizeOutfits } from "./stylistLogic.js";
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
    return normalized.length > 0 ? normalized : buildFallbackOutfits(items, occasion, persona, weather, agentMode);
  } catch (error) {
    console.error("Stylist Error:", error);
    return buildFallbackOutfits(items, occasion, persona, weather, agentMode);
  }
};

export const createStylingChat = (items: WardrobeItem[], persona: StylePersona, agentMode: AgentMode = 'Balanced') => {
  const ai = createGeminiClient();
  const itemManifest = items.map(i => `${i.colorName} ${i.subcategory}`).join(", ");

  return ai.chats.create({
    model: AI_RUNTIME_PROFILE.stylistChat.model,
    config: {
      systemInstruction: buildStylingChatSystemInstruction(items, persona, agentMode)
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
