
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
    },
    box_2d: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER },
      description: "Normalized bounding box [ymin, xmin, ymax, xmax] from 0 to 1000",
    }
  },
  required: ["category", "subcategory", "dominantColorHex", "colorName", "colorFamily", "patternType", "confidence", "box_2d"]
};

export const analyzeClosetImage = async (base64Image: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    };
    
    const textPart = {
      text: "Analyze this wardrobe photo. Detect and localize EVERY distinct clothing item or accessory. For each item, provide its attributes and a [ymin, xmin, ymax, xmax] bounding box in normalized coordinates (0-1000). Return a JSON array.",
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
    return JSON.parse(rawText);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const processQRCode = async (base64Image: string): Promise<Partial<WardrobeItem> | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    };
    
    const textPart = {
      text: "Extract the content from the QR code in this image. The QR code should contain product details for a clothing item. Return only the JSON object.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: ITEM_SCHEMA,
      },
    });

    const rawText = response.text || "{}";
    return JSON.parse(rawText);
  } catch (error) {
    console.error("Gemini QR Processing Error:", error);
    throw error;
  }
};

export const generateClosetIcon = async (vibe: string = "minimalist and modern", colorContext: string = "a spectrum of vibrant colors"): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `A ${vibe} brand icon for a digital wardrobe app called Chromacloset. The icon features a stylized open closet with neatly arranged clothes hanging on a rack, showcasing ${colorContext}. High-end vector art style, clean lines, professional branding, white background.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data received");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
