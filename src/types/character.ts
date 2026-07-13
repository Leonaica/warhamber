// Rating scale for Aspects and Functions
export type RatingValue = -20 | -15 | -10 | -5 | 0 | 5 | 10 | 15 | 20 | 25 | 30;

export const RATING_SCALE: RatingValue[] = [
  -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30
];

export const RATING_LABELS: Record<RatingValue, string> = {
  [-20]: '⛓️‍💥 Poor Human',
  [-15]: '🚶 Typical Human',
  [-10]: '🧗 Talented Human',
  [-5]: '🏆 Peak Human',
  0: '💪 Amberite Norm',
  5: '🐅 Primeval Beast',
  10: '🐉 Supernatural',
  15: '👑 Legend',
  20: '✨ Mythic',
  25: '🪽 Paragon',
  30: '🔥 Incarnation',
};

// Aspects (What you are)
export type AspectName = 'Form' | 'Flesh' | 'Mind' | 'Spirit';

export interface Aspect {
  id: AspectName;
  name: string;
  emoji: string;
  description: string;
}

export const ASPECTS: Aspect[] = [
  {
    id: 'Form',
    name: 'Form',
    emoji: '🧱',
    description: 'The mechanical structure and shape of a thing — its solid, physical framework in the world.',
  },
  {
    id: 'Flesh',
    name: 'Flesh',
    emoji: '🧬',
    description: 'The living biological essence of a being, shaping how it endures, adapts, perceives, and influences.',
  },
  {
    id: 'Mind',
    name: 'Mind',
    emoji: '🧠',
    description: 'The incorporeal realm of logic, reason, and knowledge that governs formal magic and technology.',
  },
  {
    id: 'Spirit',
    name: 'Spirit',
    emoji: '🔥',
    description: 'The incorporeal identity of the soul — the self-aware life force.',
  },
];

// Functions (What you do)
export type FunctionName = 'Resist' | 'Finesse' | 'Perceive' | 'Force';

export interface Function {
  id: FunctionName;
  name: string;
  emoji: string;
  description: string;
}

export const FUNCTIONS: Function[] = [
  {
    id: 'Resist',
    name: 'Resist',
    emoji: '🛡️',
    description: 'The ability to withstand hardship, damage, and pressure.',
  },
  {
    id: 'Finesse',
    name: 'Finesse',
    emoji: '🎯',
    description: 'The capacity to move, change, and respond with speed and precision.',
  },
  {
    id: 'Perceive',
    name: 'Perceive',
    emoji: '👁️',
    description: 'The skill of sensing and understanding the world.',
  },
  {
    id: 'Force',
    name: 'Force',
    emoji: '💪',
    description: 'The power to act upon and influence others.',
  },
];

// Attributes (derived from Function + Aspect)
export type AttributeName =
  | 'Toughness' | 'Endurance' | 'Willpower' | 'Resilience'
  | 'Agility' | 'Reflexes' | 'Intelligence' | 'Inspiration'
  | 'Perception' | 'Intuition' | 'Memory' | 'Wisdom'
  | 'Strength' | 'Magnetism' | 'Charisma' | 'Presence';

export interface Attribute {
  id: AttributeName;
  name: string;
  func: FunctionName;
  aspect: AspectName;
  description: string;
}

