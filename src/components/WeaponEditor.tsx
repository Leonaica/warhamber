import { useState } from 'react';
import type { 
  AspectName, AttackType, WeaponAttack, CharacterWeapon, WeaponCapacity, WeaponCategory, WeaponHandedness, 
  WeaponRange, WeaponReloadTime, WeaponTagDefinition, WeaponTagRef } from '../types/character';
import { ASPECTS, ATTACK_TYPES_BY_ASPECT, WEAPON_RANGES, getAttackTypesForAspect } from '../types/character';
import { DAMAGE_MAGNITUDE_TABLE, type DamageMagnitudeEntry } from '../data/damageTable';
import { WEAPON_CAPACITY_OPTIONS, WEAPON_CATEGORY_GROUPS, WEAPON_RELOAD_TIME_OPTIONS, 
  DEFAULT_ATTACK_BY_CATEGORY, DEFAULT_HANDEDNESS_BY_CATEGORY, 
  ATTACK_TYPE_LABELS} from '../data/weaponData';
import StepperInput from './StepperInput';
import { WeaponTagEditor } from './WeaponTagEditor';
import { normalizeTagRefs, idsToRefs } from '../data/weaponTags';

const RANGED_CATEGORIES: WeaponCategory[] = ['Pistol', 'Ranged', 'Heavy', 'Mounted'];

interface WeaponEditorProps {
  weapon?: CharacterWeapon;
  customTags: WeaponTagDefinition[];
  onSave: (weapon: Omit<CharacterWeapon, 'id'>, newCustomTags: WeaponTagDefinition[]) => void;
  onCancel: () => void;
}

