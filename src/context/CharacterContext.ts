import { createContext } from 'react';
import type {
  CharacterSkill,
  CharacterPower,
  Artifact,
  Ally,
  PersonalShadow,
  CharacterAspectRatings,
  CharacterFunctionRatings,
  AttributeName,
  CharacterWeapon,
  CharacterArmor,
  WeaponTagDefinition,
} from '../types/character';
import { getDiePoolEntry } from '../data/diePoolTable';
import { computeCharacter } from '../utils/calculations';

export interface PaceValues {
  walking: { mph: number; kph: number; ms: number };
  sprinting: { mph: number; kph: number; ms: number };
  multiplier: number;
}

export interface CharacterState {
  name: string;
  campaignLimit: number;
  avatarIcon: string;
  aspects: CharacterAspectRatings;
  functions: CharacterFunctionRatings;
  aspectExplanations: Record<string, string>;
  functionExplanations: Record<string, string>;
  skills: CharacterSkill[];
  powers: CharacterPower[];
  artifacts: Artifact[];
  allies: Ally[];
  personalShadows: PersonalShadow[];
  weapons: CharacterWeapon[];
  armor: CharacterArmor[];
  customTags: WeaponTagDefinition[];
  size: number;
  paceMultiplier: number;
}

export interface CharacterContextValue extends CharacterState {
  computedCharacter: ReturnType<typeof computeCharacter>;
  attributeValues: Record<AttributeName, number>;
  attributeDiePools: Record<AttributeName, ReturnType<typeof getDiePoolEntry>>;
  immaterialSize: number;
  pace: PaceValues;

  setName: (name: string | ((prev: string) => string)) => void;
  setCampaignLimit: (limit: number | ((prev: number) => number)) => void;
  setAvatarIcon: (icon: string | ((prev: string) => string)) => void;
  setAspects: (aspects: CharacterAspectRatings | ((prev: CharacterAspectRatings) => CharacterAspectRatings)) => void;
  setFunctions: (functions: CharacterFunctionRatings | ((prev: CharacterFunctionRatings) => CharacterFunctionRatings)) => void;
  setAspectExplanation: (aspectId: string, explanation: string) => void;
  setFunctionExplanation: (functionId: string, explanation: string) => void;
  setSkills: (skills: CharacterSkill[] | ((prev: CharacterSkill[]) => CharacterSkill[])) => void;
  setPowers: (powers: CharacterPower[] | ((prev: CharacterPower[]) => CharacterPower[])) => void;
  setArtifacts: (artifacts: Artifact[] | ((prev: Artifact[]) => Artifact[])) => void;
  setAllies: (allies: Ally[] | ((prev: Ally[]) => Ally[])) => void;
  setPersonalShadows: (shadows: PersonalShadow[] | ((prev: PersonalShadow[]) => PersonalShadow[])) => void;
  customTags: WeaponTagDefinition[];
  setCustomTags: (tags: WeaponTagDefinition[] | ((prev: WeaponTagDefinition[]) => WeaponTagDefinition[])) => void;
  addWeapon: (weapon: Omit<CharacterWeapon, 'id'>) => void;
  updateWeapon: (id: string, updates: Partial<CharacterWeapon>) => void;
  removeWeapon: (id: string) => void;
  addArmor: (armorData: Omit<CharacterArmor, 'id'>) => void;
  updateArmor: (id: string, updates: Partial<CharacterArmor>) => void;
  removeArmor: (id: string) => void;
  setSize: (size: number | ((prev: number) => number)) => void;
  setPaceMultiplier: (value: number | ((prev: number) => number)) => void;

  loadCharacter: (data: Partial<CharacterState>) => void;
  saveCharacter: () => string;
  hasCharacter: boolean;
}

export const CharacterContext = createContext<CharacterContextValue | null>(null);