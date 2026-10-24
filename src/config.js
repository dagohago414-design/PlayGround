export const TYPES = {
  fire: { label: 'Fire', color: '#ff7a3d', light: '#ffd39b', dark: '#a83c11' },
  water: { label: 'Water', color: '#38a9f0', light: '#b9e9ff', dark: '#1267a8' },
  grass: { label: 'Grass', color: '#57c96a', light: '#c9f5a9', dark: '#20793a' },
  electric: { label: 'Electric', color: '#f5c518', light: '#fff2a8', dark: '#9a6d00' },
  rock: { label: 'Rock', color: '#a9a28f', light: '#e4ddc5', dark: '#5e5a4e' },
  flying: { label: 'Flying', color: '#9d8cf2', light: '#e0d8ff', dark: '#5847a8' },
  normal: { label: 'Normal', color: '#c7bfae', light: '#f4efe3', dark: '#726b5e' }
}

const EFFECTIVENESS = {
  fire: { grass: 2, water: 0.5, rock: 0.5, fire: 0.5 },
  water: { fire: 2, rock: 2, water: 0.5, grass: 0.5 },
  grass: { water: 2, rock: 2, fire: 0.5, grass: 0.5, flying: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, rock: 0.5 },
  rock: { fire: 2, flying: 2, grass: 0.5 },
  flying: { grass: 2, electric: 0.5, rock: 0.5 },
  normal: { rock: 0.5 }
}

export function effectiveness(attackType, defenderType) {
  return EFFECTIVENESS[attackType]?.[defenderType] ?? 1
}

export const MOVES = {
  emberSnap: { name: 'Ember Snap', type: 'fire', power: 40, desc: 'A crackling bite of ember.' },
  flamePounce: { name: 'Flame Pounce', type: 'fire', power: 62, desc: 'Leaps in a trail of sparks.' },
  tailWhip: { name: 'Tail Whip', type: 'normal', power: 26, desc: 'A spinning tail strike.' },
  quickDash: { name: 'Quick Dash', type: 'normal', power: 36, desc: 'A blur-fast tackle.' },

  bubblePop: { name: 'Bubble Pop', type: 'water', power: 40, desc: 'Bursting bubbles at close range.' },
  aquaJet: { name: 'Aqua Jet', type: 'water', power: 56, desc: 'Rockets forward on a wave.' },
  splash: { name: 'Splash', type: 'normal', power: 24, desc: 'An enthusiastic belly flop.' },
  tidalPush: { name: 'Tidal Push', type: 'water', power: 68, desc: 'Summons a crashing wave.' },

  leafSlash: { name: 'Leaf Slash', type: 'grass', power: 44, desc: 'Slices with a razor leaf.' },
  vineSnap: { name: 'Vine Snap', type: 'grass', power: 38, desc: 'A whip-crack of vines.' },
  headbutt: { name: 'Headbutt', type: 'normal', power: 34, desc: 'A stubborn little charge.' },
  bloomBurst: { name: 'Bloom Burst', type: 'grass', power: 66, desc: 'A storm of petals and pollen.' },

  spark: { name: 'Spark', type: 'electric', power: 42, desc: 'A sharp static nip.' },
  zapDash: { name: 'Zap Dash', type: 'electric', power: 55, desc: 'Blitzes in a zigzag.' },
  nuzzle: { name: 'Nuzzle', type: 'normal', power: 24, desc: 'A surprisingly rude nuzzle.' },
  thunderPop: { name: 'Thunder Pop', type: 'electric', power: 68, desc: 'Detonates a ball of thunder.' },

  rockToss: { name: 'Rock Toss', type: 'rock', power: 46, desc: 'Hurls a chunky pebble.' },
  rollout: { name: 'Rollout', type: 'rock', power: 54, desc: 'Curls up and bowls forward.' },
  tackle: { name: 'Tackle', type: 'normal', power: 32, desc: 'A simple, solid shove.' },
  boulderDrop: { name: 'Boulder Drop', type: 'rock', power: 70, desc: 'Calls down a mighty boulder.' },

  gust: { name: 'Gust', type: 'flying', power: 40, desc: 'A buffeting spiral of wind.' },
  wingSlash: { name: 'Wing Slash', type: 'flying', power: 54, desc: 'A silver arc of feathers.' },
  peck: { name: 'Peck', type: 'normal', power: 30, desc: 'A precise, pointy peck.' },
  skyDive: { name: 'Sky Dive', type: 'flying', power: 67, desc: 'Plummets from the clouds.' }
}

