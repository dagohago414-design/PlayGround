import * as THREE from 'three';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createCreature, createThumbnails, disposeCreature } from './creature.js';
import { SPECIES, SPAWNS, STARTER, makeMon, maxHpOf, xpToNext } from './data.js';
import { UI } from './ui.js';
import { GameAudio } from './audio.js';
import { Battle } from './battle.js';
import { clamp, damp, rand, randInt, storageGet, storageSet, updateTweens, smoothstep } from './utils.js';

const SAVE_KEY = 'wildbound.save.v2';
const isTouch = window.matchMedia('(pointer: coarse)').matches;
const isSmall = window.innerWidth < 760;

const container = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.8 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
renderer.domElement.style.touchAction = 'none';

const scene = new THREE.Scene();
const world = createWorld(scene, renderer);
if (isSmall) {
  world.sun.shadow.mapSize.set(1024, 1024);
  if (world.sun.shadow.map) { world.sun.shadow.map.dispose(); world.sun.shadow.map = null; }
}
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 300);

const audio = new GameAudio();
const ui = new UI(audio);
const thumbs = createThumbnails(Object.keys(SPECIES), 176);
ui.setThumbs(thumbs);

const save = storageGet(SAVE_KEY, null);
let party;
let leadUid;
let caughtSet;
let questCelebrated = false;
if (save && Array.isArray(save.party) && save.party.length) {
  party = save.party.filter(m => SPECIES[m.species]).map(m => ({
    ...m,
    uid: m.uid || Math.random().toString(36).slice(2, 9),
    level: Math.max(1, Math.min(50, m.level || 3)),
    hp: Math.max(1, Math.min(maxHpOf(m), m.hp ?? maxHpOf(m)))
  }));
  leadUid = party.some(m => m.uid === save.leadUid) ? save.leadUid : party[0].uid;
  caughtSet = new Set(Array.isArray(save.caught) ? save.caught : [party[0].species]);
  questCelebrated = Boolean(save.questCelebrated);
} else {
  const starter = makeMon(STARTER.species, STARTER.level);
  party = [starter];
  leadUid = starter.uid;
  caughtSet = new Set([starter.species]);
}
let savePos = save?.pos;
if (!savePos) savePos = { x: 0, z: 5.5 };

const player = createPlayer();
player.root.position.set(savePos.x, world.heightAt(savePos.x, savePos.z), savePos.z);
player.root.rotation.y = world.startRotation;
scene.add(player.root);

let companion = null;
function rebuildCompanion() {
  if (companion) { disposeCreature(companion); companion = null; }
  const lead = party.find(m => m.uid === leadUid) || party[0];
  if (!lead) return;
  companion = createCreature(lead.species, { scale: 0.5 });
  companion.root.position.copy(player.root.position).add(new THREE.Vector3(-1.05, 0, 0.9));
  companion.spawnT = 3;
  companion.visual.scale.setScalar(companion.scale);
  scene.add(companion.root);
}
rebuildCompanion();

const wilds = [];
const HOVER = new Set(['voltbat', 'wispling']);

function spawnWild(entry, initial = false) {
  const level = randInt(entry.levels[0], entry.levels[1]);
  const mon = makeMon(entry.species, level);
  const creature = createCreature(entry.species, { scale: 1 });
  const a = rand(0, Math.PI * 2);
  const d = initial ? rand(0, Math.min(1.0, entry.radius)) : rand(0, entry.radius);
  let x = entry.x + Math.cos(a) * d;
  let z = entry.z + Math.sin(a) * d;
  if (world.isWater(x, z)) { x = entry.x; z = entry.z; }
  const baseY = world.heightAt(x, z) + (HOVER.has(entry.species) ? 0.55 : 0);
  creature.root.position.set(x, baseY, z);
  creature.root.rotation.y = rand(0, Math.PI * 2);
  creature.spawnT = 0.001;
  creature.root.userData.wildUid = mon.uid;
  scene.add(creature.root);
  const wild = {
    uid: mon.uid, species: entry.species, mon, creature, entry,
    anchor: new THREE.Vector3(entry.x, 0, entry.z),
    pos: new THREE.Vector3(x, baseY, z),
    target: new THREE.Vector3(x, baseY, z),
    timer: rand(1, 4), active: true, cooldown: 0, respawn: 0,
    phase: rand(0, 10), angle: creature.root.rotation.y, moving: false, hover: HOVER.has(entry.species)
  };
  creature.root.userData.wild = wild;
  wilds.push(wild);
  return wild;
}
for (const entry of SPAWNS) spawnWild(entry, true);

