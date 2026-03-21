import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEYS,
  clearClosetStorage,
  loadPersistedClosetState,
  loadSavedOutfits,
  savePersistedClosetState,
  saveSavedOutfits,
} from '../../services/storageService.js';
import { Category, PatternType, type OutfitRecommendation, type WardrobeItem } from '../../types.js';

const storage = new Map<string, string>();

const localStorageMock: Storage = {
  get length() {
    return storage.size;
  },
  clear: () => storage.clear(),
  getItem: (key: string) => storage.get(key) ?? null,
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
  removeItem: (key: string) => {
    storage.delete(key);
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
};

Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });

const item: WardrobeItem = {
  id: 'item-1',
  category: Category.TOP,
  subcategory: 'shirt',
  brand: 'Test',
  imageUrl: 'image',
  dominantColorHex: '#000000',
  paletteHex: ['#000000'],
  colorFamily: 'Blue',
  colorName: 'Navy',
  patternType: PatternType.SOLID,
  confidence: 1,
  createdAt: 1,
};

const outfit: OutfitRecommendation = {
  id: 'look-1',
  title: 'Look',
  description: 'desc',
  stylistTip: 'tip',
  itemIds: ['item-1'],
  occasion: 'Work',
  styleVibe: 'Minimalist',
};

test.beforeEach(() => {
  storage.clear();
});

test('save/load persisted closet state round-trips all core fields', () => {
  savePersistedClosetState({
    items: [item],
    scans: [{ items: [item], timestamp: 123 }],
    totalScannedCount: 3,
    closetIcon: 'data:image/png;base64,abc',
  });

  const state = loadPersistedClosetState();
  assert.equal(state.items.length, 1);
  assert.equal(state.scans.length, 1);
  assert.equal(state.totalScannedCount, 3);
  assert.equal(state.closetIcon, 'data:image/png;base64,abc');
});

test('saved outfits are loaded from the shared storage helper', () => {
  saveSavedOutfits([outfit]);

  const loaded = loadSavedOutfits();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, outfit.id);
});

test('clearClosetStorage removes closet keys without assuming full localStorage.clear', () => {
  savePersistedClosetState({
    items: [item],
    scans: [],
    totalScannedCount: 1,
    closetIcon: null,
  });
  saveSavedOutfits([outfit]);
  localStorageMock.setItem('chromacloset_analytics_events', 'preserve-me');

  clearClosetStorage();

  assert.equal(localStorageMock.getItem(STORAGE_KEYS.items), null);
  assert.equal(localStorageMock.getItem(STORAGE_KEYS.savedOutfits), null);
  assert.equal(localStorageMock.getItem('chromacloset_analytics_events'), 'preserve-me');
});