export const SPECIES = [
  {
    id: 'emberpaw',
    name: 'Emberpaw',
    title: 'Ember Fox',
    type: 'fire',
    baseHp: 66,
    scale: 0.92,
    lore: 'Its tail stores warm embers. It never lets a campfire go out.',
    colors: {
      body: 0xf07a3a, belly: 0xffd9a8, accent: 0xffc247, dark: 0x7d3117,
      eye: 0x33241f
    },
    moves: ['emberSnap', 'flamePounce', 'tailWhip', 'quickDash'],
    habitat: 'Sunny meadow'
  },
  {
    id: 'aquafin',
    name: 'Aquafin',
    title: 'Ripple Otter',
    type: 'water',
    baseHp: 72,
    scale: 0.9,
    lore: 'It shapes water into bubbles and rides them across the pond.',
    colors: {
      body: 0x42b4e8, belly: 0xd7f4ff, accent: 0x2f7fbf, dark: 0x185987,
      eye: 0x1b2f3c
    },
    moves: ['bubblePop', 'aquaJet', 'splash', 'tidalPush'],
    habitat: 'Mirror pond'
  },
  {
    id: 'sproutle',
    name: 'Sproutle',
    title: 'Bud Dino',
    type: 'grass',
    baseHp: 70,
    scale: 0.95,
    lore: 'The leaf on its head turns toward sunlight, even on cloudy days.',
    colors: {
      body: 0x6fce66, belly: 0xe7f6a5, accent: 0x2f9e4f, dark: 0x276b33,
      eye: 0x24361f
    },
    moves: ['leafSlash', 'vineSnap', 'headbutt', 'bloomBurst'],
    habitat: 'Tall grass'
  },
  {
    id: 'zappup',
    name: 'Zappup',
    title: 'Static Pup',
    type: 'electric',
    baseHp: 62,
    scale: 0.86,
    lore: 'Its ears crackle when excited. Hugs are strongly discouraged.',
    colors: {
      body: 0xf7d33f, belly: 0xfff1b0, accent: 0xe86a3c, dark: 0x8a6410,
      eye: 0x3b2f18
    },
    moves: ['spark', 'zapDash', 'nuzzle', 'thunderPop'],
    habitat: 'Stony ridge'
  },
  {
    id: 'pebblit',
    name: 'Pebblit',
    title: 'Moss Golem',
    type: 'rock',
    baseHp: 80,
    scale: 0.94,
    lore: 'A patient little boulder. Flowers grow where it naps.',
    colors: {
      body: 0x9ca6ad, belly: 0xc7cfd2, accent: 0x6fae5a, dark: 0x566066,
      eye: 0x252d31
    },
    moves: ['rockToss', 'rollout', 'tackle', 'boulderDrop'],
    habitat: 'Old stone circle'
  },
  {
    id: 'zephyro',
    name: 'Zephyro',
    title: 'Breeze Chick',
    type: 'flying',
    baseHp: 64,
    scale: 0.88,
    lore: 'It naps on warm updrafts and hums when the wind changes.',
    colors: {
      body: 0xb9a5f0, belly: 0xffd7ec, accent: 0x8f6be0, dark: 0x5b4794,
      eye: 0x322a4c
    },
    moves: ['gust', 'wingSlash', 'peck', 'skyDive'],
    habitat: 'Windmill hill'
  }
]

export const byId = Object.fromEntries(SPECIES.map(s => [s.id, s]))

export const STARTER_ID = 'emberpaw'
export const WILD_LEVEL_RANGE = [3, 7]
export const START_ORBS = 12
