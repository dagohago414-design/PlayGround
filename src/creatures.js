import * as THREE from 'three'
import { byId } from './config.js'
import { addPart, capsule, glowSprite, sphere, toonMat } from './lib.js'

function eye(parent, x, y, z, { size = 1, dark = 0x2c2521, iris = null } = {}) {
  const white = addPart(parent, sphere(0.105 * size, 10), 0xfffdf2, {
    position: [x, y, z], noShadow: true, outline: true, outlineScale: 1.02
  })
  if (iris) {
    addPart(white, sphere(0.072 * size, 8), iris, { position: [0, 0, 0.055], noShadow: true })
  }
  addPart(white, sphere(0.055 * size, 8), dark, { position: [0, 0, 0.064], noShadow: true })
  addPart(white, sphere(0.018 * size, 6), 0xffffff, { position: [0.028, 0.033, 0.105], noShadow: true })
  return white
}

function smile(parent, x, y, z, { w = 0.11, mat = 0x3a2b28, rot = 0 } = {}) {
  const g = new THREE.TorusGeometry(w, 0.014, 4, 12, Math.PI)
  const m = addPart(parent, g, mat, { position: [x, y, z], rotation: [0.15, rot, Math.PI], noShadow: true })
  return m
}

function blush(parent, x, y, z, color = 0xff9b88) {
  const m = addPart(parent, sphere(0.07, 8), color, {
    position: [x, y, z], scale: [1, 0.55, 0.35], noShadow: true, transparent: true, opacity: 0.8
  })
  return m
}

function buildEmberpaw(c) {
  const rig = new THREE.Group()
  const legs = []
  const body = addPart(rig, capsule(0.43, 0.32, 4, 14), c.body, { position: [0, 0.73, 0], outline: true })
  addPart(rig, sphere(0.36, 12), c.belly, { position: [0, 0.69, 0.27], scale: [1, 1.08, 0.55] })
  const head = new THREE.Group()
  head.position.set(0, 1.34, 0.03)
  rig.add(head)
  addPart(head, sphere(0.47, 13), c.body, { outline: true })
  addPart(head, sphere(0.3, 11), c.belly, { position: [0, -0.09, 0.36], scale: [1, 0.78, 0.75] })
  addPart(head, sphere(0.075, 8), c.dark, { position: [0, -0.03, 0.63] })
  eye(head, -0.19, 0.1, 0.38, { size: 1.05 })
  eye(head, 0.19, 0.1, 0.38, { size: 1.05 })
  smile(head, 0, -0.11, 0.61, { w: 0.075 })
  const ears = []
  for (const side of [-1, 1]) {
    const ear = new THREE.Group()
    ear.position.set(side * 0.29, 0.34, -0.02)
    ear.rotation.z = -side * 0.16
    addPart(ear, new THREE.ConeGeometry(0.19, 0.52, 5), c.body, { position: [0, 0.2, 0], outline: true })
    addPart(ear, new THREE.ConeGeometry(0.105, 0.32, 4), 0xffcf9c, { position: [0, 0.17, 0.07] })
    head.add(ear)
    ears.push(ear)
  }
  const tail = new THREE.Group()
  tail.position.set(0, 0.8, -0.35)
  addPart(tail, sphere(0.2, 10), c.body, { position: [0, 0.08, -0.32], scale: [1, 1.1, 2.3], outline: true })
  addPart(tail, sphere(0.16, 9), c.belly, { position: [0, 0.3, -0.72], scale: [1, 1.15, 0.9] })
  const flame = addPart(tail, new THREE.ConeGeometry(0.14, 0.44, 6), c.accent, {
    position: [0, 0.52, -0.76], material: new THREE.MeshBasicMaterial({ color: 0xffc247 }), noShadow: true
  })
  const flameCore = addPart(tail, new THREE.ConeGeometry(0.07, 0.26, 5), 0xfff4b0, {
    position: [0, 0.55, -0.74], material: new THREE.MeshBasicMaterial({ color: 0xfff4b0 }), noShadow: true
  })
  const glow = glowSprite('#ffb14a', 1.4, 0.65)
  glow.position.set(0, 0.58, -0.76)
  tail.add(glow)
  rig.add(tail)
  for (const x of [-0.26, 0.26]) {
    for (const z of [-0.25, 0.28]) {
      const leg = new THREE.Group()
      leg.position.set(x, 0.36, z)
      addPart(leg, capsule(0.115, 0.16, 3, 8), c.body, { position: [0, -0.1, 0], outline: 'soft', outlineScale: 1.03 })
      addPart(leg, sphere(0.14, 8), c.belly, { position: [0, -0.22, 0.04], scale: [1, 0.6, 1.25] })
      rig.add(leg)
      legs.push(leg)
    }
  }
  blush(head, -0.3, -0.04, 0.35)
  blush(head, 0.3, -0.04, 0.35)
  return { rig, head, body, tail, ears, legs, flame, flameCore, glow, type: 'quad' }
}

function buildAquafin(c) {
  const rig = new THREE.Group()
  const legs = []
  const body = addPart(rig, capsule(0.44, 0.34, 4, 14), c.body, { position: [0, 0.74, 0], outline: true })
  addPart(rig, sphere(0.38, 12), c.belly, { position: [0, 0.68, 0.27], scale: [1, 1.1, 0.55] })
  const head = new THREE.Group()
  head.position.set(0, 1.33, 0.02)
  rig.add(head)
  addPart(head, sphere(0.43, 13), c.body, { outline: true })
  addPart(head, sphere(0.33, 11), c.belly, { position: [0, -0.1, 0.3], scale: [1.05, 0.8, 0.72] })
  addPart(head, sphere(0.075, 8), c.dark, { position: [0, -0.02, 0.6] })
  eye(head, -0.18, 0.1, 0.34, { size: 1.1 })
  eye(head, 0.18, 0.1, 0.34, { size: 1.1 })
  smile(head, 0, -0.12, 0.58, { w: 0.06 })
  for (const side of [-1, 1]) {
    addPart(head, sphere(0.12, 8), c.body, { position: [side * 0.33, 0.29, -0.02], scale: [0.8, 1, 0.8], outline: 'soft' })
  }
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      addPart(head, new THREE.CylinderGeometry(0.006, 0.006, 0.3, 3), 0x2d718f, {
        position: [side * 0.38, -0.08 + i * 0.06, 0.3], rotation: [0, 0, side * (Math.PI / 2 + i * 0.2)], noShadow: true
      })
    }
  }
  const tail = new THREE.Group()
  tail.position.set(0, 0.62, -0.38)
  addPart(tail, sphere(0.22, 9), c.body, { position: [0, -0.04, -0.24], scale: [0.8, 0.5, 1.8], outline: 'soft' })
  addPart(tail, new THREE.ConeGeometry(0.26, 0.5, 4), c.accent, { position: [0, -0.04, -0.62], rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 0.35] })
  rig.add(tail)
  const wings = []
  for (const side of [-1, 1]) {
    const wing = new THREE.Group()
    wing.position.set(side * 0.42, 0.82, 0.02)
    wing.rotation.z = side * 0.25
    addPart(wing, sphere(0.28, 9), c.body, { position: [side * 0.12, -0.06, 0], scale: [0.6, 0.22, 1.1], outline: 'soft' })
    rig.add(wing)
    wings.push(wing)
  }
  for (const x of [-0.27, 0.27]) {
    const leg = new THREE.Group()
    leg.position.set(x, 0.34, 0.04)
    addPart(leg, capsule(0.12, 0.14, 3, 8), c.body, { position: [0, -0.08, 0], outline: 'soft' })
    addPart(leg, sphere(0.15, 8), c.belly, { position: [0, -0.2, 0.07], scale: [1, 0.55, 1.35] })
    rig.add(leg)
    legs.push(leg)
  }
  const droplet = new THREE.Group()
  droplet.position.set(0, 0.46, 0.02)
  addPart(droplet, new THREE.ConeGeometry(0.12, 0.28, 6), 0xbfefff, {
    position: [0, 0.05, 0], material: new THREE.MeshStandardMaterial({ color: 0xbfefff, transparent: true, opacity: 0.85, roughness: 0.1 }), noShadow: true
  })
  addPart(droplet, sphere(0.12, 9), 0xbfefff, {
    position: [0, -0.06, 0], scale: [1, 0.8, 1],
    material: new THREE.MeshStandardMaterial({ color: 0xbfefff, transparent: true, opacity: 0.8, roughness: 0.05 }), noShadow: true
  })
  head.add(droplet)
  const bubbles = []
  for (let i = 0; i < 3; i++) {
    const b = addPart(rig, sphere(0.08 + i * 0.025, 8), 0xd8f7ff, {
      position: [-0.55 + i * 0.18, 1.15 + i * 0.22, 0.22],
      material: new THREE.MeshStandardMaterial({ color: 0xd8f7ff, transparent: true, opacity: 0.55, roughness: 0.05 }), noShadow: true
    })
    bubbles.push(b)
  }
  return { rig, head, body, tail, legs, wings, bubbles, type: 'quad' }
}

