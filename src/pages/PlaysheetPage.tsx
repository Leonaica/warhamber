import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../context/CharacterContext';
import { useGameState, WOUND_LABELS, WOUND_PENALTIES, type WoundLevel } from '../context/GameStateContext';
import { ASPECTS, FUNCTIONS, ATTRIBUTES, SIZE_OPTIONS, SKILL_RATINGS, type AspectName, type AttributeName, type ArmorAspect } from '../types/character';
import { ICONS, DEFAULT_ICON, type IconEntry } from '../data/icons';
import { DIE_POOL_TABLE } from '../data/diePoolTable';
import type { DiePoolEntry } from '../data/diePoolTable';
import { resolveTest } from '../utils/resolution';
import { getScaleForPool } from '../data/actionEffortTable';
import { POWERS } from '../data/powers';
import { SKILLS } from '../data/skills';
import { getPowerDisplay } from '../utils/powerDisplay';
import { generateHomebreweryMarkdown } from '../utils/homebreweryExport';

const DEFENSE_ATTRIBUTES: Record<AspectName, AttributeName> = {
  Form: 'Toughness',
  Flesh: 'Endurance',
  Mind: 'Willpower',
  Spirit: 'Resilience',
};

const HEALING_ATTRIBUTES: Record<AspectName, AttributeName> = {
  Form: 'Endurance',
  Flesh: 'Endurance',
  Mind: 'Willpower',
  Spirit: 'Resilience',
};

// Create a quick lookup map from the source of truth
const SKILL_MODIFIER_MAP = new Map<string, number>(
  SKILL_RATINGS.map(r => [r.rating, r.modifier])
);

// Helper function
function getSkillModifier(rating: string): number {
  return SKILL_MODIFIER_MAP.get(rating) ?? 0;
}

export interface CombatPageState {
  mode?: 'attacker' | 'defender';
  weaponId?: string;
  attackIndex?: number;
  defenderAspect?: AspectName;
  armorId?: string;
}

type TabId = 'actions' | 'defense' | 'abilities';

