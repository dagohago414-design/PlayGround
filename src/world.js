import * as THREE from 'three'
import {
  addPart, clamp, damp, fbm, flatMat, glowSprite, labelTexture, lerp,
  makeRadialTexture, pick, rand, seeded, sphere, toonMat
} from './lib.js'

const WORLD_SIZE = 240
const POND = new THREE.Vector2(30, -25)
const POND_RADIUS = 15.5
const WATER_LEVEL = 0.05

export function terrainHeight(x, z) {
  let h = fbm(x * 0.022 + 4.2, z * 0.022 + 8.7, 4) * 7.2 - 3.1
  h += Math.sin(x * 0.075 + 1.2) * 0.45 + Math.cos(z * 0.063 - 0.8) * 0.4
  h += (fbm(x * 0.09 + 12, z * 0.09 + 2, 2) - 0.5) * 0.8

  const spawnFlat = 1 - smoothstep(5, 30, Math.hypot(x, z - 9))
  h = lerp(h, 0.15, spawnFlat * 0.95)

  const pondDist = Math.hypot(x - POND.x, z - POND.y)
  h -= 3.9 * Math.exp(-Math.pow(pondDist / 12.5, 2))
  h += smoothstep(15, 26, pondDist) * 0

  const edge = Math.max(Math.abs(x), Math.abs(z))
  h += smoothstep(74, 112, edge) * 7.5
  return h
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function makeSky() {
  const uniforms = {
    topColor: { value: new THREE.Color('#2f9fe8') },
    midColor: { value: new THREE.Color('#8bd4f7') },
    horizonColor: { value: new THREE.Color('#ffe8c7') },
    sunDirection: { value: new THREE.Vector3(0.55, 0.38, 0.3).normalize() }
  }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      uniform vec3 sunDirection;
      varying vec3 vWorld;
      void main() {
        vec3 dir = normalize(vWorld);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(horizonColor, midColor, smoothstep(0.46, 0.62, h));
        col = mix(col, topColor, smoothstep(0.6, 0.95, h));
        float sun = max(dot(dir, sunDirection), 0.0);
        col += vec3(1.0, 0.82, 0.55) * pow(sun, 18.0) * 0.7;
        col += vec3(1.0, 0.9, 0.65) * pow(sun, 4.0) * 0.1;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  })
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 20), mat)
  sky.frustumCulled = false
  return sky
}

function makeClouds(scene, rng) {
  const group = new THREE.Group()
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, metalness: 0, flatShading: true,
    transparent: true, opacity: 0.94, depthWrite: false
  })
  const geo = new THREE.IcosahedronGeometry(1, 1)
  for (let i = 0; i < 16; i++) {
    const cloud = new THREE.Group()
    const puffs = 4 + Math.floor(rng() * 4)
    const scale = rand(3.2, 7)
    for (let j = 0; j < puffs; j++) {
      const puff = new THREE.Mesh(geo, cloudMat)
      puff.position.set((j - puffs / 2) * 1.4 + rand(-0.4, 0.4), rand(-0.4, 0.5), rand(-0.9, 0.9))
      puff.scale.set(rand(1.1, 1.8) * scale, rand(0.5, 0.85) * scale, rand(0.9, 1.4) * scale)
      cloud.add(puff)
    }
    const angle = (i / 16) * Math.PI * 2 + rng() * 0.4
    const radius = rand(75, 165)
    cloud.position.set(Math.cos(angle) * radius, rand(34, 58), Math.sin(angle) * radius)
    cloud.rotation.y = -angle + Math.PI / 2
    cloud.userData.drift = rand(0.35, 1.1)
    group.add(cloud)
  }
  group.userData.clouds = group.children
  scene.add(group)
  return group
}

function makeMountains(scene, rng) {
  const group = new THREE.Group()
  const shades = [0x6f9fb3, 0x7faeb8, 0x8db9bd, 0x6392a8, 0x9ac4c4]
  const rockGeo = new THREE.ConeGeometry(1, 1, 5, 3)
  const snowGeo = new THREE.ConeGeometry(1, 1, 5, 1)
  for (let i = 0; i < 46; i++) {
    const angle = (i / 46) * Math.PI * 2 + rng() * 0.09
    const radius = rand(96, 145)
    const height = rand(14, 38)
    const width = height * rand(0.42, 0.78)
    const color = pick(shades)
    const mountain = new THREE.Mesh(rockGeo, flatMat(color, { roughness: 1 }))
    mountain.position.set(Math.cos(angle) * radius, height / 2 - 3.5, Math.sin(angle) * radius)
    mountain.scale.set(width, height, width * rand(0.75, 1.15))
    mountain.rotation.y = rng() * Math.PI
    group.add(mountain)
    if (height > 27) {
      const snow = new THREE.Mesh(snowGeo, flatMat(0xf3f8fb, { roughness: 1 }))
      snow.position.copy(mountain.position)
      snow.position.y += height * 0.34
      snow.scale.set(width * 0.34, height * 0.3, width * 0.3)
      snow.rotation.y = mountain.rotation.y + 0.2
      group.add(snow)
    }
  }
  group.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false } })
  scene.add(group)
  return group
}