function buildSproutle(c) {
  const rig = new THREE.Group()
  const legs = []
  const body = addPart(rig, sphere(0.47, 13), c.body, { position: [0, 0.72, 0], scale: [0.98, 1.02, 0.9], outline: true })
  addPart(rig, sphere(0.38, 12), c.belly, { position: [0, 0.64, 0.28], scale: [0.95, 0.95, 0.55] })
  const head = new THREE.Group()
  head.position.set(0, 1.31, 0.02)
  rig.add(head)
  addPart(head, sphere(0.4, 13), c.body, { outline: true })
  addPart(head, sphere(0.25, 10), c.belly, { position: [0, -0.13, 0.31], scale: [1.05, 0.7, 0.85] })
  addPart(head, sphere(0.05, 7), c.dark, { position: [-0.09, -0.04, 0.56] })
  addPart(head, sphere(0.05, 7), c.dark, { position: [0.09, -0.04, 0.56] })
  eye(head, -0.17, 0.12, 0.34, { size: 1.1 })
  eye(head, 0.17, 0.12, 0.34, { size: 1.1 })
  smile(head, 0, -0.2, 0.5, { w: 0.06 })
  blush(head, -0.28, -0.07, 0.3, 0xff9eae)
  blush(head, 0.28, -0.07, 0.3, 0xff9eae)
  const leaf = new THREE.Group()
  leaf.position.set(0, 0.36, -0.02)
  const stem = addPart(leaf, new THREE.CylinderGeometry(0.035, 0.045, 0.32, 5), c.dark, { position: [0, 0.14, 0] })
  const leafL = addPart(leaf, sphere(0.26, 9), 0x62c95d, {
    position: [-0.22, 0.34, 0], scale: [1.2, 0.14, 0.62], rotation: [0, 0.3, -0.35], outline: 'soft'
  })
  const leafR = addPart(leaf, sphere(0.26, 9), 0x8ee06a, {
    position: [0.24, 0.4, 0.02], scale: [1.25, 0.14, 0.62], rotation: [0, -0.3, 0.35], outline: 'soft'
  })
  head.add(leaf)
  const tail = new THREE.Group()
  tail.position.set(0, 0.62, -0.4)
  addPart(tail, new THREE.ConeGeometry(0.24, 0.75, 7), c.body, { position: [0, 0.02, -0.32], rotation: [-0.9, 0, 0], outline: 'soft' })
  addPart(tail, sphere(0.18, 8), 0x62c95d, { position: [0, 0.3, -0.63], scale: [1.4, 0.14, 0.7], rotation: [-0.2, 0, 0] })
  rig.add(tail)
  const arms = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * 0.44, 0.82, 0.08)
    arm.rotation.z = side * 0.35
    addPart(arm, capsule(0.11, 0.18, 3, 8), c.body, { position: [0, -0.1, 0], outline: 'soft' })
    addPart(arm, sphere(0.12, 7), c.belly, { position: [0, -0.24, 0.02], scale: [1, 0.8, 1] })
    rig.add(arm)
    arms.push(arm)
  }
  for (const side of [-1, 1]) {
    const leg = new THREE.Group()
    leg.position.set(side * 0.27, 0.36, 0.02)
    addPart(leg, capsule(0.15, 0.15, 3, 8), c.body, { position: [0, -0.08, 0], outline: 'soft' })
    addPart(leg, sphere(0.17, 8), c.belly, { position: [0, -0.22, 0.05], scale: [1, 0.55, 1.35] })
    rig.add(leg)
    legs.push(leg)
  }
  const spikes = []
  for (let i = 0; i < 3; i++) {
    const spike = addPart(rig, new THREE.ConeGeometry(0.09, 0.22, 4), c.accent, {
      position: [0, 0.9 + i * 0.13, -0.44 + i * 0.04], rotation: [-0.6, 0, 0]
    })
    spikes.push(spike)
  }
  return { rig, head, body, tail, legs, arms, leaf, leafL, leafR, spikes, type: 'biped' }
}

