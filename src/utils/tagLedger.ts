import type { TagEffect, TagKind, WeaponTagDefinition, WeaponTagRef } from '../types/character';
import type { WoundLevel } from '../data/wounds';
import {
  conditionMet,
  resolveAmount,
  scale,
  type AmountSources,
  type RollFacts,
} from '../data/tagVocabulary';

export type { AmountSources, RollFacts };

/** Hard ceiling. Max singly-exploding Mag 11 is 224; above that is meaningless. */
export const MAX_PEN = 224;

/** Standard raise-to-damage conversion before any tag overrides it. */
export const BASE_RAISE_DAMAGE = 2;

export function getTagKind(def: WeaponTagDefinition): TagKind {
  return def.kind ?? 'flavor';
}

export function isDefaultActive(def: WeaponTagDefinition): boolean {
  return def.defaultActive ?? false;
}

export function isInteractive(def: WeaponTagDefinition): boolean {
  return getTagKind(def) !== 'flavor';
}

export function contributesArithmetic(def: WeaponTagDefinition): boolean {
  const kind = getTagKind(def);
  return kind === 'arithmetic' || kind === 'conditional';
}

export interface SelectedTag {
  tagId: string;
  label: string;
  ref: WeaponTagRef;
  def: WeaponTagDefinition;
  /** Child ids left enabled. Omitted = all children enabled. */
  activeChildren?: string[];
}

export interface LedgerEntry {
  tagId: string;
  label: string;
  stage: string;
  value: number | string;
  dormant: boolean;
}

export interface Ledger {
  attack: number;
  parry: number;
  raiseMultiplier: number;
  raiseDamage: number;
  magnitude: number;
  penAdd: number;
  penMultiply: number;
  penSet: number | null;
  resistanceDelta: number;
  resistanceSet: number | null;
  armorSet: number | null;
  damageModifier: number;
  rerollDamage: boolean;
  woundLevelOverride: WoundLevel | null;
  parryDenied: boolean;
  deniedBy: string[];
  overrideBy: string | null;
  entries: LedgerEntry[];
}

export function emptyLedger(): Ledger {
  return {
    attack: 0, parry: 0, raiseMultiplier: 1, raiseDamage: BASE_RAISE_DAMAGE,
    magnitude: 0, penAdd: 0, penMultiply: 1, penSet: null,
    resistanceDelta: 0, resistanceSet: null, armorSet: null,
    damageModifier: 0, rerollDamage: false, woundLevelOverride: null,
    parryDenied: false, deniedBy: [], overrideBy: null, entries: [],
  };
}

function applyEffect(ledger: Ledger, effect: TagEffect, value: number, dormant: boolean): void {
  if (dormant) return;

  switch (effect.stage) {
    case 'attack':
      ledger.attack += effect.op === 'subtract' ? -value : value;
      break;
    case 'parry':
      if (effect.op === 'deny') ledger.parryDenied = true;
      else ledger.parry += effect.op === 'subtract' ? -value : value;
      break;
    case 'raises':
      if (effect.op === 'multiply') ledger.raiseMultiplier *= value;
      else ledger.raiseMultiplier += value;
      break;
    case 'raiseDamage':
      if (effect.op === 'set') ledger.raiseDamage = value;
      else ledger.raiseDamage += effect.op === 'subtract' ? -value : value;
      break;
    case 'magnitude':
      ledger.magnitude += effect.op === 'subtract' ? -value : value;
      break;
    case 'penetration':
      if (effect.op === 'set') ledger.penSet = value;
      else if (effect.op === 'multiply') ledger.penMultiply *= value;
      else ledger.penAdd += effect.op === 'subtract' ? -value : value;
      break;
    case 'resistance':
      if (effect.op === 'set') ledger.resistanceSet = value;
      else ledger.resistanceDelta += effect.op === 'subtract' ? -value : value;
      break;
    case 'armor':
      ledger.armorSet = value;
      break;
    case 'damageModifier':
      ledger.damageModifier += effect.op === 'subtract' ? -value : value;
      break;
    case 'reroll':
      ledger.rerollDamage = true;
      break;
    case 'override':
      ledger.woundLevelOverride = 8 as WoundLevel;
      break;
    case 'flag':
      break;
  }
}

/**
 * Build the ledger from selected tags.
 *
 * Penetration and resistance resolve add/multiply first and `set` last, so an
 * override always wins over a doubling effect. `raiseDamage` is a slot, not a
 * sum: `devastating` sets it, and `bane`'s multiplier applies to the raise
 * count beforehand.
 */
export function buildLedger(
  selected: SelectedTag[],
  facts: RollFacts,
  src: AmountSources,
): Ledger {
  const ledger = emptyLedger();

  for (const sel of selected) {
    if (!contributesArithmetic(sel.def)) continue;

    for (const effect of sel.def.effects ?? []) {
      if (effect.child && sel.activeChildren && !sel.activeChildren.includes(effect.child)) continue;

      const dormant = !conditionMet(effect.when, facts);
      const amount = 'amount' in effect ? effect.amount : undefined;
      const value = scale(resolveAmount(amount, sel.ref.x, src), effect.per, facts);

      if (effect.op === 'deny' && !dormant) ledger.deniedBy.push(sel.label);
      if (effect.stage === 'override' && !dormant) ledger.overrideBy = sel.label;

      applyEffect(ledger, effect, value, dormant);
      ledger.entries.push({ tagId: sel.tagId, label: sel.label, stage: effect.stage, value: dormant ? '—' : value, dormant });
    }
  }

  return ledger;
}

export function effectivePenetration(basePen: number, ledger: Ledger): number {
  const computed = ledger.penSet !== null ? ledger.penSet : (basePen + ledger.penAdd) * ledger.penMultiply;
  return Math.max(0, Math.min(MAX_PEN, Math.round(computed)));
}

export function effectiveResistance(base: number, ledger: Ledger): number {
  return Math.max(0, ledger.resistanceSet !== null ? ledger.resistanceSet : base + ledger.resistanceDelta);
}

/** Magnitudes above this have no distinct pool in the damage table. */
export const MAX_MAGNITUDE = 11;

/**
 * Effective magnitude. A magnitude shift moves the weapon's whole pool
 * (Mag 2 + 4 rolls as Mag 6), so it is clamped to the table's range rather
 * than allowed to fall off the end into the Mag 3 default.
 */
export function effectiveMagnitude(base: number, ledger: Ledger): number {
  return Math.max(1, Math.min(MAX_MAGNITUDE, base + ledger.magnitude));
}

export function effectiveRaises(rawRaises: number, ledger: Ledger): number {
  return Math.max(0, Math.floor(rawRaises * ledger.raiseMultiplier));
}
