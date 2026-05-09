import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCharacter } from '../context/CharacterContext';
import { useGameState, WOUND_LABELS, WOUND_PENALTIES } from '../context/GameStateContext';
import { ASPECTS, type AspectName, type WeaponAttack, type ArmorAspect } from '../types/character';
import { DAMAGE_MAGNITUDE_TABLE, type DamageMagnitudeEntry } from '../data/damageTable';
import { calculateDamage, getResistanceAttribute, calculateStacking } from '../utils/damage';
import type { DamageResult, WoundLevel } from '../utils/damage';
import { calculateWoundProbabilities, type WoundProbabilities } from '../utils/probability';
import StepperInput from '../components/StepperInput';

interface CombatPageState {
  mode?: 'attacker' | 'defender';
  weaponId?: string;
  attackIndex?: number;
  defenderAspect?: AspectName;
  armorId?: string;
}

function DamageSpread({ probabilities }: { probabilities: WoundProbabilities }) {
  const woundLevels = [
    { key: 'grazed' as const, label: 'Grazed', emoji: '⚠️', prob: probabilities.grazed, bgClass: 'bg-amber-900/40' },
    { key: 'scrape' as const, label: 'Scrape', emoji: '🟢', prob: probabilities.scrape, bgClass: 'bg-green-900/40' },
    { key: 'wound' as const, label: 'Wound', emoji: '🟡', prob: probabilities.wound, bgClass: 'bg-yellow-900/40' },
    { key: 'bleedingWound' as const, label: 'Bleed', emoji: '🟠', prob: probabilities.bleedingWound, bgClass: 'bg-orange-900/40' },
    { key: 'lifeThreatening' as const, label: 'Crit', emoji: '🔴', prob: probabilities.lifeThreatening, bgClass: 'bg-red-900/40' },
    { key: 'maimed' as const, label: 'Maim', emoji: '🦿', prob: probabilities.maimed, bgClass: 'bg-red-800/40' },
    { key: 'mortalWound' as const, label: 'Mortal', emoji: '☠️', prob: probabilities.mortalWound, bgClass: 'bg-red-900/60' },
    { key: 'deathBlow' as const, label: 'Death', emoji: '⚰️', prob: probabilities.deathBlow, bgClass: 'bg-red-950/60' },
  ];

  const maxProb = Math.max(...woundLevels.map(w => w.prob));
  const possibleOutcomes = woundLevels.filter(w => w.prob > 0.001);

  if (possibleOutcomes.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-slate-400">Outcome Probabilities</h3>
        <div className="text-[10px] text-slate-500">
          Avg {probabilities.averageDamage.toFixed(1)} dmg • {probabilities.minDamage}–{probabilities.maxDamage}
        </div>
      </div>
      <div className="flex gap-0.5">
        {woundLevels.map(w => {
          const isMax = w.prob === maxProb && w.prob > 0.001;
          const hasProb = w.prob > 0.001;
          const pct = w.prob * 100;
          
          return (
            <div
              key={w.key}
              className={`flex-1 rounded px-0.5 py-0.5 text-center ${
                isMax ? `ring-1 ring-amber-400 ${w.bgClass}` :
                hasProb ? w.bgClass :
                'opacity-20'
              }`}
            >
              <div className="text-xs leading-none">{w.emoji}</div>
              <div className={`text-[8px] mt-0.5 leading-tight ${hasProb ? 'text-slate-300' : 'text-slate-700'}`}>
                {w.label}
              </div>
              <div className={`text-[10px] font-bold ${hasProb ? 'text-white' : 'text-slate-700'}`}>
                {hasProb ? (pct < 0.5 ? '<1' : pct < 5 ? pct.toFixed(0) : Math.round(pct)) : '—'}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CombatPage() {
  const character = useCharacter();
  const gameState = useGameState();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CombatPageState | null;

  // Combat mode
  const [combatMode, setCombatMode] = useState<'attacker' | 'defender'>(state?.mode || 'attacker');
  
  // Weapon selection
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(state?.weaponId || '');
  const [selectedAttackIndex, setSelectedAttackIndex] = useState(state?.attackIndex || 0);
  
  // Compute initial attack values from weapon
  const initialWeapon = state?.weaponId 
    ? character.weapons.find(w => w.id === state.weaponId) 
    : null;
  const initialAttackIndex = state?.attackIndex ?? 0;
  const initialAttack = initialWeapon?.attacks[initialAttackIndex];

  // Attack values
  const [attackAspect, setAttackAspect] = useState<AspectName>(
    initialAttack?.aspect || state?.defenderAspect || gameState.opponentCombatData.attackAspect
  );
  const [attackMagnitude, setAttackMagnitude] = useState(
    initialAttack?.magnitude || gameState.opponentCombatData.attackMagnitude
  );
  const [attackPenetration, setAttackPenetration] = useState<number>(
    initialAttack 
      ? (Array.isArray(initialAttack.penetration) ? initialAttack.penetration[0] : initialAttack.penetration) 
      : gameState.opponentCombatData.attackPenetration
  );
  const [damageModifier, setDamageModifier] = useState(
    gameState.opponentCombatData.damageModifier
  );
  
  // Defender values
  const [customResistanceRank, setCustomResistanceRank] = useState<number | null>(null);
  const [customArmor, setCustomArmor] = useState<number | null>(null);
  const [customMaterialSize, setCustomMaterialSize] = useState<number | null>(null);
  const [customImmaterialSize, setCustomImmaterialSize] = useState<number | null>(null);
  const [resistanceModifier, setResistanceModifier] = useState(
    gameState.opponentCombatData.resistanceModifier
  );
  
  // Target selection
  const applyToOpponent = combatMode === 'attacker';
  
  // Results
  const [damageResult, setDamageResult] = useState<DamageResult | null>(null);

  const attackedAspect = attackAspect;

  // Get selected weapon
  const selectedWeapon = useMemo(() => {
    if (!selectedWeaponId) return null;
    return character.weapons.find(w => w.id === selectedWeaponId) || null;
  }, [selectedWeaponId, character.weapons]);

  // Get current attack
  const weaponAttack = useMemo((): WeaponAttack | null => {
    if (!selectedWeapon || selectedWeapon.attacks.length === 0) return null;
    return selectedWeapon.attacks[selectedAttackIndex] || selectedWeapon.attacks[0];
  }, [selectedWeapon, selectedAttackIndex]);

  // Get selected armor piece
  const selectedArmorPiece = useMemo(() => {
    if (!state?.armorId) return null;
    return character.armor.find(a => a.id === state.armorId) || null;
  }, [state?.armorId, character.armor]);

  const isPlayerDefender = combatMode === 'defender';
  const resistanceAttr = getResistanceAttribute(attackedAspect);
  
  // Resistance rank
  const baseResistanceRank = isPlayerDefender
    ? character.attributeDiePools[resistanceAttr].rank
    : gameState.opponentCombatData.resistanceRanks[resistanceAttr as keyof typeof gameState.opponentCombatData.resistanceRanks];
  const resistanceRank = customResistanceRank !== null ? customResistanceRank : baseResistanceRank;
  
  // Size values
  const materialSize = customMaterialSize !== null 
    ? customMaterialSize 
    : isPlayerDefender 
      ? character.size 
      : gameState.opponentCombatData.materialSize;
  const immaterialSize = customImmaterialSize !== null 
    ? customImmaterialSize 
    : isPlayerDefender 
      ? character.immaterialSize 
      : gameState.opponentCombatData.immaterialSize;

  const isPhysicalAspect = attackedAspect === 'Form' || attackedAspect === 'Flesh';
  const effectiveSize = isPhysicalAspect ? materialSize : immaterialSize;

  // Armor - from selected piece, opponent data, or manual entry
  const baseArmorValue = isPlayerDefender
  ? (selectedArmorPiece && selectedArmorPiece.aspects.includes(attackedAspect as ArmorAspect)
      ? selectedArmorPiece.armor
      : 0)
  : gameState.opponentCombatData.armor[resistanceAttr as keyof typeof gameState.opponentCombatData.armor];
  const armorValue = customArmor !== null ? customArmor : baseArmorValue;

  // Total resistance
  const totalResistance = resistanceRank + effectiveSize + resistanceModifier;

  // Effective armor
  const effectiveArmor = Math.max(0, armorValue - attackPenetration);

  // Calculate wound probabilities
  const woundProbabilities = useMemo(() => {
    return calculateWoundProbabilities({
      weaponMagnitude: attackMagnitude,
      damageModifier,
      resistance: resistanceRank + effectiveSize + resistanceModifier,
      armor: armorValue,
      penetration: attackPenetration,
    });
  }, [attackMagnitude, damageModifier, resistanceRank, effectiveSize, resistanceModifier, armorValue, attackPenetration]);

  // Handlers
  const handleAspectChange = (aspect: AspectName) => {
    setAttackAspect(aspect);
    setCustomResistanceRank(null);
    setCustomArmor(null);
    gameState.updateOpponentCombatData({ attackAspect: aspect });
  };

  const handleWeaponSelect = (weaponId: string) => {
    setSelectedWeaponId(weaponId);
    setSelectedAttackIndex(0);
    if (weaponId) {
      const weapon = character.weapons.find(w => w.id === weaponId);
      if (weapon && weapon.attacks.length > 0) {
        const attack = weapon.attacks[0];
        setAttackAspect(attack.aspect);
        setAttackMagnitude(attack.magnitude);
        const pen = Array.isArray(attack.penetration) ? attack.penetration[0] : attack.penetration;
        setAttackPenetration(pen);
        setCustomResistanceRank(null);
        setCustomArmor(null);
      }
    }
  };

  const handleAttackModeSelect = (idx: number) => {
    setSelectedAttackIndex(idx);
    if (selectedWeapon && selectedWeapon.attacks[idx]) {
      const attack = selectedWeapon.attacks[idx];
      setAttackAspect(attack.aspect);
      setAttackMagnitude(attack.magnitude);
      const pen = Array.isArray(attack.penetration) ? attack.penetration[0] : attack.penetration;
      setAttackPenetration(pen);
      setCustomResistanceRank(null);
      setCustomArmor(null);
    }
  };

  const handleCalculate = () => {
    const result = calculateDamage({
      weaponMagnitude: attackMagnitude,
      weaponPenetration: attackPenetration,
      attackedAspect,
      resistanceRank: resistanceRank,
      sizeModifier: effectiveSize,
      armorValue,
      damageModifier,
      resistanceModifier,
    });
    setDamageResult(result);
  };

  const handleApplyDamage = () => {
    if (!damageResult) return;
    const currentLevel = applyToOpponent 
      ? gameState.opponentWounds[attackedAspect] as WoundLevel
      : gameState.wounds[attackedAspect] as WoundLevel;
    const newLevel = damageResult.woundLevel;
    const { resultingLevel } = calculateStacking(currentLevel, newLevel);
    
    if (applyToOpponent) {
      gameState.setOpponentWound(attackedAspect, resultingLevel);
    } else {
      gameState.setWound(attackedAspect, resultingLevel);
    }
    setDamageResult(null);
  };

  const handleResetToDefaults = () => {
    if (weaponAttack) {
      setAttackAspect(weaponAttack.aspect);
      setAttackMagnitude(weaponAttack.magnitude);
      const pen = Array.isArray(weaponAttack.penetration) ? weaponAttack.penetration[0] : weaponAttack.penetration;
      setAttackPenetration(pen);
      setCustomResistanceRank(null);
      setCustomArmor(null);
    }
  };

  const saveOpponentData = () => {
    if (isPlayerDefender) {
      gameState.updateOpponentCombatData({
        attackAspect,
        attackMagnitude,
        attackPenetration,
        damageModifier,
      });
    } else {
      gameState.updateOpponentCombatData({
        resistanceRanks: {
          ...gameState.opponentCombatData.resistanceRanks,
          [resistanceAttr]: resistanceRank,
        },
        armor: {
          ...gameState.opponentCombatData.armor,
          [resistanceAttr]: armorValue,
        },
        materialSize,
        immaterialSize,
        resistanceModifier,
      });
    }
  };

  const handleModeSwitch = (newMode: 'attacker' | 'defender') => {
    saveOpponentData();
    setCombatMode(newMode);
    setDamageResult(null);
    setCustomResistanceRank(null);
    setCustomArmor(null);
    setCustomMaterialSize(null);
    setCustomImmaterialSize(null);
  };

  const handleNavigateBack = () => {
    saveOpponentData();
    navigate('/playsheet');
  };

  const renderWoundBadge = (level: number) => {
    const wl = WOUND_LABELS[level as WoundLevel] || WOUND_LABELS[0];
    return (
      <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium ${
        level === 0 ? 'bg-slate-700 text-slate-400' :
        level <= 2 ? 'bg-green-900/50 text-green-400' :
        level === 3 ? 'bg-yellow-900/50 text-yellow-400' :
        level === 4 ? 'bg-orange-900/50 text-orange-400' :
        level === 5 ? 'bg-red-900/50 text-red-400' :
        level === 6 ? 'bg-red-800/50 text-red-300' :
        level === 7 ? 'bg-red-900/70 text-red-200' :
        'bg-red-950/70 text-red-100'
      }`}>
        {wl.emoji} {wl.label}
      </span>
    );
  };

  const getSizeLabel = (size: number): string => {
    const labels: Record<number, string> = {
      '-3': 'Minuscule', '-2': 'Puny', '-1': 'Weedy', '0': 'Average',
      '1': 'Hulking', '2': 'Enormous', '3': 'Massive', '4': 'Immense',
      '5': 'Monumental', '6': 'Titanic',
    };
    return labels[size] || '';
  };

  if (!character.hasCharacter) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-slate-800 rounded-lg p-8">
          <h2 className="text-xl font-bold text-amber-400 mb-4">No Avatar Loaded</h2>
          <p className="text-slate-400 mb-6">Build an avatar in the Avatar Builder first.</p>
          <a href="/" className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-2 rounded font-medium transition-colors">
            Go to Avatar Builder
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 py-2 space-y-2">
      {/* Compact Header */}
      <div className="bg-slate-800 rounded p-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-amber-400">⚔️ Combat</h1>
            <div className="flex gap-1">
              <button
                onClick={() => handleModeSwitch('attacker')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  combatMode === 'attacker'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                🗡️ Attack
              </button>
              <button
                onClick={() => handleModeSwitch('defender')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  combatMode === 'defender'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                🛡️ Defend
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">👾 Reset Opponent:</span>
            <button
              onClick={gameState.resetOpponent}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded text-xs transition-colors"
              title="New Opponent"
            >
              🔄
            </button>
            <button
              onClick={handleNavigateBack}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-0.5 rounded text-xs transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Attacker left, Defender+Results right */}
      <div className="grid lg:grid-cols-5 gap-2">
        
        {/* LEFT: Attacker Config */}
        <div className="lg:col-span-2 bg-slate-800 rounded p-2 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-red-400">🗡️ Attacker</h2>
            {isPlayerDefender ? (
              <span className="text-[10px] text-blue-400">Opponent's attack</span>
            ) : (
              selectedWeaponId && weaponAttack && (
                <button
                  onClick={handleResetToDefaults}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline"
                >
                  Reset
                </button>
              )
            )}
          </div>

          {/* Weapon Selection - only when player is attacker */}
          {!isPlayerDefender && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-0.5">Weapon</label>
                <select
                  value={selectedWeaponId}
                  onChange={(e) => handleWeaponSelect(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                >
                  <option value="">— Select —</option>
                  {character.weapons.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {selectedWeapon && selectedWeapon.attacks.length > 1 && (
                <div>
                  <label className="block text-xs text-slate-400 mb-0.5">Attack Mode</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedWeapon.attacks.map((attack: WeaponAttack, idx: number) => (
                      <button
                        key={attack.id}
                        onClick={() => handleAttackModeSelect(idx)}
                        className={`px-2 py-0.5 rounded text-xs transition-colors ${
                          selectedAttackIndex === idx
                            ? 'bg-amber-500 text-slate-900 font-medium'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {ASPECTS.find(a => a.id === attack.aspect)?.emoji} {attack.magnitude}
                        {attack.isConditional && ' ⚠️'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Attack Fields */}
          <div className="bg-slate-700/50 rounded p-2 space-y-2">
            <div className="text-[10px] text-slate-500 italic">
              {isPlayerDefender 
                ? "Enter opponent's attack values."
                : "Edit for special circumstances."
              }
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Aspect</label>
              <div className="grid grid-cols-2 gap-1">
                {ASPECTS.map(aspect => (
                  <button
                    key={aspect.id}
                    onClick={() => handleAspectChange(aspect.id)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      attackAspect === aspect.id
                        ? 'bg-amber-500 text-slate-900 font-medium'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    {aspect.emoji} {aspect.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Magnitude</label>
              <select
                value={attackMagnitude}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setAttackMagnitude(val);
                  if (isPlayerDefender) gameState.updateOpponentCombatData({ attackMagnitude: val });
                }}
                className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs"
              >
                {DAMAGE_MAGNITUDE_TABLE.map((m: DamageMagnitudeEntry) => (
                  <option key={m.magnitude} value={m.magnitude}>
                    {m.magnitude} - {m.label} ({m.pool.notation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Penetration</label>
              <StepperInput
                value={attackPenetration}
                onChange={(delta) => {
                  const newVal = Math.min(Math.max(attackPenetration + delta, 0), 100);
                  setAttackPenetration(newVal);
                  if (isPlayerDefender) gameState.updateOpponentCombatData({ attackPenetration: newVal });
                }}
                min={0}
                max={100}
                className="text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-0.5">Damage Modifier</label>
              <StepperInput
                value={damageModifier}
                onChange={(delta) => {
                  const newVal = Math.min(Math.max(damageModifier + delta, -20), 20);
                  setDamageModifier(newVal);
                  if (isPlayerDefender) gameState.updateOpponentCombatData({ damageModifier: newVal });
                }}
                min={-20}
                max={20}
                className={damageModifier >= 0 ? 'text-green-400' : 'text-red-400'}
                displayFn={(v) => v >= 0 ? `+${v}` : String(v)}
              />
            </div>
          </div>

          {/* Weapon Notes */}
          {!isPlayerDefender && selectedWeapon?.notes && selectedWeapon.notes.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded p-1.5">
              <div className="text-[10px] text-amber-400 font-medium mb-0.5">Notes:</div>
              {selectedWeapon.notes.map((note: string, idx: number) => (
                <div key={idx} className="text-[10px] text-slate-300">• {note}</div>
              ))}
            </div>
          )}

          {!isPlayerDefender && weaponAttack?.isConditional && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded p-1.5">
              <div className="text-[10px] text-amber-400 font-medium">⚠️ Conditional Attack</div>
              <div className="text-[10px] text-slate-300">{weaponAttack.condition || 'Has conditional requirements.'}</div>
            </div>
          )}
        </div>

        {/* RIGHT: Defender + Probability + Results */}
        <div className="lg:col-span-3 space-y-2">
          {/* Defender Config */}
          <div className="bg-slate-800 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-blue-400">
                🛡️ Defender
                {!isPlayerDefender && <span className="text-[10px] text-slate-500 ml-1">(Opponent)</span>}
              </h2>
              <div className="text-xs text-slate-400">
                {ASPECTS.find(a => a.id === attackedAspect)?.emoji} {attackedAspect} → {resistanceAttr}
              </div>
            </div>

            {/* Wound Status */}
            {applyToOpponent ? (
              /* Opponent is defender: show all 4 opponent aspects */
              <div className="bg-slate-700/50 rounded p-2">
                <div className="text-xs text-slate-400 mb-1">
                  Opponent's Wounds
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {ASPECTS.map(aspect => {
                    const woundLevel = gameState.opponentWounds[aspect.id];
                    const isAttacked = aspect.id === attackedAspect;
                    const hasPenalty = WOUND_PENALTIES[woundLevel] < 0;
                    return (
                      <div
                        key={aspect.id}
                        className={`rounded px-1 py-1 text-center ${
                          isAttacked 
                            ? 'ring-2 ring-amber-400 bg-slate-600/50' 
                            : woundLevel === 0 
                              ? 'bg-slate-700/30' 
                              : woundLevel <= 2 
                                ? 'bg-green-900/20' 
                                : woundLevel <= 4 
                                  ? 'bg-orange-900/20' 
                                  : 'bg-red-900/20'
                        }`}
                      >
                        <div className="text-xs">{aspect.emoji}</div>
                        <div className="text-[10px] text-slate-400">{aspect.name}</div>
                        <div className="mt-0.5">{renderWoundBadge(woundLevel)}</div>
                        {hasPenalty && (
                          <div className="text-[9px] text-red-400">{WOUND_PENALTIES[woundLevel]}/die</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {gameState.opponentWoundPenalty < 0 && (
                  <div className="text-[10px] text-red-400 text-center mt-1">
                    Total Penalty: {gameState.opponentWoundPenalty}/die
                  </div>
                )}
              </div>
            ) : (
              /* Player is defender: show own wound on attacked aspect */
              <div className="bg-slate-700/50 rounded px-2 py-1 flex items-center justify-between">
                <span className="text-xs text-slate-400">Your Wound:</span>
                <div className="flex items-center gap-1">
                  {renderWoundBadge(gameState.wounds[attackedAspect])}
                  {WOUND_PENALTIES[gameState.wounds[attackedAspect] as WoundLevel] < 0 && (
                    <span className="text-[10px] text-red-400">
                      ({WOUND_PENALTIES[gameState.wounds[attackedAspect] as WoundLevel]}/die)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Resistance */}
            <div className="bg-slate-700/50 rounded p-2 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Resistance</span>
                <span className="text-cyan-400 font-bold text-sm">{totalResistance}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rank</span>
                  <StepperInput
                    value={resistanceRank}
                    onChange={(delta) => {
                      const newVal = Math.min(Math.max(resistanceRank + delta, 0), 20);
                      setCustomResistanceRank(newVal);
                      if (!isPlayerDefender) {
                        gameState.updateOpponentCombatData({
                          resistanceRanks: {
                            ...gameState.opponentCombatData.resistanceRanks,
                            [resistanceAttr]: newVal,
                          },
                        });
                      }
                    }}
                    min={0}
                    max={224}
                    className="text-white"
                    toggle={
                      isPlayerDefender
                        ? {
                            isCustom: customResistanceRank !== null,
                            onToggle: () => setCustomResistanceRank(customResistanceRank === null ? baseResistanceRank : null),
                            customLabel: 'C',
                            defaultLabel: 'S',
                          }
                        : undefined
                    }
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {isPhysicalAspect ? 'Mat' : 'Imm'} Size
                  </span>
                  <span className={`font-medium ${effectiveSize > 0 ? 'text-green-400' : effectiveSize < 0 ? 'text-red-400' : 'text-white'}`}>
                    {effectiveSize > 0 ? '+' : ''}{effectiveSize}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mod</span>
                  <StepperInput
                    value={resistanceModifier}
                    onChange={(delta) => {
                      const newVal = Math.min(Math.max(resistanceModifier + delta, -20), 20);
                      setResistanceModifier(newVal);
                      if (!isPlayerDefender) {
                        gameState.updateOpponentCombatData({ resistanceModifier: newVal });
                      }
                    }}
                    min={-20}
                    max={20}
                    className={resistanceModifier >= 0 ? 'text-green-400' : 'text-red-400'}
                    displayFn={(v) => v >= 0 ? `+${v}` : String(v)}
                  />
                </div>
              </div>
            </div>

            {/* Selected Armor Piece */}
            {isPlayerDefender && selectedArmorPiece && (
              <div className="bg-cyan-900/20 border border-cyan-500/30 rounded p-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-cyan-400 font-medium">🛡️ {selectedArmorPiece.name}</span>
                    <span className="text-slate-400 ml-1">
                      ({selectedArmorPiece.aspects.join(', ')} • Armor {selectedArmorPiece.armor})
                    </span>
                  </div>
                  {selectedArmorPiece.aspects.includes(attackedAspect as ArmorAspect) ? (
                    <span className="text-[10px] text-green-400">✓ Applies</span>
                  ) : (
                    <span className="text-[10px] text-red-400">✗ Doesn't protect {attackedAspect}</span>
                  )}
                </div>
                {selectedArmorPiece.location && (
                  <div className="text-[10px] text-slate-500 mt-0.5">{selectedArmorPiece.location}</div>
                )}
              </div>
            )}

            {/* Size & Armor */}
            <div className="grid grid-cols-2 gap-2">
              {/* Size */}
              <div className="bg-slate-700/50 rounded p-2 space-y-1">
                <div className="text-[10px] text-slate-400 font-medium">
                  {isPhysicalAspect ? '🧱 Material' : '🧠 Immaterial'} Size
                </div>
                <div className="flex items-center justify-between">
                  <StepperInput
                    value={isPhysicalAspect ? materialSize : immaterialSize}
                    onChange={(delta) => {
                      if (isPhysicalAspect) {
                        const newVal = Math.min(Math.max(materialSize + delta, -3), 6);
                        setCustomMaterialSize(newVal);
                        if (!isPlayerDefender) gameState.updateOpponentCombatData({ materialSize: newVal });
                      } else {
                        const newVal = Math.min(Math.max(immaterialSize + delta, -3), 6);
                        setCustomImmaterialSize(newVal);
                        if (!isPlayerDefender) gameState.updateOpponentCombatData({ immaterialSize: newVal });
                      }
                    }}
                    min={-3}
                    max={6}
                    className={effectiveSize > 0 ? 'text-green-400' : effectiveSize < 0 ? 'text-red-400' : 'text-white'}
                    displayFn={(v) => v > 0 ? `+${v}` : String(v)}
                    toggle={
                      isPlayerDefender
                        ? {
                            isCustom: isPhysicalAspect ? customMaterialSize !== null : customImmaterialSize !== null,
                            onToggle: () => {
                              if (isPhysicalAspect) {
                                setCustomMaterialSize(customMaterialSize === null ? character.size : null);
                              } else {
                                setCustomImmaterialSize(customImmaterialSize === null ? character.immaterialSize : null);
                              }
                            },
                            customLabel: 'C',
                            defaultLabel: 'S',
                          }
                        : undefined
                    }
                  />
                  <span className="text-[10px] text-slate-500">{getSizeLabel(isPhysicalAspect ? materialSize : immaterialSize)}</span>
                </div>
                {!isPhysicalAspect && (
                  <div className="text-[9px] text-slate-600">Charisma + Presence − 2</div>
                )}
              </div>

              {/* Armor */}
              <div className="bg-slate-700/50 rounded p-2 space-y-1">
              <div className="text-[10px] text-slate-400 font-medium">
                Armor vs {attackedAspect}
                {isPlayerDefender && selectedArmorPiece && selectedArmorPiece.aspects.includes(attackedAspect as ArmorAspect) && (
                  <span className="text-cyan-400 ml-1">({selectedArmorPiece.name})</span>
                )}
              </div>
                <StepperInput
                  value={armorValue}
                  onChange={(delta) => {
                    const newVal = Math.min(Math.max(armorValue + delta, 0), 224);
                    setCustomArmor(newVal);
                    if (!isPlayerDefender) {
                      gameState.updateOpponentCombatData({
                        armor: {
                          ...gameState.opponentCombatData.armor,
                          [resistanceAttr]: newVal,
                        },
                      });
                    }
                  }}
                  min={0}
                  max={224}
                  className="text-white"
                  toggle={
                    isPlayerDefender
                      ? {
                          isCustom: customArmor !== null,
                          onToggle: () => setCustomArmor(customArmor === null ? baseArmorValue : null),
                          customLabel: 'C',
                          defaultLabel: 'S',
                        }
                      : undefined
                  }
                />
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Pen −{attackPenetration}</span>
                  <span className={`font-medium ${effectiveArmor === 0 ? 'text-slate-500' : 'text-green-400'}`}>
                    = {effectiveArmor}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Probability Spread */}
          <DamageSpread probabilities={woundProbabilities} />

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded text-sm font-bold transition-colors"
          >
            🎲 Calculate Damage
          </button>

          {/* Results */}
          {damageResult && (
            <div className="bg-slate-800 rounded p-2 space-y-2">
              <h2 className="text-sm font-bold text-amber-400">Result</h2>

              {/* Damage Breakdown */}
              <div className="bg-slate-700/50 rounded p-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Roll:</span>
                  <span className="text-white">
                    [{damageResult.weaponRollDetails.dice.join(', ')}]
                    {damageResult.weaponRollDetails.explosions.length > 0 && (
                      <span className="text-amber-400 ml-1">
                        💥 {damageResult.weaponRollDetails.explosions.map(e => e.rolls.join('+')).join(', ')}
                      </span>
                    )} = {damageResult.weaponRollRaw}
                  </span>
                </div>

                {damageResult.damageModifier !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dmg Mod:</span>
                    <span className={damageResult.damageModifier > 0 ? 'text-green-400' : 'text-red-400'}>
                      {damageResult.damageModifier > 0 ? '+' : ''}{damageResult.damageModifier}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-400">Weapon Dmg:</span>
                  <span className="text-white font-medium">{damageResult.weaponDamage}</span>
                </div>

                <div className="border-t border-slate-600 pt-1" />

                <div className="flex justify-between">
                  <span className="text-slate-400">Resistance:</span>
                  <span className="text-red-400">
                    −{damageResult.resistanceReduction}
                    <span className="text-slate-500 ml-1 text-[10px]">
                      (R{damageResult.resistanceBreakdown.rank}
                      {damageResult.resistanceBreakdown.size !== 0 && (
                        <> {damageResult.resistanceBreakdown.size > 0 ? '+' : ''}{damageResult.resistanceBreakdown.size}</> 
                      )}
                      {damageResult.resistanceBreakdown.modifier !== 0 && (
                        <> {damageResult.resistanceBreakdown.modifier > 0 ? '+' : ''}{damageResult.resistanceBreakdown.modifier}</>
                      )})
                    </span>
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Armor:</span>
                  <span className="text-red-400">
                    −{damageResult.armorReduction}
                    {damageResult.penetration > 0 && (
                      <span className="text-slate-500 ml-1 text-[10px]">
                        ({damageResult.armorValue} − {damageResult.penetration} pen)
                      </span>
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-600 pt-1 flex justify-between font-bold">
                  <span className="text-slate-300">Final Damage:</span>
                  <span className="text-white text-base">{damageResult.finalDamage}</span>
                </div>
              </div>

              {/* Wound Level */}
              <div className={`rounded p-2 text-center ${
                damageResult.woundLevel <= 1 ? 'bg-slate-700/50 border border-slate-600' :
                damageResult.woundLevel === 2 ? 'bg-green-900/30 border border-green-500/50' :
                damageResult.woundLevel === 3 ? 'bg-yellow-900/30 border border-yellow-500/50' :
                damageResult.woundLevel === 4 ? 'bg-orange-900/30 border border-orange-500/50' :
                damageResult.woundLevel === 5 ? 'bg-red-900/30 border border-red-500/50' :
                'bg-red-950/50 border border-red-500/50'
              }`}>
                <div className="text-2xl">{damageResult.woundEmoji}</div>
                <div className="text-base font-bold text-white">{damageResult.woundLabel}</div>
                {damageResult.woundPenalty < 0 && (
                  <div className="text-xs text-slate-400">{damageResult.woundPenalty}/die penalty</div>
                )}
              </div>

              {/* Stacking Preview */}
              {(() => {
                const currentLevel = (applyToOpponent 
                  ? gameState.opponentWounds[attackedAspect] 
                  : gameState.wounds[attackedAspect]) as WoundLevel;
                const newLevel = damageResult.woundLevel;
                const { resultingLevel, description } = calculateStacking(currentLevel, newLevel);
                const isWorse = resultingLevel > currentLevel;

                return (
                  <div className={`rounded p-2 ${isWorse ? 'bg-amber-900/30 border border-amber-500/50' : 'bg-slate-700/50 border border-slate-600'}`}>
                    <div className="text-xs font-medium text-amber-400 mb-1">
                      Stacking ({applyToOpponent ? 'Opponent' : 'Self'})
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {renderWoundBadge(currentLevel)}
                      <span className="text-slate-500 text-xs">→</span>
                      {renderWoundBadge(resultingLevel)}
                    </div>
                    <div className="text-[10px] text-slate-400">{description}</div>

                    {isWorse && (
                      <button
                        onClick={handleApplyDamage}
                        className={`w-full mt-1.5 py-1.5 rounded text-xs font-medium transition-colors ${
                          applyToOpponent
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        Apply to {applyToOpponent ? 'Opponent' : 'Self'} {ASPECTS.find(a => a.id === attackedAspect)?.emoji} {attackedAspect}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}