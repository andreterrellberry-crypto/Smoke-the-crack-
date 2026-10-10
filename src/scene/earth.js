import * as THREE from 'three';

export const EARTH_RADIUS = 1;

// lat/lng -> local unit vector matching SphereGeometry's UV layout
export function latLngToVec3(lat, lng, r = EARTH_RADIUS, target = new THREE.Vector3()) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return target.set(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

const vert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main(){
    vUv = uv;
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position,1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

// Light follows the camera so whatever the shopper looks at is always lit.
const earthFrag = /* glsl */ `
  uniform sampler2D dayMap, waterMap, bumpMap;
  uniform vec3 lightDir;
  varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main(){
    vec3 n = normalize(vN);
    vec3 L = normalize(lightDir);
    vec3 V = normalize(cameraPosition - vW);
    float h = texture2D(bumpMap, vUv).r;
    vec3 day = texture2D(dayMap, vUv).rgb * (0.9 + h * 0.25);
    float lambert = clamp(dot(n, L), 0.0, 1.0) * 0.75 + 0.3;
    vec3 col = day * lambert;
    float water = texture2D(waterMap, vUv).r;
    vec3 H = normalize(L + V);
    col += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, H), 0.0), 220.0) * water * 0.12;
    float rim = pow(1.0 - max(dot(n, V), 0.0), 2.6);
    col += vec3(0.3, 0.55, 1.0) * rim * 0.5;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

const cloudFrag = /* glsl */ `
  uniform sampler2D cloudMap; uniform vec3 lightDir; uniform float opacity;
  varying vec2 vUv; varying vec3 vN; varying vec3 vW;
  void main(){
    float a = texture2D(cloudMap, vUv).r;
    float lit = clamp(dot(normalize(vN), normalize(lightDir)) * 0.6 + 0.4, 0.3, 0.92);
    gl_FragColor = vec4(vec3(lit), a * opacity);
    #include <colorspace_fragment>
  }`;

const atmoFrag = /* glsl */ `
  varying vec3 vN; varying vec3 vW;
  void main(){
    vec3 V = normalize(cameraPosition - vW);
    float i = pow(clamp(0.72 + dot(normalize(vN), V), 0.0, 1.0), 4.0);
    gl_FragColor = vec4(vec3(0.28, 0.58, 1.0) * i * 1.5, 1.0);
  }`;

export function createEarth(loader, renderer) {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (url, srgb) => {
    const t = loader.load(url);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, maxAniso);
    return t;
  };

  const lightDir = { value: new THREE.Vector3(1, 0.4, 1) };
  const group = new THREE.Group();

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, 128, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: tex('textures/earth-day.jpg', true) },
        waterMap: { value: tex('textures/earth-water.jpg') },
        bumpMap: { value: tex('textures/earth-bump.jpg') },
        lightDir,
      },
      vertexShader: vert,
      fragmentShader: earthFrag,
    })
  );
  group.add(globe);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 96, 48),
    new THREE.ShaderMaterial({
      uniforms: { cloudMap: { value: tex('textures/earth-clouds.jpg') }, lightDir, opacity: { value: 0.55 } },
      vertexShader: vert,
      fragmentShader: cloudFrag,
      transparent: true,
      depthWrite: false,
    })
  );
  clouds.raycast = () => {};
  group.add(clouds);

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.15, 64, 32),
    new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: atmoFrag,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  );
  atmo.raycast = () => {};
  group.add(atmo);

  return { group, globe, clouds, lightDir };
}
