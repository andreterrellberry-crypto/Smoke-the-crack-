import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { createEarth, latLngToVec3 } from './scene/earth.js';
import { createSolarSystem, EARTH_ORBIT } from './scene/solar.js';
import { createMarkers } from './scene/markers.js';
import { createMarket } from './ui/market.js';
import { LOCATIONS, COUNT_BY_LOC } from './data/inventory.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#scene');
const isTouch = matchMedia('(pointer: coarse)').matches;

// ---------- Renderer / camera ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
const MAX_PR = Math.min(window.devicePixelRatio || 1, isTouch ? 1.75 : 2);
let pixelRatio = MAX_PR;
let prCeiling = MAX_PR;
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#02030a');
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 6000);
camera.position.set(0, 520, 1100);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25;
controls.enabled = false;

// ---------- Loading ----------
const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);
manager.onProgress = (_, done, total) => ($('#load-bar').style.width = `${(done / total) * 100}%`);

// ---------- Sky ----------
const skyTex = loader.load('textures/stars.jpg');
skyTex.colorSpace = THREE.SRGBColorSpace;
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(4000, 48, 24),
  new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false, depthTest: false, color: 0x8a8fa8 })
);
sky.renderOrder = -1;
sky.raycast = () => {};
scene.add(sky);

// ---------- Solar system + Earth ----------
const solar = createSolarSystem(scene);
const earth = createEarth(loader, renderer);
const earthPivot = new THREE.Group();
earthPivot.rotation.y = -0.9;
earth.group.position.x = EARTH_ORBIT;
earthPivot.add(earth.group);
solar.root.add(earthPivot);
earth.group.add(solar.moonPivot);
const markers = createMarkers(earth.spin, LOCATIONS, COUNT_BY_LOC);
markers.setVisible(false);

// ---------- State ----------
let mode = 'intro'; // intro | solar | earth | transit
let orbitsOn = true;
let activeIdx = -1;
let lastInteraction = performance.now();
const earthCenter = new THREE.Vector3();
const sunDirTmp = new THREE.Vector3();
const SOLAR_VIEW = new THREE.Vector3(0, 150, 270);
const EARTH_DIST = 3.4;
const CITY_DIST = 2.0;

// ---------- Tweens (one camera tween at a time) ----------
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let camTween = null;
const tweens = new Set();
function tween(dur, fn, { exclusive = false } = {}) {
  return new Promise((res) => {
    const tw = { t: 0, dur, fn, res, cancelled: false };
    if (exclusive) {
      if (camTween) {
        tweens.delete(camTween);
        camTween.res(false);
      }
      camTween = tw;
    }
    tweens.add(tw);
  });
}
function stepTweens(dt) {
  for (const tw of tweens) {
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.fn(ease(k), k);
    if (k >= 1) {
      tweens.delete(tw);
      if (tw === camTween) camTween = null;
      tw.res(true);
    }
  }
}

// ---------- View offset so the globe stays centred in the space beside the panel ----------
let viewShift = 0;
function applyViewOffset(dt) {
  const w = innerWidth;
  const h = innerHeight;
  const panelOpen = market?.isOpen();
  const target = panelOpen ? 1 : 0;
  viewShift += (target - viewShift) * (1 - Math.exp(-dt * 7));
  if (Math.abs(viewShift) < 0.001) {
    if (camera.view?.enabled) camera.clearViewOffset();
    return;
  }
  const wide = w > 820;
  const panelW = wide ? Math.min(560, w * 0.46) + 12 : 0;
  const panelH = wide ? 0 : h * 0.58;
  camera.setViewOffset(w, h, (panelW / 2) * viewShift, (panelH / 2) * viewShift, w, h);
}

function fadeOrbits(to) {
  const from = solar.ringMat.opacity;
  tween(1.2, (k) => {
    solar.ringMat.opacity = THREE.MathUtils.lerp(from, to, k);
    solar.ringMat.visible = solar.ringMat.opacity > 0.005;
  });
}