function buildZappup(c) {
  const rig = new THREE.Group()
  const legs = []
  const body = addPart(rig, sphere(0.44, 13), c.body, { position: [0, 0.68, 0], scale: [1, 0.95, 0.9], outline: true })
  addPart(rig, sphere(0.34, 11), c.belly, { position: [0, 0.62, 0.26], scale: [1, 0.95, 0.55] })
  const head = new THREE.Group()
  head.position.set(0, 1.27, 0.02)
  rig.add(head)
  addPart(head, sphere(0.43, 13), c.body, { outline: true })
  addPart(head, sphere(0.26, 10), c.belly, { position: [0, -0.12, 0.3], scale: [1.05, 0.72, 0.62] })
  eye(head, -0.17, 0.1, 0.35, { size: 1.15, dark: 0x201a13 })
  eye(head, 0.17, 0.1, 0.35, { size: 1.15, dark: 0x201a13 })
  addPart(head, sphere(0.045, 7), 0x3a2a1b, { position: [0, -0.1, 0.55] })
  smile(head, 0, -0.19, 0.51, { w: 0.055, mat: 0x5a3a24 })
  blush(head, -0.31, -0.03, 0.3, 0xf26a4a)
  blush(head, 0.31, -0.03, 0.3, 0xf26a4a)
  const ears = []
  for (const side of [-1, 1]) {
    const ear = new THREE.Group()
    ear.position.set(side * 0.27, 0.33, -0.02)
    ear.rotation.z = -side * 0.28
    addPart(ear, capsule(0.105, 0.42, 3, 8), c.body, { position: [0, 0.3, 0], outline: 'soft' })
    addPart(ear, new THREE.ConeGeometry(0.105, 0.22, 4), 0x6d5117, { position: [0, 0.61, 0], rotation: [0, 0, 0] })
    addPart(ear, capsule(0.055, 0.28, 3, 6), 0xfff0b0, { position: [0, 0.3, 0.08] })
    head.add(ear)
    ears.push(ear)
  }
  const tail = new THREE.Group()
  tail.position.set(0, 0.7, -0.36)
  const tailBase = addPart(tail, new THREE.CylinderGeometry(0.07, 0.1, 0.34, 5), c.body, { position: [0, 0.05, -0.15], rotation: [1.1, 0, 0] })
  const zig = [
    { p: [0, 0.18, -0.34], r: [0.4, 0, 0.6], l: 0.38 },
    { p: [0.05, 0.44, -0.46], r: [0.1, 0, -0.7], l: 0.42 },
    { p: [0, 0.68, -0.58], r: [-0.2, 0, 0.5], l: 0.3 }
  ]
  const tailSegs = []
  for (const z of zig) {
    const seg = addPart(tail, new THREE.BoxGeometry(0.13, z.l, 0.13), c.accent, {
      position: z.p, rotation: z.r, outline: 'soft', outlineScale: 1.08
    })
    tailSegs.push(seg)
  }
  rig.add(tail)
  const arms = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * 0.4, 0.75, 0.1)
    arm.rotation.z = side * 0.5
    addPart(arm, capsule(0.09, 0.14, 3, 7), c.body, { position: [0, -0.08, 0], outline: 'soft' })
    rig.add(arm)
    arms.push(arm)
  }
  for (const side of [-1, 1]) {
    const leg = new THREE.Group()
    leg.position.set(side * 0.23, 0.33, 0.03)
    addPart(leg, capsule(0.13, 0.12, 3, 8), c.body, { position: [0, -0.08, 0], outline: 'soft' })
    addPart(leg, sphere(0.14, 8), c.belly, { position: [0, -0.2, 0.06], scale: [1, 0.55, 1.3] })
    rig.add(leg)
    legs.push(leg)
  }
  const sparks = []
  for (let i = 0; i < 2; i++) {
    const spark = glowSprite('#fff3a0', 0.45, 0.9)
    spark.position.set(-0.4 + i * 0.8, 1.35 + i * 0.15, 0.25)
    rig.add(spark)
    sparks.push(spark)
  }
  return { rig, head, body, tail, ears, legs, arms, tailSegs, sparks, type: 'quad' }
}

function buildPebblit(c) {
  const rig = new THREE.Group()
  const rockGeo = new THREE.DodecahedronGeometry(1, 0)
  const body = addPart(rig, rockGeo, c.body, { position: [0, 0.68, 0], scale: [0.58, 0.62, 0.55], outline: true })
  addPart(rig, new THREE.DodecahedronGeometry(0.72, 0), c.belly, { position: [0, 0.63, 0.28], scale: [0.45, 0.5, 0.3] })
  const head = new THREE.Group()
  head.position.set(0, 1.3, 0.03)
  rig.add(head)
  addPart(head, new THREE.DodecahedronGeometry(0.44, 0), c.body, { scale: [1.05, 0.95, 1], outline: true })
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xcffff8, emissive: 0x5fe9d8, emissiveIntensity: 1.2 })
  for (const side of [-1, 1]) {
    addPart(head, sphere(0.085, 8), 0xffffff, { position: [side * 0.15, 0.06, 0.36], material: eyeMat, noShadow: true })
    addPart(head, sphere(0.03, 6), 0xffffff, { position: [side * 0.15, 0.06, 0.43], noShadow: true })
  }
  addPart(head, new THREE.BoxGeometry(0.2, 0.035, 0.04), c.dark, { position: [0, -0.16, 0.4], rotation: [0, 0, -0.08] })
  const moss = addPart(head, sphere(0.36, 9), c.accent, { position: [0, 0.28, -0.02], scale: [1.05, 0.32, 1] })
  for (const [x, z] of [[-0.14, 0.14], [0.15, 0.08]]) {
    addPart(head, sphere(0.07, 7), 0xffd0dc, { position: [x, 0.38, z], scale: [1, 0.5, 1] })
    addPart(head, sphere(0.035, 5), 0xffef8a, { position: [x, 0.42, z] })
  }
  const crystals = []
  for (let i = 0; i < 3; i++) {
    const shard = addPart(rig, new THREE.ConeGeometry(0.11, 0.4 + i * 0.1, 5), 0x8be9dd, {
      position: [-0.2 + i * 0.19, 1.05 - i * 0.03, -0.42],
      rotation: [-0.4, 0, (-1 + i) * 0.25],
      material: new THREE.MeshStandardMaterial({ color: 0x8be9dd, emissive: 0x2a9e94, emissiveIntensity: 0.65, roughness: 0.3, flatShading: true }),
      noShadow: true
    })
    crystals.push(shard)
  }
  const arms = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * 0.55, 0.85, 0)
    addPart(arm, new THREE.DodecahedronGeometry(0.22, 0), c.body, { position: [0, -0.1, 0], scale: [0.8, 1.1, 0.8], outline: 'soft' })
    rig.add(arm)
    arms.push(arm)
  }
  for (const side of [-1, 1]) {
    const leg = new THREE.Group()
    leg.position.set(side * 0.3, 0.28, 0.02)
    addPart(leg, new THREE.DodecahedronGeometry(0.22, 0), c.body, { position: [0, -0.08, 0], scale: [0.9, 0.8, 1.05], outline: 'soft' })
    rig.add(leg)
  }
  return { rig, head, body, moss, crystals, arms, type: 'biped' }
}

function buildZephyro(c) {
  const rig = new THREE.Group()
  const legs = []
  const body = addPart(rig, sphere(0.45, 13), c.body, { position: [0, 0.74, 0], scale: [1, 0.98, 0.92], outline: true })
  addPart(rig, sphere(0.34, 11), c.belly, { position: [0, 0.68, 0.28], scale: [1, 1.02, 0.55] })
  const head = new THREE.Group()
  head.position.set(0, 1.34, 0.02)
  rig.add(head)
  addPart(head, sphere(0.41, 13), c.body, { outline: true })
  addPart(head, sphere(0.24, 10), c.belly, { position: [0, -0.11, 0.32], scale: [1, 0.7, 0.6] })
  eye(head, -0.17, 0.09, 0.35, { size: 1.12 })
  eye(head, 0.17, 0.09, 0.35, { size: 1.12 })
  addPart(head, new THREE.ConeGeometry(0.1, 0.26, 4), 0xf5a63c, { position: [0, -0.09, 0.59], rotation: [Math.PI / 2, 0, 0] })
  const crest = []
  for (let i = 0; i < 3; i++) {
    const feather = addPart(head, new THREE.ConeGeometry(0.07, 0.36 + i * 0.06, 4), i === 1 ? c.accent : c.belly, {
      position: [0, 0.4, -0.02 - i * 0.11], rotation: [-0.5 - i * 0.15, 0, 0]
    })
    crest.push(feather)
  }
  const wings = []
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.38, 0.93, -0.01)
    const wing = addPart(pivot, sphere(0.36, 10), c.accent, {
      position: [side * 0.28, -0.05, -0.06], scale: [1.25, 0.18, 0.72], rotation: [0, side * 0.18, side * 0.18], outline: 'soft'
    })
    addPart(pivot, sphere(0.22, 8), c.belly, { position: [side * 0.3, 0.02, 0.08], scale: [1.1, 0.12, 0.55] })
    rig.add(pivot)
    wings.push(pivot)
  }
  const tail = new THREE.Group()
  tail.position.set(0, 0.8, -0.38)
  for (let i = -1; i <= 1; i++) {
    addPart(tail, new THREE.ConeGeometry(0.09, 0.62, 4), i === 0 ? c.accent : c.belly, {
      position: [i * 0.13, 0.04, -0.26], rotation: [1.25, 0, i * 0.3]
    })
  }
  rig.add(tail)
  for (const side of [-1, 1]) {
    const leg = new THREE.Group()
    leg.position.set(side * 0.2, 0.36, 0.02)
    addPart(leg, new THREE.CylinderGeometry(0.045, 0.055, 0.28, 5), 0xf5a63c, { position: [0, -0.1, 0], outline: 'soft' })
    addPart(leg, new THREE.ConeGeometry(0.09, 0.18, 3), 0xf5a63c, { position: [0, -0.26, 0.06], rotation: [Math.PI / 2, 0, 0] })
    rig.add(leg)
    legs.push(leg)
  }
  return { rig, head, body, tail, wings, legs, crest, type: 'bird' }
}

