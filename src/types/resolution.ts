import type { DiePool } from './character';

export type EffortBand = 'green' | 'yellow' | 'orange' | 'red';

export interface ResolutionContext {
  attributePool: DiePool;
  poolRank: number;  // For advantage dice calculation
  skillBonus: number; // Per die
  woundPenalty: number;  // Per die
  situationalModifier: number;  // Flat modifier
  isContest: boolean;
  targetNumber: number;
  opponentPool?: DiePool;
  opponentRank?: number;
  approach: 'baseline' | 'roll' | 'surge';
  surgeBand?: EffortBand;
}

export interface ActionResult {
  result: number;
  band: EffortBand | null;
  successes: number;
  capped: boolean;
  criticalFailure: boolean;
  rollDetails?: {
    rolls: number[];
    explosions: { dieIndex: number; rolls: number[] }[];
    advantageDice?: number;
    keptRolls?: { value: number; rolls: number[] }[];
    discardedRolls?: { value: number; rolls: number[] }[];
    otherRolls?: { value: number; rolls: number[] }[];
    criticalFailureCheck?: {
      allMinimum: boolean;
      confirmationRoll?: number;
    };
  };
  calculationBreakdown?: {
    rollTotal: number;
    skillBonus: number;
    skillBonusPerDie: number;
    woundPenalty: number;
    woundPenaltyPerDie: number;
    situationalModifier: number;
    diceCount: number;
    advantageDice?: number;
    isSurge?: boolean;
    totalModifier: number;
    finalResult: number;
  };
}

export interface ContestResult {
  actor: ActionResult;
  opponent?: ActionResult;
  winner: 'actor' | 'opponent' | 'tie';
  margin: number;
  foregoneEnforced?: boolean;  // True when foregone conclusion overrode dice
}