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
