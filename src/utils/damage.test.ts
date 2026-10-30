import { describe, expect, it } from 'vitest';
import { calculateDamage, resolveDamageNumbers } from './damage';
import { BASE_RAISE_DAMAGE, buildLedger, emptyLedger, type AmountSources, type SelectedTag } from './tagLedger';
import type { WeaponTagDefinition } from '../types/character';

const SRC: AmountSources = { strengthRank: 8, presenceRank: 4, armorValue: 0 };
const NONE = { raises: 0, allLow: false, aiming: false };

function tag(def: Partial<WeaponTagDefinition> & { id: string }): WeaponTagDefinition {
  return { label: def.id, category: 'test', ...def, kind: def.kind ?? 'arithmetic' };
}
function sel(def: WeaponTagDefinition, x?: number): SelectedTag {
  return { tagId: def.id, label: def.label, ref: { tagId: def.id, x }, def };
}
const base = { weaponRollTotal: 20, damageModifier: 0, raises: 0, resistance: 10, armorValue: 5, penetration: 0 };

describe('resolveDamageNumbers', () => {
  it('subtracts resistance and armor', () => {
    expect(resolveDamageNumbers({ ...base, ledger: emptyLedger() }).finalDamage).toBe(5);
  });

  it('floors at zero', () => {
    expect(resolveDamageNumbers({ ...base, resistance: 100, ledger: emptyLedger() }).finalDamage).toBe(0);
  });

  it('reduces armor by penetration', () => {
    expect(resolveDamageNumbers({ ...base, penetration: 3, ledger: emptyLedger() }).effectiveArmor).toBe(2);
  });

  it('ignores armor when a tag sets it to zero', () => {
    const d = tag({ id: 'tn', effects: [{ stage: 'armor', op: 'set', amount: 0 }] });
    const ledger = buildLedger([sel(d)], NONE, SRC);
    const out = resolveDamageNumbers({ ...base, ledger });
    expect(out.effectiveArmor).toBe(0);
    expect(out.finalDamage).toBe(10);
  });

  it('uses the standard raise damage', () => {
    const out = resolveDamageNumbers({ ...base, raises: 2, ledger: emptyLedger() });
    expect(out.raiseDamage).toBe(2 * BASE_RAISE_DAMAGE);
  });

  it('uses the devastating slot and the bane multiplier together', () => {
    const bane = tag({ id: 'bane', effects: [{ stage: 'raises', op: 'multiply', amount: 2 }] });
    const dev = tag({ id: 'dev', effects: [{ stage: 'raiseDamage', op: 'set', amount: 'x' }] });
    const ledger = buildLedger([sel(bane), sel(dev, 6)], NONE, SRC);
    expect(resolveDamageNumbers({ ...base, raises: 2, ledger }).raiseDamage).toBe(24);
  });

  it('adds the ledger damage modifier', () => {
    const d = tag({ id: 'sb', effects: [{ stage: 'damageModifier', op: 'add', amount: 'strength' }] });
    const ledger = buildLedger([sel(d)], NONE, SRC);
    expect(resolveDamageNumbers({ ...base, ledger }).weaponDamage).toBe(28);
  });
});

describe('calculateDamage', () => {
  it('bypasses the roll entirely on a vorpal override', () => {
    const d = tag({
      id: 'vorpal', kind: 'conditional',
      effects: [{ stage: 'override', op: 'set', target: 'woundLevel', amount: 'deathBlow', when: { raisesAtLeast: 2 } }],
    });
    const ledger = buildLedger([sel(d)], { raises: 2, allLow: false, aiming: false }, SRC);
    const out = calculateDamage({
      weaponMagnitude: 3, weaponPenetration: 0, attackedAspect: 'Form',
      resistanceRank: 99, sizeModifier: 0, armorValue: 999, raises: 2, ledger,
    });
    expect(out.bypassed).toBe('vorpal');
    expect(out.woundLevel).toBe(8);
    expect(out.finalDamage).toBe(0);
    expect(out.weaponRollDetails.dice).toEqual([]);
  });

  it('still rolls when the vorpal condition is unmet', () => {
    const d = tag({
      id: 'vorpal', kind: 'conditional',
      effects: [{ stage: 'override', op: 'set', target: 'woundLevel', amount: 'deathBlow', when: { raisesAtLeast: 2 } }],
    });
    const ledger = buildLedger([sel(d)], NONE, SRC);
    const out = calculateDamage({
      weaponMagnitude: 3, weaponPenetration: 0, attackedAspect: 'Form',
      resistanceRank: 2, sizeModifier: 0, armorValue: 0, ledger,
    });
    expect(out.bypassed).toBeNull();
    expect(out.weaponRollDetails.dice.length).toBe(3);
  });

  it('clamps magnitude so a scatter penalty cannot reach zero', () => {
    const d = tag({ id: 'sc', effects: [{ stage: 'magnitude', op: 'subtract', amount: 2 }] });
    const ledger = buildLedger([sel(d)], NONE, SRC);
    const out = calculateDamage({
      weaponMagnitude: 2, weaponPenetration: 0, attackedAspect: 'Form',
      resistanceRank: 0, sizeModifier: 0, armorValue: 0, ledger,
    });
    expect(out.effectiveMagnitude).toBe(1);
    expect(out.weaponRollDetails.dice.length).toBe(1);
  });
});
