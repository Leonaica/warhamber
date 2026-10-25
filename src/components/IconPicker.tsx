import { useState, useMemo } from 'react';
import { ICONS, ICON_CATEGORIES, type IconEntry } from '../data/icons';

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: IconEntry) => void;
  currentIcon: string;
}

export function IconPicker({ isOpen, onClose, onSelect, currentIcon }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filteredIcons = useMemo(() => {
    return ICONS.filter(icon => {
      const matchesCategory = category === 'All' || icon.category === category;
      const matchesSearch = search === '' || 
        icon.name.toLowerCase().includes(search.toLowerCase()) ||
        icon.code.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-amber-400">Choose Avatar Icon</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-700">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search icons..."
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-700">
          {ICON_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                category === cat
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Icon grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {filteredIcons.map(icon => (
              <button
                key={icon.code}
                onClick={() => {
                  onSelect(icon);
                  onClose();
                }}
                className={`p-3 rounded flex flex-col items-center gap-1 transition-colors ${
                  currentIcon === icon.code
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title={`${icon.name} (${icon.code})`}
              >
                {icon.library === 'fontawesome' ? (
                  <i className={icon.faClass} style={{ fontSize: '1.5rem' }}></i>
                ) : (
                  <span className="ei-icon" style={{ fontSize: '1.5rem' }}>{icon.eiChar}</span>
                )}
                <span className="text-xs truncate w-full text-center">{icon.name}</span>
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              No icons found matching "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-center text-xs text-slate-500">
          {filteredIcons.length} icons • Click to select
        </div>
      </div>
    </div>
  );
}