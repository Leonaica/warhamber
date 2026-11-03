#!/usr/bin/env python3
"""s70 - custom tags print like native ones; drop the double space in attack text."""
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

# --- 1. shared helper
patch('src/data/weaponTags.ts', [(
"""export function formatTagEffect(
  def: WeaponTagDefinition,
  x?: number
): string | undefined {
  if (!def.effect) return undefined;
  if (x === undefined) return def.effect;
  return def.effect.replace(/\\{x\\}/g, String(x));
}
""",
"""export function formatTagEffect(
  def: WeaponTagDefinition,
  x?: number
): string | undefined {
  if (!def.effect) return undefined;
  if (x === undefined) return def.effect;
  return def.effect.replace(/\\{x\\}/g, String(x));
}

/**
 * Detail line for a tag: hand-written effect prose where the tag carries it,
 * otherwise its description. Custom tags only ever have the latter — the
 * custom-tag form writes `effect` and `description` and never `effects`.
 */
export function tagDetailText(
  def: WeaponTagDefinition,
  x?: number
): string | undefined {
  return formatTagEffect(def, x) ?? def.description;
}
""", 'tagDetailText helper', 1)])

# --- 2. export: use the helper, always italicise
patch('src/utils/homebreweryExport.ts', [
("import { resolveTagRef, idsToRefs, formatTagEffect } from '../data/weaponTags';",
 "import { resolveTagRef, idsToRefs, tagDetailText } from '../data/weaponTags';",
 'import', 1),
("""        const effectText = formatTagEffect(resolved.def, resolved.x);
        return effectText ? `*${resolved.def.label}* (${effectText})` : resolved.def.label;""",
 """        const detail = tagDetailText(resolved.def, resolved.x);
        return detail ? `*${resolved.def.label}* (${detail})` : `*${resolved.def.label}*`;""",
 'tag text', 1),
("""        const conditionalText = attack.isConditional ? ` ➡️${attack.condition ? ` (${attack.condition})` : ''}` : '';
        return `${conditionalText} ${aspectName}-${attack.type} ${attack.magnitude}${penText} ${rangeLabel}`;""",
 """        const conditionalPrefix = attack.isConditional
          ? `➡️${attack.condition ? ` (${attack.condition})` : ''} `
          : '';
        return `${conditionalPrefix}${aspectName}-${attack.type} ${attack.magnitude}${penText} ${rangeLabel}`;""",
 'attack text spacing', 1),
])

# --- 3. print sheet: same fallback
patch('src/components/CharacterSheet.tsx', [
("import { resolveTagRef, idsToRefs, formatTagLabel, formatTagEffect } from '../data/weaponTags';",
 "import { resolveTagRef, idsToRefs, formatTagLabel, tagDetailText } from '../data/weaponTags';",
 'import', 1),
("const effectText = formatTagEffect(def, x);",
 "const effectText = tagDetailText(def, x);",
 'tag detail', 1),
])

# --- 4. tests
patch('src/data/weaponTags.test.ts', [
("import { sortTagRefs, sortWeaponTags } from './weaponTags';",
 "import { sortTagRefs, sortWeaponTags, tagDetailText } from './weaponTags';",
 'import', 1),
("""describe('sortWeaponTags', () => {""",
 """describe('tagDetailText', () => {
  it('interpolates the effect prose when the tag has one', () => {
    expect(tagDetailText({ ...def('tag-x', 'X'), effect: '+{x} damage' }, 2)).toBe('+2 damage');
  });

  it('falls back to the description, which is all a custom tag ever has', () => {
    expect(tagDetailText({ ...def('tag-y', 'Y'), description: 'Coils like a serpent' })).toBe('Coils like a serpent');
  });

  it('returns undefined when there is neither', () => {
    expect(tagDetailText(def('tag-z', 'Z'))).toBeUndefined();
  });
});

describe('sortWeaponTags', () => {""",
 'tests', 1),
])

print("done")
