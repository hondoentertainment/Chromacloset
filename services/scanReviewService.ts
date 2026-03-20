import { Category, PatternType, WardrobeItem } from '../types.js';

export type EditableScanField = 'category' | 'patternType' | 'subcategory' | 'colorName' | 'colorFamily';
export type ScanBaseline = Partial<Pick<WardrobeItem, EditableScanField>>;
export type ScanBaselines = Record<string, ScanBaseline>;

export const EDITABLE_SCAN_FIELDS: EditableScanField[] = ['category', 'patternType', 'subcategory', 'colorName', 'colorFamily'];

export const createBaselineItems = (items: WardrobeItem[]): ScanBaselines =>
  Object.fromEntries(items.map((item) => [item.id, {
    category: item.category,
    patternType: item.patternType,
    subcategory: item.subcategory,
    colorName: item.colorName,
    colorFamily: item.colorFamily,
  }]));

export const isEditableScanField = (field: keyof WardrobeItem): field is EditableScanField =>
  EDITABLE_SCAN_FIELDS.includes(field as EditableScanField);

export const applyEditToItem = <K extends EditableScanField>(item: WardrobeItem, field: K, value: WardrobeItem[K], baseline?: ScanBaseline): WardrobeItem => {
  const next = { ...item, [field]: value } as WardrobeItem;
  const isEdited = baseline ? (
    next.category !== baseline.category ||
    next.patternType !== baseline.patternType ||
    next.subcategory !== baseline.subcategory ||
    next.colorName !== baseline.colorName ||
    next.colorFamily !== baseline.colorFamily
  ) : true;

  return { ...next, isEdited };
};

export const applyFieldToSimilarItems = <K extends EditableScanField>(items: WardrobeItem[], id: string, field: K, value: WardrobeItem[K], baselines: ScanBaselines): WardrobeItem[] => {
  const source = items.find((item) => item.id === id);
  if (!source) return items;

  const similarIds = items
    .filter((item) => item.id !== id && item.subcategory.toLowerCase() === source.subcategory.toLowerCase())
    .map((item) => item.id);

  if (similarIds.length === 0) return items;

  return items.map((item) => {
    if (!similarIds.includes(item.id)) return item;
    return applyEditToItem(item, field, value, baselines[item.id]);
  });
};

export const resetItemToBaseline = (item: WardrobeItem, baseline?: ScanBaseline): WardrobeItem => {
  if (!baseline) return item;

  return {
    ...item,
    category: (baseline.category as Category) || item.category,
    patternType: (baseline.patternType as PatternType) || item.patternType,
    subcategory: (baseline.subcategory as string) || item.subcategory,
    colorName: (baseline.colorName as string) || item.colorName,
    colorFamily: (baseline.colorFamily as string) || item.colorFamily,
    isEdited: false,
  };
};
