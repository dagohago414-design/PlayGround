import { SPECIES, byId } from './config.js'

const ADMIN_KEY = 'wildbound-admin-v1'
const ACCESS_CODE = '0001'
const CATEGORIES = ['All', 'Loot', 'Team', 'World', 'Battle', 'Trainer', 'Spawn', 'Chaos']

let unlocked = false
try {
  unlocked = localStorage.getItem(ADMIN_KEY) === '1'
} catch {}

function randomSpecies() {
  return SPECIES[Math.floor(Math.random() * SPECIES.length)]
}

function shuffled(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function addOrbs(c, amount) {
  c.state.orbs = Math.max(0, c.state.orbs + amount)
  c.updateHud()
  c.getBattle()?.setOrbs(c.state.orbs)
}

function setPlayerScale(c, scale) {
  c.player.group.scale.setScalar(scale)
}

function applyTrainerMods(c) {
  const a = c.state.admin
  c.player.speedMultiplier = a.speed ? 1.9 : 1
  c.player.jumpMultiplier = a.moonJump ? 1.9 : 1
  c.player.noclip = a.noclip
  setPlayerScale(c, a.giantPlayer ? 1.75 : a.tinyPlayer ? 0.55 : 1)
  const follower = c.getFollower()
  if (follower) follower.group.scale.setScalar(a.giantFollower ? 1.65 : 1)
}

function applyWildScale(c) {
  const a = c.state.admin
  const scale = a.giantWilds ? 1.65 : a.tinyWilds ? 0.55 : 1
  for (const wild of c.wilds) wild.group.scale.setScalar(scale)
}

function healAll(c) {
  for (const unit of c.state.party) unit.hp = unit.maxHp
  c.updateHud()
  if (c.teamModalOpen()) c.renderTeam()
}

function toggleBattle(c, key, label) {
  const a = c.state.admin
  a[key] = !a[key]
  return `${label}: ${a[key] ? 'ON' : 'OFF'}`
}

function setLighting(c, mode) {
  const sky = c.world.sky.material.uniforms
  const scene = c.world.scene
  if (mode === 'golden') {
    sky.topColor.value.set('#e8884f')
    sky.midColor.value.set('#ffc37b')
    sky.horizonColor.value.set('#fff0c9')
    c.world.hemi.color.set('#ffd8ad')
    c.world.hemi.groundColor.set('#8a6b4b')
    c.world.hemi.intensity = 1.3
    c.world.dir.color.set('#ffb36e')
    c.world.dir.intensity = 2.4
    scene.fog.color.set('#f1ce9f')
    scene.fog.near = 38
    scene.fog.far = 120
    return 'Golden hour settles over the meadow.'
  }
  if (mode === 'fog') {
    sky.topColor.value.set('#506f68')
    sky.midColor.value.set('#9bb4a4')
    sky.horizonColor.value.set('#dce7d2')
    c.world.hemi.color.set('#d6e8db')
    c.world.hemi.groundColor.set('#61705a')
    c.world.hemi.intensity = 1.35
    c.world.dir.color.set('#e4f2df')
    c.world.dir.intensity = 1.8
    scene.fog.color.set('#c8d8c7')
    scene.fog.near = 8
    scene.fog.far = 62
    return 'A mystic fog rolls through the valley.'
  }
  sky.topColor.value.set('#2f9fe8')
  sky.midColor.value.set('#8bd4f7')
  sky.horizonColor.value.set('#ffe8c7')
  c.world.hemi.color.set('#d6f2ff')
  c.world.hemi.groundColor.set('#5b8f54')
  c.world.hemi.intensity = 1.65
  c.world.dir.color.set('#fff1cc')
  c.world.dir.intensity = 2.45
  scene.fog.color.set('#c3e8f4')
  scene.fog.near = 55
  scene.fog.far = 165
  return 'Bright noon returns to Wildbound Meadow.'
}

function spawnReport(c, speciesId, level = 5) {
  const species = byId[speciesId]
  const wild = c.spawnWildAt(speciesId, level)
  return wild ? `${species.name} appeared nearby.` : `Could not find room for ${species.name}.`
}

const POWERS = [
  { id: 'orbs50', cat: 'Loot', name: 'Orb Rain', desc: 'Add 50 Wild Orbs to your satchel.', run: c => { addOrbs(c, 50); return '+50 Wild Orbs.' } },
  { id: 'orbs500', cat: 'Loot', name: 'Orb Vault', desc: 'Add 500 Wild Orbs to your satchel.', run: c => { addOrbs(c, 500); return '+500 Wild Orbs.' } },
  { id: 'orbs9999', cat: 'Loot', name: 'Overflowing Satchel', desc: 'Set your Wild Orb count to 9,999.', run: c => { c.state.orbs = 9999; c.updateHud(); c.getBattle()?.setOrbs(9999); return 'Wild Orbs set to 9,999.' } },
  { id: 'orbs0', cat: 'Loot', name: 'Empty Satchel', desc: 'Set your Wild Orb count to zero.', run: c => { c.state.orbs = 0; c.updateHud(); c.getBattle()?.setOrbs(0); return 'Wild Orbs emptied.' } },
  { id: 'healActive', cat: 'Loot', name: 'Full Heal', desc: 'Fully restore your active partner.', run: c => { const u = c.activeUnit(); u.hp = u.maxHp; c.updateHud(); c.teamModalOpen() && c.renderTeam(); return `${byId[u.speciesId].name} is fully healed.` } },
  { id: 'healTeam', cat: 'Loot', name: 'Team Rest', desc: 'Fully heal and revive every team member.', run: c => { healAll(c); return 'Your whole team is restored.' } },
  { id: 'candy1', cat: 'Loot', name: 'Rare Candy', desc: 'Raise your active partner by one level.', run: c => { const u = c.activeUnit(); const s = byId[u.speciesId]; u.level += 1; u.maxHp = Math.max(24, Math.round(s.baseHp + u.level * 3.4)); u.hp = u.maxHp; c.updateHud(); c.teamModalOpen() && c.renderTeam(); return `${s.name} grew to Lv ${u.level}.` } },
  { id: 'candy5', cat: 'Loot', name: 'Candy Jar', desc: 'Raise your active partner by five levels.', run: c => { const u = c.activeUnit(); const s = byId[u.speciesId]; u.level += 5; u.maxHp = Math.max(24, Math.round(s.baseHp + u.level * 3.4)); u.hp = u.maxHp; c.updateHud(); c.teamModalOpen() && c.renderTeam(); return `${s.name} grew to Lv ${u.level}.` } },
  { id: 'battleReady', cat: 'Loot', name: 'Battle Ready', desc: 'Heal the whole team and gain 20 orbs.', run: c => { healAll(c); addOrbs(c, 20); return 'Team healed. +20 Wild Orbs.' } },

  { id: 'recruit', cat: 'Team', name: 'Wild Recruit', desc: 'Register and recruit a random creature.', run: c => { const pool = SPECIES.filter(s => !c.state.owned.has(s.id)); const species = pool.length ? pool[Math.floor(Math.random() * pool.length)] : randomSpecies(); const r = c.grantSpecies(species.id, 7, true); return `${r.name} ${r.added ? 'joined your team' : 'was registered — team full'}.` } },
  { id: 'fillParty', cat: 'Team', name: 'Fill Party', desc: 'Fill every empty team slot with a random Lv 10 ally.', run: c => { let count = 0; while (c.state.party.length < 6) { c.grantSpecies(randomSpecies().id, 10, true); count++ } return count ? `${count} new allies joined.` : 'Your team is already full.' } },
  { id: 'starters', cat: 'Team', name: 'Starter Squad', desc: 'Rebuild your team with the six original species at Lv 10.', run: c => { c.setPartyTo(SPECIES.slice(0, 6).map(s => s.id), 10); return 'The original six are ready for adventure.' } },
  { id: 'allRounder', cat: 'Team', name: 'All-Rounder Team', desc: 'Roll a fresh six-creature team at Lv 10.', run: c => { c.setPartyTo(shuffled(SPECIES).slice(0, 6).map(s => s.id), 10); return 'A brand-new team assembled.' } },
  { id: 'nextPartner', cat: 'Team', name: 'Next Partner', desc: 'Switch to the next healthy team member.', run: c => { const party = c.state.party; for (let step = 1; step <= party.length; step++) { const i = (c.state.activeIndex + step) % party.length; if (party[i].hp > 0) { c.state.activeIndex = i; c.createFollower(party[i].speciesId); c.updateHud(); c.teamModalOpen() && c.renderTeam(); return `${byId[party[i].speciesId].name} is now your partner.` } } return 'No healthy partner available.' } },
  { id: 'level10', cat: 'Team', name: 'Level 10 Team', desc: 'Set every team member to Lv 10 and full HP.', run: c => { c.levelParty(10); return 'Your team is now Lv 10.' } },
  { id: 'level25', cat: 'Team', name: 'Level 25 Team', desc: 'Set every team member to Lv 25 and full HP.', run: c => { c.levelParty(25); return 'Your team is now Lv 25.' } },
  { id: 'level50', cat: 'Team', name: 'Level 50 Team', desc: 'Set every team member to Lv 50 and full HP.', run: c => { c.levelParty(50); return 'Your team is now Lv 50.' } },
  { id: 'freshStart', cat: 'Team', name: 'Fresh Start', desc: 'Reset your team to the Lv 5 starter. Dex is kept.', run: c => { c.setPartyTo([SPECIES[0].id], 5); return 'Your team is back to a fresh starter.' } },
  { id: 'reroll', cat: 'Team', name: 'Team Reroll', desc: 'Replace the whole team with six random Lv 15 allies.', run: c => { c.setPartyTo(shuffled(SPECIES).slice(0, 6).map(s => s.id), 15); return 'Your team has been rerolled.' } },

  { id: 'tpCamp', cat: 'World', name: 'To Campfire', desc: 'Teleport back to the meadow campfire.', run: c => { c.teleportPlayer(c.world.settlement.firePos.x - 2, c.world.settlement.firePos.z + 2); return 'Teleported to the campfire.' } },
  { id: 'tpPond', cat: 'World', name: 'To Mirror Pond', desc: 'Teleport to the shore of Mirror Pond.', run: c => { c.teleportPlayer(17, -14); return 'Teleported to Mirror Pond.' } },
  { id: 'tpStones', cat: 'World', name: 'To Stone Circle', desc: 'Teleport beside the old stone circle.', run: c => { c.teleportPlayer(21, 8); return 'Teleported to the stone circle.' } },
  { id: 'tpWindmill', cat: 'World', name: 'To Windmill Hill', desc: 'Teleport to the windmill on the hill.', run: c => { c.teleportPlayer(-36, -35); return 'Teleported to the windmill.' } },
  { id: 'tpSign', cat: 'World', name: 'To Meadow Sign', desc: 'Teleport to the sign near the spawn point.', run: c => { c.teleportPlayer(8.5, 5); return 'Teleported to the meadow sign.' } },
  { id: 'tpCrystal', cat: 'World', name: 'To Moss Crystal', desc: 'Teleport beside the humming moss crystal.', run: c => { c.teleportPlayer(24, 8); return 'Teleported to the moss crystal.' } },
  { id: 'golden', cat: 'World', name: 'Golden Hour', desc: 'Bathe the meadow in warm sunset light.', run: c => setLighting(c, 'golden') },
  { id: 'noon', cat: 'World', name: 'Bright Noon', desc: 'Restore the meadow to clear midday light.', run: c => setLighting(c, 'noon') },
  { id: 'fog', cat: 'World', name: 'Mystic Fog', desc: 'Wrap the meadow in cool, close fog.', run: c => setLighting(c, 'fog') },
  { id: 'respawnAll', cat: 'World', name: 'Respawn All', desc: 'Bring every despawned wild creature back.', run: c => { let count = 0; for (const wild of c.wilds) if (!wild.active) { c.respawnWild(wild); count++ } return count ? `${count} wild creatures returned.` : 'Every wild creature is already here.' } },

  { id: 'startBattle', cat: 'Battle', name: 'Start Wild Battle', desc: 'Close the panel and challenge the nearest wild creature.', run: c => c.startAdminBattle() ? null : 'No active wild creature to challenge.' },
  { id: 'perfectCatch', cat: 'Battle', name: 'Perfect Catch', desc: 'Every Wild Orb throw will catch its target.', run: c => toggleBattle(c, 'perfectCatch', 'Perfect Catch'), active: c => c.state.admin.perfectCatch },
  { id: 'invincible', cat: 'Battle', name: 'Invincible Team', desc: 'Enemy attacks deal zero damage.', run: c => toggleBattle(c, 'invincible', 'Invincible Team'), active: c => c.state.admin.invincible },
  { id: 'oneHit', cat: 'Battle', name: 'One-Hit KO', desc: 'Your attacks deal lethal damage.', run: c => toggleBattle(c, 'oneHit', 'One-Hit KO'), active: c => c.state.admin.oneHit },
  { id: 'infiniteOrbs', cat: 'Battle', name: 'Infinite Orbs', desc: 'Throw Wild Orbs without spending them.', run: c => toggleBattle(c, 'infiniteOrbs', 'Infinite Orbs'), active: c => c.state.admin.infiniteOrbs },
  { id: 'weak', cat: 'Battle', name: 'Weak Enemies', desc: 'Wild creatures enter battle with 30% HP.', run: c => { c.state.admin.weakEnemies = !c.state.admin.weakEnemies; if (c.state.admin.weakEnemies) c.state.admin.strongEnemies = false; return `Weak Enemies: ${c.state.admin.weakEnemies ? 'ON' : 'OFF'}` }, active: c => c.state.admin.weakEnemies },
  { id: 'strong', cat: 'Battle', name: 'Strong Enemies', desc: 'Wild creatures enter battle with 220% HP.', run: c => { c.state.admin.strongEnemies = !c.state.admin.strongEnemies; if (c.state.admin.strongEnemies) c.state.admin.weakEnemies = false; return `Strong Enemies: ${c.state.admin.strongEnemies ? 'ON' : 'OFF'}` }, active: c => c.state.admin.strongEnemies },
  { id: 'clearMods', cat: 'Battle', name: 'Clear Battle Mods', desc: 'Turn off all battle-related admin toggles.', run: c => { const a = c.state.admin; a.perfectCatch = a.invincible = a.oneHit = a.infiniteOrbs = a.weakEnemies = a.strongEnemies = false; return 'All battle modifiers cleared.' } },
  { id: 'bonus', cat: 'Battle', name: 'Battle Bonus', desc: 'Gain 10 orbs and level your active partner once.', run: c => { addOrbs(c, 10); const u = c.activeUnit(); const s = byId[u.speciesId]; u.level += 1; u.maxHp = Math.max(24, Math.round(s.baseHp + u.level * 3.4)); u.hp = u.maxHp; c.updateHud(); c.teamModalOpen() && c.renderTeam(); return `+10 orbs. ${s.name} is now Lv ${u.level}.` } },
  { id: 'training', cat: 'Battle', name: 'Team Training', desc: 'Raise every team member by one level.', run: c => { for (const u of c.state.party) { const s = byId[u.speciesId]; u.level += 1; u.maxHp = Math.max(24, Math.round(s.baseHp + u.level * 3.4)); u.hp = u.maxHp } c.updateHud(); c.teamModalOpen() && c.renderTeam(); return 'Every team member gained a level.' } },
  { id: 'storm', cat: 'Battle', name: 'Encounter Storm', desc: 'Summon five random wild creatures around you.', run: c => { for (let i = 0; i < 5; i++) c.spawnWildAt(randomSpecies().id, 4 + Math.floor(Math.random() * 4)); return 'Five wild creatures appeared.' } },

  { id: 'speed', cat: 'Trainer', name: 'Super Speed', desc: 'Move at roughly double speed.', run: c => { const a = c.state.admin; a.speed = !a.speed; applyTrainerMods(c); return `Super Speed: ${a.speed ? 'ON' : 'OFF'}` }, active: c => c.state.admin.speed },
  { id: 'turbo', cat: 'Trainer', name: 'Turbo Run', desc: 'Always run without holding Shift.', run: c => { const a = c.state.admin; a.autoRun = !a.autoRun; return `Turbo Run: ${a.autoRun ? 'ON' : 'OFF'}` }, active: c => c.state.admin.autoRun },
  { id: 'jump', cat: 'Trainer', name: 'Moon Jump', desc: 'Jump much higher than normal.', run: c => { const a = c.state.admin; a.moonJump = !a.moonJump; applyTrainerMods(c); return `Moon Jump: ${a.moonJump ? 'ON' : 'OFF'}` }, active: c => c.state.admin.moonJump },
  { id: 'giantPlayer', cat: 'Trainer', name: 'Giant Trainer', desc: 'Become a towering explorer.', run: c => { const a = c.state.admin; a.giantPlayer = !a.giantPlayer; if (a.giantPlayer) a.tinyPlayer = false; applyTrainerMods(c); return `Giant Trainer: ${a.giantPlayer ? 'ON' : 'OFF'}` }, active: c => c.state.admin.giantPlayer },
  { id: 'tinyPlayer', cat: 'Trainer', name: 'Tiny Trainer', desc: 'Shrink down to pocket size.', run: c => { const a = c.state.admin; a.tinyPlayer = !a.tinyPlayer; if (a.tinyPlayer) a.giantPlayer = false; applyTrainerMods(c); return `Tiny Trainer: ${a.tinyPlayer ? 'ON' : 'OFF'}` }, active: c => c.state.admin.tinyPlayer },
  { id: 'noclip', cat: 'Trainer', name: 'Ghost Walk', desc: 'Walk through trees, rocks, and water.', run: c => { const a = c.state.admin; a.noclip = !a.noclip; applyTrainerMods(c); return `Ghost Walk: ${a.noclip ? 'ON' : 'OFF'}` }, active: c => c.state.admin.noclip },
  { id: 'followerShuffle', cat: 'Trainer', name: 'Follower Shuffle', desc: 'Give your follower a random new form.', run: c => { const pick = randomSpecies(); c.createFollower(pick.id); return `${pick.name} is now following you.` } },
  { id: 'followerGiant', cat: 'Trainer', name: 'Giant Follower', desc: 'Make your follower a very large friend.', run: c => { const a = c.state.admin; a.giantFollower = !a.giantFollower; applyTrainerMods(c); return `Giant Follower: ${a.giantFollower ? 'ON' : 'OFF'}` }, active: c => c.state.admin.giantFollower },
  { id: 'cameraFar', cat: 'Trainer', name: 'Far Camera', desc: 'Pull the camera out for a wider view.', run: c => { c.camState.distance = 12.5; c.camState.first = true; return 'Camera pulled back.' } },
  { id: 'cameraClose', cat: 'Trainer', name: 'Close Camera', desc: 'Bring the camera in close.', run: c => { c.camState.distance = 4.8; c.camState.first = true; return 'Camera moved close.' } },

  { id: 'spawnEmberpaw', cat: 'Spawn', name: 'Spawn Emberpaw', desc: 'Summon an Emberpaw beside you.', run: c => spawnReport(c, 'emberpaw', 5) },
  { id: 'spawnAquafin', cat: 'Spawn', name: 'Spawn Aquafin', desc: 'Summon an Aquafin beside you.', run: c => spawnReport(c, 'aquafin', 5) },
  { id: 'spawnSproutle', cat: 'Spawn', name: 'Spawn Sproutle', desc: 'Summon a Sproutle beside you.', run: c => spawnReport(c, 'sproutle', 5) },
  { id: 'spawnZappup', cat: 'Spawn', name: 'Spawn Zappup', desc: 'Summon a Zappup beside you.', run: c => spawnReport(c, 'zappup', 5) },
  { id: 'spawnPebblit', cat: 'Spawn', name: 'Spawn Pebblit', desc: 'Summon a Pebblit beside you.', run: c => spawnReport(c, 'pebblit', 5) },
  { id: 'spawnZephyro', cat: 'Spawn', name: 'Spawn Zephyro', desc: 'Summon a Zephyro beside you.', run: c => spawnReport(c, 'zephyro', 5) },
  { id: 'spawnFrostfawn', cat: 'Spawn', name: 'Spawn Frostfawn', desc: 'Summon a Frostfawn beside you.', run: c => spawnReport(c, 'frostfawn', 6) },
  { id: 'spawnDracoil', cat: 'Spawn', name: 'Spawn Dracoil', desc: 'Summon a Dracoil beside you.', run: c => spawnReport(c, 'dracoil', 7) },
  { id: 'spawnNew', cat: 'Spawn', name: 'Spawn New Species', desc: 'Summon a random creature from the new roster.', run: c => { const pick = SPECIES.slice(6)[Math.floor(Math.random() * 15)]; return spawnReport(c, pick.id, 6) } },
  { id: 'dexComplete', cat: 'Spawn', name: 'Complete Pokédex', desc: 'Register all 21 species in the Pokédex.', run: c => { for (const s of SPECIES) c.state.owned.add(s.id); c.state.celebrated = true; c.updateHud(); c.teamModalOpen() && c.renderTeam(); return `Pokédex complete: ${SPECIES.length} species registered.` } },
  { id: 'dexReset', cat: 'Spawn', name: 'Reset Pokédex', desc: 'Clear the dex back to the starter only.', run: c => { c.state.owned.clear(); c.state.owned.add(SPECIES[0].id); c.state.celebrated = false; c.updateHud(); c.teamModalOpen() && c.renderTeam(); return 'Pokédex reset to the starter.' } },

  { id: 'wildParade', cat: 'Chaos', name: 'Wild Parade', desc: 'Gather every active wild creature around you.', run: c => { const active = c.wilds.filter(w => w.active); active.forEach((wild, i) => { const a = (i / active.length) * Math.PI * 2; const r = 4.5 + (i % 3) * 1.4; const x = c.player.position.x + Math.cos(a) * r; const z = c.player.position.z + Math.sin(a) * r; wild.group.position.set(x, c.world.heightAt(x, z), z); wild.tx = x; wild.tz = z; wild.pause = 8 }); return active.length ? `${active.length} wild creatures gathered for the parade.` : 'No active wild creatures.' } },
  { id: 'giantWilds', cat: 'Chaos', name: 'Giant Wilds', desc: 'Make every wild creature tower over you.', run: c => { const a = c.state.admin; a.giantWilds = !a.giantWilds; if (a.giantWilds) a.tinyWilds = false; applyWildScale(c); return `Giant Wilds: ${a.giantWilds ? 'ON' : 'OFF'}` }, active: c => c.state.admin.giantWilds },
  { id: 'tinyWilds', cat: 'Chaos', name: 'Tiny Wilds', desc: 'Shrink every wild creature to pocket size.', run: c => { const a = c.state.admin; a.tinyWilds = !a.tinyWilds; if (a.tinyWilds) a.giantWilds = false; applyWildScale(c); return `Tiny Wilds: ${a.tinyWilds ? 'ON' : 'OFF'}` }, active: c => c.state.admin.tinyWilds },
  { id: 'freezeWilds', cat: 'Chaos', name: 'Freeze Wilds', desc: 'Stop all wild creatures from wandering.', run: c => toggleBattle(c, 'freezeWilds', 'Freeze Wilds'), active: c => c.state.admin.freezeWilds },
  { id: 'wildScaleReset', cat: 'Chaos', name: 'Reset Wild Size', desc: 'Return every wild creature to normal size.', run: c => { c.state.admin.giantWilds = false; c.state.admin.tinyWilds = false; applyWildScale(c); return 'Wild sizes reset.' } },
  { id: 'spawn10', cat: 'Chaos', name: 'Wild Blizzard', desc: 'Summon ten random wild creatures around you.', run: c => { for (let i = 0; i < 10; i++) c.spawnWildAt(randomSpecies().id, 3 + Math.floor(Math.random() * 6)); return 'Ten wild creatures appeared.' } },
  { id: 'clearWilds', cat: 'Chaos', name: 'Clear Wilds', desc: 'Despawn every active wild creature.', run: c => { let count = 0; for (const wild of c.wilds) if (wild.active) { c.despawnWild(wild); count++ } return count ? `${count} wild creatures vanished.` : 'No active wild creatures.' } },
  { id: 'maxEverything', cat: 'Chaos', name: 'Max Everything', desc: 'Max orbs, complete dex, Lv 50 team, and battle cheats.', run: c => { c.state.orbs = 9999; for (const s of SPECIES) c.state.owned.add(s.id); c.state.celebrated = true; c.levelParty(50); const a = c.state.admin; a.perfectCatch = a.invincible = a.oneHit = a.infiniteOrbs = true; c.updateHud(); c.getBattle()?.setOrbs(9999); return 'Everything maxed. The meadow is yours.' } },
  { id: 'hardReset', cat: 'Chaos', name: 'Hard Reset Save', desc: 'Clear all progress and the admin unlock. Reloads.', run: () => { if (!window.confirm('Hard reset all Wildbound progress and lock admin again?')) return 'Hard reset cancelled.'; try { localStorage.removeItem('wildbound-admin-v1'); localStorage.removeItem('wildbound-muted') } catch {}; window.location.reload(); return null } }
]

const POWER_BY_ID = Object.fromEntries(POWERS.map(power => [power.id, power]))

export function initAdmin(ctx) {
  const codeBtn = ctx.$('codeBtn')
  const adminBtn = ctx.$('adminBtn')
  const codeModal = ctx.$('codeModal')
  const adminModal = ctx.$('adminModal')
  const codeForm = ctx.$('codeForm')
  const codeInput = ctx.$('codeInput')
  const codeError = ctx.$('codeError')
  const adminGrid = ctx.$('adminGrid')
  const adminSearch = ctx.$('adminSearch')
  const adminTabs = ctx.$('adminTabs')
  const adminStatus = ctx.$('adminStatus')
  const adminCount = ctx.$('adminCount')
  let category = 'All'
  let query = ''

  function applyUnlock() {
    codeBtn.classList.toggle('hidden', unlocked)
    adminBtn.classList.toggle('hidden', !unlocked)
  }

  function setStatus(message, tone = '') {
    adminStatus.textContent = message
    adminStatus.dataset.tone = tone
  }

  function showAdmin() {
    if (ctx.state.mode === 'battle') return
    ctx.closeModals()
    ctx.state.previousMode = 'explore'
    ctx.state.mode = 'modal'
    adminModal.classList.remove('hidden')
    adminSearch.value = ''
    query = ''
    category = 'All'
    renderTabs()
    renderPowers()
    setStatus('Select a power. Press Escape to return to the meadow.')
  }

  function showCode() {
    if (ctx.state.mode === 'battle') return
    ctx.closeModals()
    ctx.state.previousMode = 'explore'
    ctx.state.mode = 'modal'
    codeModal.classList.remove('hidden')
    codeError.textContent = ''
    codeInput.value = ''
    setTimeout(() => codeInput.focus(), 40)
  }

  function renderTabs() {
    adminTabs.innerHTML = CATEGORIES.map(cat => `
      <button type="button" class="admin-tab${cat === category ? ' active' : ''}" data-cat="${cat}">${cat}</button>
    `).join('')
  }

  function filtered() {
    const q = query.trim().toLowerCase()
    return POWERS.filter(power => {
      const catMatch = category === 'All' || power.cat === category
      const textMatch = !q || `${power.name} ${power.desc} ${power.cat}`.toLowerCase().includes(q)
      return catMatch && textMatch
    })
  }

  function renderPowers() {
    const list = filtered()
    adminCount.textContent = `${list.length} / ${POWERS.length}`
    if (!list.length) {
      adminGrid.innerHTML = '<div class="admin-empty">No powers match that search.</div>'
      return
    }
    adminGrid.innerHTML = list.map(power => `
      <button type="button" class="admin-power" data-power="${power.id}">
        <span class="ap-top"><b>${power.name}</b><span class="ap-cat">${power.cat}</span></span>
        <span class="ap-desc">${power.desc}</span>
        <span class="ap-state">ACTIVATE</span>
      </button>
    `).join('')
    updateStates()
  }

  function updateStates() {
    for (const card of adminGrid.querySelectorAll('.admin-power')) {
      const power = POWER_BY_ID[card.dataset.power]
      const on = power?.active ? !!power.active(ctx) : false
      card.classList.toggle('on', on)
      card.setAttribute('aria-pressed', on ? 'true' : 'false')
      const state = card.querySelector('.ap-state')
      if (state) state.textContent = on ? 'ACTIVE' : 'ACTIVATE'
    }
  }

  codeBtn.addEventListener('click', showCode)
  adminBtn.addEventListener('click', showAdmin)
  ctx.$('codeClose').addEventListener('click', ctx.closeModals)
  ctx.$('adminClose').addEventListener('click', ctx.closeModals)
  codeModal.addEventListener('click', event => { if (event.target === codeModal) ctx.closeModals() })
  adminModal.addEventListener('click', event => { if (event.target === adminModal) ctx.closeModals() })

  codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 4)
    codeError.textContent = ''
  })

  codeForm.addEventListener('submit', event => {
    event.preventDefault()
    if (codeInput.value.trim() === ACCESS_CODE) {
      unlocked = true
      try { localStorage.setItem(ADMIN_KEY, '1') } catch {}
      applyUnlock()
      codeError.textContent = ''
      showAdmin()
      setStatus('Access granted. All 70 admin powers are online.', 'ok')
    } else {
      codeError.textContent = 'ACCESS DENIED · That code does not match the meadow archive.'
      codeInput.value = ''
      codeInput.classList.remove('shake')
      void codeInput.offsetWidth
      codeInput.classList.add('shake')
      setTimeout(() => codeInput.focus(), 30)
    }
  })

  adminTabs.addEventListener('click', event => {
    const tab = event.target.closest('.admin-tab')
    if (!tab) return
    category = tab.dataset.cat
    renderTabs()
    renderPowers()
  })

  adminSearch.addEventListener('input', () => {
    query = adminSearch.value
    renderPowers()
  })

  adminGrid.addEventListener('click', event => {
    const card = event.target.closest('.admin-power')
    if (!card) return
    const power = POWER_BY_ID[card.dataset.power]
    if (!power) return
    ctx.audio.init()
    ctx.audio.click()
    let message = null
    try {
      message = power.run(ctx)
    } catch (error) {
      console.error(error)
      message = 'That power sputtered out. Check the console.'
    }
    updateStates()
    if (message) setStatus(message, 'ok')
  })

  applyUnlock()
  renderTabs()
  renderPowers()
}
