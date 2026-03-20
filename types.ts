
export enum Category {
  TOP = 'top',
  BOTTOM = 'bottom',
  OUTERWEAR = 'outerwear',
  SHOES = 'shoes',
  ACCESSORIES = 'accessories'
}

export enum PatternType {
  SOLID = 'solid',
  STRIPED = 'striped',
  PLAID = 'plaid',
  FLORAL = 'floral',
  OTHER = 'other'
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface WardrobeItem {
  id: string;
  category: Category;
  subcategory: string;
  brand: string;
  imageUrl: string;
  dominantColorHex: string;
  secondaryColorHex?: string;
  paletteHex: string[];
  colorFamily: string;
  colorName: string;
  patternType: PatternType;
  confidence: number;
  createdAt: number;
  isEdited?: boolean;
  box?: BoundingBox;
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  description: string;
  stylistTip: string;
  itemIds: string[];
  occasion: string;
  styleVibe: string;
  weatherFocus?: 'warm' | 'cold' | 'mild' | 'rain';
  score?: number;
  isSaved?: boolean;
  dateSaved?: number;
  lastWorn?: number;
  userNotes?: string;
  outfitFeedback?: "love" | "skip";
  generationSource?: "model" | "fallback";
  generationVersion?: string;
  personalizationScore?: number;
  recommendedBecause?: string;
}

export interface WardrobeGap {
  itemType: string;
  suggestedColor: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ScanResult {
  items: WardrobeItem[];
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type StylePersona = 'Minimalist' | 'Streetwear' | 'Classic Professional' | 'Bohemian' | 'Quiet Luxury' | 'Bold & Eclectic';
export type AgentMode = 'Precision' | 'Balanced' | 'Editorial';
