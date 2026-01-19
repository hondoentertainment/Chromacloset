
import { GoogleGenAI, Type } from "@google/genai";
import { WardrobeItem, OutfitRecommendation, WardrobeGap, StylePersona } from "../types";

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

// Create a new GoogleGenAI instance inside each function to ensure it always uses the most current API key from process.env.
export const generateOutfits = async (
  items: WardrobeItem[], 
  occasion: string, 
  persona: StylePersona,
  weather?: string
): Promise<OutfitRecommendation[]> => {
  if (items.length < 2) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const itemManifest = items.map(i => ({
    id: i.id,
    desc: `${i.colorName} ${i.subcategory} (${i.category})`,
    family: i.colorFamily
  }));

  const weatherContext = weather ? `The current weather is ${weather}.` : "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `You are a high-end fashion concierge. The user's style persona is "${persona}". 
          Using ONLY these wardrobe items: ${JSON.stringify(itemManifest)}, curate 3 outfits for "${occasion}". 
          ${weatherContext} 
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

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Stylist Error:", error);
    return [];
  }
};

// Ensure GoogleGenAI instance is fresh for chat session creation.
export const createStylingChat = (items: WardrobeItem[], persona: StylePersona) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const itemManifest = items.map(i => `${i.colorName} ${i.subcategory}`).join(", ");
  
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are the Chromacloset Style Concierge. The user has these items: ${itemManifest}. 
      Their style persona is ${persona}. Help them with specific styling questions, outfit advice, and mixing colors. 
      Be encouraging, sophisticated, and concise. Always suggest specific items from their inventory when possible.`
    }
  });
};

// Ensure GoogleGenAI instance is fresh for search grounding requests.
export const searchForGapItems = async (gap: WardrobeGap) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
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

// Ensure GoogleGenAI instance is fresh for wardrobe analysis.
export const analyzeWardrobeGaps = async (items: WardrobeItem[]): Promise<WardrobeGap[]> => {
  if (items.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const itemManifest = items.map(i => ({
    category: i.category,
    type: i.subcategory,
    color: i.colorName,
    family: i.colorFamily
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{
          text: `Closet data: ${JSON.stringify(itemManifest)}. Identify 3 missing versatile basics that would enhance this specific collection.`
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
              priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
            },
            required: ["itemType", "suggestedColor", "reasoning", "priority"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};
