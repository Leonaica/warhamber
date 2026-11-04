import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DiePool } from '../types/character';
import type { EffortBand, ResolutionContext } from '../types/resolution';
import {
  calculatePreviewResult, getSurgeCost, isForegoneConclusion,
  resolveContest, resolveTest, rollSimplePool,
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

describe('wound and skill basis', () => {
  it('multiplies the wound penalty by the dice count', () => {
    const r = resolveTest(ctx({ woundPenalty: -2 }));
    expect(r.result).toBe(2);
    expect(r.calculationBreakdown?.woundPenalty).toBe(-2);
  });

  it('multiplies the wound penalty by the dice count on a surge too', () => {
    expect(resolveTest(ctx({ approach: 'surge', surgeBand: 'yellow', woundPenalty: -2 })).result).toBe(6);
  });

  // A surge counts as four dice for skill regardless of how many dice the pool
  // actually has. The pool here is a single d8, so this cannot pass by accident.
  it('multiplies the skill bonus by four on a surge, not by the pool size', () => {
    expect(resolveTest(ctx({ approach: 'surge', surgeBand: 'yellow', skillBonus: 1 })).result).toBe(12);
  });

  it('multiplies the skill bonus by the real dice count on a roll', () => {
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', skillBonus: 1 })).result).toBe(6);
  });
});

describe('missing bands', () => {
  it('returns a zero result on a baseline the pool cannot reach', () => {
    const r = resolveTest(ctx({ attributePool: pool('d4÷2', [4], 2), approach: 'baseline' }));
    expect(r.result).toBe(0);
    expect(r.successes).toBe(0);
    expect(r.calculationBreakdown).toBeUndefined();
  });

  it('returns a zero result on a surge onto a null band', () => {
    const r = resolveTest(ctx({ attributePool: pool('d4', [4]), approach: 'surge', surgeBand: 'orange' }));
    expect(r.result).toBe(0);
    expect(r.successes).toBe(0);
  });
});

describe('advantage when behind', () => {
  it('grants none and never a negative count', () => {
    dice(0.5);
    const r = resolveTest(ctx({ approach: 'roll', isContest: true, poolRank: 3, opponentRank: 9 }));
    expect(r.rollDetails?.advantageDice).toBeUndefined();
  });
});

describe('advantage on a d12 pool', () => {
  it('keeps the highest roll and records the discards', () => {
    dice(0.1, 0.2, 0.3, 0.4, 0.5);   // 2, 3, 4, 5, 7
    const r = resolveTest(ctx({
      approach: 'roll', isContest: true, poolRank: 9, opponentRank: 5,
      attributePool: pool('d12', [12]),
    }));
    expect(r.rollDetails?.keptRolls).toHaveLength(1);
    expect(r.rollDetails?.keptRolls?.[0].value).toBe(7);
    expect(r.rollDetails?.discardedRolls).toHaveLength(4);
    expect(r.result).toBe(7);
  });
});

describe('explosions', () => {
  it('explodes once and records both faces', () => {
    dice(0.99);                      // d6 → 6, explodes, then the 0.5 default → 4
    const r = resolveTest(ctx({ approach: 'roll', attributePool: pool('d6', [6]) }));
    expect(r.rollDetails?.rolls).toEqual([6]);
    expect(r.rollDetails?.explosions[0].rolls).toEqual([6, 4]);
    expect(r.rollDetails?.explosions[0].dieIndex).toBe(0);
  });

  it('does not chain a second explosion', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99);  // every face maxes
    const r = resolveTest(ctx({ approach: 'roll', attributePool: pool('d6', [6]) }));
    expect(r.rollDetails?.explosions[0].rolls).toEqual([6, 6]);
    spy.mockRestore();
  });
});

