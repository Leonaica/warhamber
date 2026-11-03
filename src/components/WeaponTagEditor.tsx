import { useState, useRef, useEffect } from 'react';
import type { WeaponTagDefinition, WeaponTagRef, TagEffect, TagStage, TagKind } from '../types/character';
import { ATTRIBUTES } from '../types/character';
import {
  WEAPON_TAG_CATEGORIES,
  WEAPON_TAG_LIBRARY,
  getTagColor,
  getOrderedCategories,
  mergeTags,
  findTagByLabel,
  resolveTagRef,
  formatTagEffect,
  parseSourceKey,
  defaultBoundsForSource,
  tagSourceAbbr,
  describeTagSource,
  resolveVariableDefault,
  describeEffects,
} from '../data/weaponTags';
import { TagChip } from './TagChip';
import StepperInput from './StepperInput';
import { useTagResolveContext } from '../context/useTagResolveContext'

type EffectOp = 'add' | 'subtract' | 'multiply' | 'set' | 'deny' | 'flag';
type AmountMode = 'number' | 'x' | 'strength' | 'presence' | 'armorValue';
type WhenMode = 'none' | 'raises' | 'allLow' | 'aiming';

interface EffectDraft {
  stage: TagStage;
  op: EffectOp;
  amountMode: AmountMode;
  amountValue: number;
  per: 'flat' | 'success' | 'raise';
  whenMode: WhenMode;
  whenRaises: number;
  note: string;
}

const STAGE_OPTIONS: { value: TagStage; label: string }[] = [
  { value: 'attack', label: 'Attack' },
  { value: 'parry', label: 'Parry' },
  { value: 'damageModifier', label: 'Damage Modifier' },
  { value: 'magnitude', label: 'Magnitude' },
  { value: 'penetration', label: 'Penetration' },
  { value: 'resistance', label: 'Target Resistance' },
  { value: 'raises', label: 'Raises' },
  { value: 'raiseDamage', label: 'Damage per Raise' },
  { value: 'reroll', label: 'Reroll damage' },
  { value: 'override', label: 'Wound level override' },
  { value: 'flag', label: 'Note only' },
];

const OP_LABELS: Record<EffectOp, string> = {
  add: '+ add',
  subtract: '− subtract',
  multiply: '× multiply',
  set: '= set',
  deny: 'deny',
  flag: 'flag',
};

// Mirrors EffectByStage, so an illegal pairing is unreachable from the UI.
const OPS: Record<TagStage, EffectOp[]> = {
  attack: ['add', 'subtract'],
  parry: ['add', 'subtract', 'deny'],
  raises: ['multiply', 'add'],
  raiseDamage: ['set', 'add', 'subtract'],
  magnitude: ['add', 'subtract'],
  penetration: ['add', 'subtract', 'multiply', 'set'],
  resistance: ['add', 'subtract', 'set'],
  armor: ['set'],
  damageModifier: ['add', 'subtract'],
  reroll: ['flag'],
  override: ['set'],
  flag: ['flag'],
};

const newEffectDraft = (): EffectDraft => ({
  stage: 'attack',
  op: 'add',
  amountMode: 'number',
  amountValue: 1,
  per: 'flat',
  whenMode: 'none',
  whenRaises: 1,
  note: '',
});

const hasAmount = (d: EffectDraft) =>
  d.op !== 'deny' && d.stage !== 'flag' && d.stage !== 'reroll' && d.stage !== 'override';

const hasPer = (d: EffectDraft) => hasAmount(d) && (d.op === 'add' || d.op === 'subtract');

function draftToEffect(d: EffectDraft): TagEffect {
  const out: Record<string, unknown> = { stage: d.stage, op: d.op };

  if (hasAmount(d)) {
    out.amount = d.amountMode === 'number' ? d.amountValue : d.amountMode;
    if (d.per !== 'flat') out.per = d.per;
  }
  if (d.stage === 'flag') out.note = d.note.trim();
  if (d.stage === 'override') {
    out.amount = 'deathBlow';
    out.target = 'woundLevel';
    if (d.note.trim()) out.note = d.note.trim();
  }
  if (d.whenMode === 'raises') out.when = { raisesAtLeast: d.whenRaises };
  if (d.whenMode === 'allLow') out.when = { allLow: true };
  if (d.whenMode === 'aiming') out.when = { aiming: true };

  return out as TagEffect;
}

