import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { AspectName } from '../types/character';
import { WOUND_PENALTIES, type WoundLevel } from '../data/wounds';
import {
  GameStateContext,
  type GameStateContextValue,
  type WoundState,
  type RestorationPoints,
  type TemporaryModifier,
  type InitiativeState,
  type ReactionPoolKey,
  type ReactionPools,
  type OpponentCombatData,
  defaultOpponentCombatData,
  defaultWounds,
  defaultRestoration,
} from './GameStateContext';

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