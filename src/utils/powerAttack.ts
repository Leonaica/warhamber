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
  attributeDiePools: Record<AttributeName, { rank: number }>;
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
  character: WeaponSource,
): CharacterWeapon | null {
  const def = POWERS.find(p => p.id === entry.powerId);
  if (!def) return null;

  const forms = formsFor(def, entry);
  if (forms.length === 0) return null;

  // Attributes come from the power's borrowed aspect; the attacks keep their own.
  const borrowed = powerAspect(def);
  const pools = character.attributeDiePools;
  const magnitude = Math.min(11, Math.max(1, Math.ceil(pools[attrFor('Force', borrowed)].rank / 2)));
  const penetration = Math.min(224, Math.max(0, Math.ceil(pools[attrFor('Resist', borrowed)].rank / 2)));
  const range = rangeFor(pools[attrFor('Perceive', borrowed)].rank);

  return {
    id: `${POWER_WEAPON_PREFIX}${entry.id}`,
    name: entry.label || def.name,
    category: 'Spell',
    handedness: 'Hands free',
    attacks: forms.map((form, i) => ({
      id: `${POWER_WEAPON_PREFIX}${entry.id}:${i}`,
      name: form.name,
      aspect: form.aspect,
      type: form.type,
      magnitude,
      penetration,
      range,
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
