import { describe, expect, it } from 'vitest';
import type { EffortBand } from '../types/resolution';
import { DIE_POOL_TABLE } from './diePoolTable';
import {
  ACTION_EFFORT_TABLE, SURGE_COST, getScaleForPool, isBandAvailable, normalizeNotation, resultToScale,
} from './actionEffortTable';

const BANDS: EffortBand[] = ['green', 'yellow', 'orange', 'red'];

describe('effort table shape', () => {
  it('has a row for every die pool', () => {
    expect(DIE_POOL_TABLE.map(e => e.pool.notation).filter(n => !ACTION_EFFORT_TABLE[n])).toEqual([]);
  });

  it('has no orphan rows', () => {
    const known = new Set(DIE_POOL_TABLE.map(e => e.pool.notation));
    expect(Object.keys(ACTION_EFFORT_TABLE).filter(n => !known.has(n))).toEqual([]);
  });

  it('ascends through the non-null thresholds of every row', () => {
    const bad: string[] = [];
    for (const [notation, row] of Object.entries(ACTION_EFFORT_TABLE)) {
      const set = BANDS.map(b => row[b]).filter((v): v is number => v !== null);
      if (!set.every((v, i) => i === 0 || v > set[i - 1])) bad.push(notation);
    }
    expect(bad).toEqual([]);
  });

  // getRedMaximum falls back to twice the pool maximum, so the table must agree.
  it('sets red to twice the pool maximum', () => {
    const bad = DIE_POOL_TABLE
      .filter(e => ACTION_EFFORT_TABLE[e.pool.notation].red !== e.pool.max * 2)
      .map(e => e.pool.notation);
    expect(bad).toEqual([]);
  });
});

describe('surge cost', () => {
  it('charges one per band above baseline', () => {
    expect(BANDS.map(b => SURGE_COST[b])).toEqual([0, 1, 2, 3]);
  });
});

describe('normalizeNotation', () => {
  it('collapses whitespace', () => {
    expect(normalizeNotation('  d12   +   d4 ')).toBe('d12 + d4');
  });
});

describe('resultToScale', () => {
  it('is null below the minimum', () => {
    expect(resultToScale(0)).toBeNull();
    expect(resultToScale(3)).toBeNull();
  });

  it('rises without ever falling', () => {
    let prev = -Infinity;
    for (let r = 4; r <= 200; r++) {
      const v = resultToScale(r) ?? 0;
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('doubles per four points above the top of the table', () => {
    const top = resultToScale(96)!;
    expect(resultToScale(100)).toBeCloseTo(top * 2, 5);
    expect(resultToScale(104)).toBeCloseTo(top * 4, 5);
  });
});

describe('band availability', () => {
  it('reports the nulls on the smallest pools', () => {
    expect(isBandAvailable(DIE_POOL_TABLE[0].pool, 'green')).toBe(false);
    expect(isBandAvailable(DIE_POOL_TABLE[0].pool, 'red')).toBe(true);
    expect(isBandAvailable(DIE_POOL_TABLE[3].pool, 'green')).toBe(true);
  });
});

describe('getScaleForPool', () => {
  it('halves the sub-scale fallbacks by the divisor', () => {
    expect(getScaleForPool(DIE_POOL_TABLE[0].pool, 'green')).toBeCloseTo(0.125, 5);
    expect(getScaleForPool(DIE_POOL_TABLE[0].pool, 'orange')).toBeCloseTo(0.35, 5);
  });

  it('halves a real threshold by the divisor', () => {
    expect(getScaleForPool(DIE_POOL_TABLE[0].pool, 'red')).toBeCloseTo(0.5, 5);
  });

  it('returns the table scale for a reachable band', () => {
    expect(getScaleForPool(DIE_POOL_TABLE[3].pool, 'green')).toBe(0.5);
  });

  it('falls back to 0.25 for a green band the pool cannot reach', () => {
    expect(getScaleForPool(DIE_POOL_TABLE[1].pool, 'green')).toBe(0.25);
  });

  it('returns null for a pool with no row at all', () => {
    expect(getScaleForPool({ dice: [7], notation: 'd7', min: 1, max: 7 }, 'green')).toBeNull();
  });
});
