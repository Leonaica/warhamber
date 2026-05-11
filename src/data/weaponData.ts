import type { AspectName, AttackType, WeaponCategory } from '../types/character';

export const WEAPON_CATEGORY_GROUPS: Record<string, WeaponCategory[]> = {
  'Physical Weapons': ['Melee', 'Pistol', 'Gun', 'Heavy', 'Mounted', 'Thrown'],
  'Natural Attacks': ['Natural', 'Unarmed'],
  'Magic': ['Spell', 'Innate', 'Pact', 'PrimeMagic'],
  'Psionics': ['Biokinesis', 'Telekinesis', 'Telepathy', 'Divination', 'Pyrokinesis'],
  'Powers': ['Pattern', 'Logrus', 'Tarot', 'Shapeshifting', 'BrokenPattern'],
  'Artifice': ['Psychomancy', 'Plasmancy', 'Chronomancy', 'Ethermancy', 'Alchemancy', 'Technomancy'],
};

export const DEFAULT_ATTACK_BY_CATEGORY: Record<WeaponCategory, { aspect: AspectName; type: AttackType }> = {
  // Physical
  Melee: { aspect: 'Form', type: 'Slashing' },
  Pistol: { aspect: 'Form', type: 'Piercing' },
  Gun: { aspect: 'Form', type: 'Piercing' },
  Heavy: { aspect: 'Form', type: 'Explosive' },
  Mounted: { aspect: 'Form', type: 'Piercing' },
  Thrown: { aspect: 'Form', type: 'Piercing' },
  // Natural
  Natural: { aspect: 'Form', type: 'Piercing' },
  Unarmed: { aspect: 'Form', type: 'Bludgeoning' },
  // Magic
  Spell: { aspect: 'Form', type: 'Fire' },
  Innate: { aspect: 'Form', type: 'Fire' },
  Pact: { aspect: 'Spirit', type: 'Curse' },
  PrimeMagic: { aspect: 'Form', type: 'Fire' },
  // Psionics
  Biokinesis: { aspect: 'Flesh', type: 'Necrosis' },
  Telekinesis: { aspect: 'Form', type: 'Bludgeoning' },
  Telepathy: { aspect: 'Mind', type: 'Overload' },
  Divination: { aspect: 'Mind', type: 'MemoryAlteration' },
  Pyrokinesis: { aspect: 'Form', type: 'Fire' },
  // Powers
  Pattern: { aspect: 'Spirit', type: 'Stasis' },
  Logrus: { aspect: 'Spirit', type: 'Distortion' },
  Tarot: { aspect: 'Spirit', type: 'Curse' },
  Shapeshifting: { aspect: 'Flesh', type: 'Mutation' },
  BrokenPattern: { aspect: 'Spirit', type: 'Distortion' },
  // Artifice
  Psychomancy: { aspect: 'Mind', type: 'Overload' },
  Plasmancy: { aspect: 'Form', type: 'Fire' },
  Chronomancy: { aspect: 'Form', type: 'Stasis' },
  Ethermancy: { aspect: 'Spirit', type: 'SoulDrain' },
  Alchemancy: { aspect: 'Flesh', type: 'Poison' },
  Technomancy: { aspect: 'Form', type: 'Piercing' },
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