export const ATTRIBUTES: Attribute[] = [
  // Resist
  { id: 'Toughness', name: 'Toughness', func: 'Resist', aspect: 'Form', description: 'Resistance to physical harm or degradation' },
  { id: 'Endurance', name: 'Endurance', func: 'Resist', aspect: 'Flesh', description: 'Biological stamina, fatigue resistance, healing' },
  { id: 'Willpower', name: 'Willpower', func: 'Resist', aspect: 'Mind', description: 'Mental discipline, focus, and resistance to control' },
  { id: 'Resilience', name: 'Resilience', func: 'Resist', aspect: 'Spirit', description: 'Spiritual strength and emotional resilience' },
  // Finesse
  { id: 'Agility', name: 'Agility', func: 'Finesse', aspect: 'Form', description: 'Mechanical movement, speed, and balance' },
  { id: 'Reflexes', name: 'Reflexes', func: 'Finesse', aspect: 'Flesh', description: 'Instinctive reaction, evasion, bodily coordination' },
  { id: 'Intelligence', name: 'Intelligence', func: 'Finesse', aspect: 'Mind', description: 'Problem-solving, logic, processing speed' },
  { id: 'Inspiration', name: 'Inspiration', func: 'Finesse', aspect: 'Spirit', description: 'Spontaneity, artistic improvisation, spiritual flow' },
  // Perceive
  { id: 'Perception', name: 'Perception', func: 'Perceive', aspect: 'Form', description: 'Accuracy of external physical senses' },
  { id: 'Intuition', name: 'Intuition', func: 'Perceive', aspect: 'Flesh', description: 'Subconscious awareness of danger or emotional states' },
  { id: 'Memory', name: 'Memory', func: 'Perceive', aspect: 'Mind', description: 'Perception of mental constructs — learned experience and knowledge' },
  { id: 'Wisdom', name: 'Wisdom', func: 'Perceive', aspect: 'Spirit', description: 'Moral understanding, spiritual insight' },
  // Force
  { id: 'Strength', name: 'Strength', func: 'Force', aspect: 'Form', description: 'Capacity to exert physical power on the world' },
  { id: 'Magnetism', name: 'Magnetism', func: 'Force', aspect: 'Flesh', description: 'Physical attractiveness, magnetism, biological influence' },
  { id: 'Charisma', name: 'Charisma', func: 'Force', aspect: 'Mind', description: 'Mental persuasion, rhetoric, leadership' },
  { id: 'Presence', name: 'Presence', func: 'Force', aspect: 'Spirit', description: 'Spiritual gravitas, emotional impact on others' },
];

export interface DiePool {
  dice: number[];
  notation: string; // e.g., "2d12 + d6" or "d4÷2"
  min: number;
  max: number;
  divisor?: number; // For d4÷2 case
}

// Skill ratings
export type SkillRating = 'Terrible' | 'Poor' | 'Average' | 'Good' | 'Great' | 'Exceptional' | 'Extraordinary';

export const SKILL_RATINGS: { rating: SkillRating; modifier: number; cost: number }[] = [
  { rating: 'Terrible', modifier: -2, cost: -10 },
  { rating: 'Poor', modifier: -1, cost: -5 },
  { rating: 'Average', modifier: 0, cost: 0 },
  { rating: 'Good', modifier: 1, cost: 0 },
  { rating: 'Great', modifier: 2, cost: 0 },
  { rating: 'Exceptional', modifier: 3, cost: 5 },
  { rating: 'Extraordinary', modifier: 4, cost: 10 },
];

// Skills
export type SkillName =
  | 'SilverTongue' | 'WhisperersWeb' | 'LeadersMantle' | 'UnseenHand'
  | 'WayOfTheWarrior' | 'WayOfTheRogue' | 'EngineersPen' | 'WayOfTheExplorer'
  | 'HeartsFire' | 'ArtisansCraft' | 'MachinesMind' | 'ScholarsMind';

export interface Skill {
  id: SkillName;
  name: string;
  emoji: string;
  category: 'Social' | 'Physical' | 'Abstract';
  description: string;
}

// Power categories
export type PowerCategory = 'Substance' | 'Semi-Substance' | 'Shadow';

export interface PowerLevel {
  name: string;
  cost: number;
}

export interface Power {
  id: string;
  name: string;
  emoji: string;
  customTitle?: string;
  category: PowerCategory;
  description: string;
  requirements: string;
  keyAttributes: AttributeName[];
  levels: PowerLevel[];
  prerequisites?: PowerPrerequisite[];
  repeatable?: boolean; // Can the power be taken multiple times?
  subPowers?: string[]; // Psionic Disciplines, Artifice Sciences, etc.
  practitioner?: string;
  subPowerAdjectives?: Record<string, string>; // Maps subpower to adjective form
}

