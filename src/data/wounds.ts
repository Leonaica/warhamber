export type WoundLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface WoundLevelInfo {
  level: WoundLevel;
  label: string;
  emoji: string;
  minDamage: number;
  maxDamage: number;
  penalty: number;
}

const WOUND_LEVELS: WoundLevelInfo[] = [
  { level: 0, label: 'None', emoji: '', minDamage: -Infinity, maxDamage: -1, penalty: 0 },
  { level: 1, label: 'Grazed', emoji: '⚠️', minDamage: 0, maxDamage: 3, penalty: 0 },
  { level: 2, label: 'Scrape', emoji: '🟢', minDamage: 4, maxDamage: 7, penalty: 0 },
  { level: 3, label: 'Wound', emoji: '🟡', minDamage: 8, maxDamage: 11, penalty: -1 },
  { level: 4, label: 'Bleeding Wound', emoji: '🟠', minDamage: 12, maxDamage: 15, penalty: -2 },
  { level: 5, label: 'Life-Threatening', emoji: '🔴', minDamage: 16, maxDamage: 19, penalty: -3 },
  { level: 6, label: 'Maimed', emoji: '🦿', minDamage: 20, maxDamage: 23, penalty: -4 },
  { level: 7, label: 'Mortal Wound', emoji: '☠️', minDamage: 24, maxDamage: 27, penalty: -5 },
  { level: 8, label: 'Death Blow', emoji: '⚰️', minDamage: 28, maxDamage: Infinity, penalty: -12 },
];

// Convenience maps for quick lookup
export const WOUND_LABELS: Record<WoundLevel, { label: string; emoji: string }> = Object.fromEntries(
  WOUND_LEVELS.map(wl => [wl.level, { label: wl.label, emoji: wl.emoji }])
) as Record<WoundLevel, { label: string; emoji: string }>;

export const WOUND_PENALTIES: Record<WoundLevel, number> = Object.fromEntries(
  WOUND_LEVELS.map(wl => [wl.level, wl.penalty])
) as Record<WoundLevel, number>;

export function getWoundLevelInfo(damage: number): WoundLevelInfo {
  for (const wl of WOUND_LEVELS) {
    if (damage >= wl.minDamage && damage <= wl.maxDamage) {
      return wl;
    }
  }
  return WOUND_LEVELS[WOUND_LEVELS.length - 1];
}

export function calculateStacking(currentLevel: WoundLevel, newLevel: WoundLevel): {
  resultingLevel: WoundLevel;
  description: string;
} {
  // If the new injury level is higher, increase to match
  if (newLevel > currentLevel) {
    return {
      resultingLevel: newLevel,
      description: `New injury (${WOUND_LABELS[newLevel].label}) is worse than current (${WOUND_LABELS[currentLevel].label}). Worsens to ${WOUND_LABELS[newLevel].label}.`,
    };
  }
  // If the new injury level is equal or one level lower, raise by +1
  if (newLevel === currentLevel || newLevel === currentLevel - 1) {
    const newResult = Math.min(currentLevel + 1, 8) as WoundLevel;
    return {
      resultingLevel: newResult,
      description: `Second ${WOUND_LABELS[newLevel].label} worsens condition to ${WOUND_LABELS[newResult].label}.`,
    };
  }
  // Injuries two or more levels less significant don't change current level
  return {
    resultingLevel: currentLevel,
    description: `${WOUND_LABELS[newLevel].label} is too minor to worsen a ${WOUND_LABELS[currentLevel].label}. No change.`,
  };
}