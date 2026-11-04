import { describe, expect, it } from 'vitest';
import { RATING_SCALE } from '../types/character';
import { getDefaultRating } from './defaultRating';

describe('getDefaultRating', () => {
  it('is zero for any positive limit', () => {
    expect(getDefaultRating(0)).toBe(0);
    expect(getDefaultRating(250)).toBe(0);
  });

  it('steps down as the limit tightens', () => {
    expect(getDefaultRating(-1)).toBe(-5);
    expect(getDefaultRating(-41)).toBe(-10);
    expect(getDefaultRating(-81)).toBe(-15);
  });

  it('never rises as the limit falls', () => {
    let prev = getDefaultRating(0);
    for (let limit = 0; limit >= -200; limit -= 5) {
      const v = getDefaultRating(limit);
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });

  it('always returns a rating on the scale', () => {
    for (let limit = 200; limit >= -300; limit -= 10) {
      expect(RATING_SCALE).toContain(getDefaultRating(limit));
    }
  });
});
