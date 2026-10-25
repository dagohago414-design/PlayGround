import * as THREE from 'three'
import { buildWorld } from './world.js'
import { Player } from './player.js'
import { createCreature, animateCreature, attachShadowBlob, buildCreatureIcon } from './creatures.js'
import { Battle } from './battle.js'
import { AudioEngine } from './audio.js'
import { SPECIES, byId, STARTER_ID, START_ORBS, TYPES } from './config.js'
import { clamp, damp, labelTexture, pick, rand, typeColor } from './lib.js'
import { initAdmin } from './admin.js'

const $ = id => document.getElementById(id)

const state = {
  mode: 'title',
  previousMode: 'title',
  orbs: START_ORBS,
  party: [],
  activeIndex: 0,
  owned: new Set(),
  currentWild: null,
  interaction: null,
  encounterCooldown: 0,
  grassTimer: 0,
  muted: false,
  caughtMessage: '',
  celebrated: false,
  admin: {
    speed: false,
    autoRun: false,
    moonJump: false,
    giantPlayer: false,
    tinyPlayer: false,
    noclip: false,
    giantFollower: false,
    perfectCatch: false,
    invincible: false,
    oneHit: false,
    infiniteOrbs: false,
    weakEnemies: false,
    strongEnemies: false,
    giantWilds: false,
    tinyWilds: false,
    freezeWilds: false
  }
}

try {
  state.muted = localStorage.getItem('wildbound-muted') === '1'
} catch {}

let unitCounter = 0
function createUnit(speciesId, level) {
  const species = byId[speciesId]
  const maxHp = Math.max(24, Math.round(species.baseHp + level * 3.4))
  return { uid: `unit-${++unitCounter}`, speciesId, level, maxHp, hp: maxHp, wins: 0 }
}

state.party.push(createUnit(STARTER_ID, 5))
state.owned.add(STARTER_ID)

const audio = new AudioEngine()
audio.setMuted(state.muted)

const canvas = $('game')
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.06
renderer.outputColorSpace = THREE.SRGBColorSpace

const world = buildWorld()
const scene = world.scene
const player = new Player(world)
scene.add(player.group)

const initialAspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(initialAspect < 0.8 ? 60 : 52, initialAspect, 0.1, 500)

// ---------------------------------------------------------------------------
// Creature icons (used by the HUD, team and Pokédex)
// ---------------------------------------------------------------------------
const icons = {}
try {
  const iconRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  iconRenderer.setPixelRatio(1)
  iconRenderer.setClearColor(0x000000, 0)
  for (const species of SPECIES) icons[species.id] = buildCreatureIcon(species.id, iconRenderer, 192)
  iconRenderer.dispose()
  iconRenderer.forceContextLoss()
} catch (error) {
  console.warn('Could not render creature icons', error)
}
const titleCreature = $('titleCreature')
if (icons[STARTER_ID]) titleCreature.src = icons[STARTER_ID]
else titleCreature.style.display = 'none'

// ---------------------------------------------------------------------------
// Follower creature
// ---------------------------------------------------------------------------
let follower = null
function createFollower(speciesId) {
  if (follower) scene.remove(follower.group)
  follower = createCreature(speciesId, { scale: 0.72 })
  follower.group.scale.setScalar(state.admin.giantFollower ? 1.65 : 1)
  follower.group.position.set(player.position.x + 1.2, world.heightAt(player.position.x + 1.2, player.position.z + 1.6), player.position.z + 1.6)
  follower.group.rotation.y = player.facing
  attachShadowBlob(follower)
  scene.add(follower.group)
  return follower
}
createFollower(state.party[state.activeIndex].speciesId)

// ---------------------------------------------------------------------------
// Wild creatures
// ---------------------------------------------------------------------------
const markerTexture = labelTexture('!', {
  width: 128, height: 128, bg: '#ffd45d', color: '#27352f',
  font: '800 86px Baloo2', radius: 44, accent: '#2b3b34'
})
const wilds = []

function makeWild(spawn) {
  const species = byId[spawn.species]
  const c = createCreature(spawn.species, { scale: species.scale })
  const wildScale = state.admin.giantWilds ? 1.65 : state.admin.tinyWilds ? 0.55 : 1
  c.group.scale.setScalar(wildScale)
  const y = world.heightAt(spawn.x, spawn.z)
  c.group.position.set(spawn.x, y, spawn.z)
  c.group.rotation.y = rand(0, Math.PI * 2)
  attachShadowBlob(c)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 0.94, 26),
    new THREE.MeshBasicMaterial({
      color: typeColor(species.type), transparent: true, opacity: 0.4,
      side: THREE.DoubleSide, depthWrite: false
    })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.04
  c.group.add(ring)
  const marker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: markerTexture, transparent: true, depthWrite: false, depthTest: false
  }))
  marker.position.y = 2.35
  marker.scale.setScalar(0.001)
  marker.renderOrder = 20
  c.group.add(marker)
  scene.add(c.group)
  const wild = {
    uid: `wild-${spawn.species}-${wilds.length}`,
    spawn, level: spawn.level, creature: c, group: c.group, ring, marker,
    active: true, pause: rand(0.5, 2.5), moveTime: 0,
    tx: spawn.x, tz: spawn.z, markerT: 0, respawn: 0,
    facing: c.group.rotation.y
  }
  wilds.push(wild)
  return wild
}
for (const spawn of world.wildSpawns) makeWild(spawn)

