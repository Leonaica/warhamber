import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { AspectName } from '../types/character';
import { WOUND_PENALTIES, type WoundLevel } from '../data/wounds';

// Re-export wound utilities for convenience
export type { WoundLevel } from '../data/wounds';
export { WOUND_LABELS, WOUND_PENALTIES, WOUND_DAMAGE_RANGES, getWoundLevel, calculateStacking } from '../data/wounds';

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
  // Attacker info (when opponent is attacking)
  attackAspect: AspectName;
  attackMagnitude: number;
  attackPenetration: number;
  damageModifier: number;
  // Defender info (when opponent is defending)
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

const defaultOpponentCombatData: OpponentCombatData = {
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

interface GameStateContextValue {
  // Character wounds
  wounds: WoundState;
  setWound: (aspect: AspectName, level: WoundLevel) => void;
  woundPenalty: number;
  
  // Restoration points (for healing)
  restorationPoints: RestorationPoints;
  addRestorationPoints: (aspect: AspectName, points: number) => void;
  clearRestorationPoints: (aspect: AspectName) => void;
  
  // Initiative
  initiative: InitiativeState;
  setInitiative: (values: InitiativeState) => void;
  clearInitiative: () => void;
  
  // Surge
  surgeSpent: number;
  spendSurge: (amount: number) => void;
  resetSurge: () => void;
  
  // Temporary modifiers
  modifiers: TemporaryModifier[];
  addModifier: (description: string, value: number) => void;
  removeModifier: (id: string) => void;
  totalModifier: number;

  // Dodges and Parries tracking
  reactionPools: ReactionPools; 
  setReactionPool: (key: ReactionPoolKey, value: number) => void;
  useReactionPool: (key: ReactionPoolKey, max: number) => void;
  resetReactionPools: () => void;
  
  // Opponent tracking
  opponentWounds: WoundState;
  setOpponentWound: (aspect: AspectName, level: WoundLevel) => void;
  opponentWoundPenalty: number;
  opponentCombatData: OpponentCombatData;
  updateOpponentCombatData: (updates: Partial<OpponentCombatData>) => void;
  resetOpponent: () => void;
  
  // Reset all
  resetAll: () => void;
}

const defaultWounds: WoundState = {
  Form: 0,
  Flesh: 0,
  Mind: 0,
  Spirit: 0,
};

const defaultRestoration: RestorationPoints = {
  Form: 0,
  Flesh: 0,
  Mind: 0,
  Spirit: 0,
};

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [wounds, setWounds] = useState<WoundState>(defaultWounds);
  const [restorationPoints, setRestorationPoints] = useState<RestorationPoints>(defaultRestoration);
  const [surgeSpent, setSurgeSpent] = useState(0);
  const [modifiers, setModifiers] = useState<TemporaryModifier[]>([]);
  
  // Opponent tracking
  const [opponentWounds, setOpponentWounds] = useState<WoundState>(defaultWounds);
  const [opponentCombatData, setOpponentCombatData] = useState<OpponentCombatData>(defaultOpponentCombatData);

  const setWound = useCallback((aspect: AspectName, level: WoundLevel) => {
    setWounds(prev => ({ ...prev, [aspect]: level }));
  }, []);

  const woundPenalty = useMemo(() => {
    return Math.min(
      WOUND_PENALTIES[wounds.Form],
      WOUND_PENALTIES[wounds.Flesh],
      WOUND_PENALTIES[wounds.Mind],
      WOUND_PENALTIES[wounds.Spirit]
    );
  }, [wounds]);

  const [initiative, setInitiativeState] = useState<InitiativeState>({
    physical: null,
    mental: null,
  });

  const [reactionPools, setReactionPools] = useState<ReactionPools>({
    formDodge: 0,
    formParry: 0,
    fleshParry: 0,
    mindDodge: 0,
    mindParry: 0,
    spiritDodge: 0,
    spiritParry: 0,
  });

  const setReactionPool = useCallback((key: ReactionPoolKey, value: number) => {
    setReactionPools(prev => ({ ...prev, [key]: value }));
  }, []);

  const useReactionPool = useCallback((key: ReactionPoolKey, max: number) => {
    setReactionPools(prev => ({
      ...prev,
      [key]: Math.min(prev[key] + 1, max),
    }));
  }, []);

  const resetReactionPools = useCallback(() => {
    setReactionPools({
      formDodge: 0,
      formParry: 0,
      fleshParry: 0,
      mindDodge: 0,
      mindParry: 0,
      spiritDodge: 0,
      spiritParry: 0,
    });
  }, []);

  const addRestorationPoints = useCallback((aspect: AspectName, points: number) => {
    setRestorationPoints(prev => ({
      ...prev,
      [aspect]: prev[aspect] + points,
    }));
  }, []);

  const setInitiative = useCallback((values: InitiativeState) => {
    setInitiativeState(values);
  }, []);

  const clearInitiative = useCallback(() => {
    setInitiativeState({ physical: null, mental: null });
  }, []);

  const clearRestorationPoints = useCallback((aspect: AspectName) => {
    setRestorationPoints(prev => ({
      ...prev,
      [aspect]: 0,
    }));
  }, []);

  const spendSurge = useCallback((amount: number) => {
    setSurgeSpent(prev => prev + amount);
  }, []);

  const resetSurge = useCallback(() => {
    setSurgeSpent(0);
  }, []);

  const addModifier = useCallback((description: string, value: number) => {
    const id = crypto.randomUUID();
    setModifiers(prev => [...prev, { id, description, value }]);
  }, []);

  const removeModifier = useCallback((id: string) => {
    setModifiers(prev => prev.filter(m => m.id !== id));
  }, []);

  const totalModifier = useMemo(() => {
    return modifiers.reduce((sum, m) => sum + m.value, 0);
  }, [modifiers]);

  // Opponent tracking
  const setOpponentWound = useCallback((aspect: AspectName, level: WoundLevel) => {
    setOpponentWounds(prev => ({ ...prev, [aspect]: level }));
  }, []);

  const opponentWoundPenalty = useMemo(() => {
    return Math.min(
      WOUND_PENALTIES[opponentWounds.Form],
      WOUND_PENALTIES[opponentWounds.Flesh],
      WOUND_PENALTIES[opponentWounds.Mind],
      WOUND_PENALTIES[opponentWounds.Spirit]
    );
  }, [opponentWounds]);

  const updateOpponentCombatData = useCallback((updates: Partial<OpponentCombatData>) => {
    setOpponentCombatData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetOpponent = useCallback(() => {
    setOpponentWounds({ Form: 0, Flesh: 0, Mind: 0, Spirit: 0 });
    setOpponentCombatData(defaultOpponentCombatData);
  }, []);

  const resetAll = useCallback(() => {
    setWounds(defaultWounds);
    setRestorationPoints(defaultRestoration);
    setSurgeSpent(0);
    setModifiers([]);
    setOpponentWounds(defaultWounds);
    setOpponentCombatData(defaultOpponentCombatData);
    resetReactionPools();
    clearInitiative();
  }, [resetReactionPools, clearInitiative]);

  const value: GameStateContextValue = {
    wounds,
    setWound,
    woundPenalty,
    restorationPoints,
    addRestorationPoints,
    clearRestorationPoints,
    initiative,
    setInitiative,
    clearInitiative,
    surgeSpent,
    spendSurge,
    resetSurge,
    modifiers,
    addModifier,
    removeModifier,
    totalModifier,
    reactionPools,
    setReactionPool,
    useReactionPool,
    resetReactionPools,
    opponentWounds,
    setOpponentWound,
    opponentWoundPenalty,
    opponentCombatData,
    updateOpponentCombatData,
    resetOpponent,
    resetAll,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}