export function PlaysheetPage() {
  const character = useCharacter();
  const gameState = useGameState();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabId>('actions');
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeName | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [healModalAspect, setHealModalAspect] = useState<AspectName | null>(null);
  const [healPoolRank, setHealPoolRank] = useState(5);
  const [healSkillBonus, setHealSkillBonus] = useState(0);
  const [healModifier, setHealModifier] = useState(0);
  const [healResult, setHealResult] = useState<{ aspect: AspectName; successes: number; roll: number } | null>(null);
  const [surgeExpanded, setSurgeExpanded] = useState(false);

  const renderIcon = (icon: IconEntry) => {
    return icon.library === 'fontawesome' ? (
      <i className={icon.faClass || 'fa-solid fa-user'}></i>
    ) : (
      <span className="ei-icon">{icon.eiChar}</span>
    );
  };

  const currentSurge = character.computedCharacter.surge - gameState.surgeSpent;

  const wouldHeal = (aspect: AspectName) => {
    const currentLevel = gameState.wounds[aspect];
    if (currentLevel <= 0) return false;
    const pointsNeeded = currentLevel;
    return gameState.restorationPoints[aspect] >= pointsNeeded;
  };

  const applyHealing = (aspect: AspectName) => {
    const currentLevel = gameState.wounds[aspect];
    if (currentLevel <= 0) return;
    const pointsNeeded = currentLevel;
    if (gameState.restorationPoints[aspect] >= pointsNeeded) {
      gameState.setWound(aspect, (currentLevel - 1) as WoundLevel);
      gameState.addRestorationPoints(aspect, -pointsNeeded);
    }
  };

  const rollNaturalHealing = (aspect: AspectName) => {
    const healingAttr = HEALING_ATTRIBUTES[aspect];
    const diePoolEntry = character.attributeDiePools[healingAttr];
    
    const result = resolveTest({
      attributePool: diePoolEntry.pool,
      poolRank: diePoolEntry.rank,
      skillBonus: 0,
    //  woundPenalty: gameState.woundPenalty,
      woundPenalty: 0,
      situationalModifier: 0,
      isContest: false,
      targetNumber: 4,
      approach: 'roll',
    });
    
    if (result.successes > 0) {
      gameState.addRestorationPoints(aspect, result.successes);
    }
    
    setHealResult({
      aspect,
      successes: result.successes,
      roll: result.result,
    });
  };

  const rollAidedHealing = (aspect: AspectName) => {
    const poolEntry = DIE_POOL_TABLE.find((e: DiePoolEntry) => e.rank === healPoolRank) || DIE_POOL_TABLE[5];
    
    const result = resolveTest({
      attributePool: poolEntry.pool,
      poolRank: healPoolRank,
      skillBonus: healSkillBonus,
      woundPenalty: 0,
      situationalModifier: healModifier,
      isContest: false,
      targetNumber: 4,
      approach: 'roll',
    });
    
    if (result.successes > 0) {
      gameState.addRestorationPoints(aspect, result.successes);
    }
    
    setHealResult({
      aspect,
      successes: result.successes,
      roll: result.result,
    });
    setHealModalAspect(null);
  };

  function formatMultiplier(value: number): string {
    // Format a number, dropping trailing .0
    const fmt = (n: number): string => n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
    
    if (value < 10) return fmt(value);
    if (value < 1000) return Math.round(value).toString();
    if (value < 10000) return fmt(value / 1000) + 'K';
    if (value < 1000000) return Math.round(value / 1000) + 'K';
    if (value < 10000000) return fmt(value / 1000000) + 'M';
    if (value < 1000000000) return Math.round(value / 1000000) + 'M';
    if (value < 10000000000) return fmt(value / 1000000000) + 'B';
    return Math.round(value / 1000000000) + 'B';
  }

  const goToResolver = () => {
    if (!selectedAttribute) return;
    
    const attrEntry = character.attributeDiePools[selectedAttribute];
    const skillBonus = selectedSkill 
      ? getSkillModifier(character.skills.find(s => s.skillId === selectedSkill)?.rating || 'Average')
      : 0;
    
    navigate('/resolver', {
      state: {
        poolRank: attrEntry.rank,
        skillBonus,
        woundPenalty: gameState.woundPenalty,
        attributeName: selectedAttribute,
        skillName: selectedSkill,
      }
    });
  };

  const getSelectedSkillBonus = () => {
    if (!selectedSkill) return 0;
    const skill = character.skills.find(s => s.skillId === selectedSkill);
    return skill ? getSkillModifier(skill.rating) : 0;
  };

  const goToCombatAsAttacker = (weaponId: string, attackIndex: number = 0) => {
    navigate('/combat', {
      state: {
        mode: 'attacker',
        weaponId,
        attackIndex,
      } as CombatPageState
    });
  };

  const goToCombatAsDefender = (aspect?: AspectName, armorId?: string) => {
    navigate('/combat', {
      state: {
        mode: 'defender',
        defenderAspect: aspect,
        armorId,
      } as CombatPageState
    });
  };

  const handleExportMarkdown = () => {
    const markdown = generateHomebreweryMarkdown(
      character.name,
      character.avatarIcon,
      character.campaignLimit,
      character.aspects,
      character.functions,
      character.aspectExplanations,
      character.functionExplanations,
      character.skills,
      character.powers,
      character.artifacts,
      character.allies,
      character.personalShadows,
      character.weapons,
      character.armor,
      character.size,
      character.pace,
      character.computedCharacter.stuff,
      character.computedCharacter.surge
    );
    navigator.clipboard.writeText(markdown).then(() => {
      alert('Markdown copied to clipboard!');
    }).catch(() => {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${character.name || 'avatar'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };
  
  const handlePrint = () => {
    window.print();
  };

  if (!character.hasCharacter) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="bg-slate-800 rounded-lg p-8">
          <h2 className="text-xl font-bold text-amber-400 mb-4">No Avatar Loaded</h2>
          <p className="text-slate-400 mb-6">
            Build an avatar in the Avatar Builder first, then switch to the Playsheet.
          </p>
          <a
            href="/"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-2 rounded font-medium transition-colors"
          >
            Go to Avatar Builder
          </a>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; emoji: string }[] = [
    { id: 'actions', label: 'Actions', emoji: '⚔️' },
    { id: 'defense', label: 'Defense', emoji: '🛡️' },
    { id: 'abilities', label: 'Abilities', emoji: '✨' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Header Bar */}
      <div className="bg-slate-800 rounded-lg p-3">
        {/* Row 1: Character info + action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-3xl shrink-0">
              {renderIcon(ICONS.find(i => i.code === character.avatarIcon) || DEFAULT_ICON)}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-amber-400 leading-tight truncate">
                {character.name || 'Unnamed Avatar'}
              </h1>
              <div className="text-xs text-slate-400">
                {character.computedCharacter.totalPointsSpent}/{character.campaignLimit} pts
                {character.computedCharacter.stuff !== 0 && (
                  <span className="ml-2">
                    {character.computedCharacter.stuff > 0 ? '🌕' : '🌑'} {Math.abs(character.computedCharacter.stuff)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 shrink-0">
            <div className="relative group">
              <button onClick={handleExportMarkdown} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded text-xs">📜</button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-950 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                Export Markdown
              </div>
            </div>
            <div className="relative group">
              <button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded text-xs">🖨️</button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-950 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                Print Character
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={gameState.resetAll}
                className="bg-red-900/50 hover:bg-red-800/50 text-red-400 px-2 py-1 rounded text-xs"
              >
                🔄
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-950 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                Reset All
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Stats - stack on mobile, row on larger screens */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-x-4 sm:gap-y-2 mt-2 pt-2 border-t border-slate-700/50">
          {/* Wound Indicators */}
          {gameState.woundPenalty < 0 && (
            <span className="text-xs bg-red-900/30 border border-red-500/50 px-2 py-1 rounded text-red-400">
              {gameState.woundPenalty}/die penalty
            </span>
          )}

          {/* Surge */}
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⚡</span>
            <span className={`text-lg font-bold ${currentSurge <= 0 ? 'text-red-400' : currentSurge <= 2 ? 'text-yellow-400' : 'text-cyan-400'}`}>
              {currentSurge}/{character.computedCharacter.surge}
            </span>
            <button
              onClick={() => setSurgeExpanded(!surgeExpanded)}
              className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-xs"
            >
              {surgeExpanded ? '▲' : '▼'}
            </button>
          </div>

          {/* Pace */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Pace</span>
            <span className="text-sm font-bold text-cyan-400">{character.pace.walking.mph}/{character.pace.sprinting.mph} mph</span>
            <span className="text-sm text-slate-500 hidden sm:inline">({character.pace.walking.kph}/{character.pace.sprinting.kph} kph)</span>
          </div>
        </div>

        {/* Expandable Surge Controls */}
        {surgeExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => gameState.spendSurge(1)}
                disabled={currentSurge <= 0}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded text-sm"
              >
                🟨 Spend 1
              </button>
              <button
                onClick={() => gameState.spendSurge(2)}
                disabled={currentSurge <= 1}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded text-sm"
              >
                🟧 Spend 2
              </button>
              <button
                onClick={() => gameState.spendSurge(3)}
                disabled={currentSurge <= 2}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded text-sm"
              >
                🟥 Spend 3
              </button>
              <button
                onClick={() => gameState.spendSurge(-1)}
                disabled={currentSurge >= character.computedCharacter.surge}
                className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded text-sm"
              >
                ⚡ Regain 1
              </button>
              <button
                onClick={gameState.resetSurge}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-sm"
              >
                🌅 Long Rest
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Roll Selection Bar */}
      {selectedAttribute && (
        <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-medium text-sm">Roll:</span>
              <span className="bg-slate-700 px-2 py-1 rounded text-white text-sm">
                {selectedAttribute}
              </span>
              {selectedSkill && (
                <>
                  <span className="text-slate-400">+</span>
                  <span className="bg-slate-700 px-2 py-1 rounded text-white text-sm">
                    {selectedSkill} ({getSelectedSkillBonus() >= 0 ? '+' : ''}{getSelectedSkillBonus()}/die)
                  </span>
                </>
              )}
              {gameState.woundPenalty < 0 && (
                <>
                  <span className="text-slate-400">+</span>
                  <span className="bg-red-900/50 px-2 py-1 rounded text-red-400 text-sm">
                    {gameState.woundPenalty}/die
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedAttribute(null); setSelectedSkill(null); }}
                className="bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1 rounded text-sm"
              >
                Clear
              </button>
              <button
                onClick={goToResolver}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-1 rounded font-medium text-sm"
              >
                🎲 Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          {/* Attributes & Skills */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Attributes Grid */}
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-amber-400">Attributes</h2>
                <span className="text-xs text-slate-500">Click to select for rolling</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-1.5 w-8"></th>
                      <th className="p-1.5 w-20"></th>
                      {ASPECTS.map(aspect => (
                        <th key={aspect.id} className="p-1.5 text-center border-b border-slate-600">
                          <div className="font-bold text-amber-300 text-xs">{aspect.emoji} {aspect.name}</div>
                          <div className="text-xs text-slate-400">
                            {character.aspects[aspect.id] >= 0 ? '+' : ''}{character.aspects[aspect.id]}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FUNCTIONS.map(func => {
                      const funcRating = character.functions[func.id];
                      return (
                        <tr key={func.id}>
                          <td className="p-1.5 text-lg">{func.emoji}</td>
                          <td className="p-1.5 border-b border-slate-700">
                            <div className="font-bold text-amber-300 text-xs">{func.name}</div>
                            <div className="text-xs text-slate-400">
                              {funcRating >= 0 ? '+' : ''}{funcRating}
                            </div>
                          </td>
                          {ASPECTS.map(aspect => {
                            const attr = ATTRIBUTES.find(a => a.func === func.id && a.aspect === aspect.id);
                            if (!attr) return <td key={aspect.id} className="p-1.5"></td>;
                            const entry = character.attributeDiePools[attr.id];
                            const isSelected = selectedAttribute === attr.id;
                            const gscale = getScaleForPool(entry.pool, 'green');
                            const yscale = getScaleForPool(entry.pool, 'yellow');
                            const scale = getScaleForPool(entry.pool, 'orange');
                            const rscale = getScaleForPool(entry.pool, 'red');
                            return (
                              <td 
                                key={aspect.id} 
                                className={`p-1.5 text-center border-b border-slate-700 cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'bg-amber-500/20 ring-2 ring-amber-500' 
                                    : 'hover:bg-slate-700/50'
                                }`}
                                onClick={() => setSelectedAttribute(isSelected ? null : attr.id)}
                              >
                                <div className={`font-medium text-xs ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                                  {attr.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {gscale !== null && gscale !== undefined ? `×${formatMultiplier(gscale)}` : `R${entry.rank}`}
                                  {'/'}
                                  {yscale !== null && yscale !== undefined ? `${formatMultiplier(yscale)}` : `R${entry.rank}`}
                                  {'/'}
                                  {scale !== null && scale !== undefined ? `${formatMultiplier(scale)}` : `R${entry.rank}`}
                                  {'/'}
                                  {rscale !== null && rscale !== undefined ? `${formatMultiplier(rscale)}` : `R${entry.rank}`}
                                </div>
                                <div className={`text-sm font-bold ${isSelected ? 'text-amber-300' : 'text-cyan-400'}`}>
                                  {entry.pool.notation}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Skills Grid */}
            {character.skills.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-amber-400">Skills</h2>
                  <span className="text-xs text-slate-500">Click to add to roll</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {character.skills.map(skillEntry => {
                    const isSelected = selectedSkill === skillEntry.skillId;
                    const bonus = getSkillModifier(skillEntry.rating) ?? 0;
                    const skill = SKILLS.find(s => s.id === skillEntry.skillId);
                    const displayName = skillEntry.specialty || skill?.name || skillEntry.skillId;
                    const hasSpecialty = Boolean(skillEntry.specialty);
                    
                    return (
                      <div 
                        key={skillEntry.skillId} 
                        className={`rounded p-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-amber-500/20 ring-2 ring-amber-500' 
                            : 'bg-slate-700/50 hover:bg-slate-700'
                        }`}
                        onClick={() => setSelectedSkill(isSelected ? null : skillEntry.skillId)}
                      >
                        <div className={`font-bold text-sm leading-tight ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                          {skill?.emoji && <span className="mr-1">{skill.emoji}</span>}
                          {displayName}
                        </div>
                        {hasSpecialty && skill?.name && (
                          <div className={`text-xs mt-0.5 ${isSelected ? 'text-amber-300/70' : 'text-slate-400'}`}>
                            {skill.name}
                          </div>
                        )}
                        <div className={`text-xs mt-1 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                          {skillEntry.rating} ({bonus >= 0 ? '+' : ''}{bonus}/die)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Weapons Grid */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h2 className="text-base font-bold text-amber-400 mb-3">⚔️ Weapons</h2>
            
            {character.weapons.length === 0 ? (
              <div className="text-center py-4 bg-slate-700/30 rounded">
                <div className="text-slate-500 text-sm">No weapons equipped.</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {character.weapons.map(weapon => (
                  <div key={weapon.id} className="bg-slate-700/50 rounded p-2">
                    <div className="font-medium text-sm text-white mb-1.5">{weapon.name}</div>
                    <div className="text-xs text-slate-400 mb-2">
                      {weapon.category}{weapon.handedness && ` • ${weapon.handedness}`}{weapon.ammo && ` • ${weapon.ammo}`}
                    </div>
                    
                    <div className="space-y-1">
                      {weapon.attacks.map((attack, idx) => {
                        const aspectInfo = ASPECTS.find(a => a.id === attack.aspect);
                        const pen = typeof attack.penetration === 'number' ? attack.penetration : attack.penetration[0];
                        
                        return (
                          <button
                            key={attack.id}
                            onClick={() => goToCombatAsAttacker(weapon.id, idx)}
                            className="w-full flex items-center justify-between bg-red-600/50 hover:bg-red-900/30 border border-slate-600 hover:border-red-500/50 rounded px-2 py-1 text-xs transition-all group"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="flex-shrink-0">{aspectInfo?.emoji}</span>
                              <div className="min-w-0">
                                <div className="text-slate-200 group-hover:text-white truncate">
                                  {attack.type}
                                  {attack.isConditional && <span className="text-amber-400 ml-0.5">⚠️</span>}
                                </div>
                                <div className="text-slate-400 truncate">
                                  {attack.range && `${attack.range} • `}
                                  M{attack.magnitude}{pen > 0 && ` • Pen ${pen}`}
                                </div>
                              </div>
                            </div>
                            <span className="text-slate-500 group-hover:text-red-400 flex-shrink-0 ml-1">⚔️</span>
                          </button>
                        );
                      })}
                    </div>
                    
                    {weapon.notes && weapon.notes.length > 0 && (
                      <div className="mt-1.5 text-xs text-slate-500 truncate" title={weapon.notes.join(' • ')}>
                        {weapon.notes.join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'defense' && (
        <div className="space-y-4">
          {/* Defense Summary */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h2 className="text-base font-bold text-amber-400 mb-3">🛡️ Defense</h2>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="bg-slate-700/50 rounded p-2">
                <div className="text-xs text-slate-400">Material Size</div>
                <div className="text-sm font-bold text-amber-400">
                  {SIZE_OPTIONS.find(s => s.value === character.size)?.label ?? 'Average'}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded p-2">
                <div className="text-xs text-slate-400">Immaterial Size</div>
                <div className="text-sm font-bold text-amber-400">
                  {SIZE_OPTIONS.find(s => s.value === character.immaterialSize)?.label ?? 'Average'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ASPECTS.map(aspect => {
                const defenseAttr = DEFENSE_ATTRIBUTES[aspect.id];
                const diePool = character.attributeDiePools[defenseAttr];
                const isPhysical = aspect.id === 'Form' || aspect.id === 'Flesh';
                const sizeValue = isPhysical ? character.size : character.immaterialSize;

                return (
                  <div key={aspect.id} className="bg-slate-700/50 rounded p-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{aspect.emoji}</span>
                        <span className="font-medium text-white text-sm">{aspect.name}</span>
                      </div>
                      <button
                        onClick={() => goToCombatAsDefender(aspect.id)}
                        className="bg-blue-600/50 hover:bg-blue-900/30 text-white px-2 py-0.5 rounded text-xs font-medium"
                      >
                        🛡️ Defend
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-center text-xs">
                      <div>
                        <div className="text-slate-400">{defenseAttr}</div>
                        <div className="text-cyan-400 font-bold">{diePool.rank}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Size</div>
                        <div className="text-amber-400 font-bold">{sizeValue >= 0 ? '+' : ''}{sizeValue}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Armor */}
          <div className="bg-slate-800 rounded-lg p-3">
            <h2 className="text-base font-bold text-amber-400 mb-3">🛡️ Armor</h2>
            
            {character.armor.length === 0 ? (
              <div className="text-center py-4 bg-slate-700/30 rounded">
                <div className="text-slate-500 text-sm">No armor equipped.</div>
                <div className="text-slate-600 text-xs mt-1">Add armor in the Avatar Builder, then defend with it here.</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {character.armor.map(piece => {
                  const aspectEmojis: Record<ArmorAspect, string> = {
                    Form: '🧱', Flesh: '🧬', Mind: '🧠', Spirit: '🔥'
                  };
                  
                  return (
                    <div key={piece.id} className="bg-slate-700/50 rounded p-2">
                      <div className="font-medium text-sm text-white mb-1">{piece.name}</div>
                      <div className="text-xs text-slate-400 mb-1.5">
                        {piece.aspects.map(a => `${aspectEmojis[a]} ${a}`).join(' • ')}
                        {' • '}Armor {piece.armor}
                      </div>
                      
                      <div className="space-y-1">
                        {piece.aspects.map(aspect => (
                          <button
                            key={aspect}
                            onClick={() => goToCombatAsDefender(aspect, piece.id)}
                            className="w-full flex items-center justify-between bg-blue-600/50 hover:bg-blue-900/30 border border-slate-600 hover:border-blue-500/50 rounded px-2 py-1 text-xs transition-all group"
                          >
                            <span className="text-slate-200 group-hover:text-white">
                              {aspectEmojis[aspect]} Defend {aspect}
                            </span>
                            <span className="text-slate-500 group-hover:text-blue-400">🛡️</span>
                          </button>
                        ))}
                      </div>
                      
                      {piece.location && (
                        <div className="text-xs text-slate-500 mt-1">{piece.location}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reaction Pools */}
          <div className="bg-slate-800 rounded-lg p-3">
            {/* ... reaction pools section unchanged ... */}
          </div>

          {/* Wounds */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-amber-400">🩸 Wounds</h2>
              {gameState.woundPenalty < 0 && (
                <span className="text-xs bg-red-900/30 border border-red-500/50 px-2 py-1 rounded text-red-400">
                  {gameState.woundPenalty}/die penalty
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ASPECTS.map(aspect => {
                const woundLevel = gameState.wounds[aspect.id];
                const woundInfo = WOUND_LABELS[woundLevel];
                const defenseAttr = DEFENSE_ATTRIBUTES[aspect.id];
                const diePool = character.attributeDiePools[defenseAttr];
                const restoration = gameState.restorationPoints[aspect.id];
                const canHeal = wouldHeal(aspect.id);

                return (
                  <div key={aspect.id} className={`bg-slate-700/50 rounded p-2 ${woundLevel > 0 ? 'ring-1 ring-red-500/30' : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{aspect.emoji}</span>
                        <span className="font-medium text-sm">{aspect.name}</span>
                      </div>
                      {woundInfo.emoji && <span className="text-sm">{woundInfo.emoji}</span>}
                    </div>
                    
                    <select
                      value={woundLevel}
                      onChange={(e) => gameState.setWound(aspect.id, parseInt(e.target.value) as WoundLevel)}
                      className="w-full bg-slate-600 border border-slate-500 rounded px-1.5 py-0.5 text-xs mb-1.5"
                    >
                      {Array.from({ length: 9 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? 'None' : `L${i} ${WOUND_LABELS[i as WoundLevel].label}`}
                          {WOUND_PENALTIES[i as WoundLevel] < 0 ? ` (${WOUND_PENALTIES[i as WoundLevel]}/die)` : ''}
                        </option>
                      ))}
                    </select>

                    <div className="text-xs text-slate-400 mb-1.5">
                      {diePool.pool.notation}
                    </div>

                    {woundLevel > 0 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => rollNaturalHealing(aspect.id)}
                          className="flex-1 bg-slate-600 hover:bg-slate-500 text-slate-200 px-1.5 py-1 rounded text-xs"
                        >
                          🎲 Natural
                        </button>
                        <button
                          onClick={() => {
                            setHealModalAspect(aspect.id);
                            setHealPoolRank(5);
                            setHealSkillBonus(0);
                            setHealModifier(0);
                          }}
                          className="flex-1 bg-green-700 hover:bg-green-600 text-white px-1.5 py-1 rounded text-xs"
                        >
                          💚 Aided
                        </button>
                      </div>
                    )}

                    {woundLevel > 0 && (
                      <div className="mt-1.5 text-xs text-center">
                        <span className={canHeal ? 'text-green-400' : 'text-slate-400'}>
                          {restoration}/{woundLevel} pts
                        </span>
                        {canHeal && (
                          <button
                            onClick={() => applyHealing(aspect.id)}
                            className="flex-1 bg-green-700 hover:bg-green-600 text-white px-1.5 py-1 rounded text-xs"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'abilities' && (
        <div className="space-y-4">
          {/* Powers */}
          {character.powers.length > 0 ? (
            <div className="bg-slate-800 rounded-lg p-3">
              <h2 className="text-base font-bold text-amber-400 mb-3">✨ Powers</h2>
              <div className="grid md:grid-cols-2 gap-2">
                {character.powers.map(powerEntry => {
                  const power = POWERS.find(p => p.id === powerEntry.powerId);
                  if (!power) return null;
                  const display = getPowerDisplay(power, powerEntry.points, powerEntry.label, powerEntry.customTitle);
                  return (
                    <div key={powerEntry.id} className="bg-slate-700/50 rounded p-2 text-sm">
                      <div className="font-medium">
                        {power.emoji} {display.title}
                      </div>
                      <div className="text-xs text-slate-400">{display.systemReference}</div>
                      {powerEntry.description && (
                        <div className="text-xs text-slate-500 mt-1">{powerEntry.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg p-3">
              <h2 className="text-base font-bold text-amber-400 mb-3">✨ Powers</h2>
              <div className="text-center py-4 bg-slate-700/30 rounded">
                <div className="text-slate-500 text-sm">No powers acquired.</div>
              </div>
            </div>
          )}

          {/* Skills Detail View (if needed) */}
          {character.skills.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-3">
              <h2 className="text-base font-bold text-amber-400 mb-3">📚 Skills Detail</h2>
              <div className="grid md:grid-cols-2 gap-2">
                {character.skills.map(skillEntry => {
                  const skill = SKILLS.find(s => s.id === skillEntry.skillId);
                  const bonus = getSkillModifier(skillEntry.rating) ?? 0;
                  return (
                    <div key={skillEntry.skillId} className="bg-slate-700/50 rounded p-2">
                      <div className="font-medium text-sm">
                        {skill?.emoji} {skill?.name}
                      </div>
                      <div className="text-xs text-amber-400">{skillEntry.rating} ({bonus >= 0 ? '+' : ''}{bonus}/die)</div>
                      {skill?.description && (
                        <div className="text-xs text-slate-400 mt-1">{skill.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Healing Result Toast */}
      {healResult && (
        <div className="bg-slate-800 rounded-lg p-3 border border-green-500/50">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-slate-400">Healing {healResult.aspect}: </span>
              <span className="text-white font-bold">Rolled {healResult.roll}</span>
              {healResult.successes > 0 ? (
                <span className="text-green-400 ml-2">+{healResult.successes} restoration point{healResult.successes > 1 ? 's' : ''}</span>
              ) : (
                <span className="text-red-400 ml-2">No restoration points</span>
              )}
            </div>
            <button onClick={() => setHealResult(null)} className="text-slate-500 hover:text-slate-300">✕</button>
          </div>
        </div>
      )}

      {/* Healing Modal */}
      {healModalAspect && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setHealModalAspect(null)}>
          <div className="bg-slate-800 rounded-lg p-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-amber-400">
                💚 Aided Healing — {healModalAspect}
              </h3>
              <button onClick={() => setHealModalAspect(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Die Pool Rank</label>
                <select
                  value={healPoolRank}
                  onChange={(e) => setHealPoolRank(parseInt(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm"
                >
                  {DIE_POOL_TABLE.map((entry: DiePoolEntry) => (
                    <option key={entry.rank} value={entry.rank}>
                      {entry.pool.notation} (Rank {entry.rank})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Skill Bonus</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHealSkillBonus(Math.max(-1, healSkillBonus - 1))}
                      className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-sm"
                    >
                      -
                    </button>
                    <span className={`flex-1 text-center font-bold ${healSkillBonus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {healSkillBonus >= 0 ? '+' : ''}{healSkillBonus}
                    </span>
                    <button
                      onClick={() => setHealSkillBonus(Math.min(4, healSkillBonus + 1))}
                      className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Modifier</label>
                  <input
                    type="number"
                    value={healModifier}
                    onChange={(e) => setHealModifier(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-center"
                  />
                </div>
              </div>
              
              <button
                onClick={() => rollAidedHealing(healModalAspect)}
                className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium"
              >
                🎲 Roll Healing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}