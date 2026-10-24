import * as THREE from 'three';
import { SPECIES, MOVES, TYPES, effectiveness, statsOf, maxHpOf, xpToNext, makeMon } from './data.js';
import { createCreature, disposeCreature } from './creature.js';
import { rand, randInt, wait, tween, easeOutCubic, easeInCubic, easeOutBack, clamp, chance } from './utils.js';

const MOVE_ICONS = {
  paw: '<path d="M8 13a4 4 0 0 0 8 0c0-2.5-1.7-4.5-4-4.5S8 10.5 8 13Z"/><circle cx="6" cy="7" r="1.7"/><circle cx="10" cy="5.5" r="1.7"/><circle cx="14" cy="5.5" r="1.7"/><circle cx="18" cy="7" r="1.7"/>',
  flame: '<path d="M12 3c1 3.2 5 4.6 5 9a5 5 0 0 1-10 0c0-2 .8-3.4 1.8-4.6.5 1.5 1.3 2.1 2.2 2.4C10.4 7.6 11 5 12 3Z"/>',
  drop: '<path d="M12 3.5S6.5 10 6.5 14a5.5 5.5 0 0 0 11 0C17.5 10 12 3.5 12 3.5Z"/>',
  wave: '<path d="M3 9c2-2 4 2 6 0s4 2 6 0 4 2 6 0M3 15c2-2 4 2 6 0s4 2 6 0 4 2 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  leaf: '<path d="M20 4C11 4 5 8 5 15c0 2.7 2.2 5 5 5 7 0 10-7 10-16Z"/><path d="M5 20c3-6 7-9 12-11" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  bolt: '<path d="M13 2 5 14h5l-1 8 8-12h-5l1-8Z"/>',
  rock: '<path d="m12 3 7 4 2 8-6 5-8-2-3-7 4-6Z"/>',
  star: '<path d="m12 2 2.7 6.3 6.8.6-5.2 4.5 1.6 6.6L12 16.5 6.1 20l1.6-6.6L2.5 8.9l6.8-.6Z"/>',
  heal: '<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.3A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z"/><path d="M12 9v6M9 12h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  fang: '<path d="m5 5 5 3 2 9-4-4-3-2Zm14 0-5 3-2 9 4-4 3-2Z"/>'
};

