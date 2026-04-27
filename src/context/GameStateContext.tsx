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

interface GameStateContextValue {
  // Character wounds
  wounds: WoundState;
  setWound: (aspect: AspectName, level: WoundLevel) => void;
  woundPenalty: number;
  
  // Restoration points (for healing)
  restorationPoints: RestorationPoints;
  addRestorationPoints: (aspect: AspectName, points: number) => void;
  clearRestorationPoints: (aspect: AspectName) => void;
  
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
  opponentName: string;
  setOpponentName: (name: string) => void;
  opponentWounds: WoundState;
  setOpponentWound: (aspect: AspectName, level: WoundLevel) => void;
  opponentWoundPenalty: number;
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
  const [opponentName, setOpponentName] = useState('');
  const [opponentWounds, setOpponentWounds] = useState<WoundState>(defaultWounds);

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

  const resetOpponent = useCallback(() => {
    setOpponentWounds({ Form: 0, Flesh: 0, Mind: 0, Spirit: 0 });
    setOpponentName('');
    resetReactionPools();
  }, [resetReactionPools]);

  const resetAll = useCallback(() => {
    setWounds(defaultWounds);
    setRestorationPoints(defaultRestoration);
    setSurgeSpent(0);
    setModifiers([]);
    setOpponentName('');
    setOpponentWounds(defaultWounds);
  }, []);

  const value: GameStateContextValue = {
    wounds,
    setWound,
    woundPenalty,
    restorationPoints,
    addRestorationPoints,
    clearRestorationPoints,
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
    opponentName,
    setOpponentName,
    opponentWounds,
    setOpponentWound,
    opponentWoundPenalty,
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