import type { OutfitRecommendation, ScanResult, WardrobeItem } from '../types.js';

export const STORAGE_KEYS = {
  items: 'chromacloset_items',
  scans: 'chromacloset_scans',
  totalScannedCount: 'chromacloset_total_scanned',
  closetIcon: 'chromacloset_brand_icon',
  savedOutfits: 'chromacloset_saved_outfits',
} as const;

export interface PersistedClosetState {
  items: WardrobeItem[];
  scans: ScanResult[];
  totalScannedCount: number;
  closetIcon: string | null;
}

const canUseStorage = (): boolean => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const loadPersistedClosetState = (): PersistedClosetState => {
  if (!canUseStorage()) {
    return {
      items: [],
      scans: [],
      totalScannedCount: 0,
      closetIcon: null,
    };
  }

  return {
    items: parseJson<WardrobeItem[]>(localStorage.getItem(STORAGE_KEYS.items), []),
    scans: parseJson<ScanResult[]>(localStorage.getItem(STORAGE_KEYS.scans), []),
    totalScannedCount: Number.parseInt(localStorage.getItem(STORAGE_KEYS.totalScannedCount) ?? '0', 10) || 0,
    closetIcon: localStorage.getItem(STORAGE_KEYS.closetIcon),
  };
};

export const savePersistedClosetState = (state: PersistedClosetState) => {
  if (!canUseStorage()) return;

  localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(state.items));
  localStorage.setItem(STORAGE_KEYS.scans, JSON.stringify(state.scans));
  localStorage.setItem(STORAGE_KEYS.totalScannedCount, String(state.totalScannedCount));

  if (state.closetIcon) {
    localStorage.setItem(STORAGE_KEYS.closetIcon, state.closetIcon);
  } else {
    localStorage.removeItem(STORAGE_KEYS.closetIcon);
  }
};

export const loadSavedOutfits = (): OutfitRecommendation[] => {
  if (!canUseStorage()) return [];
  const parsed = parseJson<OutfitRecommendation[]>(localStorage.getItem(STORAGE_KEYS.savedOutfits), []);
  return Array.isArray(parsed) ? parsed : [];
};

export const saveSavedOutfits = (savedOutfits: OutfitRecommendation[]) => {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEYS.savedOutfits, JSON.stringify(savedOutfits));
};

export const clearClosetStorage = () => {
  if (!canUseStorage()) return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};
