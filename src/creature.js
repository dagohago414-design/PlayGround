import * as THREE from 'three';
import { SPECIES } from './data.js';
import { rand, easeOutElastic } from './utils.js';

const GEO = {
  sphere: new THREE.SphereGeometry(1, 20, 14),
  sphereLow: new THREE.SphereGeometry(1, 12, 9),
  ico: new THREE.IcosahedronGeometry(1, 1),
  dodeca: new THREE.DodecahedronGeometry(1, 0),
  cone: new THREE.ConeGeometry(1, 1, 14),
  coneSmooth: new THREE.ConeGeometry(1, 1, 20),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 14),
  box: new THREE.BoxGeometry(1, 1, 1),
  torus: new THREE.TorusGeometry(1, 0.2, 10, 26),
  capsule: new THREE.CapsuleGeometry(0.5, 1, 6, 12)
};

const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x24333a, side: THREE.BackSide, transparent: true, opacity: 0.34 });

function makeMat(color, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.58,
    metalness: opts.metalness ?? 0.02,
    flatShading: Boolean(opts.flat),
    transparent: Boolean(opts.transparent),
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    emissive: new THREE.Color(opts.emissive ?? 0x000000),
    emissiveIntensity: opts.emissiveIntensity ?? 0
  });
  m.userData.baseEmissive = m.emissive.clone();
  m.userData.baseIntensity = m.emissiveIntensity;
  return m;
}

function makeGlowSprite(color, size = 1.4) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.28, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(size);
  return sprite;
}

function addMesh(parent, geo, color, opts = {}) {
  const m = makeMat(color, opts);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  mesh.scale.set(opts.sx ?? 1, opts.sy ?? 1, opts.sz ?? 1);
  mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = false;
  parent.add(mesh);
  if (opts.outline) {
    const o = new THREE.Mesh(geo, OUTLINE_MAT);
    o.position.copy(mesh.position);
    o.rotation.copy(mesh.rotation);
    o.scale.copy(mesh.scale).multiplyScalar(1.055);
    o.castShadow = false;
    parent.add(o);
  }
  return mesh;
}

function addEyes(parent, cfg, y, z, spread, size = 0.11, look = 1) {
  const eyes = [];
  for (const s of [-1, 1]) {
    const holder = new THREE.Group();
    holder.position.set(s * spread, y, z);
    parent.add(holder);
    addMesh(holder, GEO.sphere, '#fffdf4', { z: 0.02, sx: size, sy: size * 1.12, sz: size * 0.72, castShadow: false });
    addMesh(holder, GEO.sphere, cfg.eye, { z: 0.078, sx: size * 0.56, sy: size * 0.72, sz: size * 0.4, castShadow: false, roughness: 0.25 });
    addMesh(holder, GEO.sphere, '#ffffff', { x: -size * 0.18, y: size * 0.26, z: size * 0.19, sx: size * 0.15, sy: size * 0.17, sz: size * 0.1, castShadow: false, emissive: '#ffffff', emissiveIntensity: 0.5 });
    if (look) {
      const brow = addMesh(holder, GEO.box, cfg.accent, { y: size * 1.15, z: size * 0.1, sx: size * 0.9, sy: size * 0.1, sz: size * 0.08, castShadow: false });
      brow.rotation.z = s * 0.16;
    }
    eyes.push(holder);
  }
  return eyes;
}

function addBlush(parent, cfg, y, z, spread, size) {
  for (const s of [-1, 1]) {
    const m = makeMat('#ff8b8b', { transparent: true, opacity: 0.5, roughness: 1 });
    const mesh = new THREE.Mesh(GEO.sphere, m);
    mesh.position.set(s * spread, y, z);
    mesh.scale.set(size, size * 0.55, size * 0.2);
    parent.add(mesh);
  }
}

