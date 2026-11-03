#!/usr/bin/env python3
"""s69 - Enhancement quality: flat on attack, flat on damage, variable 1-5."""
import sys
from pathlib import Path

REL = 'src/data/weaponTags.ts'
text = Path(REL).read_text()

def bail(msg):
    print(f"FAIL {msg}")
    sys.exit(1)

def sub(old, new, label, count=1):
    global text
    n = text.count(old)
    if n != count:
        bail(f"{label}: expected {count}, found {n}")
    text = text.replace(old, new)
    print(f"ok   {label}")

if "id: 'tag-enhancement'" in text:
    bail("tag-enhancement already present")

ENTRY = """  {
    id: 'tag-enhancement',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [
      { stage: 'attack', op: 'add', amount: 'x', per: 'flat' },
      { stage: 'damageModifier', op: 'add', amount: 'x', per: 'flat' },
      { stage: 'flag', op: 'flag', note: "Bypasses resistance to mundane weapons" },
    ],
    label: 'Enhancement',
    category: 'Combat Handling',
    description: 'Crafted or enchanted to strike truer and bite deeper',
    effect: '+{x} to attack and +{x} Damage Modifier. Counts as a magical weapon for resistance purposes',
    variable: { min: 1, max: 5, default: 1, step: 1 },
  },
"""

# alphabetical within Combat Handling: between Defensive and Energy
sub("  {\n    id: 'tag-energy',",
    ENTRY + "  {\n    id: 'tag-energy',",
    'insert before tag-energy')

if text.count("id: 'tag-enhancement'") != 1:
    bail('entry count wrong')
if "variable: { min: 1, max: 5" not in text:
    bail('variable block missing')
if "stage: 'damageModifier', op: 'add', amount: 'x'" not in text:
    bail('damage effect missing')

Path(REL).write_text(text)
print("wrote", REL)