function setNear(n) {
  camera.near = n;
  camera.updateProjectionMatrix();
}

function earthWorldCenter() {
  return earth.group.getWorldPosition(earthCenter);
}

function locWorldDir(i, target = new THREE.Vector3()) {
  return target.copy(markers.normals[i]).transformDirection(earth.spin.matrixWorld);
}

// ---------- Mode transitions ----------
let enterPromise = null;
function enterEarth() {
  if (mode === 'earth') return Promise.resolve();
  if (enterPromise) return enterPromise;
  if (mode === 'transit') return Promise.resolve();
  enterPromise = doEnterEarth().finally(() => (enterPromise = null));
  return enterPromise;
}
async function doEnterEarth() {
  mode = 'transit';
  setHud('transit');
  orbitsOn = false;
  controls.enabled = false;
  controls.autoRotate = false;
  fadeOrbits(0);
  setNear(0.01);
  markers.setVisible(true);
  const C = earthWorldCenter().clone();
  const sunward = new THREE.Vector3().sub(C).normalize();
  const endPos = C.clone().add(sunward.add(new THREE.Vector3(0, 0.35, 0)).normalize().multiplyScalar(EARTH_DIST));
  const p0 = camera.position.clone();
  const t0 = controls.target.clone();
  const arc = Math.min(60, p0.distanceTo(endPos) * 0.15);
  const done = await tween(
    3.2,
    (e) => {
      controls.target.lerpVectors(t0, C, Math.min(1, e * 1.4));
      camera.position.lerpVectors(p0, endPos, e).y += Math.sin(Math.PI * e) * arc;
      camera.lookAt(controls.target);
    },
    { exclusive: true }
  );
  if (!done) return;
  controls.target.copy(C);
  controls.minDistance = 1.12;
  controls.maxDistance = 9;
  controls.enabled = true;
  mode = 'earth';
  setHud('earth');
}

async function exitToSolar() {
  if (mode !== 'earth') return;
  market.close();
  setActive(-1);
  mode = 'transit';
  setHud('transit');
  controls.enabled = false;
  const p0 = camera.position.clone();
  const t0 = controls.target.clone();
  const done = await tween(
    3,
    (e) => {
      controls.target.lerpVectors(t0, solar.sun.position, e);
      camera.position.lerpVectors(p0, SOLAR_VIEW, e).y += Math.sin(Math.PI * e) * 30;
      camera.lookAt(controls.target);
    },
    { exclusive: true }
  );
  if (!done) return;
  markers.setVisible(false);
  fadeOrbits(0.18);
  setNear(0.5);
  controls.target.set(0, 0, 0);
  controls.minDistance = 25;
  controls.maxDistance = 900;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.25;
  controls.enabled = true;
  orbitsOn = true;
  mode = 'solar';
  setHud('solar');
}

async function flyToLocation(loc) {
  if (!loc) return;
  const i = LOCATIONS.indexOf(loc);
  if (mode !== 'earth') await enterEarth();
  if (mode !== 'earth') return;
  lastInteraction = performance.now();
  setActive(i);
  market.openFor(loc);
  const C = earthCenter;
  const startDir = camera.position.clone().sub(C);
  const startR = startDir.length();
  startDir.normalize();
  const endDir = locWorldDir(i);
  const angle = startDir.angleTo(endDir);
  const q = new THREE.Quaternion().setFromUnitVectors(startDir, endDir);
  const qi = new THREE.Quaternion();
  const ident = new THREE.Quaternion();
  const dir = new THREE.Vector3();
  controls.enabled = false;
  const done = await tween(
    Math.min(2.6, 1.1 + angle * 0.55),
    (e) => {
      qi.slerpQuaternions(ident, q, e);
      dir.copy(startDir).applyQuaternion(qi);
      const r = THREE.MathUtils.lerp(startR, CITY_DIST, e) + Math.sin(Math.PI * e) * angle * 0.6;
      camera.position.copy(C).addScaledVector(dir, r);
      camera.lookAt(C);
    },
    { exclusive: true }
  );
  if (done) controls.enabled = mode === 'earth';
}