function buildTerrain(scene) {
  const segments = 170
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segments, segments)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const base = new THREE.Color()
  const paths = []

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const y = terrainHeight(x, z)
    pos.setY(i, y)
    paths.push(x, z)

    const n = fbm(x * 0.07 + 20, z * 0.07 + 3, 3)
    const meadow = new THREE.Color().setHSL(0.27 + n * 0.035, 0.5 + n * 0.13, 0.42 + n * 0.13)
    const shade = smoothstep(-18, -40, z) * 0.06
    meadow.offsetHSL(0, 0, shade)
    const pondDist = Math.hypot(x - POND.x, z - POND.y)
    if (pondDist < 18.5) {
      const t = smoothstep(12.5, 18.5, pondDist)
      const sand = new THREE.Color(0xe8cf9a).offsetHSL(0, 0, (n - 0.5) * 0.06)
      meadow.lerp(sand, 1 - t)
    }
    if (y < WATER_LEVEL - 0.25) meadow.lerp(new THREE.Color(0xa9a06a), 0.45)
    base.copy(meadow)
    colors[i * 3] = base.r
    colors[i * 3 + 1] = base.g
    colors[i * 3 + 2] = base.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.97, metalness: 0, flatShading: true
  })
  const ground = new THREE.Mesh(geo, mat)
  ground.receiveShadow = true
  scene.add(ground)
  return ground
}

function buildPath(scene) {
  const points = [
    new THREE.Vector3(0, 0, 22),
    new THREE.Vector3(-0.4, 0, 14),
    new THREE.Vector3(1.6, 0, 6),
    new THREE.Vector3(0.6, 0, -2),
    new THREE.Vector3(5.5, 0, -9),
    new THREE.Vector3(12.5, 0, -14),
    new THREE.Vector3(17.5, 0, -18)
  ]
  const curve = new THREE.CatmullRomCurve3(points)
  const divisions = 120
  const halfWidth = 1.45
  const verts = []
  const cols = []
  const indices = []
  const c1 = new THREE.Color(0xefd3a0)
  const c2 = new THREE.Color(0xdfc08a)
  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions
    const p = curve.getPoint(t)
    const tangent = curve.getTangent(t)
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
    for (const s of [-1, 1]) {
      const x = p.x + side.x * halfWidth * s
      const z = p.z + side.z * halfWidth * s
      verts.push(x, terrainHeight(x, z) + 0.055, z)
      const c = c1.clone().lerp(c2, 0.5 + Math.sin(i * 0.8) * 0.5)
      cols.push(c.r, c.g, c.b)
    }
    if (i < divisions) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, flatShading: true, polygonOffset: true, polygonOffsetFactor: -1
  }))
  mesh.receiveShadow = true
  scene.add(mesh)
  return { curve, mesh }
}

