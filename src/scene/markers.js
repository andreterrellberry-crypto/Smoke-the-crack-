import * as THREE from 'three';
import { latLngToVec3, EARTH_RADIUS } from './earth.js';

const BASE = new THREE.Color('#ff3d2e');
const HOVER = new THREE.Color('#ffd23f');
const ACTIVE = new THREE.Color('#5cf2ff');

// One draw call each for beams, pulses and hit targets, regardless of location count.
export function createMarkers(parent, locations, counts) {
  const n = locations.length;
  const up = new THREE.Vector3(0, 1, 0);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const normals = locations.map((l) => latLngToVec3(l.lat, l.lng, 1));
  const maxCount = Math.max(...Object.values(counts));

  const beamGeo = new THREE.CylinderGeometry(0.005, 0.005, 1, 6, 1, true).translate(0, 0.5, 0);
  const beams = new THREE.InstancedMesh(
    beamGeo,
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    n
  );
  const hitGeo = new THREE.SphereGeometry(0.055, 8, 6);
  const hits = new THREE.InstancedMesh(hitGeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), n);

  const heights = [];
  locations.forEach((loc, i) => {
    const nrm = normals[i];
    const h = 0.06 + 0.14 * ((counts[loc.id] || 1) / maxCount);
    heights.push(h);
    q.setFromUnitVectors(up, nrm);
    m.compose(nrm.clone().multiplyScalar(EARTH_RADIUS), q, s.set(1, h, 1));
    beams.setMatrixAt(i, m);
    beams.setColorAt(i, BASE);
    m.compose(nrm.clone().multiplyScalar(EARTH_RADIUS + h * 0.5), q, s.set(1, 1, 1));
    hits.setMatrixAt(i, m);
  });
  beams.instanceColor.needsUpdate = true;
  beams.raycast = () => {};
  beams.frustumCulled = false;
  hits.frustumCulled = false;

  // Pulsing ground rings + tip glows as GPU points
  const pos = new Float32Array(n * 2 * 3);
  const phase = new Float32Array(n * 2);
  const kind = new Float32Array(n * 2);
  const state = new Float32Array(n * 2);
  locations.forEach((_, i) => {
    const base = normals[i].clone().multiplyScalar(EARTH_RADIUS * 1.002);
    const tip = normals[i].clone().multiplyScalar(EARTH_RADIUS + heights[i]);
    pos.set(base.toArray(), i * 6);
    pos.set(tip.toArray(), i * 6 + 3);
    phase[i * 2] = phase[i * 2 + 1] = Math.random() * 6.28;
    kind[i * 2] = 0;
    kind[i * 2 + 1] = 1;
  });
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  pg.setAttribute('kind', new THREE.BufferAttribute(kind, 1));
  pg.setAttribute('state', new THREE.BufferAttribute(state, 1));
  const pointsMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, pxRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float phase; attribute float kind; attribute float state;
      uniform float time; uniform float pxRatio;
      varying float vKind; varying float vT; varying float vState;
      void main(){
        vKind = kind; vState = state;
        vT = fract(time * 0.6 + phase / 6.2831);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float size = kind > 0.5 ? (10.0 + state * 6.0) : (28.0 + vT * 40.0 + state * 30.0);
        gl_PointSize = size * pxRatio * (2.2 / -mv.z);
        gl_PointSize = clamp(gl_PointSize, 2.0, 90.0 * pxRatio);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vKind; varying float vT; varying float vState;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float r = length(c);
        if (r > 0.5) discard;
        vec3 base = vState > 1.5 ? vec3(0.36,0.95,1.0) : (vState > 0.5 ? vec3(1.0,0.82,0.25) : vec3(1.0,0.24,0.18));
        float a;
        if (vKind > 0.5) a = smoothstep(0.5, 0.0, r);
        else a = smoothstep(0.06, 0.0, abs(r - 0.42)) * (1.0 - vT);
        gl_FragColor = vec4(base * a, a);
      }`,
  });
  const points = new THREE.Points(pg, pointsMat);
  points.raycast = () => {};
  points.frustumCulled = false;

  parent.add(beams, hits, points);

  let hovered = -1;
  let active = -1;
  function paint() {
    for (let i = 0; i < n; i++) {
      const st = i === active ? 2 : i === hovered ? 1 : 0;
      beams.setColorAt(i, st === 2 ? ACTIVE : st === 1 ? HOVER : BASE);
      state[i * 2] = state[i * 2 + 1] = st;
    }
    beams.instanceColor.needsUpdate = true;
    pg.attributes.state.needsUpdate = true;
  }

  return {
    hits,
    normals,
    heights,
    setHovered(i) {
      if (i !== hovered) {
        hovered = i;
        paint();
      }
    },
    setActive(i) {
      if (i !== active) {
        active = i;
        paint();
      }
    },
    setVisible(v) {
      beams.visible = points.visible = hits.visible = v;
    },
    update(t, pxRatio) {
      pointsMat.uniforms.time.value = t;
      pointsMat.uniforms.pxRatio.value = pxRatio;
    },
  };
}
