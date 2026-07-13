import type { AspectName, AttackType, WeaponCapacity, WeaponCategory, WeaponHandedness, WeaponReloadTime } from '../types/character';

export const WEAPON_CATEGORY_GROUPS: Record<string, WeaponCategory[]> = {
  'Physical Weapons': ['Melee', 'Pistol', 'Gun', 'Primitive', 'Heavy', 'Mounted', 'Thrown'],
  'Natural Attacks': ['Natural', 'Unarmed'],
  'Powers': ['Spell', 'Innate', 'Psionics'],
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
  Gun: 'Two-handed',
  Primitive: 'One-handed',
  Heavy: 'Two-handed',
  Mounted: 'Two-handed',
  Thrown: 'One-handed',
  Natural: 'One-handed',
  Unarmed: 'One-handed',
  Spell: 'One-handed',
  Innate: 'Hands free',
  Psionics: 'Hands free',
};

export const DEFAULT_ATTACK_BY_CATEGORY: Record<WeaponCategory, { aspect: AspectName; type: AttackType }> = {
  // Physical
  Melee: { aspect: 'Form', type: 'Slashing' },
  Pistol: { aspect: 'Form', type: 'Piercing' },
  Gun: { aspect: 'Form', type: 'Piercing' },
  Primitive: { aspect: 'Form', type: 'Bludgeoning' },
  Heavy: { aspect: 'Form', type: 'Explosive' },
  Mounted: { aspect: 'Form', type: 'Piercing' },
  Thrown: { aspect: 'Form', type: 'Piercing' },
  // Natural
  Natural: { aspect: 'Form', type: 'Piercing' },
  Unarmed: { aspect: 'Form', type: 'Bludgeoning' },
  // Magic
  Spell: { aspect: 'Form', type: 'Fire' },
  Innate: { aspect: 'Form', type: 'Fire' },
  Psionics: { aspect: 'Mind', type: 'Overload' },
};

export const MECHANISM_LABELS: Record<string, string> = {
  // Form
  Removal: 'Removal — Consuming, dissolving, stripping',
  Severance: 'Severance — Cutting, puncturing',
  Distortion: 'Distortion — Warping, crushing, reshaping',
  Fragmentation: 'Fragmentation — Breaking into pieces',
  StateDisruption: 'State Disruption — Altering material properties',
  Resonance: 'Resonance — Oscillation, pressure waves',
  // Flesh
  ChemicalDisruption: 'Chemical Disruption — Poisons, toxins',
  BiologicalInvasion: 'Biological Invasion — Diseases, parasites',
  FluidDisruption: 'Fluid Disruption — Blood, moisture',
  RespirationDisruption: 'Respiration Disruption — Breath, suffocation',
  EnergyDisruption: 'Energy Disruption — Electricity, radiation, temperature',
  SystemFailure: 'System Failure — Shutdowns, paralysis',
  Degeneration: 'Degeneration — Decay, aging, transformation',
  // Mind
  MemoryDamage: 'Memory Damage — Erasing, altering memories',
  ReasoningDamage: 'Reasoning Damage — Logic, confusion',
  PerceptionDamage: 'Perception Damage — Illusions, hallucinations',
  WillDamage: 'Will Damage — Control, compulsion',
  FocusDamage: 'Focus Damage — Overload, fatigue',
  IdentityDamage: 'Identity Damage — Self, continuity',
  // Spirit
  HopeDamage: 'Hope Damage — Despair, apathy',
  ConnectionDamage: 'Connection Damage — Bonds, relationships',
  IdentityCorruption: 'Identity Corruption — Twisting the self',
  EnergyDrain: 'Energy Drain — Consuming essence',
  Burden: 'Burden — Curses, obligations',
  Violation: 'Violation — Defiling, profaning',
  FaithDamage: 'Faith Damage — Belief, conviction',
};

export function formatCapacity(capacity?: { min: WeaponCapacity; max?: WeaponCapacity }): string {
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