const battle = new Battle({
  renderer, audio, ui, thumbs,
  onEnd: result => resolveBattle(result)
});

let mode = 'field';
let currentWild = null;
let cameraYaw = 0.04;
let cameraPitch = 0.285;
let cameraDist = isSmall ? 10.2 : 9.4;
let cameraTarget = new THREE.Vector3().copy(player.root.position).add(new THREE.Vector3(0, 1.25, 0));
let nearbyWild = null;
let playerRotation = player.root.rotation.y;
let stepTimer = 0;
let saveTimer = 0;
let minimapTimer = 0;
let lastMoveMag = 0;
let dragging = null;
let pinch = null;
let started = false;

function resetCamera(immediate = false) {
  const target = player.root.position.clone().add(new THREE.Vector3(0, 1.25, 0));
  const horizontal = Math.cos(cameraPitch) * cameraDist;
  const pos = new THREE.Vector3(
    target.x + Math.sin(cameraYaw) * horizontal,
    target.y + Math.sin(cameraPitch) * cameraDist,
    target.z + Math.cos(cameraYaw) * horizontal
  );
  if (immediate) camera.position.copy(pos);
  cameraTarget.copy(target);
  camera.lookAt(target);
}
resetCamera(true);

const keys = new Set();
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', ' '].includes(k)) e.preventDefault();
  keys.add(k);
  if (k === ' ' && !e.repeat) tryEncounter();
  if (k === 'e' && !e.repeat) tryEncounter();
  if (k === 'tab' && !e.repeat) { e.preventDefault(); ui.openPanel('team'); }
  if (k === 'j' && !e.repeat) ui.openPanel('guide');
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

const stickEl = document.getElementById('stick');
const joystickEl = document.getElementById('joystick');
let joy = { x: 0, y: 0, active: false, id: null, cx: 0, cy: 0 };
const JOY_RADIUS = 38;

function updateJoy(e) {
  const dx = e.clientX - joy.cx;
  const dy = e.clientY - joy.cy;
  const len = Math.hypot(dx, dy);
  const scale = len > JOY_RADIUS ? JOY_RADIUS / len : 1;
  const x = dx * scale, y = dy * scale;
  joy.x = x / JOY_RADIUS;
  joy.y = y / JOY_RADIUS;
  stickEl.style.transform = `translate(${x}px, ${y}px)`;
}
joystickEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  audio.init();
  const rect = joystickEl.getBoundingClientRect();
  joy.active = true;
  joy.id = e.pointerId;
  joy.cx = rect.left + rect.width / 2;
  joy.cy = rect.top + rect.height / 2;
  joystickEl.classList.add('active');
  joystickEl.setPointerCapture(e.pointerId);
  updateJoy(e);
});
joystickEl.addEventListener('pointermove', e => {
  if (!joy.active || e.pointerId !== joy.id) return;
  e.preventDefault();
  updateJoy(e);
});
function endJoy(e) {
  if (!joy.active || (e && e.pointerId !== joy.id)) return;
  joy.active = false;
  joy.x = joy.y = 0;
  joystickEl.classList.remove('active');
  stickEl.style.transform = 'translate(0px, 0px)';
  try { joystickEl.releasePointerCapture(e.pointerId); } catch {}
}
joystickEl.addEventListener('pointerup', endJoy);
joystickEl.addEventListener('pointercancel', endJoy);
joystickEl.addEventListener('lostpointercapture', endJoy);

