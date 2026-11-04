import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DiePool } from '../types/character';
import type { EffortBand, ResolutionContext } from '../types/resolution';
import {
  calculatePreviewResult, getSurgeCost, isForegoneConclusion,
  resolveContest, resolveTest,
} from './resolution';

const pool = (notation: string, dice: number[], divisor?: number): DiePool =>
  ({ dice, notation, min: 1, max: Math.max(...dice), ...(divisor ? { divisor } : {}) });

const D8 = pool('d8', [8]);

const ctx = (over: Partial<ResolutionContext> = {}): ResolutionContext => ({
  attributePool: D8,
  poolRank: 3,
  skillBonus: 0,
  woundPenalty: 0,
  situationalModifier: 0,
  isContest: false,
  targetNumber: 4,
  approach: 'baseline',
  ...over,
});

/** Deterministic dice: each call consumes the next queued value. */
function dice(...values: number[]) {
  const spy = vi.spyOn(Math, 'random');
  for (const v of values) spy.mockReturnValueOnce(v);
  spy.mockReturnValue(0.5);
  return spy;
}

afterEach(() => vi.restoreAllMocks());

// d8 bands: green 4, yellow 8, orange 12, red 16.
describe('situational modifier', () => {
  it('lands in the result on the baseline approach', () => {
    expect(resolveTest(ctx({ situationalModifier: 3 })).result).toBe(7);
  });

  it('lands in the result on a surge', () => {
    expect(resolveTest(ctx({ approach: 'surge', surgeBand: 'yellow', situationalModifier: 3 })).result).toBe(11);
  });

  it('lands in the result on a roll', () => {
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', situationalModifier: 3 })).result).toBe(8);
  });

  it('is recorded in the breakdown', () => {
    expect(resolveTest(ctx({ situationalModifier: 3 })).calculationBreakdown?.situationalModifier).toBe(3);
  });

  it('applies a negative modifier too', () => {
    expect(resolveTest(ctx({ situationalModifier: -2 })).result).toBe(2);
  });
});

describe('capping', () => {
  it('caps at the red maximum and says so', () => {
    const r = resolveTest(ctx({ situationalModifier: 20 }));
    expect(r.result).toBe(16);
    expect(r.capped).toBe(true);
  });

  it('does not cap below it', () => {
    expect(resolveTest(ctx({ situationalModifier: 11 })).capped).toBe(false);
  });
});

describe('critical failure', () => {
  it('treats a 2 as the minimum face at Poor', () => {
    dice(0.2, 0);
    expect(resolveTest(ctx({ approach: 'roll', skillBonus: -1 })).rollDetails?.criticalFailureCheck?.allMinimum).toBe(true);
  });

  it('does not treat a 2 as the minimum face at Average', () => {
    dice(0.2);
    expect(resolveTest(ctx({ approach: 'roll' })).rollDetails?.criticalFailureCheck).toBeUndefined();
  });

  it('treats a 3 as the minimum face only at Terrible', () => {
    dice(0.3, 0);
    expect(resolveTest(ctx({ approach: 'roll', skillBonus: -2 })).rollDetails?.criticalFailureCheck?.allMinimum).toBe(true);
    vi.restoreAllMocks();
    dice(0.3);
    expect(resolveTest(ctx({ approach: 'roll', skillBonus: -1 })).rollDetails?.criticalFailureCheck).toBeUndefined();
  });

  it('confirms only on a 1', () => {
    dice(0.2, 0);
    expect(resolveTest(ctx({ approach: 'roll', skillBonus: -1 })).criticalFailure).toBe(true);
  });

  it('withholds it on any other confirmation', () => {
    dice(0.2, 0.5);
    expect(resolveTest(ctx({ approach: 'roll', skillBonus: -1 })).criticalFailure).toBe(false);
  });
});

describe('advantage dice', () => {
  it('grants none at rank 5', () => {
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', isContest: true, poolRank: 5, opponentRank: 5 }))
      .rollDetails?.advantageDice).toBeUndefined();
  });

  it('grants none at rank 5 even against rank 1', () => {
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', isContest: true, poolRank: 5, opponentRank: 1 }))
      .rollDetails?.advantageDice).toBeUndefined();
  });

  it('grants the rank difference above 5', () => {
    dice(0.5, 0.5, 0.5, 0.5, 0.5, 0.5);
    expect(resolveTest(ctx({ approach: 'roll', isContest: true, poolRank: 9, opponentRank: 5 }))
      .rollDetails?.advantageDice).toBe(4);
  });
});

describe('successes', () => {
  it('awards one at the target number', () => {
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', targetNumber: 4 })).successes).toBe(1);
  });

  it('awards none one below it', () => {
    dice(0.2);
    expect(resolveTest(ctx({ approach: 'roll', targetNumber: 4 })).successes).toBe(0);
  });

  it('adds one per further 4 over it', () => {
    expect(resolveTest(ctx({ situationalModifier: 8 })).successes).toBe(3);
  });

  it('awards none in a contest', () => {
    expect(resolveTest(ctx({ situationalModifier: 8, isContest: true })).successes).toBe(0);
  });
});

describe('resolveContest', () => {
  it('ties when both sides crit-fail', () => {
    dice(0, 0, 0, 0);
    const r = resolveContest(
      ctx({ approach: 'roll', skillBonus: -1, targetNumber: 0 }),
      ctx({ approach: 'roll', skillBonus: -1, targetNumber: 0 }),
    );
    expect(r.winner).toBe('tie');
    expect(r.actor.successes).toBe(0);
  });

  it('loses when only the actor crit-fails', () => {
    dice(0, 0, 0.5);
    const r = resolveContest(
      ctx({ approach: 'roll', skillBonus: -1, targetNumber: 0 }),
      ctx({ approach: 'roll', targetNumber: 0 }),
    );
    expect(r.winner).toBe('opponent');
  });

  it('awards contest successes by margin', () => {
    // 4 + 20 caps at the red maximum 16, against a baseline 4: margin 12.
    const r = resolveContest(
      ctx({ approach: 'baseline', situationalModifier: 20 }),
      ctx({ approach: 'baseline' }),
    );
    expect(r.actor.successes).toBe(4);
    expect(r.winner).toBe('actor');
  });
});

describe('calculatePreviewResult', () => {
  it('includes the situational modifier', () => {
    expect(calculatePreviewResult({
      attributePool: D8, band: 'green', approach: 'baseline',
      skillBonus: 0, woundPenalty: 0, situationalModifier: 2,
    })?.result).toBe(6);
  });

  it('returns null for a band the pool cannot reach', () => {
    expect(calculatePreviewResult({
      attributePool: pool('d4', [4]), band: 'green', approach: 'baseline',
      skillBonus: 0, woundPenalty: 0, situationalModifier: 0,
    })).toBeNull();
  });
});

describe('foregone conclusions', () => {
  it('is foregone at 4 ranks of advantage', () => {
    expect(isForegoneConclusion(9, 5).isForegone).toBe(true);
  });

  it('is not foregone at 3', () => {
    expect(isForegoneConclusion(8, 5).isForegone).toBe(false);
  });

  it('names the opponent when they are ahead', () => {
    expect(isForegoneConclusion(5, 9).winner).toBe('opponent');
  });
});

describe('surge costs', () => {
  it('charges by band', () => {
    const bands: EffortBand[] = ['green', 'yellow', 'orange', 'red'];
    expect(bands.map(getSurgeCost)).toEqual([0, 1, 2, 3]);
  });
});
