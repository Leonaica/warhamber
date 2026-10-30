cat > /tmp/s11b.py <<'PY'
import io, re
p = 'src/pages/ResolverPage.tsx'
s = io.open(p, encoding='utf-8').read()

m = re.search(r"\n([ \t]*)secondaryReactionPoolMax\?: number;", s)
assert m, 'secondaryReactionPoolMax anchor'
s = s[:m.end()] + f"\n{m.group(1)}secondarySkillBonus?: number;" + s[m.end():]
print('field added')

m2 = re.search(r"\n([ \t]*)skillBonus: actorSkillBonus,\n([ \t]*)woundPenalty: actorWoundPenalty,", s)
assert m2, 'secondary skillBonus anchor'
s = s[:m2.start()] + f"\n{m2.group(1)}skillBonus: playsheetState?.secondarySkillBonus ?? actorSkillBonus,\n{m2.group(2)}woundPenalty: actorWoundPenalty," + s[m2.end():]
print('secondary bonus wired')

io.open(p, 'w', encoding='utf-8').write(s)
PY
python3 /tmp/s11b.py
npm run build