describe('critical failure against a large modifier', () => {
  it('zeroes the result so the bonus cannot carry it', () => {
    dice(0.1, 0);                    // 1, confirmation 1
    const r = resolveTest(ctx({ approach: 'roll', skillBonus: -1, situationalModifier: 20 }));
    expect(r.result).toBe(0);
    expect(r.criticalFailure).toBe(true);
    expect(r.successes).toBe(0);
    expect(r.band).toBeNull();
  });

  it('still records what was rolled', () => {
    dice(0.1, 0);
    const r = resolveTest(ctx({ approach: 'roll', skillBonus: -1, situationalModifier: 20 }));
    expect(r.rollDetails?.rolls).toEqual([1]);
    expect(r.calculationBreakdown?.situationalModifier).toBe(20);
    expect(r.calculationBreakdown?.finalResult).toBe(0);
  });

  it('hands a defence no TN above the floor', () => {
    dice(0.1, 0);
    expect(resolveTest(ctx({ approach: 'roll', skillBonus: -1, situationalModifier: 20 })).result).toBeLessThan(4);
  });

  it('loses a contest outright', () => {
    dice(0, 0, 0.5);
    const r = resolveContest(
      ctx({ approach: 'roll', skillBonus: -1, situationalModifier: 30, targetNumber: 0 }),
      ctx({ approach: 'roll', targetNumber: 0 }),
    );
    expect(r.winner).toBe('opponent');
    expect(r.actor.successes).toBe(0);
    expect(r.actor.result).toBe(0);
  });
});

describe('contest edge cases', () => {
  it('wins when only the opponent crit-fails', () => {
    dice(0.5, 0, 0);
    const r = resolveContest(
      ctx({ approach: 'roll', targetNumber: 0 }),
      ctx({ approach: 'roll', skillBonus: -1, targetNumber: 0 }),
    );
    expect(r.winner).toBe('actor');
  });

  it('ties on equal results', () => {
    const r = resolveContest(ctx({ approach: 'baseline' }), ctx({ approach: 'baseline' }));
    expect(r.winner).toBe('tie');
    expect(r.margin).toBe(0);
  });

  it('never enforces a foregone conclusion', () => {
    const r = resolveContest(
      ctx({ approach: 'baseline', poolRank: 20 }),
      ctx({ approach: 'baseline', poolRank: 1 }),
    );
    expect(r.foregoneEnforced).toBe(false);
  });

  it('zeroes the successes resolveTest reports on its own', () => {
    expect(resolveTest(ctx({ situationalModifier: 12, isContest: true })).successes).toBe(0);
  });
});

describe('band boundaries', () => {
  // The baseline approach is the green band by definition, so its band never
  // tracks the total — only a roll derives one.
  it('always reports green for the baseline, however high the total', () => {
    expect(resolveTest(ctx({ situationalModifier: 30 })).result).toBe(16);
    expect(resolveTest(ctx({ situationalModifier: 30 })).band).toBe('green');
  });

  // d8 bands are green 4, yellow 8, orange 12, red 16; a 5 is rolled each time.
  it('lands on the band at exactly its threshold', () => {
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', situationalModifier: 3 })).band).toBe('yellow');
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', situationalModifier: 7 })).band).toBe('orange');
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', situationalModifier: 11 })).band).toBe('red');
  });

  it('stays green below the first threshold', () => {
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll' })).band).toBe('green');
  });

  it('reports red for a capped result', () => {
    dice(0.5);
    expect(resolveTest(ctx({ approach: 'roll', situationalModifier: 30 })).band).toBe('red');
  });
});

describe('rollSimplePool', () => {
  it('sums the dice', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);   // d8 → 5, d4 → 3
    expect(rollSimplePool(pool('d8 + d4', [8, 4]))).toBe(8);
  });

  it('divides and rounds up when the pool has a divisor', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);  // d4 → 4
    expect(rollSimplePool(pool('d4÷2', [4], 2))).toBe(2);
  });
});

describe('foregone conclusions at low rank', () => {
  it('is not foregone when both are rank 5 or less', () => {
    expect(isForegoneConclusion(5, 1).isForegone).toBe(false);
  });

  it('is not foregone at equal rank', () => {
    expect(isForegoneConclusion(9, 9).isForegone).toBe(false);
  });
});
