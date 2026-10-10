import * as THREE from 'three';

export const EARTH_RADIUS = 1;

// lat/lng -> local unit vector matching SphereGeometry's UV layout
export function latLngToVec3(lat, lng, r = EARTH_RADIUS, target = new THREE.Vector3()) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return target.set(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

const earthVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main(){
    vUv = uv;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position,1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const earthFrag = /* glsl */ `
  uniform sampler2D dayMap, nightMap, waterMap, bumpMap;
  uniform vec3 sunDir; uniform float dayOnly;
  varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main(){
    float h = texture2D(bumpMap, vUv).r;
    vec3 n = normalize(vN);
    vec3 L = normalize(sunDir);
    vec3 V = normalize(cameraPosition - vW);
    float d = dot(n, L);
    float k = mix(smoothstep(-0.18, 0.22, d), 1.0, dayOnly);
    vec3 day = texture2D(dayMap, vUv).rgb * (0.9 + h * 0.25);
    vec3 night = texture2D(nightMap, vUv).rgb;
    float lambert = mix(clamp(dot(n, L), 0.0, 1.0) * 0.95 + 0.12, 1.0, dayOnly);
    vec3 col = mix(night * vec3(1.6, 1.35, 1.0) + day * 0.025, day * lambert, k);
    float water = texture2D(waterMap, vUv).r;
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(n, H), 0.0), 140.0) * water * 0.45 * k * (1.0 - dayOnly);
    col += vec3(1.0, 0.92, 0.8) * spec;
    float rim = pow(1.0 - max(dot(n, V), 0.0), 2.6);
    col += vec3(0.3, 0.55, 1.0) * rim * 0.55 * clamp(d + 0.35 + dayOnly, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

const cloudFrag = /* glsl */ `
  uniform sampler2D cloudMap; uniform vec3 sunDir; uniform float dayOnly; uniform float opacity;
  varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main(){
    float a = texture2D(cloudMap, vUv).r;
    float d = dot(normalize(vN), normalize(sunDir));
    float lit = mix(clamp(d * 0.95 + 0.06, 0.03, 0.92), 0.92, dayOnly);
    gl_FragColor = vec4(vec3(lit), a * opacity);
    #include <colorspace_fragment>
  }`;

const atmoVert = /* glsl */ `
  varying vec3 vN; varying vec3 vW;
  void main(){
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const atmoFrag = /* glsl */ `
  uniform vec3 sunDir; uniform float dayOnly;
  varying vec3 vN; varying vec3 vW;
  void main(){
    vec3 V = normalize(cameraPosition - vW);
    float i = pow(clamp(0.72 + dot(vN, V), 0.0, 1.0), 4.0);
    float lit = mix(clamp(dot(vN, normalize(sunDir)) + 0.45, 0.08, 1.0), 1.0, dayOnly);
    gl_FragColor = vec4(vec3(0.28, 0.58, 1.0) * i * 1.6 * lit, 1.0);
  }`;

export function createEarth(loader, renderer) {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (url, srgb) => {
    const t = loader.load(url);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, maxAniso);
    return t;
  };

  const uniforms = {
    dayMap: { value: tex('textures/earth-day.jpg', true) },
    nightMap: { value: tex('textures/earth-night.jpg', true) },
    waterMap: { value: tex('textures/earth-water.jpg') },
    bumpMap: { value: tex('textures/earth-bump.jpg') },
    sunDir: { value: new THREE.Vector3(1, 0, 0) },
    dayOnly: { value: 0 },
  };

  const group = new THREE.Group(); // orbit position + axial tilt
  const spin = new THREE.Group(); // daily rotation; markers live here
  group.add(spin);

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, 128, 64),
    new THREE.ShaderMaterial({ uniforms, vertexShader: earthVert, fragmentShader: earthFrag })
  );
  globe.name = 'earth';
  spin.add(globe);

  const cloudUniforms = {
    cloudMap: { value: tex('textures/earth-clouds.jpg') },
    sunDir: uniforms.sunDir,
    dayOnly: uniforms.dayOnly,
    opacity: { value: 0.8 },
  };
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 96, 48),
    new THREE.ShaderMaterial({ uniforms: cloudUniforms, vertexShader: earthVert, fragmentShader: cloudFrag, transparent: true, depthWrite: false })
  );
  clouds.raycast = () => {};
  spin.add(clouds);

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.15, 64, 32),
    new THREE.ShaderMaterial({
      uniforms: { sunDir: uniforms.sunDir, dayOnly: uniforms.dayOnly },
      vertexShader: atmoVert,
      fragmentShader: atmoFrag,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  );
  atmo.raycast = () => {};
  group.add(atmo);

  return { group, spin, globe, clouds, uniforms, cloudUniforms };
}
