import { DAMAGE_MAGNITUDE_TABLE } from '../data/damageTable';

/**
 * Calculate the probability distribution for a singly-exploding die
 */
function dieDistribution(dieSize: number): Map<number, number> {
  const dist = new Map<number, number>();
  
  // Non-exploding outcomes (1 to dieSize-1)
  for (let i = 1; i < dieSize; i++) {
    dist.set(i, 1 / dieSize);
  }
  
  // Exploding outcomes (dieSize + 1 to 2*dieSize)
  // Only happens if first roll is dieSize (probability 1/dieSize)
  // Then second roll is 1 to dieSize (probability 1/dieSize each)
  for (let i = 1; i <= dieSize; i++) {
    dist.set(dieSize + i, 1 / (dieSize * dieSize));
  }
  
  return dist;
}

/**
 * Convolve two probability distributions
 */
function convolve(distA: Map<number, number>, distB: Map<number, number>): Map<number, number> {
  const result = new Map<number, number>();
  
  for (const [valA, probA] of distA) {
    for (const [valB, probB] of distB) {
      const sum = valA + valB;
      const currentProb = result.get(sum) || 0;
      result.set(sum, currentProb + probA * probB);
    }
  }
  
  return result;
}

/**
 * Calculate the probability distribution for a damage magnitude
 */
export function damageDistribution(magnitude: number): Map<number, number> {
  const entry = DAMAGE_MAGNITUDE_TABLE.find(m => m.magnitude === magnitude);
  if (!entry) {
    const defaultEntry = DAMAGE_MAGNITUDE_TABLE.find(m => m.magnitude === 3)!;
    return damageDistribution(defaultEntry.magnitude);
  }
  
  let dist = dieDistribution(entry.pool.dice[0]);
  
  for (let i = 1; i < entry.pool.dice.length; i++) {
    dist = convolve(dist, dieDistribution(entry.pool.dice[i]));
  }
  
  return dist;
}

export interface WoundProbabilities {
  grazed: number;
  scrape: number;
  wound: number;
  bleedingWound: number;
  lifeThreatening: number;
  maimed: number;
  mortalWound: number;
  deathBlow: number;
  averageDamage: number;
  minDamage: number;
  maxDamage: number;
}

export function calculateWoundProbabilities(params: {
  weaponMagnitude: number;
  damageModifier: number;
  resistance: number;
  armor: number;
  penetration: number;
}): WoundProbabilities {
  const { weaponMagnitude, damageModifier, resistance, armor, penetration } = params;
  
  const dist = damageDistribution(weaponMagnitude);
  const effectiveArmor = Math.max(0, armor - penetration);
  const totalReduction = resistance + effectiveArmor;
  
  const probs: WoundProbabilities = {
    grazed: 0,
    scrape: 0,
    wound: 0,
    bleedingWound: 0,
    lifeThreatening: 0,
    maimed: 0,
    mortalWound: 0,
    deathBlow: 0,
    averageDamage: 0,
    minDamage: Infinity,
    maxDamage: -Infinity,
  };
  
  let totalWeightedDamage = 0;
  
  for (const [rawDamage, probability] of dist) {
    const totalDamage = rawDamage + damageModifier;
    const finalDamage = Math.max(0, totalDamage - totalReduction);
    
    totalWeightedDamage += finalDamage * probability;
    
    if (finalDamage < probs.minDamage) probs.minDamage = finalDamage;
    if (finalDamage > probs.maxDamage) probs.maxDamage = finalDamage;
    
    if (finalDamage <= 3) {
      probs.grazed += probability;
    } else if (finalDamage <= 7) {
      probs.scrape += probability;
    } else if (finalDamage <= 11) {
      probs.wound += probability;
    } else if (finalDamage <= 15) {
      probs.bleedingWound += probability;
    } else if (finalDamage <= 19) {
      probs.lifeThreatening += probability;
    } else if (finalDamage <= 23) {
      probs.maimed += probability;
    } else if (finalDamage <= 27) {
      probs.mortalWound += probability;
    } else {
      probs.deathBlow += probability;
    }
  }
  
  probs.averageDamage = totalWeightedDamage;
  if (probs.minDamage === Infinity) probs.minDamage = 0;
  if (probs.maxDamage === -Infinity) probs.maxDamage = 0;
  
  return probs;
}