function despawnWild(wild) {
  wild.active = false
  wild.group.visible = false
  wild.respawn = 17
  if (state.currentWild === wild) state.currentWild = null
}

function respawnWild(wild) {
  wild.active = true
  wild.group.visible = true
  const angle = rand(0, 6.28)
  const radius = rand(0, wild.spawn.radius * 0.6)
  const x = wild.spawn.x + Math.cos(angle) * radius
  const z = wild.spawn.z + Math.sin(angle) * radius
  wild.group.position.set(x, world.heightAt(x, z), z)
  wild.pause = rand(1, 3)
  wild.tx = wild.spawn.x
  wild.tz = wild.spawn.z
}

function pickWanderTarget(wild) {
  for (let i = 0; i < 5; i++) {
    const angle = rand(0, Math.PI * 2)
    const radius = rand(0.4, wild.spawn.radius)
    const x = wild.spawn.x + Math.cos(angle) * radius
    const z = wild.spawn.z + Math.sin(angle) * radius
    if (!world.isBlocked(x, z, 0.5)) {
      wild.tx = x
      wild.tz = z
      return
    }
  }
  wild.tx = wild.spawn.x
  wild.tz = wild.spawn.z
}

function updateWilds(dt, time) {
  for (const wild of wilds) {
    if (!wild.active) {
      wild.respawn -= dt
      if (wild.respawn <= 0) respawnWild(wild)
      continue
    }
    const species = byId[wild.spawn.species]
    const g = wild.group
    const dxP = player.position.x - g.position.x
    const dzP = player.position.z - g.position.z
    const distPlayer = Math.hypot(dxP, dzP)
    const near = distPlayer < 4.3 && state.mode !== 'battle'
    const markerTarget = near ? 1 : 0
    wild.markerT = damp(wild.markerT, markerTarget, 9, dt)
    wild.marker.scale.setScalar(wild.markerT * 0.9)
    wild.marker.position.y = 2.32 + Math.sin(time * 3.2 + wild.spawn.x) * 0.1
    wild.ring.material.opacity = near ? 0.65 : 0.32 + Math.sin(time * 2 + wild.spawn.z) * 0.08

    if (state.admin.freezeWilds) {
      animateCreature(wild.creature, time, false, 1, { flying: species.type === 'flying' })
      continue
    }

    if (near) {
      const targetAngle = Math.atan2(dxP, dzP)
      wild.group.rotation.y = dampAngle(wild.group.rotation.y, targetAngle, 6, dt)
      animateCreature(wild.creature, time, false, 1, { flying: species.type === 'flying' })
      continue
    }

    if (wild.pause > 0) {
      wild.pause -= dt
      animateCreature(wild.creature, time, false, 1, { flying: species.type === 'flying' })
      continue
    }

    const dx = wild.tx - g.position.x
    const dz = wild.tz - g.position.z
    const dist = Math.hypot(dx, dz)
    if (dist < 0.35) {
      wild.pause = rand(2.2, 5.5)
      pickWanderTarget(wild)
      animateCreature(wild.creature, time, false, 1, { flying: species.type === 'flying' })
      continue
    }

    const step = Math.min(dist, dt * rand(0.75, 1.0))
    const nx = g.position.x + dx / dist * step
    const nz = g.position.z + dz / dist * step
    if (world.isBlocked(nx, nz, 0.4)) {
      wild.pause = rand(0.4, 1.2)
      pickWanderTarget(wild)
      continue
    }
    g.position.x = nx
    g.position.z = nz
    const hover = species.type === 'flying' ? 0.22 + Math.sin(time * 2.4 + wild.spawn.z) * 0.12 : 0
    g.position.y = world.heightAt(nx, nz) + hover
    const targetAngle = Math.atan2(dx, dz)
    wild.group.rotation.y = dampAngle(wild.group.rotation.y, targetAngle, 7, dt)
    animateCreature(wild.creature, time, true, 0.55, { flying: species.type === 'flying' })
  }
}

function dampAngle(current, target, lambda, dt) {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return current + diff * Math.min(1, 1 - Math.exp(-lambda * dt))
}

