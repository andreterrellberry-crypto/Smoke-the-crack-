import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { createEarth, latLngToVec3 } from './scene/earth.js';
import { createMarkers } from './scene/markers.js';
import { createMarket } from './ui/market.js';
import { COUNTRIES, COUNT_BY_COUNTRY } from './data/inventory.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#scene');
const isTouch = matchMedia('(pointer: coarse)').matches;

// ---------- Renderer / camera ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const MAX_PR = Math.min(window.devicePixelRatio || 1, isTouch ? 1.75 : 2);
let pixelRatio = MAX_PR;
let prCeiling = MAX_PR;
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#02030a');
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 100);
const START = latLngToVec3(25, -40, 1).multiplyScalar(9); // open over the Atlantic
camera.position.copy(START);

const FULL_DIST = 3.4;
const CONTINENT_DIST = 2.6;
const COUNTRY_DIST = 2.0;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 1.15;
controls.maxDistance = 6;
controls.autoRotateSpeed = 0.35;
controls.enabled = false;

// ---------- Loading ----------
const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);
manager.onProgress = (_, done, total) => ($('#load-bar').style.width = `${(done / total) * 100}%`);

// ---------- Sky + Earth ----------
const skyTex = loader.load('textures/stars.jpg');
skyTex.colorSpace = THREE.SRGBColorSpace;
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(50, 48, 24),
  new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false, depthTest: false, color: 0x8a8fa8 })
);
sky.renderOrder = -1;
sky.raycast = () => {};
scene.add(sky);

const earth = createEarth(loader, renderer);
scene.add(earth.group);
const markers = createMarkers(earth.group, COUNTRIES, COUNT_BY_COUNTRY);

// ---------- Tweens (one camera tween at a time) ----------
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let camTween = null;
const tweens = new Set();
function tween(dur, fn) {
  return new Promise((res) => {
    if (camTween) {
      tweens.delete(camTween);
      camTween.res(false);
    }
    camTween = { t: 0, dur, fn, res };
    tweens.add(camTween);
  });
}
function stepTweens(dt) {
  for (const tw of tweens) {
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.fn(ease(k));
    if (k >= 1) {
      tweens.delete(tw);
      if (tw === camTween) camTween = null;
      tw.res(true);
    }
  }
}

// Arc the camera around the globe (never through it) to a direction + distance
const ORIGIN = new THREE.Vector3();
async function flyTo(endDir, endR) {
  const startDir = camera.position.clone().normalize();
  const startR = camera.position.length();
  const angle = startDir.angleTo(endDir);
  const q = new THREE.Quaternion().setFromUnitVectors(startDir, endDir);
  const qi = new THREE.Quaternion();
  const ident = new THREE.Quaternion();
  const dir = new THREE.Vector3();
  controls.enabled = false;
  const done = await tween(Math.min(2.4, 1.0 + angle * 0.5), (e) => {
    qi.slerpQuaternions(ident, q, e);
    dir.copy(startDir).applyQuaternion(qi);
    camera.position.copy(dir).multiplyScalar(THREE.MathUtils.lerp(startR, endR, e) + Math.sin(Math.PI * e) * angle * 0.5);
    camera.lookAt(ORIGIN);
  });
  if (done) controls.enabled = true;
  return done;
}

// ---------- Navigation: continent → country ----------
let activeIdx = -1;
let lastInteraction = performance.now();

function flyToCountry(country) {
  if (!country) return;
  lastInteraction = performance.now();
  activeIdx = COUNTRIES.indexOf(country);
  markers.setActive(activeIdx);
  market.open({ level: 'country', value: country.id });
  flyTo(markers.normals[activeIdx].clone(), COUNTRY_DIST);
}

function flyToContinent(cont) {
  lastInteraction = performance.now();
  activeIdx = -1;
  markers.setActive(-1);
  if (!cont) {
    market.close();
    return flyTo(camera.position.clone().normalize(), FULL_DIST);
  }
  market.open({ level: 'continent', value: cont.id });
  flyTo(latLngToVec3(cont.lat, cont.lng, 1), CONTINENT_DIST);
}

const market = createMarket({
  onFlyToCountry: flyToCountry,
  onFlyToContinent: flyToContinent,
  onClose: () => {
    activeIdx = -1;
    markers.setActive(-1);
  },
});

$('#btn-zoomout').onclick = () => flyToContinent(null);
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if ($('#bag').classList.contains('open')) $('#bag').classList.remove('open');
  else flyToContinent(null);
});

// ---------- View offset so the globe stays centred beside the panel ----------
let viewShift = 0;
function applyViewOffset(dt) {
  const w = innerWidth;
  const h = innerHeight;
  viewShift += ((market.isOpen() ? 1 : 0) - viewShift) * (1 - Math.exp(-dt * 7));
  if (Math.abs(viewShift) < 0.001) {
    if (camera.view?.enabled) camera.clearViewOffset();
    return;
  }
  const wide = w > 820;
  const panelW = wide ? Math.min(560, w * 0.46) + 12 : 0;
  const panelH = wide ? 0 : h * 0.58;
  camera.setViewOffset(w, h, (panelW / 2) * viewShift, (panelH / 2) * viewShift, w, h);
}

// ---------- Picking ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const earthSphere = new THREE.Sphere(ORIGIN, 1);
const hitList = [];
const tmpV = new THREE.Vector3();
let pointerDirty = false;
let pointerInside = false;
let hoverIdx = -1;
let down = null;
const tip = $('#tip');

