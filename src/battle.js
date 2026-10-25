import * as THREE from 'three'
import { byId, effectiveness, MOVES, TYPES } from './config.js'
import { animateCreature, createCreature } from './creatures.js'
import { clamp, glowSprite, makeRadialTexture, rand, sphere, typeColor } from './lib.js'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

function makeBattleSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color('#4aa8e8') },
      mid: { value: new THREE.Color('#a9e2f7') },
      horizon: { value: new THREE.Color('#ffe1b8') }
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 mid;
      uniform vec3 horizon;
      varying vec3 vWorld;
      void main() {
        vec3 dir = normalize(vWorld);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(horizon, mid, smoothstep(0.46, 0.62, h));
        c = mix(c, top, smoothstep(0.6, 0.95, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `
  })
  return new THREE.Mesh(new THREE.SphereGeometry(160, 28, 18), mat)
}

function makePlatform(scene) {
  const group = new THREE.Group()
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(7.6, 6.4, 1.5, 40),
    new THREE.MeshStandardMaterial({ color: 0x7b5c43, roughness: 1, flatShading: true })
  )
  base.position.y = -0.45
  base.receiveShadow = true
  base.castShadow = true
  group.add(base)
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(7.2, 7.35, 0.5, 40),
    new THREE.MeshStandardMaterial({ color: 0x6fc063, roughness: 0.95, flatShading: true })
  )
  top.position.y = 0.25
  top.receiveShadow = true
  top.castShadow = true
  group.add(top)

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(4.5, 5.1, 48),
    new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.51
  group.add(ring)

  const flowerMat = new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true })
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4c8f42, roughness: 1 })
  const flowerColors = [0xfff0a8, 0xff9cc0, 0xffffff, 0xc1b1ff]
  for (let i = 0; i < 26; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 5.2 + Math.random() * 1.8
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    if (Math.abs(x) < 1.2 && z > 0) continue
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.4, 4), stemMat)
    stem.position.set(x, 0.62, z)
    stem.castShadow = true
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), flowerMat.clone())
    head.material.color.setHex(flowerColors[i % flowerColors.length])
    head.position.set(x, 0.85, z)
    head.castShadow = true
    group.add(stem, head)
  }
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 6 + Math.random() * 1.2
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(rand(0.25, 0.6), 0),
      new THREE.MeshStandardMaterial({ color: 0x9a9c92, roughness: 1, flatShading: true })
    )
    rock.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius)
    rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)
    rock.castShadow = true
    group.add(rock)
  }
  scene.add(group)
  return group
}

function makeFloatingIslands(scene) {
  const islands = []
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8d7662, roughness: 1, flatShading: true })
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x77c46a, roughness: 0.95, flatShading: true })
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x4a9d55, roughness: 0.95, flatShading: true })
  const spots = [
    [-11, 4.8, -30], [12, 6.4, -36], [-21, 4.2, -22],
    [20, 4.6, -20], [-4, 7.2, -44], [5, 3.6, -16]
  ]
  for (let i = 0; i < 6; i++) {
    const group = new THREE.Group()
    const size = rand(0.7, 1.3)
    const rock = new THREE.Mesh(new THREE.ConeGeometry(size, size * 1.9, 7), rockMat)
    rock.rotation.x = Math.PI
    rock.position.y = -size * 0.6
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(size, size * 0.92, size * 0.35, 7), grassMat)
    grass.position.y = size * 0.2
    group.add(rock, grass)
    for (let t = 0; t < 2; t++) {
      const tree = new THREE.Mesh(new THREE.ConeGeometry(size * 0.32, size * 0.9, 6), treeMat)
      tree.position.set(rand(-size * 0.5, size * 0.5), size * 0.65, rand(-size * 0.4, size * 0.4))
      group.add(tree)
    }
    group.position.set(spots[i][0], spots[i][1], spots[i][2])
    group.userData = { baseY: group.position.y, phase: rand(0, 6.28), spin: rand(-0.08, 0.08) }
    scene.add(group)
    islands.push(group)
  }
  return islands
}

function makeHorizonPeaks(scene) {
  const group = new THREE.Group()
  const colors = [0x527c72, 0x5d887d, 0x48716a, 0x648d80]
  for (let i = 0; i < 14; i++) {
    const angle = Math.PI + (i / 13) * Math.PI
    const radius = rand(66, 92)
    const height = rand(4, 9)
    const width = rand(16, 30)
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(1, 1, 5, 1),
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 1, flatShading: true })
    )
    mountain.position.set(Math.cos(angle) * radius, height / 2 - 2.4, Math.sin(angle) * radius)
    mountain.scale.set(width, height, width)
    mountain.rotation.y = rand(0, Math.PI * 2)
    group.add(mountain)
  }
  scene.add(group)
  return group
}

function makeOrb() {
  const orb = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0xf7f4ea, roughness: 0.35, metalness: 0.05 })
  )
  orb.add(body)
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.245, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xe9514d, roughness: 0.3, metalness: 0.1 })
  )
  orb.add(top)
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(0.238, 0.026, 6, 20),
    new THREE.MeshStandardMaterial({ color: 0x2f3438, roughness: 0.5 })
  )
  band.rotation.x = Math.PI / 2
  orb.add(band)
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.045, 14), new THREE.MeshStandardMaterial({ color: 0xfbfbf6, roughness: 0.4 }))
  button.rotation.x = Math.PI / 2
  button.position.z = 0.235
  orb.add(button)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.018, 5, 14), new THREE.MeshStandardMaterial({ color: 0x2f3438 }))
  ring.rotation.x = Math.PI / 2
  ring.position.z = 0.24
  orb.add(ring)
  return orb
}

export class Battle {
  constructor({ audio, callbacks, viewport }) {
    this.audio = audio
    this.cb = callbacks
    this.viewport = viewport || { width: 1, height: 1 }
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0xcfeaf2, 45, 130)
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 250)
    this.basePos = new THREE.Vector3(0, 4.4, 9.4)
    this.camera.position.copy(this.basePos)
    this.camera.lookAt(0, 1.7, 0)
    this.state = 'idle'
    this.time = 0
    this.startTime = 0
    this.particles = []
    this.anim = null
    this.shakeAmount = 0
    this.turnBusy = false
    this.playerUnit = null
    this.enemyUnit = null
    this.playerModel = null
    this.enemyModel = null
    this.ends = null
    this.admin = null
    this.buildScene()
    this.bindDOM()
  }

  buildScene() {
    const scene = this.scene
    scene.add(makeBattleSky())
    const sun = glowSprite('#fff0c0', 28, 0.9)
    sun.position.set(45, 40, -30)
    scene.add(sun)
    const hemi = new THREE.HemisphereLight(0xe2f6ff, 0x6f965c, 1.8)
    scene.add(hemi)
    const dir = new THREE.DirectionalLight(0xfff0c8, 2.6)
    dir.position.set(9, 16, 12)
    dir.castShadow = true
    dir.shadow.mapSize.set(1024, 1024)
    dir.shadow.camera.left = -12
    dir.shadow.camera.right = 12
    dir.shadow.camera.top = 12
    dir.shadow.camera.bottom = -12
    dir.shadow.camera.near = 1
    dir.shadow.camera.far = 50
    dir.shadow.bias = -0.0005
    scene.add(dir)
    const rim = new THREE.PointLight(0x8dd9ff, 25, 40, 2)
    rim.position.set(-10, 8, -12)
    scene.add(rim)
    const warm = new THREE.PointLight(0xffc477, 18, 30, 2)
    warm.position.set(10, 5, 8)
    scene.add(warm)
    this.platform = makePlatform(scene)
    this.islands = makeFloatingIslands(scene)
    makeHorizonPeaks(scene)

    const count = 90
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = rand(-20, 20)
      positions[i * 3 + 1] = rand(1, 14)
      positions[i * 3 + 2] = rand(-20, 12)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.motes = new THREE.Points(geo, new THREE.PointsMaterial({
      map: makeRadialTexture('#fff4c9', [[0, 1], [0.4, 0.5], [1, 0]]),
      size: 0.22, transparent: true, opacity: 0.7, depthWrite: false,
      blending: THREE.AdditiveBlending, color: 0xfff2b0
    }))
    scene.add(this.motes)

    this.particleGeometry = new THREE.SphereGeometry(0.075, 6, 4)
    this.particleGeoms = {
      fire: new THREE.ConeGeometry(0.08, 0.2, 4),
      electric: new THREE.TetrahedronGeometry(0.1, 0),
      grass: new THREE.CircleGeometry(0.09, 4),
      water: new THREE.SphereGeometry(0.09, 6, 4),
      rock: new THREE.DodecahedronGeometry(0.09, 0),
      flying: new THREE.CircleGeometry(0.1, 3),
      normal: new THREE.SphereGeometry(0.08, 6, 4)
    }
  }

  bindDOM() {
    this.dom = {
      root: document.getElementById('battleUI'),
      enemyName: document.getElementById('enemyName'),
      enemyLevel: document.getElementById('enemyLevel'),
      enemyType: document.getElementById('enemyType'),
      enemyHp: document.getElementById('enemyHpBar'),
      enemyHpText: document.getElementById('enemyHpText'),
      playerName: document.getElementById('playerName'),
      playerLevel: document.getElementById('playerLevel'),
      playerType: document.getElementById('playerType'),
      playerHp: document.getElementById('playerHpBar'),
      playerHpText: document.getElementById('playerHpText'),
      moves: document.getElementById('moveGrid'),
      catchBtn: document.getElementById('catchBtn'),
      runBtn: document.getElementById('runBtn'),
      orbCount: document.getElementById('orbCountBattle'),
      log: document.getElementById('battleLog'),
      banner: document.getElementById('battleBanner'),
      turn: document.getElementById('battleTurn'),
      damage: document.getElementById('damageLayer'),
      stage: document.getElementById('battleUI')
    }
    this.dom.catchBtn.addEventListener('click', () => this.tryCatch())
    this.dom.runBtn.addEventListener('click', () => this.tryRun())
  }

  setViewport(width, height) {
    this.viewport = { width, height }
    const aspect = width / Math.max(1, height)
    this.camera.aspect = aspect
    if (aspect < 0.85) {
      this.camera.fov = 56
      this.basePos.set(0, 5.4, 11.6)
    } else if (aspect < 1.2) {
      this.camera.fov = 48
      this.basePos.set(0, 4.8, 10.3)
    } else {
      this.camera.fov = 42
      this.basePos.set(0, 4.4, 9.4)
    }
    this.camera.updateProjectionMatrix()
  }

  setOrbs(n) {
    this.dom.orbCount.textContent = n
  }

  setMoveButtons(unit) {
    const species = byId[unit.speciesId]
    this.dom.moves.innerHTML = ''
    species.moves.forEach((moveId, i) => {
      const move = MOVES[moveId]
      const type = TYPES[move.type]
      const btn = document.createElement('button')
      btn.className = 'move-btn'
      btn.style.setProperty('--type', type.color)
      btn.style.setProperty('--type-light', type.light)
      btn.style.setProperty('--type-dark', type.dark)
      btn.innerHTML = `
        <span class="move-type" style="background:${type.color}">${type.label}</span>
        <span class="move-name">${move.name}</span>
        <span class="move-meta"><b>${move.power}</b> PWR</span>
        <span class="move-hotkey">${i + 1}</span>
      `
      btn.addEventListener('click', () => this.useMove(moveId))
      this.dom.moves.appendChild(btn)
    })
  }

  updateHp(unit, side) {
    const pct = clamp(unit.hp / unit.maxHp, 0, 1) * 100
    const bar = side === 'enemy' ? this.dom.enemyHp : this.dom.playerHp
    const text = side === 'enemy' ? this.dom.enemyHpText : this.dom.playerHpText
    bar.style.width = pct + '%'
    bar.classList.toggle('low', pct < 30)
    bar.classList.toggle('mid', pct >= 30 && pct < 55)
    text.textContent = `${Math.max(0, Math.ceil(unit.hp))} / ${unit.maxHp}`
  }

  setBusy(busy) {
    this.turnBusy = busy
    for (const b of this.dom.moves.querySelectorAll('button')) b.disabled = busy
    this.dom.catchBtn.disabled = busy || (!this.admin?.infiniteOrbs && this.cb.getOrbs() <= 0)
    this.dom.runBtn.disabled = busy
    if (!busy) this.dom.turn.textContent = 'YOUR TURN'
  }

  log(text, tone = '') {
    this.dom.log.innerHTML = `<span class="log-text">${text}</span>`
    this.dom.log.className = 'battle-log ' + tone
    this.dom.log.animate(
      [{ transform: 'translateY(6px)', opacity: 0.2 }, { transform: 'translateY(0)', opacity: 1 }],
      { duration: 220, easing: 'ease-out' }
    )
  }

  banner(title, sub = '', duration = 1300, tone = '') {
    const el = this.dom.banner
    el.innerHTML = `<strong>${title}</strong>${sub ? `<span>${sub}</span>` : ''}`
    el.className = 'battle-banner show ' + tone
    clearTimeout(this.bannerTimer)
    this.bannerTimer = setTimeout(() => { el.className = 'battle-banner ' + tone }, duration)
  }

  addParticles(type, side, count = 14, power = 1) {
    const model = side === 'enemy' ? this.enemyModel : this.playerModel
    if (!model) return
    const color = new THREE.Color(typeColor(type))
    const origin = model.position.clone()
    origin.y += 1.2 * 1.55
    for (let i = 0; i < count; i++) {
      const geo = this.particleGeoms[type] || this.particleGeometry
      const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
        blending: ['fire', 'electric', 'water', 'flying'].includes(type) ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(origin)
      mesh.position.x += rand(-0.4, 0.4)
      mesh.position.y += rand(-0.3, 0.5)
      mesh.position.z += rand(-0.4, 0.4)
      mesh.scale.setScalar(rand(0.6, 1.6) * power)
      this.scene.add(mesh)
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(rand(-2.6, 2.6), rand(1.2, 4.4), rand(-2.6, 2.6)),
        life: rand(0.45, 0.9), maxLife: 0.9,
        spin: rand(-8, 8), gravity: type === 'rock' ? 8 : 2.2
      })
    }
  }

  burst(target, color = 0xfff3b0, count = 26) {
    const origin = target.position.clone()
    origin.y += 1.6
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        new THREE.TetrahedronGeometry(rand(0.05, 0.13), 0),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false })
      )
      mesh.position.copy(origin)
      this.scene.add(mesh)
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(rand(-5, 5), rand(1, 7), rand(-5, 5)),
        life: rand(0.5, 1.1), maxLife: 1.1, spin: rand(-10, 10), gravity: 5
      })
    }
  }

  setActor(model, side) {
    if (side === 'enemy') {
      if (this.enemyModel) this.scene.remove(this.enemyModel)
      this.enemyModel = model
    } else {
      if (this.playerModel) this.scene.remove(this.playerModel)
      this.playerModel = model
    }
    this.scene.add(model)
    model.userData.basePos = model.position.clone()
  }

  buildActor(unit, side) {
    const species = byId[unit.speciesId]
    const c = createCreature(unit.speciesId, { battle: true, scale: 1 })
    c.group.scale.setScalar(0.001)
    c.group.userData.baseScale = 1
    const compact = this.camera.aspect < 0.85
    const spread = compact ? 1.55 : 2.45
    const x = side === 'enemy' ? -spread : spread
    const z = side === 'enemy' ? -1.5 : 2.0
    c.group.position.set(x, 0.5, z)
    c.group.rotation.y = side === 'enemy' ? 0.35 : Math.PI - 0.28
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.66, 0.92, 30),
      new THREE.MeshBasicMaterial({
        color: typeColor(species.type), transparent: true, opacity: 0.45,
        side: THREE.DoubleSide, depthWrite: false
      })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    c.group.add(ring)
    c.group.userData.ring = ring
    return c.group
  }

  async start(enemy, playerUnit) {
    this.enemyUnit = enemy
    this.playerUnit = playerUnit
    this.state = 'intro'
    this.startTime = this.time
    this.turnBusy = true
    this.ends = null
    this.dom.root.classList.remove('hidden')
    this.dom.root.classList.add('battle-in')
    this.dom.damage.innerHTML = ''
    this.dom.turn.textContent = 'GET READY'
    const enemySpecies = byId[enemy.speciesId]
    const playerSpecies = byId[playerUnit.speciesId]
    this.dom.enemyName.textContent = enemySpecies.name
    this.dom.enemyLevel.textContent = 'Lv ' + enemy.level
    this.dom.enemyType.textContent = TYPES[enemySpecies.type].label
    this.dom.enemyType.style.background = TYPES[enemySpecies.type].color
    this.dom.playerName.textContent = playerSpecies.name
    this.dom.playerLevel.textContent = 'Lv ' + playerUnit.level
    this.dom.playerType.textContent = TYPES[playerSpecies.type].label
    this.dom.playerType.style.background = TYPES[playerSpecies.type].color
    this.playerModel = this.buildActor(playerUnit, 'player')
    this.enemyModel = this.buildActor(enemy, 'enemy')
    this.setActor(this.playerModel, 'player')
    this.setActor(this.enemyModel, 'enemy')
    this.setMoveButtons(playerUnit)
    this.updateHp(playerUnit, 'player')
    this.updateHp(enemy, 'enemy')
    this.setOrbs(this.cb.getOrbs())
    this.audio.encounter()
    this.log(`A wild <b>${enemySpecies.name}</b> appeared!`, 'wild')
    this.banner(`Wild ${enemySpecies.name}`, `Lv ${enemy.level} · ${TYPES[enemySpecies.type].label}`, 1800, 'wild')
    const grow = { p: 0 }
    await this.animate(0.65, t => {
      grow.p = t
      const e = 1 - Math.pow(1 - t, 3)
      const s = 1.55 * e
      this.playerModel.scale.setScalar(s)
      this.enemyModel.scale.setScalar(s)
    })
    this.state = 'player'
    this.setBusy(false)
    this.log(`Go, <b>${playerSpecies.name}</b>! Choose a move.`)
  }

  animate(duration, update) {
    return new Promise(resolve => {
      this.anim = { duration, update, resolve }
    })
  }

  async lunge(attacker, defender) {
    const base = attacker.userData.basePos
    const dir = new THREE.Vector3().subVectors(defender.userData.basePos, base).normalize()
    await this.animate(0.55, t => {
      const k = Math.sin(Math.min(1, t * 1.4) * Math.PI)
      attacker.position.copy(base).addScaledVector(dir, k * 1.25)
      attacker.position.y = base.y + Math.sin(k * Math.PI) * 0.5
      attacker.rotation.x = Math.sin(t * Math.PI) * -0.2
    })
    attacker.position.copy(base)
    attacker.rotation.x = 0
  }

  async hitModel(unit, side, damage, type, crit) {
    const model = side === 'enemy' ? this.enemyModel : this.playerModel
    const base = model.userData.basePos
    this.addParticles(type, side, crit ? 24 : 14, crit ? 1.4 : 1)
    this.shakeAmount = crit ? 0.34 : 0.18
    const flashMats = []
    model.traverse(o => {
      if (o.isMesh && o.material && o.material.emissive) {
        o.material.emissive.setHex(0xffffff)
        o.material.emissiveIntensity = 0.9
        flashMats.push(o.material)
      }
    })
    const dir = side === 'enemy' ? 1 : -1
    await this.animate(0.42, t => {
      const k = Math.sin(t * Math.PI)
      model.position.x = base.x + k * 0.4 * dir
      model.rotation.z = k * 0.22 * dir
    })
    model.position.copy(base)
    model.rotation.z = 0
    for (const m of flashMats) {
      m.emissive.setHex(0x000000)
      m.emissiveIntensity = 0
    }
    this.showDamage(damage, model, crit)
    this.audio.hit(type)
    unit.hp = Math.max(0, unit.hp - damage)
    this.updateHp(unit, side)
  }

  showDamage(amount, model, crit) {
    if (!model || amount <= 0) return
    const pos = model.position.clone()
    pos.y += 3.0
    pos.project(this.camera)
    const x = (pos.x * 0.5 + 0.5) * this.viewport.width
    const y = (-pos.y * 0.5 + 0.5) * this.viewport.height
    const el = document.createElement('div')
    el.className = 'damage-float' + (crit ? ' crit' : '')
    el.textContent = '-' + amount
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    this.dom.damage.appendChild(el)
    setTimeout(() => el.remove(), 1100)
  }

  calcDamage(attacker, defender, move) {
    const atkSpecies = byId[attacker.speciesId]
    const defSpecies = byId[defender.speciesId]
    const mult = effectiveness(move.type, defSpecies.type)
    const crit = Math.random() < 0.11
    const variance = rand(0.82, 1.08)
    let dmg = move.power * variance * (1 + (attacker.level - 5) * 0.035) * mult
    if (crit) dmg *= 1.55
    if (move.type === atkSpecies.type) dmg *= 1.15
    return { damage: Math.max(1, Math.round(dmg)), mult, crit }
  }

  async useMove(moveId) {
    if (this.state !== 'player' || this.turnBusy) return
    this.audio.init()
    this.audio.click()
    this.setBusy(true)
    this.state = 'busy'
    this.dom.turn.textContent = 'YOUR TURN'
    const move = MOVES[moveId]
    const playerSpecies = byId[this.playerUnit.speciesId]
    this.log(`<b>${playerSpecies.name}</b> used <b>${move.name}</b>!`)
    this.audio.select()
    await this.lunge(this.playerModel, this.enemyModel)
    const hit = this.calcDamage(this.playerUnit, this.enemyUnit, move)
    const damage = this.admin?.oneHit ? this.enemyUnit.hp : hit.damage
    const { mult, crit } = hit
    await this.hitModel(this.enemyUnit, 'enemy', damage, move.type, crit)
    this.log(
      (crit ? 'A critical hit! ' : '') +
      (mult > 1 ? 'It was super effective! ' : mult < 1 ? 'It was not very effective... ' : '') +
      `<b>${damage}</b> damage.`
    )
    await wait(560)
    if (this.enemyUnit.hp <= 0) {
      await this.enemyFainted()
      return
    }
    await wait(250)
    await this.enemyTurn()
  }

  async enemyTurn() {
    if (this.state === 'ended') return
    this.state = 'enemy'
    this.setBusy(true)
    this.dom.turn.textContent = 'ENEMY TURN'
    const enemySpecies = byId[this.enemyUnit.speciesId]
    const moveId = enemySpecies.moves[Math.floor(Math.random() * enemySpecies.moves.length)]
    const move = MOVES[moveId]
    this.log(`<b>${enemySpecies.name}</b> used <b>${move.name}</b>!`, 'enemy')
    await wait(420)
    await this.lunge(this.enemyModel, this.playerModel)
    const hit = this.calcDamage(this.enemyUnit, this.playerUnit, move)
    const damage = this.admin?.invincible ? 0 : hit.damage
    const { mult, crit } = hit
    await this.hitModel(this.playerUnit, 'player', damage, move.type, crit)
    this.log(
      (crit ? 'A critical hit! ' : '') +
      (mult > 1 ? 'It was super effective! ' : mult < 1 ? 'It was not very effective... ' : '') +
      `<b>${damage}</b> damage.`
    )
    await wait(500)
    if (this.playerUnit.hp <= 0) {
      await this.playerFainted()
      return
    }
    this.state = 'player'
    this.setBusy(false)
    this.log(`What will <b>${byId[this.playerUnit.speciesId].name}</b> do?`)
  }

  async enemyFainted() {
    this.state = 'ended'
    this.setBusy(true)
    this.dom.turn.textContent = 'VICTORY'
    this.log(`Wild <b>${byId[this.enemyUnit.speciesId].name}</b> fainted!`, 'win')
    this.audio.victory()
    const model = this.enemyModel
    const base = model.userData.basePos
    await this.animate(0.9, t => {
      const e = t * t
      model.position.y = base.y - e * 1.6
      model.rotation.z = e * 1.1
      model.rotation.x = e * 0.3
      const s = 1.55 * (1 - e * 0.4)
      model.scale.setScalar(s)
    })
    this.burst(model, 0xfff0b0, 28)
    await wait(300)
    this.banner('Victory!', `+3 Wild Orbs · ${byId[this.playerUnit.speciesId].name} bonds with you`, 2000, 'win')
    this.cb.addOrbs(3)
    this.setOrbs(this.cb.getOrbs())
    await wait(2100)
    this.finish({ result: 'win' })
  }

  async playerFainted() {
    this.state = 'ended'
    this.setBusy(true)
    this.dom.turn.textContent = 'FAINTED'
    this.log(`<b>${byId[this.playerUnit.speciesId].name}</b> fainted!`, 'lose')
    this.audio.catchFail()
    const model = this.playerModel
    const base = model.userData.basePos
    await this.animate(0.8, t => {
      model.position.y = base.y - t * 1.2
      model.rotation.z = -t * 1.0
    })
    await wait(300)
    this.banner('Team Exhausted', 'You wake up back at camp...', 2200, 'lose')
    await wait(2300)
    this.finish({ result: 'lose' })
  }

  async tryCatch() {
    if (this.state !== 'player' || this.turnBusy) return
    if (!this.admin?.infiniteOrbs && this.cb.getOrbs() <= 0) {
      this.log('You are out of Wild Orbs! Win battles to earn more.')
      return
    }
    this.audio.init()
    this.audio.click()
    this.state = 'busy'
    this.setBusy(true)
    this.dom.turn.textContent = 'THROWING'
    if (!this.admin?.infiniteOrbs) this.cb.useOrb()
    this.setOrbs(this.cb.getOrbs())
    const enemySpecies = byId[this.enemyUnit.speciesId]
    this.log(`You threw a Wild Orb at <b>${enemySpecies.name}</b>!`)
    this.audio.throwOrb()

    const orb = makeOrb()
    const start = new THREE.Vector3(3.0, 0.6, 4.6)
    const target = this.enemyModel.position.clone()
    target.y += 1.7
    const peak = new THREE.Vector3((start.x + target.x) / 2, 5.2, (start.z + target.z) / 2)
    orb.position.copy(start)
    orb.scale.setScalar(0.7)
    this.scene.add(orb)
    await this.animate(0.62, t => {
      const a = (1 - t) * (1 - t)
      const b = 2 * (1 - t) * t
      const c = t * t
      orb.position.set(
        a * start.x + b * peak.x + c * target.x,
        a * start.y + b * peak.y + c * target.y,
        a * start.z + b * peak.z + c * target.z
      )
      orb.rotation.x += 0.2
      orb.rotation.z += 0.14
      orb.rotation.y += 0.1
    })
    orb.position.copy(target)

    const shrinkScale = { s: 1.55 }
    this.burst(this.enemyModel, 0xffe794, 18)
    await this.animate(0.32, t => {
      const s = 1.55 * (1 - t * 0.98)
      this.enemyModel.scale.setScalar(Math.max(0.02, s))
      this.playerModel.scale.setScalar(1.55)
    })
    this.enemyModel.visible = false
    this.banner('Wild Orb', 'The orb is shaking...', 1400, 'catch')

    const missing = 1 - this.enemyUnit.hp / this.enemyUnit.maxHp
    const chance = clamp(0.3 + missing * 0.52 + (this.playerUnit.level - this.enemyUnit.level) * 0.015, 0.22, 0.94)
    const success = this.admin?.perfectCatch ? true : Math.random() < chance
    const shakes = success ? 3 : Math.random() < 0.5 ? 1 : 2

    for (let i = 0; i < 3; i++) {
      await wait(650)
      if (i < shakes) {
        this.audio.shake()
        await this.animate(0.36, t => {
          const k = Math.sin(t * Math.PI)
          orb.position.x = target.x + k * 0.22
          orb.rotation.z = k * 0.5
        })
        orb.position.x = target.x
        orb.rotation.z = 0
      } else {
        await this.animate(0.28, t => {
          orb.rotation.z = Math.sin(t * Math.PI * 2) * 0.14
        })
      }
    }
    await wait(350)

    if (success) {
      this.audio.catchSuccess()
      this.banner('Gotcha!', `${enemySpecies.name} was caught!`, 2400, 'catch')
      this.burst(orb, 0xfff3a8, 36)
      const glow = glowSprite('#fff2a0', 5, 1)
      glow.position.copy(orb.position)
      this.scene.add(glow)
      await this.animate(0.7, t => {
        orb.rotation.y += 0.15
        glow.scale.setScalar(4 + t * 3)
        glow.material.opacity = 1 - t * 0.7
      })
      this.cb.onCatch(this.enemyUnit)
      await wait(2300)
      this.scene.remove(orb)
      this.finish({ result: 'catch', unit: this.enemyUnit })
    } else {
      this.audio.catchFail()
      this.banner('It broke free!', `${enemySpecies.name} escaped the orb!`, 1300, 'lose')
      this.burst(orb, 0xffffff, 20)
      this.enemyModel.visible = true
      await this.animate(0.4, t => {
        const s = 0.02 + t * 1.53
        this.enemyModel.scale.setScalar(s)
        orb.position.y += (1 - t) * 0.03
      })
      await wait(650)
      this.scene.remove(orb)
      await this.enemyTurn()
    }
  }

  async tryRun() {
    if (this.state !== 'player' || this.turnBusy) return
    this.audio.click()
    this.state = 'busy'
    this.setBusy(true)
    this.log('You got away safely!')
    this.banner('Got Away', 'Back to the meadow', 1200, '')
    await wait(1250)
    this.finish({ result: 'run' })
  }

  finish(result) {
    this.state = 'ended'
    this.setBusy(true)
    this.ends = result
    this.dom.root.classList.remove('battle-in')
    setTimeout(() => {
      this.dom.root.classList.add('hidden')
      this.cleanup()
      this.cb.onEnd(result)
    }, 250)
  }

  cleanup() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh)
      p.mesh.material.dispose()
    }
    this.particles.length = 0
    if (this.enemyModel) this.scene.remove(this.enemyModel)
    if (this.playerModel) this.scene.remove(this.playerModel)
    this.enemyModel = null
    this.playerModel = null
    this.anim = null
    this.state = 'idle'
    this.dom.damage.innerHTML = ''
  }

  update(dt) {
    this.time += dt
    const t = this.time
    this.camera.position.x = this.basePos.x + Math.sin(t * 0.18) * 0.28
    this.camera.position.y = this.basePos.y + Math.sin(t * 0.31) * 0.09 + (this.shakeAmount > 0 ? Math.sin(t * 90) * this.shakeAmount : 0)
    this.camera.position.z = this.basePos.z
    if (this.shakeAmount > 0) this.shakeAmount = Math.max(0, this.shakeAmount - dt * 1.4)
    this.camera.lookAt(0, 1.65, 0)
    this.camera.updateMatrixWorld()

    if (this.anim) {
      this.anim.elapsed = (this.anim.elapsed || 0) + dt
      const t2 = Math.min(1, this.anim.elapsed / this.anim.duration)
      this.anim.update(t2)
      if (t2 >= 1) {
        const resolve = this.anim.resolve
        this.anim = null
        resolve()
      }
    }

    const active = [this.playerModel, this.enemyModel].filter(Boolean)
    if (this.playerModel) animateCreature({ group: this.playerModel }, t, this.state === 'idle', 1)
    if (this.enemyModel) animateCreature({ group: this.enemyModel }, t + 1.4, false, 1)

    for (const model of active) {
      const ring = model.userData.ring
      if (ring) {
        ring.material.opacity = 0.3 + Math.sin(t * 2.2) * 0.12
        ring.rotation.z = t * 0.3
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt
      if (p.life <= 0) {
        this.scene.remove(p.mesh)
        p.mesh.material.dispose()
        this.particles.splice(i, 1)
        continue
      }
      p.vel.y -= p.gravity * dt
      p.mesh.position.addScaledVector(p.vel, dt)
      p.mesh.rotation.x += p.spin * dt
      p.mesh.rotation.y += p.spin * 0.7 * dt
      p.mesh.material.opacity = clamp(p.life / p.maxLife, 0, 1)
      p.mesh.scale.multiplyScalar(1 - dt * 0.6)
    }

    for (const island of this.islands) {
      island.position.y = island.userData.baseY + Math.sin(t * 0.6 + island.userData.phase) * 0.5
      island.rotation.y += island.userData.spin * dt
    }

    const pos = this.motes.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * 0.22
      if (y > 15) y = 0.5
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.5 + i) * dt * 0.12)
    }
    pos.needsUpdate = true
    this.motes.material.opacity = 0.45 + Math.sin(t * 0.8) * 0.2
  }
}