const builders = {
  emberpaw: buildEmberpaw,
  aquafin: buildAquafin,
  sproutle: buildSproutle,
  zappup: buildZappup,
  pebblit: buildPebblit,
  zephyro: buildZephyro
}

function buildCritter(c, model = {}) {
  const rig = new THREE.Group()
  const legs = []
  const arms = []
  const wings = []
  const ears = []
  const refs = { rig, legs, arms, wings, ears, type: 'biped' }
  const kind = model.kind || 'quad'
  const glowColor = c.glow || '#ffd45d'
  let body
  let head
  let tail

  function addEyeStalk(side) {
    const stalk = new THREE.Group()
    stalk.position.set(side * 0.16, 0.2, 0.14)
    stalk.rotation.z = side * 0.18
    addPart(stalk, new THREE.CylinderGeometry(0.035, 0.045, 0.28, 5), c.body, { position: [0, 0.14, 0] })
    const eyeBall = addPart(stalk, sphere(0.11, 9), 0xfffdf2, { position: [0, 0.3, 0], noShadow: true, outline: true, outlineScale: 1.04 })
    addPart(eyeBall, sphere(0.065, 8), c.eye, { position: [0, 0, 0.07], noShadow: true })
    addPart(eyeBall, sphere(0.02, 6), 0xffffff, { position: [0.03, 0.035, 0.115], noShadow: true })
    head.add(stalk)
  }

  function addFace(r, { beak = false, cheeks = false } = {}) {
    addPart(head, sphere(r * 0.82, 11), c.belly, {
      position: [0, -r * 0.22, r * 0.58], scale: [1.05, 0.66, 0.5]
    })
    eye(head, -r * 0.42, r * 0.08, r * 0.84, { size: 1.08, dark: c.eye })
    eye(head, r * 0.42, r * 0.08, r * 0.84, { size: 1.08, dark: c.eye })
    if (beak) {
      addPart(head, new THREE.ConeGeometry(r * 0.22, r * 0.58, 4), 0xf5a63c, {
        position: [0, -r * 0.24, r * 1.17], rotation: [Math.PI / 2, 0, 0]
      })
    } else {
      addPart(head, sphere(r * 0.1, 7), c.dark, { position: [0, -r * 0.08, r * 1.18] })
      smile(head, 0, -r * 0.34, r * 1.08, { w: r * 0.18, mat: c.dark })
    }
    if (cheeks) {
      blush(head, -r * 0.62, -r * 0.12, r * 0.68, c.accent)
      blush(head, r * 0.62, -r * 0.12, r * 0.68, c.accent)
    }
  }

  function addLeg(x, z, scale = 1) {
    const leg = new THREE.Group()
    leg.position.set(x, 0.36 * scale, z)
    addPart(leg, capsule(0.115 * scale, 0.15 * scale, 3, 8), c.body, {
      position: [0, -0.1 * scale, 0], outline: 'soft', outlineScale: 1.03
    })
    addPart(leg, sphere(0.14 * scale, 8), c.belly, {
      position: [0, -0.22 * scale, 0.04], scale: [1, 0.58, 1.28]
    })
    rig.add(leg)
    legs.push(leg)
    return leg
  }

  function addArm(side, scale = 1) {
    const arm = new THREE.Group()
    arm.position.set(side * 0.43 * scale, 0.88 * scale, 0.08)
    arm.rotation.z = side * 0.32
    addPart(arm, capsule(0.1 * scale, 0.16 * scale, 3, 8), c.body, { position: [0, -0.1, 0], outline: 'soft' })
    addPart(arm, sphere(0.115 * scale, 7), c.belly, { position: [0, -0.23 * scale, 0.02], scale: [1, 0.8, 1] })
    rig.add(arm)
    arms.push(arm)
    return arm
  }

  if (kind === 'quad') {
    body = addPart(rig, sphere(0.46, 13), c.body, { position: [0, 0.72, 0], scale: [1, 0.85, 1.24], outline: true })
    addPart(rig, sphere(0.37, 12), c.belly, { position: [0, 0.68, 0.3], scale: [0.95, 0.86, 0.55] })
    head = new THREE.Group()
    head.position.set(0, 1.3, 0.08)
    rig.add(head)
    addPart(head, sphere(0.43, 13), c.body, { outline: true })
    addFace(0.43, { cheeks: model.cheeks })
    for (const x of [-0.27, 0.27]) for (const z of [-0.27, 0.3]) addLeg(x, z)
    tail = new THREE.Group()
    tail.position.set(0, 0.78, -0.42)
    rig.add(tail)
    refs.type = 'quad'
  } else if (kind === 'biped') {
    body = addPart(rig, sphere(0.46, 13), c.body, { position: [0, 0.76, 0], scale: [0.98, 1.06, 0.92], outline: true })
    addPart(rig, sphere(0.36, 12), c.belly, { position: [0, 0.7, 0.29], scale: [0.95, 0.95, 0.55] })
    head = new THREE.Group()
    head.position.set(0, 1.34, 0.04)
    rig.add(head)
    addPart(head, sphere(0.41, 13), c.body, { outline: true })
    addFace(0.41, { cheeks: model.cheeks })
    addLeg(-0.24, 0.04)
    addLeg(0.24, 0.04)
    addArm(-1)
    addArm(1)
    tail = new THREE.Group()
    tail.position.set(0, 0.7, -0.4)
    rig.add(tail)
    refs.type = 'biped'
  } else if (kind === 'bird') {
    body = addPart(rig, sphere(0.45, 13), c.body, { position: [0, 0.78, 0], scale: [1, 1.02, 0.94], outline: true })
    addPart(rig, sphere(0.34, 11), c.belly, { position: [0, 0.72, 0.3], scale: [1, 1, 0.52] })
    head = new THREE.Group()
    head.position.set(0, 1.34, 0.06)
    rig.add(head)
    addPart(head, sphere(0.4, 13), c.body, { outline: true })
    addFace(0.4, { beak: true, cheeks: model.cheeks })
    for (const side of [-1, 1]) {
      const leg = new THREE.Group()
      leg.position.set(side * 0.18, 0.38, 0.02)
      addPart(leg, new THREE.CylinderGeometry(0.045, 0.055, 0.28, 5), 0xf5a63c, { position: [0, -0.1, 0], outline: 'soft' })
      addPart(leg, new THREE.ConeGeometry(0.09, 0.18, 3), 0xf5a63c, { position: [0, -0.26, 0.06], rotation: [Math.PI / 2, 0, 0] })
      rig.add(leg)
      legs.push(leg)
    }
    tail = new THREE.Group()
    tail.position.set(0, 0.8, -0.42)
    rig.add(tail)
    refs.type = 'biped'
  } else if (kind === 'bug') {
    body = addPart(rig, sphere(0.37, 12), c.body, { position: [0, 0.74, -0.06], scale: [0.92, 0.82, 1.55], outline: true })
    addPart(rig, sphere(0.28, 10), c.belly, { position: [0, 0.66, 0.42], scale: [0.9, 0.7, 1.1] })
    head = new THREE.Group()
    head.position.set(0, 0.96, 0.46)
    rig.add(head)
    addPart(head, sphere(0.33, 12), c.body, { outline: true })
    addFace(0.33, { cheeks: model.cheeks })
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const leg = new THREE.Group()
        leg.position.set(side * 0.32, 0.56, -0.32 + i * 0.3)
        leg.rotation.z = side * (0.55 + i * 0.06)
        addPart(leg, new THREE.CylinderGeometry(0.026, 0.035, 0.42, 5), c.dark, { position: [side * 0.15, -0.16, 0] })
        addPart(leg, sphere(0.06, 7), c.body, { position: [side * 0.3, -0.3, 0] })
        rig.add(leg)
        legs.push(leg)
      }
    }
    for (const side of [-1, 1]) {
      const arm = new THREE.Group()
      arm.position.set(side * 0.3, 0.78, 0.2)
      addPart(arm, capsule(0.055, 0.12, 3, 6), c.body, { position: [0, -0.1, 0], rotation: [0, 0, side * 0.4] })
      rig.add(arm)
      arms.push(arm)
    }
    tail = new THREE.Group()
    tail.position.set(0, 0.76, -0.55)
    rig.add(tail)
    refs.type = 'biped'
  } else if (kind === 'serpent') {
    const segs = [
      [0, 0.28, -0.42, 0.35], [0.2, 0.43, -0.16, 0.34], [-0.15, 0.58, 0.08, 0.33], [0.04, 0.76, 0.14, 0.31]
    ]
    for (const [x, y, z, r] of segs) {
      addPart(rig, sphere(r, 11), c.body, { position: [x, y, z], outline: true })
      addPart(rig, sphere(r * 0.6, 9), c.belly, { position: [x, y - r * 0.1, z + r * 0.62], scale: [1, 0.7, 0.35] })
    }
    body = rig.children[0]
    head = new THREE.Group()
    head.position.set(0, 1.16, 0.16)
    rig.add(head)
    addPart(head, sphere(0.37, 12), c.body, { outline: true })
    addFace(0.37, { cheeks: model.cheeks })
    tail = new THREE.Group()
    tail.position.set(0, 0.24, -0.44)
    rig.add(tail)
    refs.type = 'biped'
  } else if (kind === 'blob') {
    body = addPart(rig, sphere(0.5, 13), c.body, { position: [0, 0.62, 0], scale: [1.08, 0.88, 1], outline: true })
    addPart(rig, sphere(0.38, 11), c.belly, { position: [0, 0.56, 0.34], scale: [0.95, 0.8, 0.45] })
    head = new THREE.Group()
    head.position.set(0, 1.02, 0.06)
    rig.add(head)
    addPart(head, sphere(0.38, 12), c.body, { outline: true })
    addFace(0.38, { cheeks: model.cheeks })
    addLeg(-0.25, 0.1, 0.75)
    addLeg(0.25, 0.1, 0.75)
    addArm(-1, 0.78)
    addArm(1, 0.78)
    tail = new THREE.Group()
    tail.position.set(0, 0.6, -0.46)
    rig.add(tail)
    refs.type = 'biped'
  } else if (kind === 'ghost') {
    body = addPart(rig, sphere(0.46, 13), c.body, { position: [0, 0.88, 0], scale: [1, 1.02, 0.9], outline: true })
    addPart(rig, sphere(0.35, 11), c.belly, { position: [0, 0.82, 0.3], scale: [0.95, 0.9, 0.5] })
    for (let i = 0; i < 4; i++) {
      const wisp = addPart(rig, new THREE.ConeGeometry(0.13 + i * 0.018, 0.46, 5), c.body, {
        position: [-0.27 + i * 0.18, 0.3 - (i % 2) * 0.08, 0], rotation: [Math.PI, 0, 0.12 * (i - 1.5)]
      })
      refs['wisp' + i] = wisp
    }
    head = new THREE.Group()
    head.position.set(0, 1.48, 0.04)
    rig.add(head)
    addPart(head, sphere(0.41, 13), c.body, { outline: true })
    addFace(0.41, { cheeks: model.cheeks })
    for (const side of [-1, 1]) {
      const arm = new THREE.Group()
      arm.position.set(side * 0.42, 0.96, 0.05)
      arm.rotation.z = side * 0.45
      addPart(arm, capsule(0.075, 0.12, 3, 6), c.body, { position: [0, -0.12, 0], outline: 'soft' })
      addPart(arm, sphere(0.085, 7), c.belly, { position: [0, -0.27, 0] })
      rig.add(arm)
      arms.push(arm)
    }
    tail = new THREE.Group()
    tail.position.set(0, 0.62, -0.42)
    rig.add(tail)
    refs.type = 'biped'
  } else if (kind === 'crab') {
    body = addPart(rig, sphere(0.5, 12), c.body, { position: [0, 0.55, 0], scale: [1.32, 0.68, 0.96], outline: true })
    addPart(rig, sphere(0.38, 10), c.belly, { position: [0, 0.48, 0.3], scale: [1.15, 0.55, 0.5] })
    head = new THREE.Group()
    head.position.set(0, 0.98, 0.12)
    rig.add(head)
    addPart(head, sphere(0.35, 12), c.body, { outline: true })
    addFace(0.35, { cheeks: model.cheeks })
    addEyeStalk(-1)
    addEyeStalk(1)
    for (const side of [-1, 1]) {
      for (const z of [-0.26, 0.26]) addLeg(side * 0.45, z, 0.82)
      const clawArm = new THREE.Group()
      clawArm.position.set(side * 0.6, 0.64, 0.28)
      clawArm.rotation.z = side * 0.3
      addPart(clawArm, capsule(0.08, 0.12, 3, 7), c.body, { position: [side * 0.1, 0.04, 0], rotation: [0, 0, side * 0.5] })
      addPart(clawArm, sphere(0.2, 9), c.body, { position: [side * 0.35, 0.18, 0], scale: [1.15, 0.8, 0.75], outline: 'soft' })
      addPart(clawArm, new THREE.ConeGeometry(0.1, 0.28, 4), c.belly, { position: [side * 0.52, 0.2, 0.09], rotation: [0, 0, side * -1.1] })
      rig.add(clawArm)
      arms.push(clawArm)
    }
    tail = new THREE.Group()
    tail.position.set(0, 0.5, -0.46)
    rig.add(tail)
    refs.type = 'quad'
  } else if (kind === 'turtle') {
    body = addPart(rig, sphere(0.45, 12), c.body, { position: [0, 0.6, 0], scale: [1.08, 0.7, 1.18], outline: true })
    addPart(rig, sphere(0.5, 12), c.accent, { position: [0, 0.78, -0.05], scale: [1.22, 0.62, 1.18], outline: true })
    addPart(rig, new THREE.TorusGeometry(0.6, 0.05, 5, 16), c.dark, {
      position: [0, 0.64, -0.05], rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 0.7]
    })
    head = new THREE.Group()
    head.position.set(0, 0.94, 0.52)
    rig.add(head)
    addPart(head, sphere(0.34, 12), c.body, { outline: true })
    addFace(0.34, { cheeks: model.cheeks })
    for (const x of [-0.3, 0.3]) for (const z of [-0.2, 0.3]) addLeg(x, z, 0.85)
    tail = new THREE.Group()
    tail.position.set(0, 0.52, -0.55)
    rig.add(tail)
    refs.type = 'quad'
  }

  if (model.ears) {
    for (const side of [-1, 1]) {
      const ear = new THREE.Group()
      if (model.ears === 'round') {
        ear.position.set(side * 0.3, 0.34, -0.02)
        addPart(ear, sphere(0.16, 9), c.body, { position: [0, 0.02, 0], scale: [0.9, 1, 0.6], outline: true })
        addPart(ear, sphere(0.09, 8), c.belly, { position: [0, 0.02, 0.08], scale: [1, 1, 0.35] })
      } else if (model.ears === 'point') {
        ear.position.set(side * 0.28, 0.34, -0.02)
        ear.rotation.z = -side * 0.2
        addPart(ear, new THREE.ConeGeometry(0.16, 0.42, 5), c.body, { position: [0, 0.18, 0], outline: true })
        addPart(ear, new THREE.ConeGeometry(0.08, 0.25, 4), c.belly, { position: [0, 0.16, 0.06] })
      } else if (model.ears === 'long') {
        ear.position.set(side * 0.23, 0.36, -0.04)
        ear.rotation.z = -side * 0.14
        addPart(ear, capsule(0.085, 0.3, 3, 7), c.body, { position: [0, 0.25, 0], outline: 'soft' })
        addPart(ear, capsule(0.045, 0.2, 3, 6), c.belly, { position: [0, 0.25, 0.06] })
      } else if (model.ears === 'flop') {
        ear.position.set(side * 0.33, 0.25, 0.02)
        ear.rotation.z = side * 0.6
        addPart(ear, sphere(0.18, 9), c.body, { position: [side * 0.12, -0.06, 0], scale: [0.75, 1.2, 0.55], outline: 'soft' })
      }
      head.add(ear)
      ears.push(ear)
    }
  }

  if (model.antlers) {
    for (const side of [-1, 1]) {
      const antler = new THREE.Group()
      antler.position.set(side * 0.22, 0.34, -0.02)
      addPart(antler, new THREE.CylinderGeometry(0.035, 0.05, 0.48, 5), c.dark, { position: [0, 0.22, 0], rotation: [0, 0, side * -0.18] })
      addPart(antler, new THREE.CylinderGeometry(0.026, 0.035, 0.3, 5), c.belly, { position: [side * -0.12, 0.36, 0.02], rotation: [0, 0, side * 0.7] })
      addPart(antler, new THREE.CylinderGeometry(0.026, 0.035, 0.26, 5), c.belly, { position: [side * 0.12, 0.46, -0.03], rotation: [0, 0, side * -0.6] })
      head.add(antler)
    }
  }

  if (model.horns === 'dragon') {
    for (const side of [-1, 1]) {
      addPart(head, new THREE.ConeGeometry(0.09, 0.46, 5), c.belly, {
        position: [side * 0.19, 0.3, -0.12], rotation: [-0.62, 0, side * 0.18]
      })
    }
    addPart(head, new THREE.ConeGeometry(0.075, 0.24, 4), c.accent, { position: [0, 0.37, 0.02], rotation: [-0.25, 0, 0] })
  }

  if (model.cap) {
    addPart(head, new THREE.SphereGeometry(0.48, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), c.accent, {
      position: [0, 0.2, -0.03], scale: [1.24, 0.68, 1.18], outline: true
    })
    addPart(head, new THREE.CylinderGeometry(0.12, 0.16, 0.22, 7), c.belly, { position: [0, 0.16, -0.04] })
    for (const [x, z, s] of [[-0.24, 0.18, 0.09], [0.2, 0.26, 0.075], [0.06, -0.25, 0.08]]) {
      addPart(head, sphere(s, 7), c.belly, { position: [x, 0.38, z], scale: [1, 0.38, 1] })
    }
  }

  if (model.crest) {
    for (let i = 0; i < 3; i++) {
      addPart(head, new THREE.ConeGeometry(0.065, 0.3 + i * 0.05, 4), i === 1 ? c.accent : c.belly, {
        position: [0, 0.4, -0.02 - i * 0.1], rotation: [-0.5 - i * 0.14, 0, 0]
      })
    }
  }

  if (model.mane) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      addPart(rig, new THREE.ConeGeometry(0.13, 0.32, 4), c.accent, {
        position: [Math.cos(a) * 0.34, 1.04 + Math.sin(a) * 0.06, Math.sin(a) * 0.34],
        rotation: [Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7]
      })
    }
  }

  if (model.collar) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      addPart(rig, sphere(0.16, 8), i % 2 ? c.accent : c.belly, {
        position: [Math.cos(a) * 0.42, 1.02, Math.sin(a) * 0.36], scale: [1, 0.42, 0.7],
        rotation: [0, -a, 0], outline: 'soft'
      })
    }
  }

  if (model.gills) {
    for (const side of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        addPart(head, new THREE.CylinderGeometry(0.007, 0.007, 0.3, 3), c.dark, {
          position: [side * 0.39, -0.06 + i * 0.06, 0.3], rotation: [0, 0, side * (Math.PI / 2 + i * 0.2)], noShadow: true
        })
      }
    }
  }

  if (model.antennae) {
    for (const side of [-1, 1]) {
      const antenna = new THREE.Group()
      antenna.position.set(side * 0.14, 0.3, 0.08)
      antenna.rotation.z = side * 0.34
      antenna.rotation.x = -0.32
      addPart(antenna, new THREE.CylinderGeometry(0.012, 0.018, 0.42, 5), c.dark, { position: [0, 0.2, 0], noShadow: true })
      addPart(antenna, sphere(0.06, 7), c.accent, { position: [0, 0.42, 0], material: new THREE.MeshBasicMaterial({ color: c.accent }), noShadow: true })
      head.add(antenna)
    }
  }

  if (model.halo) {
    addPart(head, new THREE.TorusGeometry(0.27, 0.025, 5, 18), c.accent, {
      position: [0, 0.66, 0], rotation: [Math.PI / 2, 0, 0],
      material: new THREE.MeshBasicMaterial({ color: c.accent }), noShadow: true
    })
    const haloGlow = glowSprite(glowColor, 1.3, 0.4)
    haloGlow.position.set(0, 0.66, 0)
    head.add(haloGlow)
  }

  if (model.spots) {
    const spots = [[-0.22, 0.84, 0.38, 0.1], [0.27, 0.72, 0.34, 0.085], [0.05, 0.9, -0.2, 0.08]]
    for (const [x, y, z, r] of spots) {
      addPart(rig, sphere(r, 7), c.belly, { position: [x, y, z], scale: [1, 0.35, 1] })
    }
  }

  if (model.claws) {
    for (const side of [-1, 1]) {
      addPart(head, new THREE.ConeGeometry(0.035, 0.14, 4), c.belly, {
        position: [side * 0.16, -0.13, 0.37], rotation: [Math.PI / 2, 0, 0], noShadow: true
      })
    }
  }

  if (model.crystals) {
    refs.crystals = []
    for (let i = 0; i < 3; i++) {
      const shard = addPart(rig, new THREE.ConeGeometry(0.09, 0.32 + i * 0.08, 5), 0x9ee8f5, {
        position: [-0.18 + i * 0.18, 0.98 - i * 0.02, -0.34],
        rotation: [-0.4, 0, (i - 1) * 0.25],
        material: new THREE.MeshStandardMaterial({ color: 0x9ee8f5, emissive: 0x4fc6dc, emissiveIntensity: 0.6, roughness: 0.3, flatShading: true }),
        noShadow: true
      })
      refs.crystals.push(shard)
    }
  }

  if (model.tail && tail) {
    if (model.tail === 'ember') {
      addPart(tail, sphere(0.2, 10), c.body, { position: [0, 0.08, -0.3], scale: [1, 1.1, 2.2], outline: true })
      addPart(tail, sphere(0.15, 9), c.belly, { position: [0, 0.28, -0.66], scale: [1, 1.15, 0.9] })
      refs.flame = addPart(tail, new THREE.ConeGeometry(0.14, 0.46, 6), c.accent, {
        position: [0, 0.52, -0.72], material: new THREE.MeshBasicMaterial({ color: c.accent }), noShadow: true
      })
      refs.flameCore = addPart(tail, new THREE.ConeGeometry(0.07, 0.26, 5), 0xfff4b0, {
        position: [0, 0.55, -0.7], material: new THREE.MeshBasicMaterial({ color: 0xfff4b0 }), noShadow: true
      })
      refs.glow = glowSprite(glowColor, 1.35, 0.6)
      refs.glow.position.set(0, 0.58, -0.72)
      tail.add(refs.glow)
    } else if (model.tail === 'fin') {
      addPart(tail, sphere(0.2, 9), c.body, { position: [0, -0.02, -0.22], scale: [0.78, 0.5, 1.7], outline: 'soft' })
      addPart(tail, new THREE.ConeGeometry(0.25, 0.5, 4), c.accent, {
        position: [0, -0.03, -0.58], rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 0.32]
      })
    } else if (model.tail === 'puff') {
      addPart(tail, sphere(0.23, 9), c.body, { position: [0, 0.06, -0.3], outline: 'soft' })
      addPart(tail, sphere(0.2, 9), c.belly, { position: [0, 0.14, -0.48], scale: [1, 0.9, 0.8] })
    } else if (model.tail === 'zig') {
      addPart(tail, new THREE.CylinderGeometry(0.06, 0.09, 0.3, 5), c.body, { position: [0, 0.06, -0.14], rotation: [1.1, 0, 0] })
      const zig = [[0, 0.19, -0.32, 0.4, 0.6], [0.05, 0.42, -0.44, 0.1, -0.7], [0, 0.64, -0.54, -0.2, 0.5]]
      for (const [x, y, z, rx, rz] of zig) {
        addPart(tail, new THREE.BoxGeometry(0.12, 0.34, 0.12), c.accent, { position: [x, y, z], rotation: [rx, 0, rz], outline: 'soft' })
      }
    } else if (model.tail === 'leaf') {
      addPart(tail, new THREE.ConeGeometry(0.18, 0.5, 5), c.body, { position: [0, 0.05, -0.3], rotation: [-1.1, 0, 0], outline: 'soft' })
      addPart(tail, sphere(0.25, 9), c.accent, { position: [0, 0.28, -0.62], scale: [1.5, 0.15, 0.7], rotation: [-0.2, 0, 0] })
      addPart(tail, sphere(0.2, 8), c.belly, { position: [0, 0.22, -0.52], scale: [1.2, 0.12, 0.55], rotation: [-0.2, 0, 0.2] })
    } else if (model.tail === 'wisp') {
      addPart(tail, sphere(0.18, 9), c.body, { position: [0, 0.06, -0.2], scale: [1, 0.8, 1.5] })
      refs.flame = addPart(tail, new THREE.ConeGeometry(0.18, 0.55, 6), c.accent, {
        position: [0, 0.35, -0.5], rotation: [0.3, 0, 0],
        material: new THREE.MeshBasicMaterial({ color: c.accent, transparent: true, opacity: 0.72 }), noShadow: true
      })
      refs.flameCore = addPart(tail, sphere(0.1, 7), c.belly, {
        position: [0, 0.38, -0.48], material: new THREE.MeshBasicMaterial({ color: c.belly }), noShadow: true
      })
      refs.glow = glowSprite(glowColor, 1.5, 0.5)
      refs.glow.position.set(0, 0.4, -0.48)
      tail.add(refs.glow)
    } else if (model.tail === 'feather') {
      for (let i = -1; i <= 1; i++) {
        addPart(tail, new THREE.ConeGeometry(0.09, 0.62, 4), i === 0 ? c.accent : c.belly, {
          position: [i * 0.13, 0.04, -0.26], rotation: [1.25, 0, i * 0.3]
        })
      }
    } else if (model.tail === 'serpent') {
      addPart(tail, new THREE.ConeGeometry(0.3, 0.9, 7), c.body, {
        position: [0, 0.02, -0.35], rotation: [-1.9, 0, 0], outline: 'soft'
      })
      addPart(tail, new THREE.ConeGeometry(0.12, 0.42, 5), c.accent, {
        position: [0, -0.12, -0.72], rotation: [-2.1, 0, 0]
      })
    }
  }

  if (model.wings) {
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      if (model.wings === 'bird') {
        pivot.position.set(side * 0.38, 0.94, -0.02)
        addPart(pivot, sphere(0.36, 10), c.accent, {
          position: [side * 0.28, -0.04, -0.06], scale: [1.25, 0.18, 0.72], rotation: [0, side * 0.18, side * 0.18], outline: 'soft'
        })
        addPart(pivot, sphere(0.22, 8), c.belly, { position: [side * 0.3, 0.02, 0.08], scale: [1.1, 0.12, 0.55] })
      } else {
        pivot.position.set(side * 0.3, 0.94, -0.12)
        const wingMat = new THREE.MeshStandardMaterial({
          color: c.accent, transparent: true, opacity: 0.78, roughness: 0.55, side: THREE.DoubleSide, flatShading: true
        })
        for (let i = 0; i < 2; i++) {
          addPart(pivot, sphere(0.34 - i * 0.07, 9), c.accent, {
            position: [side * (0.25 + i * 0.12), 0.08 - i * 0.04, -0.05 - i * 0.06],
            scale: [1.15, 0.1, 0.58 - i * 0.08], rotation: [0, side * 0.35, side * (0.18 + i * 0.25)],
            material: wingMat.clone(), noShadow: true
          })
        }
        if (model.wings === 'fairy') {
          addPart(pivot, sphere(0.14, 7), c.belly, {
            position: [side * 0.18, 0.12, -0.02], scale: [0.9, 0.08, 0.5],
            material: new THREE.MeshBasicMaterial({ color: c.belly, transparent: true, opacity: 0.6 }), noShadow: true
          })
        }
      }
      rig.add(pivot)
      wings.push(pivot)
    }
  }

  if (model.sparks) {
    refs.sparks = []
    for (let i = 0; i < 2; i++) {
      const spark = glowSprite('#fff3a0', 0.45, 0.9)
      spark.position.set(-0.4 + i * 0.8, 1.35 + i * 0.15, 0.25)
      rig.add(spark)
      refs.sparks.push(spark)
    }
  }

  if (model.glow && !refs.glow) {
    refs.glow = glowSprite(glowColor, 1.1, 0.35)
    refs.glow.position.set(0, 1.15, -0.2)
    rig.add(refs.glow)
  }

  refs.head = head
  refs.body = body
  refs.tail = tail
  return refs
}

