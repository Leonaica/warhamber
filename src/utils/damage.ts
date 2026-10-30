import type { AspectName, AttributeName } from '../types/character';
import { DAMAGE_MAGNITUDE_TABLE } from '../data/damageTable';
import { WOUND_LABELS, WOUND_PENALTIES, getWoundLevelInfo, type WoundLevel } from '../data/wounds';
import { SOAK_ATTRIBUTES } from '../data/aspectAttributes';
import {
  emptyLedger,
  effectiveMagnitude,
  effectivePenetration,
  effectiveRaises,
  effectiveResistance,
  type Ledger,
} from './tagLedger';

export type { WoundLevel } from '../data/wounds';

export interface DamageResult {
  weaponDamage: number;           // Total weapon damage (roll + modifiers)
  weaponRollRaw: number;          // Raw dice roll before modifiers
  weaponRollDetails: {
    dice: number[];
    explosions: { dieIndex: number; rolls: number[] }[];
  };
  damageModifier: number;         // Manual modifier applied
  ledgerModifier: number;         // Modifier contributed by active tags
  raiseDamage: number;            // Total damage contributed by raises
  raises: number;
  effectiveMagnitude: number;
  resistanceReduction: number;    // Total resistance (rank + size + modifier)
  resistanceBreakdown: {
    rank: number;
    size: number;
    modifier: number;
  };
  armorValue: number;             // Armor before penetration or override
  armorReduction: number;         // Effective armor after penetration/override
  penetration: number;            // Effective penetration
  finalDamage: number;
  woundLevel: WoundLevel;
  woundLabel: string;
  woundEmoji: string;
  woundPenalty: number;
  /** Set when a tag replaced the whole calculation (Vorpal). */
  bypassed: 'vorpal' | null;
  rerolled: boolean;
  ledger: Ledger;
}

interface DamageCalculationParams {
  weaponMagnitude: number;
  weaponPenetration: number;
  attackedAspect: AspectName;
  resistanceRank: number;
  sizeModifier: number;
  armorValue: number;
  /** Raises scored on the attack. Drives raise damage through the ledger slot. */
  raises?: number;
  /** Active tag modifiers. Defaults to an empty ledger. */
  ledger?: Ledger;
  damageModifier?: number;
  resistanceModifier?: number;
}

/** The attribute a defender soaks an attack of this Aspect with. */
export function getResistanceAttribute(aspect: AspectName): AttributeName {
  return SOAK_ATTRIBUTES[aspect];
}

// Roll a single die with a single explosion
function rollDie(dieSize: number): { roll: number; exploded: boolean; explosionRolls: number[] } {
  const rolls: number[] = [];
  let total = 0;
  let exploded = false;

  let roll = Math.floor(Math.random() * dieSize) + 1;
  rolls.push(roll);
  total += roll;

  if (roll === dieSize) {
    exploded = true;
    roll = Math.floor(Math.random() * dieSize) + 1;
    rolls.push(roll);
    total += roll;
  }

  return { roll: total, exploded, explosionRolls: exploded ? rolls : [] };
}

function rollDamagePool(magnitude: number): { total: number; dice: number[]; explosions: { dieIndex: number; rolls: number[] }[] } {
  const entry = DAMAGE_MAGNITUDE_TABLE.find(m => m.magnitude === magnitude);
  if (!entry) {
    const fallback = DAMAGE_MAGNITUDE_TABLE.find(m => m.magnitude === 3)!;
    return rollDicePool(fallback.pool.dice);
  }
  return rollDicePool(entry.pool.dice);
}

function rollDicePool(dice: number[]): { total: number; dice: number[]; explosions: { dieIndex: number; rolls: number[] }[] } {
  let total = 0;
  const results: number[] = [];
  const explosions: { dieIndex: number; rolls: number[] }[] = [];

  for (let i = 0; i < dice.length; i++) {
    const { roll, exploded, explosionRolls } = rollDie(dice[i]);
    total += roll;
    results.push(roll);
    if (exploded) explosions.push({ dieIndex: i, rolls: explosionRolls });
  }

  return { total, dice: results, explosions };
}

export interface DamageNumbers {
  weaponDamage: number;
  finalDamage: number;
  resistance: number;
  effectiveArmor: number;
  raiseDamage: number;
}

