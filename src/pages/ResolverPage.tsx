import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGameState } from '../context/useGameState';
import { useCharacter } from '../context/useCharacter';
import { DIE_POOL_TABLE } from '../data/diePoolTable';
import type { DiePoolEntry } from '../data/diePoolTable';
import { 
  resolveTest, 
  resolveContest, 
  isForegoneConclusion,
  getSurgeCost,
  calculatePreviewResult,
  type PreviewResult
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
  targetNumber?: number;
  defenseMode?: boolean;
}

export function ResolverPage() {
  const location = useLocation();
  const playsheetState = location.state as PlaysheetState | undefined;
  const gameState = useGameState();
  const character = useCharacter();
  
  const hasCharacter = character.hasCharacter;
  const currentSurge = hasCharacter 
    ? character.computedCharacter.surge - gameState.surgeSpent 
    : Infinity;
  
  // Actor configuration - initialize from playsheet state if available
  const [actorPoolRank, setActorPoolRank] = useState(playsheetState?.poolRank ?? 8);
  const [actorSkillBonus, setActorSkillBonus] = useState(playsheetState?.skillBonus ?? 0);
  const [actorWoundPenalty, setActorWoundPenalty] = useState(playsheetState?.woundPenalty ?? 0);
  const [actorModifier, setActorModifier] = useState(0);
  
  // Test type & target number (moved up so they're available for the sync block)
  const [testType, setTestType] = useState<'challenge' | 'contest'>('challenge');
  const [targetNumber, setTargetNumber] = useState(4);
  
  // Track if values came from playsheet
  const [hasPlaysheetData, setHasPlaysheetData] = useState(!!playsheetState);
  const [isDefenseMode, setIsDefenseMode] = useState(!!playsheetState?.defenseMode);
  const [prevPlaysheetState, setPrevPlaysheetState] = useState(playsheetState);
  
  // Sync state when playsheet data arrives
  if (playsheetState !== prevPlaysheetState) {
    setPrevPlaysheetState(playsheetState);
    if (playsheetState) {
      setActorPoolRank(playsheetState.poolRank);
      setActorSkillBonus(playsheetState.skillBonus);
      setActorWoundPenalty(playsheetState.woundPenalty);
      if (playsheetState.targetNumber !== undefined) {
        setTargetNumber(playsheetState.targetNumber);
      }
      setIsDefenseMode(!!playsheetState.defenseMode);
      setHasPlaysheetData(true);
    }
  }
  
  // Opponent configuration (for contests)
  const [opponentPoolRank, setOpponentPoolRank] = useState(5);
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

  // Before the button grid, compute previews for all bands
  const previews = useMemo(() => {
    const result: Record<EffortBand, PreviewResult | null> = {
      green: null,
      yellow: null,
      orange: null,
      red: null,
    };
    
    for (const band of ['green', 'yellow', 'orange', 'red'] as EffortBand[]) {
      result[band] = calculatePreviewResult({
        attributePool: actorPoolEntry.pool,
        band,
        approach: band === 'green' ? 'baseline' : 'surge',
        skillBonus: actorSkillBonus,
        woundPenalty: actorWoundPenalty,
        situationalModifier: actorModifier,
      });
    }
    
    return result;
  }, [actorPoolEntry, actorSkillBonus, actorWoundPenalty, actorModifier]);

  // Returns true if this band's result is strictly better than all cheaper available bands
  const isSurgeWorthIt = (band: EffortBand): boolean => {
    if (band === 'green') return true;
    
    const bandPreview = previews[band];
    if (!bandPreview) return false;
    
    const cheaperBands: EffortBand[] = 
      band === 'yellow' ? ['green'] :
      band === 'orange' ? ['green', 'yellow'] :
      ['green', 'yellow', 'orange'];
    
    // Check if any cheaper available band gives same or better result
    for (const cheaper of cheaperBands) {
      if (isBandAvailable(actorPoolEntry.pool, cheaper)) {
        const cheaperPreview = previews[cheaper];
        if (cheaperPreview && cheaperPreview.result >= bandPreview.result) {
          return false;
        }
      }
    }
    
    return true;
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
    const surgeCost = getSurgeCost(band);
    if (hasCharacter && currentSurge < surgeCost) return;

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
    
    // Spend surge from the character's pool
    if (hasCharacter) {
      gameState.spendSurge(surgeCost);
    }
    
    setLastApproach(`Surge (${band})`);
  };

  // Probability calculation
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
  
  const calculateProbability = () => {
    const ITERATIONS = 10000;
    setProbability({ loading: true });
  
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
          /* const foregone = isForegoneConclusion(actorPoolEntry.rank, opponentPoolEntry.rank);
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
          } */
  
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
    <div className={`rounded p-2 ${
      ar.criticalFailure 
        ? 'bg-red-900/50 border border-red-500' 
        : ar.successes > 0 
          ? 'bg-green-900/30 border border-green-500/50' 
          : 'bg-slate-700/50 border border-slate-500'
    }`}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      {ar.criticalFailure ? (
        <div className="text-center py-1">
          <div className="text-2xl">💀</div>
          <div className="text-red-400 font-bold text-sm">CRITICAL FAILURE</div>
          <div className="text-xs text-slate-400">All 1s rolled!</div>
          {ar.rollDetails?.criticalFailureCheck && (
            <div className="text-xs text-slate-400">
              Confirmation: 🎲 {ar.rollDetails.criticalFailureCheck.confirmationRoll}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-white">{ar.result}</span>
              {ar.capped && <span className="ml-1 text-xs text-amber-400">(capped)</span>}
              <div className="text-xs text-slate-500">Scale: {formatScale(resultToScale(ar.result))}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${
                ar.band === 'green' ? 'text-green-400' :
                ar.band === 'yellow' ? 'text-yellow-400' :
                ar.band === 'orange' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {ar.band?.toUpperCase() ?? 'NONE'}
              </div>
              <div className="text-xs">
                {ar.successes} {ar.successes === 1 ? 'success' : 'successes'}
              </div>
            </div>
          </div>
          
          {ar.rollDetails?.criticalFailureCheck?.allMinimum && (
            <div className="mt-1 p-1 bg-amber-900/30 rounded text-center">
              <div className="text-xs text-amber-400">
                ⚠️ All dice rolled 1{ar.calculationBreakdown?.skillBonusPerDie && ar.calculationBreakdown.skillBonusPerDie < 0 ? ' or 2' : ''}!
                Confirmation: 🎲 {ar.rollDetails.criticalFailureCheck.confirmationRoll} — Saved!
              </div>
            </div>
          )}
          
          {ar.calculationBreakdown && (
            <div className="mt-1 pt-1 border-t border-slate-600 text-xs text-slate-400">
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {ar.rollDetails ? (
                <>
                  {ar.rollDetails.advantageDice && ar.rollDetails.advantageDice > 0 ? (
                    <>
                      <span>Roll (adv {ar.rollDetails.advantageDice}):</span>
                      <span className="text-white">
                        [{ar.rollDetails.keptRolls?.map(formatRollEntry).join(', ')}]
                        {ar.rollDetails.otherRolls && ar.rollDetails.otherRolls.length > 0 && (
                          <span className="text-blue-300 ml-1">+ [{ar.rollDetails.otherRolls.map(formatRollEntry).join(', ')}]</span>
                        )}
                        {ar.rollDetails.discardedRolls && ar.rollDetails.discardedRolls.length > 0 && (
                          <span className="text-slate-500 ml-1">drop [{ar.rollDetails.discardedRolls.map(formatRollEntry).join(', ')}]</span>
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
                    <span>Skill ({ar.calculationBreakdown.diceCount}×{ar.calculationBreakdown.skillBonusPerDie >= 0 ? '+' : ''}{ar.calculationBreakdown.skillBonusPerDie}):</span>
                    <span className={ar.calculationBreakdown.skillBonus >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {ar.calculationBreakdown.skillBonus >= 0 ? '+' : ''}{ar.calculationBreakdown.skillBonus}
                    </span>
                  </>
                )}
                {ar.calculationBreakdown.woundPenaltyPerDie !== 0 && (
                  <>
                    <span>Wounds ({ar.calculationBreakdown.diceCount}×{ar.calculationBreakdown.woundPenaltyPerDie}):</span>
                    <span className="text-red-400">{ar.calculationBreakdown.woundPenalty}</span>
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

  // Determine skill restrictions for available resolution options
  const isPoorSkill = actorSkillBonus === -1;
  const isTerribleSkill = actorSkillBonus === -2;

  return (
    <div className="max-w-6xl mx-auto px-2 py-2 space-y-2">
      {/* Compact Header */}
      <div className="bg-slate-800 rounded px-3 py-1.5 flex items-center justify-between">
        <h1 className="text-base font-bold text-amber-400">
          {isDefenseMode ? '🛡️ Defense Roll Resolver' : '🎲 Attribute Test Resolver'}
        </h1>
        {hasPlaysheetData && playsheetState && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400">📋 {playsheetState.attributeName}{playsheetState.skillName && ` + ${playsheetState.skillName}`}</span>
            <button onClick={() => setHasPlaysheetData(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
          </div>
        )}
      </div>

      {/* Main Layout: Config left, Resolution right */}
      <div className="grid lg:grid-cols-5 gap-2">
        
        {/* LEFT: Configuration */}
        <div className="lg:col-span-2 space-y-2">
          {/* Test Type */}
          <div className="bg-slate-800 rounded p-2">
            <div className="flex gap-1">
              <button
                onClick={() => setTestType('challenge')}
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
                  testType === 'challenge' 
                    ? 'bg-amber-500 text-slate-900' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Challenge
              </button>
              <button
                onClick={() => setTestType('contest')}
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
                  testType === 'contest' 
                    ? 'bg-amber-500 text-slate-900' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Contest
              </button>
            </div>
          </div>

          {/* Actor Configuration */}
          <div className="bg-slate-800 rounded p-2 space-y-2">
            <h2 className="text-sm font-bold text-amber-400">Actor</h2>
            
            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Die Pool</label>
              <select
                value={actorPoolRank}
                onChange={handlePoolRankChange}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
              >
                {DIE_POOL_TABLE.map((entry: DiePoolEntry) => (
                  <option key={entry.rank} value={entry.rank}>
                    {entry.pool.notation} ({entry.amberRanking})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Skill/die</label>
                <div className="flex items-center">
                  <StepperInput
                    value={actorSkillBonus}
                    onChange={handleSkillBonusChange}
                    min={-2}
                    max={4}
                    className={actorSkillBonus >= 0 ? 'text-green-400' : 'text-red-400'}
                    displayFn={(v) => `${v >= 0 ? '+' : ''}${v}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Wounds/die</label>
                <StepperInput
                  value={actorWoundPenalty}
                  onChange={handleWoundPenaltyChange}
                  min={-5}
                  max={0}
                  className={actorWoundPenalty < 0 ? 'text-red-400' : 'text-slate-300'}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Situational Modifier</label>
              <StepperInput
                value={actorModifier}
                onChange={handleActorModifierChange}
                min={-50}
                max={50}
                className={actorModifier >= 0 ? 'text-green-400' : 'text-red-400'}
                displayFn={(v) => `${v >= 0 ? '+' : ''}${v}`}
              />
            </div>

            <div className="bg-slate-700/50 rounded px-2 py-1 text-xs">
              <span className="text-slate-400">Total: </span>
              <span className={actorTotalModifier >= 0 ? 'text-green-400' : 'text-red-400'}>
                {actorTotalModifier >= 0 ? '+' : ''}{actorTotalModifier}
              </span>
            </div>
          </div>

          {/* Target Number (Challenge) or Opponent (Contest) */}
          {testType === 'challenge' ? (
            <div className="bg-slate-800 rounded p-2">
              <label className="block text-xs text-slate-400 mb-0.5">Target Number</label>
              <StepperInput
                value={targetNumber}
                onChange={handleTargetNumberChange}
                min={1}
                step={4}
                max={224}
              />
              <div className="text-xs text-slate-500 mt-0.5">
                Scale: {formatScale(resultToScale(targetNumber))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded p-2 space-y-2">
              <h2 className="text-sm font-bold text-slate-300">Opponent</h2>
              
              {foregoneCheck?.isForegone && (
                <div className="bg-amber-900/30 border border-amber-500/50 rounded px-2 py-1 text-xs">
                  <span className="text-amber-400 font-bold">⚠️ Foregone:</span>{' '}
                  <span className="text-slate-300">
                    {foregoneCheck.winner === 'actor' ? 'Actor wins' : 'Opponent wins'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Die Pool</label>
                <select
                  value={opponentPoolRank}
                  onChange={(e) => setOpponentPoolRank(parseInt(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                >
                  {DIE_POOL_TABLE.map((entry: DiePoolEntry) => (
                    <option key={entry.rank} value={entry.rank}>
                      {entry.pool.notation} ({entry.amberRanking})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-0.5">Skill/die</label>
                  <StepperInput
                    value={opponentSkillBonus}
                    onChange={handleOpponentSkillBonusChange}
                    min={-1}
                    max={4}
                    className={opponentSkillBonus >= 0 ? 'text-green-400' : 'text-red-400'}
                    displayFn={(v) => `${v >= 0 ? '+' : ''}${v}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-0.5">Wounds/die</label>
                  <StepperInput
                    value={opponentWoundPenalty}
                    onChange={handleOpponentWoundPenaltyChange}
                    min={-4}
                    max={0}
                    className={opponentWoundPenalty < 0 ? 'text-red-400' : 'text-slate-300'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Situational Modifier</label>
                <StepperInput
                  value={opponentModifier}
                  onChange={handleOpponentModifierChange}
                  min={-4}
                  max={4}
                  className={opponentModifier >= 0 ? 'text-green-400' : 'text-red-400'}
                  displayFn={(v) => `${v >= 0 ? '+' : ''}${v}`}
                />
              </div>

              <div className="bg-slate-700/50 rounded px-2 py-1 text-xs">
                <span className="text-slate-400">Total: </span>
                <span className={opponentTotalModifier >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {opponentTotalModifier >= 0 ? '+' : ''}{opponentTotalModifier}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Resolution & Results */}
        <div className="lg:col-span-3 space-y-2">
          {/* Resolution */}
          <div className="bg-slate-800 rounded p-2">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-sm font-bold text-amber-400">
                Resolve — {actorPoolEntry.pool.notation}
              </h2>
              <div className="flex items-center gap-2">
                {hasCharacter && (
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400">⚡</span>
                    <span className={`text-xs font-bold ${currentSurge <= 0 ? 'text-red-400' : currentSurge <= 2 ? 'text-yellow-400' : 'text-cyan-400'}`}>
                      {currentSurge}/{character.computedCharacter.surge}
                    </span>
                  </div>
                )}
                <button
                  onClick={calculateProbability}
                  disabled={probability.loading}
                  className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-0.5 rounded text-xs font-medium transition-colors"
                >
                  {probability.loading ? '...' : '📊 Odds'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
            {(['green', 'yellow', 'orange', 'red'] as EffortBand[]).map(band => {
              const available = isBandAvailable(actorPoolEntry.pool, band);
              const style = bandStyles[band];
              const surgeCost = band === 'green' ? 0 : getSurgeCost(band);
              
              // Determine if this specific option is restricted by skill rank
              const isSkillRestricted = 
                (isPoorSkill && band === 'green') || 
                isTerribleSkill; // Terrible restricts both baseline (green) and all surges
              
              const disabled = !available 
                || isSkillRestricted
                || (band !== 'green' && currentSurge < surgeCost)
                || !isSurgeWorthIt(band);
              
              const preview = calculatePreviewResult({
                attributePool: actorPoolEntry.pool,
                band,
                approach: band === 'green' ? 'baseline' : 'surge',
                skillBonus: actorSkillBonus,
                woundPenalty: actorWoundPenalty,
                situationalModifier: actorModifier,
              });

              return (
                <button
                  key={band}
                  onClick={() => band === 'green' ? handleBaseline() : handleSurge(band)}
                  disabled={disabled}
                  className={`rounded px-1.5 py-2 transition-colors ${
                    !available || isSkillRestricted
                      ? 'bg-slate-800/50 border border-slate-600 opacity-30 cursor-not-allowed'
                      : disabled
                        ? `${style.bg} border ${style.border} opacity-50 cursor-not-allowed`
                        : `${style.bg} border ${style.border} hover:brightness-110`
                  }`}
                >
                  <div className={`font-bold ${style.text}`}>
                    {style.emoji} {band.charAt(0).toUpperCase() + band.slice(1)}
                  </div>
                  <div className="text-lg text-slate-200">
                    {available && preview && !isSkillRestricted ? (
                      <>
                        {preview.result}
                        {preview.capped && <span className="text-xs text-amber-400 ml-0.5">⬆</span>}
                      </>
                    ) : '—'}
                  </div>
                  <div className="text-slate-400">
                    {band === 'green' ? (
                      <span>Baseline</span>
                    ) : (
                      <span>{surgeCost}⚡ Surge</span>
                    )}
                  </div>
                </button>
              );
            })}

              <button
                onClick={handleRoll}
                className="bg-slate-600 hover:bg-slate-500 text-white rounded px-1.5 py-2 transition-colors"
              >
                <div className="font-bold">🎲 Roll</div>
                <div className="text-lg text-slate-300">?</div>
                <div className="text-slate-400">Random</div>
              </button>
            </div>

            {probability.result && (
              <div className="text-xs text-right mt-1.5">
                {testType === 'challenge' ? (
                  <span className={probability.result.success && probability.result.success >= 50 ? 'text-green-400' : 'text-red-400'}>
                    {probability.result.success}% success
                  </span>
                ) : (
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
                )}
              </div>
            )}
          </div>

          {/* Result Display */}
          {result && (
            <div className="bg-slate-800 rounded p-2">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-sm font-bold text-amber-400">Result</h2>
                <div className="text-xs text-slate-400">{lastApproach}</div>
              </div>

              {'winner' in result ? (
                // Contest result
                <div className="space-y-2">
                  {renderActionResult(result.actor, 'Actor')}
                  {result.opponent && renderActionResult(result.opponent, 'Opponent')}
                  
                  {result.foregoneEnforced && (
                    <div className="bg-amber-900/30 border border-amber-500/50 rounded px-2 py-1 text-xs text-center">
                      <span className="text-amber-400">⚡ Foregone Conclusion Enforced</span>
                      <span className="text-slate-400 ml-1">— Minimum 1 success awarded</span>
                    </div>
                  )}
                  
                  <div className={`text-center p-2 rounded ${
                    result.winner === 'actor' ? 'bg-green-900/30 border border-green-500/50' :
                    result.winner === 'opponent' ? 'bg-red-900/30 border border-red-500/50' :
                    'bg-slate-700/50 border border-slate-500'
                  }`}>
                    <div className="text-lg font-bold">
                      {result.winner === 'actor' ? '🥇 Actor Wins!' :
                      result.winner === 'opponent' ? '🥈 Opponent Wins!' :
                      '⚔️ Tie!'}
                    </div>
                    {result.winner !== 'tie' && result.margin !== Infinity && (
                      <div className="text-xs text-slate-400">
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
                                <span className="ml-1">
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
                <div className="space-y-2">
                  {renderActionResult(result, 'Result')}
                  <div className={`text-center p-2 rounded ${
                    result.successes > 0 ? 'bg-green-900/30' : 'bg-red-900/30'
                  }`}>
                    <div className="text-sm font-bold">
                      {isDefenseMode
                        ? (result.result > 4
                          ? `🛡️ Defense ${result.result} — New TN: ${result.result}`
                          : `🛡️ Defense ${result.result} — TN remains 4`)
                        : (result.successes > 0
                          ? `✓ Success! Beat TN ${targetNumber} by ${result.result - targetNumber}`
                          : `✗ Failed by ${targetNumber - result.result}`)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}