function buildEmberfox(cfg) {
  const body = new THREE.Group();
  const torso = addMesh(body, GEO.sphere, cfg.body, { y: 0.58, z: -0.02, sx: 0.46, sy: 0.44, sz: 0.52, outline: true });
  addMesh(body, GEO.sphere, cfg.belly, { y: 0.5, z: 0.26, sx: 0.32, sy: 0.3, sz: 0.28 });
  const head = new THREE.Group();
  head.position.set(0, 0.92, 0.24);
  body.add(head);
  addMesh(head, GEO.sphere, cfg.body, { sx: 0.43, sy: 0.39, sz: 0.38, outline: true });
  addMesh(head, GEO.sphere, cfg.belly, { y: -0.08, z: 0.3, sx: 0.24, sy: 0.17, sz: 0.18 });
  addMesh(head, GEO.sphere, '#3a231e', { y: -0.02, z: 0.45, sx: 0.075, sy: 0.06, sz: 0.07 });
  addEyes(head, cfg, 0.08, 0.31, 0.18, 0.1);
  addBlush(head, cfg, -0.05, 0.33, 0.3, 0.075);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.26, 0.28, -0.02);
    ear.rotation.z = s * 0.24;
    head.add(ear);
    addMesh(ear, GEO.cone, cfg.body, { y: 0.2, sx: 0.15, sy: 0.46, sz: 0.11, outline: true });
    addMesh(ear, GEO.cone, '#ffd0a1', { y: 0.19, z: 0.045, sx: 0.085, sy: 0.34, sz: 0.05 });
    ears.push(ear);
  }
  const tuft = addMesh(head, GEO.cone, cfg.accent, { y: 0.34, z: 0.06, sx: 0.13, sy: 0.26, sz: 0.13, rx: -0.25 });

  const tail = new THREE.Group();
  tail.position.set(0, 0.55, -0.42);
  body.add(tail);
  const tailBase = addMesh(tail, GEO.sphere, cfg.body, { y: 0.06, z: -0.08, sx: 0.22, sy: 0.25, sz: 0.28, outline: true });
  addMesh(tail, GEO.sphere, cfg.belly, { y: -0.02, z: 0.03, sx: 0.13, sy: 0.16, sz: 0.16 });
  const flame = new THREE.Group();
  flame.position.set(0, 0.28, -0.18);
  tail.add(flame);
  const flameMesh = addMesh(flame, GEO.cone, '#ffa538', { y: 0.13, sx: 0.18, sy: 0.44, sz: 0.18, emissive: '#ff7a1a', emissiveIntensity: 1.1, roughness: 0.3 });
  const inner = addMesh(flame, GEO.cone, '#ffe08a', { y: 0.11, z: 0.02, sx: 0.1, sy: 0.3, sz: 0.1, emissive: '#ffd35c', emissiveIntensity: 1.6 });
  const glow = makeGlowSprite('rgba(255,166,64,0.9)', 0.9);
  glow.position.y = 0.16;
  flame.add(glow);
  const flameLight = new THREE.PointLight('#ff9d45', 1.7, 3.0, 2);
  flameLight.position.y = 0.2;
  flame.add(flameLight);

  const legs = [];
  for (const s of [-1, 1]) {
    for (const f of [-1, 1]) {
      const leg = addMesh(body, GEO.sphere, cfg.body, { x: s * 0.25, y: 0.18, z: f * 0.22, sx: 0.12, sy: 0.16, sz: 0.15, outline: true });
      addMesh(leg, GEO.sphere, cfg.belly, { y: -0.06, z: 0.07, sx: 0.1, sy: 0.06, sz: 0.12 });
      legs.push(leg);
    }
  }
  return {
    body, head, tail, ears, legs, flame, flameMesh, inner, glow,
    animate(t, moving, speed) {
      const bob = Math.sin(t * 2.3 + 0.4) * 0.035;
      body.position.y = bob;
      head.rotation.z = Math.sin(t * 1.4) * 0.045;
      head.rotation.x = Math.sin(t * 1.1 + 1) * 0.03;
      ears[0].rotation.z = 0.24 + Math.sin(t * 2.6) * 0.08;
      ears[1].rotation.z = -0.24 - Math.sin(t * 2.6 + 0.6) * 0.08;
      tail.rotation.y = Math.sin(t * 2.2) * 0.42;
      tail.rotation.x = Math.sin(t * 1.7) * 0.09;
      const flick = 1 + Math.sin(t * 13) * 0.12;
      flame.scale.set(flick, 1 + Math.sin(t * 9) * 0.08, flick);
      glow.material.opacity = 0.62 + Math.sin(t * 8) * 0.16;
      if (moving) {
        const s = speed ?? 1;
        legs[0].rotation.x = Math.sin(t * 11) * 0.7 * s;
        legs[1].rotation.x = Math.sin(t * 11 + Math.PI) * 0.7 * s;
        legs[2].rotation.x = Math.sin(t * 11 + Math.PI) * 0.7 * s;
        legs[3].rotation.x = Math.sin(t * 11) * 0.7 * s;
      } else {
        for (const l of legs) l.rotation.x *= 0.86;
      }
    }
  };
}

