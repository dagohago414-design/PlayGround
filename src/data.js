export const TYPES = {
  plain: { name: 'Plain', color: '#f2e9d0', dark: '#8f8264' },
  ember: { name: 'Ember', color: '#ff8359', dark: '#a33f21' },
  tide: { name: 'Tide', color: '#4db9ff', dark: '#1e6ea6' },
  verdant: { name: 'Verdant', color: '#5ed68b', dark: '#23824c' },
  spark: { name: 'Spark', color: '#ffd34f', dark: '#a68010' },
  stone: { name: 'Stone', color: '#c0aa8a', dark: '#776448' },
  aether: { name: 'Aether', color: '#cf8cff', dark: '#8b3fbd' }
};

const ADV = {
  plain: {},
  ember: { verdant: 2, tide: 0.5, stone: 0.5 },
  tide: { ember: 2, stone: 2, verdant: 0.5 },
  verdant: { tide: 2, stone: 2, ember: 0.5 },
  spark: { tide: 2, aether: 1.5, stone: 0.5 },
  stone: { spark: 2, ember: 0.5, verdant: 0.5 },
  aether: { aether: 0.5, stone: 1.5 }
};

export function effectiveness(moveType, defenderType) {
  return ADV[moveType]?.[defenderType] ?? 1;
}

export const MOVES = {
  tackle: { name: 'Tackle', type: 'plain', power: 38, acc: 100, icon: 'paw', desc: 'A cheerful body check.' },
  quickAttack: { name: 'Quick Dash', type: 'plain', power: 30, acc: 100, icon: 'bolt', priority: true, desc: 'Always strikes first.' },
  wildBite: { name: 'Wild Bite', type: 'plain', power: 46, acc: 95, icon: 'fang', desc: 'A playful but sharp nip.' },
  emberBurst: { name: 'Ember Burst', type: 'ember', power: 52, acc: 95, icon: 'flame', effect: { kind: 'burn', chance: 0.18 }, desc: 'A burst of warm sparks.' },
  flareUp: { name: 'Flare Up', type: 'ember', power: 62, acc: 86, icon: 'flame', desc: 'A brilliant, risky blaze.' },
  emberFang: { name: 'Ember Fang', type: 'ember', power: 45, acc: 100, icon: 'fang', effect: { kind: 'burn', chance: 0.12 }, desc: 'Fiery little fangs.' },
  aquaJet: { name: 'Aqua Jet', type: 'tide', power: 40, acc: 100, icon: 'drop', priority: true, desc: 'Rides a rushing wave.' },
  bubbleBeam: { name: 'Bubble Beam', type: 'tide', power: 50, acc: 96, icon: 'drop', desc: 'A stream of shining bubbles.' },
  tidalCrash: { name: 'Tidal Crash', type: 'tide', power: 64, acc: 84, icon: 'wave', desc: 'A crashing wall of water.' },
  aquaRing: { name: 'Aqua Ring', type: 'tide', power: 0, acc: 100, icon: 'heal', effect: { kind: 'heal', ratio: 0.3 }, desc: 'Restores a third of HP.' },
  vineWhip: { name: 'Vine Whip', type: 'verdant', power: 42, acc: 100, icon: 'leaf', desc: 'A snapping green vine.' },
  leafSlash: { name: 'Leaf Slash', type: 'verdant', power: 55, acc: 94, icon: 'leaf', desc: 'A razor-edged leaf.' },
  photosynth: { name: 'Photosynth', type: 'verdant', power: 0, acc: 100, icon: 'heal', effect: { kind: 'heal', ratio: 0.32 }, desc: 'Drinks in meadow light.' },
  sporeCloud: { name: 'Spore Cloud', type: 'verdant', power: 34, acc: 92, icon: 'leaf', desc: 'A puff of sleepy spores.' },
  staticField: { name: 'Static Field', type: 'spark', power: 34, acc: 100, icon: 'bolt', desc: 'A crackling little field.' },
  sparkZap: { name: 'Spark Zap', type: 'spark', power: 50, acc: 95, icon: 'bolt', desc: 'A snap of bright current.' },
  thunderFang: { name: 'Thunder Fang', type: 'spark', power: 58, acc: 88, icon: 'fang', desc: 'A shocking little bite.' },
  sonicBolt: { name: 'Sonic Bolt', type: 'spark', power: 60, acc: 84, icon: 'bolt', desc: 'A thunderous pulse.' },
  rockToss: { name: 'Rock Toss', type: 'stone', power: 52, acc: 92, icon: 'rock', desc: 'Hurls a friendly boulder.' },
  boulderRoll: { name: 'Boulder Roll', type: 'stone', power: 62, acc: 82, icon: 'rock', desc: 'A rumbling tumble.' },
  stoneShell: { name: 'Stone Shell', type: 'stone', power: 0, acc: 100, icon: 'heal', effect: { kind: 'heal', ratio: 0.28 }, desc: 'Cozy up inside a shell.' },
  moonbeam: { name: 'Moonbeam', type: 'aether', power: 54, acc: 95, icon: 'star', desc: 'A ribbon of pale light.' },
  prismRay: { name: 'Prism Ray', type: 'aether', power: 62, acc: 88, icon: 'star', desc: 'A rainbow-bright beam.' },
  starfall: { name: 'Starfall', type: 'aether', power: 70, acc: 80, icon: 'star', desc: 'A shower of tiny stars.' },
  wish: { name: 'Wish', type: 'aether', power: 0, acc: 100, icon: 'heal', effect: { kind: 'heal', ratio: 0.35 }, desc: 'A wish on a falling star.' }
};

