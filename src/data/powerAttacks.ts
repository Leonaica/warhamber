import type { PowerAttackForm } from '../types/character';

/**
 * Attack forms per power. Aspect and type belong to the form, not the power:
 * a telekinetic strike can be crushing, piercing or concussive, and the caster
 * picks. Powers whose variety is open-ended (the magics) get one Form default
 * to reshape on the combat page.
 *
 * `note` rides onto the attack as its condition, so the qualifiers the book
 * attaches — Energy, Direct, area — stay visible where the attack is used.
 */
export const POWER_ATTACK_FORMS: Record<string, PowerAttackForm[]> = {
  psionics: [
    { name: 'Telepathic Shout', internal: true, subPower: 'Telepathy', aspect: 'Mind', type: 'Shattering', note: 'Unfocused — area, cannot single out a target. Non-lethal.' },
    { name: 'Telepathic Blast', internal: true, subPower: 'Telepathy', aspect: 'Mind', type: 'Shattering', note: 'Focused; trades area for penetration.' },
    { name: 'Mind Crush', internal: true, subPower: 'Telepathy', aspect: 'Mind', type: 'Degradation', note: 'Bleeds from eyes, nose and ears; fries circuits in machines.' },
    { name: 'Dominate', internal: true, subPower: 'Telepathy', aspect: 'Mind', type: 'Subversion', note: 'Requires concentration to maintain.' },
    { name: 'Psi-Blade', subPower: 'Telepathy', aspect: 'Mind', type: 'Degradation', note: 'Energy — cannot be physically parried; can parry physical attacks. Sustained weapon.' },
    { name: 'Draining Touch', internal: true, subPower: 'Biokinesis', aspect: 'Flesh', type: 'Leeching', note: 'Drains Surge; tissue left intact.' },
    { name: 'Death Touch', internal: true, subPower: 'Biokinesis', aspect: 'Flesh', type: 'Leeching', note: 'Vitality ripped out rather than siphoned.' },
    { name: 'Bio-Electric Channel', subPower: 'Biokinesis', aspect: 'Flesh', type: 'Burnout', note: 'Life force projected as raw energy.' },
    { name: 'Deadly Gaze (Form)', internal: true, subPower: 'Biokinesis', aspect: 'Form', type: 'Distortion', note: 'Physical disruption at a glance. Learned separately from the Flesh form.' },
    { name: 'Deadly Gaze (Flesh)', internal: true, subPower: 'Biokinesis', aspect: 'Flesh', type: 'Burnout', note: 'Biological disruption at a glance. Learned separately from the Form form.' },
    { name: 'Death Field', internal: true, subPower: 'Biokinesis', aspect: 'Flesh', type: 'Leeching', note: 'Area — radius scales with Presence. Step 3.' },
    { name: 'Telekinetic Strike (Crush)', subPower: 'Telekinesis', aspect: 'Form', type: 'Distortion', note: 'External — no bio-electric penalty.' },
    { name: 'Telekinetic Strike (Lance)', subPower: 'Telekinesis', aspect: 'Form', type: 'Piercing', note: 'External — no bio-electric penalty.' },
    { name: 'Telekinetic Strike (Blast)', subPower: 'Telekinesis', aspect: 'Form', type: 'Shockwave', note: 'External — no bio-electric penalty.' },
    { name: 'Telekinetic Blade', subPower: 'Telekinesis', aspect: 'Form', type: 'Slashing', note: 'Energy — cannot be physically parried; can parry physical attacks.' },
    { name: 'Telekinetic Crush', internal: true, subPower: 'Telekinesis', aspect: 'Form', type: 'Distortion', note: 'Direct — 3 die-step penalty against living targets without Biokinesis.' },
    { name: 'Telekinetic Levitation', internal: true, subPower: 'Telekinesis', aspect: 'Form', type: 'Distortion', note: 'No damage; ensnares. Direct — 3 die-step penalty without Biokinesis.' },
    { name: 'Pyrokinetic Bolt', subPower: 'Pyrokinesis', aspect: 'Form', type: 'Annihilation', note: 'External — no bio-electric penalty. Burning.' },
    { name: 'Pyrokinetic Cold', subPower: 'Pyrokinesis', aspect: 'Form', type: 'Annihilation', note: 'External — no bio-electric penalty. Material shatters.' },
    { name: 'Spontaneous Combustion', internal: true, subPower: 'Pyrokinesis', aspect: 'Flesh', type: 'Burnout', note: 'Direct — 3 die-step penalty without Biokinesis. Burning.' },
    { name: 'Soulfire', subPower: 'Pyrokinesis', aspect: 'Form', type: 'Annihilation', note: 'Burns spirits as well as matter. Step 3.' },
  ],
  logrus: [
    { name: 'Logrus Tendril', aspect: 'Form', type: 'Distortion', note: 'Flexible. Disrupts magic, Pattern and Tarot on contact.' },
    { name: 'Primal Chaos', aspect: 'Form', type: 'Annihilation', note: 'Primal Chaos — ongoing dissolution. Step 2.' },
    { name: 'Logrus Wyrm', aspect: 'Form', type: 'Distortion', note: 'Dancing — strikes and defends autonomously.' },
  ],
  formulaicMagic: [
    { name: 'Magic attack', aspect: 'Form', type: 'Distortion', note: 'Default Form — reshape as the spell requires.' },
  ],
  innateMagic: [
    { name: 'Magic attack', aspect: 'Form', type: 'Distortion', note: 'Default Form — reshape as the spell requires.' },
  ],
  primeMagic: [
    { name: 'Magic attack', aspect: 'Form', type: 'Distortion', note: 'Default Form — reshape as the spell requires.' },
  ],
  pactMagic: [
    { name: 'Magic attack', aspect: 'Form', type: 'Distortion', note: 'Default Form — reshape as the miracle requires.' },
  ],
};
