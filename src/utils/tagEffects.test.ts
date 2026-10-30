import { describe, expect, it } from 'vitest';
import type { WeaponTagDefinition } from '../types/character';
import {
  BASE_RAISE_DAMAGE,
  MAX_PEN,
  buildLedger,
  conditionMet,
  contributesArithmetic,
  effectiveMagnitude,
  effectivePenetration,
  effectiveRaises,
  effectiveResistance,
  getTagKind,
  isInteractive,
  type AmountSources,
  type RollFacts,
  type SelectedTag,
} from './tagEffects';

const SRC: AmountSources = { strengthRank: 8, presenceRank: 4, armourValue: 12 };
const NO_RAISES: RollFacts = { raises: 0, allLow: false };
const TWO_RAISES: RollFacts = { raises: 2, allLow: false };

function tag(def: Partial<WeaponTagDefinition> & { id: string }): WeaponTagDefinition {
  return { label: def.id, category: 'test', ...def };
}

function sel(def: WeaponTagDefinition, x?: number): SelectedTag {
  return { tagId: def.id, label: def.label, ref: { tagId: def.id, x }, def };
}

describe('kind inference', () => {
  it('treats a tag with no effects as flavour', () => {
    expect(getTagKind(tag({ id: 'a' }))).toBe('flavour');
    expect(isInteractive(tag({ id: 'a' }))).toBe(false);
  });

  it('treats a tag with a conditional effect as conditional', () => {
    const def = tag({ id: 'a', effects: [{ stage: 'penetration', op: 'multiply', amount: 2, when: { raisesAtLeast: 1 } }] });
    expect(getTagKind(def)).toBe('conditional');
  });

  it('honours an explicit kind over inference', () => {
    const def = tag({ id: 'a', kind: 'narrative', effect: 'Overheats on sustained fire' });
    expect(getTagKind(def)).toBe('narrative');
    expect(contributesArithmetic(def)).toBe(false);
  });
});

describe('conditions', () => {
  it('passes when no condition is declared', () => {
    expect(conditionMet(undefined, NO_RAISES)).toBe(true);
  });

  it('fails below the raise threshold', () => {
    expect(conditionMet({ raisesAtLeast: 2 }, { raises: 1, allLow: false })).toBe(false);
    expect(conditionMet({ raisesAtLeast: 2 }, TWO_RAISES)).toBe(true);
  });
});

describe('penetration ordering', () => {
  it('adds lance per success', () => {
    const def = tag({ id: 'lance', effects: [{ stage: 'penetration', op: 'add', amount: 'x', per: 'success' }] });
    const ledger = buildLedger([sel(def, 2)], TWO_RAISES, SRC);
    expect(effectivePenetration(0, ledger)).toBe(6);
  });

  it('doubles on a raise', () => {
    const def = tag({ id: 'razor', effects: [{ stage: 'penetration', op: 'multiply', amount: 2, when: { raisesAtLeast: 1 } }] });
    const ledger = buildLedger([sel(def)], TWO_RAISES, SRC);
    expect(effectivePenetration(10, ledger)).toBe(20);
  });

  it('lets a set beat a multiplier regardless of declaration order', () => {
    const set = tag({ id: 'pattern', effects: [{ stage: 'penetration', op: 'set', amount: 224 }] });
    const mult = tag({ id: 'melta', effects: [{ stage: 'penetration', op: 'multiply', amount: 2 }] });

    const multFirst = buildLedger([sel(mult), sel(set)], NO_RAISES, SRC);
    const setFirst = buildLedger([sel(set), sel(mult)], NO_RAISES, SRC);

    expect(effectivePenetration(10, multFirst)).toBe(MAX_PEN);
    expect(effectivePenetration(10, setFirst)).toBe(MAX_PEN);
  });

  it('caps penetration at the maximum', () => {
    const def = tag({ id: 'big', effects: [{ stage: 'penetration', op: 'add', amount: 900 }] });
    expect(effectivePenetration(0, buildLedger([sel(def)], NO_RAISES, SRC))).toBe(MAX_PEN);
  });
});