function buildPond(scene) {
  const geo = new THREE.CircleGeometry(POND_RADIUS + 2.2, 72)
  const uniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color('#177fb3') },
    uShallow: { value: new THREE.Color('#67d8d8') },
    uSky: { value: new THREE.Color('#d9f4ff') }
  }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 p = position;
        float w = sin(p.x * 1.8 + uTime * 1.6) * 0.045 +
                  sin(p.y * 2.4 - uTime * 1.2) * 0.04 +
                  sin((p.x + p.y) * 3.1 + uTime * 2.2) * 0.02;
        p.z += w;
        vWave = w;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uSky;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec2 c = vUv - 0.5;
        float r = length(c) * 2.0;
        float ripple = sin(r * 26.0 - uTime * 2.2 + sin(vWorld.x * 0.7) * 2.0) * 0.5 + 0.5;
        float rings = smoothstep(0.7, 1.0, sin(r * 34.0 - uTime * 1.4) * 0.5 + 0.5);
        vec3 col = mix(uDeep, uShallow, smoothstep(0.25, 1.0, r) * 0.85);
        col = mix(col, uSky, 0.16 + ripple * 0.12);
        col += vec3(0.7, 0.95, 1.0) * rings * 0.12;
        float alpha = mix(0.82, 0.97, smoothstep(0.2, 1.0, r));
        gl_FragColor = vec4(col, alpha);
      }
    `
  })
  const water = new THREE.Mesh(geo, mat)
  water.rotation.x = -Math.PI / 2
  water.position.set(POND.x, WATER_LEVEL, POND.y)
  water.renderOrder = 2
  scene.add(water)

  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false
  })
  const foam = new THREE.Mesh(new THREE.RingGeometry(POND_RADIUS - 0.4, POND_RADIUS + 0.9, 72), foamMat)
  foam.rotation.x = -Math.PI / 2
  foam.position.set(POND.x, WATER_LEVEL + 0.03, POND.y)
  foam.renderOrder = 3
  scene.add(foam)

  const padGeo = new THREE.CylinderGeometry(1, 1, 0.07, 8)
  const padMat = toonMat(0x4f9c4e)
  const rng = seeded(42)
  for (let i = 0; i < 12; i++) {
    const angle = rng() * Math.PI * 2
    const radius = 3 + rng() * 9
    const pad = new THREE.Mesh(padGeo, padMat)
    pad.position.set(
      POND.x + Math.cos(angle) * radius,
      WATER_LEVEL + 0.05,
      POND.y + Math.sin(angle) * radius
    )
    const s = rand(0.35, 0.85)
    pad.scale.set(s, 1, s * rand(0.8, 1.2))
    pad.rotation.y = rng() * Math.PI
    pad.receiveShadow = true
    scene.add(pad)
    if (rng() > 0.6) {
      const lotus = new THREE.Group()
      for (let p = 0; p < 6; p++) {
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), toonMat(0xffb7d5))
        petal.position.set(Math.cos(p / 6 * Math.PI * 2) * 0.22, 0.14, Math.sin(p / 6 * Math.PI * 2) * 0.22)
        petal.rotation.set(0.7, p / 6 * Math.PI * 2, 0)
        lotus.add(petal)
      }
      const core = new THREE.Mesh(sphere(0.13, 8), toonMat(0xffe36b))
      lotus.add(core)
      lotus.position.copy(pad.position)
      lotus.position.y += 0.18
      scene.add(lotus)
    }
  }

  const dockDir = new THREE.Vector2(-POND.x, 9 - POND.y).normalize()
  const dockStart = new THREE.Vector2(POND.x, POND.y).addScaledVector(dockDir, POND_RADIUS - 1.5)
  const dock = new THREE.Group()
  const wood = flatMat(0xa9714b, { roughness: 0.9 })
  const woodDark = flatMat(0x835333, { roughness: 0.95 })
  for (let i = 0; i < 9; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.6), i % 2 ? wood : woodDark)
    plank.position.set(0, -0.05 - i * 0.03, i * 0.6)
    plank.receiveShadow = true
    plank.castShadow = true
    dock.add(plank)
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.4, 6), woodDark)
      post.position.set(side * 1.15, -1.05, 0.6 + i * 2.1)
      post.castShadow = true
      dock.add(post)
    }
  }
  const dockY = terrainHeight(dockStart.x, dockStart.y)
  dock.position.set(dockStart.x, Math.max(dockY, WATER_LEVEL) + 0.18, dockStart.y)
  dock.rotation.y = Math.atan2(dockDir.x, dockDir.y)
  scene.add(dock)

  const reeds = new THREE.Group()
  const reedMat = toonMat(0x6b9a49)
  const reedRng = seeded(7)
  for (let i = 0; i < 60; i++) {
    const angle = reedRng() * Math.PI * 2
    const radius = POND_RADIUS + rand(-1.5, 1.8)
    const x = POND.x + Math.cos(angle) * radius
    const z = POND.y + Math.sin(angle) * radius
    const base = terrainHeight(x, z)
    if (base > WATER_LEVEL + 0.5) continue
    for (let j = 0; j < 4; j++) {
      const reed = new THREE.Mesh(new THREE.ConeGeometry(0.05, rand(1, 1.8), 3), reedMat)
      reed.position.set(x + rand(-0.7, 0.7), WATER_LEVEL + rand(0.3, 0.75), z + rand(-0.7, 0.7))
      reed.rotation.z = rand(-0.15, 0.15)
      reeds.add(reed)
    }
  }
  scene.add(reeds)

  return { water, uniforms, foam, dock }
}

function addTree(scene, colliders, x, z, rng, variant = 'broad') {
  const y = terrainHeight(x, z)
  const group = new THREE.Group()
  group.position.set(x, y, z)
  const scale = rand(0.85, 1.5)
  group.scale.setScalar(scale)
  group.rotation.y = rng() * Math.PI * 2
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.5, 3.2, 6), flatMat(0x7c5238, { roughness: 1 }))
  trunk.position.y = 1.6
  trunk.castShadow = true
  trunk.receiveShadow = true
  group.add(trunk)
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.24, 2.1, 5), flatMat(0x7c5238, { roughness: 1 }))
  branch.position.set(0.7, 2.7, 0.1)
  branch.rotation.z = -0.7
  branch.castShadow = true
  group.add(branch)

  if (variant === 'pine') {
    const shades = [0x2f7f4e, 0x3b9256, 0x2a7047]
    for (let i = 0; i < 4; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(2.3 - i * 0.42, 2.0 - i * 0.14, 7),
        flatMat(shades[i % shades.length], { roughness: 0.95 })
      )
      cone.position.y = 3.2 + i * 1.15
      cone.rotation.y = rng() * Math.PI
      cone.castShadow = true
      cone.receiveShadow = true
      group.add(cone)
    }
  } else {
    const palette = variant === 'pink'
      ? [0xf4a6c8, 0xffc3dc, 0xe58ab5]
      : [0x55a94c, 0x6ec15a, 0x43983f, 0x7cc966]
    const blobs = 4 + Math.floor(rng() * 3)
    for (let i = 0; i < blobs; i++) {
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.05, 1.7), 1), flatMat(pick(palette), { roughness: 0.95 }))
      blob.position.set(rand(-1.5, 1.5), rand(3.3, 5.1), rand(-1.4, 1.4))
      blob.rotation.set(rng() * 3, rng() * 3, rng() * 3)
      blob.castShadow = true
      blob.receiveShadow = true
      group.add(blob)
    }
  }
  scene.add(group)
  colliders.push({ x, z, r: 0.95 * scale })
  return group
}

function addRock(scene, colliders, x, z, rng, scale = 1, mossy = true) {
  const y = terrainHeight(x, z)
  const group = new THREE.Group()
  const geo = new THREE.DodecahedronGeometry(1, 0)
  const rock = new THREE.Mesh(geo, flatMat(0x9aa0a2, { roughness: 1 }))
  rock.position.set(0, 0.55, 0)
  rock.scale.set(rand(0.7, 1.3) * scale, rand(0.55, 1.05) * scale, rand(0.75, 1.25) * scale)
  rock.rotation.set(rng() * 3, rng() * 3, rng() * 3)
  rock.castShadow = true
  rock.receiveShadow = true
  group.add(rock)
  if (mossy) {
    const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * scale, 1), flatMat(0x6f9f4e, { roughness: 1 }))
    moss.position.set(rand(-0.3, 0.3), 0.95 * scale, rand(-0.3, 0.3))
    moss.scale.y = 0.35
    moss.castShadow = true
    group.add(moss)
  }
  group.position.set(x, y, z)
  scene.add(group)
  colliders.push({ x, z, r: 0.9 * scale })
  return group
}

function buildSettlement(scene, colliders) {
  const camp = new THREE.Group()
  camp.position.set(-7.5, terrainHeight(-7.5, 13.5), 13.5)
  camp.rotation.y = 0.35

  const tentMat = flatMat(0xd95e4e, { roughness: 0.9 })
  const tent = new THREE.Mesh(new THREE.ConeGeometry(3.1, 3.0, 4), tentMat)
  tent.position.y = 1.5
  tent.rotation.y = Math.PI / 4
  tent.scale.z = 1.25
  tent.castShadow = true
  tent.receiveShadow = true
  camp.add(tent)
  const tentTrim = new THREE.Mesh(new THREE.ConeGeometry(3.18, 0.5, 4), flatMat(0xf3e5c2, { roughness: 0.9 }))
  tentTrim.position.y = 0.25
  tentTrim.rotation.y = Math.PI / 4
  tentTrim.scale.z = 1.25
  camp.add(tentTrim)
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.6), new THREE.MeshBasicMaterial({ color: 0x4b2b29 }))
  door.position.set(0, 0.85, 2.02)
  camp.add(door)
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshBasicMaterial({ color: 0xffd45e, side: THREE.DoubleSide }))
  flag.position.set(0, 3.45, 0)
  camp.add(flag)

  const logs = new THREE.Group()
  const logMat = flatMat(0x7a4e32, { roughness: 1 })
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.1, 6), logMat)
    log.position.set(0, 0.15, 0)
    log.rotation.z = Math.PI / 2
    log.rotation.y = (i / 4) * Math.PI
    log.castShadow = true
    logs.add(log)
  }
  const stoneRing = new THREE.Group()
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), flatMat(0x9b9b92))
    s.position.set(Math.cos(i / 8 * Math.PI * 2) * 0.95, 0.1, Math.sin(i / 8 * Math.PI * 2) * 0.95)
    s.castShadow = true
    stoneRing.add(s)
  }
  const flame = new THREE.Group()
  const flameOuter = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 6), new THREE.MeshBasicMaterial({ color: 0xff7a21, transparent: true, opacity: 0.9 }))
  flameOuter.position.y = 0.72
  const flameInner = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0xffe066 }))
  flameInner.position.y = 0.6
  const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  flameCore.position.y = 0.5
  flame.add(flameOuter, flameInner, flameCore)
  const fireGlow = glowSprite('#ffb14a', 4.4, 0.7)
  fireGlow.position.y = 1
  const fireLight = new THREE.PointLight(0xffa54a, 22, 18, 1.7)
  fireLight.position.set(0, 1.6, 0)
  logs.position.set(2.2, 0, 0.4)
  stoneRing.position.copy(logs.position)
  flame.position.copy(logs.position)
  fireGlow.position.copy(logs.position).y += 1
  fireLight.position.copy(logs.position).y += 1.6
  camp.add(logs, stoneRing, flame, fireGlow, fireLight)
  camp.userData.flame = flame
  camp.userData.fireGlow = fireGlow
  camp.userData.fireLight = fireLight

  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.1), flatMat(0x9a6b3e, { roughness: 1 }))
  crate.position.set(-2.3, 0.45, 0.2)
  crate.castShadow = true
  camp.add(crate)
  scene.add(camp)
  colliders.push({ x: -7.5, z: 13.5, r: 3.3 })

  const signGroup = new THREE.Group()
  const signPos = new THREE.Vector3(8.5, 0, 1.5)
  signGroup.position.set(signPos.x, terrainHeight(signPos.x, signPos.z), signPos.z)
  signGroup.rotation.y = -0.62
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 2.2, 6), flatMat(0x7a5238))
  post.position.y = 1.1
  post.castShadow = true
  signGroup.add(post)
  const boardTex = labelTexture('WILDBOUND MEADOW', {
    width: 640, height: 180, font: '700 52px Baloo2', bg: '#7a5238', color: '#ffe9b9', accent: '#5b3a26'
  })
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.7, 0.14), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.95 }))
  board.position.y = 1.8
  board.castShadow = true
  signGroup.add(board)
  scene.add(signGroup)
  colliders.push({ x: signPos.x, z: signPos.z, r: 0.7 })

  camp.updateMatrixWorld(true)
  const firePos = new THREE.Vector3(2.2, 0, 0.4).applyMatrix4(camp.matrixWorld)
  return { camp, flame, fireGlow, fireLight, firePos }
}

function buildStoneCircle(scene, colliders) {
  const center = new THREE.Vector3(24, 0, 4)
  const group = new THREE.Group()
  group.position.set(center.x, terrainHeight(center.x, center.z), center.z)
  const stoneMat = flatMat(0x8d959a, { roughness: 1 })
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1.15, rand(2.1, 3.2), 0.8), stoneMat)
    stone.position.set(Math.cos(angle) * 4.4, 1.4, Math.sin(angle) * 4.4)
    stone.rotation.y = -angle
    stone.rotation.z = rand(-0.08, 0.08)
    stone.castShadow = true
    stone.receiveShadow = true
    group.add(stone)
    colliders.push({ x: center.x + Math.cos(angle) * 4.4, z: center.z + Math.sin(angle) * 4.4, r: 0.8 })
  }
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x7fe6d2, emissive: 0x1a8c86, emissiveIntensity: 0.9, roughness: 0.25,
    metalness: 0.1, flatShading: true, transparent: true, opacity: 0.92
  })
  const crystal = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(rand(0.18, 0.35), rand(1, 2.2), 5), crystalMat)
    shard.position.set(rand(-0.5, 0.5), rand(0.4, 1.1), rand(-0.5, 0.5))
    shard.rotation.set(rand(-0.25, 0.25), rand(0, 3), rand(-0.25, 0.25))
    crystal.add(shard)
  }
  crystal.position.y = 0.4
  const glow = glowSprite('#7fffe6', 5, 0.55)
  glow.position.y = 1.4
  group.add(crystal, glow)
  scene.add(group)
  colliders.push({ x: center.x, z: center.z, r: 1.3 })
  return { group, crystal, glow }
}

function buildWindmill(scene, colliders) {
  const x = -42, z = -40
  const y = terrainHeight(x, z)
  const group = new THREE.Group()
  group.position.set(x, y, z)
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.8, 12, 8), flatMat(0xf2e7ce, { roughness: 0.95 }))
  tower.position.y = 6
  tower.castShadow = true
  tower.receiveShadow = true
  group.add(tower)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.4, 8), flatMat(0xc95b47))
  roof.position.y = 13.2
  roof.castShadow = true
  group.add(roof)
  const hub = new THREE.Group()
  hub.position.set(0, 10.6, 3.0)
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group()
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 6.2, 0.16), flatMat(0xfaf2de))
    arm.position.y = 3.1
    arm.castShadow = true
    const sail = new THREE.Mesh(new THREE.BoxGeometry(1.15, 3.3, 0.07), flatMat(0xf6e7c6))
    sail.position.set(0.6, 3.6, 0)
    sail.castShadow = true
    blade.add(arm, sail)
    blade.rotation.z = (i / 4) * Math.PI * 2
    hub.add(blade)
  }
  group.add(hub)
  scene.add(group)
  colliders.push({ x, z, r: 3.3 })
  return { group, hub }
}

function buildGrassAndFlowers(scene) {
  const rng = seeded(2024)
  const zones = [
    { x: 0, z: -3, r: 7.5 }, { x: 12, z: -6, r: 6 }, { x: -9, z: -5, r: 6.5 },
    { x: 17, z: -35, r: 6 }, { x: -18, z: -16, r: 7 }, { x: 6, z: -18, r: 5 },
    { x: -27, z: 2, r: 6 }, { x: 38, z: 5, r: 5.5 }, { x: -5, z: -28, r: 6.5 }
  ]
  const bladeGeo = new THREE.ConeGeometry(0.052, 0.82, 3)
  bladeGeo.translate(0, 0.41, 0)
  const count = 2800
  const inst = new THREE.InstancedMesh(bladeGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), count)
  inst.castShadow = true
  inst.receiveShadow = true
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  const greens = [0x55a84c, 0x62b854, 0x48984a, 0x77c65f, 0x3f8a45]
  let idx = 0
  for (const zone of zones) {
    for (let i = 0; i < 260 && idx < count; i++) {
      const a = rng() * Math.PI * 2
      const rr = Math.sqrt(rng()) * zone.r
      const x = zone.x + Math.cos(a) * rr
      const z = zone.z + Math.sin(a) * rr
      const y = terrainHeight(x, z)
      if (y < WATER_LEVEL + 0.1) continue
      dummy.position.set(x, y, z)
      dummy.rotation.set(rand(-0.16, 0.16), rng() * Math.PI, rand(-0.2, 0.2))
      dummy.scale.set(rand(0.8, 1.4), rand(0.65, 1.18), rand(0.8, 1.4))
      dummy.updateMatrix()
      inst.setMatrixAt(idx, dummy.matrix)
      color.setHex(pick(greens)).offsetHSL(0, 0, rand(-0.04, 0.06))
      inst.setColorAt(idx, color)
      idx++
    }
  }
  for (let i = 0; i < 600 && idx < count; i++) {
    const x = rand(-55, 55), z = rand(-55, 55)
    const y = terrainHeight(x, z)
    const pondDist = Math.hypot(x - POND.x, z - POND.y)
    if (y < WATER_LEVEL + 0.2 || pondDist < POND_RADIUS + 1) continue
    dummy.position.set(x, y, z)
    dummy.rotation.set(rand(-0.1, 0.1), rng() * Math.PI, rand(-0.1, 0.1))
    dummy.scale.setScalar(rand(0.42, 0.72))
    dummy.updateMatrix()
    inst.setMatrixAt(idx, dummy.matrix)
    color.setHex(pick(greens))
    inst.setColorAt(idx, color)
    idx++
  }
  inst.count = idx
  inst.instanceMatrix.needsUpdate = true
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  scene.add(inst)

  const flowerCount = 240
  const stemGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.55, 4)
  stemGeo.translate(0, 0.27, 0)
  const stems = new THREE.InstancedMesh(stemGeo, new THREE.MeshStandardMaterial({ color: 0x4c8f42, roughness: 1 }), flowerCount)
  const headGeo = new THREE.IcosahedronGeometry(0.15, 0)
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.8, flatShading: true }), flowerCount)
  const flowerColors = [0xfff6c9, 0xffd166, 0xff96b7, 0xb7a7ff, 0xffffff, 0xff8b5e]
  for (let i = 0; i < flowerCount; i++) {
    const x = rand(-52, 52), z = rand(-52, 52)
    const y = terrainHeight(x, z)
    const pondDist = Math.hypot(x - POND.x, z - POND.y)
    if (y < WATER_LEVEL + 0.2 || pondDist < POND_RADIUS + 1) { dummy.position.set(0, -20, 0); dummy.scale.setScalar(0.001) }
    else {
      dummy.position.set(x, y, z)
      dummy.scale.setScalar(rand(0.7, 1.5))
      dummy.rotation.set(rand(-0.15, 0.15), rng() * 6, rand(-0.15, 0.15))
    }
    dummy.updateMatrix()
    stems.setMatrixAt(i, dummy.matrix)
    heads.setMatrixAt(i, dummy.matrix)
    color.setHex(pick(flowerColors))
    heads.setColorAt(i, color)
  }
  stems.castShadow = true
  heads.castShadow = true
  scene.add(stems, heads)

  return zones
}

function buildFireflies(scene) {
  const count = 140
  const positions = new Float32Array(count * 3)
  const base = []
  for (let i = 0; i < count; i++) {
    const x = rand(-38, 42), z = rand(-38, 30)
    const y = terrainHeight(x, z) + rand(1.2, 6.5)
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    base.push({ x, y, z, phase: rand(0, Math.PI * 2), speed: rand(0.5, 1.5), amp: rand(0.4, 1.4) })
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    map: makeRadialTexture('#fff6b0', [[0, 1], [0.28, 0.75], [1, 0]]),
    size: 0.55,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xfff2a8,
    sizeAttenuation: true
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  scene.add(points)
  return { points, base, positions, geo }
}

function buildPollen(scene) {
  const count = 220
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-35, 35)
    positions[i * 3 + 1] = rand(1, 14)
    positions[i * 3 + 2] = rand(-35, 25)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    map: makeRadialTexture('#ffffff', [[0, 1], [0.5, 0.4], [1, 0]]),
    size: 0.2, transparent: true, opacity: 0.55, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xfff5da, sizeAttenuation: true
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  scene.add(points)
  return points
}

function buildButterflies(scene) {
  const group = new THREE.Group()
  const colors = [0xffd45d, 0xffbed8, 0x9fe0ff, 0xfff2c8]
  const butterflies = []
  const wingGeo = new THREE.CircleGeometry(0.11, 3)
  for (let i = 0; i < 18; i++) {
    const b = new THREE.Group()
    const mat = new THREE.MeshBasicMaterial({ color: pick(colors), side: THREE.DoubleSide })
    const left = new THREE.Mesh(wingGeo, mat)
    left.rotation.y = 0.5
    left.position.x = -0.07
    const right = new THREE.Mesh(wingGeo, mat)
    right.rotation.y = -0.5
    right.position.x = 0.07
    b.add(left, right)
    const x = rand(-30, 34), z = rand(-32, 18)
    b.position.set(x, terrainHeight(x, z) + rand(1.2, 3), z)
    b.userData = { x, z, phase: rand(0, 6.28), speed: rand(0.3, 0.8), centerY: b.position.y, left, right }
    group.add(b)
    butterflies.push(b)
  }
  scene.add(group)
  return butterflies
}

function buildAmbientRocks(scene, colliders, rng) {
  const rocks = [
    [7, 12, 1.1], [-14, 2, 1.3], [13, -12, 0.9], [-22, -8, 1.5], [35, -8, 1.2],
    [9, -26, 1.0], [-13, -24, 0.8], [19, 14, 1.4], [-31, 10, 1.2], [40, -38, 1.6],
    [-20, 26, 1.1], [28, 20, 0.9], [-35, -19, 1.4], [48, 4, 1.5], [4, 26, 0.8]
  ]
  for (const [x, z, s] of rocks) addRock(scene, colliders, x, z, rng, s, rng() > 0.3)
}

function addMushrooms(scene, rng) {
  const group = new THREE.Group()
  const stemMat = toonMat(0xf0e5cf)
  const capMat = toonMat(0xe5624d)
  for (let i = 0; i < 24; i++) {
    const x = rand(-35, 38), z = rand(-38, 22)
    const y = terrainHeight(x, z)
    if (y < WATER_LEVEL + 0.2) continue
    const g = new THREE.Group()
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, rand(0.25, 0.55), 5), stemMat)
    stem.position.y = stem.geometry.parameters.height / 2
    const cap = new THREE.Mesh(new THREE.SphereGeometry(rand(0.14, 0.3), 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), capMat)
    cap.position.y = stem.position.y * 2
    cap.scale.y = 0.7
    cap.castShadow = true
    g.add(stem, cap)
    g.position.set(x, y, z)
    g.scale.setScalar(rand(0.8, 1.5))
    group.add(g)
  }
  scene.add(group)
}

export function buildWorld() {
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xc3e8f4, 55, 165)

  const sky = makeSky()
  scene.add(sky)
  const sun = glowSprite('#fff0bc', 46, 0.95)
  sun.position.set(105, 82, 55)
  scene.add(sun)
  const sunCore = glowSprite('#ffffff', 12, 0.9)
  sunCore.position.copy(sun.position)
  scene.add(sunCore)

  const hemi = new THREE.HemisphereLight(0xd6f2ff, 0x5b8f54, 1.65)
  scene.add(hemi)
  const dir = new THREE.DirectionalLight(0xfff1cc, 2.45)
  dir.position.set(42, 58, 26)
  dir.castShadow = true
  dir.shadow.mapSize.set(2048, 2048)
  dir.shadow.camera.left = -48
  dir.shadow.camera.right = 48
  dir.shadow.camera.top = 48
  dir.shadow.camera.bottom = -48
  dir.shadow.camera.near = 1
  dir.shadow.camera.far = 150
  dir.shadow.bias = -0.0006
  dir.shadow.normalBias = 0.02
  scene.add(dir)
  const fill = new THREE.DirectionalLight(0x8bc7ff, 0.55)
  fill.position.set(-30, 26, -35)
  scene.add(fill)

  const colliders = []
  const rng = seeded(1776)

  buildTerrain(scene)
  const path = buildPath(scene)
  const pond = buildPond(scene)
  const clouds = makeClouds(scene, rng)
  makeMountains(scene, rng)
  const settlement = buildSettlement(scene, colliders)
  const stones = buildStoneCircle(scene, colliders)
  const windmill = buildWindmill(scene, colliders)
  const grassZones = buildGrassAndFlowers(scene)
  buildAmbientRocks(scene, colliders, rng)
  addMushrooms(scene, rng)

  const treeSpots = [
    [-12, 1, 'broad'], [-17, -4, 'broad'], [-24, -1, 'pine'], [-3, -13, 'broad'],
    [8, -14, 'pine'], [16, 2, 'broad'], [11, 10, 'pink'], [-18, 12, 'broad'],
    [-26, 16, 'pine'], [3, -24, 'broad'], [22, -12, 'pine'], [34, -14, 'broad'],
    [-9, -31, 'pine'], [18, -25, 'broad'], [-31, -10, 'broad'], [28, 15, 'broad'],
    [38, 14, 'pine'], [-34, 26, 'broad'], [44, -16, 'pink'], [-24, -25, 'pine'],
    [8, 24, 'broad'], [-18, 32, 'pine'], [30, -36, 'broad'], [45, 22, 'pine'],
    [-39, 4, 'broad'], [14, -42, 'pine'], [-5, -42, 'broad'], [50, -8, 'broad'],
    [-30, -43, 'pine'], [24, 30, 'pink']
  ]
  for (const [x, z, variant] of treeSpots) addTree(scene, colliders, x + rand(-1, 1), z + rand(-1, 1), rng, variant)

  const fireflies = buildFireflies(scene)
  const pollen = buildPollen(scene)
  const butterflies = buildButterflies(scene)

  const wildSpawns = [
    { species: 'sproutle', x: 1.5, z: -3, level: 5, radius: 3.2 },
    { species: 'sproutle', x: 12, z: -6, level: 4, radius: 2.5 },
    { species: 'aquafin', x: 17.5, z: -16, level: 5, radius: 2.2 },
    { species: 'aquafin', x: 12, z: -13, level: 6, radius: 2.0 },
    { species: 'zappup', x: 23, z: 5, level: 6, radius: 2.8 },
    { species: 'zappup', x: -14, z: -16, level: 4, radius: 2.4 },
    { species: 'pebblit', x: 24, z: 2, level: 6, radius: 2.6 },
    { species: 'pebblit', x: -8, z: -24, level: 5, radius: 2.4 },
    { species: 'zephyro', x: -25, z: -20, level: 5, radius: 2.8 },
    { species: 'zephyro', x: 6, z: -30, level: 6, radius: 2.6 },
    { species: 'emberpaw', x: 8, z: 15, level: 4, radius: 2.2 },
    { species: 'cindercub', x: 11, z: 18, level: 4, radius: 2.2 },
    { species: 'tidepup', x: 20, z: -12, level: 5, radius: 2.0 },
    { species: 'mossling', x: 4, z: -8, level: 4, radius: 2.4 },
    { species: 'voltmoth', x: 21, z: 8, level: 6, radius: 2.4 },
    { species: 'cragoon', x: 27, z: 5, level: 7, radius: 2.2 },
    { species: 'breezle', x: -20, z: -24, level: 5, radius: 2.4 },
    { species: 'frostfawn', x: -30, z: -16, level: 6, radius: 2.6 },
    { species: 'snowmole', x: -18, z: 12, level: 4, radius: 2.2 },
    { species: 'emberfly', x: 5, z: 20, level: 5, radius: 2.6 },
    { species: 'duskpaw', x: 20, z: 0, level: 6, radius: 2.2 },
    { species: 'wispurr', x: -25, z: -12, level: 6, radius: 2.4 },
    { species: 'dracoil', x: -12, z: -30, level: 7, radius: 2.4 },
    { species: 'sparkit', x: 28, z: 10, level: 5, radius: 2.0 },
    { species: 'petalfin', x: 10, z: -2, level: 5, radius: 2.2 },
    { species: 'duneshell', x: -6, z: 18, level: 6, radius: 2.4 }
  ]

  const pondCircle = { x: POND.x, z: POND.y, r: POND_RADIUS - 0.6 }

  function isBlocked(x, z, radius = 0.45) {
    if (Math.hypot(x - pondCircle.x, z - pondCircle.z) < pondCircle.r + radius) return true
    for (const c of colliders) {
      if (Math.hypot(x - c.x, z - c.z) < c.r + radius) return true
    }
    return false
  }

  function update(dt, time) {
    pond.uniforms.uTime.value = time
    pond.foam.material.opacity = 0.18 + Math.sin(time * 0.8) * 0.06
    for (const cloud of clouds.userData.clouds) {
      cloud.position.x += cloud.userData.drift * dt
      if (cloud.position.x > 190) cloud.position.x = -190
    }
    const flame = settlement.flame
    flame.scale.set(
      1 + Math.sin(time * 9.2) * 0.08,
      1 + Math.sin(time * 11.3) * 0.16,
      1 + Math.cos(time * 8.4) * 0.08
    )
    flame.rotation.y += dt * 1.8
    settlement.fireLight.intensity = 18 + Math.sin(time * 12) * 4 + Math.sin(time * 23) * 2
    settlement.fireGlow.material.opacity = 0.55 + Math.sin(time * 9) * 0.1
    windmill.hub.rotation.z += dt * 0.34
    stones.crystal.rotation.y += dt * 0.25
    stones.crystal.position.y = 0.4 + Math.sin(time * 1.4) * 0.08
    stones.glow.material.opacity = 0.42 + Math.sin(time * 1.8) * 0.12

    for (let i = 0; i < fireflies.base.length; i++) {
      const b = fireflies.base[i]
      fireflies.positions[i * 3] = b.x + Math.sin(time * b.speed + b.phase) * b.amp
      fireflies.positions[i * 3 + 1] = b.y + Math.sin(time * b.speed * 0.7 + b.phase * 2) * 0.5
      fireflies.positions[i * 3 + 2] = b.z + Math.cos(time * b.speed * 0.8 + b.phase) * b.amp
    }
    fireflies.geo.attributes.position.needsUpdate = true
    fireflies.points.material.opacity = 0.55 + Math.sin(time * 0.7) * 0.25

    for (const b of butterflies) {
      const d = b.userData
      b.position.x = d.x + Math.sin(time * d.speed + d.phase) * 2.2
      b.position.z = d.z + Math.cos(time * d.speed * 0.8 + d.phase) * 1.8
      b.position.y = d.centerY + Math.sin(time * d.speed * 2 + d.phase) * 0.6
      b.rotation.y = time * d.speed + d.phase
      const flap = Math.sin(time * 12 + d.phase) * 0.7
      d.left.rotation.y = 0.5 + flap
      d.right.rotation.y = -0.5 - flap
    }

    const pollenPos = pollen.geometry.attributes.position
    for (let i = 0; i < pollenPos.count; i++) {
      let y = pollenPos.getY(i) + dt * 0.12
      if (y > 15) y = 0.5
      pollenPos.setY(i, y)
      pollenPos.setX(i, pollenPos.getX(i) + Math.sin(time * 0.3 + i) * dt * 0.08)
    }
    pollenPos.needsUpdate = true
  }

  return {
    scene, sky, hemi, dir, colliders, path, pond, settlement, windmill, stones,
    grassZones, wildSpawns, isBlocked, update, heightAt: terrainHeight,
    pondCircle, waterLevel: WATER_LEVEL, fireflies, pollen, butterflies, clouds,
    sun
  }
}
