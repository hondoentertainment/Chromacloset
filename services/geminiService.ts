
import { GoogleGenAI, Type } from "@google/genai";
import { WardrobeItem } from "../types";

const ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: "The category of the item: top, bottom, outerwear, shoes, accessories",
    },
    subcategory: {
      type: Type.STRING,
      description: "Specific type like 't-shirt', 'jeans', 'sneakers'",
    },
    brand: {
      type: Type.STRING,
      description: "Brand name if visible, otherwise 'Unknown'",
    },
    dominantColorHex: {
      type: Type.STRING,
      description: "Accurate HEX color code for the dominant color",
    },
    colorName: {
      type: Type.STRING,
      description: "A common descriptive name for the color like 'Navy', 'Emerald', 'Beige'",
    },
    colorFamily: {
      type: Type.STRING,
      description: "Broad color family: Red, Blue, Neutral, etc.",
    },
    patternType: {
      type: Type.STRING,
      description: "Pattern: solid, striped, plaid, floral, other",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score from 0 to 1",
    }
  },
  required: ["category", "subcategory", "dominantColorHex", "colorName", "colorFamily", "patternType", "confidence"]
};

/**
 * Extracts JSON from a string, stripping markdown code blocks if present.
 */
const extractJson = (text: string) => {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    const cleanedText = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse AI JSON response", e);
    return [];
  }
};

export const analyzeClosetImage = async (base64Image: string): Promise<Partial<WardrobeItem>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Ensure we only send the base64 data part
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    };
    
    const textPart = {
      text: "Analyze this wardrobe photo. List every distinct clothing item or accessory found. Return a JSON array of objects following the specified schema. Be precise with colors.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: ITEM_SCHEMA,
        },
      },
    });

    const rawText = response.text || "[]";
    return extractJson(rawText);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
