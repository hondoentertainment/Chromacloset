import { buildPreferenceMemory } from './personalizationService.js';
import { Category, type OutfitRecommendation, type ScanResult, type WardrobeGap, type WardrobeItem } from '../types.js';

export interface DuplicateCandidate {
  sourceId: string;
  duplicateId: string;
  reason: string;
}

export interface WeeklyPlanEntry {
  dayLabel: string;
  title: string;
  note: string;
}

export interface ProductionAgentCard {
  id: 'ingestion' | 'planner' | 'memory' | 'gap' | 'platform';
  title: string;
  phase: string;
  status: 'ready' | 'building' | 'needs_attention';
  headline: string;
  detail: string;
  testingNote: string;
}

export interface ProductionReadinessSnapshot {
  duplicateCandidates: DuplicateCandidate[];
  weeklyPlan: WeeklyPlanEntry[];
  prioritizedGaps: WardrobeGap[];
  syncSummary: {
    items: number;
    scans: number;
    savedLooks: number;
    syncReadinessScore: number;
  };
  agentCards: ProductionAgentCard[];
}

export const detectDuplicateCandidates = (items: WardrobeItem[]): DuplicateCandidate[] => {
  const duplicates: DuplicateCandidate[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < items.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < items.length; compareIndex += 1) {
      const source = items[index];
      const candidate = items[compareIndex];
      const isMatch =
        source.category === candidate.category &&
        source.subcategory.toLowerCase() === candidate.subcategory.toLowerCase() &&
        source.colorFamily.toLowerCase() === candidate.colorFamily.toLowerCase();

      if (!isMatch) continue;

      const key = `${source.id}:${candidate.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      duplicates.push({
        sourceId: source.id,
        duplicateId: candidate.id,
        reason: `${source.colorFamily} ${source.subcategory} appears more than once`,
      });
    }
  }

  return duplicates;
};

export const buildWeeklyPlannerPreview = (savedOutfits: OutfitRecommendation[]): WeeklyPlanEntry[] => {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const ranked = [...savedOutfits].sort((a, b) => {
    const aScore = (a.outfitFeedback === 'love' ? 4 : 0) + (a.lastWorn ? -1 : 2) + (a.dateSaved ? 1 : 0);
    const bScore = (b.outfitFeedback === 'love' ? 4 : 0) + (b.lastWorn ? -1 : 2) + (b.dateSaved ? 1 : 0);
    return bScore - aScore;
  });

  return labels.map((dayLabel, index) => {
    const outfit = ranked[index];
    return outfit
      ? {
          dayLabel,
          title: outfit.title,
          note: outfit.recommendedBecause || `Best fit for ${outfit.occasion.toLowerCase()}`,
        }
      : {
          dayLabel,
          title: 'Planner slot open',
          note: 'Generate or save more outfits to auto-fill this day.',
        };
  });
};

export const prioritizeClosetGaps = (items: WardrobeItem[]): WardrobeGap[] => {
  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});
  const familyCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.colorFamily] = (acc[item.colorFamily] ?? 0) + 1;
    return acc;
  }, {});
  const leastFamily = Object.entries(familyCounts).sort((a, b) => a[1] - b[1])[0]?.[0] || 'Neutral';

  const priorities: Array<{ category: Category; threshold: number; itemType: string }> = [
    { category: Category.TOP, threshold: 3, itemType: 'versatile top' },
    { category: Category.BOTTOM, threshold: 3, itemType: 'grounding bottom' },
    { category: Category.SHOES, threshold: 2, itemType: 'everyday shoe' },
    { category: Category.OUTERWEAR, threshold: 2, itemType: 'lightweight layer' },
    { category: Category.ACCESSORIES, threshold: 2, itemType: 'finishing accessory' },
  ];

  return priorities.map(({ category, threshold, itemType }) => {
    const count = categoryCounts[category] ?? 0;
    const deficit = Math.max(0, threshold - count);
    return {
      itemType,
      suggestedColor: leastFamily,
      reasoning: deficit > 0
        ? `Only ${count} ${category} items detected. Adding a ${leastFamily.toLowerCase()} ${itemType} unlocks more outfit combinations.`
        : `${category} coverage is healthy, but a ${leastFamily.toLowerCase()} ${itemType} would still diversify the closet.`,
      priority: (deficit >= 2 ? 'high' : deficit === 1 ? 'medium' : 'low') as WardrobeGap['priority'],
    };
  }).sort((a, b) => ({ high: 3, medium: 2, low: 1 }[b.priority] - { high: 3, medium: 2, low: 1 }[a.priority]));
};

export const buildSyncReadinessSummary = (items: WardrobeItem[], scans: ScanResult[], savedOutfits: OutfitRecommendation[]) => {
  const completeness = [items.length > 0, scans.length > 0, savedOutfits.length > 0].filter(Boolean).length;
  return {
    items: items.length,
    scans: scans.length,
    savedLooks: savedOutfits.length,
    syncReadinessScore: Math.round((completeness / 3) * 100),
  };
};

export const buildProductionReadinessSnapshot = (
  items: WardrobeItem[],
  scans: ScanResult[],
  savedOutfits: OutfitRecommendation[],
): ProductionReadinessSnapshot => {
  const preferenceMemory = buildPreferenceMemory(savedOutfits, items);
  const duplicateCandidates = detectDuplicateCandidates(items);
  const weeklyPlan = buildWeeklyPlannerPreview(savedOutfits);
  const prioritizedGaps = prioritizeClosetGaps(items);
  const syncSummary = buildSyncReadinessSummary(items, scans, savedOutfits);

  const agentCards: ProductionAgentCard[] = [
    {
      id: 'ingestion',
      title: 'Ingestion Agent',
      phase: 'Phase A',
      status: duplicateCandidates.length > 0 ? 'needs_attention' : 'ready',
      headline: duplicateCandidates.length > 0 ? `${duplicateCandidates.length} duplicate candidates to review` : 'Closet ingestion is clean',
      detail: 'Uses duplicate heuristics to keep the wardrobe graph trustworthy before sync and planning.',
      testingNote: 'Heuristic duplicate checks are covered in service tests.',
    },
    {
      id: 'planner',
      title: 'Planner Agent',
      phase: 'Phase B',
      status: weeklyPlan.some((entry) => entry.title !== 'Planner slot open') ? 'ready' : 'building',
      headline: `${weeklyPlan.filter((entry) => entry.title !== 'Planner slot open').length}/5 weekly slots filled`,
      detail: 'Turns saved looks into a habit-forming weekly planning preview.',
      testingNote: 'Planner generation is validated against deterministic fixture inputs.',
    },
    {
      id: 'memory',
      title: 'Memory Agent',
      phase: 'Phase B',
      status: preferenceMemory.lovedOutfitCount > 0 || preferenceMemory.skippedOutfitCount > 0 ? 'ready' : 'building',
      headline: preferenceMemory.topColorFamilies[0] ? `Top signal: ${preferenceMemory.topColorFamilies[0]}` : 'Waiting for more preference signals',
      detail: 'Learns from loved/skipped looks to personalize future recommendations.',
      testingNote: 'Preference memory + reranking behavior are unit tested.',
    },
    {
      id: 'gap',
      title: 'Gap Agent',
      phase: 'Phase C',
      status: prioritizedGaps[0]?.priority === 'high' ? 'needs_attention' : 'ready',
      headline: prioritizedGaps[0] ? `${prioritizedGaps[0].priority.toUpperCase()} priority: ${prioritizedGaps[0].itemType}` : 'No gap detected',
      detail: 'Locally prioritizes the next item most likely to increase outfit coverage.',
      testingNote: 'Gap prioritization rules are exercised in the command-center test suite.',
    },
    {
      id: 'platform',
      title: 'Platform Agent',
      phase: 'Phase D',
      status: syncSummary.syncReadinessScore >= 66 ? 'ready' : 'building',
      headline: `Sync readiness ${syncSummary.syncReadinessScore}/100`,
      detail: 'Tracks whether wardrobe, scan history, and saved looks are complete enough for sync rollout.',
      testingNote: 'Sync summary scoring is validated in service tests.',
    },
  ];

  return {
    duplicateCandidates,
    weeklyPlan,
    prioritizedGaps,
    syncSummary,
    agentCards,
  };
};