const moveIcon = (name) => `<svg viewBox="0 0 24 24" fill="currentColor">${MOVE_ICONS[name] || MOVE_ICONS.paw}</svg>`;

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function buildArena(scene) {
  const group = new THREE.Group();
  const uniforms = {
    top: { value: new THREE.Color('#5aa9e8') },
    mid: { value: new THREE.Color('#b9e7ec') },
    low: { value: new THREE.Color('#f9eccb') }
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(90, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms,
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP;
        void main(){ vec3 d=normalize(vP); float h=clamp(d.y,0.0,1.0); vec3 c=mix(low,mid,smoothstep(0.0,0.2,h)); c=mix(c,top,smoothstep(0.15,0.75,h)); gl_FragColor=vec4(c,1.0); }`
    })
  );
  scene.add(sky);

  scene.fog = new THREE.Fog('#cfe9e1', 26, 70);

  const hemi = new THREE.HemisphereLight('#dcf6ff', '#57805a', 1.65);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff0cd', 2.8);
  key.position.set(6, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0007;
  scene.add(key);
  const rim = new THREE.PointLight('#8fd8ff', 20, 22, 2);
  rim.position.set(-5, 5, -5);
  scene.add(rim);
  const warm = new THREE.PointLight('#ffc57a', 16, 20, 2);
  warm.position.set(6, 3, 4);
  scene.add(warm);

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x8e7b62, roughness: 0.95, flatShading: true });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 6.4, 2.2, 20), baseMat);
  base.position.y = -1.0;
  base.receiveShadow = true;
  group.add(base);
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 8.5, 0.45, 40),
    new THREE.MeshStandardMaterial({ color: 0x78bd6d, roughness: 0.9 })
  );
  top.position.y = 0.03;
  top.receiveShadow = true;
  group.add(top);
  const sand = new THREE.Mesh(
    new THREE.CircleGeometry(5.1, 40),
    new THREE.MeshStandardMaterial({ color: 0xd8c590, roughness: 0.95 })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = 0.27;
  sand.receiveShadow = true;
  group.add(sand);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5.3, 0.09, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0xf3e4b5, roughness: 0.6, emissive: 0xffe9a5, emissiveIntensity: 0.2 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.29;
  group.add(ring);

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8271, roughness: 1, flatShading: true });
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x8fe4dc, roughness: 0.4, emissive: 0x3bb9af, emissiveIntensity: 0.55, flatShading: true });
  const crystalMat2 = new THREE.MeshStandardMaterial({ color: 0xffd792, roughness: 0.4, emissive: 0xffb347, emissiveIntensity: 0.5, flatShading: true });
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rand(-0.12, 0.12);
    const d = rand(6.8, 8.1);
    if (i % 3 === 0) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(rand(0.16, 0.32), rand(0.8, 1.8), 5), i % 2 ? crystalMat : crystalMat2);
      crystal.position.set(Math.cos(a) * d, rand(0.5, 0.9), Math.sin(a) * d);
      crystal.rotation.set(rand(-0.2, 0.2), rand(0, 6), rand(-0.2, 0.2));
      crystal.castShadow = true;
      group.add(crystal);
    } else {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rand(0.25, 0.55), 0), rockMat);
      rock.position.set(Math.cos(a) * d, rand(0.28, 0.45), Math.sin(a) * d);
      rock.rotation.set(rand(0, 3), rand(0, 6), rand(0, 3));
      rock.castShadow = true;
      group.add(rock);
    }
  }

  const grassGeo = new THREE.ConeGeometry(0.055, 0.36, 3, 1, true);
  grassGeo.translate(0, 0.18, 0);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.95 });
  const grass = new THREE.InstancedMesh(grassGeo, grassMat, 180);
  const dummy = new THREE.Object3D();
  const grassColor = new THREE.Color();
  let gi = 0;
  for (let i = 0; i < 180; i++) {
    const a = rand(0, Math.PI * 2), d = rand(5.8, 8.3);
    dummy.position.set(Math.cos(a) * d, 0.28, Math.sin(a) * d);
    dummy.rotation.set(0, rand(0, 6), rand(-0.16, 0.16));
    dummy.scale.set(rand(0.8, 1.4), rand(0.65, 1.25), rand(0.8, 1.4));
    dummy.updateMatrix();
    grass.setMatrixAt(gi, dummy.matrix);
    grassColor.setHSL(0.27 + rand(-0.02, 0.04), rand(0.24, 0.44), rand(0.44, 0.62));
    grass.setColorAt(gi, grassColor);
    gi++;
  }
  grass.count = gi;
  group.add(grass);

  // floating islands in the distance
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x7f9f7d, roughness: 1, flatShading: true });
  const islandRock = new THREE.MeshStandardMaterial({ color: 0x948572, roughness: 1, flatShading: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    const d = rand(18, 28);
    const isle = new THREE.Group();
    isle.position.set(Math.cos(a) * d, rand(7, 15), Math.sin(a) * d);
    const topM = new THREE.Mesh(new THREE.CylinderGeometry(rand(2, 3.6), rand(1.6, 2.8), 0.6, 8), islandMat);
    isle.add(topM);
    const bottom = new THREE.Mesh(new THREE.ConeGeometry(rand(1.6, 2.8), rand(3, 6), 7), islandRock);
    bottom.position.y = -2;
    bottom.rotation.z = Math.PI;
    isle.add(bottom);
    const tree = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.2, 7), new THREE.MeshStandardMaterial({ color: 0x4f9460, roughness: 0.9, flatShading: true }));
    tree.position.y = 1.3;
    isle.add(tree);
    isle.userData = { baseY: isle.position.y, phase: rand(0, 6) };
    group.add(isle);
  }

  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.8, emissive: 0xe6f5f3, emissiveIntensity: 0.15 });
  for (let i = 0; i < 7; i++) {
    const cloud = new THREE.Group();
    cloud.position.set(rand(-35, 35), rand(14, 24), rand(-38, -18));
    for (let j = 0; j < 4; j++) {
      const lobe = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), cloudMat);
      lobe.position.set(rand(-3, 3), rand(-1, 1), rand(-1, 1));
      lobe.scale.set(rand(2, 4), rand(1, 2), rand(1.4, 2.5));
      cloud.add(lobe);
    }
    group.add(cloud);
  }

  scene.add(group);
  return { group, ring, top, sand, sky, key, rim, warm };
}

class BattleFX {
  constructor(scene) {
    this.scene = scene;
    this.texture = makeGlowTexture();
    this.bits = [];
    this.ambient = [];
    for (let i = 0; i < 26; i++) {
      const mat = new THREE.SpriteMaterial({ map: this.texture, color: i % 3 ? 0xfff4c9 : 0xa8ffee, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(rand(0.04, 0.12));
      sprite.position.set(rand(-6, 6), rand(0.8, 5.5), rand(-3, 5));
      sprite.userData = { phase: rand(0, 6), speed: rand(0.3, 1.0), baseY: sprite.position.y, baseX: sprite.position.x };
      scene.add(sprite);
      this.ambient.push(sprite);
    }
  }
  burst(pos, color = '#ffe6a0', count = 18, power = 1) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({ map: this.texture, color, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(rand(0.08, 0.24) * power);
      sprite.position.copy(pos);
      const angle = rand(0, Math.PI * 2), elev = rand(-0.4, 1);
      const speed = rand(18, 46) * power;
      const vel = new THREE.Vector3(Math.cos(angle) * speed, elev * speed, Math.sin(angle) * speed);
      this.scene.add(sprite);
      this.bits.push({ sprite, vel, life: rand(0.35, 0.75), max: 0.75, gravity: -38 });
    }
  }
  ring(pos, color = '#fff3bc') {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.32, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    mesh.position.y = 0.3;
    this.scene.add(mesh);
    this.bits.push({ sprite: mesh, life: 0.55, max: 0.55, ring: true });
  }
  update(dt, t) {
    this.ambient.forEach(s => {
      s.position.y = s.userData.baseY + Math.sin(t * s.userData.speed + s.userData.phase) * 0.7;
      s.position.x = s.userData.baseX + Math.cos(t * s.userData.speed * 0.6 + s.userData.phase) * 0.5;
      s.material.opacity = 0.18 + Math.sin(t * 1.5 + s.userData.phase) * 0.18;
    });
    for (let i = this.bits.length - 1; i >= 0; i--) {
      const b = this.bits[i];
      b.life -= dt;
      if (b.ring) {
        const p = 1 - b.life / b.max;
        b.sprite.scale.setScalar(1 + p * 6);
        b.sprite.material.opacity = (1 - p) * 0.8;
      } else {
        b.vel.y += b.gravity * dt;
        b.sprite.position.addScaledVector(b.vel, dt);
        b.sprite.material.opacity = clamp(b.life / b.max, 0, 1);
        b.sprite.scale.multiplyScalar(1 - dt * 0.9);
      }
      if (b.life <= 0) {
        this.scene.remove(b.sprite);
        if (b.ring) { b.sprite.geometry.dispose(); b.sprite.material.dispose(); }
        else { b.sprite.material.dispose(); }
        this.bits.splice(i, 1);
      }
    }
  }
}

export class Battle {
  constructor({ renderer, audio, ui, thumbs, onEnd }) {
    this.renderer = renderer;
    this.audio = audio;
    this.ui = ui;
    this.thumbs = thumbs;
    this.onEnd = onEnd;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
    this.arena = buildArena(this.scene);
    this.fx = new BattleFX(this.scene);
    this.fx.ring(new THREE.Vector3(0, 0.2, 0), '#fff0b8');
    this.party = [];
    this.activeIndex = 0;
    this.enemy = null;
    this.playerCreature = null;
    this.enemyCreature = null;
    this.busy = true;
    this.over = false;
    this.running = false;
    this.camT = 0;
    this.time = 0;
    this.resultAction = null;
    this.tmpDmg = 0;

    this.el = {
      root: document.getElementById('battle-ui'),
      enemyName: document.getElementById('enemy-name'),
      enemyLv: document.getElementById('enemy-lv'),
      enemyType: document.getElementById('enemy-type'),
      enemyHp: document.getElementById('enemy-hp'),
      enemyHpGhost: document.getElementById('enemy-hp-ghost'),
      enemyHpText: document.getElementById('enemy-hp-text'),
      playerName: document.getElementById('player-name'),
      playerLv: document.getElementById('player-lv'),
      playerType: document.getElementById('player-type'),
      playerHp: document.getElementById('player-hp'),
      playerHpGhost: document.getElementById('player-hp-ghost'),
      playerHpText: document.getElementById('player-hp-text'),
      playerXp: document.getElementById('player-xp'),
      log: document.getElementById('battle-text'),
      moves: document.getElementById('moves'),
      catchBtn: document.getElementById('btn-catch'),
      switchBtn: document.getElementById('btn-switch'),
      fleeBtn: document.getElementById('btn-flee'),
      turn: document.getElementById('battle-turn'),
      result: document.getElementById('battle-result'),
      resultKicker: document.getElementById('result-kicker'),
      resultTitle: document.getElementById('result-title'),
      resultArt: document.getElementById('result-art'),
      resultCopy: document.getElementById('result-copy'),
      resultStats: document.getElementById('result-stats'),
      resultContinue: document.getElementById('result-continue'),
      switchSheet: document.getElementById('switch-sheet'),
      switchScrim: document.getElementById('switch-scrim'),
      switchList: document.getElementById('switch-list'),
      switchClose: document.getElementById('switch-close')
    };

    this.el.catchBtn.addEventListener('click', () => this.throwOrb());
    this.el.switchBtn.addEventListener('click', () => this.openSwitch());
    this.el.switchClose.addEventListener('click', () => this.closeSwitch());
    this.el.switchScrim.addEventListener('click', () => this.closeSwitch());
    this.el.fleeBtn.addEventListener('click', () => this.flee());
    this.el.resultContinue.addEventListener('click', () => this.continueResult());
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    const portrait = h > w;
    this.camPortrait = portrait;
    this.camShort = !portrait && h < 560;
    this.camera.fov = portrait ? 50 : this.camShort ? 42 : 46;
    this.camera.updateProjectionMatrix();
  }

  setCreaturePosition(creature, side) {
    if (this.camShort) {
      creature.root.position.set(side === 'player' ? -1.7 : 1.7, 0.28, side === 'player' ? 1.2 : -0.7);
      creature.root.rotation.y = side === 'player' ? Math.PI / 2 : -Math.PI / 2;
      return;
    }
    const portrait = this.camPortrait;
    if (side === 'player') {
      creature.root.position.set(portrait ? -1.42 : -2.55, 0.28, portrait ? 1.55 : 1.05);
      creature.root.rotation.y = Math.PI / 2;
    } else {
      creature.root.position.set(portrait ? 1.42 : 2.55, 0.28, portrait ? -0.55 : -0.85);
      creature.root.rotation.y = -Math.PI / 2;
    }
  }

  makePlayerCreature() {
    if (this.playerCreature) disposeCreature(this.playerCreature);
    const mon = this.party[this.activeIndex];
    this.playerCreature = createCreature(mon.species, { battle: true });
    this.playerCreature.spawnT = 0.04;
    this.setCreaturePosition(this.playerCreature, 'player');
    this.playerCreature.root.scale.setScalar(1);
    this.scene.add(this.playerCreature.root);
    this.fx.ring(this.playerCreature.root.position, TYPES[SPECIES[mon.species].type].color);
  }

  async start(party, wildMon) {
    this.party = party;
    this.enemy = wildMon;
    this.activeIndex = party.findIndex(m => m.hp > 0);
    if (this.activeIndex < 0) this.activeIndex = 0;
    this.over = false;
    this.busy = true;
    this.running = true;
    this.camT = 0;
    this.resultAction = null;
    this.el.result.classList.add('hidden');
    this.closeSwitch();
    this.el.root.classList.remove('hidden');
    document.body.classList.add('in-battle');
    this.audio.setMode('battle');
    this.audio.sfx('encounter');
    this.makePlayerCreature();
    if (this.enemyCreature) disposeCreature(this.enemyCreature);
    this.enemyCreature = createCreature(wildMon.species, { battle: true });
    this.enemyCreature.spawnT = 0.2;
    this.setCreaturePosition(this.enemyCreature, 'enemy');
    this.scene.add(this.enemyCreature.root);
    this.fx.ring(this.enemyCreature.root.position, TYPES[SPECIES[wildMon.species].type].color);
    this.updateCards();
    this.renderMoves();
    this.setLog(`A wild ${SPECIES[wildMon.species].name} appeared!`);
    this.el.catchBtn.disabled = true;
    this.el.switchBtn.disabled = true;
    this.el.fleeBtn.disabled = false;
    this.el.turn.textContent = 'Battle start';
    await wait(0.85);
    const mon = this.party[this.activeIndex];
    this.setLog(`Go, ${SPECIES[mon.species].name}!`);
    this.audio.sfx('throw');
    await wait(0.7);
    this.busy = false;
    this.renderMoves();
    this.el.catchBtn.disabled = false;
    this.el.switchBtn.disabled = false;
    this.el.turn.textContent = 'Your move';
    this.setLog(`What will ${SPECIES[mon.species].name} do?`);
  }

  updateCards() {
    const mon = this.party[this.activeIndex];
    if (!mon) return;
    const sp = SPECIES[mon.species];
    const e = this.enemy;
    const esp = SPECIES[e.species];
    this.el.enemyName.textContent = esp.name;
    this.el.enemyLv.textContent = `Lv. ${e.level}`;
    this.setTypeBadge(this.el.enemyType, esp.type);
    this.setBar('enemy', e.hp, maxHpOf(e));
    this.el.playerName.textContent = sp.name;
    this.el.playerLv.textContent = `Lv. ${mon.level}${mon.status === 'burn' ? ' · BRN' : ''}`;
    this.setTypeBadge(this.el.playerType, sp.type);
    this.setBar('player', mon.hp, maxHpOf(mon));
    this.el.playerXp.style.width = `${Math.min(100, (mon.xp / xpToNext(mon.level)) * 100)}%`;
  }

  setTypeBadge(el, type) {
    el.textContent = TYPES[type].name;
    el.style.background = TYPES[type].color;
  }

  setBar(side, value, max) {
    const pct = clamp(value / max, 0, 1);
    const fill = side === 'enemy' ? this.el.enemyHp : this.el.playerHp;
    const ghost = side === 'enemy' ? this.el.enemyHpGhost : this.el.playerHpGhost;
    const text = side === 'enemy' ? this.el.enemyHpText : this.el.playerHpText;
    fill.style.transform = `scaleX(${pct})`;
    fill.classList.toggle('mid', pct <= 0.5 && pct > 0.22);
    fill.classList.toggle('low', pct <= 0.22);
    ghost.style.transform = `scaleX(${pct})`;
    text.textContent = `${Math.max(0, Math.round(value))} / ${max}`;
  }

  setLog(text) {
    this.el.log.textContent = text;
    this.el.log.style.animation = 'none';
    void this.el.log.offsetWidth;
    this.el.log.style.animation = 'fade .25s ease';
  }

  renderMoves() {
    const mon = this.party[this.activeIndex];
    if (!mon) return;
    const sp = SPECIES[mon.species];
    this.el.moves.innerHTML = '';
    sp.moves.forEach((id, i) => {
      const mv = MOVES[id];
      const btn = document.createElement('button');
      btn.className = `move-btn t-${mv.type}`;
      btn.disabled = this.busy;
      btn.innerHTML = `
        <span class="move-ico">${moveIcon(mv.icon)}</span>
        <span class="move-copy">
          <span class="move-name">${mv.name}</span>
          <span class="move-meta">${TYPES[mv.type].name} · ${mv.effect?.kind === 'heal' ? 'Support' : `Pow ${mv.power} · ${mv.acc}%`}</span>
        </span>`;
      btn.addEventListener('click', () => this.playerMove(i));
      this.el.moves.appendChild(btn);
    });
  }

  async playerMove(index) {
    if (this.busy || this.over) return;
    const mon = this.party[this.activeIndex];
    const mv = MOVES[SPECIES[mon.species].moves[index]];
    const enemyMv = this.pickEnemyMove();
    this.busy = true;
    this.renderMoves();
    this.el.catchBtn.disabled = true;
    this.el.switchBtn.disabled = true;
    this.el.fleeBtn.disabled = true;
    this.el.turn.textContent = 'Resolving…';

    const actorUid = mon.uid;
    const playerFirst = this.goesFirst(mon, mv, this.enemy, enemyMv);
    if (playerFirst) {
      await this.performMove('player', mv);
      if (this.enemy.hp > 0 && !this.over) await this.performMove('enemy', enemyMv);
    } else {
      await this.performMove('enemy', enemyMv);
      const stillActive = this.party[this.activeIndex]?.uid === actorUid;
      if (stillActive && this.party[this.activeIndex].hp > 0 && !this.over) await this.performMove('player', mv);
    }
    if (!this.over) {
      await this.statusTicks();
      this.busy = false;
      this.renderMoves();
      if (!this.over) {
        this.el.catchBtn.disabled = false;
        this.el.switchBtn.disabled = false;
        this.el.fleeBtn.disabled = false;
        this.el.turn.textContent = 'Your move';
        const alive = this.party[this.activeIndex];
        if (alive && alive.hp > 0) this.setLog(`What will ${SPECIES[alive.species].name} do?`);
      }
    }
  }

  goesFirst(a, aMove, b, bMove) {
    if ((bMove.priority && !aMove.priority)) return false;
    if ((aMove.priority && !bMove.priority)) return true;
    const as = statsOf(a).spd * (a.status === 'burn' ? 0.9 : 1);
    const bs = statsOf(b).spd * (b.status === 'burn' ? 0.9 : 1);
    if (Math.abs(as - bs) < 0.5) return Math.random() < 0.5;
    return as >= bs;
  }

  pickEnemyMove() {
    const sp = SPECIES[this.enemy.species];
    const healMove = sp.moves.find(id => MOVES[id].effect?.kind === 'heal');
    if (healMove && this.enemy.hp / maxHpOf(this.enemy) < 0.34 && chance(0.6)) return MOVES[healMove];
    const attacks = sp.moves.filter(id => MOVES[id].power > 0);
    return MOVES[attacks[randInt(0, attacks.length - 1)]] || MOVES.tackle;
  }

  async performMove(side, move) {
    if (this.over) return;
    const attacker = side === 'player' ? this.party[this.activeIndex] : this.enemy;
    const defender = side === 'player' ? this.enemy : this.party[this.activeIndex];
    const attackerCreature = side === 'player' ? this.playerCreature : this.enemyCreature;
    const defenderCreature = side === 'player' ? this.enemyCreature : this.playerCreature;
    const attackerName = SPECIES[attacker.species].name;
    const defenderName = SPECIES[defender.species].name;
    const typeColor = TYPES[move.type].color;
    this.setLog(`${attackerName} used ${move.name}!`);
    this.audio.sfx('click');

    if (move.effect?.kind === 'heal') {
      await wait(0.35);
      const max = maxHpOf(attacker);
      const amount = Math.max(3, Math.round(max * move.effect.ratio));
      attacker.hp = Math.min(max, attacker.hp + amount);
      this.updateCards();
      this.audio.sfx('heal');
      this.fx.burst(attackerCreature.root.position.clone().add(new THREE.Vector3(0, 1.4, 0)), '#b8ffd6', 20, 0.7);
      this.fx.ring(attackerCreature.root.position, '#b8ffd6');
      this.setLog(`${attackerName} restored ${amount} HP.`);
      await wait(0.9);
      return;
    }

    // lunge animation
    const dir = side === 'player' ? 1 : -1;
    const home = attackerCreature.root.position.clone();
    this.tweenCreatureLunge(attackerCreature, dir);
    await wait(0.24);

    if (!chance(move.acc / 100)) {
      this.setLog(`${attackerName}'s ${move.name} missed!`);
      this.audio.sfx('weak');
      await wait(0.85);
      return;
    }

    const eff = effectiveness(move.type, SPECIES[defender.species].type);
    const stab = move.type === SPECIES[attacker.species].type ? 1.18 : 1;
    const crit = chance(0.08);
    const variance = rand(0.88, 1.02);
    const atk = statsOf(attacker).atk;
    const def = statsOf(defender).def;
    let dmg = ((2 * attacker.level / 5 + 2) * move.power * (atk / def)) / 42 + 2;
    dmg = Math.max(1, Math.round(dmg * eff * stab * (crit ? 1.55 : 1) * variance));
    if (defender.hp - dmg <= 0 && side === 'player' && this.enemy.hp > 0) dmg = Math.max(1, dmg);
    defender.hp = Math.max(0, defender.hp - dmg);
    this.tmpDmg = dmg;

    const hitPos = defenderCreature.root.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    defenderCreature.flash(eff >= 2 ? '#ffffff' : typeColor, 1);
    this.fx.burst(hitPos, crit ? '#fffbd0' : typeColor, eff >= 2 ? 28 : 18, eff >= 2 ? 1.3 : 1);
    this.fx.ring(defenderCreature.root.position, typeColor);
    this.ui.screenShake();
    this.audio.sfx(eff >= 2 ? 'superhit' : eff <= 0.5 ? 'weak' : 'hit', crit ? 2 : eff >= 2 ? 1 : 0);
    this.updateCards();
    await wait(0.42);

    let text = `${defenderName} took ${dmg} damage.`;
    if (crit) text = `Critical hit! ${defenderName} took ${dmg} damage.`;
    this.setLog(text);
    await wait(0.8);
    if (eff >= 2) { this.setLog('It\'s super effective!'); await wait(0.75); }
    else if (eff <= 0.5) { this.setLog('It\'s not very effective…'); await wait(0.75); }

    if (move.effect?.kind === 'burn' && defender.hp > 0 && !defender.status && chance(move.effect.chance)) {
      defender.status = 'burn';
      defenderCreature.flash('#ff9a55', 0.8);
      this.setLog(`${defenderName} was burned!`);
      this.audio.sfx('heal');
      await wait(0.85);
    }

    if (defender.hp <= 0) await this.faint(side === 'player' ? 'enemy' : 'player');
  }

  tweenCreatureLunge(creature, dir) {
    const base = creature.root.position.clone();
    tween({
      duration: 0.18, ease: easeOutCubic,
      update: p => { creature.root.position.x = base.x + dir * 0.75 * p; },
      complete: () => tween({
        duration: 0.3, ease: easeInCubic,
        update: p => { creature.root.position.x = base.x + dir * 0.75 * (1 - p); }
      })
    });
  }

  async faint(side) {
    const creature = side === 'enemy' ? this.enemyCreature : this.playerCreature;
    const mon = side === 'enemy' ? this.enemy : this.party[this.activeIndex];
    const name = SPECIES[mon.species].name;
    this.setLog(`${name} fainted!`);
    this.audio.sfx('faint');
    creature.flash('#ffffff', 1);
    creature.scaleLocked = true;
    tween({
      duration: 0.8, ease: easeOutCubic,
      update: p => {
        creature.root.rotation.z = (side === 'enemy' ? -1 : 1) * p * 1.3;
        creature.root.position.y = 0.28 - p * 0.5;
        creature.visual.scale.setScalar(creature.scale * (1 - p * 0.15));
      }
    });
    this.updateCards();
    await wait(1.0);
    if (side === 'enemy') {
      this.over = true;
      await this.victory();
    } else {
      const next = this.party.findIndex(m => m.hp > 0);
      if (next >= 0) {
        this.activeIndex = next;
        await wait(0.4);
        this.setLog(`Go, ${SPECIES[this.party[next].species].name}!`);
        this.makePlayerCreature();
        this.updateCards();
        this.renderMoves();
        this.audio.sfx('throw');
        await wait(1.0);
        this.busy = false;
        this.el.catchBtn.disabled = false;
        this.el.switchBtn.disabled = false;
        this.el.fleeBtn.disabled = false;
        this.el.turn.textContent = 'Your move';
        this.setLog(`What will ${SPECIES[this.party[next].species].name} do?`);
      } else {
        this.over = true;
        await this.defeat();
      }
    }
  }

  async statusTicks() {
    if (this.over) return;
    for (const side of ['player', 'enemy']) {
      const mon = side === 'player' ? this.party[this.activeIndex] : this.enemy;
      if (!mon || mon.status !== 'burn' || mon.hp <= 0) continue;
      const dmg = Math.max(2, Math.round(maxHpOf(mon) * 0.06));
      mon.hp = Math.max(0, mon.hp - dmg);
      const creature = side === 'player' ? this.playerCreature : this.enemyCreature;
      creature.flash('#ff9a55', 0.7);
      this.fx.burst(creature.root.position.clone().add(new THREE.Vector3(0, 1, 0)), '#ff8a4d', 10, 0.6);
      this.updateCards();
      this.setLog(`${SPECIES[mon.species].name} is hurt by its burn!`);
      this.audio.sfx('weak');
      await wait(0.95);
      if (mon.hp <= 0) {
        await this.faint(side);
        return;
      }
    }
  }

  async victory() {
    const mon = this.party[this.activeIndex];
    const gain = 22 + this.enemy.level * 9;
    mon.xp += gain;
    let leveled = false;
    while (mon.xp >= xpToNext(mon.level) && mon.level < 50) {
      mon.xp -= xpToNext(mon.level);
      mon.level++;
      const newMax = maxHpOf(mon);
      mon.hp = Math.min(newMax, mon.hp + 4);
      leveled = true;
    }
    this.updateCards();
    this.audio.sfx(leveled ? 'levelup' : 'victory');
    this.setLog(leveled ? `${SPECIES[mon.species].name} grew to Lv. ${mon.level}!` : `Victory! +${gain} XP`);
    await wait(1.1);
    this.showResult({
      kicker: 'Battle won',
      title: leveled ? `Lv. ${mon.level}!` : 'Victory!',
      copy: leveled ? `${SPECIES[mon.species].name} feels stronger already.` : `Your team earned ${gain} XP.`,
      art: this.thumbs[this.enemy.species],
      stats: [['XP', `+${gain}`], ['Level up', leveled ? 'Yes' : '—'], ['Caught', `${this.party.length}/6`]],
      result: { type: 'win', caught: null }
    });
  }

  async defeat() {
    this.audio.sfx('faint');
    this.setLog('Your team is out of energy…');
    await wait(1.0);
    this.showResult({
      kicker: 'Back to the meadow',
      title: 'The meadow won this round',
      copy: 'Your team was healed at the campfire. Try again when you are ready.',
      art: null,
      orb: true,
      stats: [['Team', `${this.party.length}`], ['Best', 'Keep going']],
      result: { type: 'defeat', caught: null, heal: true }
    });
  }

  async flee() {
    if (this.busy || this.over) return;
    this.busy = true;
    this.el.turn.textContent = 'Retreating…';
    this.renderMoves();
    this.el.catchBtn.disabled = true;
    this.el.switchBtn.disabled = true;
    this.el.fleeBtn.disabled = true;
    this.setLog('You look for a way out…');
    await wait(0.7);
    if (chance(0.78)) {
      this.setLog('You slipped away safely!');
      this.audio.sfx('success');
      await wait(0.8);
      this.finish({ type: 'flee' });
    } else {
      this.setLog('No escape! The wild beast blocks the path.');
      this.audio.sfx('fail');
      await wait(0.9);
      const enemyMv = this.pickEnemyMove();
      await this.performMove('enemy', enemyMv);
      if (!this.over) {
        await this.statusTicks();
        this.busy = false;
        this.renderMoves();
        this.el.catchBtn.disabled = false;
        this.el.switchBtn.disabled = false;
        this.el.fleeBtn.disabled = false;
        this.el.turn.textContent = 'Your move';
        this.setLog(`What will ${SPECIES[this.party[this.activeIndex].species].name} do?`);
      }
    }
  }

  async throwOrb() {
    if (this.busy || this.over || this.enemy.hp <= 0) return;
    this.busy = true;
    this.renderMoves();
    this.el.catchBtn.disabled = true;
    this.el.switchBtn.disabled = true;
    this.el.fleeBtn.disabled = true;
    this.el.turn.textContent = 'Catching…';
    this.setLog('You wind up a Prism Orb…');
    this.audio.sfx('throw');

    const orb = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 20, 14),
      new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.25, metalness: 0.2, emissive: 0xffb347, emissiveIntensity: 0.5 })
    );
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.325, 0.05, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xfff6dd, roughness: 0.2, metalness: 0.3, emissive: 0xfff0bd, emissiveIntensity: 0.6 })
    );
    band.rotation.x = Math.PI / 2;
    orb.add(ball, band);
    const light = new THREE.PointLight('#ffd166', 8, 6, 2);
    orb.add(light);
    const start = this.playerCreature.root.position.clone().add(new THREE.Vector3(0.5, 1.8, 0.4));
    const target = this.enemyCreature.root.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    orb.position.copy(start);
    this.scene.add(orb);
    await new Promise(resolve => {
      tween({
        duration: 0.7, ease: easeOutCubic,
        update: p => {
          const x = start.x + (target.x - start.x) * p;
          const z = start.z + (target.z - start.z) * p;
          const y = start.y + (target.y - start.y) * p + Math.sin(p * Math.PI) * 2.6;
          orb.position.set(x, y, z);
          orb.rotation.x += 0.2;
          orb.rotation.z += 0.25;
        }, complete: resolve
      });
    });
    this.audio.sfx('hit', 1);
    this.fx.burst(target, '#ffe6a0', 26, 1.1);
    this.fx.ring(this.enemyCreature.root.position, '#fff0b8');

    const catchChance = clamp(
      SPECIES[this.enemy.species].catchRate * (0.34 + 0.66 * (1 - this.enemy.hp / maxHpOf(this.enemy))) * (1 - this.enemy.level * 0.006) * (this.enemy.status ? 1.18 : 1),
      0.06, 0.94
    );
    const success = chance(catchChance);
    this.tmpDmg = catchChance;

    // suck into orb
    this.enemyCreature.scaleLocked = true;
    const suckStart = this.enemyCreature.root.position.clone();
    await new Promise(resolve => {
      tween({
        duration: 0.55, ease: easeInCubic,
        update: p => {
          this.enemyCreature.root.position.lerpVectors(suckStart, orb.position.clone(), p * 0.15);
          this.enemyCreature.visual.scale.setScalar(this.enemyCreature.scale * (1 - p * 0.96));
          this.enemyCreature.visual.position.y = p * 0.3;
          orb.position.y = target.y - p * 0.75;
          orb.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.25);
        }, complete: resolve
      });
    });
    orb.position.y = 0.28 + 0.32;
    this.enemyCreature.root.visible = false;

    const wobbles = success ? 3 : randInt(1, 2);
    for (let i = 0; i < wobbles; i++) {
      this.audio.sfx('wobble');
      await new Promise(resolve => {
        tween({
          duration: 0.62, update: p => {
            const t = p * Math.PI * 2;
            orb.rotation.z = Math.sin(t * 1.5) * 0.5 * (1 - p * 0.4);
            orb.position.x = target.x + Math.sin(t * 2) * 0.03;
          }, complete: resolve
        });
      });
    }
    await wait(0.35);

    if (success) {
      orb.rotation.z = 0;
      ball.material.emissiveIntensity = 2.2;
      band.material.emissiveIntensity = 2.5;
      light.intensity = 22;
      this.audio.sfx('success');
      this.fx.burst(new THREE.Vector3(orb.position.x, 1.4, orb.position.z), '#fff1b8', 40, 1.4);
      this.fx.ring(new THREE.Vector3(orb.position.x, 0, orb.position.z), '#fff8d6');
      this.ui.confetti(80);
      this.scene.remove(orb);
      this.over = true;
      const already = this.party.some(m => m.species === this.enemy.species);
      if (this.party.length < 6) {
        const caught = makeMon(this.enemy.species, this.enemy.level);
        caught.hp = Math.max(1, Math.round(maxHpOf(caught) * 0.7));
        this.party.push(caught);
      }
      this.showResult({
        kicker: 'New teammate',
        title: `${SPECIES[this.enemy.species].name} joined you!`,
        copy: already ? 'Another friend found in Prism Meadows.' : SPECIES[this.enemy.species].desc,
        art: this.thumbs[this.enemy.species],
        stats: [['Level', `${this.enemy.level}`], ['Type', TYPES[SPECIES[this.enemy.species].type].name], ['Team', `${this.party.length}/6`]],
        result: { type: 'catch', caught: this.enemy.species, uid: this.enemy.uid, newMon: this.party[this.party.length - 1] }
      });
    } else {
      this.audio.sfx('fail');
      orb.scale.setScalar(0.01);
      this.fx.burst(new THREE.Vector3(orb.position.x, 1, orb.position.z), '#ffd9a0', 22, 0.9);
      this.scene.remove(orb);
      this.enemyCreature.root.visible = true;
      this.enemyCreature.visual.scale.setScalar(this.enemyCreature.scale * 0.05);
      this.enemyCreature.visual.position.y = 0;
      this.setLog(`Oh no! ${SPECIES[this.enemy.species].name} broke free!`);
      await new Promise(resolve => {
        tween({ duration: 0.45, ease: easeOutBack, update: p => { this.enemyCreature.visual.scale.setScalar(this.enemyCreature.scale * (0.05 + 0.95 * p)); }, complete: resolve });
      });
      this.enemyCreature.scaleLocked = false;
      this.enemyCreature.spawnT = 3;
      this.fx.ring(this.enemyCreature.root.position, TYPES[SPECIES[this.enemy.species].type].color);
      await wait(0.55);
      const enemyMv = this.pickEnemyMove();
      await this.performMove('enemy', enemyMv);
      if (!this.over) {
        await this.statusTicks();
        this.busy = false;
        this.renderMoves();
        this.el.catchBtn.disabled = false;
        this.el.switchBtn.disabled = false;
        this.el.fleeBtn.disabled = false;
        this.el.turn.textContent = 'Your move';
        this.setLog(`What will ${SPECIES[this.party[this.activeIndex].species].name} do?`);
      }
    }
  }

  openSwitch() {
    if (this.busy || this.over) return;
    this.audio.sfx('open');
    const list = this.el.switchList;
    list.innerHTML = '';
    this.party.forEach((mon, i) => {
      const sp = SPECIES[mon.species];
      const btn = document.createElement('button');
      btn.className = `switch-item t-${sp.type}${i === this.activeIndex ? ' current' : ''}`;
      btn.disabled = i === this.activeIndex || mon.hp <= 0;
      btn.innerHTML = `
        ${this.thumbs[mon.species] ? `<img src="${this.thumbs[mon.species]}" alt="${sp.name}">` : ''}
        <span class="sw-copy"><b>${sp.name}</b><span>Lv. ${mon.level} · ${mon.hp}/${maxHpOf(mon)} HP · ${TYPES[sp.type].name}</span></span>
        <span class="type-badge" style="background:${TYPES[sp.type].color}">${mon.hp > 0 ? (i === this.activeIndex ? 'Active' : 'Swap') : 'Fainted'}</span>`;
      btn.addEventListener('click', () => this.switchTo(i));
      list.appendChild(btn);
    });
    this.el.switchScrim.classList.remove('hidden');
    this.el.switchSheet.classList.remove('hidden');
  }

  closeSwitch() {
    this.el.switchSheet.classList.add('hidden');
    this.el.switchScrim.classList.add('hidden');
  }

  async switchTo(index) {
    if (index === this.activeIndex || this.party[index].hp <= 0 || this.busy) return;
    this.closeSwitch();
    this.busy = true;
    this.audio.sfx('click');
    this.setLog(`${SPECIES[this.party[this.activeIndex].species].name}, come back!`);
    this.playerCreature.scaleLocked = true;
    tween({ duration: 0.35, update: p => { this.playerCreature.visual.scale.setScalar(this.playerCreature.scale * (1 - p)); } });
    await wait(0.4);
    this.activeIndex = index;
    this.makePlayerCreature();
    this.updateCards();
    this.renderMoves();
    this.setLog(`Go, ${SPECIES[this.party[index].species].name}!`);
    this.audio.sfx('throw');
    await wait(0.8);
    const enemyMv = this.pickEnemyMove();
    await this.performMove('enemy', enemyMv);
    if (!this.over) {
      await this.statusTicks();
      this.busy = false;
      this.renderMoves();
      this.el.catchBtn.disabled = false;
      this.el.switchBtn.disabled = false;
      this.el.fleeBtn.disabled = false;
      this.el.turn.textContent = 'Your move';
      this.setLog(`What will ${SPECIES[this.party[this.activeIndex].species].name} do?`);
    }
  }

  showResult({ kicker, title, copy, art, orb, stats, result }) {
    this.resultAction = result;
    this.el.resultKicker.textContent = kicker;
    this.el.resultTitle.textContent = title;
    this.el.resultCopy.textContent = copy;
    this.el.resultArt.innerHTML = orb
      ? '<div class="orb-big"></div>'
      : art ? `<img src="${art}" alt="">` : '';
    this.el.resultStats.innerHTML = stats.map(([k, v]) => `<span>${k}<b>${v}</b></span>`).join('');
    this.el.result.classList.remove('hidden');
    this.audio.setMode('field');
  }

  continueResult() {
    this.audio.sfx('open');
    this.finish(this.resultAction || { type: 'win' });
  }

  finish(result) {
    this.el.result.classList.add('hidden');
    this.el.root.classList.add('hidden');
    document.body.classList.remove('in-battle');
    this.running = false;
    this.audio.setMode('field');
    if (this.playerCreature) { disposeCreature(this.playerCreature); this.playerCreature = null; }
    if (this.enemyCreature) { disposeCreature(this.enemyCreature); this.enemyCreature = null; }
    this.onEnd?.(result);
  }

  update(dt, t) {
    this.camT += dt;
    this.time = t;
    const portrait = this.camPortrait;
    const short = this.camShort;
    const base = portrait ? { y: 4.1, z: 15.8 } : short ? { y: 5.9, z: 13.6 } : { y: 4.2, z: 12.0 };
    const lookY = portrait ? 1.55 : short ? -0.5 : 1.5;
    this.camera.position.set(
      Math.sin(t * 0.12) * 0.35 + (portrait || short ? 0 : 0.35),
      base.y + Math.sin(t * 0.22) * 0.12,
      base.z + Math.cos(t * 0.15) * 0.15
    );
    this.camera.lookAt(0, lookY, 0);
    this.arena.ring.rotation.z = t * 0.12;
    this.arena.key.position.x = 6 + Math.sin(t * 0.2) * 1.5;
    this.arena.rim.intensity = 18 + Math.sin(t * 1.2) * 3;
    this.arena.group.children.forEach(c => {
      if (c.userData?.baseY !== undefined) c.position.y = c.userData.baseY + Math.sin(t * 0.6 + c.userData.phase) * 0.5;
    });
    this.fx.update(dt, t);
    if (this.playerCreature) {
      this.playerCreature.animate(t, false);
      if (this.playerCreature.root.visible === false) this.playerCreature.root.visible = true;
    }
    if (this.enemyCreature) this.enemyCreature.animate(t, false);
    if (this.arena.sky) {
      // subtle breathing light on arena
      this.arena.top.material.emissiveIntensity = 0;
    }
  }
}