function buildLeafcub(cfg) {
  const body = new THREE.Group();
  addMesh(body, GEO.sphere, cfg.body, { y: 0.6, sx: 0.47, sy: 0.48, sz: 0.44, outline: true });
  addMesh(body, GEO.sphere, cfg.belly, { y: 0.54, z: 0.27, sx: 0.33, sy: 0.34, sz: 0.26 });
  const head = new THREE.Group();
  head.position.set(0, 1.0, 0.04);
  body.add(head);
  addMesh(head, GEO.sphere, cfg.body, { sx: 0.44, sy: 0.4, sz: 0.39, outline: true });
  addMesh(head, GEO.sphere, cfg.belly, { y: -0.1, z: 0.29, sx: 0.22, sy: 0.14, sz: 0.16 });
  addMesh(head, GEO.sphere, '#3a4a2c', { y: -0.06, z: 0.4, sx: 0.09, sy: 0.055, sz: 0.06 });
  addEyes(head, cfg, 0.06, 0.33, 0.17, 0.095);
  addBlush(head, cfg, -0.07, 0.34, 0.29, 0.07);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.28, 0.28, -0.02);
    head.add(ear);
    addMesh(ear, GEO.sphere, cfg.body, { sx: 0.16, sy: 0.18, sz: 0.09, outline: true });
    addMesh(ear, GEO.sphere, cfg.belly, { z: 0.05, sx: 0.09, sy: 0.1, sz: 0.04 });
    ears.push(ear);
  }
  const sprout = new THREE.Group();
  sprout.position.set(0, 0.4, 0.02);
  head.add(sprout);
  addMesh(sprout, GEO.cylinder, '#4c9c5f', { y: 0.09, sx: 0.035, sy: 0.2, sz: 0.035 });
  const leafL = addMesh(sprout, GEO.sphere, '#84e58f', { x: -0.16, y: 0.24, sx: 0.21, sy: 0.075, sz: 0.11, rz: 0.45, emissive: '#2c7a42', emissiveIntensity: 0.15 });
  const leafR = addMesh(sprout, GEO.sphere, '#84e58f', { x: 0.16, y: 0.28, sx: 0.21, sy: 0.075, sz: 0.11, rz: -0.45, emissive: '#2c7a42', emissiveIntensity: 0.15 });
  const legs = [];
  for (const s of [-1, 1]) {
    for (const f of [-1, 1]) {
      const leg = addMesh(body, GEO.sphere, cfg.body, { x: s * 0.24, y: 0.16, z: f * 0.18, sx: 0.13, sy: 0.14, sz: 0.15, outline: true });
      addMesh(leg, GEO.sphere, cfg.belly, { y: -0.045, z: 0.07, sx: 0.1, sy: 0.05, sz: 0.1 });
      legs.push(leg);
    }
  }
  const tail = addMesh(body, GEO.sphere, cfg.body, { y: 0.45, z: -0.43, sx: 0.14, sy: 0.14, sz: 0.14, outline: true });
  return {
    body, head, ears, legs, tail, sprout,
    animate(t, moving, speed) {
      const bob = Math.sin(t * 1.9) * 0.03;
      body.position.y = bob;
      head.rotation.z = Math.sin(t * 1.2) * 0.05;
      head.rotation.y = Math.sin(t * 0.9 + 1) * 0.05;
      ears[0].rotation.z = Math.sin(t * 2.1) * 0.1;
      ears[1].rotation.z = -Math.sin(t * 2.1 + 0.5) * 0.1;
      leafL.rotation.z = 0.45 + Math.sin(t * 2.4) * 0.14;
      leafR.rotation.z = -0.45 - Math.sin(t * 2.4 + 0.7) * 0.14;
      if (moving) {
        const s = speed ?? 1;
        legs[0].rotation.x = Math.sin(t * 10) * 0.6 * s;
        legs[1].rotation.x = Math.sin(t * 10 + Math.PI) * 0.6 * s;
        legs[2].rotation.x = Math.sin(t * 10 + Math.PI) * 0.6 * s;
        legs[3].rotation.x = Math.sin(t * 10) * 0.6 * s;
        body.rotation.z = Math.sin(t * 10) * 0.025 * s;
      } else {
        for (const l of legs) l.rotation.x *= 0.85;
        body.rotation.z *= 0.9;
      }
    }
  };
}