// ---------------------------------------------------------------------------
// Follower update
// ---------------------------------------------------------------------------
function updateFollower(dt, time) {
  if (!follower) return
  const species = byId[follower.species.id]
  const fx = Math.sin(player.facing)
  const fz = Math.cos(player.facing)
  const sx = Math.cos(player.facing)
  const sz = -Math.sin(player.facing)
  let tx = player.position.x - fx * 1.0 + sx * 1.55
  let tz = player.position.z - fz * 1.0 + sz * 1.55
  if (world.isBlocked(tx, tz, 0.4) || Math.hypot(tx - world.pondCircle.x, tz - world.pondCircle.z) < 12) {
    tx = player.position.x - fx * 0.9
    tz = player.position.z - fz * 0.9
  }
  const c = follower.group
  const dx = tx - c.position.x
  const dz = tz - c.position.z
  const dist = Math.hypot(dx, dz)
  if (dist > 11) {
    c.position.set(tx, world.heightAt(tx, tz), tz)
  } else {
    const k = 1 - Math.exp(-4.5 * dt)
    c.position.x += dx * k
    c.position.z += dz * k
    c.position.y = world.heightAt(c.position.x, c.position.z)
  }
  if (dist > 0.2) {
    c.rotation.y = dampAngle(c.rotation.y, Math.atan2(dx, dz), 6, dt)
  } else {
    c.rotation.y = dampAngle(c.rotation.y, player.facing, 2.5, dt)
  }
  animateCreature(follower, time, dist > 0.25, 0.85, { flying: species.type === 'flying' })
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
const camState = {
  yaw: 0.52,
  pitch: 0.24,
  distance: 8.8,
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  first: true
}

function updateCamera(dt, time) {
  const target = new THREE.Vector3(player.position.x, player.position.y + 1.35, player.position.z)
  const portrait = camera.aspect < 0.8
  let yaw = camState.yaw
  let pitch = camState.pitch + (portrait ? 0.05 : 0)
  let dist = camState.distance * (portrait ? 1.42 : 1)
  if (state.mode === 'title') {
    yaw = 0.56 + Math.sin(time * 0.075) * 0.16
    pitch = 0.15 + Math.sin(time * 0.11) * 0.018
    dist = 8.6 * (portrait ? 1.42 : 1)
  } else if (state.mode === 'modal') {
    yaw = camState.yaw + Math.sin(time * 0.2) * 0.015
  }
  const horizontal = Math.cos(pitch) * dist
  const desired = new THREE.Vector3(
    target.x + Math.sin(yaw) * horizontal,
    target.y + Math.sin(pitch) * dist + 0.55,
    target.z + Math.cos(yaw) * horizontal
  )
  const groundY = world.heightAt(desired.x, desired.z) + 1.1
  if (desired.y < groundY) desired.y = groundY
  if (camState.first) {
    camState.pos.copy(desired)
    camState.look.copy(target)
    camState.first = false
  } else {
    camState.pos.lerp(desired, 1 - Math.exp(-7.5 * dt))
    camState.look.lerp(target, 1 - Math.exp(-11 * dt))
  }
  camera.position.copy(camState.pos)
  camera.lookAt(camState.look)
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const keys = new Set()
const joystick = { x: 0, y: 0, active: false, pointerId: null }
let jumpPressed = false

const joystickEl = $('joystick')
const joystickKnob = $('joystickKnob')

function updateJoystick(event) {
  const rect = joystickEl.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  let dx = event.clientX - cx
  let dy = event.clientY - cy
  const max = rect.width * 0.34
  const len = Math.hypot(dx, dy)
  if (len > max) {
    dx = dx / len * max
    dy = dy / len * max
  }
  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`
  const nx = dx / max
  const ny = dy / max
  const dead = 0.13
  const magnitude = Math.hypot(nx, ny)
  if (magnitude < dead) {
    joystick.x = 0
    joystick.y = 0
  } else {
    const scaled = (magnitude - dead) / (1 - dead)
    joystick.x = (nx / magnitude) * scaled
    joystick.y = (-ny / magnitude) * scaled
  }
}

joystickEl.addEventListener('pointerdown', event => {
  if (state.mode !== 'explore') return
  event.preventDefault()
  joystick.active = true
  joystick.pointerId = event.pointerId
  joystickEl.setPointerCapture(event.pointerId)
  updateJoystick(event)
})
joystickEl.addEventListener('pointermove', event => {
  if (!joystick.active || event.pointerId !== joystick.pointerId) return
  event.preventDefault()
  updateJoystick(event)
})
function releaseJoystick(event) {
  if (!joystick.active) return
  if (event && event.pointerId !== joystick.pointerId) return
  joystick.active = false
  joystick.x = 0
  joystick.y = 0
  joystickKnob.style.transform = 'translate(0px, 0px)'
}
joystickEl.addEventListener('pointerup', releaseJoystick)
joystickEl.addEventListener('pointercancel', releaseJoystick)
joystickEl.addEventListener('lostpointercapture', releaseJoystick)

function readInput() {
  if (state.mode !== 'explore') return { x: 0, y: 0, run: false, jump: false }
  let x = joystick.x
  let y = joystick.y
  const move = new THREE.Vector2()
  if (keys.has('KeyW') || keys.has('ArrowUp')) move.y += 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) move.y -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) move.x += 1
  if (keys.has('KeyA') || keys.has('ArrowLeft')) move.x -= 1
  if (move.lengthSq() > 0) {
    move.normalize()
    x = move.x
    y = move.y
  }
  const magnitude = Math.hypot(x, y)
  const run = state.admin.autoRun || keys.has('ShiftLeft') || keys.has('ShiftRight') || magnitude > 0.92
  const jump = jumpPressed
  jumpPressed = false
  return { x, y, run, jump }
}

// camera drag
let drag = null
canvas.addEventListener('pointerdown', event => {
  if (state.mode !== 'explore') return
  if (event.button !== undefined && event.button !== 0) return
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
  canvas.setPointerCapture(event.pointerId)
})
canvas.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  drag.x = event.clientX
  drag.y = event.clientY
  camState.yaw -= dx * 0.0052
  camState.pitch = clamp(camState.pitch + dy * 0.0032, 0.02, 0.85)
})
function endDrag(event) {
  if (drag && event.pointerId === drag.id) drag = null
}
canvas.addEventListener('pointerup', endDrag)
canvas.addEventListener('pointercancel', endDrag)
canvas.addEventListener('lostpointercapture', endDrag)
canvas.addEventListener('wheel', event => {
  if (state.mode !== 'explore') return
  event.preventDefault()
  camState.distance = clamp(camState.distance + event.deltaY * 0.006, 4.8, 12.5)
}, { passive: false })
canvas.addEventListener('contextmenu', e => e.preventDefault())

window.addEventListener('keydown', event => {
  const movement = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']
  if (movement.includes(event.code) && state.mode === 'explore') event.preventDefault()
  if (event.repeat) return
  keys.add(event.code)

  if (state.mode === 'battle') {
    if (/^Digit[1-4]$/.test(event.code)) {
      const index = Number(event.code.slice(-1)) - 1
      const unit = activeUnit()
      const moves = byId[unit.speciesId].moves
      if (moves[index]) battle.useMove(moves[index])
    }
    if (event.code === 'KeyC') battle.tryCatch()
    if (event.code === 'KeyR') battle.tryRun()
    return
  }

  if (state.mode === 'modal') {
    if (event.code === 'Escape') closeModals()
    return
  }

  if (state.mode === 'title') {
    if (event.code === 'Escape') closeModals()
    return
  }

  if (state.mode === 'explore') {
    if (event.code === 'Space') { jumpPressed = true; return }
    if (event.code === 'KeyE' || event.code === 'KeyF') { event.preventDefault(); interact(); return }
    if (event.code === 'KeyM') { toggleMute(); return }
    if (event.code === 'KeyT') { openModal('teamModal'); return }
    if (event.code === 'KeyH') { openModal('helpModal'); return }
  }
})
window.addEventListener('keyup', event => keys.delete(event.code))
window.addEventListener('blur', () => keys.clear())

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
const dexCount = $('dexCount')
const questText = $('questText')
const questProgress = $('questProgress')
const questDots = $('questDots')
const orbCount = $('orbCount')
const toastEl = $('toast')
const objectiveEl = $('objectiveToast')
const interactionEl = $('interaction')
const interactionText = $('interactionText')
const actionLabel = $('actionLabel')

const dotEls = SPECIES.map(species => {
  const dot = document.createElement('i')
  dot.style.setProperty('--dot', TYPES[species.type].color)
  dot.title = species.name
  questDots.appendChild(dot)
  return dot
})

let toastTimer = null
function showToast(text, ms = 2600) {
  toastEl.textContent = text
  toastEl.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms)
}

let objectiveTimer = null
function showObjective(text, ms = 3400) {
  objectiveEl.textContent = text
  objectiveEl.classList.add('show')
  clearTimeout(objectiveTimer)
  objectiveTimer = setTimeout(() => objectiveEl.classList.remove('show'), ms)
}

function updateHud() {
  const count = state.owned.size
  dexCount.textContent = `${count} / ${SPECIES.length}`
  questProgress.textContent = `${count} / ${SPECIES.length}`
  orbCount.textContent = state.orbs
  const remaining = SPECIES.length - count
  questText.textContent = remaining <= 0
    ? 'Expedition complete — all species found!'
    : count <= 1 ? 'Catch every wild species' : `Catch ${remaining} more species`
  dotEls.forEach((dot, i) => dot.classList.toggle('caught', state.owned.has(SPECIES[i].id)))
  $('teamCount').textContent = `${state.party.length} / 6`
  $('dexModalCount').textContent = `${count} / ${SPECIES.length} discovered`
}

function activeUnit() {
  return state.party[state.activeIndex] || state.party[0]
}

// ---------------------------------------------------------------------------
// Team / Pokédex modal
// ---------------------------------------------------------------------------
const teamModal = $('teamModal')
const helpModal = $('helpModal')
const codeModal = $('codeModal')
const adminModal = $('adminModal')

function openModal(which) {
  if (state.mode === 'battle' || state.mode === 'modal') return
  state.previousMode = state.mode
  state.mode = 'modal'
  audio.init()
  audio.click()
  if (which === 'teamModal') renderTeam()
  $(which).classList.remove('hidden')
}

function closeModals() {
  teamModal.classList.add('hidden')
  helpModal.classList.add('hidden')
  codeModal.classList.add('hidden')
  adminModal.classList.add('hidden')
  if (state.mode === 'modal') state.mode = state.previousMode === 'title' ? 'title' : 'explore'
  audio.click()
}

function renderTeam() {
  const grid = $('teamGrid')
  grid.innerHTML = ''
  state.party.forEach((unit, index) => {
    const species = byId[unit.speciesId]
    const type = TYPES[species.type]
    const card = document.createElement('button')
    card.type = 'button'
    card.className = 'team-member' + (index === state.activeIndex ? ' active' : '') + (unit.hp <= 0 ? ' fainted' : '')
    card.dataset.index = index
    card.innerHTML = `
      ${index === state.activeIndex ? '<span class="active-tag">ACTIVE</span>' : ''}
      <div class="tm-art"><img src="${icons[species.id] || ''}" alt="${species.name}"></div>
      <div class="tm-name-row"><span class="tm-name">${species.name}</span><span class="tm-level">Lv ${unit.level}</span></div>
      <div class="tm-type" style="color:${type.dark}">${type.label} · ${species.title}</div>
      <div class="tm-hp-track"><div class="tm-hp-fill ${unit.hp / unit.maxHp < 0.3 ? 'low' : ''}" style="width:${Math.max(0, unit.hp / unit.maxHp * 100)}%"></div></div>
      <div class="tm-hp-text"><span>HP</span><span>${Math.max(0, Math.ceil(unit.hp))} / ${unit.maxHp}</span></div>
    `
    grid.appendChild(card)
  })
  for (let i = state.party.length; i < 6; i++) {
    const empty = document.createElement('div')
    empty.className = 'team-member'
    empty.style.opacity = '0.42'
    empty.innerHTML = `
      <div class="tm-art" style="background:rgba(61,81,69,.06)"><span style="font-family:var(--font-display);font-size:30px;color:#a7b0a0">?</span></div>
      <div class="tm-name-row"><span class="tm-name">Empty slot</span></div>
      <div class="tm-type">Catch a wild creature</div>
      <div class="tm-hp-track"></div>
    `
    grid.appendChild(empty)
  }
  const dexGrid = $('dexGrid')
  dexGrid.innerHTML = ''
  for (const species of SPECIES) {
    const found = state.owned.has(species.id)
    const item = document.createElement('div')
    item.className = 'dex-item' + (found ? ' found' : '')
    item.innerHTML = `
      ${found ? '<span class="dex-check">✓</span>' : ''}
      <img src="${icons[species.id] || ''}" alt="${found ? species.name : 'Unknown creature'}">
      <b>${found ? species.name : '???'}</b>
      <span>${found ? species.title : TYPES[species.type].label}</span>
    `
    dexGrid.appendChild(item)
  }
  updateHud()
}

$('teamGrid').addEventListener('click', event => {
  const card = event.target.closest('.team-member')
  if (!card || !card.dataset.index) return
  const index = Number(card.dataset.index)
  const unit = state.party[index]
  if (!unit || unit.hp <= 0) {
    showToast('That partner needs a rest at the campfire.')
    return
  }
  state.activeIndex = index
  audio.select()
  createFollower(unit.speciesId)
  renderTeam()
  showToast(`${byId[unit.speciesId].name} is now your partner.`)
})

$('teamBtn').addEventListener('click', () => openModal('teamModal'))
$('titleTeamBtn').addEventListener('click', () => openModal('teamModal'))
$('teamClose').addEventListener('click', closeModals)
$('helpBtn').addEventListener('click', () => openModal('helpModal'))
$('helpClose').addEventListener('click', closeModals)
$('helpDone').addEventListener('click', closeModals)
teamModal.addEventListener('click', event => { if (event.target === teamModal) closeModals() })
helpModal.addEventListener('click', event => { if (event.target === helpModal) closeModals() })

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------
const soundBtn = $('soundBtn')
soundBtn.classList.toggle('muted', state.muted)
soundBtn.addEventListener('click', toggleMute)

function toggleMute() {
  state.muted = !state.muted
  audio.init()
  audio.setMuted(state.muted)
  if (!state.muted && state.mode !== 'title') audio.startMusic()
  soundBtn.classList.toggle('muted', state.muted)
  try { localStorage.setItem('wildbound-muted', state.muted ? '1' : '0') } catch {}
  showToast(state.muted ? 'Sound muted' : 'Sound on', 1500)
}

// ---------------------------------------------------------------------------
// Battle setup
// ---------------------------------------------------------------------------
let battle = null

const battleCallbacks = {
  getOrbs: () => state.orbs,
  useOrb: () => {
    if (!state.admin.infiniteOrbs) state.orbs = Math.max(0, state.orbs - 1)
    updateHud()
    if (battle) battle.setOrbs(state.orbs)
  },
  addOrbs: amount => {
    state.orbs += amount
    updateHud()
    if (battle) battle.setOrbs(state.orbs)
  },
  onCatch: enemy => {
    registerCatch(enemy)
  },
  onEnd: result => {
    finishBattle(result)
  }
}

battle = new Battle({
  audio,
  callbacks: battleCallbacks,
  viewport: { width: window.innerWidth, height: window.innerHeight }
})
battle.setViewport(window.innerWidth, window.innerHeight)
battle.setOrbs(state.orbs)

function registerCatch(enemy) {
  const species = byId[enemy.speciesId]
  const isNew = !state.owned.has(enemy.speciesId)
  state.owned.add(enemy.speciesId)
  if (state.party.length < 6) {
    const unit = createUnit(enemy.speciesId, enemy.level)
    state.party.push(unit)
    state.caughtMessage = `${species.name} joined your team!`
  } else if (isNew) {
    state.caughtMessage = `${species.name} registered in the Pokédex — team full.`
  } else {
    state.caughtMessage = `${species.name} was registered, but your team is full.`
  }
  if (isNew) {
    state.newlyCaught = species.name
  }
  updateHud()
}

function grantSpecies(speciesId, level = 5, addToParty = true) {
  const species = byId[speciesId]
  if (!species) return null
  const isNew = !state.owned.has(speciesId)
  state.owned.add(speciesId)
  let added = false
  if (addToParty && state.party.length < 6) {
    state.party.push(createUnit(speciesId, level))
    added = true
  }
  if (!teamModal.classList.contains('hidden')) renderTeam()
  updateHud()
  return { name: species.name, isNew, added }
}

function setPartyTo(ids, level = 10) {
  const valid = ids.filter(id => byId[id]).slice(0, 6)
  if (!valid.length) return false
  state.party.length = 0
  for (const id of valid) {
    state.owned.add(id)
    state.party.push(createUnit(id, level))
  }
  state.activeIndex = 0
  createFollower(state.party[0].speciesId)
  if (!teamModal.classList.contains('hidden')) renderTeam()
  updateHud()
  return true
}

function levelParty(level) {
  for (const unit of state.party) {
    const species = byId[unit.speciesId]
    unit.level = level
    unit.maxHp = Math.max(24, Math.round(species.baseHp + level * 3.4))
    unit.hp = unit.maxHp
  }
  if (!teamModal.classList.contains('hidden')) renderTeam()
  updateHud()
}

function spawnWildAt(speciesId, level = 5) {
  if (!byId[speciesId]) return null
  let spot = null
  for (let i = 0; i < 18; i++) {
    const angle = rand(0, Math.PI * 2)
    const radius = rand(2.6, 5.2)
    const x = player.position.x + Math.cos(angle) * radius
    const z = player.position.z + Math.sin(angle) * radius
    if (Math.hypot(x, z) > 72 || world.isBlocked(x, z, 0.5)) continue
    spot = { x, z }
    break
  }
  if (!spot) spot = { x: player.position.x + 2.8, z: player.position.z + 2.8 }
  return makeWild({ species: speciesId, x: spot.x, z: spot.z, level, radius: 1.8 })
}

function teleportPlayer(x, z) {
  player.position.set(x, 0, z)
  player.group.position.set(x, world.heightAt(x, z), z)
  player.jumpHeight = 0
  player.jumpVelocity = 0
  state.interaction = null
  camState.first = true
}

function startAdminBattle() {
  const candidates = wilds
    .filter(w => w.active)
    .sort((a, b) => Math.hypot(a.group.position.x - player.position.x, a.group.position.z - player.position.z) -
      Math.hypot(b.group.position.x - player.position.x, b.group.position.z - player.position.z))
  if (!candidates.length) return false
  closeModals()
  setTimeout(() => startBattle(candidates[0]), 90)
  return true
}

function startBattle(wild) {
  if (state.mode !== 'explore') return
  if (!wild || !wild.active) return
  const healthy = state.party.findIndex(unit => unit.hp > 0)
  if (healthy < 0) {
    showToast('Your team is exhausted. Rest at the campfire first.')
    return
  }
  if (state.party[state.activeIndex].hp <= 0) state.activeIndex = healthy
  state.mode = 'battle'
  state.currentWild = wild
  state.newlyCaught = null
  audio.init()
  audio.click()
  releaseJoystick()
  $('hud').classList.add('hidden')
  $('interaction').classList.add('hidden')
  $('toast').classList.remove('show')
  state.interaction = null
  const species = byId[wild.spawn.species]
  const level = wild.level
  let maxHp = Math.max(24, Math.round(species.baseHp + level * 3.4))
  if (state.admin.weakEnemies) maxHp = Math.max(8, Math.round(maxHp * 0.3))
  else if (state.admin.strongEnemies) maxHp = Math.round(maxHp * 2.2)
  const enemy = {
    speciesId: wild.spawn.species,
    level,
    maxHp,
    hp: maxHp
  }
  battle.admin = state.admin
  battle.setViewport(window.innerWidth, window.innerHeight)
  battle.setOrbs(state.orbs)
  battle.start(enemy, state.party[state.activeIndex])
}

function finishBattle(result) {
  $('battleUI').classList.add('hidden')
  $('hud').classList.remove('hidden')
  state.mode = 'explore'
  state.encounterCooldown = performance.now() + 4500
  const wild = state.currentWild
  const unit = result.unit || state.party[state.activeIndex]
  if ((result.result === 'win' || result.result === 'catch') && wild) despawnWild(wild)
  if (result.result === 'catch' && state.newlyCaught) {
    showObjective(`${state.newlyCaught} registered in the Pokédex!`, 3200)
    state.newlyCaught = null
  }
  if (result.result === 'catch') {
    showToast(state.caughtMessage || 'A new friend joined your team!')
    updateHud()
  } else if (result.result === 'win') {
    const saved = state.party[state.activeIndex]
    saved.wins = (saved.wins || 0) + 1
    if (saved.wins % 2 === 0) {
      saved.level += 1
      saved.maxHp += 7
      saved.hp = Math.min(saved.maxHp, saved.hp + 7)
      audio.levelUp()
      showToast(`${byId[saved.speciesId].name} grew to Lv ${saved.level}!`, 3000)
    } else {
      showToast('Victory! +3 Wild Orbs', 2300)
    }
    updateHud()
  } else if (result.result === 'lose') {
    for (const member of state.party) member.hp = member.maxHp
    player.position.set(0, 0, 8)
    player.group.position.set(0, world.heightAt(0, 8), 8)
    camState.yaw = 0.4
    showToast('You wake up at camp. Your team is fully healed.', 3200)
    updateHud()
  } else {
    showToast('You slipped back into the meadow.', 2000)
  }
  state.currentWild = null
  if (state.owned.size === SPECIES.length && !state.celebrated) {
    state.celebrated = true
    setTimeout(() => {
      showObjective(`EXPEDITION COMPLETE · All ${SPECIES.length} wild species discovered!`, 5200)
      audio.victory()
    }, 900)
  }
  if (!teamModal.classList.contains('hidden')) renderTeam()
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------
const firePos = world.settlement.firePos
const signPos = { x: 8.5, z: 1.5 }
const crystalPos = { x: 24, z: 4 }

function computeInteraction() {
  if (state.mode !== 'explore') return null
  let nearest = null
  let nearestDist = 3.6
  for (const wild of wilds) {
    if (!wild.active) continue
    const d = Math.hypot(player.position.x - wild.group.position.x, player.position.z - wild.group.position.z)
    if (d < nearestDist) {
      nearest = wild
      nearestDist = d
    }
  }
  if (nearest) {
    return {
      key: `wild-${nearest.uid}`,
      type: 'wild',
      wild: nearest,
      label: `Challenge ${byId[nearest.spawn.species].name}`,
      verb: 'Challenge'
    }
  }
  if (Math.hypot(player.position.x - firePos.x, player.position.z - firePos.z) < 4.4) {
    return { key: 'campfire', type: 'campfire', label: 'Rest at the campfire', verb: 'Rest' }
  }
  if (Math.hypot(player.position.x - signPos.x, player.position.z - signPos.z) < 3.2) {
    return { key: 'sign', type: 'sign', label: 'Read the meadow sign', verb: 'Read' }
  }
  if (Math.hypot(player.position.x - crystalPos.x, player.position.z - crystalPos.z) < 3.8) {
    return { key: 'crystal', type: 'crystal', label: 'Inspect the moss crystal', verb: 'Inspect' }
  }
  return null
}

function updateInteraction() {
  const next = computeInteraction()
  const changed = (state.interaction && state.interaction.key) !== (next && next.key)
  state.interaction = next
  if (!changed) return
  if (next) {
    interactionText.textContent = next.label
    interactionEl.classList.remove('hidden')
    actionLabel.textContent = next.verb
  } else {
    interactionEl.classList.add('hidden')
    actionLabel.textContent = 'Interact'
  }
}

function interact() {
  if (state.mode !== 'explore') return
  const current = computeInteraction()
  if (!current) {
    showToast('Wild creatures are wandering nearby. Follow the tall grass!')
    return
  }
  audio.init()
  if (current.type === 'wild') {
    audio.select()
    startBattle(current.wild)
    return
  }
  if (current.type === 'campfire') {
    let healed = false
    for (const unit of state.party) {
      if (unit.hp < unit.maxHp) healed = true
      unit.hp = unit.maxHp
    }
    audio.heal()
    spawnHealAura()
    showToast(healed ? 'Your whole team is fully rested!' : 'Everyone is already full of energy.')
    updateHud()
    return
  }
  audio.select()
  if (current.type === 'sign') {
    showToast(`WILDBOUND MEADOW · ${SPECIES.length} wild species roam here. The campfire restores your team.`)
  } else if (current.type === 'crystal') {
    showToast('A humming moss crystal. It feels warm, like a sleeping creature.')
  }
}

const healEffects = []
function spawnHealAura() {
  const group = new THREE.Group()
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 128
      const ctx = c.getContext('2d')
      const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62)
      g.addColorStop(0, 'rgba(205,255,185,0.95)')
      g.addColorStop(0.45, 'rgba(130,240,140,0.45)')
      g.addColorStop(1, 'rgba(80,220,120,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 128, 128)
      return new THREE.CanvasTexture(c)
    })(),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  }))
  glow.position.y = 1
  group.add(glow)
  group.position.set(player.position.x, world.heightAt(player.position.x, player.position.z), player.position.z)
  scene.add(group)
  healEffects.push({ group, glow, life: 1.5, maxLife: 1.5 })
}

function updateEffects(dt) {
  for (let i = healEffects.length - 1; i >= 0; i--) {
    const fx = healEffects[i]
    fx.life -= dt
    const t = 1 - fx.life / fx.maxLife
    fx.glow.scale.setScalar(1.4 + t * 4.2)
    fx.glow.material.opacity = (1 - t) * 0.9
    fx.group.position.y += dt * 0.4
    if (fx.life <= 0) {
      scene.remove(fx.group)
      fx.glow.material.map.dispose()
      fx.glow.material.dispose()
      healEffects.splice(i, 1)
    }
  }
}

function maybeGrassEncounter(dt) {
  if (state.mode !== 'explore') return
  if (performance.now() < state.encounterCooldown) return
  const inGrass = world.grassZones.some(zone =>
    Math.hypot(player.position.x - zone.x, player.position.z - zone.z) < zone.r
  )
  if (!inGrass || player.speed < 2.2) {
    state.grassTimer = Math.max(0, state.grassTimer - dt * 0.6)
    return
  }
  state.grassTimer += dt
  if (state.grassTimer > 2.0 && Math.random() < dt * 0.07) {
    const candidates = wilds.filter(w => w.active && Math.hypot(w.group.position.x - player.position.x, w.group.position.z - player.position.z) < 24)
    if (candidates.length) {
      state.grassTimer = 0
      startBattle(pick(candidates))
    }
  }
}

$('actionBtn').addEventListener('click', interact)
$('jumpBtn').addEventListener('click', () => { jumpPressed = true })

// ---------------------------------------------------------------------------
// Start / loop
// ---------------------------------------------------------------------------
const titleScreen = $('titleScreen')
const hud = $('hud')

function startGame() {
  if (state.mode !== 'title') return
  state.mode = 'explore'
  audio.init()
  audio.startMusic()
  audio.select()
  titleScreen.classList.add('hidden')
  hud.classList.remove('hidden')
  camState.yaw = 0.12
  camState.pitch = 0.24
  camState.distance = 8.8
  player.facing = Math.PI
  player.group.rotation.y = Math.PI
  updateHud()
  setTimeout(() => showObjective(`MEADOW EXPEDITION · Catch all ${SPECIES.length} wild species`, 4200), 650)
}
$('playBtn').addEventListener('click', startGame)

window.addEventListener('resize', onResize)
function onResize() {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8))
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.fov = camera.aspect < 0.8 ? 60 : 52
  camera.updateProjectionMatrix()
  battle.setViewport(width, height)
}

const clock = new THREE.Clock()
let frameCount = 0

function loop() {
  requestAnimationFrame(loop)
  const dt = Math.min(0.05, clock.getDelta())
  const time = clock.elapsedTime
  frameCount++

  if (state.mode === 'battle') {
    battle.update(dt)
    renderer.render(battle.scene, battle.camera)
  } else {
    const input = readInput()
    const movingInfo = player.update(dt, input, camState.yaw + Math.PI)
    updateWilds(dt, time)
    updateFollower(dt, time)
    world.update(dt, time)
    updateEffects(dt)
    updateCamera(dt, time)
    if (state.mode === 'explore') {
      updateInteraction()
      maybeGrassEncounter(dt)
    }
    renderer.render(scene, camera)
  }

  if (frameCount === 2) {
    $('loader').classList.add('hidden')
    setTimeout(() => { const l = $('loader'); if (l) l.remove() }, 800)
  }
}

updateHud()
updateCamera(1 / 60, 0)
initAdmin({
  state, world, player, scene, camState, audio, wilds, $, byId,
  createUnit, createFollower, updateHud, renderTeam, closeModals,
  grantSpecies, setPartyTo, levelParty, spawnWildAt, startAdminBattle, teleportPlayer, activeUnit,
  getBattle: () => battle,
  getFollower: () => follower,
  despawnWild,
  respawnWild,
  teamModalOpen: () => !teamModal.classList.contains('hidden')
})
loop()