async function zoomOutFull() {
  if (mode !== 'earth') return enterEarth();
  market.close();
  setActive(-1);
  const C = earthCenter;
  const dir = camera.position.clone().sub(C);
  const r0 = dir.length();
  dir.normalize();
  controls.enabled = false;
  const done = await tween(
    1.4,
    (e) => {
      camera.position.copy(C).addScaledVector(dir, THREE.MathUtils.lerp(r0, EARTH_DIST, e));
      camera.lookAt(C);
    },
    { exclusive: true }
  );
  if (done) controls.enabled = mode === 'earth';
}

function setActive(i) {
  activeIdx = i;
  markers.setActive(i);
}

// ---------- UI wiring ----------
const market = createMarket({
  onFlyToLocation: flyToLocation,
  onClose: () => setActive(-1),
});

const hint = $('#hint');
function setHud(m) {
  document.body.dataset.mode = m;
  $('#btn-system').textContent = m === 'solar' ? '◉ Land on Earth' : '☉ Solar System';
  hint.textContent =
    m === 'solar'
      ? 'Drag to orbit the system · Click Earth to land · Planets have secret drops'
      : m === 'earth'
        ? 'Drag to spin · Scroll / pinch to zoom · Tap a beacon to shop that city'
        : '';
}

$('#btn-system').onclick = () => (mode === 'solar' || mode === 'intro' ? enterEarth() : exitToSolar());
$('#btn-zoomout').onclick = zoomOutFull;
$('#btn-light').onclick = (e) => {
  const on = earth.uniforms.dayOnly.value < 0.5;
  e.currentTarget.classList.toggle('on', on);
  e.currentTarget.textContent = on ? '☀ Daylight' : '☾ Real Time';
  const from = earth.uniforms.dayOnly.value;
  tween(0.8, (k) => (earth.uniforms.dayOnly.value = THREE.MathUtils.lerp(from, on ? 1 : 0, k)));
};
$('#enter').onclick = () => {
  $('#hero').classList.add('gone');
  enterEarth();
};
$('#explore').onclick = () => $('#hero').classList.add('gone');

addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if ($('#bag').classList.contains('open')) $('#bag').classList.remove('open');
    else if (market.isOpen()) market.close();
    else if (mode === 'earth') zoomOutFull();
  }
});

// ---------- Picking ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let pointerDirty = false;
let pointerInside = false;
let hoverIdx = -1;
let hoverPlanet = null;
let down = null;
const tip = $('#tip');

canvas.addEventListener('pointermove', (e) => {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
  pointerDirty = true;
  pointerInside = true;
});
canvas.addEventListener('pointerleave', () => {
  pointerInside = false;
  pointerDirty = true;
});
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
  lastInteraction = performance.now();
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  pointerDirty = true;
  if (mode === 'intro') $('#hero').classList.add('gone');
});
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  const quick = performance.now() - down.t < 450;
  down = null;
  if (moved > 7 || !quick) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  pick(true);
  if (mode === 'earth' && hoverIdx >= 0) flyToLocation(LOCATIONS[hoverIdx]);
  else if ((mode === 'solar' || mode === 'intro') && hoverPlanet) {
    if (hoverPlanet === 'Earth') enterEarth();
    else {
      const p = hoverPlanet.userData.planet;
      market.showToast(`${p.name} — “${p.drop}” drops soon. Stay tuned.`);
    }
  }
});

// Pull out past max zoom on Earth to return to the solar system
let pullOut = 0;
canvas.addEventListener(
  'wheel',
  (e) => {
    lastInteraction = performance.now();
    if (mode !== 'earth' || e.deltaY <= 0) return (pullOut = 0);
    if (camera.position.distanceTo(earthCenter) > controls.maxDistance * 0.97) {
      pullOut += e.deltaY;
      if (pullOut > 900) {
        pullOut = 0;
        exitToSolar();
      }
    }
  },
  { passive: true }
);

