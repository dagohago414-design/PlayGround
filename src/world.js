import * as THREE from 'three';
import { clamp, fbm, smoothstep, rand, randInt, lerp, makeCanvas } from './utils.js';
import { SPAWNS } from './data.js';

const LAKE = { x: -24, z: 15, r: 13.2 };
const WATER_Y = -0.72;
const PATH_X = z => 3.1 * Math.sin(z * 0.085) + 0.8 * Math.sin(z * 0.26 + 0.5);
const WORLD_LIMIT = 88;

export function pathDistance(x, z) {
  const px = PATH_X(z);
  const d = Math.abs(x - px);
  const plaza = Math.hypot(x - 0.5, z - 5.5);
  return Math.min(d, Math.max(0, plaza - 2.5));
}

export function heightAt(x, z) {
  let h = 1.5 * Math.sin(x * 0.055) * Math.cos(z * 0.047);
  h += 0.8 * Math.sin(x * 0.113 + 1.3) * Math.sin(z * 0.083 + 0.7);
  h += 0.38 * Math.cos(x * 0.031 + z * 0.041);
  const center = Math.hypot(x, z);
  h *= lerp(0.32, 1, smoothstep(11, 24, center));
  h += smoothstep(52, 92, center) * (2.2 + fbm(x * 0.045, z * 0.045) * 5.5);
  const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
  h -= (1 - smoothstep(LAKE.r - 2.5, LAKE.r + 9, dl)) * 3.1;
  const pd = pathDistance(x, z);
  h -= (1 - smoothstep(1.6, 3.4, pd)) * 0.12;
  return h;
}

export function isWater(x, z) {
  return Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r - 1.4 && heightAt(x, z) < WATER_Y;
}