export function WeaponEditor({ weapon, customTags, onSave, onCancel }: WeaponEditorProps) {
  const initialCategory = (weapon?.category as WeaponCategory) || 'Melee';
  const [name, setName] = useState(weapon?.name || '');
  const [category, setCategory] = useState<WeaponCategory>(initialCategory);
  const [handedness, setHandedness] = useState<WeaponHandedness>(
    (weapon?.handedness as WeaponHandedness) || DEFAULT_HANDEDNESS_BY_CATEGORY[initialCategory]
  );
  const [attacks, setAttacks] = useState<WeaponAttack[]>(weapon?.attacks || []);
  const [capacityMin, setCapacityMin] = useState<WeaponCapacity | ''>(weapon?.capacity?.min || '');
  const [capacityMax, setCapacityMax] = useState<WeaponCapacity | ''>(weapon?.capacity?.max || '');
  const [reloadTime, setReloadTime] = useState<WeaponReloadTime | ''>(weapon?.reloadTime || '');
  const [ammoExpanded, setAmmoExpanded] = useState<boolean>(
    RANGED_CATEGORIES.includes(initialCategory) || !!(weapon?.capacity || weapon?.reloadTime)
  );
  const [tags, setTags] = useState<WeaponTagRef[]>(() => {
    if (weapon?.tags) return normalizeTagRefs(weapon.tags, customTags);
    if (weapon?.tagIds) return idsToRefs(weapon.tagIds);
    return [];
  });
  const [newCustomTags, setNewCustomTags] = useState<WeaponTagDefinition[]>(() =>
    (customTags || []).filter(ct => tags.some(t => t.tagId === ct.id))
  );

  const hasAmmoValues = !!(capacityMin || reloadTime);

  const handleCategoryChange = (newCategory: WeaponCategory) => {
    setCategory(newCategory);
    setHandedness(DEFAULT_HANDEDNESS_BY_CATEGORY[newCategory]);
    if (!hasAmmoValues) {
      setAmmoExpanded(RANGED_CATEGORIES.includes(newCategory));
    }
  };

  const addAttack = () => {
    const id = crypto.randomUUID();
    const defaultRange: WeaponRange = ['Melee', 'Thrown', 'Unarmed', 'Natural'].includes(category)
      ? 'Close' : 'Short';
    const defaults = DEFAULT_ATTACK_BY_CATEGORY[category];
    const newAttack: WeaponAttack = {
      id,
      aspect: defaults.aspect,
      type: defaults.type,
      magnitude: 3,
      penetration: 0,
      range: defaultRange,
    };
    setAttacks([...attacks, newAttack]);
  };

  const updateAttack = (id: string, updates: Partial<WeaponAttack>) => {
    setAttacks(attacks.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAttack = (id: string) => {
    setAttacks(attacks.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const capacity = capacityMin
      ? {
          min: capacityMin,
          ...(capacityMax && capacityMax !== capacityMin ? { max: capacityMax } : {})
        }
      : undefined;
    onSave({
      name: name.trim(),
      category,
      handedness,
      attacks,
      capacity,
      reloadTime: reloadTime || undefined,
      tags: normalizeTagRefs(tags, [...customTags, ...newCustomTags]),
    }, newCustomTags);
  };

  const capacityMinIndex = WEAPON_CAPACITY_OPTIONS.findIndex(c => c.value === capacityMin);
  const validMaxOptions = capacityMinIndex >= 0
    ? WEAPON_CAPACITY_OPTIONS.filter((_, i) => i > capacityMinIndex)
    : [];

  const canSave = name.trim() && attacks.length > 0;

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div className="bg-slate-700/30 rounded p-3 text-xs space-y-1">
        <div className="text-white font-medium text-sm">{name || 'Unnamed Weapon'}</div>
        <div className="text-slate-400">{category} • {handedness}</div>
        {attacks.length > 0 && (
          <div className="space-y-0.5 pt-1">
            {attacks.map(a => (
              <div key={a.id} className="text-slate-400">
                {ASPECTS.find(s => s.id === a.aspect)?.emoji} {a.type} · Mag {a.magnitude}
                {typeof a.penetration === 'number' && a.penetration > 0 && ` · Pen ${a.penetration}`}
              </div>
            ))}
          </div>
        )}
        {hasAmmoValues && (
          <div className="text-slate-500 pt-1">
            {capacityMin && `Cap: ${capacityMin}${capacityMax ? `–${capacityMax}` : ''}`}
            {capacityMin && reloadTime && ' · '}
            {reloadTime && `Reload: ${reloadTime}`}
          </div>
        )}
        {tags.length > 0 && (
          <div className="text-slate-500">{tags.length} qualit{tags.length === 1 ? 'y' : 'ies'}</div>
        )}
      </div>

      {/* Section: Basics */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-700 pb-1">
          Basics
        </h4>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Weapon Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            placeholder="e.g., Longsword, .38 Special, Mind Blast"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as WeaponCategory)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              {Object.entries(WEAPON_CATEGORY_GROUPS).map(([group, cats]) => (
                <optgroup key={group} label={group}>
                  {cats.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Handedness</label>
            <select
              value={handedness}
              onChange={(e) => setHandedness(e.target.value as WeaponHandedness)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="One-handed">One-handed</option>
              <option value="Two-handed">Two-handed</option>
              <option value="Hands free">Hands-free</option>
              <option value="Extra limb">Extra limb</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section: Ammunition (foldable) */}
      <div className="space-y-3">
        <button
          onClick={() => setAmmoExpanded(!ammoExpanded)}
          className="flex items-center gap-2 w-full text-left border-b border-slate-700 pb-1"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Ammunition
          </span>
          {!ammoExpanded && hasAmmoValues && (
            <span className="text-amber-400 text-xs">•</span>
          )}
          <span className="text-slate-500 text-xs ml-auto">{ammoExpanded ? '▼' : '▶'}</span>
        </button>

        {ammoExpanded && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Ammo Capacity</label>
              <div className="flex gap-2 items-center">
                <select
                  value={capacityMin}
                  onChange={(e) => {
                    setCapacityMin(e.target.value as WeaponCapacity | '');
                    setCapacityMax('');
                  }}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="">— None —</option>
                  {WEAPON_CAPACITY_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {capacityMin && validMaxOptions.length > 0 && (
                  <>
                    <span className="text-slate-400 text-sm">to</span>
                    <select
                      value={capacityMax}
                      onChange={(e) => setCapacityMax(e.target.value as WeaponCapacity | '')}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    >
                      <option value="">— (single) —</option>
                      {validMaxOptions.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              {capacityMin && (
                <p className="text-xs text-slate-500 mt-1">
                  {WEAPON_CAPACITY_OPTIONS.find(c => c.value === capacityMin)?.description}
                  {capacityMax && (
                    <> · to {WEAPON_CAPACITY_OPTIONS.find(c => c.value === capacityMax)?.description}</>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Reload Time</label>
              <select
                value={reloadTime}
                onChange={(e) => setReloadTime(e.target.value as WeaponReloadTime | '')}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="">— None —</option>
                {WEAPON_RELOAD_TIME_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {reloadTime && (
                <p className="text-xs text-slate-500 mt-1">
                  {WEAPON_RELOAD_TIME_OPTIONS.find(r => r.value === reloadTime)?.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section: Attack Modes */}
      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-slate-700 pb-1">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Attack Modes
          </h4>
          <button
            onClick={addAttack}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1 rounded text-sm font-medium"
          >
            + Add Attack
          </button>
        </div>

        {attacks.length === 0 && (
          <div className="text-slate-500 text-sm italic text-center py-4 bg-slate-700/30 rounded">
            No attacks defined. Add at least one attack mode.
          </div>
        )}

        {attacks.map((attack) => (
          <div key={attack.id} className="bg-slate-700/50 rounded p-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-white">
                {ASPECTS.find(a => a.id === attack.aspect)?.emoji} {attack.aspect} · {attack.type} · Mag {attack.magnitude}
              </span>
              <button
                onClick={() => removeAttack(attack.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start">
              {/* Aspect */}
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 mb-1">Aspect</label>
                <select
                  value={attack.aspect}
                  onChange={(e) => {
                    const newAspect = e.target.value as AspectName;
                    const validTypes = ATTACK_TYPES_BY_ASPECT[newAspect];
                    const currentTypeValid = validTypes.includes(attack.type);
                    updateAttack(attack.id, {
                      aspect: newAspect,
                      ...(currentTypeValid ? {} : { type: validTypes[0] as AttackType }),
                    });
                  }}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {ASPECTS.map(a => (
                    <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
                  ))}
                </select>
              </div>

              {/* Attack Type */}
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select
                  value={attack.type}
                  onChange={(e) => updateAttack(attack.id, { type: e.target.value as AttackType })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {getAttackTypesForAspect(attack.aspect).map(t => (
                    <option key={t} value={t} title={ATTACK_TYPE_LABELS[t]}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Magnitude */}
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 mb-1">Magnitude</label>
                <select
                  value={attack.magnitude}
                  onChange={(e) => updateAttack(attack.id, { magnitude: parseInt(e.target.value) })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {DAMAGE_MAGNITUDE_TABLE.map((m: DamageMagnitudeEntry) => (
                    <option key={m.magnitude} value={m.magnitude}>
                      {m.magnitude} — {m.label} ({m.pool.notation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Penetration */}
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 mb-1">Penetration</label>
                <StepperInput
                  value={typeof attack.penetration === 'number' ? attack.penetration : attack.penetration[0]}
                  onValueChange={(val) => updateAttack(attack.id, { penetration: val })}
                  min={0}
                  max={224}
                  className="text-sm"
                  buttonClassName="bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded text-sm"
                />
              </div>

              {/* Range */}
              <div className="min-w-0">
                <label className="block text-xs text-slate-400 mb-1">Range</label>
                <select
                  value={attack.range}
                  onChange={(e) => updateAttack(attack.id, { range: e.target.value as WeaponRange })}
                  title={WEAPON_RANGES.find(r => r.value === attack.range)?.description}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {WEAPON_RANGES.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.step} — {r.label} ({r.distance})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional */}
            <div className="mt-3">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={attack.isConditional || false}
                  onChange={(e) => updateAttack(attack.id, { isConditional: e.target.checked })}
                  className="rounded"
                />
                Conditional attack
              </label>
              {attack.isConditional && (
                <input
                  type="text"
                  value={attack.condition || ''}
                  onChange={(e) => updateAttack(attack.id, { condition: e.target.value })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm mt-1"
                  placeholder="Condition description"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Section: Qualities (rendered by WeaponTagEditor with its own header) */}
      <WeaponTagEditor
        tags={tags}
        customTags={customTags}
        onChange={setTags}
        onNewCustomTags={setNewCustomTags}
      />

      {/* Validation feedback */}
      {!canSave && (
        <p className="text-xs text-slate-500 text-center">
          {!name.trim() ? 'Enter a weapon name to save' : 'Add at least one attack mode to save'}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 py-2 rounded font-medium transition-colors"
        >
          {weapon ? 'Update Weapon' : 'Add Weapon'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}