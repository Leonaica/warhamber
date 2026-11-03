import { describe, it, expect } from 'vitest';
import type { AspectName, FunctionName } from '../types/character';
import { solve, canAdd, attributeRank, leanBounds, toRatings, TOLERANCE } from './attributeSolver';

const entry = (f: FunctionName, a: AspectName, rank: number) => ({ function: f, aspect: a, rank });

describe('solve', () => {
  it('reproduces a single entered attribute', () => {
    const s = solve([entry('Force', 'Form', 12)], 0);
    expect(attributeRank(s, 'Force', 'Form')).toBe(12);
  });

  it('keeps the functions summing to four times the lean', () => {
    const s = solve([entry('Force', 'Form', 12)], 3);
    const sum = Object.values(s.functions).reduce((a, b) => a + b, 0);
    expect(sum).toBe(12);
  });

  it('lean moves the split without moving the attribute', () => {
    const body = solve([entry('Force', 'Form', 12)], -3);
    const will = solve([entry('Force', 'Form', 12)], 3);
    expect(body.aspects.Form).toBeGreaterThan(will.aspects.Form);
    expect(attributeRank(body, 'Force', 'Form')).toBe(attributeRank(will, 'Force', 'Form'));
  });

  it('reproduces a consistent six-attribute set exactly', () => {
    const base = solve([entry('Force', 'Form', 12)], 0);
    const entries = [
      entry('Force', 'Form', 12),
      entry('Resist', 'Flesh', 9),
      entry('Finesse', 'Form', 10),
      entry('Finesse', 'Mind', 11),
      entry('Perceive', 'Spirit', 8),
      entry('Force', 'Mind', 14),
    ];
    const s = solve(entries, 0);
    expect(base).toBeTruthy();
    expect(s.maxResidual).toBeLessThanOrEqual(TOLERANCE);
  });

  it('clamps to the rating scale', () => {
    const s = solve([entry('Force', 'Form', 20), entry('Resist', 'Form', 20)], 0);
    for (const v of Object.values(s.functions)) expect(v).toBeLessThanOrEqual(6);
    for (const v of Object.values(s.aspects)) expect(v).toBeLessThanOrEqual(6);
  });

  it('converts to rating values in fives', () => {
    const r = toRatings(solve([entry('Force', 'Form', 12)], 0));
    for (const v of Object.values(r.functions)) expect(Math.abs(v % 5)).toBe(0);
    for (const v of Object.values(r.aspects)) expect(Math.abs(v % 5)).toBe(0);
  });
});

describe('canAdd', () => {
  it('admits anything while the system is underdetermined', () => {
    expect(canAdd([entry('Force', 'Form', 12)], entry('Resist', 'Flesh', 3), 0)).toBe(true);
  });

  it('admits a consistent eighth attribute', () => {
    const s = solve([entry('Force', 'Form', 12)], 0);
    const entries = [
      entry('Force', 'Form', 12),
      entry('Resist', 'Flesh', 9),
      entry('Finesse', 'Form', 10),
      entry('Finesse', 'Mind', 11),
      entry('Perceive', 'Spirit', 8),
      entry('Force', 'Mind', 14),
      entry('Resist', 'Mind', 6),
    ];
    const consistent = attributeRank(s, 'Perceive', 'Form');
    expect(canAdd(entries, entry('Perceive', 'Form', consistent), 0)).toBe(true);
  });

  it('rejects an attribute that contradicts a pinned system', () => {
    const entries = [
      entry('Force', 'Form', 12),
      entry('Resist', 'Flesh', 9),
      entry('Finesse', 'Form', 10),
      entry('Finesse', 'Mind', 11),
      entry('Perceive', 'Spirit', 8),
      entry('Force', 'Mind', 14),
      entry('Resist', 'Mind', 6),
    ];
    const s = solve(entries, 0);
    const actual = attributeRank(s, 'Perceive', 'Form');
    expect(canAdd(entries, entry('Perceive', 'Form', actual + 5), 0)).toBe(false);
  });
});

describe('leanBounds', () => {
  it('starts wider than it ends once attributes are pinned', () => {
    const empty = leanBounds([]);
    const pinned = leanBounds([
      entry('Force', 'Form', 12),
      entry('Resist', 'Flesh', 9),
      entry('Finesse', 'Mind', 11),
    ]);
    expect(empty.max - empty.min).toBeGreaterThan(pinned.max - pinned.min);
  });

  it('keeps the solution inside tolerance at both ends', () => {
    const entries = [
      entry('Force', 'Form', 12),
      entry('Resist', 'Flesh', 9),
      entry('Finesse', 'Mind', 11),
      entry('Perceive', 'Spirit', 8),
    ];
    const bounds = leanBounds(entries);
    expect(solve(entries, bounds.min).maxResidual).toBeLessThanOrEqual(TOLERANCE);
    expect(solve(entries, bounds.max).maxResidual).toBeLessThanOrEqual(TOLERANCE);
  });

  it('never returns an inverted range', () => {
    const bounds = leanBounds([
      entry('Force', 'Form', 20),
      entry('Resist', 'Form', 20),
      entry('Finesse', 'Form', 20),
    ]);
    expect(bounds.min).toBeLessThanOrEqual(bounds.max);
  });
});
