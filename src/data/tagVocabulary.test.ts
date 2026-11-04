import { describe, expect, it } from 'vitest';
import { conditionMet, resolveAmount, scale, type AmountSources, type RollFacts } from './tagVocabulary';

const SRC: AmountSources = { strengthRank: 8, presenceRank: 4, armorValue: 12 };
const NONE: RollFacts = { raises: 0, allLow: false, aiming: false };
const THREE: RollFacts = { raises: 3, allLow: false, aiming: false };

describe('resolveAmount', () => {
  it('reads the variable value', () => expect(resolveAmount('x', 5, SRC)).toBe(5));
  it('treats a missing variable as zero', () => expect(resolveAmount('x', undefined, SRC)).toBe(0));
  it('reads Strength rank', () => expect(resolveAmount('strength', undefined, SRC)).toBe(8));
  it('reads Presence rank', () => expect(resolveAmount('presence', undefined, SRC)).toBe(4));
  it('reads the armor value', () => expect(resolveAmount('armorValue', undefined, SRC)).toBe(12));
  it('zeroes the death-blow sentinel', () => expect(resolveAmount('deathBlow', undefined, SRC)).toBe(0));
  it('passes a literal through', () => expect(resolveAmount(7, undefined, SRC)).toBe(7));
  it('treats no amount as zero', () => expect(resolveAmount(undefined, 5, SRC)).toBe(0));
});

describe('scale', () => {
  it('passes a flat value through', () => expect(scale(3, 'flat', THREE)).toBe(3));
  it('passes through when no scale is declared', () => expect(scale(3, undefined, THREE)).toBe(3));
  it('multiplies per success, counting the first', () => expect(scale(2, 'success', THREE)).toBe(8));
  it('multiplies per raise', () => expect(scale(2, 'raise', THREE)).toBe(6));
  // 'success' clamps at zero through max(0, raises + 1); 'raise' is a bare
  // multiply and goes negative. Raises are never negative in play, so this
  // pins the difference rather than a reachable case.
  it('clamps success to zero but lets raise go negative', () => {
    expect(scale(2, 'success', { raises: -2, allLow: false })).toBe(0);
    expect(scale(2, 'raise', { raises: -2, allLow: false })).toBe(-4);
  });
});

describe('conditionMet', () => {
  it('passes with no condition', () => expect(conditionMet(undefined, NONE)).toBe(true));
  it('fails below a raise threshold', () => expect(conditionMet({ raisesAtLeast: 2 }, NONE)).toBe(false));
  it('passes at the threshold', () => expect(conditionMet({ raisesAtLeast: 2 }, THREE)).toBe(true));
  it('fails when aiming is required and absent', () => expect(conditionMet({ aiming: true }, NONE)).toBe(false));
  it('fails when aiming is forbidden and present', () => {
    expect(conditionMet({ aiming: false }, { raises: 0, allLow: false, aiming: true })).toBe(false);
  });
  it('matches allLow', () => {
    expect(conditionMet({ allLow: true }, { raises: 0, allLow: true })).toBe(true);
    expect(conditionMet({ allLow: true }, NONE)).toBe(false);
  });
  it('requires every stated condition', () => {
    expect(conditionMet({ raisesAtLeast: 2, aiming: true }, THREE)).toBe(false);
  });
});