const setNdc = (e) => ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
canvas.addEventListener('pointermove', (e) => {
  setNdc(e);
  tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
  pointerDirty = pointerInside = true;
});
canvas.addEventListener('pointerleave', () => {
  pointerInside = false;
  pointerDirty = true;
});
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
  lastInteraction = performance.now();
});
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && performance.now() - down.t < 450;
  down = null;
  if (!tap) return;
  setNdc(e);
  pick(true);
  if (hoverIdx >= 0) flyToCountry(COUNTRIES[hoverIdx]);
});
canvas.addEventListener('wheel', () => (lastInteraction = performance.now()), { passive: true });

function pick(force = false) {
  pointerDirty = false;
  hoverIdx = -1;
  if (pointerInside || force) {
    raycaster.setFromCamera(ndc, camera);
    const g = raycaster.ray.intersectSphere(earthSphere, tmpV);
    const gDist = g ? g.distanceTo(raycaster.ray.origin) : Infinity;
    hitList.length = 0;
    raycaster.intersectObject(markers.hits, false, hitList);
    const h = hitList.find((x) => x.distance < gDist + 0.04);
    if (h) hoverIdx = h.instanceId;
  }
  markers.setHovered(hoverIdx);
  const c = COUNTRIES[hoverIdx];
  tip.innerHTML = c ? `<b>${c.id}</b><span>${c.continent}</span><em>${COUNT_BY_COUNTRY[c.id]} in stock</em>` : '';
  tip.classList.toggle('show', !!c && !isTouch);
  canvas.style.cursor = c ? 'pointer' : 'grab';
}

// ---------- Country labels (pooled DOM, front-facing only) ----------
const labelLayer = $('#labels');
const labels = COUNTRIES.map((c) => {
  const el = document.createElement('button');
  el.className = 'label';
  el.textContent = c.id;
  el.tabIndex = -1;
  el.onclick = () => flyToCountry(c);
  labelLayer.appendChild(el);
  return { el, shown: false };
});
const camDir = new THREE.Vector3();
function updateLabels() {
  const dist = camera.position.length();
  camDir.copy(camera.position).normalize();
  for (let i = 0; i < labels.length; i++) {
    const L = labels[i];
    const n = markers.normals[i];
    const facing = n.dot(camDir);
    const visible = facing > 0.45 && (dist < 2.8 || i === activeIdx || i === hoverIdx);
    if (visible) {
      tmpV.copy(n).multiplyScalar(1 + markers.heights[i] + 0.01).project(camera);
      L.el.style.transform = `translate(${(tmpV.x * 0.5 + 0.5) * innerWidth}px, ${(-tmpV.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -130%)`;
      L.el.style.opacity = Math.min(1, (facing - 0.45) * 4).toFixed(2);
      L.el.classList.toggle('active', i === activeIdx);
    }
    if (visible !== L.shown) {
      L.el.style.display = visible ? 'block' : 'none';
      L.shown = visible;
    }
  }
}

// ---------- Resize / context loss ----------
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  $('#lost').hidden = false;
});
canvas.addEventListener('webglcontextrestored', () => ($('#lost').hidden = true));

// ---------- Adaptive resolution: hold frame rate on weak GPUs ----------
let frameAcc = 0;
let frameN = 0;
let goodSince = performance.now();
function adapt(dt) {
  frameAcc += Math.min(dt, 0.25);
  if (++frameN < 60) return;
  const avg = frameAcc / frameN;
  frameAcc = frameN = 0;
  const now = performance.now();
  if (avg > 1 / 42 && pixelRatio > 0.75) {
    prCeiling = pixelRatio - 0.25; // never climb back to a level that struggled
    pixelRatio = Math.max(0.75, pixelRatio - 0.25);
    renderer.setPixelRatio(pixelRatio);
    goodSince = now;
  } else if (avg < 1 / 55) {
    if (now - goodSince > 8000 && pixelRatio < prCeiling) {
      pixelRatio = Math.min(prCeiling, pixelRatio + 0.25);
      renderer.setPixelRatio(pixelRatio);
      goodSince = now;
    }
  } else goodSince = now;
}

// ---------- Main loop ----------
const lightOffset = new THREE.Vector3();
let elapsed = 0;
let lastT = performance.now();
function frame(now = performance.now()) {
  const raw = Math.max(0, (now - lastT) / 1000);
  lastT = now;
  const dt = Math.min(raw, 0.05); // clamp so tab switches never cause jumps
  elapsed += dt;

  stepTweens(Math.min(raw, 0.25));
  earth.clouds.rotation.y += dt * 0.006;

  const d = camera.position.length();
  controls.rotateSpeed = THREE.MathUtils.clamp((d - 1) * 0.35, 0.08, 0.9);
  controls.autoRotate = performance.now() - lastInteraction > 6000 && !market.isOpen() && !camTween;
  if (controls.enabled) controls.update(dt);

  // Key light sits up-left of the camera so the visible side is always lit
  lightOffset.set(-0.35, 0.45, 0).applyQuaternion(camera.quaternion);
  earth.lightDir.value.copy(camera.position).normalize().add(lightOffset);

  if (pointerDirty) pick();
  applyViewOffset(dt);
  sky.position.copy(camera.position);
  markers.update(elapsed, pixelRatio);
  updateLabels();
  renderer.render(scene, camera);
  adapt(raw);
}

// ---------- Boot ----------
manager.onLoad = () => {
  $('#loader').classList.add('done');
  lastT = performance.now();
  renderer.setAnimationLoop(frame);
  flyTo(START.clone().normalize(), FULL_DIST);
};
manager.onError = (url) => console.warn('Texture failed:', url);
renderer.compile(scene, camera);