// Prerequisites to use a power
export interface PowerPrerequisite {
  type: 'attribute' | 'aspect' | 'function' | 'power';
  // For attribute prerequisites
  attribute?: AttributeName;
  // For aspect prerequisites
  aspect?: AspectName;
  // For function prerequisites
  func?: FunctionName;
  // Minimum value required
  minimum?: number;
  // For power prerequisites
  powerId?: string;
  powerPoints?: number;
  // Minimum rank for which a prerequsite applies
  appliesAtPoints?: number;
}

// Character state
export interface CharacterAspectRatings {
  Form: RatingValue;
  Flesh: RatingValue;
  Mind: RatingValue;
  Spirit: RatingValue;
}

export interface CharacterFunctionRatings {
  Resist: RatingValue;
  Finesse: RatingValue;
  Perceive: RatingValue;
  Force: RatingValue;
}

export interface CharacterSkill {
  skillId: SkillName;
  rating: SkillRating;
  specialty: string;
  specialtyExplanation: string; // Detailed description of how the skill is used for the avatar
}

export interface CharacterPower {
  id: string;
  powerId: string;
  points: number;
  label: string; // Display name (defaults to tier name, editable)
  customTitle?: string;
  description: string; // How this power manifests for the avatar
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  cost: number;
  attributes?: Partial<Record<AttributeName, number>>;
  powers?: string[];
  quantity: number;
}

export interface Ally {
  id: string;
  name: string;
  description: string;
  cost: number;
  loyalty: number; // 1-6 positive = ally, -1 to -6 = nemesis
}

