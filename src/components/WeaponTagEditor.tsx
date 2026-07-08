import { useState } from 'react';
import type { WeaponTagDefinition } from '../types/character';
import {
  WEAPON_TAG_CATEGORIES,
  WEAPON_TAG_LIBRARY,
  getTagColor,
  getOrderedCategories,
  mergeTags,
  findTagByLabel,
  resolveTag,
} from '../data/weaponTags';
import { TagChip } from './TagChip';

interface WeaponTagEditorProps {
  tagIds: string[];
  customTags?: WeaponTagDefinition[];
  onChange: (tagIds: string[]) => void;
  onNewCustomTags: (tags: WeaponTagDefinition[]) => void;
}

export function WeaponTagEditor({
  tagIds = [],
  customTags = [],
  onChange,
  onNewCustomTags,
}: WeaponTagEditorProps) {
  const [showBrowse, setShowBrowse] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [newCustomTags, setNewCustomTags] = useState<WeaponTagDefinition[]>([]);

  // Custom tag form state
  const [ctLabel, setCtLabel] = useState('');
  const [ctCategory, setCtCategory] = useState<string>('Quality');
  const [ctCustomCategory, setCtCustomCategory] = useState('');
  const [ctDescription, setCtDescription] = useState('');
  const [ctEffect, setCtEffect] = useState('');

  const allCustomTags = [...customTags, ...newCustomTags];
  const allAvailableTags = mergeTags(WEAPON_TAG_LIBRARY, allCustomTags);

  const selectedTags = tagIds
    .map(id => resolveTag(id, allCustomTags))
    .filter((t): t is WeaponTagDefinition => t !== undefined);

  const toggleTag = (tagId: string) => {
    if (tagIds.includes(tagId)) {
      onChange(tagIds.filter(id => id !== tagId));
    } else {
      onChange([...tagIds, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    onChange(tagIds.filter(id => id !== tagId));
  };

  const handleCreateCustomTag = () => {
    if (!ctLabel.trim()) return;

    const category = ctCategory === '__other__' ? ctCustomCategory.trim() : ctCategory;
    if (!category) return;

    // Dedup: if a tag with this label already exists, just toggle it on
    const existing = findTagByLabel(ctLabel, allCustomTags);
    if (existing) {
      if (!tagIds.includes(existing.id)) {
        toggleTag(existing.id);
      }
      // Reset form
      setCtLabel('');
      setCtCategory('Quality');
      setCtCustomCategory('');
      setCtDescription('');
      setCtEffect('');
      setShowCustomForm(false);
      return;
    }

    // Create new custom tag
    const newTag: WeaponTagDefinition = {
      id: crypto.randomUUID(),
      label: ctLabel.trim(),
      category,
      ...(ctDescription.trim() && { description: ctDescription.trim() }),
      ...(ctEffect.trim() && { effect: ctEffect.trim() }),
    };

    const updated = [...newCustomTags, newTag];
    setNewCustomTags(updated);
    onNewCustomTags(updated);
    onChange([...tagIds, newTag.id]);

    // Reset form
    setCtLabel('');
    setCtCategory('Quality');
    setCtCustomCategory('');
    setCtDescription('');
    setCtEffect('');
    setShowCustomForm(false);
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
    <div className="space-y-2">
      {/* Label */}
      <div className="flex justify-between items-center">
        <label className="text-sm text-slate-400">Qualities</label>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBrowse(!showBrowse)}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300"
          >
            {showBrowse ? '▲ Hide Library' : '▼ Browse Library'}
          </button>
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300"
          >
            {showCustomForm ? '▲ Cancel' : '+ New Custom Quality'}
          </button>
        </div>
      </div>

      {/* Selected tags */}
      <div className="min-h-[2.5rem] bg-slate-700/30 rounded p-2 flex flex-wrap gap-1.5 items-start">
        {selectedTags.length === 0 ? (
          <span className="text-slate-500 text-sm italic py-0.5">
            No qualities selected
          </span>
        ) : (
          selectedTags.map(tag => (
            <TagChip key={tag.id} tag={tag} onRemove={removeTag} />
          ))
        )}
      </div>

      {/* Browse panel */}
      {showBrowse && (
        <div className="bg-slate-700/30 rounded p-3 space-y-3">
          <input
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
                      const isSelected = tagIds.includes(tag.id);
                      const tagColor = getTagColor(tag.category);
                      const tooltip = [tag.effect, tag.description].filter(Boolean).join(' — ') || tag.label;
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
      {showCustomForm && (
        <div className="bg-slate-700/30 rounded p-3 space-y-2">
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
          <div>
            <label className="block text-xs text-slate-400 mb-1">Effect</label>
            <textarea
              value={ctEffect}
              onChange={e => setCtEffect(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              placeholder="Mechanical effect, e.g., +10 to hit in desert terrain"
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