describe('raises and the raise-damage slot', () => {
  it('doubles the raise count from bane', () => {
    const def = tag({ id: 'bane', effects: [{ stage: 'raises', op: 'multiply', amount: 2 }] });
    expect(effectiveRaises(2, buildLedger([sel(def)], TWO_RAISES, SRC))).toBe(4);
  });

  it('leaves the standard raise damage when nothing overrides it', () => {
    expect(buildLedger([], TWO_RAISES, SRC).raiseDamage).toBe(BASE_RAISE_DAMAGE);
  });

  it('replaces rather than adds when devastating is present', () => {
    const dev = tag({ id: 'dev', effects: [{ stage: 'raiseDamage', op: 'set', amount: 'x' }] });
    expect(buildLedger([sel(dev, 6)], TWO_RAISES, SRC).raiseDamage).toBe(6);
  });

  it('composes bane then devastating without adding the standard value', () => {
    const bane = tag({ id: 'bane', effects: [{ stage: 'raises', op: 'multiply', amount: 2 }] });
    const dev = tag({ id: 'dev', effects: [{ stage: 'raiseDamage', op: 'set', amount: 'x' }] });
    const ledger = buildLedger([sel(bane), sel(dev, 6)], TWO_RAISES, SRC);
    expect(effectiveRaises(2, ledger) * ledger.raiseDamage).toBe(24);
  });
});

describe('resistance and magnitude', () => {
  it('subtracts felling from resistance', () => {
    const def = tag({ id: 'felling', effects: [{ stage: 'resistance', op: 'subtract', amount: 'x' }] });
    expect(effectiveResistance(10, buildLedger([sel(def, 4)], NO_RAISES, SRC))).toBe(6);
  });

  it('flats resistance to 4 for true-name', () => {
    const def = tag({ id: 'tn', effects: [{ stage: 'resistance', op: 'set', amount: 4 }] });
    expect(effectiveResistance(18, buildLedger([sel(def)], NO_RAISES, SRC))).toBe(4);
  });

  it('reads the armour value from the page for gravitic', () => {
    const def = tag({ id: 'grav', effects: [{ stage: 'damageModifier', op: 'add', amount: 'armourValue' }] });
    expect(buildLedger([sel(def)], NO_RAISES, SRC).damageModifier).toBe(12);
  });

  it('floors magnitude at 1', () => {
    const def = tag({ id: 'scatter', effects: [{ stage: 'magnitude', op: 'subtract', amount: 2 }] });
    expect(effectiveMagnitude(2, buildLedger([sel(def)], NO_RAISES, SRC))).toBe(1);
  });
});

describe('overrides and denial', () => {
  it('sets a death blow at two raises for vorpal', () => {
    const def = tag({ id: 'vorpal', effects: [{ stage: 'override', op: 'set', target: 'woundLevel', amount: 'deathBlow', when: { raisesAtLeast: 2 } }] });
    expect(buildLedger([sel(def)], TWO_RAISES, SRC).woundLevelOverride).toBe(8);
  });

  it('reports dormancy instead of applying below the threshold', () => {
    const def = tag({ id: 'vorpal', effects: [{ stage: 'override', op: 'set', target: 'woundLevel', amount: 'deathBlow', when: { raisesAtLeast: 2 } }] });
    const ledger = buildLedger([sel(def)], NO_RAISES, SRC);
    expect(ledger.woundLevelOverride).toBeNull();
    expect(ledger.entries[0].dormant).toBe(true);
  });

  it('denies parry for energy and records the source', () => {
    const def = tag({ id: 'energy', effects: [{ stage: 'parry', op: 'deny' }] });
    const ledger = buildLedger([sel(def)], NO_RAISES, SRC);
    expect(ledger.parryDenied).toBe(true);
    expect(ledger.deniedBy).toEqual(['energy']);
  });
});

describe('child effects', () => {
  const scatter = tag({
    id: 'scatter',
    effects: [
      { stage: 'magnitude', op: 'add', amount: 2, child: 'close' },
      { stage: 'magnitude', op: 'subtract', amount: 2, child: 'far' },
    ],
  });

  it('applies only enabled children', () => {
    const ledger = buildLedger([{ ...sel(scatter), activeChildren: ['far'] }], NO_RAISES, SRC);
    expect(ledger.magnitude).toBe(-2);
  });

  it('applies every child when none are excluded', () => {
    expect(buildLedger([sel(scatter)], NO_RAISES, SRC).magnitude).toBe(0);
  });
});