function buildAquapup(cfg) {
  const body = new THREE.Group();
  addMesh(body, GEO.sphere, cfg.body, { y: 0.56, sx: 0.46, sy: 0.42, sz: 0.5, outline: true });
  addMesh(body, GEO.sphere, cfg.belly, { y: 0.5, z: 0.25, sx: 0.33, sy: 0.29, sz: 0.27 });
  const head = new THREE.Group();
  head.position.set(0, 0.94, 0.19);
  body.add(head);
  addMesh(head, GEO.sphere, cfg.body, { sx: 0.42, sy: 0.38, sz: 0.37, outline: true });
  addMesh(head, GEO.sphere, cfg.belly, { y: -0.09, z: 0.29, sx: 0.23, sy: 0.15, sz: 0.17 });
  addMesh(head, GEO.sphere, '#22627d', { y: -0.03, z: 0.43, sx: 0.08, sy: 0.055, sz: 0.06 });
  addEyes(head, cfg, 0.07, 0.3, 0.17, 0.1);
  addBlush(head, cfg, -0.06, 0.32, 0.28, 0.07);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.3, 0.12, -0.02);
    ear.rotation.z = s * 0.55;
    head.add(ear);
    addMesh(ear, GEO.sphere, cfg.accent, { y: -0.13, sx: 0.11, sy: 0.26, sz: 0.09, outline: true });
    addMesh(ear, GEO.sphere, cfg.belly, { y: -0.13, z: 0.055, sx: 0.055, sy: 0.16, sz: 0.045 });
    ears.push(ear);
  }
  const fin = new THREE.Group();
  fin.position.set(0, 0.36, 0.02);
  head.add(fin);
  addMesh(fin, GEO.cone, cfg.accent, { y: 0.14, sx: 0.12, sy: 0.34, sz: 0.06, emissive: cfg.glow, emissiveIntensity: 0.16 });
  const drop = addMesh(head, GEO.sphere, '#d8f8ff', { y: 0.2, z: 0.3, sx: 0.075, sy: 0.11, sz: 0.04, emissive: '#9eeaff', emissiveIntensity: 0.35 });
  const tail = new THREE.Group();
  tail.position.set(0, 0.55, -0.42);
  body.add(tail);
  const finTail = addMesh(tail, GEO.cone, cfg.accent, { y: 0.15, sx: 0.24, sy: 0.42, sz: 0.08, rz: 0.4, outline: true });
  addMesh(tail, GEO.sphere, cfg.body, { y: -0.02, sx: 0.14, sy: 0.15, sz: 0.18 });
  const legs = [];
  for (const s of [-1, 1]) {
    for (const f of [-1, 1]) {
      const leg = addMesh(body, GEO.sphere, cfg.body, { x: s * 0.25, y: 0.17, z: f * 0.2, sx: 0.12, sy: 0.15, sz: 0.14, outline: true });
      addMesh(leg, GEO.sphere, cfg.belly, { y: -0.045, z: 0.06, sx: 0.09, sy: 0.05, sz: 0.1 });
      legs.push(leg);
    }
  }
  return {
    body, head, ears, legs, tail, fin, finTail, drop,
    animate(t, moving, speed) {
      body.position.y = Math.sin(t * 2.1) * 0.03;
      head.rotation.z = Math.sin(t * 1.4) * 0.04;
      fin.rotation.z = Math.sin(t * 2.6) * 0.14;
      finTail.rotation.z = 0.4 + Math.sin(t * 3.4) * 0.22;
      tail.rotation.y = Math.sin(t * 4) * 0.2;
      ears[0].rotation.z = 0.55 + Math.sin(t * 2.2) * 0.1;
      ears[1].rotation.z = -0.55 - Math.sin(t * 2.2 + 0.4) * 0.1;
      if (moving) {
        const s = speed ?? 1;
        legs[0].rotation.x = Math.sin(t * 11) * 0.65 * s;
        legs[1].rotation.x = Math.sin(t * 11 + Math.PI) * 0.65 * s;
        legs[2].rotation.x = Math.sin(t * 11 + Math.PI) * 0.65 * s;
        legs[3].rotation.x = Math.sin(t * 11) * 0.65 * s;
      } else for (const l of legs) l.rotation.x *= 0.86;
    }
  };
}

