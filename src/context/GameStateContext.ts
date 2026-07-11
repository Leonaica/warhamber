import { createContext } from 'react';
import type { AspectName } from '../types/character';
import type { WoundLevel } from '../data/wounds';

export interface WoundState {
  Form: WoundLevel;
  Flesh: WoundLevel;
  Mind: WoundLevel;
  Spirit: WoundLevel;
}

export interface RestorationPoints {
  Form: number;
  Flesh: number;
  Mind: number;
  Spirit: number;
}

export interface TemporaryModifier {
  id: string;
  description: string;
  value: number;
}

export interface InitiativeState {
  physical: number | null;
  mental: number | null;
}

export type ReactionPoolKey = 'formDodge' | 'formParry' | 'fleshParry' | 'mindDodge' | 'mindParry' | 'spiritDodge' | 'spiritParry';

export interface ReactionPools {
  formDodge: number;
  formParry: number;
  fleshParry: number;
  mindDodge: number;
  mindParry: number;
  spiritDodge: number;
  spiritParry: number;
}

export interface OpponentCombatData {
  attackAspect: AspectName;
  attackMagnitude: number;
  attackPenetration: number;
  damageModifier: number;
  resistanceRanks: {
    Toughness: number;
    Endurance: number;
    Willpower: number;
    Resilience: number;
  };
  armor: {
    Toughness: number;
    Endurance: number;
    Willpower: number;
    Resilience: number;
  };
  materialSize: number;
  immaterialSize: number;
  resistanceModifier: number;
}

export interface GameStateContextValue {
  wounds: WoundState;
  setWound: (aspect: AspectName, level: WoundLevel) => void;
  woundPenalty: number;
  restorationPoints: RestorationPoints;
  addRestorationPoints: (aspect: AspectName, points: number) => void;
  clearRestorationPoints: (aspect: AspectName) => void;
  initiative: InitiativeState;
  setInitiative: (values: InitiativeState) => void;
  clearInitiative: () => void;
  surgeSpent: number;
  spendSurge: (amount: number) => void;
  resetSurge: () => void;
  modifiers: TemporaryModifier[];
  addModifier: (description: string, value: number) => void;
  removeModifier: (id: string) => void;
  totalModifier: number;
  reactionPools: ReactionPools;
  setReactionPool: (key: ReactionPoolKey, value: number) => void;
  useReactionPool: (key: ReactionPoolKey, max: number) => void;
  resetReactionPools: () => void;
  opponentWounds: WoundState;
  setOpponentWound: (aspect: AspectName, level: WoundLevel) => void;
  opponentWoundPenalty: number;
  opponentCombatData: OpponentCombatData;
  updateOpponentCombatData: (updates: Partial<OpponentCombatData>) => void;
  resetOpponent: () => void;
  resetAll: () => void;
}

export const defaultOpponentCombatData: OpponentCombatData = {
  attackAspect: 'Form',
  attackMagnitude: 3,
  attackPenetration: 0,
  damageModifier: 0,
  resistanceRanks: {
    Toughness: 2,
    Endurance: 2,
    Willpower: 2,
    Resilience: 2,
  },
  armor: {
    Toughness: 0,
    Endurance: 0,
    Willpower: 0,
    Resilience: 0,
  },
  materialSize: 0,
  immaterialSize: 0,
  resistanceModifier: 0,
};

export const defaultWounds: WoundState = {
  Form: 0,
  Flesh: 0,
  Mind: 0,
  Spirit: 0,
};

export const defaultRestoration: RestorationPoints = {
  Form: 0,
  Flesh: 0,
  Mind: 0,
  Spirit: 0,
};

export const GameStateContext = createContext<GameStateContextValue | null>(null);