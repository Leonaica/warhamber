import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCharacter } from '../context/CharacterContext';
import { useGameState, WOUND_LABELS, WOUND_PENALTIES } from '../context/GameStateContext';
import { ASPECTS, type AspectName, type ArmorAttributeName, type WeaponAttack } from '../types/character';
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
}

function DamageSpread({ probabilities }: { probabilities: WoundProbabilities }) {
  const woundLevels = [
    { key: 'none' as const, label: 'None', emoji: '○', prob: probabilities.none, bgClass: 'bg-slate-600/50' },
    { key: 'grazed' as const, label: 'Grazed', emoji: '⚠️', prob: probabilities.grazed, bgClass: 'bg-amber-900/40' },
    { key: 'scrape' as const, label: 'Scrape', emoji: '🟢', prob: probabilities.scrape, bgClass: 'bg-green-900/40' },
    { key: 'wound' as const, label: 'Wound', emoji: '🟡', prob: probabilities.wound, bgClass: 'bg-yellow-900/40' },
    { key: 'bleedingWound' as const, label: 'Bleeding', emoji: '🟠', prob: probabilities.bleedingWound, bgClass: 'bg-orange-900/40' },
    { key: 'lifeThreatening' as const, label: 'Critical', emoji: '🔴', prob: probabilities.lifeThreatening, bgClass: 'bg-red-900/40' },
    { key: 'maimed' as const, label: 'Maimed', emoji: '🦿', prob: probabilities.maimed, bgClass: 'bg-red-800/40' },
    { key: 'mortalWound' as const, label: 'Mortal', emoji: '☠️', prob: probabilities.mortalWound, bgClass: 'bg-red-900/60' },
    { key: 'deathBlow' as const, label: 'Death', emoji: '⚰️', prob: probabilities.deathBlow, bgClass: 'bg-red-950/60' },
  ];

  const maxProb = Math.max(...woundLevels.map(w => w.prob));
  const possibleOutcomes = woundLevels.filter(w => w.prob > 0.001);

  if (possibleOutcomes.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-400">Outcome Probabilities</h3>
        <div className="text-xs text-slate-500">
          Avg {probabilities.averageDamage.toFixed(1)} dmg • Range {probabilities.minDamage}–{probabilities.maxDamage}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {woundLevels.map(w => {
          const isMax = w.prob === maxProb && w.prob > 0.001;
          const hasProb = w.prob > 0.001;
          const pct = w.prob * 100;
          
          return (
            <div
              key={w.key}
              className={`flex-1 min-w-[70px] rounded p-1.5 text-center transition-all ${
                isMax ? `ring-2 ring-amber-400 ${w.bgClass} scale-105` :
                hasProb ? w.bgClass :
                'bg-slate-800/30 opacity-25'
              }`}
            >
              <div className="text-base leading-none">{w.emoji}</div>
              <div className={`text-[10px] mt-0.5 leading-tight ${hasProb ? 'text-slate-300' : 'text-slate-600'}`}>
                {w.label}
              </div>
              <div className={`text-xs font-bold mt-0.5 ${hasProb ? 'text-white' : 'text-slate-700'}`}>
                {hasProb ? (pct < 0.5 ? '<1%' : pct < 5 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`) : '—'}
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
  const combatMode = state?.mode || 'attacker';
  
  // Weapon selection
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(state?.weaponId || '');
  const [selectedAttackIndex, setSelectedAttackIndex] = useState(state?.attackIndex || 0);
  
  // Editable attack values (pre-filled from weapon, but modifiable)
  const [attackAspect, setAttackAspect] = useState<AspectName>(state?.defenderAspect || 'Form');
  const [attackMagnitude, setAttackMagnitude] = useState(3);
  const [attackPenetration, setAttackPenetration] = useState<number>(0);
  
  // Defender configuration
  const [damageModifier, setDamageModifier] = useState(0);
  const [resistanceModifier, setResistanceModifier] = useState(0);
  const [customArmor, setCustomArmor] = useState<number | null>(null);
  const [customResistanceRank, setCustomResistanceRank] = useState<number | null>(null);
  const [customMaterialSize, setCustomMaterialSize] = useState<number | null>(null);
  const [customImmaterialSize, setCustomImmaterialSize] = useState<number | null>(null);
  
  // Target selection: self or opponent
  const [applyToOpponent, setApplyToOpponent] = useState(combatMode === 'attacker');
  
  // Results
  const [damageResult, setDamageResult] = useState<DamageResult | null>(null);

  // The aspect being attacked is determined by the attack's aspect
  const attackedAspect = attackAspect;

  // Get selected weapon
  const selectedWeapon = useMemo(() => {
    if (!selectedWeaponId) return null;
    return character.weapons.find(w => w.id === selectedWeaponId) || null;
  }, [selectedWeaponId, character.weapons]);

  // Get current attack from weapon
  const weaponAttack = useMemo((): WeaponAttack | null => {
    if (!selectedWeapon || selectedWeapon.attacks.length === 0) return null;
    return selectedWeapon.attacks[selectedAttackIndex] || selectedWeapon.attacks[0];
  }, [selectedWeapon, selectedAttackIndex]);

  // Material Size (physical body size)
  const materialSize = customMaterialSize !== null ? customMaterialSize : character.size;
  
  // Immaterial Size (soul/warp presence)
  const immaterialSize = customImmaterialSize !== null ? customImmaterialSize : character.immaterialSize;

  // Determine which size applies based on aspect
  const isPhysicalAspect = attackedAspect === 'Form' || attackedAspect === 'Flesh';
  const effectiveSize = isPhysicalAspect ? materialSize : immaterialSize;

  // Handle aspect change - reset defender customizations since they're aspect-dependent
  const handleAspectChange = (aspect: AspectName) => {
    setAttackAspect(aspect);
    setCustomResistanceRank(null);
    setCustomArmor(null);
  };

  // Handle weapon selection - pre-fill attack values
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

  // Handle attack mode selection
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

  // Get resistance info for selected aspect
  const resistanceInfo = useMemo(() => {
    const resistAttr = getResistanceAttribute(attackedAspect);
    const baseRank = character.attributeDiePools[resistAttr].rank;
    const rank = customResistanceRank !== null ? customResistanceRank : baseRank;
    const totalResistance = rank + effectiveSize;
    return { attribute: resistAttr, rank, sizeBonus: effectiveSize, totalResistance };
  }, [character.attributeDiePools, attackedAspect, customResistanceRank, effectiveSize]);

  // Get armor for selected aspect (use custom if set)
  const armorValue = customArmor !== null ? customArmor : character.armor[resistanceInfo.attribute as ArmorAttributeName];

  // Effective armor after penetration (minimum 0)
  const effectiveArmor = Math.max(0, armorValue - attackPenetration);

  // Calculate wound probabilities
  const woundProbabilities = useMemo(() => {
    return calculateWoundProbabilities({
      weaponMagnitude: attackMagnitude,
      damageModifier,
      resistance: resistanceInfo.rank + effectiveSize + resistanceModifier,
      armor: armorValue,
      penetration: attackPenetration,
    });
  }, [attackMagnitude, damageModifier, resistanceInfo.rank, effectiveSize, resistanceModifier, armorValue, attackPenetration]);

  // Calculate damage
  const handleCalculate = () => {
    const result = calculateDamage({
      weaponMagnitude: attackMagnitude,
      weaponPenetration: attackPenetration,
      attackedAspect,
      resistanceRank: resistanceInfo.rank,
      sizeModifier: effectiveSize,
      armorValue,
      damageModifier,
      resistanceModifier,
    });
    
    setDamageResult(result);
  };

  // Apply damage to character or opponent
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

  // Reset attack fields to weapon defaults
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

  // Render wound badge
  const renderWoundBadge = (level: number) => {
    const wl = WOUND_LABELS[level as WoundLevel] || WOUND_LABELS[0];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
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

  // Size category labels
  const getSizeLabel = (size: number): string => {
    const labels: Record<number, string> = {
      '-3': 'Minuscule',
      '-2': 'Puny',
      '-1': 'Weedy',
      '0': 'Average',
      '1': 'Hulking',
      '2': 'Enormous',
      '3': 'Massive',
      '4': 'Immense',
      '5': 'Monumental',
      '6': 'Titanic',
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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">⚔️ Combat Resolution</h1>
            <p className="text-slate-400 text-sm mt-1">Calculate damage from attacks and apply wounds. All values are editable — adjust as needed for narrative circumstances.</p>
          </div>
          <button
            onClick={() => navigate('/playsheet')}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded text-sm transition-colors"
          >
            ← Back to Playsheet
          </button>
        </div>
      </div>

      {/* Mode Indicator & Target Selection */}
      <div className={`rounded-lg p-4 ${
        combatMode === 'attacker' ? 'bg-red-900/20 border border-red-500/30' : 'bg-blue-900/20 border border-blue-500/30'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className={`text-2xl`}>{combatMode === 'attacker' ? '🗡️' : '🛡️'}</span>
            <div>
              <div className={`font-bold ${combatMode === 'attacker' ? 'text-red-400' : 'text-blue-400'}`}>
                {combatMode === 'attacker' ? 'Attacker Mode' : 'Defender Mode'}
              </div>
              <div className="text-xs text-slate-400">
                {combatMode === 'attacker' 
                  ? 'You are attacking an opponent' 
                  : 'You are defending against an attack'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Apply damage to:</span>
            <button
              onClick={() => setApplyToOpponent(true)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                applyToOpponent
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              👾 Opponent
            </button>
            <button
              onClick={() => setApplyToOpponent(false)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                !applyToOpponent
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              🧑 Self
            </button>
          </div>
        </div>
      </div>

      {/* Opponent Tracking */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-amber-400">👾 Opponent</h2>
          <button
            onClick={gameState.resetOpponent}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded text-sm transition-colors"
          >
            🔄 New Opponent
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ASPECTS.map(aspect => {
            const woundLevel = gameState.opponentWounds[aspect.id];
            return (
              <div key={aspect.id} className={`rounded p-2 text-center ${
                woundLevel === 0 ? 'bg-slate-700/30' :
                woundLevel <= 2 ? 'bg-green-900/20' :
                woundLevel <= 4 ? 'bg-orange-900/20' :
                'bg-red-900/20'
              }`}>
                <div className="text-lg">{aspect.emoji}</div>
                <div className="text-xs text-slate-400">{aspect.name}</div>
                <div className="mt-1">
                  {renderWoundBadge(woundLevel)}
                </div>
                {WOUND_PENALTIES[woundLevel] < 0 && (
                  <div className="text-xs text-red-400 mt-1">{WOUND_PENALTIES[woundLevel]}/die</div>
                )}
              </div>
            );
          })}
        </div>
        {gameState.opponentWoundPenalty < 0 && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-400 text-center">
            Total Opponent Penalty: {gameState.opponentWoundPenalty}/die
          </div>
        )}
      </div>

      {/* Two-Frame Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: Attacker */}
        <div className="bg-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-red-400">🗡️ Attacker</h2>
            {selectedWeaponId && weaponAttack && (
              <button
                onClick={handleResetToDefaults}
                className="text-xs text-amber-400 hover:text-amber-300 underline"
              >
                Reset to weapon defaults
              </button>
            )}
          </div>

          {/* Weapon Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Weapon</label>
            <select
              value={selectedWeaponId}
              onChange={(e) => handleWeaponSelect(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="">— Select a weapon —</option>
              {character.weapons.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Attack Mode Selection (for multi-attack weapons) */}
          {selectedWeapon && selectedWeapon.attacks.length > 1 && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Attack Mode</label>
              <div className="flex flex-wrap gap-2">
                {selectedWeapon.attacks.map((attack: WeaponAttack, idx: number) => (
                  <button
                    key={attack.id}
                    onClick={() => handleAttackModeSelect(idx)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
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

          {/* Editable Attack Fields */}
          <div className="bg-slate-700/50 rounded p-3 space-y-3">
            <div className="text-xs text-slate-500 italic mb-2">
              Values pre-filled from weapon sheet. Edit as needed for special circumstances.
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Aspect</label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECTS.map(aspect => (
                  <button
                    key={aspect.id}
                    onClick={() => handleAspectChange(aspect.id)}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
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
              <label className="block text-sm text-slate-400 mb-1">Magnitude</label>
              <select
                value={attackMagnitude}
                onChange={(e) => setAttackMagnitude(parseInt(e.target.value))}
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm"
              >
                {DAMAGE_MAGNITUDE_TABLE.map((m: DamageMagnitudeEntry) => (
                  <option key={m.magnitude} value={m.magnitude}>
                    {m.magnitude} - {m.label} ({m.pool.notation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Penetration</label>
              <input
                type="number"
                value={attackPenetration}
                onChange={(e) => setAttackPenetration(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm"
              />
              <div className="text-xs text-slate-500 mt-1">Reduces target's armor by this amount</div>
            </div>
          </div>

          {/* Weapon Notes */}
          {selectedWeapon?.notes && selectedWeapon.notes.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded p-2">
              <div className="text-xs text-amber-400 font-medium mb-1">Weapon Notes:</div>
              {selectedWeapon.notes.map((note: string, idx: number) => (
                <div key={idx} className="text-xs text-slate-300">• {note}</div>
              ))}
            </div>
          )}

          {/* Conditional Attack Warning */}
          {weaponAttack?.isConditional && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded p-2">
              <div className="text-xs text-amber-400 font-medium">⚠️ Conditional Attack</div>
              <div className="text-xs text-slate-300">{weaponAttack.condition || 'This attack mode has conditional requirements.'}</div>
            </div>
          )}

          {/* Damage Modifier */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Damage Modifier</label>
            <StepperInput
              value={damageModifier}
              onChange={(delta) => setDamageModifier(prev => Math.min(Math.max(prev + delta, -20), 20))}
              min={-20}
              max={20}
              className={damageModifier >= 0 ? 'text-green-400' : 'text-red-400'}
              displayFn={(v) => v >= 0 ? `+${v}` : String(v)}
            />
            <div className="text-xs text-slate-500 mt-1">For situational bonuses/penalties</div>
          </div>
        </div>

        {/* RIGHT: Defender */}
        <div className="bg-slate-800 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-bold text-blue-400">🛡️ Defender</h2>

          {/* Aspect Being Attacked - display only, determined by attacker's aspect */}
          <div className="bg-slate-700/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-1">Aspect Being Attacked</div>
            <div className="text-lg font-medium text-white">
              {ASPECTS.find(a => a.id === attackedAspect)?.emoji} {attackedAspect}
            </div>
            <div className="text-xs text-slate-500 mt-1">Determines which Resistance attribute and Size type apply</div>
          </div>

          {/* Current Wound Status - show target's wounds */}
          <div className="bg-slate-700/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-1">
              {applyToOpponent ? "Opponent's" : "Your"} Current Wound
            </div>
            <div className="flex items-center gap-2">
              {renderWoundBadge(applyToOpponent ? gameState.opponentWounds[attackedAspect] : gameState.wounds[attackedAspect])}
              {WOUND_PENALTIES[(applyToOpponent ? gameState.opponentWounds[attackedAspect] : gameState.wounds[attackedAspect]) as WoundLevel] < 0 && (
                <span className="text-xs text-red-400">
                  ({WOUND_PENALTIES[(applyToOpponent ? gameState.opponentWounds[attackedAspect] : gameState.wounds[attackedAspect]) as WoundLevel]}/die)
                </span>
              )}
            </div>
          </div>

          {/* Resistance */}
          <div className="bg-slate-700/50 rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Resistance Attribute</span>
              <span className="text-white font-medium">{resistanceInfo.attribute}</span>
            </div>
            
            <div className="border-t border-slate-600 pt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Base Rank</span>
                <StepperInput
                  value={resistanceInfo.rank}
                  onChange={(delta) => {
                    const baseRank = character.attributeDiePools[resistanceInfo.attribute].rank;
                    const current = customResistanceRank ?? baseRank;
                    setCustomResistanceRank(Math.min(Math.max(current + delta, 0), 20));
                  }}
                  min={0}
                  max={20}
                  className="text-white"
                  buttonClassName="bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded text-sm"
                  toggle={{
                    isCustom: customResistanceRank !== null,
                    onToggle: () => setCustomResistanceRank(customResistanceRank === null ? resistanceInfo.rank : null),
                    customLabel: 'Custom',
                    defaultLabel: 'Sheet',
                  }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">
                  {isPhysicalAspect ? 'Material Size' : 'Immaterial Size'}
                </span>
                <span className={`font-bold ${effectiveSize > 0 ? 'text-green-400' : effectiveSize < 0 ? 'text-red-400' : 'text-white'}`}>
                  {effectiveSize > 0 ? '+' : ''}{effectiveSize}
                </span>
              </div>

              {resistanceModifier !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Modifier</span>
                  <span className={`font-bold ${resistanceModifier > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {resistanceModifier > 0 ? '+' : ''}{resistanceModifier}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-slate-600 pt-2">
                <span className="text-sm text-slate-300 font-medium">Total Resistance</span>
                <span className="text-cyan-400 font-bold text-lg">{resistanceInfo.totalResistance + resistanceModifier}</span>
              </div>
            </div>
          </div>

          {/* Size Details */}
          <div className="bg-slate-700/50 rounded p-3 space-y-3">
            <div className="text-sm text-slate-400 font-medium">Size</div>
            
            {/* Material Size */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-white">Material Size</div>
                <div className="text-xs text-slate-500">Physical body — used for 🧱 Form & 🧬 Flesh</div>
              </div>
              <StepperInput
                value={materialSize}
                onChange={(delta) => {
                  const current = customMaterialSize ?? character.size;
                  setCustomMaterialSize(Math.min(Math.max(current + delta, -3), 6));
                }}
                min={-3}
                max={6}
                className={materialSize > 0 ? 'text-green-400' : materialSize < 0 ? 'text-red-400' : 'text-white'}
                displayFn={(v) => v > 0 ? `+${v}` : String(v)}
                buttonClassName="bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded text-sm"
                toggle={{
                  isCustom: customMaterialSize !== null,
                  onToggle: () => setCustomMaterialSize(customMaterialSize === null ? character.size : null),
                  customLabel: 'Custom',
                  defaultLabel: 'Sheet',
                }}
              />
            </div>
            <div className="text-xs text-slate-500">
              {getSizeLabel(materialSize)} {materialSize !== character.size && <span className="text-amber-400">(modified)</span>}
            </div>

            {/* Immaterial Size */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-600">
              <div>
                <div className="text-sm text-white">Immaterial Size</div>
                <div className="text-xs text-slate-500">Soul presence — used for 🧠 Mind & 🔥 Spirit</div>
              </div>
              <StepperInput
                value={immaterialSize}
                onChange={(delta) => {
                  const current = customImmaterialSize ?? character.immaterialSize;
                  setCustomImmaterialSize(Math.min(Math.max(current + delta, -3), 6));
                }}
                min={-3}
                max={6}
                className={immaterialSize > 0 ? 'text-green-400' : immaterialSize < 0 ? 'text-red-400' : 'text-white'}
                displayFn={(v) => v > 0 ? `+${v}` : String(v)}
                buttonClassName="bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded text-sm"
                toggle={{
                  isCustom: customImmaterialSize !== null,
                  onToggle: () => setCustomImmaterialSize(customImmaterialSize === null ? character.immaterialSize : null),
                  customLabel: 'Custom',
                  defaultLabel: 'Calc',
                }}
              />
            </div>
            <div className="text-xs text-slate-500">
              {getSizeLabel(immaterialSize)} {immaterialSize !== character.immaterialSize && <span className="text-amber-400">(modified)</span>}
              {customImmaterialSize === null && (
                <span className="text-slate-600 ml-1">(Charisma + Presence dice − 2)</span>
              )}
            </div>

            {/* Active Size Indicator */}
            <div className={`rounded p-2 mt-2 ${
              isPhysicalAspect ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-purple-900/30 border border-purple-500/30'
            }`}>
              <div className="text-xs text-slate-400">
                Active for this attack: <span className="font-bold text-white">
                  {isPhysicalAspect ? 'Material Size' : 'Immaterial Size'}
                </span>
              </div>
              <div className={`text-lg font-bold ${
                effectiveSize > 0 ? 'text-green-400' : effectiveSize < 0 ? 'text-red-400' : 'text-white'
              }`}>
                {effectiveSize > 0 ? '+' : ''}{effectiveSize} {getSizeLabel(effectiveSize)}
              </div>
            </div>
          </div>

          {/* Armor */}
          <div className="bg-slate-700/50 rounded p-3">
            <div className="text-sm text-slate-400 mb-2">Armor vs {attackedAspect}</div>
            <StepperInput
              value={customArmor !== null ? customArmor : armorValue}
              onChange={(delta) => {
                const current = customArmor ?? armorValue;
                setCustomArmor(Math.min(Math.max(current + delta, 0), 20));
              }}
              min={0}
              max={20}
              className="text-white"
              buttonClassName="bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded text-sm"
              toggle={{
                isCustom: customArmor !== null,
                onToggle: () => setCustomArmor(customArmor === null ? armorValue : null),
                customLabel: 'Custom',
                defaultLabel: 'Sheet',
              }}
            />
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-400">Penetration</span>
              <span className="text-red-400">-{attackPenetration}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-400">Effective Armor</span>
              <span className={`font-bold ${effectiveArmor === 0 ? 'text-slate-500' : 'text-green-400'}`}>
                {effectiveArmor}
              </span>
            </div>
            {customArmor !== null && (
              <div className="text-xs text-amber-400 mt-1">
                Custom armor value — adjust for cover, special qualities, etc.
              </div>
            )}
          </div>

          {/* Resistance Modifier */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Resistance Modifier</label>
            <StepperInput
              value={resistanceModifier}
              onChange={(delta) => setResistanceModifier(prev => Math.min(Math.max(prev + delta, -20), 20))}
              min={-20}
              max={20}
              className={resistanceModifier >= 0 ? 'text-green-400' : 'text-red-400'}
              displayFn={(v) => v >= 0 ? `+${v}` : String(v)}
            />
            <div className="text-xs text-slate-500 mt-1">For situational bonuses/penalties to resistance</div>
          </div>
        </div>
      </div>

      {/* Damage Probability Spread */}
      <DamageSpread probabilities={woundProbabilities} />

      {/* Calculate Button */}
      <div className="bg-slate-800 rounded-lg p-4">
        <button
          onClick={handleCalculate}
          className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold text-lg transition-colors"
        >
          🎲 Calculate Damage
        </button>
      </div>

      {/* Results */}
      {damageResult && (
        <div className="bg-slate-800 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-bold text-amber-400">Damage Result</h2>

          {/* Damage Breakdown */}
          <div className="bg-slate-700/50 rounded p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Weapon Roll:</span>
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
                <span className="text-slate-400">Damage Modifier:</span>
                <span className={damageResult.damageModifier > 0 ? 'text-green-400' : 'text-red-400'}>
                  {damageResult.damageModifier > 0 ? '+' : ''}{damageResult.damageModifier}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-400">Total Weapon Damage:</span>
              <span className="text-white font-medium">{damageResult.weaponDamage}</span>
            </div>

            <div className="border-t border-slate-600 pt-2" />

            <div className="flex justify-between">
              <span className="text-slate-400">Resistance:</span>
              <span className="text-red-400">
                -{damageResult.resistanceReduction}
                <span className="text-slate-500 ml-1">
                  (Rank {damageResult.resistanceBreakdown.rank}
                  {damageResult.resistanceBreakdown.size !== 0 && (
                    <> + {isPhysicalAspect ? 'Material' : 'Immaterial'} {damageResult.resistanceBreakdown.size > 0 ? '+' : ''}{damageResult.resistanceBreakdown.size}</>
                  )}
                  {damageResult.resistanceBreakdown.modifier !== 0 && (
                    <> + {damageResult.resistanceBreakdown.modifier > 0 ? '+' : ''}{damageResult.resistanceBreakdown.modifier} mod</>
                  )})
                </span>
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Armor:</span>
              <span className="text-red-400">
                -{damageResult.armorReduction}
                {damageResult.penetration > 0 && (
                  <span className="text-slate-500 ml-1">
                    ({damageResult.armorValue} armor - {damageResult.penetration} pen = {damageResult.effectiveArmor})
                  </span>
                )}
              </span>
            </div>

            <div className="border-t border-slate-600 pt-2 flex justify-between font-bold">
              <span className="text-slate-300">Final Damage:</span>
              <span className="text-white text-lg">{damageResult.finalDamage}</span>
            </div>
          </div>

          {/* Wound Level */}
          <div className={`rounded-lg p-4 text-center ${
            damageResult.woundLevel <= 1 ? 'bg-slate-700/50 border border-slate-600' :
            damageResult.woundLevel === 2 ? 'bg-green-900/30 border border-green-500/50' :
            damageResult.woundLevel === 3 ? 'bg-yellow-900/30 border border-yellow-500/50' :
            damageResult.woundLevel === 4 ? 'bg-orange-900/30 border border-orange-500/50' :
            damageResult.woundLevel === 5 ? 'bg-red-900/30 border border-red-500/50' :
            'bg-red-950/50 border border-red-500/50'
          }`}>
            <div className="text-4xl mb-2">{damageResult.woundEmoji}</div>
            <div className="text-xl font-bold text-white">{damageResult.woundLabel}</div>
            {damageResult.woundPenalty < 0 && (
              <div className="text-sm text-slate-400 mt-1">{damageResult.woundPenalty}/die penalty</div>
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
              <div className={`rounded p-3 ${isWorse ? 'bg-amber-900/30 border border-amber-500/50' : 'bg-slate-700/50 border border-slate-600'}`}>
                <div className="text-sm font-medium text-amber-400 mb-2">
                  Stacking Preview ({applyToOpponent ? 'Opponent' : 'Self'})
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-400 text-sm">Current:</span>
                  {renderWoundBadge(currentLevel)}
                  <span className="text-slate-500">→</span>
                  <span className="text-slate-400 text-sm">Result:</span>
                  {renderWoundBadge(resultingLevel)}
                </div>
                <div className="text-xs text-slate-400">{description}</div>

                {isWorse && (
                  <button
                    onClick={handleApplyDamage}
                    className={`w-full mt-3 py-2 rounded font-medium transition-colors ${
                      applyToOpponent
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {applyToOpponent 
                      ? `Apply Damage to Opponent's ${ASPECTS.find(a => a.id === attackedAspect)?.emoji} ${attackedAspect}`
                      : `Apply Damage to Your ${ASPECTS.find(a => a.id === attackedAspect)?.emoji} ${attackedAspect}`
                    }
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}