function buildVoltbat(cfg) {
  const body = new THREE.Group();
  addMesh(body, GEO.sphere, cfg.body, { y: 0.9, sx: 0.34, sy: 0.36, sz: 0.33, outline: true });
  addMesh(body, GEO.sphere, cfg.belly, { y: 0.86, z: 0.22, sx: 0.22, sy: 0.24, sz: 0.18 });
  const head = new THREE.Group();
  head.position.set(0, 1.18, 0.03);
  body.add(head);
  addMesh(head, GEO.sphere, cfg.body, { sx: 0.36, sy: 0.32, sz: 0.32, outline: true });
  addMesh(head, GEO.sphere, cfg.belly, { y: -0.08, z: 0.24, sx: 0.18, sy: 0.11, sz: 0.14 });
  addEyes(head, cfg, 0.03, 0.26, 0.15, 0.1, false);
  addBlush(head, cfg, -0.08, 0.28, 0.25, 0.065);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.22, 0.24, -0.03);
    ear.rotation.z = s * 0.35;
    head.add(ear);
    addMesh(ear, GEO.cone, cfg.accent, { y: 0.24, sx: 0.16, sy: 0.54, sz: 0.1, outline: true });
    addMesh(ear, GEO.cone, '#c9a3ff', { y: 0.24, z: 0.045, sx: 0.09, sy: 0.4, sz: 0.04 });
    ears.push(ear);
  }
  const wings = [];
  for (const s of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(s * 0.3, 1.0, -0.1);
    body.add(wing);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(s * 0.55, 0.25, s * 0.85, -0.05);
    shape.quadraticCurveTo(s * 0.55, -0.2, s * 0.38, -0.42);
    shape.quadraticCurveTo(s * 0.18, -0.2, 0, -0.12);
    const geo = new THREE.ShapeGeometry(shape, 8);
    const mat = makeMat(cfg.accent, { side: THREE.DoubleSide, roughness: 0.7, emissive: '#5b3d8c', emissiveIntensity: 0.18 });
    const membrane = new THREE.Mesh(geo, mat);
    membrane.castShadow = true;
    wing.add(membrane);
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.8, 6), makeMat('#6e53a8'));
    bone.rotation.z = s * Math.PI / 2;
    bone.position.x = s * 0.4;
    wing.add(bone);
    wings.push(wing);
  }
  const teeth = [];
  for (const s of [-1, 1]) teeth.push(addMesh(head, GEO.cone, '#fffdf4', { x: s * 0.07, y: -0.14, z: 0.3, sx: 0.03, sy: 0.09, sz: 0.03, rx: Math.PI, castShadow: false }));
  const tail = new THREE.Group();
  tail.position.set(0, 0.62, -0.22);
  body.add(tail);
  addMesh(tail, GEO.cone, cfg.accent, { y: -0.12, sx: 0.08, sy: 0.36, sz: 0.08, rx: Math.PI });
  const spark = makeGlowSprite('rgba(255,225,100,0.85)', 1.1);
  spark.position.set(0, 1.25, 0);
  body.add(spark);
  const legs = [addMesh(body, GEO.sphere, cfg.accent, { x: -0.12, y: 0.62, z: 0.08, sx: 0.06, sy: 0.14, sz: 0.06 }), addMesh(body, GEO.sphere, cfg.accent, { x: 0.12, y: 0.62, z: 0.08, sx: 0.06, sy: 0.14, sz: 0.06 })];
  return {
    body, head, ears, wings, tail, legs, spark,
    hover: true,
    animate(t, moving) {
      body.position.y = Math.sin(t * 2.8) * 0.08 + 0.04;
      head.rotation.z = Math.sin(t * 1.9) * 0.07;
      wings[0].rotation.y = Math.sin(t * 9) * 0.28;
      wings[1].rotation.y = -Math.sin(t * 9) * 0.28;
      wings[0].rotation.z = 0.1 + Math.sin(t * 9 + 0.5) * 0.32;
      wings[1].rotation.z = -0.1 - Math.sin(t * 9 + 0.5) * 0.32;
      ears[0].rotation.z = 0.35 + Math.sin(t * 2.4) * 0.09;
      ears[1].rotation.z = -0.35 - Math.sin(t * 2.4 + 0.5) * 0.09;
      tail.rotation.x = Math.sin(t * 3.2) * 0.3;
      spark.material.opacity = 0.25 + Math.sin(t * 7) * 0.12;
      legs[0].rotation.x = Math.sin(t * 9) * 0.3;
      legs[1].rotation.x = -Math.sin(t * 9) * 0.3;
    }
  };
}

