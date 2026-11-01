import type {
  AspectName,
  AttributeName,
  CharacterPower,
  CharacterWeapon,
  FunctionName,
  Power,
  PowerAttackForm,
  WeaponRange,
} from '../types/character';
import { ATTRIBUTES, WEAPON_RANGES } from '../types/character';
import { POWERS } from '../data/powers';
import { POWER_ATTACK_FORMS } from '../data/powerAttacks';

export const POWER_WEAPON_PREFIX = 'power:';

export function isPowerWeaponId(id: string): boolean {
  return id.startsWith(POWER_WEAPON_PREFIX);
}

/** The slice of a character the derivation reads. */
interface WeaponSource {
  weapons: CharacterWeapon[];
  powers: CharacterPower[];
  attributeDiePools: Record<AttributeName, { rank: number; pool: { max: number } }>;
}

function entryText(entry: CharacterPower): string {
  return [entry.label, entry.customTitle, entry.description].filter(Boolean).join(' ');
}

/**
 * The forms this entry can actually use. When the entry names a discipline,
 * only that discipline's forms apply — so a Divination psion gets none and the
 * chip disappears, while a Telepath gets the Telepathy list.
 */
function formsFor(def: Power, entry: CharacterPower): PowerAttackForm[] {
  const all = POWER_ATTACK_FORMS[def.id] ?? [];
  const text = entryText(entry);
  const named = new Set(all.filter(f => f.subPower && text.includes(f.subPower)).map(f => f.subPower));
  if (named.size === 0) return all;
  return all.filter(f => !f.subPower || named.has(f.subPower));
}

/** A power is a virtual aspect; with none stated, fall back to its key attribute. */
function powerAspect(def: Power): AspectName {
  if (def.attributeAspect) return def.attributeAspect;
  const first = def.keyAttributes[0];
  return ATTRIBUTES.find(a => a.id === first)?.aspect ?? 'Form';
}

function attrFor(func: FunctionName, aspect: AspectName): AttributeName {
  return ATTRIBUTES.find(a => a.func === func && a.aspect === aspect)!.id;
}

function rangeFor(rank: number): WeaponRange {
  const step = Math.min(20, Math.max(1, rank));
  return WEAPON_RANGES.find(r => r.step === step)!.value;
}

/**
 * The generic attack a power provides, derived fresh from the Basic Power
 * Parameters: Range is the Perceive attribute's rank on the Range Table,
 * Magnitude is Force divided by two (round up), Penetration is Resist divided
 * by two. Derived on read, so raising the power's points never leaves a stale
 * copy behind.
 *
 * This is a template. Splitting a fireball into three daggers, or narrowing it
 * to one target at higher Magnitude, is the Finesse test — done on the combat
 * page, not here.
 */
export function powerAttackWeapon(
  entry: CharacterPower,
  _character: WeaponSource,
): CharacterWeapon | null {
  const def = POWERS.find(p => p.id === entry.powerId);
  if (!def) return null;

  const forms = formsFor(def, entry);
  if (forms.length === 0) return null;

  // Attributes come from the power's borrowed aspect; the attacks keep their own.
  return {
    id: `${POWER_WEAPON_PREFIX}${entry.id}`,
    name: entry.label || def.name,
    category: 'Spell',
    handedness: 'Hands free',
    // The weapon carries the base effect. What the caps allow is bought with
    // successes in the resolver, not baked in here.
    attacks: forms.map((form, i) => ({
      id: `${POWER_WEAPON_PREFIX}${entry.id}:${i}`,
      name: form.name,
      internal: form.internal,
      aspect: form.aspect,
      type: form.type,
      magnitude: 1,
      penetration: 0,
      range: rangeFor(1),
      ...(form.note ? { isConditional: true, condition: form.note } : {}),
    })),
  };
}

/** Resolve a weapon id that may name a power attack rather than carried gear. */
export function findWeapon(character: WeaponSource, id: string): CharacterWeapon | undefined {
  if (!isPowerWeaponId(id)) return character.weapons.find(w => w.id === id);
  const entry = character.powers.find(p => `${POWER_WEAPON_PREFIX}${p.id}` === id);
  return entry ? powerAttackWeapon(entry, character) ?? undefined : undefined;
}

/** Every attack on hand, carried weapons first. */
export function allWeapons(character: WeaponSource): CharacterWeapon[] {
  const fromPowers = character.powers
    .map(entry => powerAttackWeapon(entry, character))
    .filter((w): w is CharacterWeapon => w !== null);
  return [...character.weapons, ...fromPowers];
}

export interface PowerCaps {
  magnitude: number;
  penetration: number;
  range: number;
  targets: number;
  radius: number;
  qualities: number;
}

/**
 * Ceilings on what successes may buy for this power, from its Key Attributes.
 * Magnitude halves because the damage table is bounded; penetration caps at the
 * Resist pool's face value, so d12 is 12 and 2d12+d4 is 28.
 */
export function powerCaps(entry: CharacterPower, character: WeaponSource): PowerCaps | null {
  const def = POWERS.find(p => p.id === entry.powerId);
  if (!def) return null;

  const borrowed = powerAspect(def);
  const pools = character.attributeDiePools;
  const finesse = pools[attrFor('Finesse', borrowed)].rank;

  return {
    magnitude: Math.min(11, Math.max(1, Math.ceil(pools[attrFor('Force', borrowed)].rank / 2))),
    penetration: Math.max(0, pools[attrFor('Resist', borrowed)].pool.max),
    range: Math.max(1, pools[attrFor('Perceive', borrowed)].rank),
    targets: Math.max(1, finesse),
    radius: Math.max(1, Math.ceil(finesse / 2)),
    qualities: Math.max(0, finesse),
  };
}

/** The power entry behind a power weapon id, if the id names one. */
export function powerEntryForId(character: WeaponSource, id: string): CharacterPower | undefined {
  if (!isPowerWeaponId(id)) return undefined;
  return character.powers.find(p => `${POWER_WEAPON_PREFIX}${p.id}` === id);
}

/** The attribute that activates a power: always its Force attribute. */
export function powerActivationAttribute(
  entry: CharacterPower,
  _character: WeaponSource,
): AttributeName | undefined {
  const def = POWERS.find(p => p.id === entry.powerId);
  if (!def) return undefined;
  return attrFor('Force', powerAspect(def));
}
