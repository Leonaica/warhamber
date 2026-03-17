import type { DiePool } from '../types/character';
import type { EffortBand, ActionResult, ResolutionContext, ContestResult } from '../types/resolution';
import { ACTION_EFFORT_TABLE, SURGE_COST, normalizeNotation } from '../data/actionEffortTable';

function rollDie(size: number): { total: number; exploded: boolean; rolls: number[] } {
  const rolls: number[] = [];
  let total = 0;
  let exploded = false;
  
  let roll = Math.floor(Math.random() * size) + 1;
  rolls.push(roll);
  total += roll;
  
  if (roll === size) {
    exploded = true;
    roll = Math.floor(Math.random() * size) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  return { total, exploded, rolls };
}

export function rollPool(pool: DiePool): { total: number; rolls: number[]; explosions: { dieIndex: number; rolls: number[] }[] } {
  let total = 0;
  const rolls: number[] = [];
  const explosions: { dieIndex: number; rolls: number[] }[] = [];
  
  pool.dice.forEach((size, index) => {
    const result = rollDie(size);
    total += result.total;
    rolls.push(result.rolls[0]);
    if (result.exploded) {
      explosions.push({ dieIndex: index, rolls: result.rolls });
    }
  });
  
  if (pool.divisor) {
    total = Math.ceil(total / pool.divisor);
  }
  
  return { total, rolls, explosions };
}

function rollWithAdvantage(pool: DiePool, advantageDice: number): {
  result: number;
  keptRolls: number[];
  discardedRolls: number[];
  otherRolls: { value: number; rolls: number[] }[];
  explosions: { dieIndex: number; rolls: number[] }[];
} {
  // Separate d12s from other dice
  const d12Indices: number[] = [];
  const otherDice: { index: number; size: number }[] = [];
  
  pool.dice.forEach((size, index) => {
    if (size === 12) {
      d12Indices.push(index);
    } else {
      otherDice.push({ index, size });
    }
  });
  
  const originalD12Count = d12Indices.length;
  const explosions: { dieIndex: number; rolls: number[] }[] = [];
  
  // Roll all d12s (original + advantage), tracking explosions
  const allD12Results: { value: number; rolls: number[] }[] = [];
  for (let i = 0; i < originalD12Count + advantageDice; i++) {
    const result = rollDie(12);
    allD12Results.push({ value: result.total, rolls: result.rolls });
    if (result.rolls.length > 1) {
      explosions.push({ dieIndex: i, rolls: result.rolls });
    }
  }
  
  // Roll other dice (with explosions)
  const otherRolls: { value: number; rolls: number[] }[] = [];
  for (const { index, size } of otherDice) {
    const result = rollDie(size);
    otherRolls.push({ value: result.total, rolls: result.rolls });
    if (result.rolls.length > 1) {
      explosions.push({ dieIndex: index, rolls: result.rolls });
    }
  }
  
  // Sort d12s by total value descending, keep highest N
  const sortedD12s = [...allD12Results].sort((a, b) => b.value - a.value);
  const keptD12s = sortedD12s.slice(0, originalD12Count);
  const discardedD12s = sortedD12s.slice(originalD12Count);
  
  const result = keptD12s.reduce((sum, r) => sum + r.value, 0) + 
                 otherRolls.reduce((sum, r) => sum + r.value, 0);
  
  return {
    result,
    keptRolls: keptD12s.map(r => r.rolls[0]),
    discardedRolls: discardedD12s.map(r => r.rolls[0]),
    otherRolls,
    explosions,
  };
}

export function checkCriticalFailure(rolls: number[], hasPoorSkill: boolean): {
  isCriticalFailure: boolean;
  allMinimum: boolean;
  confirmationRoll?: number;
} {
  const threshold = hasPoorSkill ? 2 : 1;
  const allMinimum = rolls.every(r => r <= threshold);
  
  if (allMinimum) {
    const confirmRoll = Math.floor(Math.random() * 6) + 1;
    return {
      isCriticalFailure: confirmRoll === 1,
      allMinimum: true,
      confirmationRoll: confirmRoll,
    };
  }
  
  return {
    isCriticalFailure: false,
    allMinimum: false,
  };
}

export function getRedMaximum(pool: DiePool): number {
  const notation = normalizeNotation(pool.notation);
  const tableEntry = ACTION_EFFORT_TABLE[notation];
  if (tableEntry && tableEntry.red !== null) return tableEntry.red;
  return pool.dice.reduce((sum, d) => sum + d * 2, 0);
}

export function getGreenTN(pool: DiePool): number | null {
  const notation = normalizeNotation(pool.notation);
  const tableEntry = ACTION_EFFORT_TABLE[notation];
  return tableEntry?.green ?? null;
}

export function getBandThresholds(pool: DiePool): Record<EffortBand, number | null> {
  const notation = normalizeNotation(pool.notation);
  const tableEntry = ACTION_EFFORT_TABLE[notation];
  if (tableEntry) return tableEntry;
  return { green: null, yellow: null, orange: null, red: null };
}

export function calculateAdvantageDice(actorRank: number, opponentRank: number): number {
  // Only eligible if rank > 5 (more than a single die)
  if (actorRank <= 5) return 0;
  return Math.max(0, actorRank - opponentRank);
}

export function isForegoneConclusion(actorRank: number, opponentRank: number): { isForegone: boolean; winner: 'actor' | 'opponent' | null } {
  const actorAdvantage = calculateAdvantageDice(actorRank, opponentRank);
  const opponentAdvantage = calculateAdvantageDice(opponentRank, actorRank);
  
  if (actorAdvantage >= 4) return { isForegone: true, winner: 'actor' };
  if (opponentAdvantage >= 4) return { isForegone: true, winner: 'opponent' };
  return { isForegone: false, winner: null };
}

export function getEffortBand(pool: DiePool, result: number): EffortBand | null {
  const thresholds = getBandThresholds(pool);
  
  if (thresholds.red !== null && result >= thresholds.red) return 'red';
  if (thresholds.orange !== null && result >= thresholds.orange) return 'orange';
  if (thresholds.yellow !== null && result >= thresholds.yellow) return 'yellow';
  if (thresholds.green !== null && result >= thresholds.green) return 'green';
  
  return null;
}

export function calculateSuccesses(result: number, targetNumber: number): number {
  if (result < targetNumber) return 0;
  return 1 + Math.floor((result - targetNumber) / 4);
}

export function calculateContestSuccesses(margin: number): number {
  if (margin <= 0) return 0;
  return 1 + Math.floor((margin - 1) / 4);
}

export function getSurgeCost(band: EffortBand): number {
  return SURGE_COST[band];
}

export function resolveTest(context: ResolutionContext): ActionResult {
  const { 
    attributePool, 
    poolRank,
    skillBonus, 
    woundPenalty, 
    situationalModifier, 
    targetNumber, 
    approach, 
    surgeBand, 
    isContest, 
    opponentRank 
  } = context;
  
  const thresholds = getBandThresholds(attributePool);
  const diceCount = attributePool.dice.length;
  const redMax = thresholds.red ?? getRedMaximum(attributePool);
  
  // Calculate per-die modifiers
  const totalWoundPenalty = woundPenalty * diceCount;
  const effectiveDiceCountForSkill = approach === 'surge' ? 4 : diceCount;
  const totalSkillBonus = skillBonus * effectiveDiceCountForSkill;
  const totalModifier = totalSkillBonus + totalWoundPenalty + situationalModifier;
  
  // Path 1: Take the Baseline (Green)
  if (approach === 'baseline') {
    if (thresholds.green === null) {
      return {
        result: 0,
        band: 'green',
        successes: 0,
        capped: false,
        criticalFailure: false,
      };
    }
    const greenTN = thresholds.green;
    const result = greenTN + totalModifier;
    const capped = result > redMax;
    const finalResult = capped ? redMax : result;
    const successes = isContest ? 0 : calculateSuccesses(result, targetNumber);

    return {
      result: finalResult,
      band: 'green',
      successes,
      capped,
      criticalFailure: false,
      calculationBreakdown: {
        rollTotal: greenTN,
        skillBonus: totalSkillBonus,
        skillBonusPerDie: skillBonus,
        woundPenalty: totalWoundPenalty,
        woundPenaltyPerDie: woundPenalty,
        situationalModifier,
        diceCount,
        totalModifier,
        finalResult,
      },
    };
  }
  
  // Path 3: Push with Surge
  if (approach === 'surge' && surgeBand) {
    const bandTN = thresholds[surgeBand];
    if (bandTN === null) {
      return {
        result: 0,
        band: surgeBand,
        successes: 0,
        capped: false,
        criticalFailure: false,
      };
    }
    
    const result = bandTN + totalModifier;
    const capped = result > redMax;
    const finalResult = capped ? redMax : result;
    
    return {
      result: finalResult,
      band: surgeBand,
      successes: calculateSuccesses(finalResult, targetNumber),
      capped,
      criticalFailure: false,
      calculationBreakdown: {
        rollTotal: bandTN,
        skillBonus: totalSkillBonus,
        skillBonusPerDie: skillBonus,
        woundPenalty: totalWoundPenalty,
        woundPenaltyPerDie: woundPenalty,
        situationalModifier,
        diceCount,
        isSurge: true,
        totalModifier,
        finalResult,
      },
    };
  }
  
  // Path 2: Trust to Chance (Roll)
  let advantageDice = 0;
  let otherRolls: number[] | undefined;

  if (isContest && opponentRank !== undefined) {
    advantageDice = calculateAdvantageDice(poolRank, opponentRank);
  }
  
  let rollTotal: number;
  let rolls: number[];
  let explosions: { dieIndex: number; rolls: number[] }[];
  let keptRolls: number[] | undefined;
  let discardedRolls: number[] | undefined;
  
  if (advantageDice > 0) {
    const advResult = rollWithAdvantage(attributePool, advantageDice);
    rollTotal = advResult.result;
    rolls = [...advResult.keptRolls, ...advResult.otherRolls.map(r => r.rolls[0])];
    explosions = advResult.explosions;
    keptRolls = advResult.keptRolls;
    discardedRolls = advResult.discardedRolls;
    otherRolls = advResult.otherRolls.map(r => r.rolls[0]);
  } else {
    const rollResult = rollPool(attributePool);
    rollTotal = rollResult.total;
    rolls = rollResult.rolls;
    explosions = rollResult.explosions;
  }
  
  const criticalFailureResult = checkCriticalFailure(rolls, skillBonus < 0);
  const criticalFailure = criticalFailureResult.isCriticalFailure;
  
  let result = rollTotal + totalModifier;
  const capped = result > redMax;
  if (capped) result = redMax;
  
  const band = getEffortBand(attributePool, result) ?? 'green';
  
  return {
    result,
    band,
    successes: calculateSuccesses(result, targetNumber),
    capped,
    criticalFailure,
    rollDetails: {
      rolls,
      explosions,
      advantageDice: advantageDice > 0 ? advantageDice : undefined,
      keptRolls,
      discardedRolls,
      otherRolls,
      criticalFailureCheck: criticalFailureResult.allMinimum ? {
        allMinimum: true,
        confirmationRoll: criticalFailureResult.confirmationRoll,
      } : undefined,
    },
    calculationBreakdown: {
      rollTotal,
      skillBonus: totalSkillBonus,
      skillBonusPerDie: skillBonus,
      woundPenalty: totalWoundPenalty,
      woundPenaltyPerDie: woundPenalty,
      situationalModifier,
      diceCount,
      advantageDice: advantageDice > 0 ? advantageDice : undefined,
      totalModifier,
      finalResult: result,
    },
  };
}

export function resolveContest(
  actorContext: Omit<ResolutionContext, 'isContest' | 'opponentPool' | 'opponentRank'>,
  opponentContext: Omit<ResolutionContext, 'isContest' | 'opponentPool' | 'opponentRank'>
): ContestResult {
  const foregone = isForegoneConclusion(actorContext.poolRank, opponentContext.poolRank);
  if (foregone.isForegone && foregone.winner) {
    return {
      actor: { result: 0, band: 'green', successes: 0, capped: false, criticalFailure: false },
      opponent: { result: 0, band: 'green', successes: 0, capped: false, criticalFailure: false },
      winner: foregone.winner,
      margin: Infinity,
    };
  }
  
  const actorResult = resolveTest({
    ...actorContext,
    isContest: true,
    opponentRank: opponentContext.poolRank,
  });
  
  const opponentResult = resolveTest({
    ...opponentContext,
    isContest: true,
    opponentRank: actorContext.poolRank,
  });
  
  // Critical failure causes automatic loss
  if (actorResult.criticalFailure && opponentResult.criticalFailure) {
    return {
      actor: { ...actorResult, successes: 0 },
      opponent: { ...opponentResult, successes: 0 },
      winner: 'tie',
      margin: 0,
    };
  }
  
  if (actorResult.criticalFailure) {
    return {
      actor: { ...actorResult, successes: 0 },
      opponent: { ...opponentResult, successes: 0 },
      winner: 'opponent',
      margin: opponentResult.result,
    };
  }
  
  if (opponentResult.criticalFailure) {
    return {
      actor: { ...actorResult, successes: 0 },
      opponent: { ...opponentResult, successes: 0 },
      winner: 'actor',
      margin: actorResult.result,
    };
  }
  
  // Normal comparison
  const margin = actorResult.result - opponentResult.result;
  
  if (margin > 0) {
    // Actor wins
    const actorSuccesses = calculateContestSuccesses(margin);
    return {
      actor: { ...actorResult, successes: actorSuccesses },
      opponent: { ...opponentResult, successes: 0 },
      winner: 'actor',
      margin: Math.abs(margin),
    };
  } else if (margin < 0) {
    // Opponent wins
    const opponentSuccesses = calculateContestSuccesses(Math.abs(margin));
    return {
      actor: { ...actorResult, successes: 0 },
      opponent: { ...opponentResult, successes: opponentSuccesses },
      winner: 'opponent',
      margin: Math.abs(margin),
    };
  } else {
    // Tie
    return {
      actor: { ...actorResult, successes: 0 },
      opponent: { ...opponentResult, successes: 0 },
      winner: 'tie',
      margin: 0,
    };
  }
}