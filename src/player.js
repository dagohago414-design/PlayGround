import * as THREE from 'three';

const G = {
  sphere: new THREE.SphereGeometry(1, 20, 14),
  capsule: new THREE.CapsuleGeometry(0.5, 1, 8, 14),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 14),
  cone: new THREE.ConeGeometry(1, 1, 16),
  box: new THREE.BoxGeometry(1, 1, 1),
  torus: new THREE.TorusGeometry(1, 0.22, 10, 24)
};
const OUT = new THREE.MeshBasicMaterial({ color: 0x1b3034, side: THREE.BackSide, transparent: true, opacity: 0.28 });

function part(parent, geo, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.66,
    metalness: opts.metalness ?? 0.02,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(opts.x ?? 0, opts.y ?? 0, opts.z ?? 0);
  mesh.scale.set(opts.sx ?? 1, opts.sy ?? 1, opts.sz ?? 1);
  mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
  mesh.castShadow = true;
  parent.add(mesh);
  if (opts.outline) {
    const o = new THREE.Mesh(geo, OUT);
    o.position.copy(mesh.position);
    o.scale.copy(mesh.scale).multiplyScalar(1.05);
    o.rotation.copy(mesh.rotation);
    parent.add(o);
  }
  return mesh;
}

export function createPlayer() {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  root.add(visual);

  const legsGroup = new THREE.Group();
  const torso = new THREE.Group();
  visual.add(legsGroup, torso);

  const skin = '#f2c49b';
  const skinShade = '#d9a276';
  const jacket = '#2f8d86';
  const jacketLight = '#57b3a9';
  const shorts = '#2c4356';
  const boot = '#814f35';
  const cream = '#fff1d6';
  const coral = '#ff8b61';
  const hair = '#5c3d2c';

  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(s * 0.14, 0.62, 0);
    legsGroup.add(hip);
    part(hip, G.capsule, shorts, { y: -0.13, sx: 0.12, sy: 0.2, sz: 0.12, outline: true });
    part(hip, G.capsule, skin, { y: -0.33, sx: 0.085, sy: 0.19, sz: 0.085 });
    part(hip, G.sphere, boot, { y: -0.5, z: 0.04, sx: 0.12, sy: 0.11, sz: 0.16, outline: true });
    legs.push(hip);
  }

  part(torso, G.capsule, jacket, { y: 1.02, sx: 0.21, sy: 0.34, sz: 0.17, outline: true });
  part(torso, G.box, jacketLight, { y: 0.99, z: 0.14, sx: 0.2, sy: 0.13, sz: 0.06 });
  part(torso, G.box, cream, { y: 0.82, z: 0.15, sx: 0.28, sy: 0.07, sz: 0.05 });
  const scarf = new THREE.Group();
  scarf.position.set(0, 1.28, 0.02);
  torso.add(scarf);
  part(scarf, G.torus, coral, { sx: 0.17, sy: 0.17, sz: 0.17, rx: Math.PI / 2, roughness: 0.8 });
  const scarfTail = part(scarf, G.box, coral, { x: -0.08, y: -0.12, z: -0.15, sx: 0.09, sy: 0.24, sz: 0.04, rz: 0.18 });
  part(torso, G.box, '#5d4330', { y: 0.98, z: -0.18, sx: 0.25, sy: 0.34, sz: 0.12, outline: true });
  part(torso, G.box, '#c79a5b', { y: 0.92, z: -0.235, sx: 0.2, sy: 0.12, sz: 0.05 });
  part(torso, G.cylinder, '#d7a866', { y: 1.16, z: -0.24, sx: 0.075, sy: 0.11, sz: 0.075, rz: Math.PI / 2 });
  part(torso, G.sphere, '#8d5f3d', { x: 0.17, y: 0.86, z: -0.24, sx: 0.055, sy: 0.07, sz: 0.04 });
  part(torso, G.box, '#3a6f6a', { x: -0.01, y: 1.18, z: -0.12, sx: 0.4, sy: 0.045, sz: 0.08, rz: 0.08 });
  part(torso, G.sphere, '#ffe2b8', { y: 1.24, z: 0.2, sx: 0.18, sy: 0.06, sz: 0.05 });

  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * 0.3, 1.16, 0);
    torso.add(shoulder);
    part(shoulder, G.capsule, jacket, { y: -0.14, sx: 0.08, sy: 0.18, sz: 0.08, rz: s * 0.12, outline: true });
    part(shoulder, G.capsule, skin, { y: -0.34, z: 0.02, sx: 0.065, sy: 0.13, sz: 0.065 });
    part(shoulder, G.sphere, skinShade, { y: -0.47, z: 0.02, sx: 0.075, sy: 0.075, sz: 0.075 });
    arms.push(shoulder);
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.5, 0.01);
  torso.add(headGroup);
  part(headGroup, G.sphere, skin, { sx: 0.24, sy: 0.25, sz: 0.235, outline: true });
  part(headGroup, G.sphere, hair, { y: 0.045, z: -0.03, sx: 0.247, sy: 0.255, sz: 0.24 });
  part(headGroup, G.sphere, skin, { y: -0.005, z: 0.05, sx: 0.225, sy: 0.235, sz: 0.21 });
  const eyeMat = { roughness: 0.2 };
  for (const s of [-1, 1]) {
    part(headGroup, G.sphere, '#fffdf5', { x: s * 0.09, y: 0.05, z: 0.21, sx: 0.062, sy: 0.075, sz: 0.03, ...eyeMat, emissive: '#ffffff', emissiveIntensity: 0.15 });
    part(headGroup, G.sphere, '#2b3a3b', { x: s * 0.09, y: 0.045, z: 0.234, sx: 0.035, sy: 0.048, sz: 0.018 });
    part(headGroup, G.sphere, '#ffffff', { x: s * 0.078, y: 0.068, z: 0.247, sx: 0.012, sy: 0.014, sz: 0.008 });
    part(headGroup, G.sphere, '#e99b86', { x: s * 0.155, y: -0.04, z: 0.19, sx: 0.048, sy: 0.027, sz: 0.012 });
  }
  part(headGroup, G.sphere, skinShade, { y: -0.04, z: 0.235, sx: 0.035, sy: 0.025, sz: 0.02 });
  const mouth = part(headGroup, G.box, '#a75c52', { y: -0.105, z: 0.215, sx: 0.06, sy: 0.012, sz: 0.01 });

  const cap = new THREE.Group();
  cap.position.set(0, 0.19, -0.01);
  headGroup.add(cap);
  part(cap, G.sphere, coral, { sx: 0.252, sy: 0.13, sz: 0.245 });
  part(cap, G.box, coral, { y: -0.045, z: 0.18, sx: 0.3, sy: 0.035, sz: 0.22, rx: 0.08 });
  part(cap, G.box, cream, { y: 0.015, z: 0.2, sx: 0.12, sy: 0.062, sz: 0.05 });
  part(cap, G.sphere, cream, { y: 0.065, z: -0.02, sx: 0.055, sy: 0.05, sz: 0.05 });
  const tuft = part(cap, G.cone, hair, { y: 0.02, z: -0.24, sx: 0.05, sy: 0.15, sz: 0.05, rx: -1.0 });
  part(cap, G.sphere, '#ffd166', { y: 0.035, z: 0.16, sx: 0.035, sy: 0.035, sz: 0.023, emissive: '#ffb300', emissiveIntensity: 0.25 });

  const handLight = new THREE.PointLight('#9fffe0', 0.5, 3, 2);
  handLight.position.set(0.3, 0.7, 0.3);
  torso.add(handLight);

  const state = {
    root, visual, head: headGroup, legs, arms, scarfTail, mouth,
    animate(t, moving, speed = 1, dt = 0.016) {
      const walk = moving ? Math.min(1, speed) : 0;
      const cycle = t * (8 + speed * 2.4);
      const swing = Math.sin(cycle) * 0.62 * walk;
      legs[0].rotation.x = swing;
      legs[1].rotation.x = -swing;
      arms[0].rotation.x = -swing * 0.8;
      arms[1].rotation.x = swing * 0.8;
      arms[0].rotation.z = -0.12 - walk * 0.05;
      arms[1].rotation.z = 0.12 + walk * 0.05;
      const bob = moving ? Math.abs(Math.sin(cycle)) * 0.035 : Math.sin(t * 1.8) * 0.012;
      visual.position.y = bob;
      visual.rotation.z = moving ? Math.sin(cycle) * 0.025 * walk : Math.sin(t * 1.4) * 0.006;
      headGroup.rotation.z = moving ? -Math.sin(cycle) * 0.04 * walk : Math.sin(t * 1.3) * 0.02;
      headGroup.rotation.x = Math.sin(t * 1.7) * 0.02;
      scarfTail.rotation.z = 0.18 + Math.sin(t * (moving ? 7 : 2.2)) * (moving ? 0.22 : 0.08);
      scarfTail.rotation.x = -0.25 + Math.sin(t * 3.2) * 0.1;
      tuft.rotation.z = Math.sin(t * 2.2) * 0.08;
      handLight.intensity = 0.35 + Math.sin(t * 2.6) * 0.12;
    }
  };
  return state;
}