export interface PersonalShadow {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export type SizeValue = -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const SIZE_OPTIONS: { value: SizeValue; label: string; description: string }[] = [
  { value: -3, label: 'Minuscule', description: 'to 500g' },
  { value: -2, label: 'Puny', description: 'to 4kg' },
  { value: -1, label: 'Weedy', description: 'to 30kg' },
  { value: 0, label: 'Average', description: 'to 200kg' },
  { value: 1, label: 'Hulking', description: 'to 2 tons' },
  { value: 2, label: 'Enormous', description: 'to 16 tons' },
  { value: 3, label: 'Massive', description: 'to 125 tons' },
  { value: 4, label: 'Immense', description: 'to 1000 tons' },
  { value: 5, label: 'Monumental', description: 'to 10k tons' },
  { value: 6, label: 'Titanic', description: 'to 100k tons' },
];

// === MECHANISMS ===

export type FormMechanism = 
  | 'Removal' | 'Severance' | 'Distortion' | 'Fragmentation' 
  | 'StateDisruption' | 'Resonance';

export type FleshMechanism = 
  | 'ChemicalDisruption' | 'BiologicalInvasion' | 'FluidDisruption' 
  | 'RespirationDisruption' | 'EnergyDisruption' | 'SystemFailure' | 'Degeneration';

export type MindMechanism = 
  | 'MemoryDamage' | 'ReasoningDamage' | 'PerceptionDamage' 
  | 'WillDamage' | 'FocusDamage';

export type SpiritMechanism = 
  | 'HopeDamage' | 'ConnectionDamage' | 'IdentityDamage' | 'IdentityCorruption' 
  | 'EnergyDrain' | 'Burden' | 'Violation' | 'FaithDamage';

// === ATTACK TYPES ===

export type FormAttackType = 
  | 'Acid' | 'Fire' | 'Erosion' | 'Disintegration' | 'Burning' | 'Ablation'
  | 'Slashing' | 'Piercing' | 'Shearing' | 'Tension'
  | 'Bludgeoning' | 'Deformation' | 'Compression' | 'Enlargement'
  | 'Shattering' | 'Fracturing' | 'Splintering'
  | 'Cold' | 'Transmutation' | 'Phasing' | 'Crystallization' | 'Stasis'
  | 'Thunder' | 'Vibration' | 'Explosive';

export type FleshAttackType =
  | 'Poison' | 'Toxin' | 'DrugEffect' | 'AllergicReaction'
  | 'Disease' | 'Infection' | 'Parasitism' | 'FungalColonization'
  | 'Bleeding' | 'Hemorrhage' | 'Desiccation' | 'BloodCorruption'
  | 'Suffocation' | 'Drowning' | 'ToxicAtmosphere'
  | 'Electricity' | 'Radiation' | 'Hypothermia' | 'Hyperthermia'
  | 'Paralysis' | 'OrganFailure' | 'SensoryOverload' | 'SensoryDeprivation' | 'Necrosis'
  | 'Atrophy' | 'Aging' | 'Putrefaction' | 'Mutation' | 'Assimilation';

export type MindAttackType =
  | 'Amnesia' | 'MemoryAlteration' | 'FalseMemoryImplantation'
  | 'Confusion' | 'Paradox' | 'LogicCorruption'
  | 'Illusion' | 'Delusion' | 'Hallucination' | 'SensoryDeprivation'
  | 'Domination' | 'Compulsion' | 'WillBreaking'
  | 'Overload' | 'Obsession' | 'Fatigue' | 'Stress' | 'MindFog' | 'Glitching';

export type SpiritAttackType =
  | 'Despair' | 'Apathy' | 'ExistentialDread' | 'ExistentialHorror'
  | 'Severing' | 'Alienation' | 'Isolation' | 'EmpathyDestruction'
  | 'IdentityLoss' | 'EgoDissolution' | 'PersonalityAlteration' | 'ConceptErasure'
  | 'Corruption' | 'Possession' | 'Fragmentation' | 'Taint' | 'Distortion'
  | 'SoulDrain' | 'PassionDrain' | 'NegativeEnergy' | 'DeathMagic'
  | 'Curse' | 'Guilt' | 'Karma' | 'Binding' | 'Geas'
  | 'Desecration' | 'SpiritualPollution' | 'Unmaking'
  | 'Doubt' | 'FaithBreaking' | 'Betrayal' | 'EmpathicOverload';

export type AttackType = FormAttackType | FleshAttackType | MindAttackType | SpiritAttackType;

// === MECHANISM-TO-TYPE MAPPINGS ===

export const FORM_ATTACK_TYPES: Record<FormMechanism, FormAttackType[]> = {
  Removal: ['Acid', 'Fire', 'Erosion', 'Disintegration', 'Burning', 'Ablation'],
  Severance: ['Slashing', 'Piercing', 'Shearing', 'Tension'],
  Distortion: ['Bludgeoning', 'Deformation', 'Compression', 'Enlargement'],
  Fragmentation: ['Shattering', 'Fracturing', 'Splintering'],
  StateDisruption: ['Cold', 'Transmutation', 'Phasing', 'Crystallization', 'Stasis'],
  Resonance: ['Thunder', 'Vibration', 'Explosive'],
};

export const FLESH_ATTACK_TYPES: Record<FleshMechanism, FleshAttackType[]> = {
  ChemicalDisruption: ['Poison', 'Toxin', 'DrugEffect', 'AllergicReaction'],
  BiologicalInvasion: ['Disease', 'Infection', 'Parasitism', 'FungalColonization'],
  FluidDisruption: ['Bleeding', 'Hemorrhage', 'Desiccation', 'BloodCorruption'],
  RespirationDisruption: ['Suffocation', 'Drowning', 'ToxicAtmosphere'],
  EnergyDisruption: ['Electricity', 'Radiation', 'Hypothermia', 'Hyperthermia'],
  SystemFailure: ['Paralysis', 'OrganFailure', 'SensoryOverload', 'SensoryDeprivation', 'Necrosis'],
  Degeneration: ['Atrophy', 'Aging', 'Putrefaction', 'Mutation', 'Assimilation'],
};

export const MIND_ATTACK_TYPES: Record<MindMechanism, MindAttackType[]> = {
  MemoryDamage: ['Amnesia', 'MemoryAlteration', 'FalseMemoryImplantation'],
  ReasoningDamage: ['Confusion', 'Paradox', 'LogicCorruption'],
  PerceptionDamage: ['Illusion', 'Delusion', 'Hallucination', 'SensoryDeprivation'],
  WillDamage: ['Domination', 'Compulsion', 'WillBreaking'],
  FocusDamage: ['Overload', 'Obsession', 'Fatigue', 'Stress', 'MindFog', 'Glitching'],
};

export const SPIRIT_ATTACK_TYPES: Record<SpiritMechanism, SpiritAttackType[]> = {
  HopeDamage: ['Despair', 'Apathy', 'ExistentialDread', 'ExistentialHorror'],
  ConnectionDamage: ['Severing', 'Alienation', 'Isolation', 'EmpathyDestruction'],
  IdentityDamage: ['IdentityLoss', 'EgoDissolution', 'PersonalityAlteration', 'ConceptErasure'],
  IdentityCorruption: ['Corruption', 'Possession', 'Fragmentation', 'Taint', 'Distortion'],
  EnergyDrain: ['SoulDrain', 'PassionDrain', 'NegativeEnergy', 'DeathMagic'],
  Burden: ['Curse', 'Guilt', 'Karma', 'Binding', 'Geas'],
  Violation: ['Desecration', 'SpiritualPollution', 'Unmaking'],
  FaithDamage: ['Doubt', 'FaithBreaking', 'Betrayal', 'EmpathicOverload'],
};

export const ATTACK_TYPES_BY_ASPECT: Record<AspectName, AttackType[]> = {
  Form: Object.values(FORM_ATTACK_TYPES).flat(),
  Flesh: Object.values(FLESH_ATTACK_TYPES).flat(),
  Mind: Object.values(MIND_ATTACK_TYPES).flat(),
  Spirit: Object.values(SPIRIT_ATTACK_TYPES).flat(),
};

// === WEAPON CATEGORIES ===

export type WeaponCategory = 
  | 'Melee' | 'Pistol' | 'Gun' | 'Primitive' | 'Heavy' | 'Mounted' | 'Thrown'
  | 'Natural' | 'Unarmed'
  | 'Spell' | 'Innate' | 'Psionics';

export function getMechanismGroupsForAspect(aspect: AspectName): Record<string, string[]> {
  switch (aspect) {
    case 'Form': return FORM_ATTACK_TYPES;
    case 'Flesh': return FLESH_ATTACK_TYPES;
    case 'Mind': return MIND_ATTACK_TYPES;
    case 'Spirit': return SPIRIT_ATTACK_TYPES;
  }
}

export interface WeaponTagDefinition {
  id: string;
  label: string;
  category: string;
  description?: string;
  effect?: string;
}

export type WeaponHandedness = 'One-handed' | 'Two-handed' | 'Hands free' | 'Extra limb';

export type WeaponRange = 
  | 'Touch' | 'Close' | 'Reach' | 'PointBlank' | 'Short' 
  | 'Medium' | 'Long' | 'Extended' | 'Extreme' | 'Strategic'
  | 'Distant' | 'LOS' | 'Indirect' | 'Regional' | 'Orbital'
  | 'Exoatmospheric' | 'Continental' | 'Suborbital' | 'Global' | 'Unlimited';

export const WEAPON_RANGES: { step: number; value: WeaponRange; label: string; distance: string; description: string }[] = [
  { step: 1,  value: 'Touch',          label: 'Touch',          distance: '~1 m',      description: 'Unarmed, grappling, touch spells' },
  { step: 2,  value: 'Close',          label: 'Close',          distance: '~2 m',      description: 'Swords, axes, maces; small blast radius' },
  { step: 3,  value: 'Reach',          label: 'Reach',          distance: '~5 m',      description: 'Polearms, whips, spears; grenade blast radius' },
  { step: 4,  value: 'PointBlank',     label: 'Point Blank',    distance: '~10 m',     description: 'Thrown weapons; large blast radius' },
  { step: 5,  value: 'Short',          label: 'Short',          distance: '~20 m',     description: 'Pistols, shotguns, flamethrowers; mortar shell radius' },
  { step: 6,  value: 'Medium',         label: 'Medium',         distance: '~50 m',     description: 'SMGs, shortbows, slings; artillery shell radius' },
  { step: 7,  value: 'Long',           label: 'Long',           distance: '~100 m',    description: 'Crossbows, longbows; small bomb radius' },
  { step: 8,  value: 'Extended',       label: 'Extended',       distance: '~200 m',    description: 'Marksman rifles, heavy crossbows' },
  { step: 9,  value: 'Extreme',        label: 'Extreme',        distance: '~500 m',    description: 'Assault rifles, carbines, battle rifles, RPGs' },
  { step: 10, value: 'Strategic',      label: 'Strategic',      distance: '~1 km',     description: 'Sniper rifles, heavy machine guns; tactical nuke radius' },
  { step: 11, value: 'Distant',        label: 'Distant',        distance: '~2 km',     description: 'Anti-materiel rifles, heavy mortars' },
  { step: 12, value: 'LOS',            label: 'Line of Sight',  distance: '~5 km',     description: 'Tank guns, missile launchers, direct-fire artillery' },
  { step: 13, value: 'Indirect',       label: 'Indirect',       distance: '~10 km',    description: 'Field artillery, howitzers; needs spotters or sensors' },
  { step: 14, value: 'Regional',       label: 'Regional',       distance: '~20 km',    description: 'Heavy artillery, MLRS, short-range missiles' },
  { step: 15, value: 'Orbital',        label: 'Orbital',        distance: '~50 km',    description: 'Orbital strikes, medium-range missiles' },
  { step: 16, value: 'Exoatmospheric', label: 'Exoatmospheric', distance: '~100 km',   description: 'Edge of space; anti-satellite weapons, ICBMs' },
  { step: 17, value: 'Continental',    label: 'Continental',    distance: '~200 km',   description: 'Continental bombardment, strategic missiles' },
  { step: 18, value: 'Suborbital',     label: 'Suborbital',     distance: '~500 km',   description: 'Suborbital weapons, fractional orbital bombardment' },
  { step: 19, value: 'Global',         label: 'Global',         distance: 'Planetary', description: 'Anything on the planet; only question is travel time' },
  { step: 20, value: 'Unlimited',      label: 'Unlimited',      distance: 'Any',       description: 'Range is no longer a factor; interplanetary or FTL weapons' },
];

export interface WeaponAttack {
  id: string;
  aspect: AspectName;
  type: AttackType;
  magnitude: number;
  penetration: number | [number, number];
  range: WeaponRange;
  isConditional?: boolean;
  condition?: string;
}

export type WeaponCapacity = 'Single-shot' | 'Limited' | 'Standard' | 'Extended' | 'Continuous';
export type WeaponReloadTime = 'Reflexive' | 'Quick' | 'Standard' | 'Slow' | 'Extended';

export interface CharacterWeapon {
  id: string;
  name: string;
  attacks: WeaponAttack[];
  category: WeaponCategory;
  handedness: WeaponHandedness;
  capacity?: { min: WeaponCapacity; max?: WeaponCapacity };
  reloadTime?: WeaponReloadTime;
  tagIds?: string[];
}

export interface CharacterArmor {
  id: string;
  name: string;
  aspects: ArmorAspect[];
  armor: number;
  location: string;
  notes?: string[];
}

export type ArmorAspect = 'Form' | 'Flesh' | 'Mind' | 'Spirit';

export interface Character {
  name: string;
  campaignLimit: number;
  
  // Step 1: Attributes
  aspects: CharacterAspectRatings;
  functions: CharacterFunctionRatings;
  
  // Step 2: Skills
  skills: CharacterSkill[];
  
  // Step 3: Powers
  powers: CharacterPower[];
  
  // Step 4: Artifacts, Allies, Shadows
  artifacts: Artifact[];
  allies: Ally[];
  personalShadows: PersonalShadow[];
  
  // Step 5: Equipment
  weapons: CharacterWeapon[];
  customTags: WeaponTagDefinition[];
  armor: CharacterArmor[];
  size: number;
  
  // Derived values (computed)
  attributes: Record<AttributeName, number>;
  diePools: Record<AttributeName, DiePool>;
  skillCap: number;
  skillMaximum: number;
  totalPointsSpent: number;
  stuff: number; // positive = Good Stuff, negative = Bad Stuff
  surge: number;
}