function buildRocklet(cfg) {
  const body = new THREE.Group();
  addMesh(body, GEO.dodeca, cfg.body, { y: 0.58, sx: 0.46, sy: 0.48, sz: 0.42, outline: true, flat: true, roughness: 0.9 });
  addMesh(body, GEO.dodeca, cfg.belly, { y: 0.48, z: 0.25, sx: 0.27, sy: 0.25, sz: 0.18, flat: true, roughness: 0.95 });
  const head = new THREE.Group();
  head.position.set(0, 0.98, 0.06);
  body.add(head);
  addMesh(head, GEO.dodeca, cfg.body, { sx: 0.4, sy: 0.36, sz: 0.36, outline: true, flat: true, roughness: 0.9 });
  addMesh(head, GEO.dodeca, cfg.belly, { y: -0.09, z: 0.25, sx: 0.2, sy: 0.14, sz: 0.14, flat: true });
  addEyes(head, cfg, 0.05, 0.28, 0.16, 0.085, false);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.3, 0.2, -0.02);
    ear.rotation.z = s * 0.25;
    head.add(ear);
    addMesh(ear, GEO.dodeca, cfg.accent, { y: 0.14, sx: 0.13, sy: 0.18, sz: 0.11, flat: true, outline: true });
    ears.push(ear);
  }
  const crystals = [];
  for (let i = 0; i < 4; i++) {
    const c = addMesh(body, GEO.cone, i % 2 ? '#8fe7e0' : '#ffd98a', {
      x: (i - 1.5) * 0.2, y: 0.92 - Math.abs(i - 1.5) * 0.06, z: -0.22,
      sx: 0.09, sy: 0.3 + (i % 3) * 0.08, sz: 0.09, rz: (i - 1.5) * 0.18,
      emissive: i % 2 ? '#47c9c0' : '#ffc25c', emissiveIntensity: 0.45, flat: true
    });
    crystals.push(c);
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.48, 0.62, 0.02);
    body.add(arm);
    addMesh(arm, GEO.dodeca, cfg.body, { x: s * 0.12, y: -0.12, sx: 0.13, sy: 0.26, sz: 0.13, rz: s * 0.3, flat: true, outline: true });
    addMesh(arm, GEO.dodeca, cfg.accent, { x: s * 0.17, y: -0.3, sx: 0.14, sy: 0.14, sz: 0.14, flat: true });
    arms.push(arm);
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = addMesh(body, GEO.dodeca, cfg.accent, { x: s * 0.22, y: 0.16, z: 0.02, sx: 0.16, sy: 0.17, sz: 0.17, flat: true, outline: true });
    legs.push(leg);
  }
  return {
    body, head, ears, arms, legs, crystals,
    animate(t, moving) {
      body.position.y = Math.sin(t * 1.6) * 0.02;
      head.rotation.y = Math.sin(t * 0.8) * 0.06;
      ears[0].rotation.z = 0.25 + Math.sin(t * 1.5) * 0.04;
      ears[1].rotation.z = -0.25 - Math.sin(t * 1.5 + 0.4) * 0.04;
      crystals.forEach((c, i) => { c.material.emissiveIntensity = 0.35 + Math.sin(t * 2 + i) * 0.15; });
      if (moving) { arms[0].rotation.x = Math.sin(t * 8) * 0.4; arms[1].rotation.x = -Math.sin(t * 8) * 0.4; }
      else { arms[0].rotation.x *= 0.9; arms[1].rotation.x *= 0.9; }
    }
  };
}

