export const TYPES = {
  fire: { label: 'Fire', color: '#ff7a3d', light: '#ffd39b', dark: '#a83c11' },
  water: { label: 'Water', color: '#38a9f0', light: '#b9e9ff', dark: '#1267a8' },
  grass: { label: 'Grass', color: '#57c96a', light: '#c9f5a9', dark: '#20793a' },
  electric: { label: 'Electric', color: '#f5c518', light: '#fff2a8', dark: '#9a6d00' },
  rock: { label: 'Rock', color: '#a9a28f', light: '#e4ddc5', dark: '#5e5a4e' },
  flying: { label: 'Flying', color: '#9d8cf2', light: '#e0d8ff', dark: '#5847a8' },
  ice: { label: 'Ice', color: '#74d8ec', light: '#d8fbff', dark: '#2b7e98' },
  bug: { label: 'Bug', color: '#9fbe3c', light: '#edf6b8', dark: '#5e7417' },
  ghost: { label: 'Ghost', color: '#8c78c8', light: '#ddd4ff', dark: '#4c3c7f' },
  dragon: { label: 'Dragon', color: '#6f72ea', light: '#d8d9ff', dark: '#373a9f' },
  fairy: { label: 'Fairy', color: '#f08fc8', light: '#ffe0f1', dark: '#a63d79' },
  normal: { label: 'Normal', color: '#c7bfae', light: '#f4efe3', dark: '#726b5e' }
}

