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
export type FunctionName = 'Resist' | 'Adapt' | 'Perceive' | 'Force';

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
    id: 'Adapt',
    name: 'Adapt',
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
  | 'Agility' | 'Reflexes' | 'Intelligence' | 'Creativity'
  | 'Perception' | 'Intuition' | 'Memory' | 'Wisdom'
  | 'Strength' | 'Allure' | 'Charisma' | 'Presence';

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
  // Adapt
  { id: 'Agility', name: 'Agility', func: 'Adapt', aspect: 'Form', description: 'Mechanical movement, speed, and balance' },
  { id: 'Reflexes', name: 'Reflexes', func: 'Adapt', aspect: 'Flesh', description: 'Instinctive reaction, evasion, bodily coordination' },
  { id: 'Intelligence', name: 'Intelligence', func: 'Adapt', aspect: 'Mind', description: 'Problem-solving, logic, processing speed' },
  { id: 'Creativity', name: 'Creativity', func: 'Adapt', aspect: 'Spirit', description: 'Spontaneity, artistic improvisation, spiritual flow' },
  // Perceive
  { id: 'Perception', name: 'Perception', func: 'Perceive', aspect: 'Form', description: 'Accuracy of external physical senses' },
  { id: 'Intuition', name: 'Intuition', func: 'Perceive', aspect: 'Flesh', description: 'Subconscious awareness of danger or emotional states' },
  { id: 'Memory', name: 'Memory', func: 'Perceive', aspect: 'Mind', description: 'Perception of mental constructs — learned experience and knowledge' },
  { id: 'Wisdom', name: 'Wisdom', func: 'Perceive', aspect: 'Spirit', description: 'Moral understanding, spiritual insight' },
  // Force
  { id: 'Strength', name: 'Strength', func: 'Force', aspect: 'Form', description: 'Capacity to exert physical power on the world' },
  { id: 'Allure', name: 'Allure', func: 'Force', aspect: 'Flesh', description: 'Physical attractiveness, magnetism, biological influence' },
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
export type SkillRating = 'Poor' | 'Average' | 'Good' | 'Great' | 'Exceptional' | 'Extraordinary';

export const SKILL_RATINGS: { rating: SkillRating; modifier: number; cost: number }[] = [
  { rating: 'Poor', modifier: -1, cost: -5 },
  { rating: 'Average', modifier: 0, cost: 0 },
  { rating: 'Good', modifier: 1, cost: 0 },
  { rating: 'Great', modifier: 2, cost: 0 },
  { rating: 'Exceptional', modifier: 3, cost: 5 },
  { rating: 'Extraordinary', modifier: 4, cost: 10 },
];

// Skills
export type SkillName =
  | 'SilverTongue' | 'WayOfTheWhisperer' | 'LeadersMantle' | 'UnseenHand'
  | 'WayOfTheWarrior' | 'WayOfTheRogue' | 'EngineersPen' | 'WayOfTheExplorer'
  | 'HeartsMotion' | 'ArtisansCraft' | 'MachinesMind' | 'ScholarsMind';

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
  Adapt: RatingValue;
  Perceive: RatingValue;
  Force: RatingValue;
}

export interface CharacterSkill {
  skillId: SkillName;
  rating: SkillRating;
  specialty: string;
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

export type FormAttackType = 'Impact' | 'Slashing' | 'Piercing' | 'Energy' | 'Corrosive' | 'Freeze' | 'Explosive';
export type FleshAttackType = 'Asphyxiation' | 'Poison' | 'Disease' | 'Drain' | 'DeathMagic' | 'Hemorrhage';
export type MindAttackType = 'Pain' | 'Fatigue' | 'Domination' | 'Intrusion' | 'Hallucination' | 'Torture';
export type SpiritAttackType = 'NegativeEnergy' | 'SoulBlade' | 'ExistentialHorror' | 'EmpathicOverload' | 'Possession';

export type AttackType = FormAttackType | FleshAttackType | MindAttackType | SpiritAttackType;

export const ATTACK_TYPES_BY_ASPECT: Record<AspectName, AttackType[]> = {
  Form: ['Impact', 'Slashing', 'Piercing', 'Energy', 'Corrosive', 'Freeze', 'Explosive'],
  Flesh: ['Asphyxiation', 'Poison', 'Disease', 'Drain', 'DeathMagic', 'Hemorrhage'],
  Mind: ['Pain', 'Fatigue', 'Domination', 'Intrusion', 'Hallucination', 'Torture'],
  Spirit: ['NegativeEnergy', 'SoulBlade', 'ExistentialHorror', 'EmpathicOverload', 'Possession'],
};

export type WeaponCategory = 'Melee' | 'Pistol' | 'Gun' | 'Heavy' | 'Mounted' | 'Thrown';

export type WeaponHandedness = 'One-handed' | 'Two-handed';

export type WeaponRange = 'Touch' | 'Close' | 'Reach' | 'Short' | 'Medium' | 'Long' | 'Far' | 'Extreme' | 'Strategic' | 'LOS';

export const WEAPON_RANGES: { value: WeaponRange; label: string; description: string }[] = [
  { value: 'Touch', label: 'Touch', description: 'Within arm\'s reach' },
  { value: 'Close', label: 'Close', description: 'Just outside arm\'s reach; most hand weapons' },
  { value: 'Reach', label: 'Reach', description: '~5 meters; talking range, polearm range' },
  { value: 'Short', label: 'Short', description: '~50 meters; normal throwing range' },
  { value: 'Medium', label: 'Medium', description: '~100 meters; most pistols or bows' },
  { value: 'Long', label: 'Long', description: 'Several hundred meters; most rifles' },
  { value: 'Far', label: 'Far', description: '~1 kilometer; cannon or specialized rifles' },
  { value: 'Extreme', label: 'Extreme', description: 'Several kilometers; light artillery' },
  { value: 'Strategic', label: 'Strategic', description: 'Heavier artillery range' },
  { value: 'LOS', label: 'Line of Sight', description: 'If you can see it, you can hit it; some magic and powerful lasers' },
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

export interface CharacterWeapon {
  id: string;
  name: string;
  attacks: WeaponAttack[];
  category: WeaponCategory;
  handedness: WeaponHandedness;
  ammo?: string;
  notes?: string[];
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