function buildWispling(cfg) {
  const body = new THREE.Group();
  addMesh(body, GEO.sphere, cfg.body, { y: 0.72, sx: 0.38, sy: 0.42, sz: 0.36, outline: true, emissive: '#d9a9ff', emissiveIntensity: 0.12 });
  addMesh(body, GEO.sphere, cfg.belly, { y: 0.68, z: 0.22, sx: 0.24, sy: 0.27, sz: 0.2 });
  const head = new THREE.Group();
  head.position.set(0, 1.06, 0.02);
  body.add(head);
  addMesh(head, GEO.sphere, cfg.body, { sx: 0.4, sy: 0.37, sz: 0.36, outline: true });
  addMesh(head, GEO.sphere, cfg.belly, { y: -0.08, z: 0.26, sx: 0.19, sy: 0.12, sz: 0.15 });
  addEyes(head, cfg, 0.05, 0.29, 0.16, 0.095);
  addBlush(head, cfg, -0.07, 0.31, 0.26, 0.065);
  const star = addMesh(head, GEO.cone, '#ffe9a3', { y: 0.3, z: 0.16, sx: 0.07, sy: 0.18, sz: 0.07, emissive: '#ffd166', emissiveIntensity: 1.1 });
  const halo = new THREE.Group();
  halo.position.set(0, 0.52, 0);
  head.add(halo);
  const haloMesh = addMesh(halo, GEO.torus, '#ffe08a', { sx: 0.26, sy: 0.26, sz: 0.26, rx: Math.PI / 2, emissive: '#ffc94d', emissiveIntensity: 0.8, roughness: 0.3 });
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = addMesh(head, GEO.cone, cfg.accent, { x: s * 0.22, y: 0.28, sx: 0.08, sy: 0.2, sz: 0.08, rz: s * 0.5, emissive: '#b46aff', emissiveIntensity: 0.3 });
    ears.push(ear);
  }
  const hands = [];
  for (const s of [-1, 1]) {
    const h = new THREE.Group();
    h.position.set(s * 0.42, 0.72, 0.1);
    body.add(h);
    addMesh(h, GEO.sphere, cfg.body, { sx: 0.11, sy: 0.13, sz: 0.11, outline: true });
    addMesh(h, GEO.sphere, cfg.glow, { z: 0.08, sx: 0.05, sy: 0.05, sz: 0.03, emissive: cfg.glow, emissiveIntensity: 0.9 });
    hands.push(h);
  }
  const wisp = new THREE.Group();
  wisp.position.set(0, 0.42, -0.18);
  body.add(wisp);
  addMesh(wisp, GEO.cone, cfg.accent, { y: -0.2, sx: 0.16, sy: 0.48, sz: 0.16, rx: Math.PI, emissive: '#b46aff', emissiveIntensity: 0.35 });
  const glow = makeGlowSprite('rgba(220,170,255,0.8)', 1.6);
  glow.position.set(0, 0.8, 0);
  body.add(glow);
  return {
    body, head, ears, hands, wisp, halo, star, glow,
    hover: true,
    animate(t, moving) {
      body.position.y = 0.12 + Math.sin(t * 1.9) * 0.1;
      head.rotation.z = Math.sin(t * 1.3) * 0.06;
      halo.rotation.z = t * 0.9;
      halo.position.y = 0.52 + Math.sin(t * 2.2) * 0.04;
      star.rotation.y = t * 1.4;
      star.material.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.3;
      glow.material.opacity = 0.2 + Math.sin(t * 2.4) * 0.08;
      hands[0].position.y = 0.72 + Math.sin(t * 2.4) * 0.06;
      hands[1].position.y = 0.72 + Math.sin(t * 2.4 + 1) * 0.06;
      wisp.rotation.z = Math.sin(t * 2) * 0.12;
      ears[0].rotation.z = 0.5 + Math.sin(t * 2.1) * 0.08;
      ears[1].rotation.z = -0.5 - Math.sin(t * 2.1 + 0.5) * 0.08;
    }
  };
}

