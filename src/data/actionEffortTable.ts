import type { EffortBand } from '../types/resolution';
import type { DiePool } from '../types/character';

export const ACTION_EFFORT_TABLE: Record<string, Record<EffortBand, number | null>> = {
  'd4': { green: null, yellow: 4, orange: null, red: 8 },
  'd6': { green: null, yellow: 4, orange: 8, red: 12 },
  'd8': { green: 4, yellow: 8, orange: 12, red: 16 },
  'd10': { green: 4, yellow: 8, orange: 16, red: 20 },
  'd12': { green: 4, yellow: 12, orange: 20, red: 24 },
  'd12 + d4': { green: 8, yellow: 16, orange: 24, red: 32 },
  'd12 + d6': { green: 8, yellow: 20, orange: 28, red: 36 },
  'd12 + d8': { green: 8, yellow: 20, orange: 32, red: 40 },
  'd12 + d10': { green: 12, yellow: 24, orange: 36, red: 44 },
  '2d12': { green: 12, yellow: 24, orange: 40, red: 48 },
  '2d12 + d4': { green: 12, yellow: 28, orange: 44, red: 56 },
  '2d12 + d6': { green: 16, yellow: 32, orange: 48, red: 60 },
  '2d12 + d8': { green: 16, yellow: 32, orange: 52, red: 64 },
  '2d12 + d10': { green: 16, yellow: 36, orange: 56, red: 68 },
  '3d12': { green: 16, yellow: 36, orange: 60, red: 72 },
  '3d12 + d4': { green: 20, yellow: 44, orange: 64, red: 80 },
  '3d12 + d6': { green: 20, yellow: 44, orange: 68, red: 84 },
  '3d12 + d8': { green: 24, yellow: 48, orange: 72, red: 88 },
  '3d12 + d10': { green: 24, yellow: 48, orange: 76, red: 92 },
  '4d12': { green: 24, yellow: 52, orange: 80, red: 96 },
};

export const SURGE_COST: Record<EffortBand, number> = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3,
};

export const SCALE_TABLE: Record<number, number> = {
  4: 0.5,
  8: 1,
  12: 1.5,
  16: 2,
  20: 3,
  24: 4.5,
  28: 6,
  32: 9,
  36: 12,
  40: 18,
  44: 35,
  48: 70,
  52: 150,
  56: 300,
  60: 600,
  64: 1200,
  68: 2500,
  72: 5000,
  76: 10000,
  80: 20000,
  84: 38000,
  88: 75000,
  92: 150000,
  96: 300000,
};

export function resultToScale(result: number): number | null {
  // Below minimum threshold
  if (result < 4) return null;

  const thresholds = Object.keys(SCALE_TABLE).map(Number).sort((a, b) => a - b);

  // Exact match — return defined value
  if (SCALE_TABLE[result] !== undefined) {
    return SCALE_TABLE[result];
  }

  // Find bracket for interpolation
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (result < thresholds[i + 1]) {
      const lower = thresholds[i];
      const upper = thresholds[i + 1];
      const lowerScale = SCALE_TABLE[lower];
      const upperScale = SCALE_TABLE[upper];
      const fraction = (result - lower) / (upper - lower);
      return lowerScale * Math.pow(upperScale / lowerScale, fraction);
    }
  }

  // Above maximum — extrapolate using doubling every 4 points
  const maxThreshold = thresholds[thresholds.length - 1];
  const maxScale = SCALE_TABLE[maxThreshold];
  const extraFours = (result - maxThreshold) / 4;
  return maxScale * Math.pow(2, extraFours);
}

export function scaleToResult(scale: number): number | null {
  for (const [threshold, scaleVal] of Object.entries(SCALE_TABLE)) {
    if (scaleVal === scale) {
      return parseInt(threshold);
    }
  }
  return null;
}

export function normalizeNotation(notation: string): string {
  return notation.replace(/\s+/g, ' ').trim();
}

export function isBandAvailable(pool: DiePool, band: EffortBand): boolean {
  const notation = normalizeNotation(pool.notation);
  const tableEntry = ACTION_EFFORT_TABLE[notation];
  if (!tableEntry) return false;
  return tableEntry[band] !== null;
}

export function getScaleForPool(pool: DiePool): number | null {
  // Get base notation (strip divisor suffix if present)
  const baseNotation = pool.divisor 
    ? pool.notation.replace(/\/\d+$/, '')
    : pool.notation;
  
  const tableEntry = ACTION_EFFORT_TABLE[baseNotation];
  if (!tableEntry) return null;
  
  const threshold = tableEntry.orange ?? tableEntry.yellow ?? tableEntry.red;
  if (threshold === null || threshold === undefined) return null;
  
  let scale = SCALE_TABLE[threshold] ?? null;
  if (scale === null) return null;
  
  // Apply divisor if present
  if (pool.divisor) {
    scale = scale / pool.divisor;
  }
  
  return scale;
}