function effectToDraft(e: TagEffect): EffectDraft {
  const d = newEffectDraft();
  d.stage = e.stage;
  d.op = e.op;

  if ('amount' in e && e.amount !== undefined) {
    if (e.amount === 'x') d.amountMode = 'x';
    else if (e.amount === 'strength' || e.amount === 'presence' || e.amount === 'armorValue') d.amountMode = e.amount;
    else if (typeof e.amount === 'number') {
      d.amountMode = 'number';
      d.amountValue = e.amount;
    }
  }
  if ('per' in e && e.per) d.per = e.per;
  if (e.stage === 'flag' || e.note) d.note = e.note ?? '';
  if ('when' in e && e.when) {
    if (e.when.raisesAtLeast !== undefined) {
      d.whenMode = 'raises';
      d.whenRaises = e.when.raisesAtLeast;
    } else if (e.when.allLow) d.whenMode = 'allLow';
    else if (e.when.aiming) d.whenMode = 'aiming';
  }
  return d;
}

// A flavour tag carrying effects is skipped by buildLedger, so derive the kind.
function deriveKind(effects: TagEffect[], secondTest: boolean): TagKind {
  const mechanical = effects.filter(e => e.stage !== 'flag');
  if (mechanical.length === 0) return secondTest ? 'secondTest' : 'narrative';
  return mechanical.some(e => 'when' in e && e.when) ? 'conditional' : 'arithmetic';
}

interface WeaponTagEditorProps {
  tags: WeaponTagRef[];
  customTags?: WeaponTagDefinition[];
  onChange: (tags: WeaponTagRef[]) => void;
  onNewCustomTags: (tags: WeaponTagDefinition[]) => void;
  /** Replace a custom tag definition in place, keeping its id. */
  onUpsertCustomTag: (def: WeaponTagDefinition) => void;
}

interface ResolvedTag {
  ref: WeaponTagRef;
  def: WeaponTagDefinition;
  x?: number;
}

