import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DIE_POOL_TABLE } from '../data/diePoolTable';
import type { DiePoolEntry } from '../data/diePoolTable';
import { 
  resolveTest, 
  resolveContest, 
  getBandThresholds,
  isForegoneConclusion,
  getSurgeCost 
} from '../utils/resolution';
import { isBandAvailable, resultToScale } from '../data/actionEffortTable';
import type { EffortBand, ActionResult, ContestResult } from '../types/resolution';
import StepperInput from '../components/StepperInput';

// Interface for navigation state from playsheet
interface PlaysheetState {
  poolRank: number;
  skillBonus: number;
  woundPenalty: number;
  attributeName?: string;
  skillName?: string;
}

export function ResolverPage() {
  const location = useLocation();
  const playsheetState = location.state as PlaysheetState | undefined;
  
  // Actor configuration - initialize from playsheet state if available
  const [actorPoolRank, setActorPoolRank] = useState(playsheetState?.poolRank ?? 8);
  const [actorSkillBonus, setActorSkillBonus] = useState(playsheetState?.skillBonus ?? 0);
  const [actorWoundPenalty, setActorWoundPenalty] = useState(playsheetState?.woundPenalty ?? 0);
  const [actorModifier, setActorModifier] = useState(0);
  
  // Track if values came from playsheet
  const [hasPlaysheetData, setHasPlaysheetData] = useState(!!playsheetState);
  
  // Clear playsheet indicator when user manually changes values
  useEffect(() => {
    if (playsheetState) {
      setHasPlaysheetData(true);
    }
  }, [playsheetState]);

  // Sync state when playsheet data arrives
  useEffect(() => {
    if (playsheetState) {
      setActorPoolRank(playsheetState.poolRank);
      setActorSkillBonus(playsheetState.skillBonus);
      setActorWoundPenalty(playsheetState.woundPenalty);
      setHasPlaysheetData(true);
    }
  }, [playsheetState]);

  // Test type
  const [testType, setTestType] = useState<'challenge' | 'contest'>('challenge');
  const [targetNumber, setTargetNumber] = useState(4);
  
  // Opponent configuration (for contests)
  const [opponentPoolRank, setOpponentPoolRank] = useState(5); // Default: d12
  const [opponentSkillBonus, setOpponentSkillBonus] = useState(0);
  const [opponentWoundPenalty, setOpponentWoundPenalty] = useState(0);
  const [opponentModifier, setOpponentModifier] = useState(0);
  
  // Result state
  const [result, setResult] = useState<ActionResult | ContestResult | null>(null);
  const [lastApproach, setLastApproach] = useState<string>('');

  // Get selected pool entries
  const actorPoolEntry = useMemo(() => {
    return DIE_POOL_TABLE.find((e: DiePoolEntry) => e.rank === actorPoolRank) || DIE_POOL_TABLE[8];
  }, [actorPoolRank]);
  
  const opponentPoolEntry = useMemo(() => {
    return DIE_POOL_TABLE.find((e: DiePoolEntry) => e.rank === opponentPoolRank) || DIE_POOL_TABLE[5];
  }, [opponentPoolRank]);

  const formatRollEntry = (r: { value: number; rolls: number[] }) => {
    return r.rolls.length > 1 ? r.rolls.join('+') : String(r.rolls[0]);
  };
  
  const formatNonAdvantageRolls = (rolls: number[], explosions: { dieIndex: number; rolls: number[] }[]) => {
    const explosionMap = new Map(explosions.map(e => [e.dieIndex, e.rolls]));
    return rolls.map((roll, index) => {
      const explosionRolls = explosionMap.get(index);
      if (explosionRolls) {
        return explosionRolls.join('+');
      }
      return String(roll);
    });
  };

  // Calculate total modifiers
  const actorTotalModifier = (actorSkillBonus + actorWoundPenalty) * actorPoolEntry.pool.dice.length + actorModifier;
  const opponentTotalModifier = (opponentSkillBonus + opponentWoundPenalty) * opponentPoolEntry.pool.dice.length + opponentModifier;

  // Get band thresholds for display
  const actorThresholds = useMemo(() => {
    return getBandThresholds(actorPoolEntry.pool);
  }, [actorPoolEntry]);
  
  // Define the band styles in a static lookup object so that Tailwind sees all the class names. 
  const bandStyles: Record<EffortBand, { bg: string; border: string; text: string; emoji: string }> = {
    green: {
      bg: 'bg-green-900/30',
      border: 'border-green-500/50',
      text: 'text-green-400',
      emoji: '🟩',
    },
    yellow: {
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400',
      emoji: '🟨',
    },
    orange: {
      bg: 'bg-orange-900/30',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      emoji: '🟧',
    },
    red: {
      bg: 'bg-red-900/30',
      border: 'border-red-500/50',
      text: 'text-red-400',
      emoji: '🟥',
    },
  };

  // Check for foregone conclusion
  const foregoneCheck = useMemo(() => {
    if (testType !== 'contest') return null;
    return isForegoneConclusion(actorPoolEntry.rank, opponentPoolEntry.rank);
  }, [testType, actorPoolEntry.rank, opponentPoolEntry.rank]);

    // When user manually changes pool rank, clear playsheet indicator
    const handlePoolRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setActorPoolRank(parseInt(e.target.value));
      setHasPlaysheetData(false);
    };
  
    const handleSkillBonusChange = (delta: number) => {
      setActorSkillBonus(prev => prev + delta);
      setHasPlaysheetData(false);
    };
    
    const handleWoundPenaltyChange = (delta: number) => {
      setActorWoundPenalty(prev => prev + delta);
      setHasPlaysheetData(false);
    };
    
    const handleActorModifierChange = (delta: number) => {
      setActorModifier(prev => prev + delta);
    };
    
    const handleOpponentSkillBonusChange = (delta: number) => {
      setOpponentSkillBonus(prev => prev + delta);
    };
    
    const handleOpponentWoundPenaltyChange = (delta: number) => {
      setOpponentWoundPenalty(prev => prev + delta);
    };
    
    const handleOpponentModifierChange = (delta: number) => {
      setOpponentModifier(prev => prev + delta);
    };

    const handleTargetNumberChange = (delta: number) => {
      setTargetNumber(prev => Math.max(1, Math.min(224, prev + delta)));
    };

  // Handle resolution
  const handleBaseline = () => {
    if (testType === 'challenge') {
      const res = resolveTest({
        attributePool: actorPoolEntry.pool,
        poolRank: actorPoolEntry.rank,
        skillBonus: actorSkillBonus,
        woundPenalty: actorWoundPenalty,
        situationalModifier: actorModifier,
        isContest: false,
        targetNumber,
        approach: 'baseline',
      });
      setResult(res);
    } else {
      const res = resolveContest(
        {
          attributePool: actorPoolEntry.pool,
          poolRank: actorPoolEntry.rank,
          skillBonus: actorSkillBonus,
          woundPenalty: actorWoundPenalty,
          situationalModifier: actorModifier,
          targetNumber: 0,
          approach: 'baseline',
        },
        {
          attributePool: opponentPoolEntry.pool,
          poolRank: opponentPoolEntry.rank,
          skillBonus: opponentSkillBonus,
          woundPenalty: opponentWoundPenalty,
          situationalModifier: opponentModifier,
          targetNumber: 0,
          approach: 'roll',
        }
      );
      setResult(res);
    }
    setLastApproach('Baseline (Green)');
  };
  
  const handleRoll = () => {
    if (testType === 'challenge') {
      const res = resolveTest({
        attributePool: actorPoolEntry.pool,
        poolRank: actorPoolEntry.rank,
        skillBonus: actorSkillBonus,
        woundPenalty: actorWoundPenalty,
        situationalModifier: actorModifier,
        isContest: false,
        targetNumber,
        approach: 'roll',
      });
      setResult(res);
    } else {
      const res = resolveContest(
        {
          attributePool: actorPoolEntry.pool,
          poolRank: actorPoolEntry.rank,
          skillBonus: actorSkillBonus,
          woundPenalty: actorWoundPenalty,
          situationalModifier: actorModifier,
          targetNumber: 0,
          approach: 'roll',
        },
        {
          attributePool: opponentPoolEntry.pool,
          poolRank: opponentPoolEntry.rank,
          skillBonus: opponentSkillBonus,
          woundPenalty: opponentWoundPenalty,
          situationalModifier: opponentModifier,
          targetNumber: 0,
          approach: 'roll',
        }
      );
      setResult(res);
    }
    setLastApproach('Rolled Dice');
  };
  
  const handleSurge = (band: EffortBand) => {
    if (testType === 'challenge') {
      const res = resolveTest({
        attributePool: actorPoolEntry.pool,
        poolRank: actorPoolEntry.rank,
        skillBonus: actorSkillBonus,
        woundPenalty: actorWoundPenalty,
        situationalModifier: actorModifier,
        isContest: false,
        targetNumber,
        approach: 'surge',
        surgeBand: band,
      });
      setResult(res);
    } else {
      const res = resolveContest(
        {
          attributePool: actorPoolEntry.pool,
          poolRank: actorPoolEntry.rank,
          skillBonus: actorSkillBonus,
          woundPenalty: actorWoundPenalty,
          situationalModifier: actorModifier,
          targetNumber: 0,
          approach: 'surge',
          surgeBand: band,
        },
        {
          attributePool: opponentPoolEntry.pool,
          poolRank: opponentPoolEntry.rank,
          skillBonus: opponentSkillBonus,
          woundPenalty: opponentWoundPenalty,
          situationalModifier: opponentModifier,
          targetNumber: 0,
          approach: 'roll',
        }
      );
      setResult(res);
    }
    setLastApproach(`Surge (${band})`);
  };

  // Add to state declarations at the top of the component
  const [probability, setProbability] = useState<{
    loading: boolean;
    result?: {
      win?: number;
      lose?: number;
      tie?: number;
      success?: number;
      failure?: number;
    };
  }>({ loading: false });
  
  // Add this function before the return statement
  const calculateProbability = () => {
    const ITERATIONS = 10000;
    setProbability({ loading: true });
  
    // Use requestAnimationFrame to allow UI to update
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (testType === 'challenge') {
          let successes = 0;
          for (let i = 0; i < ITERATIONS; i++) {
            const result = resolveTest({
              attributePool: actorPoolEntry.pool,
              poolRank: actorPoolEntry.rank,
              skillBonus: actorSkillBonus,
              woundPenalty: actorWoundPenalty,
              situationalModifier: actorModifier,
              isContest: false,
              targetNumber,
              approach: 'roll',
            });
            if (result.successes > 0) successes++;
          }
          setProbability({
            loading: false,
            result: {
              success: Math.round((successes / ITERATIONS) * 100),
              failure: 100 - Math.round((successes / ITERATIONS) * 100),
            },
          });
        } else {
          // Check for foregone conclusion first
          const foregone = isForegoneConclusion(actorPoolEntry.rank, opponentPoolEntry.rank);
          if (foregone.isForegone) {
            setProbability({
              loading: false,
              result: {
                win: foregone.winner === 'actor' ? 100 : 0,
                lose: foregone.winner === 'opponent' ? 100 : 0,
                tie: foregone.winner === null ? 100 : 0,
              },
            });
            return;
          }
  
          let actorWins = 0;
          let opponentWins = 0;
          let ties = 0;
  
          for (let i = 0; i < ITERATIONS; i++) {
            const result = resolveContest(
              {
                attributePool: actorPoolEntry.pool,
                poolRank: actorPoolEntry.rank,
                skillBonus: actorSkillBonus,
                woundPenalty: actorWoundPenalty,
                situationalModifier: actorModifier,
                targetNumber: 0,
                approach: 'roll',
              },
              {
                attributePool: opponentPoolEntry.pool,
                poolRank: opponentPoolEntry.rank,
                skillBonus: opponentSkillBonus,
                woundPenalty: opponentWoundPenalty,
                situationalModifier: opponentModifier,
                targetNumber: 0,
                approach: 'roll',
              }
            );
  
            if (result.winner === 'actor') actorWins++;
            else if (result.winner === 'opponent') opponentWins++;
            else ties++;
          }
  
          setProbability({
            loading: false,
            result: {
              win: Math.round((actorWins / ITERATIONS) * 100),
              lose: Math.round((opponentWins / ITERATIONS) * 100),
              tie: Math.round((ties / ITERATIONS) * 100),
            },
          });
        }
      }, 10);
    });
  };

  const formatScale = (scale: number | null): string => {
    if (scale === null) return 'Below 0.5';
    if (scale < 10) return scale.toFixed(1);
    if (scale < 1000) return Math.round(scale).toString();
    return Math.round(scale).toLocaleString();
  };

  // Render result display
  const renderActionResult = (ar: ActionResult, label: string) => (
    <div className={`rounded-lg p-4 ${
      ar.criticalFailure 
        ? 'bg-red-900/50 border border-red-500' 
        : ar.successes > 0 
          ? 'bg-green-900/30 border border-green-500/50' 
          : 'bg-slate-700/50 border border-slate-500'
    }`}>
      <div className="text-sm text-slate-400 mb-2">{label}</div>
      {ar.criticalFailure ? (
        <div className="text-center">
          <div className="text-3xl mb-2">💀</div>
          <div className="text-red-400 font-bold">CRITICAL FAILURE</div>
          <div className="text-xs text-slate-400 mt-1">All 1s rolled!</div>
          {ar.rollDetails?.criticalFailureCheck && (
            <div className="text-xs text-slate-400 mt-1">
              Confirmation roll: 🎲 {ar.rollDetails.criticalFailureCheck.confirmationRoll}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-white">{ar.result}</span>
              {ar.capped && <span className="ml-2 text-xs text-amber-400">(capped)</span>}
              <div className="text-xs text-slate-500">Scale: {formatScale(resultToScale(ar.result))}</div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                ar.band === 'green' ? 'text-green-400' :
                ar.band === 'yellow' ? 'text-yellow-400' :
                ar.band === 'orange' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {ar.band?.toUpperCase() ?? 'NONE'}
              </div>
              <div className="text-sm text-slate-400">
                {ar.successes} {ar.successes === 1 ? 'success' : 'successes'}
              </div>
            </div>
          </div>
          
          {/* "Saved!" message for near-critical failures */}
          {ar.rollDetails?.criticalFailureCheck?.allMinimum && (
            <div className="mt-2 p-2 bg-amber-900/30 rounded text-center">
              <div className="text-xs text-amber-400">
                ⚠️ All dice rolled 1{ar.calculationBreakdown?.skillBonusPerDie && ar.calculationBreakdown.skillBonusPerDie < 0 ? ' or 2' : ''}!
                Confirmation roll: 🎲 {ar.rollDetails.criticalFailureCheck.confirmationRoll} — Saved!
              </div>
            </div>
          )}
          
          {ar.calculationBreakdown && (
            <div className="mt-3 pt-3 border-t border-slate-600 text-sm text-slate-400">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {ar.rollDetails ? (
                <>
                  {ar.rollDetails.advantageDice && ar.rollDetails.advantageDice > 0 ? (
                    <>
                      <span>Roll (with {ar.rollDetails.advantageDice} adv):</span>
                      <span className="text-white">
                        [{ar.rollDetails.keptRolls?.map(formatRollEntry).join(', ')}]
                        {ar.rollDetails.otherRolls && ar.rollDetails.otherRolls.length > 0 && (
                          <span className="text-blue-300 ml-1">
                            + [{ar.rollDetails.otherRolls.map(formatRollEntry).join(', ')}]
                          </span>
                        )}
                        {ar.rollDetails.discardedRolls && ar.rollDetails.discardedRolls.length > 0 && (
                          <span className="text-slate-500 ml-1">
                            dropped [{ar.rollDetails.discardedRolls.map(formatRollEntry).join(', ')}]
                          </span>
                        )} = {ar.calculationBreakdown?.rollTotal}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Roll:</span>
                      <span className="text-white">
                        [{formatNonAdvantageRolls(ar.rollDetails.rolls, ar.rollDetails.explosions).join(', ')}] = {ar.calculationBreakdown?.rollTotal}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span>Base:</span>
                  <span className="text-white">{ar.calculationBreakdown?.rollTotal}</span>
                </>
              )}
                {ar.calculationBreakdown.isSurge ? (
                  <>
                    <span>Skill (surge):</span>
                    <span className={ar.calculationBreakdown.skillBonus >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {ar.calculationBreakdown.skillBonus >= 0 ? '+' : ''}{ar.calculationBreakdown.skillBonus}
                    </span>
                  </>
                  ) : (
                  <>
                    <span>Skill ({ar.calculationBreakdown.diceCount} × {ar.calculationBreakdown.skillBonusPerDie >= 0 ? '+' : ''}{ar.calculationBreakdown.skillBonusPerDie}):</span>
                    <span className={ar.calculationBreakdown.skillBonus >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {ar.calculationBreakdown.skillBonus >= 0 ? '+' : ''}{ar.calculationBreakdown.skillBonus}
                    </span>
                  </>
                )}
                {ar.calculationBreakdown.woundPenaltyPerDie !== 0 && (
                  <>
                    <span>Wounds ({ar.calculationBreakdown.diceCount} × {ar.calculationBreakdown.woundPenaltyPerDie}):</span>
                    <span className="text-red-400">
                      {ar.calculationBreakdown.woundPenalty}
                    </span>
                  </>
                )}
                {ar.calculationBreakdown.situationalModifier !== 0 && (
                  <>
                    <span>Modifier:</span>
                    <span className={ar.calculationBreakdown.situationalModifier >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {ar.calculationBreakdown.situationalModifier >= 0 ? '+' : ''}{ar.calculationBreakdown.situationalModifier}
                    </span>
                  </>
                )}
                <span className="font-bold text-slate-300">Total:</span>
                <span className="font-bold text-white">{ar.calculationBreakdown.finalResult}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-slate-800 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-amber-400 mb-2">Attribute Test Resolver</h1>
        <p className="text-slate-400 text-sm">Free-form dice resolution for any character or NPC</p>
      </div>

      {/* Playsheet data indicator */}
      {hasPlaysheetData && playsheetState && (
        <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">📋 Pre-loaded from Playsheet:</span>
              <span className="text-white font-medium">
                {playsheetState.attributeName}
                {playsheetState.skillName && ` + ${playsheetState.skillName}`}
              </span>
            </div>
            <button
              onClick={() => setHasPlaysheetData(false)}
              className="text-slate-400 hover:text-slate-300 text-sm"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* Challenge vs Contest */}
      <div className="bg-slate-800 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-bold text-amber-400">Test Type</h2>
        <div>
          <div className="flex gap-2">
            <button
              onClick={() => setTestType('challenge')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                testType === 'challenge' 
                  ? 'bg-amber-500 text-slate-900' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Challenge
            </button>
            <button
              onClick={() => setTestType('contest')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                testType === 'contest' 
                  ? 'bg-amber-500 text-slate-900' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Contest
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Actor Configuration */}
        <div className="bg-slate-800 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-bold text-amber-400">Actor</h2>
          
          {/* Die Pool */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Die Pool</label>
            <select
              value={actorPoolRank}
              onChange={handlePoolRankChange}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
            >
              {DIE_POOL_TABLE.map((entry: DiePoolEntry) => (
                <option key={entry.rank} value={entry.rank}>
                  {entry.pool.notation} (Rank {entry.rank}) — {entry.amberRanking}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Bonus */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Skill Bonus (per die)</label>
            <div className="flex items-center">
              <StepperInput
                value={actorSkillBonus}
                onChange={handleSkillBonusChange}
                min={-1}
                max={4}
                className={actorSkillBonus >= 0 ? 'text-green-400' : 'text-red-400'}
                displayFn={(v) => `${v >= 0 ? '+' : ''}${v}`}
              />
              <span className="text-xs text-slate-500 ml-2">
                ({actorSkillBonus === -1 ? 'Poor' : actorSkillBonus === 0 ? 'Average' : ['Good', 'Great', 'Exceptional', 'Extraordinary'][actorSkillBonus - 1]})
              </span>
            </div>
          </div>

          {/* Wound Penalty & Situational Modifier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Wound Penalty (per die)</label>
              <StepperInput
                value={actorWoundPenalty}
                onChange={handleWoundPenaltyChange}
                min={-5}
                max={0}
                className={actorWoundPenalty < 0 ? 'text-red-400' : 'text-slate-300'}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Situational Modifier</label>
              <StepperInput
                value={actorModifier}
                onChange={handleActorModifierChange}
                min={-50}
                max={50}
                className={actorModifier >= 0 ? 'text-green-400' : 'text-red-400'}
                displayFn={(v) => `${v >= 0 ? '+' : ''}${v}`}
              />
            </div>
          </div>

          {/* Total Modifier Display */}
          <div className="bg-slate-700/50 rounded p-2 text-sm">
            <span className="text-slate-400">Total Modifier: </span>
            <span className={actorTotalModifier >= 0 ? 'text-green-400' : 'text-red-400'}>
              {actorTotalModifier >= 0 ? '+' : ''}{actorTotalModifier}
            </span>
            {actorPoolEntry.pool.dice.length > 1 && (
              <span className="text-slate-500 text-xs ml-2">
                ({actorSkillBonus >= 0 ? '+' : ''}{actorSkillBonus}/die skill, {actorWoundPenalty}/die wounds, {actorModifier >= 0 ? '+' : ''}{actorModifier} situational)
              </span>
            )}
          </div>
        </div>

        {/* Test Configuration */}
        <div className="bg-slate-800 rounded-lg p-4 space-y-4">
          
          {/* Target Number (Challenge only) */}
          {testType === 'challenge' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Target Number</label>
              <StepperInput
                value={targetNumber}
                onChange={handleTargetNumberChange}
                min={1}
                step={4}
                max={224}
              />
              <div className="text-xs text-slate-500 mt-1">
                Scale: {formatScale(resultToScale(targetNumber))}
              </div>
            </div>
          )}

          {/* Opponent (Contest only) */}
          {testType === 'contest' && (
            <div className="space-y-4 border-slate-700">
              <h2 className="text-md font-bold text-slate-300">Opponent</h2>
              
              {/* Foregone Conclusion Warning */}
              {foregoneCheck?.isForegone && (
                <div className="bg-amber-900/30 border border-amber-500/50 rounded p-3 text-sm">
                  <div className="font-bold text-amber-400">⚠️ Foregone Conclusion</div>
                  <div className="text-slate-300">
                    {foregoneCheck.winner === 'actor' 
                      ? 'Actor wins automatically (4+ advantage dice)' 
                      : 'Opponent wins automatically (4+ advantage dice)'}
                  </div>
                </div>
              )}

              {/* Opponent Die Pool */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Die Pool</label>
                <select
                  value={opponentPoolRank}
                  onChange={(e) => setOpponentPoolRank(parseInt(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
                >
                  {DIE_POOL_TABLE.map((entry: DiePoolEntry) => (
                    <option key={entry.rank} value={entry.rank}>
                      {entry.pool.notation} (Rank {entry.rank}) — {entry.amberRanking}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opponent Skill Bonus */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Skill Bonus (per die)</label>
                <div className="flex items-center">
                  <StepperInput
                    value={opponentSkillBonus}
                    onChange={handleOpponentSkillBonusChange}
                    min={-1}
                    max={4}
                    className={opponentSkillBonus >= 0 ? 'text-green-400' : 'text-red-400'}
                    displayFn={(v) => `${v >= 0 ? '+' : ''}${v}`}
                  />
                  <span className="text-xs text-slate-500 ml-2">
                    ({opponentSkillBonus === -1 ? 'Poor' : opponentSkillBonus === 0 ? 'Average' : ['Good', 'Great', 'Exceptional', 'Extraordinary'][opponentSkillBonus - 1]})
                  </span>
                </div>
              </div>

              {/* Opponent Modifiers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Wound Penalty (per die)</label>
                  <StepperInput
                    value={opponentWoundPenalty}
                    onChange={handleOpponentWoundPenaltyChange}
                    min={-4}
                    max={0}
                    className={opponentWoundPenalty < 0 ? 'text-red-400' : 'text-slate-300'}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Situational Modifier</label>
                  <StepperInput
                    value={opponentModifier}
                    onChange={handleOpponentModifierChange}
                    min={-4}
                    max={4}
                    className={opponentModifier >= 0 ? 'text-green-400' : 'text-red-400'}
                    displayFn={(v) => `${v >= 0 ? '+' : ''}${v}`}
                  />
                </div>
              </div>            
              {/* Total Modifier Display */}
              <div className="bg-slate-700/50 rounded p-2 text-sm">
                <span className="text-slate-400">Total Modifier: </span>
                <span className={opponentTotalModifier >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {opponentTotalModifier >= 0 ? '+' : ''}{opponentTotalModifier}
                </span>
                {actorPoolEntry.pool.dice.length > 1 && (
                  <span className="text-slate-500 text-xs ml-2">
                    ({opponentSkillBonus >= 0 ? '+' : ''}{opponentSkillBonus}/die skill, {opponentWoundPenalty}/die wounds, {opponentModifier >= 0 ? '+' : ''}{opponentModifier} situational)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Band Thresholds Display */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-amber-400 mb-3">Effort Bands — {actorPoolEntry.pool.notation}</h2>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          {(['green', 'yellow', 'orange', 'red'] as EffortBand[]).map(band => {
            const available = isBandAvailable(actorPoolEntry.pool, band);
            const value = actorThresholds[band];
            const style = bandStyles[band];
            return (
              <div 
                key={band}
                className={`rounded p-2 ${
                  available 
                    ? `${style.bg} border ${style.border}`
                    : 'bg-slate-800/50 border border-slate-600 opacity-50'
                }`}
              >
                <div className={`font-bold ${style.text}`}>
                  {style.emoji} {band.charAt(0).toUpperCase() + band.slice(1)}
                </div>
                <div className="text-xl text-slate-200">
                  {available ? value : '—'}
                </div>
                <div className="text-xs text-slate-500">
                  {!available && 'N/A'}
                  {available && band === 'green' && 'Baseline'}
                  {available && band !== 'green' && `${getSurgeCost(band)} Surge`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    {/* Resolution Buttons */}
    <div className="bg-slate-800 rounded-lg p-4">
    <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-bold text-amber-400">Resolve</h2>
        <button
        onClick={calculateProbability}
        disabled={probability.loading}
        className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded font-medium transition-colors text-sm"
        >
        {probability.loading ? '...' : '📊 Odds'}
        </button>
    </div>
    
    <div className="grid grid-cols-2 gap-3 mb-4">
        <button
        onClick={handleBaseline}
        disabled={!isBandAvailable(actorPoolEntry.pool, 'green')}
        className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-medium transition-colors"
        >
        🟩 Take Baseline
        {isBandAvailable(actorPoolEntry.pool, 'green') && actorThresholds.green !== null && (
            <div className="text-xs opacity-75">Result: {actorThresholds.green + actorTotalModifier}</div>
        )}
        </button>
        <button
        onClick={handleRoll}
        className="bg-slate-600 hover:bg-slate-500 text-white py-3 rounded font-medium transition-colors"
        >
        🎲 Roll the Dice
        <div className="text-xs opacity-75">Trust to chance</div>
        </button>
    </div>

    <div className="space-y-2">
    <div className="text-sm text-slate-400">Push with Surge:</div>
    <div className="grid grid-cols-3 gap-2">
        <button
        onClick={() => handleSurge('yellow')}
        disabled={!isBandAvailable(actorPoolEntry.pool, 'yellow')}
        className="bg-yellow-700 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded text-sm transition-colors"
        >
        🟨 Yellow (1)
        </button>
        <button
        onClick={() => handleSurge('orange')}
        disabled={!isBandAvailable(actorPoolEntry.pool, 'orange')}
        className="bg-orange-700 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded text-sm transition-colors"
        >
        🟧 Orange (2)
        </button>
        <button
        onClick={() => handleSurge('red')}
        disabled={!isBandAvailable(actorPoolEntry.pool, 'red')}
        className="bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded text-sm transition-colors"
        >
        🟥 Red (3)
        </button>
        </div>
        
        {probability.result && (
        <div className="text-sm text-right">
            {testType === 'challenge' ? (
            <span className={probability.result.success && probability.result.success >= 50 ? 'text-green-400' : 'text-red-400'}>
                {probability.result.success}% success
            </span>
            ) : (
            <div>
                <div className="flex gap-1 justify-end">
                <span className="text-green-400">{probability.result.win}%</span>
                <span className="text-slate-400">/</span>
                <span className="text-red-400">{probability.result.lose}%</span>
                {probability.result.tie && probability.result.tie > 0 && (
                    <>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-300">{probability.result.tie}%</span>
                    </>
                )}
                </div>
                <div className="text-xs text-slate-500">win / lose / tie</div>
            </div>
            )}
        </div>
        )}
    </div>
    </div>

      {/* Result Display */}
      {result && (
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-amber-400">Result</h2>
            <div className="text-sm text-slate-400">{lastApproach}</div>
          </div>

          {'winner' in result ? (
            // Contest result
            <div className="space-y-4">
              {renderActionResult(result.actor, 'Actor')}
              {result.opponent && renderActionResult(result.opponent, 'Opponent')}
              
              {/* Foregone enforced notice */}
              {result.foregoneEnforced && (
                <div className="bg-amber-900/30 border border-amber-500/50 rounded p-2 text-sm text-center">
                  <span className="text-amber-400">⚡ Foregone Conclusion Enforced</span>
                  <span className="text-slate-400 ml-2">— Dice overridden, minimum 1 success awarded</span>
                </div>
              )}
              
              <div className={`text-center p-4 rounded ${
                result.winner === 'actor' ? 'bg-green-900/30 border border-green-500/50' :
                result.winner === 'opponent' ? 'bg-red-900/30 border border-red-500/50' :
                'bg-slate-700/50 border border-slate-500'
              }`}>
                <div className="text-2xl font-bold">
                  {result.winner === 'actor' ? '🥇 Actor Wins!' :
                  result.winner === 'opponent' ? '🥈 Opponent Wins!' :
                  '⚔️ Tie!'}
                </div>
                {result.winner !== 'tie' && result.margin !== Infinity && (
                  <div className="text-sm text-slate-400">
                    {(() => {
                      const winnerSuccesses = result.winner === 'actor' 
                        ? result.actor.successes 
                        : result.opponent?.successes ?? 0;
                      const winThreshold = winnerSuccesses * 4;
                      const winScale = resultToScale(winThreshold);
                      const relativeScale = winScale !== null ? winScale + 1 : null;
                      
                      return (
                        <>
                          <span className="text-white font-medium">{winnerSuccesses}</span> {winnerSuccesses === 1 ? 'success' : 'successes'}
                          {relativeScale !== null && (
                            <span className="ml-2">
                              (Scale <span className="text-white font-medium">{formatScale(relativeScale)}x</span>)
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Challenge result
            <div className="space-y-4">
              {renderActionResult(result, 'Result')}
              <div className={`text-center p-3 rounded ${
                result.successes > 0 ? 'bg-green-900/30' : 'bg-red-900/30'
              }`}>
                <div className="font-bold">
                  {result.successes > 0 
                    ? `✓ Success! Beat TN ${targetNumber} by ${result.result - targetNumber}` 
                    : `✗ Failed by ${targetNumber - result.result}`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}