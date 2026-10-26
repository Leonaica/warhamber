import type { AspectName, AttackType, WeaponCapacity, WeaponCategory, WeaponHandedness, WeaponReloadTime } from '../types/character';

export const WEAPON_CATEGORY_GROUPS: Record<string, WeaponCategory[]> = {
  'Physical Weapons': ['Melee', 'Pistol', 'Ranged', 'Heavy', 'Mounted', 'Thrown'],
  'Natural Attacks': ['Natural', 'Unarmed'], 
  'Supernatural Attacks': ['Spell', 'Innate'],
};

export const WEAPON_CAPACITY_OPTIONS: { value: WeaponCapacity; label: string; description: string }[] = [
  { value: 'Single-shot', label: 'Single-shot', description: 'Reloads after each use' },
  { value: 'Limited', label: 'Limited', description: '2–4 actions; frequent reloads' },
  { value: 'Standard', label: 'Standard', description: '5–10 actions; occasional reloads' },
  { value: 'Extended', label: 'Extended', description: '11–30 actions; rare reloads' },
  { value: 'Continuous', label: 'Continuous', description: '31+ actions; usually lasts all scene' },
];

export const WEAPON_RELOAD_TIME_OPTIONS: { value: WeaponReloadTime; label: string; description: string }[] = [
  { value: 'Reflexive', label: 'Reflexive', description: 'Part of firing, if skilled' },
  { value: 'Quick', label: 'Quick', description: 'One action' },
  { value: 'Standard', label: 'Standard', description: 'All actions for one round' },
  { value: 'Slow', label: 'Slow', description: 'Two rounds (three if unfamiliar)' },
  { value: 'Extended', label: 'Extended', description: 'Half a minute or longer' },
];

export const DEFAULT_HANDEDNESS_BY_CATEGORY: Record<WeaponCategory, WeaponHandedness> = {
  Melee: 'One-handed',
  Pistol: 'One-handed',
  Ranged: 'Two-handed',
  Heavy: 'Two-handed',
  Mounted: 'Two-handed',
  Thrown: 'One-handed',
  Natural: 'One-handed',
  Unarmed: 'One-handed',
  Spell: 'One-handed',
  Innate: 'Hands free',
};

export const DEFAULT_ATTACK_BY_CATEGORY: Record<WeaponCategory, { aspect: AspectName; type: AttackType }> = {
  // Physical
  Melee: { aspect: 'Form', type: 'Slashing' },
  Pistol: { aspect: 'Form', type: 'Piercing' },
  Ranged: { aspect: 'Form', type: 'Piercing' },
  Heavy: { aspect: 'Form', type: 'Shockwave' },
  Mounted: { aspect: 'Form', type: 'Piercing' },
  Thrown: { aspect: 'Form', type: 'Piercing' },
  // Natural
  Natural: { aspect: 'Form', type: 'Piercing' },
  Unarmed: { aspect: 'Form', type: 'Distortion' },
  // Magic
  Spell: { aspect: 'Form', type: 'Annihilation' },
  Innate: { aspect: 'Form', type: 'Annihilation' },
};

export const ATTACK_TYPE_LABELS: Record<AttackType, string> = {
  // Form
  Annihilation: 'Annihilation — Destroying material through disintegrating, dissolving, melting, or burning',
  Slashing: 'Slashing — Cutting through structural connections to open flesh or sever components',
  Piercing: 'Piercing — Puncturing deep channels through structural connections',
  Distortion: 'Distortion — Warping, crushing, or reshaping without removing material',
  Shockwave: 'Shockwave — Destroying structure through catastrophic pressure waves',
  // Flesh
  Poisoning: 'Poisoning — Foreign substances interfering with biological processes',
  Infection: 'Infection — External organisms attacking from within',
  Asphyxiation: 'Asphyxiation — Denying oxygen or gas exchange without chemical interference',
  Burnout: 'Burnout — Breaking cells through energy overload or thermal extremes',
  Decay: 'Decay — Accelerating breakdown or transformation of living tissue',
  // Mind
  Shattering: 'Shattering — Mental fortitude (Willpower) broken by psychic assault, terror, torture, or overwhelming pressure',
  Degradation: 'Degradation — Processing capacity (Intelligence) degraded by neuron damage, logic corruption, or cognitive overload',
  Erasure: 'Erasure — Stored data (Memory) erased, scrambled, or overwritten',
  Dissolution: 'Dissolution — Mental presence and identity (Charisma) dissolved or fragmented',
  Subversion: 'Subversion — Hijacking the mind without damaging it',
  // Spirit
  Despair: 'Despair — Corroding the will to continue and find meaning',
  Severing: 'Severing — Cutting the connection between body and soul',
  Corruption: 'Corruption — Twisting or displacing the essential self',
  Unmaking: 'Unmaking — Consuming spiritual essence directly, annihilating the soul',
  Desecration: 'Desecration — Defiling the sacred or profaning essence',
  Doubt: 'Doubt — Destroying belief systems and conviction',
};

function formatCapacity(capacity?: { min: WeaponCapacity; max?: WeaponCapacity }): string {
  if (!capacity) return '';
  const max = capacity.max && capacity.max !== capacity.min ? `/${capacity.max}` : '';
  return `${capacity.min}${max}`;
}

export function formatWeaponLogistics(
  capacity?: { min: WeaponCapacity; max?: WeaponCapacity },
  reloadTime?: WeaponReloadTime
): string {
  const parts: string[] = [];
  const capStr = formatCapacity(capacity);
  if (capStr) parts.push(`${capStr} capacity`);
  if (reloadTime) parts.push(`${reloadTime} reload`);
  return parts.join(', ');
}