export function WeaponTagEditor({
  tags = [],
  customTags = [],
  onChange,
  onNewCustomTags,
  onUpsertCustomTag,
}: WeaponTagEditorProps) {
  const [activePanel, setActivePanel] = useState<'none' | 'browse' | 'custom'>('none');
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [newCustomTags, setNewCustomTags] = useState<WeaponTagDefinition[]>([]);
  const filterRef = useRef<HTMLInputElement>(null);

  // Custom tag form state
  const [ctLabel, setCtLabel] = useState('');
  const [ctCategory, setCtCategory] = useState<string>('Inherent');
  const [ctCustomCategory, setCtCustomCategory] = useState('');
  const [ctDescription, setCtDescription] = useState('');
  const [ctEffect, setCtEffect] = useState('');
  const [ctHasVariable, setCtHasVariable] = useState(false);
  const [ctVarMin, setCtVarMin] = useState(1);
  const [ctVarMax, setCtVarMax] = useState(4);
  const [ctVarDefault, setCtVarDefault] = useState(1);
  const [ctVarUnit, setCtVarUnit] = useState('');
  const [ctSource, setCtSource] = useState('');
  const [ctSourceLabel, setCtSourceLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ctEffects, setCtEffects] = useState<EffectDraft[]>([]);
  const [ctDefaultActive, setCtDefaultActive] = useState(true);
  const [ctSecondTest, setCtSecondTest] = useState(false);

  useEffect(() => {
    if (activePanel === 'browse' && filterRef.current) {
      filterRef.current.focus();
    }
  }, [activePanel]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Character-derived values for any tag whose variable has a `derivedFrom` source.
  const resolveCtx = useTagResolveContext();

  const allCustomTags = [...customTags, ...newCustomTags];
  const allAvailableTags = mergeTags(WEAPON_TAG_LIBRARY, allCustomTags);

  // Resolve selected refs to { ref, def, x } for rendering
  const selected = tags
    .map((ref): ResolvedTag | null => {
      const resolved = resolveTagRef(ref, allCustomTags, resolveCtx);
      if (!resolved) return null;
      return { ref, def: resolved.def, x: resolved.x };
    })
    .filter((s): s is ResolvedTag => s !== null);

  const selectedTagIds = new Set(tags.map(t => t.tagId));

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.has(tagId)) {
      onChange(tags.filter(t => t.tagId !== tagId));
    } else {
      const def = allAvailableTags.find(t => t.id === tagId);
      const newRef: WeaponTagRef = def?.variable && !def.variable.derivedFrom
         ? { tagId, x: def.variable.default }
         : { tagId };
      onChange([...tags, newRef]);
    }
  };

  const removeTag = (tagId: string) => {
    onChange(tags.filter(t => t.tagId !== tagId));
  };

  const updateX = (tagId: string, x: number | undefined) => {
    onChange(tags.map(t => t.tagId === tagId ? { ...t, x } : t));
  };

  const addEffect = () => setCtEffects(prev => [...prev, newEffectDraft()]);

  const updateEffect = (index: number, patch: Partial<EffectDraft>) => {
    setCtEffects(prev => prev.map((d, i) => {
      if (i !== index) return d;
      const next = { ...d, ...patch };
      if (patch.stage && !OPS[patch.stage].includes(next.op)) {
        next.op = OPS[patch.stage][0];
      }
      return next;
    }));
  };

  const removeEffect = (index: number) =>
    setCtEffects(prev => prev.filter((_, i) => i !== index));

  const handleSaveCustomTag = () => {
    if (!ctLabel.trim()) return;

    const category = ctCategory === '__other__' ? ctCustomCategory.trim() : ctCategory;
    if (!category) return;

    // A label collision only matters against a different quality.
    const existing = findTagByLabel(ctLabel, allCustomTags);
    if (existing && existing.id !== editingId) {
      if (!selectedTagIds.has(existing.id)) {
        toggleTag(existing.id);
      }
      setNotice(`A quality named "${ctLabel}" already exists—selected it for you.`);
      closeCustomForm();
      return;
    }

    const variable = ctHasVariable && ctVarMax >= ctVarMin
      ? {
          min: ctVarMin,
          max: ctVarMax,
          default: Math.max(ctVarMin, Math.min(ctVarMax, ctVarDefault)),
          ...(ctVarUnit.trim() && { unit: ctVarUnit.trim() }),
          ...(ctSource && {
            derivedFrom: parseSourceKey(ctSource),
            sourceLabel: ctSourceLabel.trim() || tagSourceAbbr(parseSourceKey(ctSource)!),
          }),
        }
      : undefined;

    const effects = ctEffects.map(draftToEffect);

    const def: WeaponTagDefinition = {
      id: editingId ?? crypto.randomUUID(),
      label: ctLabel.trim(),
      kind: deriveKind(effects, ctSecondTest),
      category,
      ...(ctDescription.trim() && { description: ctDescription.trim() }),
      ...(ctEffect.trim() && { effect: ctEffect.trim() }),
      ...(effects.length > 0 && { effects }),
      ...(effects.length > 0 && ctDefaultActive && { defaultActive: true }),
      ...(variable && { variable }),
    };

    if (editingId) {
      onUpsertCustomTag(def);
      setNotice(`Updated "${def.label}".`);
    } else {
      const updated = [...newCustomTags, def];
      setNewCustomTags(updated);
      onNewCustomTags(updated);

      const newRef: WeaponTagRef = def.variable && !def.variable.derivedFrom
        ? { tagId: def.id, x: def.variable.default }
        : { tagId: def.id };
      onChange([...tags, newRef]);
    }

    closeCustomForm();
  };

  const resetCustomForm = () => {
    setEditingId(null);
    setCtEffects([]);
    setCtDefaultActive(true);
    setCtSecondTest(false);
    setCtLabel('');
    setCtCategory('Inherent');
    setCtCustomCategory('');
    setCtDescription('');
    setCtEffect('');
    setCtHasVariable(false);
    setCtVarMin(1);
    setCtVarMax(4);
    setCtVarDefault(1);
    setCtVarUnit('');
    setCtSource('');
    setCtSourceLabel('');
  };

  const closeCustomForm = () => {
    resetCustomForm();
    setActivePanel('none');
  };

  const startNewCustomTag = () => {
    resetCustomForm();
    setActivePanel('custom');
  };

  const startEditCustomTag = (def: WeaponTagDefinition) => {
    resetCustomForm();
    setEditingId(def.id);
    setCtLabel(def.label);
    const known = (WEAPON_TAG_CATEGORIES as readonly string[]).includes(def.category);
    setCtCategory(known ? def.category : '__other__');
    setCtCustomCategory(known ? '' : def.category);
    setCtDescription(def.description ?? '');
    setCtEffect(def.effect ?? '');
    setCtEffects((def.effects ?? []).map(effectToDraft));
    setCtDefaultActive(def.defaultActive ?? false);
    setCtSecondTest(def.kind === 'secondTest');
    const v = def.variable;
    setCtHasVariable(!!v);
    if (v) {
      setCtVarMin(v.min);
      setCtVarMax(v.max);
      setCtVarDefault(v.default);
      setCtVarUnit(v.unit ?? '');
      if (v.derivedFrom) {
        setCtSource(v.derivedFrom.kind === 'attributeRank' ? `attr:${v.derivedFrom.attribute}` : v.derivedFrom.kind);
        setCtSourceLabel(v.sourceLabel ?? '');
      }
    }
    setActivePanel('custom');
  };

  // Filter logic
  const filteredTags = filter.trim()
    ? allAvailableTags.filter(t => {
        const text = filter.toLowerCase();
        return (
          t.label.toLowerCase().includes(text) ||
          t.category.toLowerCase().includes(text) ||
          (t.description?.toLowerCase().includes(text) ?? false) ||
          (t.effect?.toLowerCase().includes(text) ?? false)
        );
      })
    : allAvailableTags;

  const categories = getOrderedCategories(filteredTags);

  const previewText = ctEffects.length > 0
    ? describeEffects(ctEffects.map(draftToEffect))
    : undefined;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-700 pb-1">
          Qualities
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setActivePanel(activePanel === 'browse' ? 'none' : 'browse')}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              activePanel === 'browse'
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {activePanel === 'browse' ? '▲ Hide Library' : '▼ Browse Library'}
          </button>
          <button
            onClick={() => (activePanel === 'custom' ? closeCustomForm() : startNewCustomTag())}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              activePanel === 'custom'
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {activePanel === 'custom' ? '▲ Cancel' : '+ New Custom Quality'}
          </button>
        </div>
        {notice && (
          <p className="text-xs text-amber-400">{notice}</p>
        )}
      </div>

      {/* Selected tags */}
      <div className="min-h-[2.5rem] bg-slate-700/30 rounded p-2 flex flex-wrap gap-1.5 items-start">
        {selected.length === 0 ? (
          <span className="text-slate-500 text-sm italic py-0.5">
            No qualities selected
          </span>
        ) : (
          selected.map(({ ref, def, x }) => (
            <div
              key={ref.tagId}
              className="inline-flex items-center gap-1 rounded-full border bg-slate-700/50 border-slate-600 pl-1 pr-0.5 py-0.5"
            >
              <TagChip
                tag={def}
                x={x}
                onRemove={() => removeTag(ref.tagId)}
                size="sm"
              />
              {def.variable && (
                <StepperInput
                  value={x ?? def.variable.default}
                  onValueChange={(val) => updateX(ref.tagId, val)}
                  min={def.variable.min}
                  max={def.variable.max}
                  step={def.variable.step ?? 1}
                  showButtons={false}
                  className="text-xs text-white"
                />
              )}
              {def.variable?.derivedFrom && ref.x !== undefined && (
                <button onClick={() => updateX(ref.tagId, undefined)}
                  title="Reset to character value" className="text-xs text-slate-400 hover:text-white px-1">↻</button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Browse panel */}
      {activePanel === 'browse' && (
        <div className="bg-slate-700/30 rounded p-3 space-y-3">
          <input
            ref={filterRef}
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
            placeholder="Filter qualities by name, category, or effect..."
          />
          {filteredTags.length === 0 ? (
            <p className="text-slate-500 text-sm italic text-center py-2">
              No qualities match "{filter}"
            </p>
          ) : (
            categories.map(cat => {
              const catTags = filteredTags.filter(t => t.category === cat);
              const color = getTagColor(cat);
              return (
                <div key={cat}>
                  <div className={`text-xs font-medium mb-1 ${color.text}`}>
                    {cat}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {catTags.map(tag => {
                      const isSelected = selectedTagIds.has(tag.id);
                      const tagColor = getTagColor(tag.category);
                      const tooltip = [formatTagEffect(tag, resolveVariableDefault(tag, resolveCtx)), tag.description]
                        .filter(Boolean).join(' — ') || tag.label;
                      const isCustom = allCustomTags.some(t => t.id === tag.id);
                      return (
                        <div key={tag.id} className="inline-flex items-center">
                          <button
                            title={tooltip}
                            onClick={() => toggleTag(tag.id)}
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-sm transition-colors ${
                              isSelected
                                ? `${tagColor.selectedBg} ${tagColor.text} ${tagColor.border}`
                                : `bg-slate-800/50 text-slate-400 border-slate-600 hover:bg-slate-700/60 ${tagColor.hover}`
                            }`}
                          >
                            {isSelected && <span className="mr-1">✓</span>}
                            {tag.label}
                            {tag.variable && (
                              <span className="ml-1 text-xs opacity-60">
                                {tag.variable.derivedFrom
                                  ? `(${tag.variable.sourceLabel ?? describeTagSource(tag.variable.derivedFrom)})`
                                  : `(${tag.variable.unit ?? ''}${tag.variable.min}–${tag.variable.unit ?? ''}${tag.variable.max})`}
                              </span>
                            )}
                          </button>
                          {isCustom && (
                            <button
                              onClick={() => startEditCustomTag(tag)}
                              title={`Edit "${tag.label}"`}
                              aria-label={`Edit ${tag.label}`}
                              className="ml-0.5 text-xs text-slate-500 hover:text-amber-400 px-1"
                            >
                              ✎
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Custom tag form */}
      {activePanel === 'custom' && (
        <div className="bg-slate-700/30 rounded p-3 space-y-4">
          {editingId && (
            <p className="text-xs text-amber-400">
              Editing "{ctLabel || 'quality'}". Changes apply when you save the weapon.
            </p>
          )}

          {/* Identity section */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Identity</h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Label *</label>
                <input
                  type="text"
                  value={ctLabel}
                  onChange={e => setCtLabel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                  placeholder="e.g., Crysknife, Sanctified"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category *</label>
                <select
                  value={ctCategory}
                  onChange={e => setCtCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                >
                  {WEAPON_TAG_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__other__">Other...</option>
                </select>
              </div>
            </div>
            {ctCategory === '__other__' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Category</label>
                <input
                  type="text"
                  value={ctCustomCategory}
                  onChange={e => setCtCustomCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                  placeholder="Enter category name"
                />
              </div>
            )}
          </div>

          {/* Mechanics section */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mechanics</h5>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Effect</label>
              <textarea
                value={ctEffect}
                onChange={e => setCtEffect(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                placeholder="Mechanical effect. Use {x} for the variable value, e.g., +{x} damage per Raise"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <textarea
                value={ctDescription}
                onChange={e => setCtDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                placeholder="Lore or narrative description (optional)"
                rows={2}
              />
            </div>

            {/* Variable toggle */}
            <div className="border-t border-slate-600 pt-2 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={ctHasVariable}
                  onChange={e => setCtHasVariable(e.target.checked)}
                />
                Accepts a variable value (X)
              </label>
              {ctHasVariable && (
                <div className="space-y-2">
                  {/* Value source — blank means a fixed number */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Value Source</label>
                    <select
                      value={ctSource}
                      onChange={e => {
                        const key = e.target.value;
                        setCtSource(key);
                        const src = parseSourceKey(key);
                        if (src) {
                          const b = defaultBoundsForSource(src);
                          setCtVarMin(b.min);
                          setCtVarMax(b.max);
                          setCtVarDefault(b.default);
                          setCtSourceLabel(tagSourceAbbr(src));
                        } else {
                          setCtSourceLabel('');
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value="">Fixed value</option>
                      <option value="immaterialSize">Immaterial Size</option>
                      <option value="size">Material Size</option>
                      <option value="surge">Surge</option>
                      <option value="stuff">Stuff</option>
                      <optgroup label="Attribute Rank">
                        {ATTRIBUTES.map(a => (
                          <option key={a.id} value={`attr:${a.id}`}>{a.name} Rank</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Chip prefix — only meaningful for derived sources */}
                  {ctSource && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Label Prefix</label>
                      <input
                        type="text"
                        value={ctSourceLabel}
                        onChange={e => setCtSourceLabel(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                        placeholder="e.g., Str"
                      />
                    </div>
                  )}

                  <div className={`grid gap-2 ${ctSource ? 'grid-cols-3' : 'grid-cols-4'}`}>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {ctSource ? 'Min (bound)' : 'Min'}
                      </label>
                      <input
                        type="number"
                        value={ctVarMin}
                        onChange={e => setCtVarMin(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {ctSource ? 'Max (bound)' : 'Max'}
                      </label>
                      <input
                        type="number"
                        value={ctVarMax}
                        onChange={e => setCtVarMax(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        {ctSource ? 'Fallback' : 'Default'}
                      </label>
                      <input
                        type="number"
                        value={ctVarDefault}
                        onChange={e => setCtVarDefault(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      />
                    </div>
                    {!ctSource && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Unit</label>
                        <input
                          type="text"
                          value={ctVarUnit}
                          onChange={e => setCtVarUnit(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                          placeholder="e.g., d (for dice)"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Effects section */}
          <div className="space-y-2 border-t border-slate-600 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Effects</h5>
              <button
                onClick={addEffect}
                className="text-xs bg-slate-700 hover:bg-slate-600 rounded px-2 py-0.5"
              >
                + Add Effect
              </button>
            </div>
            {ctEffects.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No effects — this quality is flavor only.
              </p>
            ) : (
              <div className="space-y-2">
                {ctEffects.map((d, i) => (
                  <div key={i} className="bg-slate-800/60 rounded p-2 space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <select
                        value={d.stage}
                        onChange={e => updateEffect(i, { stage: e.target.value as TagStage })}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      >
                        {!STAGE_OPTIONS.some(o => o.value === d.stage) && (
                          <option value={d.stage}>{d.stage} (legacy)</option>
                        )}
                        {STAGE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <select
                        value={d.op}
                        onChange={e => updateEffect(i, { op: e.target.value as EffectOp })}
                        disabled={OPS[d.stage].length === 1}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white disabled:opacity-50"
                      >
                        {OPS[d.stage].map(op => (
                          <option key={op} value={op}>{OP_LABELS[op]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeEffect(i)}
                        aria-label="Remove effect"
                        className="text-slate-500 hover:text-red-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>

                    {hasAmount(d) && (
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={d.amountMode}
                          onChange={e => updateEffect(i, { amountMode: e.target.value as AmountMode })}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="number">Fixed</option>
                          <option value="x">X (variable)</option>
                          <option value="strength">Strength Rank</option>
                          <option value="presence">Presence Rank</option>
                          <option value="armorValue">Armor value hit</option>
                        </select>
                        {d.amountMode === 'number' ? (
                          <input
                            type="number"
                            value={d.amountValue}
                            onChange={e => updateEffect(i, { amountValue: parseInt(e.target.value) || 0 })}
                            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                          />
                        ) : (
                          <span className="text-xs text-slate-500 self-center">
                            {d.amountMode === 'x' ? 'Uses the X value' : 'Reads from the character'}
                          </span>
                        )}
                      </div>
                    )}

                    {hasPer(d) && (
                      <select
                        value={d.per}
                        onChange={e => updateEffect(i, { per: e.target.value as EffectDraft['per'] })}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="flat">Once, flat</option>
                        <option value="success">Per success</option>
                        <option value="raise">Per Raise</option>
                      </select>
                    )}

                    {(d.stage === 'flag' || d.stage === 'override') && (
                      <input
                        type="text"
                        value={d.note}
                        onChange={e => updateEffect(i, { note: e.target.value })}
                        placeholder={d.stage === 'flag' ? 'e.g. Target cannot Surge for 1 round' : 'Optional note'}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={d.whenMode}
                        onChange={e => updateEffect(i, { whenMode: e.target.value as WhenMode })}
                        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="none">Always</option>
                        <option value="raises">On N+ Raises</option>
                        <option value="allLow">On all low dice</option>
                        <option value="aiming">When aiming</option>
                      </select>
                      {d.whenMode === 'raises' && (
                        <input
                          type="number"
                          min={1}
                          value={d.whenRaises}
                          onChange={e => updateEffect(i, { whenRaises: parseInt(e.target.value) || 1 })}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {previewText && (
              <p className="text-xs text-slate-400">
                <span className="text-slate-500">Reads as: </span>{previewText}
              </p>
            )}

            {ctEffects.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={ctDefaultActive}
                    onChange={e => setCtDefaultActive(e.target.checked)}
                  />
                  Active by default
                </label>
                {ctEffects.every(e => e.stage === 'flag') && (
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={ctSecondTest}
                      onChange={e => setCtSecondTest(e.target.checked)}
                    />
                    Target makes a test
                  </label>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSaveCustomTag}
            disabled={!ctLabel.trim() || (ctCategory === '__other__' && !ctCustomCategory.trim())}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 px-3 py-1.5 rounded text-sm font-medium"
          >
            {editingId ? 'Save Changes' : 'Create Quality'}
          </button>
        </div>
      )}
    </div>
  );
}