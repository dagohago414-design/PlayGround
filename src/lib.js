import * as THREE from 'three'

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt))
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a)
export const pick = arr => arr[(Math.random() * arr.length) | 0]
export const easeOutCubic = t => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export function seeded(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

export function valueNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi), b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1)
  return lerp(lerp(a, b, u), lerp(c, d, u), v)
}

export function fbm(x, y, octaves = 3) {
  let sum = 0, amp = 0.5, freq = 1
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp
    freq *= 2
    amp *= 0.5
  }
  return sum
}

let gradientMap = null
export function getToonGradient() {
  if (gradientMap) return gradientMap
  const steps = new Uint8Array([90, 155, 210, 255])
  gradientMap = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat)
  gradientMap.minFilter = THREE.NearestFilter
  gradientMap.magFilter = THREE.NearestFilter
  gradientMap.generateMipmaps = false
  gradientMap.needsUpdate = true
  return gradientMap
}

export function toonMat(color, opts = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonGradient(),
    transparent: opts.transparent || false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true
  })
}

export function flatMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0,
    flatShading: opts.flatShading ?? true,
    transparent: opts.transparent || false,
    opacity: opts.opacity ?? 1,
    vertexColors: opts.vertexColors || false,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0
  })
}

const outlineMat = new THREE.MeshBasicMaterial({ color: 0x223033, side: THREE.BackSide })
const outlineMatSoft = new THREE.MeshBasicMaterial({ color: 0x3d4b46, side: THREE.BackSide })

export function addPart(parent, geometry, color, opts = {}) {
  const material = opts.material || (opts.standard ? flatMat(color, opts) : toonMat(color, opts))
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = opts.noShadow ? false : true
  mesh.receiveShadow = opts.noShadow ? false : true
  if (opts.position) mesh.position.set(...opts.position)
  if (opts.rotation) mesh.rotation.set(...opts.rotation)
  if (opts.scale) mesh.scale.set(...opts.scale)
  parent.add(mesh)
  if (opts.outline) {
    const shell = new THREE.Mesh(geometry, opts.outline === 'soft' ? outlineMatSoft : outlineMat)
    shell.scale.setScalar(opts.outlineScale ?? 1.055)
    shell.renderOrder = -1
    mesh.add(shell)
  }
  return mesh
}

export function sphere(r = 1, detail = 12) {
  return new THREE.SphereGeometry(r, detail, Math.max(6, Math.round(detail * 0.7)))
}

export function capsule(r = 0.4, length = 0.6, cap = 5, radial = 12) {
  return new THREE.CapsuleGeometry(r, length, cap, radial)
}

export function makeRadialTexture(hex = '#ffffff', stops = [[0, 1], [0.35, 0.55], [1, 0]]) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const color = new THREE.Color(hex)
  const r = Math.round(color.r * 255), g = Math.round(color.g * 255), b = Math.round(color.b * 255)
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [stop, alpha] of stops) grad.addColorStop(stop, `rgba(${r},${g},${b},${alpha})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function glowSprite(color = '#fff3b0', size = 2, opacity = 1) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture(color, [[0, 1], [0.3, 0.6], [1, 0]]),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }))
  sprite.scale.setScalar(size)
  return sprite
}

export function labelTexture(text, {
  width = 512, height = 160, bg = 'rgba(34,48,51,0.92)', color = '#fdf4dc',
  font = '700 64px Baloo2', radius = 34, padding = 26, accent = null
} = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const r = radius
  ctx.beginPath()
  ctx.moveTo(r, 0); ctx.arcTo(width, 0, width, height, r)
  ctx.arcTo(width, height, 0, height, r); ctx.arcTo(0, height, 0, 0, r)
  ctx.arcTo(0, 0, width, 0, r); ctx.closePath()
  ctx.fillStyle = bg
  ctx.fill()
  if (accent) {
    ctx.strokeStyle = accent
    ctx.lineWidth = 8
    ctx.stroke()
  }
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2 + 3)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function disposeObject(object) {
  object.traverse(child => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      for (const m of mats) {
        if (m.map) m.map.dispose()
        m.dispose()
      }
    }
  })
}

export function typeColor(type) {
  return {
    fire: 0xff7a3d, water: 0x38a9f0, grass: 0x57c96a, electric: 0xf5c518,
    rock: 0xa9a28f, flying: 0x9d8cf2, normal: 0xc7bfae
  }[type] ?? 0xc7bfae
}

export function formatNumber(n) {
  return n.toLocaleString('en-US')
}
