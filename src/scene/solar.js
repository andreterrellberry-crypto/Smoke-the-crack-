import * as THREE from 'three';

// Stylised (not to scale) solar system. Everything is procedural: zero extra network requests.
export const EARTH_ORBIT = 60;

const PLANETS = [
  { name: 'Mercury', r: 0.45, orbit: 24, speed: 4.15, colors: ['#8c8580', '#5e5753'], drop: 'Heat-Resistant Capsule' },
  { name: 'Venus', r: 0.9, orbit: 38, speed: 1.62, colors: ['#e6c48a', '#b88a4a'], drop: 'Acid Rain Shell' },
  { name: 'Mars', r: 0.6, orbit: 82, speed: 0.53, colors: ['#c1440e', '#7a2a0a'], drop: 'Red Planet Workwear' },
  { name: 'Jupiter', r: 3.4, orbit: 118, speed: 0.084, colors: ['#d8b48a', '#a0714b', '#efe2cc', '#b5825a'], bands: true, drop: 'Great Red Spot Puffer' },
  { name: 'Saturn', r: 2.8, orbit: 158, speed: 0.034, colors: ['#e3cf9d', '#b9a173', '#f2e6c4'], bands: true, ring: true, drop: 'Ring Logo Collection' },
  { name: 'Uranus', r: 1.6, orbit: 192, speed: 0.012, colors: ['#9fdbe3', '#7cc3cf'], drop: 'Ice Giant Fleece' },
  { name: 'Neptune', r: 1.55, orbit: 220, speed: 0.006, colors: ['#3e66d6', '#2a48a8'], drop: 'Deep Blue Archive' },
];

function bandTexture(colors, bands) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  if (bands) {
    let y = 0;
    let i = 0;
    while (y < c.height) {
      const h = 6 + ((i * 37) % 19);
      g.fillStyle = colors[i % colors.length];
      g.fillRect(0, y, c.width, h);
      y += h;
      i++;
    }
  } else {
    const grd = g.createLinearGradient(0, 0, 0, c.height);
    grd.addColorStop(0, colors[1]);
    grd.addColorStop(0.5, colors[0]);
    grd.addColorStop(1, colors[1]);
    g.fillStyle = grd;
    g.fillRect(0, 0, c.width, c.height);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.25, outer);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const sunFrag = /* glsl */ `
  uniform float time; varying vec2 vUv; varying vec3 vN;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.1; a*=0.5; } return v; }
  void main(){
    vec2 p = vUv * vec2(18.0, 9.0);
    float n = fbm(p + vec2(time*0.15, time*0.05)) * 0.6 + fbm(p*2.3 - time*0.1) * 0.4;
    vec3 col = mix(vec3(1.0,0.45,0.05), vec3(1.0,0.92,0.55), n);
    float rim = pow(1.0 - abs(vN.z), 2.0);
    col += vec3(1.0,0.6,0.2) * rim * 0.6;
    gl_FragColor = vec4(col * 1.25, 1.0);
  }`;
const sunVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN;
  void main(){ vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

export function createSolarSystem(scene) {
  const root = new THREE.Group();
  scene.add(root);

  // Sun
  const sunUniforms = { time: { value: 0 } };
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(9, 64, 32),
    new THREE.ShaderMaterial({ uniforms: sunUniforms, vertexShader: sunVert, fragmentShader: sunFrag })
  );
  sun.name = 'Sun';
  root.add(sun);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture('rgba(255,240,200,1)', 'rgba(255,140,30,0.55)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })
  );
  glow.scale.set(70, 70, 1);
  glow.raycast = () => {};
  root.add(glow);

  const light = new THREE.PointLight(0xfff2dd, 3.2, 0, 0);
  root.add(light);
  scene.add(new THREE.AmbientLight(0x334466, 0.35));

  // Orbit rings (single shared material)
  const ringMat = new THREE.LineBasicMaterial({ color: 0x6f8cff, transparent: true, opacity: 0.18 });
  const addOrbit = (radius) => {
    const pts = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
    line.raycast = () => {};
    root.add(line);
  };
  addOrbit(EARTH_ORBIT);

  const planets = PLANETS.map((p, idx) => {
    addOrbit(p.orbit);
    const pivot = new THREE.Group();
    pivot.rotation.y = idx * 1.7 + 0.6;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.r, 48, 24),
      new THREE.MeshStandardMaterial({ map: bandTexture(p.colors, p.bands), roughness: 0.9, metalness: 0 })
    );
    const holder = new THREE.Group(); // keeps ring tilt independent of planet spin
    holder.position.x = p.orbit;
    mesh.name = p.name;
    mesh.userData.planet = p;
    holder.add(mesh);
    pivot.add(holder);
    if (p.ring) {
      const rg = new THREE.RingGeometry(p.r * 1.35, p.r * 2.3, 96, 1);
      const ringTex = bandTexture(['#d9c79f', '#9c8a63', '#efe1bd', '#5c5140'], true);
      // remap ring UVs radially so bands go outward
      const pos = rg.attributes.position;
      const uv = rg.attributes.uv;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        uv.setXY(i, 0.5, (v.length() - p.r * 1.35) / (p.r * 0.95));
      }
      const ring = new THREE.Mesh(
        rg,
        new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true, opacity: 0.85, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2 + 0.45;
      ring.raycast = () => {};
      holder.add(ring);
    }
    root.add(pivot);
    return { ...p, pivot, mesh };
  });

  // Moon orbits Earth; attached later by main via addMoon
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 32, 16),
    new THREE.MeshStandardMaterial({ map: bandTexture(['#bdbdbd', '#8a8a8a'], false), roughness: 1 })
  );
  moon.name = 'Moon';
  moon.userData.planet = { name: 'Moon', drop: 'Low-Gravity Capsule' };
  const moonPivot = new THREE.Group();
  moon.position.x = 12;
  moonPivot.add(moon);

  const pickables = [sun, moon, ...planets.map((p) => p.mesh)];
  sun.userData.planet = { name: 'Sun', drop: 'Solar Flare Collection' };

  function update(dt, t, orbitsOn) {
    sunUniforms.time.value = t;
    sun.rotation.y += dt * 0.03;
    if (!orbitsOn) return;
    for (const p of planets) {
      p.pivot.rotation.y += dt * p.speed * 0.05;
      p.mesh.rotation.y += dt * 0.4;
    }
    moonPivot.rotation.y += dt * 0.25;
  }

  return { root, sun, planets, moon, moonPivot, pickables, update, ringMat };
}
