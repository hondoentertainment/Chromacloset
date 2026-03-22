import { type AgentMode, type StylePersona, type WardrobeItem } from '../types.js';

export const AI_RUNTIME_PROFILE = {
  scanAnalysis: {
    promptVersion: 'scan-v1',
    model: 'gemini-3-flash-preview',
  },
  qrExtraction: {
    promptVersion: 'qr-v1',
    model: 'gemini-3-flash-preview',
  },
  outfitGeneration: {
    promptVersion: 'stylist-outfits-v2',
    model: 'gemini-3-flash-preview',
    timeoutMs: 15000,
  },
  stylistChat: {
    promptVersion: 'stylist-chat-v2',
    model: 'gemini-3-pro-preview',
  },
  wardrobeGaps: {
    promptVersion: 'gap-v1',
    model: 'gemini-3-flash-preview',
  },
  shoppingSearch: {
    promptVersion: 'shopping-search-v1',
    model: 'gemini-3-pro-preview',
  },
  brandIcon: {
    promptVersion: 'brand-icon-v1',
    model: 'gemini-2.5-flash-image',
  },
} as const;

export const AGENT_MODE_CONFIG: Record<AgentMode, { title: string; description: string; instructions: string }> = {
  Precision: {
    title: 'Precision Agent',
    description: 'Optimizes for practicality, compatibility, and low-risk outfit confidence.',
    instructions: 'Prioritize practicality, item compatibility, and low-risk combinations. Favor clarity over novelty.',
  },
  Balanced: {
    title: 'Balanced Agent',
    description: 'Blends polish, versatility, and tasteful creativity for everyday performance.',
    instructions: 'Balance creativity, practicality, and wardrobe reuse. Keep combinations versatile and polished.',
  },
  Editorial: {
    title: 'Editorial Agent',
    description: 'Pushes stronger contrasts, bolder layering, and more fashion-forward looks.',
    instructions: 'Push toward fashion-forward styling, stronger contrast, and statement layering while staying wearable.',
  },
};

export const buildScanAnalysisPrompt = () =>
  'Analyze this wardrobe photo. Detect and localize EVERY distinct clothing item or accessory. For each item, provide its attributes and a [ymin, xmin, ymax, xmax] bounding box in normalized coordinates (0-1000). Return a JSON array.';

export const buildQrExtractionPrompt = () =>
  'Extract the content from the QR code in this image. The QR code should contain product details for a clothing item. Return only the JSON object.';

export const buildOutfitGenerationPrompt = ({
  persona,
  agentMode,
  occasion,
  weather,
  itemManifest,
}: {
  persona: StylePersona;
  agentMode: AgentMode;
  occasion: string;
  weather?: string;
  itemManifest: Array<{ id: string; desc: string; family: string }>;
}) => {
  const weatherContext = weather ? `The current weather is ${weather}.` : '';

  return `You are a high-end fashion concierge. The user's style persona is "${persona}".
The active styling agent mode is "${agentMode}". ${AGENT_MODE_CONFIG[agentMode].instructions}
Using ONLY these wardrobe items: ${JSON.stringify(itemManifest)}, curate 3 outfits for "${occasion}".
${weatherContext}
Every outfit MUST include at least one top and one bottom.
Optional pieces may include outerwear, shoes, and accessories, but do not repeat the same exact combination.
Prefer weather-appropriate layering when weather is provided.
Return a JSON array. Each outfit must include a "stylistTip" that references color theory or styling principles.`;
};

export const buildStylingChatSystemInstruction = (items: WardrobeItem[], persona: StylePersona, agentMode: AgentMode) => {
  const itemManifest = items.map((item) => `${item.colorName} ${item.subcategory}`).join(', ');
  return `You are the Chromacloset Style Concierge. The user has these items: ${itemManifest}.
Their style persona is ${persona}. The active styling agent mode is ${agentMode}: ${AGENT_MODE_CONFIG[agentMode].instructions}
Help them with specific styling questions, outfit advice, and mixing colors.
Be encouraging, sophisticated, and concise. Always suggest specific items from their inventory when possible.`;
};

export const buildWardrobeGapPrompt = (itemManifest: Array<{ category: string; type: string; color: string; family: string }>) =>
  `Closet data: ${JSON.stringify(itemManifest)}. Identify 3 missing versatile basics that would enhance this specific collection.`;
