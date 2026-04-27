import { useState, useRef, useEffect } from 'react';

interface StepperToggleProps {
  isCustom: boolean;
  onToggle: () => void;
  customLabel?: string;
  defaultLabel?: string;
}

interface StepperInputProps {
  value: number;
  onChange?: (delta: number) => void;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  displayFn?: (value: number) => string;
  buttonClassName?: string;
  toggle?: StepperToggleProps;
  showButtons?: boolean;
}

export default function StepperInput({
  value,
  onChange,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  className = '',
  displayFn,
  buttonClassName = 'bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded',
  toggle,
  showButtons = true,
}: StepperInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value));
    }
  }, [value, isEditing]);

  const handleEditStart = () => {
    setEditValue(String(value));
    setIsEditing(true);
  };

  const handleEditConfirm = () => {
    if (editValue === '' || editValue === '-') {
      // Empty or just minus — reset to min or 0
      const defaultVal = min !== -Infinity && min > 0 ? min : 0;
      if (onValueChange) {
        onValueChange(defaultVal);
      } else if (onChange) {
        const delta = defaultVal - value;
        if (delta !== 0) onChange(delta);
      }
    } else {
      const parsed = parseInt(editValue, 10);
      if (!isNaN(parsed)) {
        const clamped = Math.min(Math.max(parsed, min), max);
        if (onValueChange) {
          onValueChange(clamped);
        } else if (onChange) {
          const delta = clamped - value;
          if (delta !== 0) onChange(delta);
        }
      }
    }
    setIsEditing(false);
  };

  const handleStep = (delta: number) => {
    const newValue = Math.min(Math.max(value + delta, min), max);
    if (onValueChange) {
      onValueChange(newValue);
    } else if (onChange) {
      onChange(delta);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditConfirm();
    else if (e.key === 'Escape') {
      setEditValue(String(value));
      setIsEditing(false);
    }
  };

  const displayText = displayFn ? displayFn(value) : String(value);

  return (
    <div className="flex items-center gap-2">
      {showButtons && (
        <button
          onClick={() => handleStep(-step)}
          disabled={value <= min}
          className={`${buttonClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          −
        </button>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || v === '-' || /^-?\d*$/.test(v)) {
              setEditValue(v);
            }
          }}
          onBlur={handleEditConfirm}
          onKeyDown={handleKeyDown}
          className="w-12 text-center font-bold bg-slate-800 border border-slate-600 rounded px-1 py-1 outline-none focus:border-slate-400"
        />
      ) : (
        <span
          onClick={handleEditStart}
          className={`w-12 text-center font-bold cursor-text select-none ${className}`}
          title="Click to edit"
        >
          {displayText}
        </span>
      )}

      {showButtons && (
        <button
          onClick={() => handleStep(step)}
          disabled={value >= max}
          className={`${buttonClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          +
        </button>
      )}

      {toggle && (
        <button
          onClick={toggle.onToggle}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            toggle.isCustom
              ? 'bg-amber-500 text-slate-900'
              : 'bg-slate-600 text-slate-400'
          }`}
        >
          {toggle.isCustom
            ? (toggle.customLabel || 'Custom')
            : (toggle.defaultLabel || 'Sheet')}
        </button>
      )}
    </div>
  );
}