// Generous invisible pick spheres so small planets are easy to hit from far away
const proxyMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
const proxyGeo = new THREE.SphereGeometry(1, 12, 8);
const proxies = [...solar.pickables, earth.globe].map((obj) => {
  const r = obj.geometry.parameters.radius;
  const p = new THREE.Mesh(proxyGeo, proxyMat);
  p.scale.setScalar(obj === earth.globe ? 10 : Math.max(r * 2.2, 5));
  p.userData.target = obj === earth.globe ? 'Earth' : obj;
  (obj === earth.globe ? earth.group : obj).add(p);
  if (obj !== earth.globe) p.scale.divideScalar(obj.scale.x || 1);
  return p;
});
const earthSphere = new THREE.Sphere(new THREE.Vector3(), 1);
const hitList = [];
function pick(force = false) {
  pointerDirty = false;
  hoverIdx = -1;
  hoverPlanet = null;
  if (!pointerInside && !down && !force) return setHover();
  raycaster.setFromCamera(ndc, camera);
  if (mode === 'earth') {
    hitList.length = 0;
    earthSphere.center.copy(earthCenter);
    const g = raycaster.ray.intersectSphere(earthSphere, tmpV);
    const gDist = g ? g.distanceTo(raycaster.ray.origin) : Infinity;
    raycaster.intersectObject(markers.hits, false, hitList);
    const h = hitList.find((x) => x.distance < gDist + 0.03);
    if (h) hoverIdx = h.instanceId;
  } else if (mode === 'solar' || mode === 'intro') {
    const hits = raycaster.intersectObjects(proxies, false);
    // prefer Earth when overlapping (it's the storefront)
    const hit = hits.find((x) => x.object.userData.target === 'Earth') || hits[0];
    if (hit) hoverPlanet = hit.object.userData.target;
  }
  setHover();
}
function setHover() {
  markers.setHovered(hoverIdx);
  let label = '';
  if (hoverIdx >= 0) {
    const l = LOCATIONS[hoverIdx];
    label = `<b>${l.city}</b><span>${l.region === l.city ? l.country : `${l.region}, ${l.country}`}</span><em>${COUNT_BY_LOC[l.id]} in stock</em>`;
  } else if (hoverPlanet) {
    label = hoverPlanet === 'Earth' ? '<b>Earth</b><em>Click to land & shop</em>' : `<b>${hoverPlanet.name}</b><em>Coming soon</em>`;
  }
  tip.innerHTML = label;
  tip.classList.toggle('show', !!label && !isTouch);
  canvas.style.cursor = label ? 'pointer' : 'grab';
}

