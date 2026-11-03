#!/usr/bin/env python3
"""s71 - allow editing an existing custom quality."""
import sys
from pathlib import Path

def bail(msg):
    print(f"FAIL {msg}")
    sys.exit(1)

def patch(rel, pairs):
    p = Path(rel)
    text = p.read_text()
    for old, new, label, count in pairs:
        n = text.count(old)
        if n != count:
            bail(f"{rel} / {label}: expected {count}, found {n}")
        text = text.replace(old, new)
        print(f"ok   {rel} / {label}")
    p.write_text(text)

# ============ WeaponTagEditor.tsx ============
patch('src/components/WeaponTagEditor.tsx', [
("""interface WeaponTagEditorProps {
  tags: WeaponTagRef[];
  customTags?: WeaponTagDefinition[];
  onChange: (tags: WeaponTagRef[]) => void;
  onNewCustomTags: (tags: WeaponTagDefinition[]) => void;
}""",
"""interface WeaponTagEditorProps {
  tags: WeaponTagRef[];
  customTags?: WeaponTagDefinition[];
  onChange: (tags: WeaponTagRef[]) => void;
  onNewCustomTags: (tags: WeaponTagDefinition[]) => void;
  /** Replace a custom tag definition in place, keeping its id. */
  onUpsertCustomTag: (def: WeaponTagDefinition) => void;
}""", 'props', 1),

("""  onChange,
  onNewCustomTags,
}: WeaponTagEditorProps) {""",
"""  onChange,
  onNewCustomTags,
  onUpsertCustomTag,
}: WeaponTagEditorProps) {""", 'destructure', 1),

("  const [ctSourceLabel, setCtSourceLabel] = useState('');",
 """  const [ctSourceLabel, setCtSourceLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);""",
 'editingId state', 1),

("""  const resetCustomForm = () => {
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

  };""",
"""  const resetCustomForm = () => {
    setEditingId(null);
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
  };""", 'form helpers', 1),

("""  const handleCreateCustomTag = () => {
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
  };""",
"""  const handleSaveCustomTag = () => {
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

    const def: WeaponTagDefinition = {
      id: editingId ?? crypto.randomUUID(),
      label: ctLabel.trim(),
      kind: 'flavor',
      category,
      ...(ctDescription.trim() && { description: ctDescription.trim() }),
      ...(ctEffect.trim() && { effect: ctEffect.trim() }),
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
  };""", 'save handler', 1),

("            onClick={() => setActivePanel(activePanel === 'custom' ? 'none' : 'custom')}",
 "            onClick={() => (activePanel === 'custom' ? closeCustomForm() : startNewCustomTag())}",
 'panel toggle', 1),

("""                      return (
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
                      );""",
"""                      const isCustom = allCustomTags.some(t => t.id === tag.id);
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
                      );""", 'browse row', 1),

("""          {/* Identity section */}""",
"""          {editingId && (
            <p className="text-xs text-amber-400">
              Editing "{ctLabel || 'quality'}". Changes apply when you save the weapon.
            </p>
          )}

          {/* Identity section */}""", 'editing banner', 1),

("""            onClick={handleCreateCustomTag}
            disabled={!ctLabel.trim() || (ctCategory === '__other__' && !ctCustomCategory.trim())}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 px-3 py-1.5 rounded text-sm font-medium"
          >
            Create Quality
          </button>""",
"""            onClick={handleSaveCustomTag}
            disabled={!ctLabel.trim() || (ctCategory === '__other__' && !ctCustomCategory.trim())}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 px-3 py-1.5 rounded text-sm font-medium"
          >
            {editingId ? 'Save Changes' : 'Create Quality'}
          </button>""", 'submit button', 1),
])

# ============ WeaponEditor.tsx ============
patch('src/components/WeaponEditor.tsx', [
("import { useState } from 'react';", "import { useMemo, useState } from 'react';", 'import', 1),

("""  const [newCustomTags, setNewCustomTags] = useState<WeaponTagDefinition[]>(() =>
    (customTags || []).filter(ct => tags.some(t => t.tagId === ct.id))
  );""",
"""  const [newCustomTags, setNewCustomTags] = useState<WeaponTagDefinition[]>(() =>
    (customTags || []).filter(ct => tags.some(t => t.tagId === ct.id))
  );

  // Edits to already-saved custom tags, held until the weapon is saved so that
  // Cancel on the modal discards them along with everything else.
  const [editedCustomTags, setEditedCustomTags] = useState<WeaponTagDefinition[]>([]);

  const upsertCustomTag = (def: WeaponTagDefinition) => {
    if (newCustomTags.some(t => t.id === def.id)) {
      setNewCustomTags(prev => prev.map(t => t.id === def.id ? def : t));
      return;
    }
    setEditedCustomTags(prev => [...prev.filter(t => t.id !== def.id), def]);
  };

  const effectiveCustomTags = useMemo(() => {
    if (editedCustomTags.length === 0) return customTags;
    const overrides = new Map(editedCustomTags.map(t => [t.id, t]));
    return customTags.map(t => overrides.get(t.id) ?? t);
  }, [customTags, editedCustomTags]);""", 'draft overlay', 1),

("""      tags: normalizeTagRefs(tags, [...customTags, ...newCustomTags]),
    }, newCustomTags);""",
"""      tags: normalizeTagRefs(tags, [...effectiveCustomTags, ...newCustomTags]),
    }, [...editedCustomTags, ...newCustomTags]);""", 'handleSave flush', 1),

("""      <WeaponTagEditor
        tags={tags}
        customTags={customTags}
        onChange={setTags}
        onNewCustomTags={setNewCustomTags}
      />""",
"""      <WeaponTagEditor
        tags={tags}
        customTags={effectiveCustomTags}
        onChange={setTags}
        onNewCustomTags={setNewCustomTags}
        onUpsertCustomTag={upsertCustomTag}
      />""", 'call site', 1),
])

# ============ AvatarBuilderPage.tsx ============
patch('src/pages/AvatarBuilderPage.tsx', [
("""                          character.setCustomTags(prev => {
                            const known = new Set(prev.map(t => t.id));
                            return [...prev, ...newCustomTags.filter(t => !known.has(t.id))];
                          });""",
"""                          character.setCustomTags(prev => {
                            const incoming = new Map(newCustomTags.map(t => [t.id, t]));
                            const next = prev.map(t => incoming.get(t.id) ?? t);
                            for (const t of newCustomTags) {
                              if (!prev.some(p => p.id === t.id)) next.push(t);
                            }
                            return next;
                          });""", 'upsert merge', 1),
])

print("done")
