import { describe, expect, it } from 'vitest';
import { WOUND_LABELS, WOUND_PENALTIES, calculateStacking, getWoundLevelInfo, type WoundLevel } from './wounds';

const LEVELS: WoundLevel[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

describe('wound bands', () => {
  it('tiles the damage line with no gap or overlap', () => {
    expect(getWoundLevelInfo(-Infinity).level).toBe(0);
    expect(getWoundLevelInfo(-1).level).toBe(0);
    expect(getWoundLevelInfo(0).level).toBe(1);
    for (let d = 0; d < 40; d++) {
      const here = getWoundLevelInfo(d).level;
      const next = getWoundLevelInfo(d + 1).level;
      expect(next === here || next === here + 1).toBe(true);
    }
    expect(getWoundLevelInfo(28).level).toBe(8);
    expect(getWoundLevelInfo(Infinity).level).toBe(8);
  });

  it('reaches every level', () => {
    const seen = new Set<number>();
    for (let d = -1; d <= 40; d++) seen.add(getWoundLevelInfo(d).level);
    expect([...seen].sort()).toEqual(LEVELS);
  });

  it('never improves the penalty as damage rises', () => {
    expect(LEVELS.map(l => WOUND_PENALTIES[l]))
      .toEqual([...LEVELS.map(l => WOUND_PENALTIES[l])].sort((a, b) => b - a));
  });

  it('labels every level', () => {
    expect(LEVELS.filter(l => !WOUND_LABELS[l]?.label)).toEqual([]);
  });
});

describe('calculateStacking', () => {
  it('jumps to a worse new injury', () => {
    expect(calculateStacking(2, 5).resultingLevel).toBe(5);
  });

  it('raises one for a repeat', () => {
    expect(calculateStacking(3, 3).resultingLevel).toBe(4);
  });

  it('raises one for a slightly lesser injury', () => {
    expect(calculateStacking(3, 2).resultingLevel).toBe(4);
  });

  it('ignores an injury two or more levels lesser', () => {
    expect(calculateStacking(5, 2).resultingLevel).toBe(5);
  });

  it('never exceeds a death blow', () => {
    expect(calculateStacking(8, 8).resultingLevel).toBe(8);
    expect(calculateStacking(7, 7).resultingLevel).toBe(8);
  });

  it('describes every branch', () => {
    for (const [a, b] of [[2, 5], [3, 3], [3, 2], [5, 2]] as [WoundLevel, WoundLevel][]) {
      expect(calculateStacking(a, b).description).toMatch(/\.$/);
    }
  });
});
