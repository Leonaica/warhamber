import type {
  TagEffect,
  TagKind,
  TagWhen,
  WeaponTagDefinition,
  WeaponTagRef,
} from '../types/character';
import type { WoundLevel } from '../data/wounds';

/** Hard ceiling. Max singly-exploding Mag 11 is 224; above that is meaningless. */
export const MAX_PEN = 224;

/** The standard raise-to-damage conversion before any tag overrides it. */
export const BASE_RAISE_DAMAGE = 2;

/**
 * Infer a tag's kind when the definition has not declared one.
 * Step 1 fallback only — step 2 makes `kind` explicit and lints against it.
 */
export function getTagKind(def: WeaponTagDefinition): TagKind {
  if (def.kind) return def.kind;
  if (!def.effects || def.effects.length === 0) return 'flavour';
  return def.effects.some(e => e.when) ? 'conditional' : 'arithmetic';
}

/** True when the tag is worth clicking. */
export function isInteractive(def: WeaponTagDefinition): boolean {
  return getTagKind(def) !== 'flavour';
}

/** True when selecting it contributes to the ledger. */
export function contributesArithmetic(def: WeaponTagDefinition): boolean {
  const kind = getTagKind(def);
  return kind === 'arithmetic' || kind === 'conditional';
}

/** Facts the roll produced. Not scene state. */
export interface RollFacts {
  raises: number;
  allLow: boolean;
}

export interface AmountSources {
  strengthRank: number;
  presenceRank: number;
  armourValue: number;
}

/** A tag the user has selected, with its active children. */
export interface SelectedTag {
  tagId: string;
  label: string;
  ref: WeaponTagRef;
  def: WeaponTagDefinition;
  /** Child ids that remain enabled. Omitted = all children enabled. */
  activeChildren?: string[];
}

export interface LedgerEntry {
  tagId: string;
  label: string;
  effectText: string;
  stage: string;
  value: number | string;
  /** Selected but its `when` is not satisfied yet. */
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
  armourSet: number | null;
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
    attack: 0,
    parry: 0,
    raiseMultiplier: 1,
    raiseDamage: BASE_RAISE_DAMAGE,
    magnitude: 0,
    penAdd: 0,
    penMultiply: 1,
    penSet: null,
    resistanceDelta: 0,
    resistanceSet: null,
    armourSet: null,
    damageModifier: 0,
    rerollDamage: false,
    woundLevelOverride: null,
    parryDenied: false,
    deniedBy: [],
    overrideBy: null,
    entries: [],
  };
}

export function conditionMet(when: TagWhen | undefined, facts: RollFacts): boolean {
  if (!when) return true;
  if (when.raisesAtLeast !== undefined && facts.raises < when.raisesAtLeast) return false;
  if (when.allLow !== undefined && facts.allLow !== when.allLow) return false;
  return true;
}

function resolveAmount(
  effect: TagEffect,
  x: number | undefined,
  src: AmountSources,
): number {
  switch (effect.amount) {
    case 'x':
      return x ?? 0;
    case 'strength':
      return src.strengthRank;
    case 'presence':
      return src.presenceRank;
    case 'armourValue':
      return src.armourValue;
    case 'deathBlow':
      return 0;
    default:
      return effect.amount ?? 0;
  }
}

/** Scale an amount by success/raise count. Flat effects return it unchanged. */
function scale(value: number, per: TagEffect['per'], facts: RollFacts): number {
  if (per === 'success') return value * Math.max(0, facts.raises + 1);
  if (per === 'raise') return value * facts.raises;
  return value;
}

function applyEffect(
  ledger: Ledger,
  effect: TagEffect,
  value: number,
  dormant: boolean,
): void {
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
    case 'armour':
      if (effect.op === 'set') ledger.armourSet = value;
      break;
    case 'damageModifier':
      ledger.damageModifier += effect.op === 'subtract' ? -value : value;
      break;
    case 'reroll':
      ledger.rerollDamage = true;
      break;
    case 'override':
      if (effect.target === 'woundLevel') {
        ledger.woundLevelOverride = Number(effect.amount === 'deathBlow' ? 8 : value) as WoundLevel;
      }
      break;
  }
}

/**
 * Build the ledger from the selected tags.
 *
 * Penetration resolves add/multiply first and `set` last, so a Pen 224
 * override always wins over a doubling effect. Resistance resolves the same
 * way. `raiseDamage` is a slot, not a sum: `devastating` sets it and the
 * count multiplier from `bane` is applied to the raise count beforehand.
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
      if (effect.child && sel.activeChildren && !sel.activeChildren.includes(effect.child)) {
        continue;
      }

      const dormant = !conditionMet(effect.when, facts);
      const raw = resolveAmount(effect, sel.ref.x, src);
      const value = scale(raw, effect.per, facts);

      if (effect.op === 'deny' && !dormant) ledger.deniedBy.push(sel.label);
      if (effect.stage === 'override' && !dormant) ledger.overrideBy = sel.label;

      applyEffect(ledger, effect, value, dormant);

      ledger.entries.push({
        tagId: sel.tagId,
        label: sel.label,
        effectText: sel.def.effect ?? '',
        stage: effect.stage,
        value: dormant ? '—' : value,
        dormant,
      });
    }
  }

  return ledger;
}

/** Effective penetration: adds and multipliers, then any set wins, capped. */
export function effectivePenetration(basePen: number, ledger: Ledger): number {
  const computed = ledger.penSet !== null
    ? ledger.penSet
    : (basePen + ledger.penAdd) * ledger.penMultiply;
  return Math.max(0, Math.min(MAX_PEN, Math.round(computed)));
}

/** Effective resistance: base plus deltas, unless a set overrides it. */
export function effectiveResistance(baseResistance: number, ledger: Ledger): number {
  const computed = ledger.resistanceSet !== null
    ? ledger.resistanceSet
    : baseResistance + ledger.resistanceDelta;
  return Math.max(0, computed);
}

/** Effective magnitude, floored at 1 (Mag 1 is the smallest legal pool). */
export function effectiveMagnitude(baseMagnitude: number, ledger: Ledger): number {
  return Math.max(1, baseMagnitude + ledger.magnitude);
}

/** Raise count after any multiplier from `bane`. */
export function effectiveRaises(rawRaises: number, ledger: Ledger): number {
  return Math.max(0, Math.floor(rawRaises * ledger.raiseMultiplier));
}

