import * as THREE from 'three'
import { addPart, capsule, clamp, damp, makeRadialTexture, sphere, toonMat } from './lib.js'

export class Player {
  constructor(world) {
    this.world = world
    this.position = new THREE.Vector3(0, 0, 8)
    this.velocity = new THREE.Vector2()
    this.facing = Math.PI
    this.speed = 0
    this.jumpVelocity = 0
    this.jumpHeight = 0
    this.grounded = true
    this.stepTimer = 0
    this.group = new THREE.Group()
    this.rig = new THREE.Group()
    this.group.add(this.rig)
    this.build()
    this.group.position.set(this.position.x, world.heightAt(this.position.x, this.position.z), this.position.z)
    this.group.rotation.y = this.facing
    this.dust = this.createDust()
  }

  build() {
    const skin = 0xf2c39c
    const jacket = 0x2a9ea7
    const jacketDark = 0x1d737d
    const pants = 0xf3e7cf
    const shoe = 0xf8f6ee
    const red = 0xe4564e
    const hair = 0x51372b

    const legs = []
    for (const side of [-1, 1]) {
      const leg = new THREE.Group()
      leg.position.set(side * 0.13, 0.62, 0)
      addPart(leg, capsule(0.095, 0.28, 3, 8), pants, { position: [0, -0.2, 0], outline: 'soft', outlineScale: 1.04 })
      addPart(leg, sphere(0.13, 9), shoe, { position: [0, -0.44, 0.06], scale: [1, 0.72, 1.35], outline: 'soft' })
      addPart(leg, new THREE.BoxGeometry(0.19, 0.03, 0.05), 0xd95d50, { position: [0, -0.38, 0.05] })
      this.rig.add(leg)
      legs.push(leg)
    }

    const torso = new THREE.Group()
    torso.position.set(0, 1.02, 0)
    addPart(torso, capsule(0.255, 0.36, 4, 12), jacket, { position: [0, -0.02, 0], outline: true, outlineScale: 1.035 })
    addPart(torso, new THREE.BoxGeometry(0.035, 0.42, 0.02), jacketDark, { position: [0, -0.02, 0.253] })
    addPart(torso, new THREE.BoxGeometry(0.5, 0.07, 0.32), jacketDark, { position: [0, -0.28, 0] })
    this.rig.add(torso)

    const backpack = new THREE.Group()
    backpack.position.set(0, 1.03, -0.26)
    addPart(backpack, new THREE.BoxGeometry(0.42, 0.5, 0.22), red, { position: [0, 0.02, 0], outline: 'soft' })
    addPart(backpack, new THREE.BoxGeometry(0.3, 0.2, 0.08), 0xf4b94a, { position: [0, 0.02, -0.14] })
    addPart(backpack, new THREE.TorusGeometry(0.12, 0.02, 4, 10, Math.PI), 0x9e342f, { position: [0, 0.17, -0.15], rotation: [0, 0, 0] })
    this.rig.add(backpack)
    this.backpack = backpack

    const head = new THREE.Group()
    head.position.set(0, 1.55, 0)
    addPart(head, sphere(0.278, 13), skin, { outline: true, outlineScale: 1.03 })
    addPart(head, sphere(0.24, 12), hair, { position: [0, 0.1, -0.07], scale: [1.04, 0.8, 1.02] })
    addPart(head, sphere(0.26, 12), hair, { position: [0, 0.16, 0.03], scale: [1.02, 0.55, 1.02] })
    addPart(head, sphere(0.07, 8), 0x31231d, { position: [-0.095, -0.01, 0.255] })
    addPart(head, sphere(0.07, 8), 0x31231d, { position: [0.095, -0.01, 0.255] })
    addPart(head, sphere(0.022, 6), 0xffffff, { position: [-0.075, 0.012, 0.315] })
    addPart(head, sphere(0.022, 6), 0xffffff, { position: [0.115, 0.012, 0.315] })
    addPart(head, new THREE.TorusGeometry(0.06, 0.012, 4, 12, Math.PI), 0x9e5245, {
      position: [0, -0.11, 0.265], rotation: [0.1, 0, Math.PI]
    })
    const cap = new THREE.Group()
    cap.position.set(0, 0.24, -0.01)
    addPart(cap, new THREE.SphereGeometry(0.27, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), red, { position: [0, -0.02, 0] })
    addPart(cap, new THREE.CylinderGeometry(0.28, 0.285, 0.09, 12), red, { position: [0, -0.02, 0] })
    addPart(cap, new THREE.BoxGeometry(0.38, 0.045, 0.26), red, { position: [0, -0.04, 0.25], rotation: [0.08, 0, 0] })
    addPart(cap, sphere(0.075, 8), 0xffd45e, { position: [0, 0.05, 0.27] })
    head.add(cap)
    this.rig.add(head)
    this.head = head

    const arms = []
    for (const side of [-1, 1]) {
      const arm = new THREE.Group()
      arm.position.set(side * 0.31, 1.15, 0)
      arm.rotation.z = side * 0.12
      addPart(arm, capsule(0.085, 0.28, 3, 8), jacket, { position: [0, -0.2, 0], outline: 'soft', outlineScale: 1.04 })
      addPart(arm, sphere(0.09, 8), skin, { position: [0, -0.42, 0] })
      this.rig.add(arm)
      arms.push(arm)
    }

    const scarf = addPart(this.rig, new THREE.TorusGeometry(0.21, 0.055, 5, 14), 0xffcf5c, {
      position: [0, 1.31, 0], rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 0.75]
    })
    this.scarf = scarf

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 1.35),
      new THREE.MeshBasicMaterial({
        map: makeRadialTexture('#183224', [[0, 0.5], [0.55, 0.26], [1, 0]]),
        transparent: true, opacity: 0.65, depthWrite: false
      })
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.02
    this.group.add(shadow)
    this.legs = legs
    this.arms = arms
    this.torso = torso
  }

  createDust() {
    const pool = []
    const tex = makeRadialTexture('#f4e8c8', [[0, 0.8], [0.5, 0.35], [1, 0]])
    for (let i = 0; i < 10; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, depthWrite: false, opacity: 0
      }))
      sprite.scale.setScalar(0.001)
      this.group.add(sprite)
      pool.push({ sprite, life: 0, maxLife: 1, vel: new THREE.Vector3() })
    }
    return pool
  }

  puff(x, z) {
    const d = this.dust.find(p => p.life <= 0)
    if (!d) return
    d.life = d.maxLife = 0.55
    d.sprite.position.set(x + (Math.random() - 0.5) * 0.25, this.group.position.y + 0.12, z + (Math.random() - 0.5) * 0.25)
    d.vel.set((Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6)
  }

  update(dt, input, cameraYaw) {
    const forward = new THREE.Vector2(Math.sin(cameraYaw), Math.cos(cameraYaw))
    const right = new THREE.Vector2(-forward.y, forward.x)
    const move = new THREE.Vector2()
    move.addScaledVector(forward, input.y)
    move.addScaledVector(right, input.x)
    const moving = move.lengthSq() > 0.0001
    if (moving) move.normalize()

    const running = input.run && moving
    const targetSpeed = moving ? (running ? 8.4 : 4.9) : 0
    const accel = moving ? 13 : 18
    this.speed = damp(this.speed, targetSpeed, accel, dt)
    const dirX = moving ? move.x : 0
    const dirZ = moving ? move.y : 0
    this.velocity.x = damp(this.velocity.x, dirX * this.speed, 14, dt)
    this.velocity.y = damp(this.velocity.y, dirZ * this.speed, 14, dt)

    let nx = this.position.x + this.velocity.x * dt
    let nz = this.position.z + this.velocity.y * dt
    const radius = 0.42
    const maxR = 76
    const distC = Math.hypot(nx, nz)
    if (distC > maxR) {
      nx = nx / distC * maxR
      nz = nz / distC * maxR
    }
    if (!this.world.isBlocked(nx, this.position.z, radius)) this.position.x = nx
    else this.velocity.x *= 0.2
    if (!this.world.isBlocked(this.position.x, nz, radius)) this.position.z = nz
    else this.velocity.y *= 0.2

    if (input.jump && this.grounded) {
      this.jumpVelocity = 5.6
      this.grounded = false
    }
    if (!this.grounded) {
      this.jumpVelocity -= 16 * dt
      this.jumpHeight += this.jumpVelocity * dt
      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0
        this.jumpVelocity = 0
        this.grounded = true
        for (let i = 0; i < 4; i++) this.puff(this.position.x, this.position.z)
      }
    }

    const groundY = this.world.heightAt(this.position.x, this.position.z)
    this.group.position.set(this.position.x, groundY + this.jumpHeight, this.position.z)

    if (moving) {
      const targetFacing = Math.atan2(move.x, move.y)
      let diff = targetFacing - this.facing
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      this.facing += diff * Math.min(1, dt * 12)
    }
    this.group.rotation.y = this.facing

    const t = performance.now() * 0.001
    const stride = this.speed / 4.9
    const swing = Math.sin(t * (running ? 14 : 9)) * Math.min(1, stride) * (running ? 0.9 : 0.65)
    this.legs[0].rotation.x = swing
    this.legs[1].rotation.x = -swing
    this.arms[0].rotation.x = -swing * 0.85
    this.arms[1].rotation.x = swing * 0.85
    this.rig.position.y = Math.abs(Math.sin(t * (running ? 14 : 9))) * 0.055 * Math.min(1, stride)
    this.torso.rotation.z = Math.sin(t * 6) * 0.015 * Math.min(1, stride)
    this.head.rotation.z = Math.sin(t * 3) * 0.02
    this.backpack.rotation.x = -0.06 - Math.min(1, stride) * 0.05
    if (!moving) {
      this.rig.position.y = Math.sin(t * 2) * 0.012
      this.arms[0].rotation.z = 0.12 + Math.sin(t * 2) * 0.02
      this.arms[1].rotation.z = -0.12 - Math.sin(t * 2) * 0.02
    }

    if (this.speed > 5 && this.grounded) {
      this.stepTimer -= dt
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.15
        this.puff(this.position.x, this.position.z)
      }
    }

    for (const d of this.dust) {
      if (d.life <= 0) continue
      d.life -= dt
      d.sprite.position.addScaledVector(d.vel, dt)
      const k = clamp(d.life / d.maxLife, 0, 1)
      d.sprite.material.opacity = k * 0.5
      d.sprite.scale.setScalar((1 - k) * 0.9 + 0.15)
    }

    return { moving, running, speed: this.speed }
  }
}