const raycaster = new THREE.Raycaster();
function tapWorld(clientX, clientY) {
  if (mode !== 'field') return;
  const rect = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(ndc, camera);
  const roots = wilds.filter(w => w.active && w.creature).map(w => w.creature.root);
  const hits = raycaster.intersectObjects(roots, true);
  if (!hits.length) return;
  let obj = hits[0].object;
  while (obj && !obj.userData.wild) obj = obj.parent;
  const wild = obj?.userData.wild;
  if (!wild || !wild.active) return;
  const d = player.root.position.distanceTo(wild.pos);
  if (d <= 7.2) {
    startBattle(wild);
  } else {
    ui.toast(`A wild ${SPECIES[wild.species].name} is ${Math.round(d)}m away — walk closer`);
  }
}

renderer.domElement.addEventListener('pointerdown', e => {
  audio.init();
  if (e.pointerType === 'touch' && e.isPrimary === false) return;
  dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: 0 };
  renderer.domElement.setPointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointermove', e => {
  if (pinch) return;
  if (!dragging || e.pointerId !== dragging.id) return;
  const dx = e.clientX - dragging.lastX;
  const dy = e.clientY - dragging.lastY;
  dragging.lastX = e.clientX;
  dragging.lastY = e.clientY;
  dragging.moved += Math.abs(dx) + Math.abs(dy);
  if (dragging.moved > 5) {
    cameraYaw -= dx * 0.006;
    cameraPitch = clamp(cameraPitch + dy * 0.004, 0.1, 0.72);
  }
});
renderer.domElement.addEventListener('pointerup', e => {
  if (!dragging || e.pointerId !== dragging.id) return;
  const moved = dragging.moved;
  dragging = null;
  if (moved < 8) tapWorld(e.clientX, e.clientY);
});
renderer.domElement.addEventListener('pointercancel', () => { dragging = null; });
renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  cameraDist = clamp(cameraDist + e.deltaY * 0.006, 6.2, 14);
}, { passive: false });

window.addEventListener('touchmove', e => {
  if (e.touches.length === 2) e.preventDefault();
}, { passive: false });

document.getElementById('btn-battle').addEventListener('click', () => {
  audio.init();
  audio.sfx('click');
  tryEncounter();
});
document.getElementById('btn-encounter').addEventListener('click', () => {
  audio.init();
  if (nearbyWild) startBattle(nearbyWild);
});

window.addEventListener('pointerdown', () => audio.init(), { once: true });

function tryEncounter() {
  if (mode !== 'field') return;
  if (nearbyWild && nearbyWild.active) startBattle(nearbyWild);
  else {
    ui.toast('No wild beast close enough — follow the sparkling nameplates');
    audio.sfx('click');
  }
}

function startBattle(wild) {
  if (mode !== 'field' || !wild || !wild.active) return;
  const allDown = party.every(m => m.hp <= 0);
  if (allDown) {
    party.forEach(m => { m.hp = maxHpOf(m); m.status = null; });
    ui.toast('Your team rested at the campfire and is ready again');
  }
  mode = 'battle';
  currentWild = wild;
  nearbyWild = null;
  ui.setNearby(null);
  ui.closePanel();
  audio.sfx('encounter');
  battle.start(party, wild.mon);
}