const critterModels = {
  cindercub: { kind: 'quad', ears: 'round', tail: 'ember', cheeks: true, mane: true },
  tidepup: { kind: 'quad', ears: 'flop', tail: 'fin', gills: true, cheeks: true },
  mossling: { kind: 'quad', cap: true, spots: true, tail: 'puff', cheeks: true },
  voltmoth: { kind: 'bug', wings: 'moth', antennae: true, spots: true, glow: true },
  cragoon: { kind: 'crab', claws: true, spots: true },
  breezle: { kind: 'bird', wings: 'bird', tail: 'feather', beak: true, crest: true },
  frostfawn: { kind: 'quad', antlers: true, tail: 'puff', spots: true, cheeks: true },
  snowmole: { kind: 'blob', claws: true, crystals: true, cheeks: true },
  emberfly: { kind: 'bug', wings: 'fairy', antennae: true, glow: true, sparks: true },
  duskpaw: { kind: 'quad', ears: 'point', tail: 'wisp', cheeks: true, glow: true },
  wispurr: { kind: 'ghost', ears: 'point', tail: 'wisp', halo: true, cheeks: true, glow: true },
  dracoil: { kind: 'serpent', horns: 'dragon', tail: 'serpent', spots: true },
  sparkit: { kind: 'quad', ears: 'long', tail: 'zig', cheeks: true, sparks: true },
  petalfin: { kind: 'quad', tail: 'leaf', collar: true, spots: true, cheeks: true },
  duneshell: { kind: 'turtle', shell: true, tail: 'puff', claws: true }
}