export const SPECIES = {
  emberfox: {
    id: 'emberfox', name: 'Emberfox', type: 'ember', title: 'the hearth-tail',
    rarity: 'Common', catchRate: 0.62, scale: 0.96,
    base: { hp: 42, atk: 13, def: 9, spd: 14 },
    moves: ['tackle', 'emberBurst', 'quickAttack', 'emberFang'],
    habitat: 'Sunlit Path', desc: 'Its fluffy tail burns brightest when it feels safe. It loves to nap on warm stones.',
    colors: { body: '#f2793f', belly: '#ffe5bd', accent: '#ffb347', eye: '#40231a', glow: '#ffb05e' }
  },
  leafcub: {
    id: 'leafcub', name: 'Leafcub', type: 'verdant', title: 'the sprout cub',
    rarity: 'Common', catchRate: 0.72, scale: 0.9,
    base: { hp: 48, atk: 10, def: 12, spd: 9 },
    moves: ['tackle', 'vineWhip', 'leafSlash', 'photosynth'],
    habitat: 'Clover Hollow', desc: 'The leaf on its head turns toward the sun. It hums when the meadow is happy.',
    colors: { body: '#6fcf83', belly: '#e8f9c9', accent: '#3f9d60', eye: '#20301f', glow: '#a6ffb4' }
  },
  aquapup: {
    id: 'aquapup', name: 'Aquapup', type: 'tide', title: 'the puddle pup',
    rarity: 'Common', catchRate: 0.68, scale: 0.94,
    base: { hp: 45, atk: 11, def: 10, spd: 13 },
    moves: ['tackle', 'aquaJet', 'bubbleBeam', 'aquaRing'],
    habitat: 'Mirror Lake', desc: 'It chases ripples for hours. The fin on its head flicks when it is excited.',
    colors: { body: '#56bfe8', belly: '#e8fbff', accent: '#2b8fc4', eye: '#143447', glow: '#9eeaff' }
  },
  voltbat: {
    id: 'voltbat', name: 'Voltbat', type: 'spark', title: 'the static flier',
    rarity: 'Uncommon', catchRate: 0.55, scale: 0.88,
    base: { hp: 38, atk: 12, def: 8, spd: 18 },
    moves: ['quickAttack', 'sparkZap', 'thunderFang', 'sonicBolt'],
    habitat: 'Amber Ridge', desc: 'Its wings crackle with tiny lightning. It naps upside down in the old cedar.',
    colors: { body: '#f2cf49', belly: '#fff3b3', accent: '#7358b8', eye: '#2b2240', glow: '#ffe57a' }
  },
  rocklet: {
    id: 'rocklet', name: 'Rocklet', type: 'stone', title: 'the pebble pal',
    rarity: 'Uncommon', catchRate: 0.58, scale: 1.04,
    base: { hp: 60, atk: 12, def: 15, spd: 5 },
    moves: ['tackle', 'rockToss', 'boulderRoll', 'stoneShell'],
    habitat: 'Old Quarry', desc: 'A patient little guardian of the trail. Moss grows on the north side of its ears.',
    colors: { body: '#b3a28a', belly: '#e6dcc4', accent: '#7b6a52', eye: '#332d27', glow: '#ffe0a3' }
  },
  wispling: {
    id: 'wispling', name: 'Wispling', type: 'aether', title: 'the wishing wisp',
    rarity: 'Radiant', catchRate: 0.3, scale: 0.92,
    base: { hp: 40, atk: 14, def: 8, spd: 16 },
    moves: ['moonbeam', 'prismRay', 'starfall', 'wish'],
    habitat: 'Starlit Glade', desc: 'A shy wisp said to carry a wish in its halo. It appears only in quiet corners of the meadow.',
    colors: { body: '#f4e8ff', belly: '#ffffff', accent: '#cf8cff', eye: '#4a2b63', glow: '#ffd6ff' }
  }
};

export const SPAWNS = [
  { species: 'emberfox', x: 4.6, z: 1.0, radius: 2.6, levels: [3, 6] },
  { species: 'leafcub', x: -6, z: -8, radius: 5, levels: [3, 6] },
  { species: 'aquapup', x: -11, z: 23, radius: 5, levels: [4, 7] },
  { species: 'voltbat', x: 14, z: -16, radius: 5, levels: [4, 7] },
  { species: 'rocklet', x: 2, z: -26, radius: 6, levels: [4, 8] },
  { species: 'wispling', x: 26, z: 9, radius: 4, levels: [5, 8] }
];

export const STARTER = { species: 'emberfox', level: 6 };

export function maxHpOf(mon) {
  return Math.round(SPECIES[mon.species].base.hp * 0.7 + mon.level * 3.8);
}

export function statsOf(mon) {
  const base = SPECIES[mon.species].base;
  return {
    atk: Math.round(base.atk + mon.level * 1.15),
    def: Math.round(base.def + mon.level * 1.0),
    spd: Math.round(base.spd + mon.level * 0.75)
  };
}

export function xpToNext(level) {
  return 18 + level * 14;
}

export function makeMon(speciesId, level) {
  return {
    species: speciesId,
    level,
    xp: 0,
    hp: maxHpOf({ species: speciesId, level }),
    status: null,
    uid: Math.random().toString(36).slice(2, 9)
  };
}

export function levelLabel(level) {
  return `Lv. ${level}`;
}