const BUILDERS = {
  emberfox: buildEmberfox,
  leafcub: buildLeafcub,
  aquapup: buildAquapup,
  voltbat: buildVoltbat,
  rocklet: buildRocklet,
  wispling: buildWispling
};

export function createCreature(speciesId, { scale = 1, battle = false } = {}) {
  const species = SPECIES[speciesId];
  if (!species) throw new Error(`Unknown species ${speciesId}`);
  const cfg = { ...species.colors };
  const root = new THREE.Group();
  const visual = new THREE.Group();
  root.add(visual);
  const parts = (BUILDERS[speciesId] || buildEmberfox)(cfg);
  visual.add(parts.body);
  const baseScale = (battle ? 1.62 : 0.95) * (species.scale ?? 1) * scale;
  visual.scale.setScalar(baseScale);
  const materials = [];
  root.traverse(o => { if (o.isMesh && o.material && o.material !== OUTLINE_MAT && !materials.includes(o.material)) materials.push(o.material); });
  const state = {
    root, visual, parts, species, scale: baseScale,
    hit: 0, hitColor: new THREE.Color('#ffffff'),
    spawnT: 0.001, burst: 0, animSpeed: 1, scaleLocked: false,
    materials,
    setHighlight(on) { root.traverse(o => { if (o.isMesh && o.material && o.material.emissive) o.material.emissiveIntensity = on ? 0.3 : (o.material.userData.baseIntensity ?? 0); }); },
    flash(color = '#ffffff', amount = 1) { state.hit = amount; state.hitColor.set(color); },
    animate(time, moving = false, speed = 1) {
      const t = time * state.animSpeed + state.spawnT;
      parts.animate?.(t, moving, speed);
      if (!state.scaleLocked) {
        if (state.spawnT < 3) {
          const p = Math.min(1, state.spawnT / 0.7);
          visual.scale.setScalar(baseScale * (0.4 + 0.6 * easeOutElastic(p)));
          state.spawnT += 0.03;
        } else visual.scale.setScalar(baseScale);
      }
      if (state.hit > 0) {
        state.hit = Math.max(0, state.hit - 0.045);
      }
      for (const m of materials) {
        if (!m.emissive) continue;
        m.emissive.copy(m.userData.baseEmissive).lerp(state.hitColor, state.hit);
        m.emissiveIntensity = (m.userData.baseIntensity ?? 0) + state.hit * 2.2;
      }
      if (parts.flameLight) parts.flameLight.intensity = 1.8 + Math.sin(t * 13) * 0.5;
      if (parts.glow && parts.glow.material) parts.glow.material.opacity = 0.65 + Math.sin(t * 8) * 0.15;
    }
  };
  root.userData.creature = state;
  return state;
}

export function disposeCreature(creature) {
  creature.root.traverse(o => {
    if (o.isMesh && o.material && o.material !== OUTLINE_MAT) o.material.dispose?.();
    if (o.isSprite && o.material) { o.material.map?.dispose(); o.material.dispose(); }
  });
  creature.root.removeFromParent();
}

export function createThumbnails(speciesIds, size = 168) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#dff9ff', '#6c7f52', 2.0));
  const dir = new THREE.DirectionalLight('#fff3d6', 2.4);
  dir.position.set(3, 5, 4);
  scene.add(dir);
  const rim = new THREE.DirectionalLight('#a6e7ff', 1.3);
  rim.position.set(-3, 2, -3);
  scene.add(rim);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 1.55, 4.7);
  camera.lookAt(0, 0.95, 0);
  const out = {};
  for (const id of speciesIds) {
    const creature = createCreature(id, { battle: true, scale: 0.93 });
    creature.visual.rotation.y = 0.42;
    creature.visual.position.y = -0.1;
    creature.spawnT = 3;
    creature.visual.scale.setScalar(creature.scale);
    creature.animate(0.6, false, 1);
    scene.add(creature.root);
    renderer.render(scene, camera);
    out[id] = canvas.toDataURL('image/png');
    disposeCreature(creature);
  }
  renderer.dispose();
  renderer.forceContextLoss?.();
  return out;
}
