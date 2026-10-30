import type { Amount, TagEffect, TagWhen } from '../types/character';

/** Facts the roll produced. Not scene state. */
export interface RollFacts {
  raises: number;
  allLow: boolean;
}

export interface AmountSources {
  strengthRank: number;
  presenceRank: number;
  armorValue: number;
}

export function conditionMet(when: TagWhen | undefined, facts: RollFacts): boolean {
  if (!when) return true;
  if (when.raisesAtLeast !== undefined && facts.raises < when.raisesAtLeast) return false;
  if (when.allLow !== undefined && facts.allLow !== when.allLow) return false;
  return true;
}

export function resolveAmount(
  amount: Amount | undefined,
  x: number | undefined,
  src: AmountSources,
): number {
  switch (amount) {
    case 'x': return x ?? 0;
    case 'strength': return src.strengthRank;
    case 'presence': return src.presenceRank;
    case 'armorValue': return src.armorValue;
    /** Sentinel: the wound level is read directly by the override stage. */
    case 'deathBlow': return 0;
    default: return amount ?? 0;
  }
}

/** Scale by success or raise count. Flat effects pass through unchanged. */
export function scale(value: number, per: TagEffect['per'], facts: RollFacts): number {
  if (per === 'success') return value * Math.max(0, facts.raises + 1);
  if (per === 'raise') return value * facts.raises;
  return value;
}