function resolveBattle(result) {
  mode = 'field';
  const wild = currentWild;
  currentWild = null;
  if (wild) {
    wild.cooldown = 6;
    if (result.type === 'win' || result.type === 'catch') retireWild(wild);
    else if (result.type === 'flee') {
      wild.mon.hp = maxHpOf(wild.mon);
      wild.mon.status = null;
      wild.cooldown = 9;
    }
  }
  if (result.type === 'catch') {
    if (result.caught) {
      const isNew = !caughtSet.has(result.caught);
      caughtSet.add(result.caught);
      ui.updateQuest(caughtSet.size);
      if (isNew) {
        ui.toast(`Field guide updated: ${SPECIES[result.caught].name}!`);
        audio.sfx('success');
      }
    }
  }
  if (result.type === 'defeat') {
    party.forEach(m => { m.hp = maxHpOf(m); m.status = null; });
    player.root.position.set(0, world.heightAt(0, 5.5), 5.5);
    ui.toast('Your team was healed at the meadow campfire');
  }
  if (caughtSet.size >= 6 && !questCelebrated) {
    questCelebrated = true;
    ui.confetti(110);
    setTimeout(() => ui.toast('Meadow Guardian! Every wild beast has joined your field guide.'), 700);
  }
  const lead = party.find(m => m.uid === leadUid);
  if (!lead || lead.hp <= 0) {
    const alive = party.find(m => m.hp > 0) || party[0];
    leadUid = alive.uid;
  }
  ui.setPartyCount(party.length);
  ui.updateQuest(caughtSet.size);
  rebuildCompanion();
  saveGame();
  if (!ui.el.panel.classList.contains('hidden')) {
    ui.renderTeam(party, leadUid, setLead);
    ui.renderGuide(caughtSet, party);
  }
}

function retireWild(wild) {
  wild.active = false;
  wild.respawn = 26;
  if (wild.creature) {
    disposeCreature(wild.creature);
    wild.creature = null;
  }
}

function respawnWilds(dt) {
  for (const w of wilds) {
    if (w.cooldown > 0) w.cooldown -= dt;
    if (w.active) continue;
    w.respawn -= dt;
    if (w.respawn <= 0) {
      const idx = wilds.indexOf(w);
      if (idx >= 0) wilds.splice(idx, 1);
      spawnWild(w.entry, false);
    }
  }
}

function setLead(uid) {
  if (!party.some(m => m.uid === uid)) return;
  leadUid = uid;
  rebuildCompanion();
  ui.renderTeam(party, leadUid, setLead);
  ui.toast(`${SPECIES[party.find(m => m.uid === uid).species].name} is now your lead`);
  saveGame();
}

function saveGame() {
  if (resetting) return;
  storageSet(SAVE_KEY, {
    party, leadUid, caught: [...caughtSet], questCelebrated,
    pos: { x: player.root.position.x, z: player.root.position.z },
    savedAt: Date.now()
  });
}

let resetting = false;
ui.onReset = () => {
  resetting = true;
  try { localStorage.removeItem(SAVE_KEY); } catch {}
  location.reload();
};
ui.onLeadChange = setLead;

if (party.some(m => m.hp <= 0)) {
  // keep fainted state after reload, but never start with a fully fainted team
  if (party.every(m => m.hp <= 0)) party.forEach(m => { m.hp = maxHpOf(m); });
}
ui.updateQuest(caughtSet.size);
ui.setPartyCount(party.length);
ui.renderTeam(party, leadUid, setLead);
ui.renderGuide(caughtSet, party);
ui.showLocation();
updateHUD(0);
updateNameplates();

let elapsed = 0;
let lastTime = performance.now();
let lastMinimap = 0;