for (const [id, model] of Object.entries(critterModels)) {
  builders[id] = colors => buildCritter(colors, model)
}

export function createCreature(speciesId, { battle = false, scale = 1 } = {}) {
  const species = byId[speciesId]
  if (!species) throw new Error(`Unknown species ${speciesId}`)
  const group = new THREE.Group()
  const wrapper = new THREE.Group()
  wrapper.scale.setScalar(scale)
  group.add(wrapper)
  const refs = builders[speciesId](species.colors)
  wrapper.add(refs.rig)
  group.userData = { species, refs, battle, phase: Math.random() * Math.PI * 2, scale }
  group.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true
      o.receiveShadow = true
    }
  })
  return { group, refs, species }
}

export function animateCreature(creature, time, moving = false, speed = 1, { flying = false } = {}) {
  const { refs, phase = 0 } = creature.group.userData
  const t = time + phase
  const walk = moving ? Math.min(1, speed) : 0
  refs.rig.position.y = Math.sin(t * 2.1) * 0.025 + (walk ? Math.abs(Math.sin(t * 8)) * 0.06 * walk : 0)
  if (refs.type === 'quad' || refs.type === 'biped') {
    refs.rig.rotation.z = Math.sin(t * 4.2) * 0.015 * walk
  }
  if (refs.head) {
    refs.head.rotation.y = Math.sin(t * 0.7) * 0.08
    refs.head.rotation.z = Math.sin(t * 0.9 + 1) * 0.035
    refs.head.position.y = (refs.head.userData.baseY ??= refs.head.position.y) + Math.sin(t * 2.2) * 0.018
  }
  if (refs.tail) {
    refs.tail.rotation.y = Math.sin(t * 2.4) * (refs.type === 'quad' ? 0.35 : 0.2)
    refs.tail.rotation.x = Math.sin(t * 1.7) * 0.1
  }
  if (refs.ears) {
    refs.ears.forEach((ear, i) => {
      const base = ear.userData.baseZ ??= ear.rotation.z
      ear.rotation.z = base + Math.sin(t * 2.6 + i * 1.7) * 0.08
    })
  }
  if (refs.wings) {
    const flap = Math.sin(t * (flying ? 7 : 3.5)) * (flying ? 0.8 : 0.3)
    refs.wings.forEach((wing, i) => {
      wing.rotation.z = (i === 0 ? -1 : 1) * (0.25 + flap)
      wing.rotation.x = Math.sin(t * 2.1 + i) * 0.08
    })
  }
  if (refs.legs) {
    refs.legs.forEach((leg, i) => {
      leg.rotation.x = walk ? Math.sin(t * 8 + i * Math.PI / 2) * 0.4 * walk : Math.sin(t * 1.4 + i) * 0.02
    })
  }
  if (refs.arms) {
    refs.arms.forEach((arm, i) => {
      arm.rotation.x = walk ? Math.sin(t * 8 + i * Math.PI / 2 + Math.PI) * 0.35 * walk : Math.sin(t * 1.7 + i) * 0.04
    })
  }
  if (refs.glow) refs.glow.material.opacity = 0.45 + Math.sin(t * 5) * 0.18
  if (refs.sparks) refs.sparks.forEach((s, i) => {
    s.material.opacity = 0.4 + Math.sin(t * 7 + i * 2) * 0.35
    s.scale.setScalar(0.35 + Math.sin(t * 9 + i) * 0.1)
  })
  if (refs.bubbles) refs.bubbles.forEach((b, i) => {
    b.position.y = 1.1 + i * 0.22 + Math.sin(t * 1.8 + i) * 0.1
    b.position.x = -0.55 + i * 0.18 + Math.cos(t * 1.3 + i) * 0.05
  })
  if (refs.flame) {
    refs.flame.scale.y = 1 + Math.sin(t * 9) * 0.15
    refs.flameCore.scale.y = 1 + Math.sin(t * 12 + 1) * 0.2
  }
  if (refs.crystals) refs.crystals.forEach((s, i) => {
    s.material.emissiveIntensity = 0.5 + Math.sin(t * 2.3 + i) * 0.25
  })
}