function terrainDetailTexture() {
  const [c, ctx] = makeCanvas(256, 256);
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const x = (i / 4) % 256, y = Math.floor((i / 4) / 256);
    const n = fbm(x * 0.08, y * 0.08) * 0.55 + fbm(x * 0.31 + 7, y * 0.31) * 0.45;
    const v = 208 + n * 47;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v * 0.96;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#567d4a' : '#e8e2b8';
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 2.2 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(34, 34);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeSky(scene, sunDir) {
  const uniforms = {
    top: { value: new THREE.Color('#459fe8') },
    mid: { value: new THREE.Color('#9ed9ee') },
    low: { value: new THREE.Color('#f5ecd2') },
    sunDir: { value: sunDir.clone() },
    sunColor: { value: new THREE.Color('#ffe6ac') }
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(280, 40, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms,
      vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform vec3 top; uniform vec3 mid; uniform vec3 low; uniform vec3 sunDir; uniform vec3 sunColor;
        varying vec3 vPos;
        void main(){
          vec3 d = normalize(vPos);
          float h = clamp(d.y, 0.0, 1.0);
          vec3 col = mix(low, mid, smoothstep(0.0, 0.18, h));
          col = mix(col, top, smoothstep(0.12, 0.72, h));
          float sd = max(dot(d, normalize(sunDir)), 0.0);
          col += sunColor * pow(sd, 220.0) * 1.15;
          col += sunColor * pow(sd, 9.0) * 0.16;
          col += vec3(0.04, 0.07, 0.05) * smoothstep(0.12, -0.2, d.y);
          gl_FragColor = vec4(col, 1.0);
        }`
    })
  );
  sky.frustumCulled = false;
  scene.add(sky);

  const [c, ctx] = makeCanvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,246,209,0.95)');
  g.addColorStop(0.22, 'rgba(255,226,152,0.65)');
  g.addColorStop(0.55, 'rgba(255,211,110,0.16)');
  g.addColorStop(1, 'rgba(255,211,110,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sun.scale.setScalar(58);
  sun.position.copy(sunDir).normalize().multiplyScalar(220);
  scene.add(sun);
  return sky;
}

function makeClouds(scene) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xfffdf6, roughness: 1, metalness: 0, transparent: true, opacity: 0.86, emissive: 0xddeeea, emissiveIntensity: 0.12 });
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const group = new THREE.Group();
    const angle = (i / 9) * Math.PI * 2 + rand(-0.2, 0.2);
    const dist = rand(72, 140);
    group.position.set(Math.cos(angle) * dist, rand(26, 44), Math.sin(angle) * dist);
    const lobes = randInt(3, 6);
    for (let j = 0; j < lobes; j++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat);
      mesh.position.set(rand(-7, 7), rand(-2, 2), rand(-4, 4));
      mesh.scale.set(rand(4, 8), rand(2.2, 3.6), rand(3.4, 5.4));
      group.add(mesh);
    }
    group.userData.speed = rand(0.18, 0.4);
    group.userData.phase = rand(0, 10);
    scene.add(group);
    clouds.push(group);
  }
  return clouds;
}

function makeWater(scene) {
  const uniforms = { uTime: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    vertexShader: `
      uniform float uTime; varying vec2 vUv; varying vec3 vWorld; varying float vWave;
      void main(){
        vUv = uv;
        vec3 p = position;
        float w = sin(p.x * 0.75 + uTime * 1.4) * 0.05 + cos(p.y * 0.9 + uTime * 1.1) * 0.04;
        p.z += w;
        vWave = w;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv; varying vec3 vWorld; varying float vWave;
      void main(){
        vec2 uv = vUv - 0.5;
        float r = length(uv) * 2.0;
        vec3 deep = vec3(0.075, 0.34, 0.42);
        vec3 shallow = vec3(0.35, 0.78, 0.78);
        vec3 col = mix(shallow, deep, smoothstep(0.1, 0.95, r));
        float caustic = sin(vWorld.x * 1.7 + uTime * 0.8) * sin(vWorld.z * 1.9 - uTime * 0.6);
        col += vec3(0.08, 0.16, 0.12) * smoothstep(0.5, 1.0, caustic) * (0.7 - r * 0.4);
        float shore = smoothstep(0.8, 1.0, r);
        col = mix(col, vec3(0.86, 0.95, 0.83), shore * 0.55);
        col += vWave * 1.4;
        float alpha = mix(0.9, 0.68, smoothstep(0.55, 1.0, r));
        gl_FragColor = vec4(col, alpha);
      }`
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r + 1.5, 64), mat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(LAKE.x, WATER_Y, LAKE.z);
  water.renderOrder = 2;
  scene.add(water);

  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x5f9f5c, roughness: 0.8 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffd7e4, roughness: 0.6, emissive: 0xff9fc1, emissiveIntensity: 0.08 });
  const pads = [];
  for (let i = 0; i < 11; i++) {
    const a = rand(0, Math.PI * 2), d = rand(2.5, LAKE.r - 2.2);
    const pad = new THREE.Group();
    pad.position.set(LAKE.x + Math.cos(a) * d, WATER_Y + 0.06, LAKE.z + Math.sin(a) * d);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(rand(0.5, 0.95), 0.52, 0.05, 12), lilyMat);
    disc.receiveShadow = true;
    pad.add(disc);
    if (Math.random() > 0.45) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), flowerMat);
      flower.position.y = 0.11;
      pad.add(flower);
    }
    pad.userData.phase = rand(0, 6);
    scene.add(pad);
    pads.push(pad);
  }

  const rippleMat = new THREE.MeshBasicMaterial({ color: 0xd8fff4, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
  const ripples = [];
  for (let i = 0; i < 5; i++) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.52, 32), rippleMat.clone());
    const a = rand(0, Math.PI * 2), d = rand(1, LAKE.r - 3);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(LAKE.x + Math.cos(a) * d, WATER_Y + 0.03, LAKE.z + Math.sin(a) * d);
    mesh.userData.phase = rand(0, 4);
    scene.add(mesh);
    ripples.push(mesh);
  }
  return {
    update(t) {
      uniforms.uTime.value = t;
      pads.forEach((p, i) => { p.position.y = WATER_Y + 0.06 + Math.sin(t * 1.1 + p.userData.phase) * 0.025; p.rotation.z = Math.sin(t * 0.4 + i) * 0.05; });
      ripples.forEach((r, i) => {
        const p = (t * 0.22 + r.userData.phase) % 1;
        r.scale.setScalar(0.4 + p * 3.4);
        r.material.opacity = (1 - p) * 0.3;
      });
    }
  };
}

function terrainBumpTexture() {
  const [c, ctx] = makeCanvas(256, 256);
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const x = (i / 4) % 256, y = Math.floor((i / 4) / 256);
    const n = fbm(x * 0.18 + 4, y * 0.18 + 2) * 0.7 + fbm(x * 0.52, y * 0.52) * 0.3;
    const v = 88 + n * 167;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(34, 34);
  return tex;
}

function makeTerrain(scene) {
  const geo = new THREE.PlaneGeometry(200, 200, 128, 128);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();
  const grass = new THREE.Color('#4f9f51');
  const grassLight = new THREE.Color('#7fc25f');
  const grassDark = new THREE.Color('#2f6e44');
  const sand = new THREE.Color('#cbb67d');
  const rock = new THREE.Color('#8a8d7e');
  const snow = new THREE.Color('#eef4e8');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const n = fbm(x * 0.14 + 13, z * 0.14 + 9);
    color.copy(grass).lerp(grassLight, n * 0.85).lerp(grassDark, Math.max(0, 0.55 - n) * 0.7);
    const pd = pathDistance(x, z);
    if (pd < 2.95) {
      const edge = 1 - smoothstep(1.45, 2.95, pd);
      color.lerp(sand, edge * 0.92);
    }
    const lakeD = Math.hypot(x - LAKE.x, z - LAKE.z);
    if (lakeD < LAKE.r + 5 && lakeD > LAKE.r - 2) {
      const shore = 1 - smoothstep(LAKE.r - 2, LAKE.r + 5, lakeD);
      color.lerp(sand, shore * 0.7);
    }
    if (y > 5.2) color.lerp(rock, smoothstep(5.2, 8.5, y));
    if (y > 9.5) color.lerp(snow, smoothstep(9.5, 13, y));
    const shade = 0.86 + fbm(x * 0.5, z * 0.5) * 0.24;
    colors[i * 3] = color.r * shade;
    colors[i * 3 + 1] = color.g * shade;
    colors[i * 3 + 2] = color.b * shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, map: terrainDetailTexture(), bumpMap: terrainBumpTexture(), bumpScale: 0.28 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  scene.add(mesh);

  const seabed = new THREE.Mesh(
    new THREE.CircleGeometry(LAKE.r + 3, 48),
    new THREE.MeshStandardMaterial({ color: 0x3b6b5e, roughness: 1 })
  );
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.set(LAKE.x, WATER_Y - 1.1, LAKE.z);
  scene.add(seabed);
  return mesh;
}

function grassTexture() {
  const [c, ctx] = makeCanvas(128, 128);
  ctx.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 22; i++) {
    const baseX = 64 + rand(-14, 14);
    const spread = rand(-52, 52);
    const h = rand(48, 118);
    const w = rand(2.2, 4.8);
    const tipX = baseX + spread;
    const g = ctx.createLinearGradient(0, 128, 0, 128 - h);
    const l = rand(0.46, 0.68);
    g.addColorStop(0, `hsl(${rand(98, 118)} ${rand(34, 46)}% ${l * 0.74}%)`);
    g.addColorStop(0.6, `hsl(${rand(96, 116)} ${rand(38, 52)}% ${l * 100}%)`);
    g.addColorStop(1, `hsl(${rand(78, 100)} ${rand(44, 60)}% ${Math.min(80, l * 100 + 15)}%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(baseX - w, 128);
    ctx.quadraticCurveTo(baseX + spread * 0.32 - w * 0.7, 128 - h * 0.52, tipX, 128 - h);
    ctx.quadraticCurveTo(baseX + spread * 0.32 + w * 0.7, 128 - h * 0.52, baseX + w, 128);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function grassCrossGeometry(w = 0.78, h = 0.62) {
  const positions = [], uvs = [], normals = [], indices = [];
  for (const a of [0, Math.PI / 2]) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const base = positions.length / 3;
    const verts = [
      [-w / 2, 0, 0, 0, 0], [w / 2, 0, 0, 1, 0], [w / 2, h, 0, 1, 1], [-w / 2, h, 0, 0, 1]
    ];
    for (const [x, y, z, u, v] of verts) {
      positions.push(x * ca - z * sa, y, x * sa + z * ca);
      uvs.push(u, v);
      const nx = Math.sin(a), nz = Math.cos(a);
      normals.push(nx, 0.35, nz);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

const GRASS_MAT = new THREE.MeshStandardMaterial({
  map: null, color: 0xffffff, roughness: 0.92, side: THREE.DoubleSide, alphaTest: 0.28
});
GRASS_MAT.map = grassTexture();
const grassTip = { value: 0 };
GRASS_MAT.onBeforeCompile = shader => {
  shader.uniforms.uTime = grassTip;
  shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     float swayPhase = instanceMatrix[3].x * 0.55 + instanceMatrix[3].z * 0.42;
     float sway = sin(uTime * 1.8 + swayPhase) * 0.09 + sin(uTime * 3.2 + swayPhase * 1.6) * 0.035;
     float lift = pow(clamp(transformed.y / 0.55, 0.0, 1.0), 1.7);
     transformed.x += sway * lift;
     transformed.z += sway * 0.45 * lift;`
  );
};
const GRASS_GEO = grassCrossGeometry(0.74, 0.52);
const TALL_GEO = grassCrossGeometry(0.9, 0.76);

function makeGrass(scene, count) {
  const mesh = new THREE.InstancedMesh(GRASS_GEO, GRASS_MAT, count);
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < count && guard < count * 12) {
    guard++;
    const x = rand(-72, 72), z = rand(-72, 72);
    if (Math.hypot(x, z) > 76) continue;
    if (pathDistance(x, z) < 2.1) continue;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 1.2) continue;
    if (isWater(x, z)) continue;
    const y = heightAt(x, z);
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rand(0, Math.PI * 2), 0);
    const sc = rand(0.42, 0.98);
    dummy.scale.set(sc * rand(0.8, 1.2), sc, sc);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    c.setHSL(0.27 + rand(-0.03, 0.05), rand(0.16, 0.36), rand(0.68, 0.9));
    mesh.setColorAt(placed, c);
    placed++;
  }
  mesh.count = placed;
  scene.add(mesh);
  return { mesh, update(t) { grassTip.value = t; } };
}

function makeTallGrass(scene, anchors) {
  const perAnchor = 72;
  const count = anchors.length * perAnchor;
  const mesh = new THREE.InstancedMesh(TALL_GEO, GRASS_MAT, count);
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  let placed = 0;
  for (const anchor of anchors) {
    for (let i = 0; i < perAnchor; i++) {
      const a = rand(0, Math.PI * 2), d = rand(1.4, 5.2);
      const x = anchor.x + Math.cos(a) * d, z = anchor.z + Math.sin(a) * d;
      if (pathDistance(x, z) < 1.4 || isWater(x, z)) continue;
      const y = heightAt(x, z);
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, rand(0, Math.PI * 2), 0);
      const sc = rand(0.6, 1.06);
      dummy.scale.set(sc * rand(0.8, 1.2), sc, sc);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      c.setHSL(0.28 + rand(-0.035, 0.04), rand(0.2, 0.42), rand(0.62, 0.82));
      mesh.setColorAt(placed, c);
      placed++;
    }
  }
  mesh.count = placed;
  scene.add(mesh);
  return { mesh, update() {} };
}

function makeFlowers(scene) {
  const count = 260;
  const headGeo = new THREE.SphereGeometry(0.072, 6, 5);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, emissive: 0xffffff, emissiveIntensity: 0.08 });
  const heads = new THREE.InstancedMesh(headGeo, headMat, count);
  const stemGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.23, 5);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d8a4c, roughness: 0.9 });
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, count);
  const dummy = new THREE.Object3D();
  const palette = ['#ffe9a8', '#ffc9dd', '#b9d4ff', '#ffd76e', '#d9b8ff', '#fff6df'];
  const color = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < count && guard < count * 10) {
    guard++;
    const x = rand(-50, 50), z = rand(-50, 50);
    if (pathDistance(x, z) < 2.2) continue;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 1) continue;
    const y = heightAt(x, z);
    if (y > 4.5) continue;
    dummy.position.set(x, y + 0.115, z);
    const s = rand(0.7, 1.3);
    dummy.scale.setScalar(s);
    dummy.rotation.set(0, rand(0, Math.PI * 2), rand(-0.15, 0.15));
    dummy.updateMatrix();
    stems.setMatrixAt(placed, dummy.matrix);
    dummy.position.y = y + 0.23;
    dummy.updateMatrix();
    heads.setMatrixAt(placed, dummy.matrix);
    color.set(palette[Math.floor(Math.random() * palette.length)]);
    heads.setColorAt(placed, color);
    placed++;
  }
  heads.count = stems.count = placed;
  heads.castShadow = false;
  stems.castShadow = false;
  scene.add(heads, stems);
  return { heads, stems };
}

function makeBushes(scene) {
  const count = 64;
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < count && guard < count * 16) {
    guard++;
    const a = rand(0, Math.PI * 2), d = rand(10, 62);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (pathDistance(x, z) < 4.5) continue;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 2) continue;
    const y = heightAt(x, z);
    const s = rand(0.35, 0.95);
    dummy.position.set(x, y + s * 0.4, z);
    dummy.rotation.set(rand(0, 3), rand(0, 6), rand(0, 3));
    dummy.scale.set(s * rand(1.1, 1.5), s * rand(0.6, 0.9), s * rand(1.1, 1.5));
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    c.setHSL(0.29 + rand(-0.03, 0.03), rand(0.4, 0.55), rand(0.22, 0.34));
    mesh.setColorAt(placed, c);
    placed++;
  }
  mesh.count = placed;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function makeTrees(scene) {
  const pineCount = 26, leafCount = 22;
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 1, 7);
  trunkGeo.translate(0, 0.5, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5a3f, roughness: 0.95 });
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, pineCount + leafCount);
  const coneGeo = new THREE.ConeGeometry(1, 1, 8);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86, flatShading: true });
  const coneMesh = new THREE.InstancedMesh(coneGeo, leafMat, pineCount * 4 + leafCount * 3);
  const icoGeo = new THREE.IcosahedronGeometry(1, 0);
  const icoMesh = new THREE.InstancedMesh(icoGeo, leafMat, leafCount * 2);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let ti = 0, ci = 0, ii = 0;
  const placed = [];
  const tryPlace = (minR, maxR) => {
    for (let attempt = 0; attempt < 60; attempt++) {
      const a = rand(0, Math.PI * 2), d = rand(minR, maxR);
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.hypot(x, z) < 16) continue;
      if (pathDistance(x, z) < 4.2) continue;
      if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 3.5) continue;
      if (placed.some(p => Math.hypot(p.x - x, p.z - z) < 5)) continue;
      placed.push({ x, z });
      return { x, z };
    }
    return null;
  };
  // pines
  for (let i = 0; i < pineCount; i++) {
    const spot = tryPlace(18, 62);
    if (!spot) break;
    const y = heightAt(spot.x, spot.z);
    const h = rand(3.6, 6.4);
    const w = rand(1.4, 2.2);
    dummy.position.set(spot.x, y, spot.z);
    dummy.rotation.set(0, rand(0, 6.3), 0);
    dummy.scale.set(rand(0.8, 1.1), h, rand(0.8, 1.1));
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(ti++, dummy.matrix);
    for (let j = 0; j < 4; j++) {
      const f = 1 - j * 0.2;
      dummy.position.set(spot.x, y + h * (0.5 + j * 0.16), spot.z);
      dummy.scale.set(w * f, h * 0.42, w * f);
      dummy.rotation.set(0, rand(0, 6.3), 0);
      dummy.updateMatrix();
      coneMesh.setMatrixAt(ci, dummy.matrix);
      color.setHSL(0.32 + rand(-0.02, 0.02), 0.36, 0.26 + j * 0.035);
      coneMesh.setColorAt(ci, color);
      ci++;
    }
  }
  // leafy trees
  for (let i = 0; i < leafCount; i++) {
    const spot = tryPlace(16, 58);
    if (!spot) break;
    const y = heightAt(spot.x, spot.z);
    const h = rand(3, 5);
    dummy.position.set(spot.x, y, spot.z);
    dummy.rotation.set(0, rand(0, 6.3), 0);
    dummy.scale.set(rand(0.9, 1.2), h, rand(0.9, 1.2));
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(ti++, dummy.matrix);
    for (let j = 0; j < 2; j++) {
      dummy.position.set(spot.x + rand(-0.5, 0.5), y + h + rand(-0.3, 0.6), spot.z + rand(-0.5, 0.5));
      dummy.scale.setScalar(rand(1.5, 2.4) * (1 - j * 0.18));
      dummy.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      dummy.updateMatrix();
      icoMesh.setMatrixAt(ii, dummy.matrix);
      color.setHSL(0.28 + rand(-0.035, 0.035), 0.42, 0.34 + rand(-0.04, 0.05));
      icoMesh.setColorAt(ii, color);
      ii++;
    }
  }
  trunkMesh.count = ti;
  coneMesh.count = ci;
  icoMesh.count = ii;
  trunkMesh.castShadow = true;
  coneMesh.castShadow = true;
  icoMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  scene.add(trunkMesh, coneMesh, icoMesh);
}

function makeRocks(scene) {
  const count = 34;
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < count && guard < count * 15) {
    guard++;
    const a = rand(0, Math.PI * 2), d = rand(8, 66);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (pathDistance(x, z) < 3.4) continue;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 1) continue;
    const y = heightAt(x, z);
    const s = rand(0.22, 1.0) * (Math.hypot(x, z) > 35 ? 1.7 : 1);
    dummy.position.set(x, y + s * 0.25, z);
    dummy.rotation.set(rand(0, 3), rand(0, 6), rand(0, 3));
    dummy.scale.set(s * rand(0.8, 1.3), s * rand(0.6, 1), s * rand(0.8, 1.3));
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    color.setHSL(0.12, 0.08, rand(0.42, 0.6));
    mesh.setColorAt(placed, color);
    placed++;
  }
  mesh.count = placed;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function makeMountains(scene) {
  const group = new THREE.Group();
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x5f817e, roughness: 1, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x6c8f88, roughness: 1, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x54756f, roughness: 1, flatShading: true })
  ];
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xeef3e8, roughness: 0.9, flatShading: true });
  const ridge = new THREE.Mesh(
    new THREE.ConeGeometry(110, 22, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x8fb3ab, side: THREE.BackSide, transparent: true, opacity: 0.22, depthWrite: false })
  );
  ridge.position.y = -2;
  group.add(ridge);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + rand(-0.1, 0.1);
    const d = rand(108, 155);
    const h = rand(13, 29);
    const w = rand(12, 23);
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(w, h, randInt(5, 7), 1), mats[i % 3]);
    mountain.position.set(Math.cos(a) * d, h / 2 - 6, Math.sin(a) * d);
    mountain.rotation.y = rand(0, 6);
    group.add(mountain);
    if (h > 21) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.23, h * 0.2, randInt(5, 7), 1), snowMat);
      cap.position.set(mountain.position.x, h - h * 0.1 - 6 + 0.2, mountain.position.z);
      cap.rotation.y = mountain.rotation.y;
      group.add(cap);
    }
  }
  scene.add(group);
  return group;
}

function makeFireflies(scene) {
  const count = 90;
  const positions = new Float32Array(count * 3);
  const seeds = [];
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2), d = rand(5, 52);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    positions[i * 3] = x;
    positions[i * 3 + 1] = heightAt(x, z) + rand(0.8, 3.4);
    positions[i * 3 + 2] = z;
    seeds.push({ x, z, y: positions[i * 3 + 1], phase: rand(0, 10), amp: rand(0.3, 1.1), speed: rand(0.4, 1.1) });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const [c, ctx] = makeCanvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,225,1)');
  g.addColorStop(0.28, 'rgba(255,240,160,0.9)');
  g.addColorStop(1, 'rgba(255,220,100,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.PointsMaterial({ size: 0.3, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: 0.9 });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  return {
    points,
    update(t) {
      for (let i = 0; i < count; i++) {
        const s = seeds[i];
        positions[i * 3] = s.x + Math.sin(t * s.speed + s.phase) * s.amp;
        positions[i * 3 + 1] = s.y + Math.sin(t * s.speed * 0.7 + s.phase * 2) * 0.45;
        positions[i * 3 + 2] = s.z + Math.cos(t * s.speed * 0.8 + s.phase) * s.amp;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = 0.55 + Math.sin(t * 0.7) * 0.2;
    }
  };
}

function makeButterflies(scene) {
  const group = new THREE.Group();
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xffe7a1, side: THREE.DoubleSide, roughness: 0.6, emissive: 0xffc95c, emissiveIntensity: 0.15 });
  const wingMat2 = new THREE.MeshStandardMaterial({ color: 0xb9e9ff, side: THREE.DoubleSide, roughness: 0.6, emissive: 0x7fd2ff, emissiveIntensity: 0.15 });
  const butterflies = [];
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Group();
    const wingGeo = new THREE.CircleGeometry(0.16, 8);
    const wl = new THREE.Mesh(wingGeo, i % 2 ? wingMat : wingMat2);
    const wr = new THREE.Mesh(wingGeo, i % 2 ? wingMat2 : wingMat);
    wl.position.x = -0.14;
    wr.position.x = 0.14;
    wl.rotation.y = 0.4;
    wr.rotation.y = -0.4;
    b.add(wl, wr);
    const a = rand(0, Math.PI * 2), d = rand(9, 30);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    b.position.set(x, heightAt(x, z) + rand(0.7, 2.2), z);
    b.userData = { x, z, phase: rand(0, 10), speed: rand(0.4, 1.1), wl, wr };
    group.add(b);
    butterflies.push(b);
  }
  scene.add(group);
  return {
    update(t) {
      for (const b of butterflies) {
        const d = b.userData;
        b.position.x = d.x + Math.sin(t * d.speed + d.phase) * 2.4;
        b.position.z = d.z + Math.cos(t * d.speed * 0.8 + d.phase) * 2.4;
        b.position.y = heightAt(b.position.x, b.position.z) + 0.8 + Math.sin(t * 1.6 + d.phase) * 0.35;
        b.rotation.y = Math.atan2(Math.cos(t * d.speed + d.phase) * 2.4 * d.speed, Math.sin(t * d.speed + d.phase) * -2.4 * d.speed);
        const flap = Math.sin(t * 18 + d.phase) * 0.9;
        d.wl.rotation.y = 0.4 + flap;
        d.wr.rotation.y = -0.4 - flap;
      }
    }
  };
}

function makeShrine(scene) {
  const group = new THREE.Group();
  const x = PATH_X(-21) + 1.1, z = -21;
  group.position.set(x, heightAt(x, z), z);
  const stone = new THREE.MeshStandardMaterial({ color: 0x9b9482, roughness: 0.95, flatShading: true });
  const moss = new THREE.MeshStandardMaterial({ color: 0x6e9a58, roughness: 0.9, flatShading: true });
  const crystal = new THREE.MeshStandardMaterial({ color: 0x9df6e3, roughness: 0.25, metalness: 0.1, emissive: 0x45d9c0, emissiveIntensity: 0.85, flatShading: true });
  const crystalWarm = new THREE.MeshStandardMaterial({ color: 0xffe0a0, roughness: 0.3, emissive: 0xffb347, emissiveIntensity: 0.8, flatShading: true });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.7, 0.55, 18), stone);
  base.position.y = 0.1;
  base.receiveShadow = true;
  group.add(base);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.58, 18), moss);
  inner.position.y = 0.15;
  inner.receiveShadow = true;
  group.add(inner);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const h = rand(0.9, 2.1);
    const pillar = new THREE.Mesh(new THREE.ConeGeometry(rand(0.22, 0.38), h, 5), i % 3 === 0 ? crystalWarm : stone);
    pillar.position.set(Math.cos(a) * 3.5, h / 2 + 0.3, Math.sin(a) * 3.5);
    pillar.rotation.set(rand(-0.12, 0.12), rand(0, 6), rand(-0.12, 0.12));
    pillar.castShadow = true;
    group.add(pillar);
  }
  const floating = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), crystal);
  floating.position.y = 3.0;
  floating.castShadow = true;
  group.add(floating);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.055, 8, 40), crystalWarm);
  ring.position.y = 3.0;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const light = new THREE.PointLight('#7ff2dd', 18, 14, 2);
  light.position.y = 3.0;
  group.add(light);
  for (let i = 0; i < 8; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(rand(0.1, 0.22), 0), i % 2 ? crystal : crystalWarm);
    const a = rand(0, Math.PI * 2), d = rand(1.5, 3.2);
    shard.position.set(Math.cos(a) * d, rand(0.6, 1.3), Math.sin(a) * d);
    group.add(shard);
  }
  scene.add(group);
  return {
    group,
    update(t) {
      floating.position.y = 3.0 + Math.sin(t * 1.4) * 0.16;
      floating.rotation.y = t * 0.7;
      floating.rotation.z = Math.sin(t * 0.5) * 0.12;
      ring.position.y = 3.0 + Math.sin(t * 1.4 + 0.7) * 0.16;
      ring.rotation.z = t * 0.45;
      light.intensity = 15 + Math.sin(t * 2.2) * 5;
    }
  };
}

export function buildMinimap(size = 240) {
  const [c, ctx] = makeCanvas(size, size);
  const range = 52;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wx = (x / size - 0.5) * range * 2;
      const wz = (y / size - 0.5) * range * 2;
      const h = heightAt(wx, wz);
      const pd = pathDistance(wx, wz);
      const dl = Math.hypot(wx - LAKE.x, wz - LAKE.z);
      let r, g, b;
      if (dl < LAKE.r) { r = 55; g = 156; b = 183; }
      else if (pd < 2.6) { r = 222; g = 200; b = 148; }
      else if (h > 7) { r = 133; g = 141; b = 126; }
      else { const v = 0.78 + fbm(wx * 0.2, wz * 0.2) * 0.34; r = 100 * v; g = 172 * v; b = 97 * v; }
      const idx = (y * size + x) * 4;
      img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(255,248,220,.92)';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  for (let z = -50; z <= 50; z += 2) {
    const sx = (PATH_X(z) / range * 0.5 + 0.5) * size;
    const sy = (z / range * 0.5 + 0.5) * size;
    if (z === -50) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  const lm = [((LAKE.x / range) * 0.5 + 0.5) * size, ((LAKE.z / range) * 0.5 + 0.5) * size];
  ctx.beginPath();
  ctx.arc(lm[0], lm[1], (LAKE.r / range) * 0.5 * size, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(196,245,255,.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  return c;
}

export function createWorld(scene, renderer) {
  scene.fog = new THREE.Fog('#b7d8d0', 78, 225);
  const sunDir = new THREE.Vector3(0.42, 0.62, 0.34).normalize();
  makeSky(scene, sunDir);
  const hemi = new THREE.HemisphereLight('#c6ecff', '#5d7d48', 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0c9', 3.15);
  sun.position.set(38, 54, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -46;
  sun.shadow.camera.right = 46;
  sun.shadow.camera.top = 46;
  sun.shadow.camera.bottom = -46;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.00045;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#a9ddff', 0.38);
  fill.position.set(-24, 18, -30);
  scene.add(fill);
  scene.add(new THREE.AmbientLight('#c9e7d8', 0.1));

  const terrain = makeTerrain(scene);
  const water = makeWater(scene);
  const clouds = makeClouds(scene);
  const grass = makeGrass(scene, window.innerWidth < 720 ? 2100 : 3900);
  const tallGrass = makeTallGrass(scene, SPAWNS);
  makeFlowers(scene);
  makeBushes(scene);
  makeTrees(scene);
  makeRocks(scene);
  makeMountains(scene);
  const fireflies = makeFireflies(scene);
  const butterflies = makeButterflies(scene);
  const shrine = makeShrine(scene);

  const playerStart = new THREE.Vector3(0, heightAt(0, 5.5), 5.5);
  const startRotation = Math.PI;

  return {
    scene, terrain, sun, hemi, sunDir, water, grass, tallGrass, fireflies, butterflies, shrine,
    playerStart, startRotation, lake: LAKE, waterY: WATER_Y, limit: WORLD_LIMIT,
    heightAt, pathDistance, isWater,
    update(dt, t) {
      water.update(t);
      grass.update(t);
      tallGrass.update(t);
      fireflies.update(t);
      butterflies.update(t);
      shrine.update(t);
      for (const c of clouds) {
        c.position.x += c.userData.speed * dt;
        if (c.position.x > 150) c.position.x = -150;
        c.position.y += Math.sin(t * 0.18 + c.userData.phase) * 0.004;
      }
      sun.position.x = 38 + Math.sin(t * 0.012) * 8;
    }
  };
}
