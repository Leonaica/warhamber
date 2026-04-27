import type { AspectName, ArmorAttributeName } from '../types/character';
import { DAMAGE_MAGNITUDE_TABLE } from '../data/damageTable';
import { getWoundLevelInfo, type WoundLevel } from '../data/wounds';

export type { WoundLevel } from '../data/wounds';

export interface DamageResult {
  weaponDamage: number;           // Total weapon damage (roll + modifier)
  weaponRollRaw: number;          // Raw dice roll before modifier
  weaponRollDetails: {
    dice: number[];
    explosions: { dieIndex: number; rolls: number[] }[];
  };
  damageModifier: number;         // Modifier that was applied
  resistanceReduction: number;    // Total resistance (rank + size + modifier)
  resistanceBreakdown: {
    rank: number;
    size: number;
    modifier: number;
  };
  armorValue: number;             // Original armor before penetration
  armorReduction: number;         // Effective armor after penetration
  effectiveArmor: number;         // Same as armorReduction
  penetration: number;            // Penetration value
  finalDamage: number;
  woundLevel: WoundLevel;
  woundLabel: string;
  woundEmoji: string;
  woundPenalty: number;
}

export interface DamageCalculationParams {
  weaponMagnitude: number;
  weaponPenetration: number;
  attackedAspect: AspectName;
  resistanceRank: number;
  sizeModifier: number; // Material Size for Form/Flesh, Immaterial Size for Mind/Spirit
  armorValue: number;
  damageModifier?: number;
  resistanceModifier?: number;
}

// Map aspect to its resistance attribute
export function getResistanceAttribute(aspect: AspectName): ArmorAttributeName {
  const map: Record<AspectName, ArmorAttributeName> = {
    Form: 'Toughness',
    Flesh: 'Endurance',
    Mind: 'Willpower',
    Spirit: 'Resilience',
  };
  return map[aspect];
}

// Map aspect to armor attribute
export function getArmorAttribute(aspect: AspectName): ArmorAttributeName {
  return getResistanceAttribute(aspect);
}

// Roll a single die with explosion
function rollDie(dieSize: number): { roll: number; exploded: boolean; explosionRolls: number[] } {
  const rolls: number[] = [];
  let total = 0;
  let exploded = false;
  
  let roll = Math.floor(Math.random() * dieSize) + 1;
  rolls.push(roll);
  total += roll;
  
  // Singly exploding: if max is rolled, roll again once and add
  if (roll === dieSize) {
    exploded = true;
    roll = Math.floor(Math.random() * dieSize) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  return { roll: total, exploded, explosionRolls: exploded ? rolls : [] };
}

// Roll a damage pool based on magnitude
function rollDamagePool(magnitude: number): { total: number; dice: number[]; explosions: { dieIndex: number; rolls: number[] }[] } {
  const entry = DAMAGE_MAGNITUDE_TABLE.find(m => m.magnitude === magnitude);
  if (!entry) {
    // Default to magnitude 3 if not found
    const defaultEntry = DAMAGE_MAGNITUDE_TABLE.find(m => m.magnitude === 3)!;
    return rollDicePool(defaultEntry.pool.dice);
  }
  return rollDicePool(entry.pool.dice);
}

// Roll a dice pool with explosions
function rollDicePool(dice: number[]): { total: number; dice: number[]; explosions: { dieIndex: number; rolls: number[] }[] } {
  let total = 0;
  const results: number[] = [];
  const explosions: { dieIndex: number; rolls: number[] }[] = [];
  
  for (let i = 0; i < dice.length; i++) {
    const dieSize = dice[i];
    const { roll, exploded, explosionRolls } = rollDie(dieSize);
    total += roll;
    results.push(roll);
    if (exploded) {
      explosions.push({ dieIndex: i, rolls: explosionRolls });
    }
  }
  
  return { total, dice: results, explosions };
}

// Main damage calculation function
export function calculateDamage(params: DamageCalculationParams): DamageResult {
  const {
    weaponMagnitude,
    weaponPenetration,
    resistanceRank,
    sizeModifier,
    armorValue,
    damageModifier = 0,
    resistanceModifier = 0,
  } = params;
  
  // Roll weapon damage
  const weaponRoll = rollDamagePool(weaponMagnitude);
  const weaponRollRaw = weaponRoll.total;
  const totalWeaponDamage = weaponRoll.total + damageModifier;
  
  // Resistance is the flat rank value (never rolled)
  const totalResistance = resistanceRank + sizeModifier + resistanceModifier;
  
  // Armor reduction (penetration reduces armor, minimum 0)
  const effectiveArmor = Math.max(0, armorValue - weaponPenetration);
  
  // Final damage calculation
  const finalDamage = Math.max(0, totalWeaponDamage - totalResistance - effectiveArmor);
  
  // Determine wound level
  const woundInfo = getWoundLevelInfo(finalDamage);
  
  return {
    weaponDamage: totalWeaponDamage,
    weaponRollRaw,
    weaponRollDetails: {
      dice: weaponRoll.dice,
      explosions: weaponRoll.explosions,
    },
    damageModifier,
    resistanceReduction: totalResistance,
    resistanceBreakdown: {
      rank: resistanceRank,
      size: sizeModifier,
      modifier: resistanceModifier,
    },
    armorValue,
    armorReduction: effectiveArmor,
    effectiveArmor,
    penetration: weaponPenetration,
    finalDamage,
    woundLevel: woundInfo.level,
    woundLabel: woundInfo.label,
    woundEmoji: woundInfo.emoji,
    woundPenalty: woundInfo.penalty,
  };
}

// Re-export wound utilities for convenience
export { getWoundLevel, getWoundLevelInfo, calculateStacking, WOUND_LABELS, WOUND_PENALTIES } from '../data/wounds';