export function attachShadowBlob(creature) {
  const refs = creature.refs
  const tex = (() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62)
    g.addColorStop(0, 'rgba(22,48,35,0.55)')
    g.addColorStop(1, 'rgba(22,48,35,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(canvas)
  })()
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.7),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.8 })
  )
  blob.rotation.x = -Math.PI / 2
  blob.position.y = 0.02
  refs.rig.add(blob)
  return blob
}

export function buildCreatureIcon(speciesId, renderer, size = 192) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(2.0, 2.0, 4.3)
  camera.lookAt(0, 0.95, 0)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x86a07a, 2.2))
  const d = new THREE.DirectionalLight(0xfff1cf, 2.6)
  d.position.set(3, 5, 4)
  scene.add(d)
  const c = createCreature(speciesId, { battle: true, scale: 1.15 })
  c.group.position.y = 0
  scene.add(c.group)
  animateCreature(c, 0, false, 0)
  c.group.rotation.y = 0.35
  const prevSize = renderer.getSize(new THREE.Vector2())
  const prevRatio = renderer.getPixelRatio()
  renderer.setPixelRatio(1)
  renderer.setSize(size, size, false)
  renderer.setClearColor(0x000000, 0)
  renderer.render(scene, camera)
  const url = renderer.domElement.toDataURL('image/png')
  renderer.setPixelRatio(prevRatio)
  renderer.setSize(prevSize.x, prevSize.y, false)
  return url
}
