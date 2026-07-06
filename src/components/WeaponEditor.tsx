import { useState } from 'react';
import type { AspectName, AttackType, WeaponAttack, CharacterWeapon, WeaponCapacity, WeaponCategory, WeaponHandedness, WeaponRange, WeaponReloadTime } from '../types/character';
import { ASPECTS, ATTACK_TYPES_BY_ASPECT, WEAPON_RANGES, getMechanismGroupsForAspect } from '../types/character';
import { DAMAGE_MAGNITUDE_TABLE, type DamageMagnitudeEntry } from '../data/damageTable';
import { WEAPON_CAPACITY_OPTIONS, WEAPON_CATEGORY_GROUPS, WEAPON_RELOAD_TIME_OPTIONS, DEFAULT_ATTACK_BY_CATEGORY, DEFAULT_HANDEDNESS_BY_CATEGORY, MECHANISM_LABELS } from '../data/weaponData';
import StepperInput from './StepperInput';

interface WeaponEditorProps {
  weapon?: CharacterWeapon;
  onSave: (weapon: Omit<CharacterWeapon, 'id'>) => void;
  onCancel: () => void;
}

export function WeaponEditor({ weapon, onSave, onCancel }: WeaponEditorProps) {
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
  const [notes, setNotes] = useState<string[]>(weapon?.notes || []);
  const [newNote, setNewNote] = useState('');

  const handleCategoryChange = (newCategory: WeaponCategory) => {
    setCategory(newCategory);
    setHandedness(DEFAULT_HANDEDNESS_BY_CATEGORY[newCategory]);
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

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote('');
    }
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
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
      notes: notes.length > 0 ? notes : undefined,
    });
  };

  const capacityMinIndex = WEAPON_CAPACITY_OPTIONS.findIndex(c => c.value === capacityMin);
  const validMaxOptions = capacityMinIndex >= 0
    ? WEAPON_CAPACITY_OPTIONS.filter((_, i) => i > capacityMinIndex)
    : [];

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-bold text-amber-400">
        {weapon ? 'Edit Weapon' : 'Add Weapon'}
      </h3>

      {/* Name */}
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

      {/* Category and Handedness */}
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
          </select>
        </div>
      </div>

      {/* Capacity and Reload Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Capacity</label>
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

      {/* Attacks */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-slate-400">Attack Modes</label>
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
          <div key={attack.id} className="bg-slate-700/50 rounded p-3 mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">
                {ASPECTS.find(a => a.id === attack.aspect)?.emoji} {attack.aspect} Attack
              </span>
              <button
                onClick={() => removeAttack(attack.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-2 items-end">
              {/* Aspect */}
              <div className="min-w-[130px] flex-1">
                <label className="block text-xs text-slate-400 mb-1">Aspect</label>
                <select
                  value={attack.aspect}
                  onChange={(e) => {
                    const newAspect = e.target.value as AspectName;
                    updateAttack(attack.id, {
                      aspect: newAspect,
                      type: ATTACK_TYPES_BY_ASPECT[newAspect][0] as AttackType,
                    });
                  }}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {ASPECTS.map(a => (
                    <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
                  ))}
                </select>
              </div>

              {/* Attack Type - Grouped by Mechanism */}
              <div className="min-w-[160px] flex-1">
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select
                  value={attack.type}
                  onChange={(e) => updateAttack(attack.id, { type: e.target.value as AttackType })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {Object.entries(getMechanismGroupsForAspect(attack.aspect)).map(([mechanism, types]) => (
                    <optgroup key={mechanism} label={MECHANISM_LABELS[mechanism]}>
                      {(types as string[]).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Magnitude */}
              <div className="min-w-[150px] flex-1">
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
              <div className="min-w-[120px]">
                <label className="block text-xs text-slate-400 mb-1">Penetration</label>
                <StepperInput
                  value={typeof attack.penetration === 'number' ? attack.penetration : attack.penetration[0]}
                  onValueChange={(val) => updateAttack(attack.id, { penetration: val })}
                  min={0}
                  max={100}
                  className="text-sm"
                  buttonClassName="bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded text-sm"
                />
              </div>

              {/* Range */}
              <div className="min-w-[150px] flex-1">
                <label className="block text-xs text-slate-400 mb-1">Range</label>
                <select
                  value={attack.range}
                  onChange={(e) => updateAttack(attack.id, { range: e.target.value as WeaponRange })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {WEAPON_RANGES.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional */}
            <div className="mt-2">
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

      {/* Special Notes */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Special Notes</label>
        <p className="text-xs text-slate-500 mb-2">
          Mechanical effects (e.g., "+2 Bonus to aim") or narrative details (e.g., "Power field: destroys parried weapon 3 times in 4")
        </p>
        {notes.map((note, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <span className="text-sm text-slate-300 flex-1">• {note}</span>
            <button
              onClick={() => removeNote(index)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              ×
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
            placeholder="Add a special note..."
          />
          <button
            onClick={addNote}
            className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!name.trim() || attacks.length === 0}
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