/**
 * Pure arithmetic for a resolved hit. Split out from rolling so it can be
 * tested without stubbing dice.
 *
 * Armor resolves to the ledger's `armorSet` when a tag sets it (true-name),
 * otherwise to `max(0, armor - penetration)`. Resistance resolves the same
 * way. Raises multiply the ledger's `raiseDamage` slot, which `devastating`
 * replaces and `bane` feeds by doubling the count.
 */
export function resolveDamageNumbers(params: {
  weaponRollTotal: number;
  damageModifier: number;
  ledger: Ledger;
  raises: number;
  resistance: number;
  armorValue: number;
  penetration: number;
}): DamageNumbers {
  const { weaponRollTotal, damageModifier, ledger, raises, resistance, armorValue, penetration } = params;

  const effectiveArmor = ledger.armorSet !== null ? ledger.armorSet : Math.max(0, armorValue - penetration);
  const raiseDamage = effectiveRaises(raises, ledger) * ledger.raiseDamage;
  const weaponDamage = weaponRollTotal + damageModifier + ledger.damageModifier + raiseDamage;
  const finalDamage = Math.max(0, weaponDamage - resistance - effectiveArmor);

  return { weaponDamage, finalDamage, resistance, effectiveArmor, raiseDamage };
}

export function calculateDamage(params: DamageCalculationParams): DamageResult {
  const {
    weaponMagnitude,
    weaponPenetration,
    resistanceRank,
    sizeModifier,
    armorValue,
    raises = 0,
    ledger = emptyLedger(),
    damageModifier = 0,
    resistanceModifier = 0,
  } = params;

  const baseResistance = resistanceRank + sizeModifier + resistanceModifier;
  const resistance = effectiveResistance(baseResistance, ledger);
  const penetration = effectivePenetration(weaponPenetration, ledger);
  const magnitude = effectiveMagnitude(weaponMagnitude, ledger);

  const breakdown = {
    rank: resistanceRank,
    size: sizeModifier,
    modifier: resistanceModifier,
  };

  // Vorpal: the outcome is decided before dice, armor or resistance matter.
  if (ledger.woundLevelOverride !== null) {
    const level = ledger.woundLevelOverride;
    return {
      weaponDamage: 0,
      weaponRollRaw: 0,
      weaponRollDetails: { dice: [], explosions: [] },
      damageModifier,
      ledgerModifier: ledger.damageModifier,
      raiseDamage: 0,
      raises,
      effectiveMagnitude: magnitude,
      resistanceReduction: resistance,
      resistanceBreakdown: breakdown,
      armorValue,
      armorReduction: ledger.armorSet ?? armorValue,
      penetration,
      finalDamage: 0,
      woundLevel: level,
      woundLabel: WOUND_LABELS[level].label,
      woundEmoji: WOUND_LABELS[level].emoji,
      woundPenalty: WOUND_PENALTIES[level],
      bypassed: 'vorpal',
      rerolled: false,
      ledger,
    };
  }

  let roll = rollDamagePool(magnitude);
  let rerolled = false;

  if (ledger.rerollDamage) {
    const second = rollDamagePool(magnitude);
    rerolled = true;
    if (second.total > roll.total) roll = second;
  }

  const numbers = resolveDamageNumbers({
    weaponRollTotal: roll.total,
    damageModifier,
    ledger,
    raises,
    resistance,
    armorValue,
    penetration,
  });

  const woundInfo = getWoundLevelInfo(numbers.finalDamage);

  return {
    weaponDamage: numbers.weaponDamage,
    weaponRollRaw: roll.total,
    weaponRollDetails: { dice: roll.dice, explosions: roll.explosions },
    damageModifier,
    ledgerModifier: ledger.damageModifier,
    raiseDamage: numbers.raiseDamage,
    raises,
    effectiveMagnitude: magnitude,
    resistanceReduction: numbers.resistance,
    resistanceBreakdown: breakdown,
    armorValue,
    armorReduction: numbers.effectiveArmor,
    penetration,
    finalDamage: numbers.finalDamage,
    woundLevel: woundInfo.level,
    woundLabel: woundInfo.label,
    woundEmoji: woundInfo.emoji,
    woundPenalty: woundInfo.penalty,
    bypassed: null,
    rerolled,
    ledger,
  };
}