// ---------- City labels (pooled DOM, only front-facing & close) ----------
const labelLayer = $('#labels');
const labels = LOCATIONS.map((l) => {
  const el = document.createElement('button');
  el.className = 'label';
  el.textContent = l.city;
  el.tabIndex = -1;
  el.onclick = () => flyToLocation(l);
  labelLayer.appendChild(el);
  return { el, shown: false };
});
const tmpV = new THREE.Vector3();
const tmpN = new THREE.Vector3();
const camDir = new THREE.Vector3();
const earthTag = $('#earth-tag');
earthTag.onclick = () => {
  $('#hero').classList.add('gone');
  enterEarth();
};
function updateLabels() {
  const solarView = mode === 'solar' || mode === 'intro';
  earthTag.style.display = solarView ? 'block' : 'none';
  if (solarView) {
    tmpV.copy(earthCenter).project(camera);
    const behind = tmpV.z > 1;
    earthTag.style.visibility = behind ? 'hidden' : 'visible';
    earthTag.style.transform = `translate(${(tmpV.x * 0.5 + 0.5) * innerWidth}px, ${(-tmpV.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -150%)`;
  }
  const show = mode === 'earth';
  const dist = camera.position.distanceTo(earthCenter);
  camDir.copy(camera.position).sub(earthCenter).normalize();
  const w = innerWidth;
  const h = innerHeight;
  for (let i = 0; i < labels.length; i++) {
    const L = labels[i];
    let visible = false;
    if (show) {
      locWorldDir(i, tmpN);
      const facing = tmpN.dot(camDir);
      visible = facing > 0.45 && (dist < 2.6 || i === activeIdx || i === hoverIdx);
      if (visible) {
        tmpV.copy(earthCenter).addScaledVector(tmpN, 1 + markers.heights[i] + 0.01).project(camera);
        const x = (tmpV.x * 0.5 + 0.5) * w;
        const y = (-tmpV.y * 0.5 + 0.5) * h;
        L.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -130%)`;
        L.el.style.opacity = Math.min(1, (facing - 0.45) * 4).toFixed(2);
        L.el.classList.toggle('active', i === activeIdx);
      }
    }
    if (visible !== L.shown) {
      L.el.style.display = visible ? 'block' : 'none';
      L.shown = visible;
    }
  }
}

// ---------- Resize ----------
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ---------- Context loss safety ----------
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
  frameN++;
  if (frameN < 60) return;
  const avg = frameAcc / frameN;
  frameAcc = frameN = 0;
  const now = performance.now();
  if (avg > 1 / 42 && pixelRatio > 0.75) {
    prCeiling = pixelRatio - 0.25; // don't climb back to a level that struggled
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
let elapsed = 0;
let lastT = performance.now();
function frame(now = performance.now()) {
  const raw = Math.max(0, (now - lastT) / 1000);
  lastT = now;
  const dt = Math.min(raw, 0.05); // clamp so tab switches never cause jumps
  elapsed += dt;

  stepTweens(Math.min(raw, 0.25)); // camera moves keep wall-clock timing even on slow devices
  solar.update(dt, elapsed, orbitsOn);
  if (orbitsOn) {
    earthPivot.rotation.y += dt * 0.05 * 0.32;
    earth.spin.rotation.y += dt * 0.25;
  }
  earth.clouds.rotation.y += dt * 0.006;

  earthWorldCenter();
  sunDirTmp.copy(solar.sun.position).sub(earthCenter).normalize();
  earth.uniforms.sunDir.value.copy(sunDirTmp);

  if (mode === 'earth') {
    const d = camera.position.distanceTo(earthCenter);
    controls.rotateSpeed = THREE.MathUtils.clamp((d - 1) * 0.35, 0.08, 0.9);
    controls.zoomSpeed = 0.9;
    const idle = performance.now() - lastInteraction > 6000;
    controls.autoRotate = idle && !market.isOpen() && !camTween;
    controls.autoRotateSpeed = 0.35;
  }
  if (controls.enabled) controls.update(dt);

  if (pointerDirty) pick();
  applyViewOffset(dt);
  sky.position.copy(camera.position);
  markers.update(elapsed, pixelRatio);
  updateLabels();
  renderer.render(scene, camera);
  adapt(raw);
}

// ---------- Boot ----------
setHud('intro');
manager.onLoad = () => {
  $('#loader').classList.add('done');
  lastT = performance.now();
  renderer.setAnimationLoop(frame);
  const p0 = camera.position.clone();
  tween(
    3.5,
    (e) => {
      camera.position.lerpVectors(p0, SOLAR_VIEW, e);
      camera.lookAt(0, 0, 0);
    },
    { exclusive: true }
  ).then((done) => {
    if (!done || mode !== 'intro') return;
    controls.minDistance = 25;
    controls.maxDistance = 900;
    controls.enabled = true;
    mode = 'solar';
    setHud('solar');
  });
  // Auto-land if the visitor just watches
  setTimeout(() => {
    if (mode === 'solar' && performance.now() - lastInteraction > 6000) {
      $('#hero').classList.add('gone');
      enterEarth();
    }
  }, 9000);
};
manager.onError = (url) => console.warn('Texture failed:', url);
// pre-compile shaders while textures stream in to avoid first-frame hitches
renderer.compile(scene, camera);
