import { useState, useMemo, useEffect } from 'react';
import { useCharacter } from '../context/CharacterContext';
import type { RatingValue, CharacterSkill, Artifact, Ally, PersonalShadow, ArmorAspect, CharacterArmor } from '../types/character';
import { ASPECTS, FUNCTIONS, ATTRIBUTES, RATING_SCALE, RATING_LABELS, SKILL_RATINGS, SIZE_OPTIONS } from '../types/character';
import { SKILLS } from '../data/skills';
import { POWERS } from '../data/powers';
import { getDiePoolEntry } from '../data/diePoolTable';
import { calculateSkillCosts, calculateTotalSkillBonuses, checkPowerPrerequisites, getAttributeTierColor } from '../utils/calculations';
import { CharacterSheet } from '../components/CharacterSheet';
import { IconPicker } from '../components/IconPicker';
import { ICONS, DEFAULT_ICON, type IconEntry } from '../data/icons';
import { WeaponEditor } from '../components/WeaponEditor';
import { ArmorEditor } from '../components/ArmorEditor';
import type { CharacterWeapon } from '../types/character';
import StepperInput from '../components/StepperInput';

export function AvatarBuilderPage() {
  const character = useCharacter();
  
  useEffect(() => {
    document.title = character.name 
      ? `${character.name} — Amberesque` 
      : 'Amberesque';
  }, [character.name]);

  // Keep only local UI state:
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  const renderIcon = (icon: IconEntry) => {
    return icon.library === 'fontawesome' ? (
      <i className={icon.faClass || 'fa-solid fa-user'}></i>
    ) : (
      <span className="ei-icon">{icon.eiChar}</span>
    );
  };

  // Aspect/Function handlers
  const handleAspectChange = (aspectId: string, value: RatingValue) => {
    character.setAspects(prev => ({ ...prev, [aspectId]: value }));
  };

  const handleFunctionChange = (functionId: string, value: RatingValue) => {
    character.setFunctions(prev => ({ ...prev, [functionId]: value }));
  };

  const handleAspectExplanationChange = (aspectId: string, explanation: string) => {
    character.setAspectExplanation(aspectId, explanation);
  };
  
  const handleFunctionExplanationChange = (functionId: string, explanation: string) => {
    character.setFunctionExplanation(functionId, explanation);
  };

  // Skill handlers
  const addSkill = (skillId: string) => {
    if (!character.skills.find(s => s.skillId === skillId)) {
      character.setSkills(prev => [...prev, { skillId: skillId as any, rating: 'Average', specialty: '', specialtyExplanation: '' }]);
    }
  };

  const updateSkill = (skillId: string, updates: Partial<CharacterSkill>) => {
    character.setSkills(prev => prev.map(s => s.skillId === skillId ? { ...s, ...updates } : s));
  };

  const removeSkill = (skillId: string) => {
    character.setSkills(prev => prev.filter(s => s.skillId !== skillId));
  };

  // Power handlers
  const addPower = (powerId: string) => {
    const power = POWERS.find(p => p.id === powerId);
    if (!power) return;
  
    // Only block duplicates for non-repeatable powers
    if (!power.repeatable && character.powers.some(p => p.powerId === powerId)) return;
  
    const defaultPoints = power.levels.length > 0 ? power.levels[0].cost : 0;
    const defaultLabel = power.levels.length > 0 ? power.levels[0].name : power.name;
  
    character.setPowers([...character.powers, {
      id: crypto.randomUUID(),
      powerId,
      points: defaultPoints,
      label: defaultLabel,
      description: '',
    }]);
  };

  const updatePowerDescription = (id: string, description: string) => {
    character.setPowers(character.powers.map(p => p.id === id ? { ...p, description } : p));
  };

  const updatePowerCustomTitle = (id: string, customTitle: string) => {
    character.setPowers(prev => prev.map(p =>
      p.id === id ? { ...p, customTitle: customTitle || undefined } : p
    ));
  };

  const updatePowerPoints = (id: string, points: number) => {
    character.setPowers(character.powers.map(p => {
      if (p.id !== id) return p;
  
      // Find the power definition
      const power = POWERS.find(pow => pow.id === p.powerId);
      if (!power) return { ...p, points };
  
      // Only auto-update label if it's empty or still at a default value
      // For Minor Powers, never auto-update the label when points change
      if (power.id === 'MinorPower') {
        return { ...p, points };
      }
  
      // Check if label is empty or still a default (matches a level name)
      const isDefaultLabel = !p.label || power.levels.some(l => l.name === p.label);
      
      if (isDefaultLabel) {
        // Find the highest affordable level and use its name as label
        const affordableLevel = [...power.levels].reverse().find(l => points >= l.cost);
        const newLabel = affordableLevel?.name || power.levels[0]?.name || power.name;
        return { ...p, points, label: newLabel };
      }
  
      // User has a custom label, keep it
      return { ...p, points };
    }));
  };

  const updatePowerLabel = (id: string, label: string) => {
    character.setPowers(prev => prev.map(p => p.id === id ? { ...p, label } : p));
  };

  const removePower = (id: string) => {
    character.setPowers(prev => prev.filter(p => p.id !== id));
  };

  // Artifact handlers
  const addArtifact = () => {
    character.setArtifacts(prev => [...prev, {
      id: crypto.randomUUID(),
      name: 'New Artifact',
      description: '',
      cost: 0,
      quantity: 1,
    }]);
  };

  const updateArtifact = (id: string, updates: Partial<Artifact>) => {
    character.setArtifacts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeArtifact = (id: string) => {
    character.setArtifacts(prev => prev.filter(a => a.id !== id));
  };

  // Ally handlers
  const addAlly = () => {
    character.setAllies(prev => [...prev, {
      id: crypto.randomUUID(),
      name: 'New Ally',
      description: '',
      cost: 1,
      loyalty: 1,
    }]);
  };

  const updateAlly = (id: string, updates: Partial<Ally>) => {
    character.setAllies(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAlly = (id: string) => {
    character.setAllies(prev => prev.filter(a => a.id !== id));
  };

  // Shadow handlers
  const addShadow = () => {
    character.setPersonalShadows(prev => [...prev, {
      id: crypto.randomUUID(),
      name: 'New Shadow',
      description: '',
      cost: 0,
    }]);
  };

  const handleIconSelect = (icon: IconEntry) => {
    character.setAvatarIcon(icon.code);
  };

  // JSON Save/Load handlers
  const handleSave = () => {
    const json = character.saveCharacter();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name || 'avatar'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        character.loadCharacter(data);
        alert('Character loaded successfully!');
      } catch (error) {
        alert('Failed to load character file. Make sure it\'s a valid JSON save file.');
      }
    };
    input.click();
  };

  const updateShadow = (id: string, updates: Partial<PersonalShadow>) => {
    character.setPersonalShadows(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeShadow = (id: string) => {
    character.setPersonalShadows(prev => prev.filter(s => s.id !== id));
  };

  // Calculate power costs

  const powerCosts = useMemo(() => {
    return character.powers.reduce((sum, cp) => sum + cp.points, 0);
  }, [character.powers]);

  const totalPointsSpent = character.computedCharacter.totalPointsSpent;
  const stuff = character.computedCharacter.stuff;

  // State for editing weapons 
  const [editingWeapon, setEditingWeapon] = useState<CharacterWeapon | null>(null);
  const [showWeaponEditor, setShowWeaponEditor] = useState(false);
    // State for editing armor 
  const [editingArmor, setEditingArmor] = useState<CharacterArmor | null>(null);
  const [showArmorEditor, setShowArmorEditor] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1"></div>
            <h1 className="text-xl font-bold text-amber-400">Avatar Builder</h1>
            <div className="flex-1 flex justify-end"></div>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-sm text-slate-400 mb-1">Character Name</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowIconPicker(true)}
                  className="h-8 bg-slate-700 border border-slate-600 rounded px-3 text-xl hover:bg-slate-600 transition-colors"
                  title="Choose icon"
                >
                  {renderIcon(ICONS.find(i => i.code === character.avatarIcon) || DEFAULT_ICON)}
                </button>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => character.setName(e.target.value)}
                  className="h-8 flex-1 bg-slate-700 border border-slate-600 rounded px-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter name..."
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm text-slate-400 mb-1">Campaign Point Limit</label>
              <StepperInput
                value={character.campaignLimit}
                onValueChange={character.setCampaignLimit}
                min={-120}
                step={10}
                className="text-slate-100"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm text-slate-400 mb-1">Material Size</label>
              <select
                value={character.size}
                onChange={(e) => character.setSize(parseInt(e.target.value))}
                className="h-8 w-full bg-slate-700 border border-slate-600 rounded px-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {SIZE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value >= 0 ? '+' : ''}{opt.value} — {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <label className="block text-sm text-slate-400 mb-1">Pace Multiplier</label>
              <select
                value={character.paceMultiplier}
                onChange={(e) => character.setPaceMultiplier(parseFloat(e.target.value))}
                className="h-8 w-full bg-slate-700 border border-slate-600 rounded px-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={0.25}>0.25x — Crawl</option>
                <option value={0.5}>0.5x — Slow</option>
                <option value={0.75}>0.75x — Below Average</option>
                <option value={1}>1x — Normal</option>
                <option value={1.25}>1.25x — Quick</option>
                <option value={1.5}>1.5x — Fast</option>
                <option value={2}>2x — Very Fast</option>
                <option value={3}>3x — Superhuman</option>
                <option value={4}>4x — Legendary</option>
              </select>
            </div>
            <button
              onClick={handleLoad}
              className="h-8 bg-slate-600 hover:bg-slate-500 text-slate-100 px-4 rounded font-medium transition-colors"
            >
              📂 Load
            </button>
            <button
              onClick={handleSave}
              className="h-8 bg-slate-600 hover:bg-slate-500 text-slate-100 px-4 rounded font-medium transition-colors"
            >
              💾 Save
            </button>
          </div>
        </div>
        {/* Summary Bar */}
        <div className="bg-slate-800/50 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-slate-400">Spent: </span>
                <span className="font-bold text-amber-400">{totalPointsSpent}</span>
                <span className="text-slate-500"> / {character.campaignLimit}</span>
              </div>
              <div>
                <span className="text-slate-400">Stuff: </span>
                <span className={`font-bold ${stuff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stuff >= 0 ? `+${stuff} Good` : `${stuff} Bad`}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Surge: </span>
                <span className="font-bold text-cyan-400">{character.computedCharacter.surge}</span>
              </div>
              <div>
                <span className="text-slate-400">Skill Cap: </span>
                <span className="font-bold text-purple-400">+{character.computedCharacter.skillCap}</span>
              </div>
              <div>
                <span className="text-slate-400">Skill Max: </span>
                <span className="font-bold text-purple-400">{character.computedCharacter.skillMaximum}</span>
              </div>
              <div>
                <span className="text-slate-400">Size: </span>
                <span className="font-bold text-amber-400">
                  {SIZE_OPTIONS.find(s => s.value === character.size)?.label ?? 'Average'}
                  <span className="text-slate-500 font-normal ml-1">
                    ({SIZE_OPTIONS.find(s => s.value === character.size)?.description ?? 'to 200kg'})
                  </span>
                </span>
              </div>
              <div>
                <span className="text-slate-400">Pace: </span>
                <span className="font-bold text-amber-400">
                  {character.pace.walking.mph}/{character.pace.sprinting.mph} mph
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

{/* Main Content */}
<main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Step 1: Aspects, Functions, and Attributes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr] gap-6">
          {/* Aspects */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <span>🧩</span> Aspects <span className="text-slate-500 text-sm font-normal">(What you are)</span>
            </h2>
            <div className="space-y-3">
              {ASPECTS.map(aspect => (
                <div key={aspect.id}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">
                      {aspect.emoji} {aspect.name}
                    </label>
                    <span className="text-xs text-slate-400">
                      {character.aspects[aspect.id] >= 0 ? '+' : ''}{character.aspects[aspect.id]} pts
                    </span>
                  </div>
                  <select
                    value={character.aspects[aspect.id]}
                    onChange={(e) => handleAspectChange(aspect.id, parseInt(e.target.value) as RatingValue)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {RATING_SCALE.map(val => (
                      <option key={val} value={val}>
                        {val >= 0 ? '+' : ''}{val} — {RATING_LABELS[val]}
                      </option>
                    ))}
                  </select>
                  {/* Conditional explanation field for +20 or higher */}
                  {character.aspects[aspect.id] >= 20 && (
                    <div className="mt-2">
                      <label className="block text-xs text-amber-400 mb-1">
                        ⚠️ {RATING_LABELS[character.aspects[aspect.id]]} Explanation Required
                      </label>
                      <textarea
                        value={character.aspectExplanations[aspect.id] || ''}
                        onChange={(e) => handleAspectExplanationChange(aspect.id, e.target.value)}
                        placeholder={`Mythic ${aspect.name} rating! Describe how it manifests.`}
                        className="w-full bg-slate-700/50 border border-amber-500/50 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[60px]"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Aspect Total:</span>
                <span className="font-bold text-amber-400">
                  {Object.values(character.aspects).reduce<number>((sum, v) => sum + v, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Functions */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <span>⚡</span> Functions <span className="text-slate-500 text-sm font-normal">(What you do)</span>
            </h2>
            <div className="space-y-3">
              {FUNCTIONS.map(func => (
                <div key={func.id}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">
                      {func.emoji} {func.name}
                    </label>
                    <span className="text-xs text-slate-400">
                      {character.functions[func.id] >= 0 ? '+' : ''}{character.functions[func.id]} pts
                    </span>
                  </div>
                  <select
                    value={character.functions[func.id]}
                    onChange={(e) => handleFunctionChange(func.id, parseInt(e.target.value) as RatingValue)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {RATING_SCALE.map(val => (
                      <option key={val} value={val}>
                        {val >= 0 ? '+' : ''}{val} — {RATING_LABELS[val]}
                      </option>
                    ))}
                  </select>
                  {/* Conditional explanation field for +20 or higher */}
                  {character.functions[func.id] >= 20 && (
                    <div className="mt-2">
                      <label className="block text-xs text-amber-400 mb-1">
                        ⚠️ {RATING_LABELS[character.functions[func.id]]} Explanation Required
                      </label>
                      <textarea
                        value={character.functionExplanations[func.id] || ''}
                        onChange={(e) => handleFunctionExplanationChange(func.id, e.target.value)}
                        placeholder={`Mythic ${func.name} rating! Describe how it manifests.`}
                        className="w-full bg-slate-700/50 border border-amber-500/50 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[60px]"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Function Total:</span>
                <span className="font-bold text-amber-400">
                  {Object.values(character.functions).reduce<number>((sum, v) => sum + v, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Attributes Grid - 4x4 table */}
          <div className="bg-slate-800 rounded-lg p-4 lg:col-span-2 xl:col-span-1">
            <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <span>📊</span> Attributes <span className="text-slate-500 text-sm font-normal">(Derived = Function + Aspect)</span>
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2"></th>
                    <th className="p-2"></th>
                    {ASPECTS.map(aspect => (
                      <th key={aspect.id} className="p-2 text-center border-b border-slate-600">
                        <div className="font-bold text-amber-300">{aspect.emoji} {aspect.name}</div>
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
                        <td className="p-2 text-xl">{func.emoji}</td>
                        <td className="p-2 border-b border-slate-700">
                          <div className="font-bold text-amber-300">{func.name}</div>
                          <div className="text-xs text-slate-400">
                            {funcRating >= 0 ? '+' : ''}{funcRating}
                          </div>
                        </td>
                        {ASPECTS.map(aspect => {
                          const attr = ATTRIBUTES.find(a => a.func === func.id && a.aspect === aspect.id);
                          if (!attr) return <td key={aspect.id} className="p-2"></td>;
                          const value = funcRating + character.aspects[aspect.id];
                          const entry = getDiePoolEntry(value);
                          return (
                            <td key={aspect.id} className="p-2 text-center border-b border-slate-700">
                              <div className="font-medium text-slate-200">{attr.name}</div>
                              <div className="text-xs text-slate-400">Rank {entry.rank}</div>
                              <div className={`text-xs font-bold ${getAttributeTierColor(value)}`}>{entry.pool.notation}</div>
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
        </section>

        {/* Step 2: Skills */}
        <section className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <span>🎓</span> Skills
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                Cap: <span className="text-purple-400">+{character.computedCharacter.skillCap}</span>
              </span>
              <span className="text-slate-400">
                Used: <span className={calculateTotalSkillBonuses(character.skills) > character.computedCharacter.skillMaximum ? 'text-red-400' : 'text-green-400'}>
                  {calculateTotalSkillBonuses(character.skills)}
                </span> / {character.computedCharacter.skillMaximum}
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addSkill(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value=""
              >
                <option value="">+ Add Skill</option>
                {SKILLS.filter(s => !character.skills.find(cs => cs.skillId === s.id)).map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.emoji} {skill.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {character.skills.length === 0 ? (
            <p className="text-slate-500 text-sm">No skills selected. Add skills using the dropdown above.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {character.skills.map(skillEntry => {
                const skill = SKILLS.find(s => s.id === skillEntry.skillId);
                if (!skill) return null;
                return (
                  <div key={skillEntry.skillId} className="bg-slate-700/50 rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">{skill.emoji} {skill.name}</div>
                        <div className="text-xs text-slate-500">{skill.category}</div>
                      </div>
                      <button
                        onClick={() => removeSkill(skillEntry.skillId)}
                        className="text-slate-500 hover:text-red-400 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{skill.description}</p>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={skillEntry.rating}
                        onChange={(e) => updateSkill(skillEntry.skillId, { rating: e.target.value as any })}
                        className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {SKILL_RATINGS
                          .filter(r => {
                            // Always show current rating (even if now invalid due to attribute changes)
                            if (r.rating === skillEntry.rating) return true;
                            
                            // Filter by skill cap (max modifier allowed for this character)
                            if (r.modifier > character.computedCharacter.skillCap) return false;
                            
                            // Filter by skill maximum (sum of all modifiers must not exceed max)
                            const currentTotal = character.skills.reduce((sum, s) => {
                              const rating = SKILL_RATINGS.find(sr => sr.rating === s.rating);
                              return sum + (rating?.modifier || 0);
                            }, 0);
                            
                            // Remove modifier of current rating, add modifier of new rating
                            const currentRatingModifier = SKILL_RATINGS.find(sr => sr.rating === skillEntry.rating)?.modifier || 0;
                            const projectedTotal = currentTotal - currentRatingModifier + r.modifier;
                            
                            return projectedTotal <= character.computedCharacter.skillMaximum;
                          })
                          .map(r => (
                            <option key={r.rating} value={r.rating}>
                              {r.rating} ({r.modifier >= 0 ? '+' : ''}{r.modifier}/die)
                              {r.cost !== 0 ? ` [${r.cost >= 0 ? '+' : ''}${r.cost} pts]` : ''}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    <textarea
                      value={skillEntry.specialty}
                      onChange={(e) => updateSkill(skillEntry.skillId, { specialty: e.target.value })}
                      placeholder="Specialty..."
                      className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows={1}
                    />
                    <textarea
                      value={skillEntry.specialtyExplanation}
                      onChange={(e) => updateSkill(skillEntry.skillId, { specialtyExplanation: e.target.value })}
                      placeholder="Description..."
                      className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 3: Powers */}
        <section className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <span>✨</span> Powers
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                Total: <span className="text-amber-400 font-bold">{powerCosts}</span> pts
              </span>
            </div>
          </div>

          {/* Add power buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {POWERS.map(power => {
              const prereqResult = checkPowerPrerequisites(
                power,
                character.computedCharacter.attributes,
                character.aspects,
                character.functions,
                character.powers
              );
              const isAlreadyOwned = !power.repeatable && character.powers.some(p => p.powerId === power.id);
              
              return (
                <button
                  key={power.id}
                  onClick={() => addPower(power.id)}
                  disabled={isAlreadyOwned}
                  title={!prereqResult.met ? `Missing: ${prereqResult.unmet.join(', ')}` : isAlreadyOwned ? 'Already owned' : ''}
                  className={`border rounded px-3 py-1 text-sm transition-colors ${
                    isAlreadyOwned
                      ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                      : !prereqResult.met
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 cursor-help'
                        : 'bg-slate-700 hover:bg-slate-600 border-slate-600'
                  }`}
                >
                  {power.emoji} {power.name}
                  
                </button>
              );
            })}
          </div>

          {character.powers.length === 0 ? (
            <p className="text-slate-500 text-sm">No powers selected. Click a power above to add it.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {character.powers.map(powerEntry => {
                const power = POWERS.find(p => p.id === powerEntry.powerId);
                if (!power) return null;
                
                // Check prerequisites
                const prereqResult = checkPowerPrerequisites(
                  power,
                  character.computedCharacter.attributes,
                  character.aspects,
                  character.functions,
                  character.powers,
                  powerEntry.points
                );
                
                const getTier = (pts: number, levels: { cost: number }[], powerId: string) => {
                  // Special handling for Minor Power
                  if (powerId === 'MinorPower') {
                    if (pts < 0) return { name: 'Limitation', color: 'text-red-400' };
                    if (pts === 0) return { name: 'Trivial', color: 'text-slate-400' };
                    return { name: 'Minor', color: 'text-green-400' };
                  }
                  
                  // Standard tier calculation for other powers
                  if (levels.length === 0) return { name: 'Custom', color: 'text-slate-400' };
                  if (levels.length >= 3 && pts >= levels[2].cost) return { name: 'Exalted', color: 'text-purple-400' };
                  if (levels.length >= 2 && pts >= levels[1].cost) return { name: 'Advanced', color: 'text-blue-400' };
                  if (pts >= levels[0].cost) return { name: 'Standard', color: 'text-green-400' };
                  return { name: 'Below Standard', color: 'text-slate-500' };
                };
                const tier = getTier(powerEntry.points, power.levels, power.id);
                
                return (
                  <div key={powerEntry.id} className={`rounded p-3 ${
                    prereqResult.met 
                      ? 'bg-slate-700/50' 
                      : 'bg-red-900/30 border border-red-500/50'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">
                          {power.emoji} {power.name}
                          {!prereqResult.met && <span className="ml-2 text-red-400">⚠️</span>}
                        </div>
                        <div className="text-xs text-slate-500">{power.category}</div>
                      </div>
                      <button
                        onClick={() => removePower(powerEntry.id)}
                        className="text-slate-500 hover:text-red-400 text-sm ml-2"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{power.description}</p>
                    
                    {/* Prerequisites warning */}
                    {!prereqResult.met && (
                      <div className="mb-3 p-2 bg-red-900/30 border border-red-500/30 rounded">
                        <p className="text-xs text-red-400 font-medium">Prerequisites not met:</p>
                        <ul className="text-xs text-red-300 list-disc list-inside">
                          {prereqResult.unmet.map((unmet, idx) => (
                            <li key={idx}>{unmet}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Points</label>
                        {power.id === 'MinorPower' ? (
                          <select
                            value={powerEntry.points}
                            onChange={(e) => updatePowerPoints(powerEntry.id, parseInt(e.target.value))}
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value={-5}>Limitation (-5)</option>
                            <option value={-4}>Limitation (-4)</option>
                            <option value={-3}>Limitation (-3)</option>
                            <option value={-2}>Limitation (-2)</option>
                            <option value={-1}>Limitation (-1)</option>
                            <option value={0}>Trivial (0)</option>
                            <option value={1}>Minor (1)</option>
                            <option value={2}>Minor (2)</option>
                            <option value={3}>Minor (3)</option>
                            <option value={4}>Minor (4)</option>
                            <option value={5}>Minor (5)</option>
                          </select>
                        ) : (
                          <StepperInput
                            value={powerEntry.points}
                            onValueChange={(val) => updatePowerPoints(powerEntry.id, val)}
                            min={0}
                            className="text-slate-100"
                          />
                        )}
                      </div>
                      <div className={`text-sm font-medium ${tier.color}`}>
                        {tier.name}
                      </div>
                    </div>
                    
                    {/* Quick-set buttons based on power's standard levels */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {power.id === 'MinorPower' ? (
                        <>
                          {[-3, 3, 5].map(cost => (
                            <button
                              key={cost}
                              onClick={() => updatePowerPoints(powerEntry.id, cost)}
                              className={`text-xs px-2 py-0.5 rounded ${
                                powerEntry.points === cost
                                  ? 'bg-amber-500 text-slate-900'
                                  : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                              }`}
                            >
                              {cost < 0 ? `Limitation (${cost})` : cost === 0 ? `Trivial (${cost})` : `Minor (+${cost})`}
                            </button>
                          ))}
                        </>
                      ) : (
                        power.levels.map((level, idx) => (
                          <button
                            key={idx}
                            onClick={() => updatePowerPoints(powerEntry.id, level.cost)}
                            className={`text-xs px-2 py-0.5 rounded ${
                              powerEntry.points === level.cost
                                ? 'bg-amber-500 text-slate-900'
                                : 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                            }`}
                          >
                            {level.name} ({level.cost})
                          </button>
                        ))
                      )}
                    </div>
                    
                    {/* Label for this power purchase */}
                    <div className="mt-2">
                      <label className="block text-xs text-slate-400 mb-1">
                        {power.subPowers ? (power.id === 'psionics' ? 'Discipline' : power.id === 'artifice' ? 'Science' : 'Type') : 'Title'}
                      </label>
                      {power.subPowers ? (
                        <div className="space-y-2">
                          {/* Discipline selector */}
                          <select
                            value={powerEntry.label || ''}
                            onChange={(e) => updatePowerLabel(powerEntry.id, e.target.value)}
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="">Select {power.id === 'psionics' ? 'Discipline' : power.id === 'artifice' ? 'Science' : 'Type'}...</option>
                            {power.subPowers.map(sub => (
                              <option 
                                key={sub} 
                                value={sub}
                                disabled={character.powers
                                  .filter(p => p.powerId === power.id && p.id !== powerEntry.id)
                                  .map(p => p.label)
                                  .includes(sub)}
                              >
                                {sub}
                              </option>
                            ))}
                          </select>
                          {/* Custom title field */}
                          <label className="block text-xs text-slate-400 mb-1">
                            {'Title'}
                          </label>
                          <input
                            type="text"
                            value={powerEntry.customTitle || ''}
                            onChange={(e) => updatePowerCustomTitle(powerEntry.id, e.target.value)}
                            placeholder={(() => {
                              const adjective = power.subPowerAdjectives?.[powerEntry.label || ''] || '';
                              const rank = power.levels.find(l => powerEntry.points >= l.cost)?.name || '';
                              if (powerEntry.label && adjective) {
                                if (rank === 'Adept' || rank === '') {
                                  return `${adjective} ${power.practitioner}`;
                                }
                                return `${rank} ${adjective} ${power.practitioner}`;
                              }
                              return 'Custom title';
                            })()}
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={powerEntry.label || ''}
                          onChange={(e) => updatePowerLabel(powerEntry.id, e.target.value)}
                          placeholder={(() => {
                            if (power.id === 'minorPower') {
                              if (powerEntry.points < 0) return 'Limitation';
                              if (powerEntry.points === 0) return 'Trivial';
                              return 'Minor Power';
                            }
                            const affordableLevel = [...power.levels].reverse().find(l => powerEntry.points >= l.cost);
                            return affordableLevel?.name || power.levels[0]?.name || power.name;
                          })()}
                          className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      )}
                    </div>
                    
                    {/* Description of how this power manifests */}
                    <div className="mt-2">
                      <label className="block text-xs text-slate-400 mb-1">Description</label>
                      <textarea
                        value={powerEntry.description || ''}
                        onChange={(e) => updatePowerDescription(powerEntry.id, e.target.value)}
                        placeholder="How does this power manifest for your avatar?"
                        rows={2}
                        className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 4: Artifacts, Constructs, Allies, Shadows */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* Artifacts & Constructs */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <span>💍</span> Artifacts & Constructs
              </h2>
              <button
                onClick={addArtifact}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {character.artifacts.map(artifact => (
                <div key={artifact.id} className="bg-slate-700/50 rounded p-2">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={artifact.name}
                      onChange={(e) => updateArtifact(artifact.id, { name: e.target.value })}
                      className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Artifact name"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">Cost:</span>
                      <StepperInput
                        value={artifact.cost}
                        onValueChange={(val) => updateArtifact(artifact.id, { cost: val })}
                        className="text-slate-100"
                      />
                    </div>
                    <button
                      onClick={() => removeArtifact(artifact.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <span>Qty:</span>
                    <StepperInput
                      value={artifact.quantity}
                      onValueChange={(val) => updateArtifact(artifact.id, { quantity: val })}
                      min={1}
                      className="text-slate-100"
                    />
                    <span>= {artifact.cost * artifact.quantity} pts</span>
                  </div>
                  <textarea
                    value={artifact.description}
                    onChange={(e) => updateArtifact(artifact.id, { description: e.target.value })}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Description..."
                    rows={2}
                  />
                </div>
              ))}
              {character.artifacts.length === 0 && (
                <p className="text-slate-500 text-sm">No artifacts.</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 text-sm">
              <span className="text-slate-400">Total: </span>
              <span className="font-bold text-amber-400">
                {character.artifacts.reduce((sum, a) => sum + a.cost * a.quantity, 0)} pts
              </span>
            </div>
          </div>

          {/* Allies */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <span>🤝</span> Allies & Enemies
              </h2>
              <button
                onClick={addAlly}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {character.allies.map(ally => (
                <div key={ally.id} className="bg-slate-700/50 rounded p-2">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={ally.name}
                      onChange={(e) => updateAlly(ally.id, { name: e.target.value })}
                      className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Name"
                    />
                    <select
                      value={ally.loyalty}
                      onChange={(e) => updateAlly(ally.id, { 
                        loyalty: parseInt(e.target.value),
                        cost: parseInt(e.target.value)
                      })}
                      className="w-24 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value={-6}>-6: Nemesis</option>
                      <option value={-5}>-5</option>
                      <option value={-4}>-4</option>
                      <option value={-3}>-3: Enemy</option>
                      <option value={-2}>-2</option>
                      <option value={-1}>-1: Annoyance</option>
                      <option value={1}>+1: Ally</option>
                      <option value={2}>+2: Friend</option>
                      <option value={3}>+3</option>
                      <option value={4}>+4: Chaos Devotee</option>
                      <option value={5}>+5</option>
                      <option value={6}>+6: Amber Devotee</option>
                    </select>
                    <button
                      onClick={() => removeAlly(ally.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    value={ally.description}
                    onChange={(e) => updateAlly(ally.id, { description: e.target.value })}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Description..."
                    rows={2}
                  />
                </div>
              ))}
              {character.allies.length === 0 && (
                <p className="text-slate-500 text-sm">No allies or enemies.</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 text-sm">
              <span className="text-slate-400">Total: </span>
              <span className={`font-bold ${character.allies.reduce((sum, a) => sum + a.cost, 0) < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                {character.allies.reduce((sum, a) => sum + a.cost, 0)} pts
              </span>
            </div>
          </div>

          {/* Personal Shadows */}
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <span>🌓</span> Personal Shadows
              </h2>
              <button
                onClick={addShadow}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
            {character.personalShadows.map(shadow => (
                <div key={shadow.id} className="bg-slate-700/50 rounded p-2">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={shadow.name}
                      onChange={(e) => updateShadow(shadow.id, { name: e.target.value })}
                      className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Shadow name"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">Cost:</span>
                      <StepperInput
                        value={shadow.cost}
                        onValueChange={(val) => updateShadow(shadow.id, { cost: val })}
                        className="text-slate-100"
                      />
                    </div>
                    <button
                      onClick={() => removeShadow(shadow.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    value={shadow.description}
                    onChange={(e) => updateShadow(shadow.id, { description: e.target.value })}
                    className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Description..."
                    rows={2}
                  />
                </div>
              ))}
              {character.personalShadows.length === 0 && (
                <p className="text-slate-500 text-sm">No personal shadows.</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700 text-sm">
              <span className="text-slate-400">Total: </span>
              <span className="font-bold text-amber-400">
                {character.personalShadows.reduce((sum, s) => sum + s.cost, 0)} pts
              </span>
            </div>
          </div>
        </section>

        {/* Step 5: Equipment */}
        <section className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <h2 className="text-xl font-bold text-amber-400 mb-2">⚔️ Equipment</h2>
            <p className="text-sm text-slate-400 mb-6">
              Define your character's weapons and armor. These will be available during combat.
            </p>

            {/* Weapons */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">Weapons</h3>
                <button
                  onClick={() => {
                    setEditingWeapon(null);
                    setShowWeaponEditor(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded font-medium text-sm"
                >
                  + Add Weapon
                </button>
              </div>

              {character.weapons.length === 0 && !showWeaponEditor && (
                <div className="text-center py-8 bg-slate-700/30 rounded">
                  <div className="text-slate-500 text-sm">No weapons added yet.</div>
                  <div className="text-slate-600 text-xs mt-1">Add weapons to use in combat.</div>
                </div>
              )}

              {character.weapons.map(weapon => (
                <div key={weapon.id} className="bg-slate-700/50 rounded p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{weapon.name}</div>
                      <div className="text-xs text-slate-400">
                        {weapon.category} • {weapon.handedness}
                        {weapon.attacks.length > 0 && ` • ${weapon.attacks.length} attack${weapon.attacks.length > 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingWeapon(weapon);
                          setShowWeaponEditor(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => character.removeWeapon(weapon.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  {/* Attack summary */}
                  {weapon.attacks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {weapon.attacks.map(attack => {
                        const penValue = typeof attack.penetration === 'number' 
                          ? attack.penetration 
                          : Array.isArray(attack.penetration) 
                            ? attack.penetration[0] 
                            : 0;
                        return (
                          <span key={attack.id} className="bg-slate-600 rounded px-2 py-1 text-xs text-slate-300">
                            {ASPECTS.find(a => a.id === attack.aspect)?.emoji} {attack.magnitude} {attack.type}
                            {penValue > 0 && ` (Pen ${attack.penetration})`}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Notes */}
                  {weapon.notes && weapon.notes.length > 0 && (
                    <div className="mt-2 text-xs text-slate-500">
                      {weapon.notes.map((note, i) => (
                        <div key={i}>• {note}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {showWeaponEditor && (
                <div className="mt-4">
                  <WeaponEditor
                    weapon={editingWeapon || undefined}
                    onSave={(weaponData) => {
                      if (editingWeapon) {
                        character.updateWeapon(editingWeapon.id, weaponData);
                      } else {
                        character.addWeapon(weaponData);
                      }
                      setShowWeaponEditor(false);
                      setEditingWeapon(null);
                    }}
                    onCancel={() => {
                      setShowWeaponEditor(false);
                      setEditingWeapon(null);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Armor */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">🛡️ Armor</h3>
                <button
                  onClick={() => {
                    setEditingArmor(null);
                    setShowArmorEditor(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded font-medium text-sm"
                >
                  + Add Armor
                </button>
              </div>

              {/* Summary of total armor per aspect */}
              {character.armor.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-3">
                  {(['Form', 'Flesh', 'Mind', 'Spirit'] as ArmorAspect[]).map(aspect => {
                    const total = character.armor.reduce((sum, a) => 
                      a.aspects.includes(aspect) ? sum + a.armor : sum, 0
                    );
                    const emojis: Record<ArmorAspect, string> = {
                      Form: '🧱', Flesh: '🧬', Mind: '🧠', Spirit: '🔥'
                    };
                    return (
                      <div key={aspect} className="bg-slate-700/50 rounded px-3 py-1.5 text-sm">
                        <span className="text-slate-400">{emojis[aspect]} {aspect}:</span>
                        <span className="ml-1.5 font-bold text-cyan-400">{total}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {character.armor.length === 0 && !showArmorEditor && (
                <div className="text-center py-8 bg-slate-700/30 rounded">
                  <div className="text-slate-500 text-sm">No armor added yet.</div>
                  <div className="text-slate-600 text-xs mt-1">Add armor to reduce damage from attacks.</div>
                </div>
              )}

              {character.armor.map(piece => (
                <div key={piece.id} className="bg-slate-700/50 rounded p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{piece.name}</div>
                      <div className="text-xs text-slate-400">
                        {piece.aspects.map(a => {
                          const emojis: Record<ArmorAspect, string> = {
                            Form: '🧱', Flesh: '🧬', Mind: '🧠', Spirit: '🔥'
                          };
                          return `${emojis[a]} ${a}`;
                        }).join(' • ')}
                        {' • '}Armor {piece.armor}
                        {piece.location && ` • ${piece.location}`}
                      </div>
                      {piece.notes && piece.notes.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          {piece.notes.join(' • ')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingArmor(piece);
                          setShowArmorEditor(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => character.removeArmor(piece.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {showArmorEditor && (
                <div className="mt-4">
                  <ArmorEditor
                    armor={editingArmor || undefined}
                    onSave={(armorData) => {
                      if (editingArmor) {
                        character.updateArmor(editingArmor.id, armorData);
                      } else {
                        character.addArmor(armorData);
                      }
                      setShowArmorEditor(false);
                      setEditingArmor(null);
                    }}
                    onCancel={() => {
                      setShowArmorEditor(false);
                      setEditingArmor(null);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Point Summary */}
        <section className="bg-slate-800 rounded-lg p-4">
          <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <span>📋</span> Point Summary
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 mb-2">Aspects & Functions</div>
              <div className="text-xl font-bold text-amber-400">
                {Object.values(character.aspects).reduce<number>((s, v) => s + v, 0) + Object.values(character.functions).reduce<number>((s, v) => s + v, 0)} pts
              </div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 mb-2">Skills</div>
              <div className="text-xl font-bold text-amber-400">
                {calculateSkillCosts(character.skills)} pts
              </div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 mb-2">Powers</div>
              <div className="text-xl font-bold text-amber-400">
                {powerCosts} pts
              </div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-slate-400 mb-2">Artifacts, Allies, Shadows</div>
              <div className="text-xl font-bold text-amber-400">
                {character.artifacts.reduce((s, a) => s + a.cost * a.quantity, 0) + character.allies.reduce((s, a) => s + a.cost, 0) + character.personalShadows.reduce((s, s2) => s + s2.cost, 0)} pts
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-6">
            <div>
              <span className="text-slate-400">Total Spent: </span>
              <span className="text-2xl font-bold text-amber-400">{totalPointsSpent}</span>
              <span className="text-slate-500"> / {character.campaignLimit}</span>
            </div>
            <div>
              <span className="text-slate-400">Stuff: </span>
              <span className={`text-2xl font-bold ${stuff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stuff >= 0 ? `+${stuff} Good` : `${stuff} Bad`}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Surge: </span>
              <span className="text-2xl font-bold text-cyan-400">{character.computedCharacter.surge}</span>
            </div>
          </div>
        </section>
      </main>
      {/* Print-only character sheet */}
      <CharacterSheet
        name={character.name}
        campaignLimit={character.campaignLimit}
        aspects={character.aspects}
        functions={character.functions}
        skills={character.skills}
        powers={character.powers}
        artifacts={character.artifacts}
        allies={character.allies}
        personalShadows={character.personalShadows}
        stuff={stuff}
        surge={character.computedCharacter.surge}
      />
      {/* Icon Picker Modal */}
      <IconPicker
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={handleIconSelect}
        currentIcon={character.avatarIcon}
      />
    </>
  );
}  