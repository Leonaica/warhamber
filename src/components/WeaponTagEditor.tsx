import { useState, useRef, useEffect } from 'react';
import type { WeaponTagDefinition, WeaponTagRef } from '../types/character';
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
} from '../data/weaponTags';
import { TagChip } from './TagChip';
import StepperInput from './StepperInput';
import { useTagResolveContext } from '../context/useTagResolveContext'

interface WeaponTagEditorProps {
  tags: WeaponTagRef[];
  customTags?: WeaponTagDefinition[];
  onChange: (tags: WeaponTagRef[]) => void;
  onNewCustomTags: (tags: WeaponTagDefinition[]) => void;
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

  const handleCreateCustomTag = () => {
    if (!ctLabel.trim()) return;

    const category = ctCategory === '__other__' ? ctCustomCategory.trim() : ctCategory;
    if (!category) return;

    // Dedup by label
    const existing = findTagByLabel(ctLabel, allCustomTags);
    if (existing) {
      if (!selectedTagIds.has(existing.id)) {
        toggleTag(existing.id);
      }
      setNotice(`A quality named "${ctLabel}" already exists—selected it for you.`);
      resetCustomForm();
      return;
    }

    const newTag: WeaponTagDefinition = {
      id: crypto.randomUUID(),
      label: ctLabel.trim(),
      kind: 'flavor',
      category,
      ...(ctDescription.trim() && { description: ctDescription.trim() }),
      ...(ctEffect.trim() && { effect: ctEffect.trim() }),
      ...(ctHasVariable && ctVarMax >= ctVarMin && {
        variable: {
          min: ctVarMin,
          max: ctVarMax,
          default: Math.max(ctVarMin, Math.min(ctVarMax, ctVarDefault)),
          ...(ctVarUnit.trim() && { unit: ctVarUnit.trim() }),
          ...(ctSource && {
            derivedFrom: parseSourceKey(ctSource),
            sourceLabel: ctSourceLabel.trim() || tagSourceAbbr(parseSourceKey(ctSource)!),
          }),
        },
      }),
    };

    const updated = [...newCustomTags, newTag];
    setNewCustomTags(updated);
    onNewCustomTags(updated);

    const newRef: WeaponTagRef = newTag.variable && !newTag.variable.derivedFrom
      ? { tagId: newTag.id, x: newTag.variable.default }
      : { tagId: newTag.id };
    onChange([...tags, newRef]);

    resetCustomForm();
  };

  const resetCustomForm = () => {
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
    setActivePanel('none');
    setCtSource(''); 
    setCtSourceLabel('');

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
            onClick={() => setActivePanel(activePanel === 'custom' ? 'none' : 'custom')}
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
                      return (
                        <button
                          key={tag.id}
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

          <button
            onClick={handleCreateCustomTag}
            disabled={!ctLabel.trim() || (ctCategory === '__other__' && !ctCustomCategory.trim())}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 px-3 py-1.5 rounded text-sm font-medium"
          >
            Create Quality
          </button>
        </div>
      )}
    </div>
  );
}