function updatePlayer(dt, t) {
  let ix = joy.x, iy = joy.y;
  if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
  if (keys.has('d') || keys.has('arrowright')) ix += 1;
  if (keys.has('w') || keys.has('arrowup')) iy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) iy += 1;
  const mag = Math.min(1, Math.hypot(ix, iy));
  if (mag > 1) { ix /= mag; iy /= mag; }
  const strength = clamp(mag, 0, 1);
  lastMoveMag = strength;

  const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
  const move = new THREE.Vector3().addScaledVector(forward, -iy).addScaledVector(right, ix);
  if (move.lengthSq() > 0.0004) move.normalize();
  const sprint = keys.has('shift') ? 1.32 : 1;
  const speed = 5.9 * sprint * strength;
  const oldX = player.root.position.x, oldZ = player.root.position.z;

  if (strength > 0.06) {
    const nx = oldX + move.x * speed * dt;
    const nz = oldZ + move.z * speed * dt;
    const limit = world.limit - 6;
    if (!world.isWater(nx, oldZ) && Math.hypot(nx, oldZ) < limit) player.root.position.x = nx;
    if (!world.isWater(player.root.position.x, nz) && Math.hypot(player.root.position.x, nz) < limit) player.root.position.z = nz;
    const targetRot = Math.atan2(move.x, move.z);
    let diff = ((targetRot - playerRotation + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    playerRotation += diff * Math.min(1, dt * 13);
    player.root.rotation.y = playerRotation;
  }
  const groundY = world.heightAt(player.root.position.x, player.root.position.z);
  player.root.position.y = damp(player.root.position.y, groundY, 18, dt);
  player.animate(t, strength > 0.08, strength * sprint, dt);

  if (strength > 0.15) {
    player.root.position.y += Math.abs(Math.sin(t * 10)) * 0.015;
    stepTimer -= dt;
    if (stepTimer <= 0) { audio.sfx('step'); stepTimer = 0.34 / (sprint * Math.max(0.7, strength)); }
  }

  if (companion) {
    const side = new THREE.Vector3(Math.cos(playerRotation) * -0.92, 0, Math.sin(playerRotation) * 0.92);
    const back = new THREE.Vector3(-Math.sin(playerRotation) * 1.5, 0, -Math.cos(playerRotation) * 1.5);
    const target = player.root.position.clone().add(back).add(side);
    const cy = world.heightAt(target.x, target.z) + (companion.parts?.hover ? 0.55 : 0);
    target.y = cy;
    companion.root.position.x = damp(companion.root.position.x, target.x, strength > 0.1 ? 5.5 : 2.6, dt);
    companion.root.position.z = damp(companion.root.position.z, target.z, strength > 0.1 ? 5.5 : 2.6, dt);
    companion.root.position.y = damp(companion.root.position.y, target.y, 8, dt);
    const toPlayer = Math.atan2(player.root.position.x - companion.root.position.x, player.root.position.z - companion.root.position.z);
    let diff = ((toPlayer - companion.root.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    companion.root.rotation.y += diff * Math.min(1, dt * 5);
    companion.animate(t, false);
  }

  if (Math.abs(oldX - player.root.position.x) + Math.abs(oldZ - player.root.position.z) > 0.02) saveTimer += dt;
  if (saveTimer > 4) { saveTimer = 0; saveGame(); }
}

function updateCamera(dt) {
  const target = player.root.position.clone().add(new THREE.Vector3(0, 1.27, 0));
  const horizontal = Math.cos(cameraPitch) * cameraDist;
  const desired = new THREE.Vector3(
    target.x + Math.sin(cameraYaw) * horizontal,
    target.y + Math.sin(cameraPitch) * cameraDist,
    target.z + Math.cos(cameraYaw) * horizontal
  );
  const ground = world.heightAt(desired.x, desired.z) + 1.7;
  if (desired.y < ground) desired.y = ground;
  const lambda = 7.5;
  camera.position.x = damp(camera.position.x, desired.x, lambda, dt);
  camera.position.y = damp(camera.position.y, desired.y, lambda, dt);
  camera.position.z = damp(camera.position.z, desired.z, lambda, dt);
  cameraTarget.x = damp(cameraTarget.x, target.x, 10, dt);
  cameraTarget.y = damp(cameraTarget.y, target.y, 10, dt);
  cameraTarget.z = damp(cameraTarget.z, target.z, 10, dt);
  camera.lookAt(cameraTarget);
}

function updateWilds(dt, t) {
  nearbyWild = null;
  let nearest = 7.6;
  for (const w of wilds) {
    if (!w.active || !w.creature) continue;
    const distToPlayer = player.root.position.distanceTo(w.pos);
    if (distToPlayer < nearest && w.cooldown <= 0) { nearest = distToPlayer; nearbyWild = w; }
    if (w.cooldown > 0) { w.moving = false; }
    w.timer -= dt;
    if (w.timer <= 0) {
      w.timer = rand(2.6, 6.2);
      const a = rand(0, Math.PI * 2);
      const d = rand(0.5, w.entry.radius);
      const tx = w.anchor.x + Math.cos(a) * d;
      const tz = w.anchor.z + Math.sin(a) * d;
      if (!world.isWater(tx, tz)) w.target.set(tx, 0, tz);
    }
    if (w.cooldown <= 0) {
      const dx = w.target.x - w.pos.x, dz = w.target.z - w.pos.z;
      const d = Math.hypot(dx, dz);
      w.moving = d > 0.35 && distToPlayer > 2.2;
      if (w.moving) {
        const sp = w.species === 'rocklet' ? 0.55 : w.species === 'voltbat' ? 1.35 : 0.9;
        const nx = w.pos.x + (dx / d) * sp * dt;
        const nz = w.pos.z + (dz / d) * sp * dt;
        if (!world.isWater(nx, nz)) { w.pos.x = nx; w.pos.z = nz; }
        w.angle = Math.atan2(dx, dz);
      }
    }
    if (!w.moving && distToPlayer < 9) {
      const toP = Math.atan2(player.root.position.x - w.pos.x, player.root.position.z - w.pos.z);
      let diff = ((toP - w.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      w.angle += diff * Math.min(1, dt * 3);
    }
    const ground = world.heightAt(w.pos.x, w.pos.z);
    const hover = w.hover ? 0.55 + Math.sin(t * 1.8 + w.phase) * 0.12 : 0;
    w.pos.y = damp(w.pos.y, ground + hover, 10, dt);
    w.creature.root.position.copy(w.pos);
    let diff = ((w.angle - w.creature.root.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    w.creature.root.rotation.y += diff * Math.min(1, dt * 6);
    w.creature.animate(t + w.phase, w.moving, 1);
    if (distToPlayer < 7 && w.cooldown <= 0) {
      w.creature.setHighlight(true);
    } else {
      w.creature.setHighlight(false);
    }
  }
  ui.setNearby(nearbyWild ? nearbyWild.mon : null);
}

function updateNameplates() {
  const w = window.innerWidth, h = window.innerHeight;
  const items = [];
  for (const wild of wilds) {
    if (!wild.active || !wild.creature) continue;
    const dist = player.root.position.distanceTo(wild.pos);
    if (dist > 32) continue;
    const p = wild.pos.clone();
    p.y += wild.hover ? 1.55 : 1.55;
    p.project(camera);
    if (p.z > 1 || p.z < -1) continue;
    const x = (p.x * 0.5 + 0.5) * w;
    const y = (-p.y * 0.5 + 0.5) * h;
    if (x < -60 || x > w + 60 || y < -40 || y > h + 40) continue;
    items.push({
      uid: wild.uid, species: wild.species, level: wild.mon.level,
      x, y, near: dist < 7.6,
      opacity: clamp(1.25 - dist / 34, 0.2, 1)
    });
  }
  ui.updateNameplates(items);
}

function updateHUD(t) {
  const p = player.root.position;
  ui.drawMinimap({ x: p.x, z: p.z, yaw: playerRotation }, wilds.filter(w => w.active).map(w => ({ uid: w.uid, species: w.species, x: w.pos.x, z: w.pos.z })), nearbyWild?.uid);
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  elapsed += dt;
  updateTweens(dt);

  if (mode === 'field') {
    updatePlayer(dt, elapsed);
    updateCamera(dt);
    updateWilds(dt, elapsed);
    respawnWilds(dt);
    world.update(dt, elapsed);
    updateNameplates();
    minimapTimer += dt;
    if (minimapTimer > 0.08) { minimapTimer = 0; updateHUD(elapsed); }
    renderer.render(scene, camera);
  } else {
    battle.update(dt, elapsed);
    renderer.render(battle.scene, battle.camera);
  }

  if (!started) {
    started = true;
    setTimeout(() => ui.hideLoading(), 120);
  }
}
requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  battle.resize();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && audio.ctx) audio.ctx.suspend?.();
  else if (!document.hidden && audio.ctx) audio.ctx.resume?.();
});

window.addEventListener('beforeunload', saveGame);
setInterval(saveGame, 15000);
