import { describe, expect, it } from 'vitest';
import { DIE_POOL_TABLE, getDiePoolEntry } from './diePoolTable';

const VALID_DIE = new Set([4, 6, 8, 10, 12]);

describe('die pool table shape', () => {
  // An attribute value is a cost, and cost is linear in rank: rank = (cost + 40) / 5.
  it('keeps cost linear in rank across the whole range', () => {
    expect(DIE_POOL_TABLE.map(e => e.cost)).toEqual(DIE_POOL_TABLE.map(e => -40 + e.rank * 5));
  });

  it('spans the documented -40 to 60', () => {
    expect([DIE_POOL_TABLE[0].cost, DIE_POOL_TABLE[DIE_POOL_TABLE.length - 1].cost]).toEqual([-40, 60]);
  });

  it('indexes by rank', () => {
    expect(DIE_POOL_TABLE.map(e => e.rank)).toEqual(DIE_POOL_TABLE.map((_, i) => i));
  });

  it('rises in maximum without ever falling', () => {
    const maxes = DIE_POOL_TABLE.map(e => e.pool.max);
    expect(maxes.every((m, i) => i === 0 || m > maxes[i - 1])).toBe(true);
  });

  it('never lets the minimum fall', () => {
    const mins = DIE_POOL_TABLE.map(e => e.pool.min);
    expect(mins.every((m, i) => i === 0 || m >= mins[i - 1])).toBe(true);
  });

  it('uses only real die sizes', () => {
    const bad = DIE_POOL_TABLE.flatMap(e => e.pool.dice).filter(d => !VALID_DIE.has(d));
    expect(bad).toEqual([]);
  });

  it('uses each notation once', () => {
    const n = DIE_POOL_TABLE.map(e => e.pool.notation);
    expect(new Set(n).size).toBe(n.length);
  });

  it('only gives the divisor to the bottom rank', () => {
    expect(DIE_POOL_TABLE.filter(e => e.pool.divisor).map(e => e.rank)).toEqual([0]);
  });
});

describe('getDiePoolEntry', () => {
  it('returns an exact match unchanged', () => {
    expect(getDiePoolEntry(0).rank).toBe(8);
  });

  it('clamps below the table', () => {
    expect(getDiePoolEntry(-999).rank).toBe(0);
  });

  it('clamps above the table', () => {
    expect(getDiePoolEntry(999).rank).toBe(20);
  });

  it('rounds down between steps, never up', () => {
    expect(getDiePoolEntry(-22).rank).toBe(3);   // between -25 and -20
    expect(getDiePoolEntry(7).rank).toBe(9);     // between 5 and 10
  });

  it('always returns a row', () => {
    for (let cost = -60; cost <= 80; cost++) {
      expect(getDiePoolEntry(cost)).toBeDefined();
    }
  });
});
