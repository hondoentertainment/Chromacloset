
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
}

export interface ScanResult {
  items: WardrobeItem[];
  timestamp: number;
}