const EFFECTIVENESS = {
  fire: { grass: 2, ice: 2, bug: 2, water: 0.5, rock: 0.5, fire: 0.5, dragon: 0.5 },
  water: { fire: 2, rock: 2, ice: 0.5, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, rock: 2, fire: 0.5, grass: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, rock: 0.5, dragon: 0.5 },
  rock: { fire: 2, flying: 2, ice: 2, bug: 2, grass: 0.5 },
  flying: { grass: 2, bug: 2, electric: 0.5, rock: 0.5 },
  ice: { grass: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5 },
  bug: { grass: 2, fire: 0.5, flying: 0.5, rock: 0.5, ghost: 0.5, fairy: 0.5 },
  ghost: { ghost: 2, normal: 0 },
  dragon: { dragon: 2, fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5 },
  fairy: { dragon: 2, fire: 0.5, rock: 0.5 },
  normal: { rock: 0.5, ghost: 0 }
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
  skyDive: { name: 'Sky Dive', type: 'flying', power: 67, desc: 'Plummets from the clouds.' },

  frostNip: { name: 'Frost Nip', type: 'ice', power: 42, desc: 'A brittle bite of winter air.' },
  snowShard: { name: 'Snow Shard', type: 'ice', power: 52, desc: 'Flings a splinter of ancient ice.' },
  glacierCrash: { name: 'Glacier Crash', type: 'ice', power: 70, desc: 'Drops a creaking wall of ice.' },
  chillPuff: { name: 'Chill Puff', type: 'ice', power: 36, desc: 'A puff of freezing breath.' },

  bugBite: { name: 'Bug Bite', type: 'bug', power: 40, desc: 'A tiny but determined chomp.' },
  silkShot: { name: 'Silk Shot', type: 'bug', power: 48, desc: 'Wraps the target in sticky silk.' },
  flutterDive: { name: 'Flutter Dive', type: 'bug', power: 58, desc: 'A dizzying spiral strike.' },
  pollenPuff: { name: 'Pollen Puff', type: 'bug', power: 66, desc: 'Bursts a cloud of stinging pollen.' },

  shadowNip: { name: 'Shadow Nip', type: 'ghost', power: 44, desc: 'A cold nip from the dark.' },
  frightPulse: { name: 'Fright Pulse', type: 'ghost', power: 56, desc: 'A wave of gently alarming spookiness.' },
  phantomClaw: { name: 'Phantom Claw', type: 'ghost', power: 66, desc: 'Rakes with a claw that is not quite there.' },
  spookyWave: { name: 'Spooky Wave', type: 'ghost', power: 50, desc: 'A shivery ripple of haunted air.' },

  dragonSnap: { name: 'Dragon Snap', type: 'dragon', power: 46, desc: 'A proud little dragon bite.' },
  scaleRush: { name: 'Scale Rush', type: 'dragon', power: 56, desc: 'Charges behind a shield of scales.' },
  wyrmWave: { name: 'Wyrm Wave', type: 'dragon', power: 64, desc: 'Calls a curling ribbon of draconic energy.' },
  dracoBurst: { name: 'Draco Burst', type: 'dragon', power: 74, desc: 'Detonates a brilliant star of wyrmfire.' },

  fairyDust: { name: 'Fairy Dust', type: 'fairy', power: 40, desc: 'A glittering pinch of mischief.' },
  charmBeam: { name: 'Charm Beam', type: 'fairy', power: 52, desc: 'A warm beam that forgets to be scary.' },
  moonKiss: { name: 'Moon Kiss', type: 'fairy', power: 64, desc: 'A silver kiss from the night sky.' },
  starBurst: { name: 'Star Burst', type: 'fairy', power: 58, desc: 'Scatters tiny shooting stars.' }
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
  },
  {
    id: 'cindercub',
    name: 'Cindercub',
    title: 'Ember Cub',
    type: 'fire',
    baseHp: 64,
    scale: 0.9,
    lore: 'It sneezes tiny sparks and then looks around to see who did that.',
    colors: {
      body: 0xf28a45, belly: 0xffdfb4, accent: 0xffb43c, dark: 0x7c3418,
      eye: 0x33221b, glow: '#ff9a3d'
    },
    model: { kind: 'quad', ears: 'round', tail: 'ember', cheeks: true, mane: true },
    moves: ['emberSnap', 'flamePounce', 'tailWhip', 'quickDash'],
    habitat: 'Sunny meadow'
  },
  {
    id: 'tidepup',
    name: 'Tidepup',
    title: 'Tide Pup',
    type: 'water',
    baseHp: 72,
    scale: 0.9,
    lore: 'It chases waves it made itself and always seems surprised to catch one.',
    colors: {
      body: 0x53c4dc, belly: 0xe2faff, accent: 0x2786b5, dark: 0x1c5876,
      eye: 0x183541, glow: '#7ce6ff'
    },
    model: { kind: 'quad', ears: 'flop', tail: 'fin', gills: true, cheeks: true },
    moves: ['bubblePop', 'aquaJet', 'tackle', 'tidalPush'],
    habitat: 'Mirror pond'
  },
  {
    id: 'mossling',
    name: 'Mossling',
    title: 'Moss Cap',
    type: 'grass',
    baseHp: 76,
    scale: 0.9,
    lore: 'The spotted cap is soft enough to nap on. It prefers visitors who do.',
    colors: {
      body: 0x8fce6d, belly: 0xf2f0b5, accent: 0xd9605e, dark: 0x4b6e39,
      eye: 0x24341f
    },
    model: { kind: 'quad', cap: true, spots: true, tail: 'puff', cheeks: true },
    moves: ['leafSlash', 'vineSnap', 'headbutt', 'bloomBurst'],
    habitat: 'Tall grass'
  },
  {
    id: 'voltmoth',
    name: 'Voltmoth',
    title: 'Static Moth',
    type: 'bug',
    baseHp: 62,
    scale: 0.88,
    lore: 'Its wings hum at exactly the frequency that makes campfires flicker.',
    colors: {
      body: 0xf1d35a, belly: 0xfff4c4, accent: 0x8b6de0, dark: 0x66511c,
      eye: 0x30284a, glow: '#ffe66d'
    },
    model: { kind: 'bug', wings: 'moth', antennae: true, spots: true, glow: true },
    moves: ['spark', 'bugBite', 'silkShot', 'thunderPop'],
    habitat: 'Stone ridge'
  },
  {
    id: 'cragoon',
    name: 'Cragoon',
    title: 'Moss Crab',
    type: 'rock',
    baseHp: 82,
    scale: 0.95,
    lore: 'It carries pebbles in its claws like a very serious rock collection.',
    colors: {
      body: 0x9fb0a2, belly: 0xd4dfc8, accent: 0x68b573, dark: 0x57655a,
      eye: 0x26322b
    },
    model: { kind: 'crab', claws: true, spots: true },
    moves: ['rockToss', 'rollout', 'bugBite', 'boulderDrop'],
    habitat: 'Old stone circle'
  },
  {
    id: 'breezle',
    name: 'Breezle',
    title: 'Breeze Chick',
    type: 'flying',
    baseHp: 64,
    scale: 0.88,
    lore: 'It practices takeoffs from the windmill and lands wherever the breeze decides.',
    colors: {
      body: 0xb7d7ed, belly: 0xfff1ce, accent: 0x7ba7d4, dark: 0x4e6f96,
      eye: 0x273849
    },
    model: { kind: 'bird', wings: 'bird', tail: 'feather', beak: true, crest: true },
    moves: ['gust', 'wingSlash', 'peck', 'skyDive'],
    habitat: 'Windmill hill'
  },
  {
    id: 'frostfawn',
    name: 'Frostfawn',
    title: 'Frost Fawn',
    type: 'ice',
    baseHp: 70,
    scale: 0.92,
    lore: 'Its antlers collect morning frost, which it shakes onto sleepy flowers.',
    colors: {
      body: 0xb8e6ef, belly: 0xf4ffff, accent: 0x74c6d8, dark: 0x4f8898,
      eye: 0x233a44, glow: '#c9fbff'
    },
    model: { kind: 'quad', antlers: true, tail: 'puff', spots: true, cheeks: true },
    moves: ['frostNip', 'snowShard', 'headbutt', 'glacierCrash'],
    habitat: 'Frosted hilltop'
  },
  {
    id: 'snowmole',
    name: 'Snowmole',
    title: 'Snow Mole',
    type: 'ice',
    baseHp: 70,
    scale: 0.82,
    lore: 'It builds tiny snow tunnels and pops out to check if anyone saw.',
    colors: {
      body: 0xd9eef5, belly: 0xffffff, accent: 0x89bfd1, dark: 0x6f97a5,
      eye: 0x2a3b43, glow: '#e8ffff'
    },
    model: { kind: 'blob', claws: true, crystals: true, cheeks: true },
    moves: ['chillPuff', 'frostNip', 'tackle', 'glacierCrash'],
    habitat: 'Frosted hilltop'
  },
  {
    id: 'emberfly',
    name: 'Emberfly',
    title: 'Ember Fly',
    type: 'fire',
    baseHp: 58,
    scale: 0.84,
    lore: 'It leaves a trail of warm golden dust that smells faintly of cinnamon.',
    colors: {
      body: 0xffa04f, belly: 0xffe09a, accent: 0xe3543c, dark: 0x7f2f20,
      eye: 0x311d18, glow: '#ff8a3c'
    },
    model: { kind: 'bug', wings: 'fairy', antennae: true, glow: true, sparks: true },
    moves: ['emberSnap', 'bugBite', 'flutterDive', 'flamePounce'],
    habitat: 'Sunny meadow'
  },
  {
    id: 'duskpaw',
    name: 'Duskpaw',
    title: 'Dusk Cat',
    type: 'ghost',
    baseHp: 68,
    scale: 0.9,
    lore: 'It walks through moon shadows and purrs in a frequency plants seem to enjoy.',
    colors: {
      body: 0x6e628f, belly: 0xc9b8e6, accent: 0x9b7bd6, dark: 0x3c3354,
      eye: 0xf7d96b, glow: '#b28cff'
    },
    model: { kind: 'quad', ears: 'point', tail: 'wisp', cheeks: true, glow: true },
    moves: ['shadowNip', 'frightPulse', 'quickDash', 'phantomClaw'],
    habitat: 'Old stone circle'
  },
  {
    id: 'wispurr',
    name: 'Wispurr',
    title: 'Wisp Cat',
    type: 'fairy',
    baseHp: 66,
    scale: 0.86,
    lore: 'It collects lost wishes and wears them as a soft, sparkling halo.',
    colors: {
      body: 0xf3a9d2, belly: 0xfff1fb, accent: 0xffd36e, dark: 0xa84f84,
      eye: 0x56304a, glow: '#ffd1f0'
    },
    model: { kind: 'ghost', ears: 'point', tail: 'wisp', halo: true, cheeks: true, glow: true },
    moves: ['fairyDust', 'charmBeam', 'starBurst', 'moonKiss'],
    habitat: 'Windmill hill'
  },
  {
    id: 'dracoil',
    name: 'Dracoil',
    title: 'Coil Wyrm',
    type: 'dragon',
    baseHp: 78,
    scale: 0.93,
    lore: 'It naps in perfect spirals. Disturbing the spiral is considered extremely rude.',
    colors: {
      body: 0x6f78d8, belly: 0xd6dcff, accent: 0x4fc7bc, dark: 0x3d438f,
      eye: 0xf5d05a, glow: '#9ca4ff'
    },
    model: { kind: 'serpent', horns: 'dragon', tail: 'serpent', spots: true },
    moves: ['dragonSnap', 'scaleRush', 'wyrmWave', 'dracoBurst'],
    habitat: 'Old stone circle'
  },
  {
    id: 'sparkit',
    name: 'Sparkit',
    title: 'Spark Kit',
    type: 'electric',
    baseHp: 62,
    scale: 0.86,
    lore: 'Its long ears act as lightning rods. It is very proud of this.',
    colors: {
      body: 0xf3cf4f, belly: 0xfff5b8, accent: 0xe9783f, dark: 0x7c5c17,
      eye: 0x332813, glow: '#fff06a'
    },
    model: { kind: 'quad', ears: 'long', tail: 'zig', cheeks: true, sparks: true },
    moves: ['spark', 'zapDash', 'nuzzle', 'thunderPop'],
    habitat: 'Stony ridge'
  },
  {
    id: 'petalfin',
    name: 'Petalfin',
    title: 'Petal Fin',
    type: 'grass',
    baseHp: 74,
    scale: 0.9,
    lore: 'The petals around its neck bloom brighter whenever it makes a new friend.',
    colors: {
      body: 0x6fc987, belly: 0xf4f7bb, accent: 0xf0a6c8, dark: 0x35744b,
      eye: 0x203b27
    },
    model: { kind: 'quad', tail: 'leaf', collar: true, spots: true, cheeks: true },
    moves: ['leafSlash', 'vineSnap', 'headbutt', 'bloomBurst'],
    habitat: 'Tall grass'
  },
  {
    id: 'duneshell',
    name: 'Duneshell',
    title: 'Dune Shell',
    type: 'rock',
    baseHp: 84,
    scale: 0.94,
    lore: 'It has crossed the whole meadow very slowly and remembers every stone.',
    colors: {
      body: 0xd6b877, belly: 0xf8e7b4, accent: 0x9b7442, dark: 0x6e512b,
      eye: 0x3a2d1d
    },
    model: { kind: 'turtle', shell: true, tail: 'puff', claws: true },
    moves: ['rockToss', 'rollout', 'tackle', 'boulderDrop'],
    habitat: 'Windmill hill'
  }
]

export const byId = Object.fromEntries(SPECIES.map(s => [s.id, s]))

export const STARTER_ID = 'emberpaw'
export const WILD_LEVEL_RANGE = [3, 7]
export const START_ORBS = 12
