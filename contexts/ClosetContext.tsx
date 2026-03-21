import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { OutfitRecommendation, ScanResult, WardrobeItem } from '../types.js';
import { clearClosetStorage, loadPersistedClosetState, loadSavedOutfits, savePersistedClosetState, saveSavedOutfits } from '../services/storageService.js';

interface ClosetContextValue {
  items: WardrobeItem[];
  scans: ScanResult[];
  totalScannedCount: number;
  closetIcon: string | null;
  savedOutfits: OutfitRecommendation[];
  addScanResult: (newItems: WardrobeItem[]) => void;
  deleteScan: (timestamp: number) => void;
  resetCloset: () => void;
  setClosetIcon: React.Dispatch<React.SetStateAction<string | null>>;
  setSavedOutfits: React.Dispatch<React.SetStateAction<OutfitRecommendation[]>>;
}

const ClosetContext = createContext<ClosetContextValue | undefined>(undefined);

export const ClosetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persistedState] = useState(() => loadPersistedClosetState());
  const [items, setItems] = useState<WardrobeItem[]>(persistedState.items);
  const [scans, setScans] = useState<ScanResult[]>(persistedState.scans);
  const [totalScannedCount, setTotalScannedCount] = useState<number>(persistedState.totalScannedCount);
  const [closetIcon, setClosetIcon] = useState<string | null>(persistedState.closetIcon);
  const [savedOutfits, setSavedOutfits] = useState<OutfitRecommendation[]>(() => loadSavedOutfits());

  useEffect(() => {
    savePersistedClosetState({
      items,
      scans,
      totalScannedCount,
      closetIcon,
    });
  }, [items, scans, totalScannedCount, closetIcon]);

  useEffect(() => {
    saveSavedOutfits(savedOutfits);
  }, [savedOutfits]);

  const value = useMemo<ClosetContextValue>(() => ({
    items,
    scans,
    totalScannedCount,
    closetIcon,
    savedOutfits,
    addScanResult: (newItems) => {
      setItems((prev) => [...prev, ...newItems]);
      setTotalScannedCount((prev) => prev + newItems.length);
      const newScan: ScanResult = {
        items: newItems,
        timestamp: Date.now(),
      };
      setScans((prev) => [newScan, ...prev].slice(0, 20));
    },
    deleteScan: (timestamp) => {
      setScans((prevScans) => {
        const scanToDelete = prevScans.find((scan) => scan.timestamp === timestamp);
        if (!scanToDelete) return prevScans;

        const itemIdsToRemove = new Set(scanToDelete.items.map((item) => item.id));
        setItems((prevItems) => prevItems.filter((item) => !itemIdsToRemove.has(item.id)));
        return prevScans.filter((scan) => scan.timestamp !== timestamp);
      });
    },
    resetCloset: () => {
      setItems([]);
      setScans([]);
      setSavedOutfits([]);
      setTotalScannedCount(0);
      setClosetIcon(null);
      clearClosetStorage();
    },
    setClosetIcon,
    setSavedOutfits,
  }), [items, scans, totalScannedCount, closetIcon, savedOutfits]);

  return <ClosetContext.Provider value={value}>{children}</ClosetContext.Provider>;
};

export const useCloset = (): ClosetContextValue => {
  const context = useContext(ClosetContext);
  if (!context) {
    throw new Error('useCloset must be used within a ClosetProvider');
  }
  return context;
};
