import { describe, expect, it } from 'vitest';
import { WEAPON_TAG_LIBRARY } from '../data/weaponTags';
import type { WeaponTagDefinition } from '../types/character';
import {
  BASE_RAISE_DAMAGE, MAX_MAGNITUDE, MAX_PEN, buildLedger, contributesArithmetic,
  effectiveMagnitude, effectivePenetration, effectiveRaises, effectiveResistance,
  getTagKind, isDefaultActive, isInteractive,
  type AmountSources, type RollFacts, type SelectedTag,
} from './tagLedger';
import { conditionMet } from '../data/tagVocabulary';

const SRC: AmountSources = { strengthRank: 8, presenceRank: 4, armorValue: 12 };
const NONE: RollFacts = { raises: 0, allLow: false };
const TWO: RollFacts = { raises: 2, allLow: false };

function tag(def: Partial<WeaponTagDefinition> & { id: string }): WeaponTagDefinition {
  return { label: def.id, category: 'test', ...def, kind: def.kind ?? 'arithmetic' };
}
function sel(def: WeaponTagDefinition, x?: number): SelectedTag {
  return { tagId: def.id, label: def.label, ref: { tagId: def.id, x }, def };
}

describe('library coverage', () => {
  it('gives every library tag a kind', () => {
    expect(WEAPON_TAG_LIBRARY.filter(t => !t.kind).map(t => t.id)).toEqual([]);
  });
  it('gives arithmetic and conditional tags effects', () => {
    expect(WEAPON_TAG_LIBRARY
      .filter(t => (t.kind === 'arithmetic' || t.kind === 'conditional') && !t.effects?.length)
      .map(t => t.id)).toEqual([]);
  });
  it('gives flavor tags no effects', () => {
    expect(WEAPON_TAG_LIBRARY.filter(t => t.kind === 'flavor' && t.effects?.length).map(t => t.id)).toEqual([]);
  });
  it('never defaults a secondTest or flavor tag active', () => {
    expect(WEAPON_TAG_LIBRARY
      .filter(t => t.defaultActive && (t.kind === 'secondTest' || t.kind === 'flavor'))
      .map(t => t.id)).toEqual([]);
  });
  it('has unique ids', () => {
    const ids = WEAPON_TAG_LIBRARY.map(t => t.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe('kinds', () => {
  it('treats a missing kind as flavor', () => {
    expect(getTagKind({ id: 'x', label: 'x', category: 'c' } as WeaponTagDefinition)).toBe('flavor');
    expect(isInteractive({ id: 'x', label: 'x', category: 'c' } as WeaponTagDefinition)).toBe(false);
  });
  it('treats narrative as non-arithmetic', () => {
    const d = tag({ id: 'n', kind: 'narrative' });
    expect(contributesArithmetic(d)).toBe(false);
    expect(isInteractive(d)).toBe(true);
  });
  it('reads defaultActive', () => {
    expect(isDefaultActive(tag({ id: 'a' }))).toBe(false);
    expect(isDefaultActive(tag({ id: 'b', defaultActive: true }))).toBe(true);
  });
});

describe('conditions', () => {
  it('passes with none declared', () => expect(conditionMet(undefined, NONE)).toBe(true));
  it('fails below the threshold', () => {
    expect(conditionMet({ raisesAtLeast: 2 }, { raises: 1, allLow: false })).toBe(false);
    expect(conditionMet({ raisesAtLeast: 2 }, TWO)).toBe(true);
  });
});

describe('penetration', () => {
  it('adds lance per success', () => {
    const d = tag({ id: 'lance', effects: [{ stage: 'penetration', op: 'add', amount: 'x', per: 'success' }] });
    expect(effectivePenetration(0, buildLedger([sel(d, 2)], TWO, SRC))).toBe(6);
  });
  it('doubles on a raise', () => {
    const d = tag({ id: 'r', effects: [{ stage: 'penetration', op: 'multiply', amount: 2, when: { raisesAtLeast: 1 } }] });
    expect(effectivePenetration(10, buildLedger([sel(d)], TWO, SRC))).toBe(20);
  });
  it('lets a set beat a multiplier in either order', () => {
    const s = tag({ id: 's', effects: [{ stage: 'penetration', op: 'set', amount: 224 }] });
    const m = tag({ id: 'm', effects: [{ stage: 'penetration', op: 'multiply', amount: 2 }] });
    expect(effectivePenetration(10, buildLedger([sel(m), sel(s)], NONE, SRC))).toBe(MAX_PEN);
    expect(effectivePenetration(10, buildLedger([sel(s), sel(m)], NONE, SRC))).toBe(MAX_PEN);
  });
  it('caps at the maximum', () => {
    const d = tag({ id: 'b', effects: [{ stage: 'penetration', op: 'add', amount: 900 }] });
    expect(effectivePenetration(0, buildLedger([sel(d)], NONE, SRC))).toBe(MAX_PEN);
  });
});

describe('raises and the raise slot', () => {
  it('doubles raises for bane', () => {
    const d = tag({ id: 'b', effects: [{ stage: 'raises', op: 'multiply', amount: 2 }] });
    expect(effectiveRaises(2, buildLedger([sel(d)], TWO, SRC))).toBe(4);
  });
  it('keeps the standard slot by default', () => expect(buildLedger([], TWO, SRC).raiseDamage).toBe(BASE_RAISE_DAMAGE));
  it('replaces rather than adds', () => {
    const d = tag({ id: 'd', effects: [{ stage: 'raiseDamage', op: 'set', amount: 'x' }] });
    expect(buildLedger([sel(d, 6)], TWO, SRC).raiseDamage).toBe(6);
  });
  it('composes bane then devastating', () => {
    const b = tag({ id: 'b', effects: [{ stage: 'raises', op: 'multiply', amount: 2 }] });
    const d = tag({ id: 'd', effects: [{ stage: 'raiseDamage', op: 'set', amount: 'x' }] });
    const l = buildLedger([sel(b), sel(d, 6)], TWO, SRC);
    expect(effectiveRaises(2, l) * l.raiseDamage).toBe(24);
  });
});

describe('resistance and magnitude', () => {
  it('subtracts felling', () => {
    const d = tag({ id: 'f', effects: [{ stage: 'resistance', op: 'subtract', amount: 'x' }] });
    expect(effectiveResistance(10, buildLedger([sel(d, 4)], NONE, SRC))).toBe(6);
  });
  it('flats resistance for true-name', () => {
    const d = tag({ id: 't', effects: [{ stage: 'resistance', op: 'set', amount: 4 }] });
    expect(effectiveResistance(18, buildLedger([sel(d)], NONE, SRC))).toBe(4);
  });
  it('reads armor from the page for gravitic', () => {
    const d = tag({ id: 'g', effects: [{ stage: 'damageModifier', op: 'add', amount: 'armorValue' }] });
    expect(buildLedger([sel(d)], NONE, SRC).damageModifier).toBe(12);
  });
  it('floors magnitude at 1', () => {
    const d = tag({ id: 's', effects: [{ stage: 'magnitude', op: 'subtract', amount: 2 }] });
    expect(effectiveMagnitude(2, buildLedger([sel(d)], NONE, SRC))).toBe(1);
  });
});

describe('overrides and denial', () => {
  it('sets a death blow at two raises', () => {
    const d = tag({ id: 'v', effects: [{ stage: 'override', op: 'set', target: 'woundLevel', amount: 'deathBlow', when: { raisesAtLeast: 2 } }] });
    expect(buildLedger([sel(d)], TWO, SRC).woundLevelOverride).toBe(8);
  });
  it('reports dormancy below the threshold', () => {
    const d = tag({ id: 'v', effects: [{ stage: 'override', op: 'set', target: 'woundLevel', amount: 'deathBlow', when: { raisesAtLeast: 2 } }] });
    const l = buildLedger([sel(d)], NONE, SRC);
    expect(l.woundLevelOverride).toBeNull();
    expect(l.entries[0].dormant).toBe(true);
  });
  it('denies parry and records the source', () => {
    const d = tag({ id: 'energy', effects: [{ stage: 'parry', op: 'deny' }] });
    const l = buildLedger([sel(d)], NONE, SRC);
    expect(l.parryDenied).toBe(true);
    expect(l.deniedBy).toEqual(['energy']);
  });
});

describe('children', () => {
  const scatter = tag({ id: 's', effects: [
    { stage: 'magnitude', op: 'add', amount: 2, child: 'close' },
    { stage: 'magnitude', op: 'subtract', amount: 2, child: 'far' },
  ]});
  it('applies only enabled children', () => {
    expect(buildLedger([{ ...sel(scatter), activeChildren: ['far'] }], NONE, SRC).magnitude).toBe(-2);
  });
  it('applies all children when none are excluded', () => {
    expect(buildLedger([sel(scatter)], NONE, SRC).magnitude).toBe(0);
  });
});

describe('magnitude shifts', () => {
  const mag = (n: number) => ({
    id: `m${n}`, label: 'm', category: 't', kind: 'arithmetic' as const,
    effects: [{ stage: 'magnitude' as const, op: 'add' as const, amount: n }],
  });

  it('shifts the pool by the full amount', () => {
    expect(effectiveMagnitude(2, buildLedger([sel(mag(4))], NONE, SRC))).toBe(6);
  });

  it('clamps at the table maximum instead of falling back to Mag 3', () => {
    expect(effectiveMagnitude(9, buildLedger([sel(mag(4))], NONE, SRC))).toBe(MAX_MAGNITUDE);
  });
});

describe('child labels', () => {
  it('labels every child effect', () => {
    const bad = WEAPON_TAG_LIBRARY.flatMap(t =>
      (t.effects ?? []).filter(e => e.child && !e.childLabel).map(e => `${t.id}:${e.child}`),
    );
    expect(bad).toEqual([]);
  });
});
