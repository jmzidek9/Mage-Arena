// Mage Arena core: helpers, renderer + scene, Blender assets, shaders, arena ambience, viewmodel,
// VFX primitives, particles, sound and input. Loaded as a classic script after index.html put THREE
// and the parsed glb scenes (window.GLB) on window, so every js/*.js file shares one global scope.
'use strict';
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const r2 = v => Math.round(v * 100) / 100;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const TAU = Math.PI * 2;
const easeOut = k => 1 - (1 - k) ** 3;
const easeOutBack = x => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
const lerpAngle = (a, b, k) => a + ((((b - a + Math.PI) % TAU) + TAU) % TAU - Math.PI) * k;
const css = hex => '#' + new THREE.Color(hex).getHexString();
function weighted(items, w) { let t = items.reduce((s, x) => s + w(x), 0) * Math.random(); for (const x of items) if ((t -= w(x)) <= 0) return x; return items[items.length - 1]; }

const ARENA_R = 21.4;
const PILLARS = [];

// ===================== renderer & scene =====================
let HQ = true; // let: auto quality may switch this off at runtime
try { HQ = localStorage.getItem('magepact_gfx') !== 'low'; } catch {}
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(HQ ? Math.min(devicePixelRatio, 2) : 1);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = HQ;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0e0f13, 0.007);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 1800);
camera.rotation.order = 'YXZ';
scene.add(camera);
const uTime = { value: 0 };

// shared GLSL value noise + fbm for sky, clouds, and enemy dissolves
const GLSL_NOISE = `
float hash3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * noise3(p); p *= 2.03; a *= .5; } return v; }`;

// End sky, matched to the Iteration T shader's End: near-black space, a giant ringed planet, and a black hole
// (dark shadow, white-hot lensed halo on top, thin arc underneath, a disk trailing off into an orange dust tail).
// Purely painted on the sky dome: the map and its lighting don't change.
const BH = V(.75, .46, -.57).normalize(), BH_R = .085; // BH_R: shadow radius in radians
const BH_L = V().crossVectors(V(0, 1, 0), BH).normalize(); // screen-left of the black hole
const PLANET = BH.clone().multiplyScalar(Math.cos(1.05)).addScaledVector(BH_L, Math.sin(1.05)).add(V(0, -.45, 0)).normalize(), PLANET_R = .78;
const RINGN = V(-.41, .849, .334).normalize(); // ring plane normal: rings sweep under the black hole to the right horizon
const skyU = { uTime, uFlare: { value: 0 }, uBH: { value: BH }, uP: { value: PLANET }, uPR: { value: PLANET_R }, uRingN: { value: RINGN } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: `varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform float uTime, uPR, uFlare; uniform vec3 uBH, uP, uRingN; varying vec3 vp; ${GLSL_NOISE}
  vec3 space(vec3 d){
    float h = d.y;
    vec3 col = mix(vec3(.07,.07,.075), vec3(.012,.014,.02), smoothstep(-.05,.5,h));
    col += vec3(.035,.035,.04) * fbm(d * 3. + 2.) * smoothstep(0.,.6,h); // faint dust
    // giant planet: distance 1 along uP, radius sin(uPR)
    float Rp = sin(uPR), cP = dot(d, uP), disc = cP * cP - (1. - Rp * Rp), tP = disc > 0. && cP > 0. ? cP - sqrt(disc) : 1e9;
    float a = acos(clamp(cP, -1., 1.));
    vec3 toBH = normalize(uBH - uP * dot(uBH, uP)), side3 = d - uP * cP;
    float side = length(side3) > 1e-4 ? smoothstep(-.3,.8,dot(normalize(side3), toBH)) : 0.;
    if (tP < 1e8) {
      float band = fbm(vec3(dot(d - uP, uRingN) * 26., 1., 3.));
      col = mix(col, vec3(.085,.085,.09) * (.85 + .3 * band), .85) + vec3(.13,.12,.11) * side * side * smoothstep(uPR - .3, uPR, a);
    }
    col += vec3(.9,.88,.82) * exp(-pow((a - uPR) * 140., 2.)) * (.15 + .85 * side) * 1.4; // sunlit limb
    // rings: the view ray hits the ring plane through the planet's centre
    float dn = dot(d, uRingN);
    if (abs(dn) > 1e-4) {
      float t = dot(uP, uRingN) / dn;
      if (t > 0. && t < tP) {
        float rho = length(d * t - uP) / Rp;
        float ring = smoothstep(1.25,1.4,rho) * smoothstep(2.9,2.3,rho) * (.3 + .7 * fbm(vec3(rho * 22., 1., 2.)));
        ring *= 1. - .85 * exp(-pow((rho - 1.95) * 22., 2.)); // a dark gap
        col += vec3(.6,.55,.47) * ring * .9;
      }
    }
    return col;
  }
  void main(){
    vec3 d = normalize(vp);
    // black hole frame, disk tilted a little off horizontal; q is in units of the shadow radius, +x = screen left
    vec3 bx = normalize(cross(vec3(0.,1.,0.), uBH)), by = cross(uBH, bx);
    vec3 tx = bx * .99 + by * .12, ty = by * .99 - bx * .12;
    float fwd = dot(d, uBH);
    vec2 q = fwd > 0. ? vec2(dot(d, tx), dot(d, ty)) / ${BH_R.toFixed(3)} : vec2(1e3);
    float r = length(q);
    // lensing: what's behind the hole is sampled from closer to its centre
    vec3 perp = d - uBH * fwd, sd = d;
    if (r < 14. && r > .5) sd = normalize(d - normalize(perp) * min(.08, ${(BH_R * BH_R * 1.6).toFixed(5)} / (r * ${BH_R.toFixed(3)})));
    vec3 col = space(sd);
    if (r < 14.) {
      vec3 white = vec3(1.,.97,.92), amber = vec3(1.,.55,.22), dust = vec3(.55,.36,.22);
      float fl = 1. + uFlare * 1.6; white *= fl; amber *= fl;    // flares on Singularity and boss waves
      float sh = smoothstep(.97,1.03,r);
      col = col * sh + vec3(.035,.04,.05) * (1. - sh);                                   // dark slate shadow
      float up = smoothstep(-.15,.5,q.y / r), dw = smoothstep(-.15,.5,-q.y / r);
      col += white * smoothstep(1.,1.08,r) * smoothstep(1.8,1.12,r) * up * 2.4;        // thick white halo over the top
      col += white * smoothstep(1.,1.05,r) * smoothstep(1.32,1.07,r) * dw * 2.;        // thin arc underneath
      col += white * exp(-pow((r - 1.02) * 30., 2.)) * 1.5;                            // photon ring
      col += white * exp(-(r - 1.) * 1.6) * .35 * step(1., r);                         // soft glow
      // the disk crosses just below the centre: white-hot near the hole, orange dust trailing off to screen right
      float y0 = q.y + .3, ax = abs(q.x), right = smoothstep(.3,-1.,q.x), len = mix(2.6, 8.5, right);
      float disk = smoothstep(.16 + .06 * ax, 0., abs(y0)) * smoothstep(len, len * .35, ax);
      vec3 dc = mix(white, mix(amber, dust, smoothstep(3.,7.,ax)), smoothstep(1.2,3.5,ax) * right);
      col += disk * dc * (.7 + .5 * fbm(vec3(ax * 2. - uTime * .5, y0 * 10., 1.))) * mix(2., 1.1, smoothstep(1.,4.,ax));
      col += dust * exp(-abs(y0) * 2.5) * smoothstep(10.,2.,ax) * right * .14;         // dusty haze round the tail
    }
    gl_FragColor = vec4(col, 1.); }`,
}));
scene.add(sky);
const skyBits = [sky]; // the open-sky scenery the dungeon hides
{ // faint stars (none inside the black hole or in front of the planet), a few big enough to bloom
  const n = 1600, pos = new Float32Array(n * 3), sz = new Float32Array(n), ph = new Float32Array(n), v = V();
  for (let i = 0; i < n; i++) {
    v.randomDirection(); if (v.y < .02) v.y = Math.abs(v.y) + .02;
    v.normalize().multiplyScalar(1400); pos.set([v.x, v.y, v.z], i * 3);
    sz[i] = Math.random() < .012 ? rand(3.5, 5) : rand(1, 2.2); ph[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('sz', new THREE.BufferAttribute(sz, 1)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const stars = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: skyU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute float sz; attribute float ph; uniform float uTime, uPR; uniform vec3 uBH, uP; varying float vA;
      void main(){ vec3 n = normalize(position); vA = .55 + .45 * sin(uTime * (1.3 + ph * 2.) + ph * 40.);
        gl_PointSize = dot(n, uBH) > ${Math.cos(BH_R * 1.4).toFixed(6)} || dot(n, uP) > cos(uPR) ? 0. : sz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vec3(.9,.9,1.) * vA * smoothstep(.5,0.,d) * 1.3, 1.); }`,
  }));
  scene.add(stars); skyBits.push(stars);
}
// sea of clouds the island floats over (two layers for parallax)
for (const [y, seed, alpha, hole] of [[-17, 0, 1, 1], [-9, 5, .45, 70]]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, uniforms: { uTime },
    vertexShader: `varying vec3 wp; void main(){ wp = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.); }`,
    fragmentShader: `uniform float uTime; varying vec3 wp; ${GLSL_NOISE}
    void main(){
      vec2 p = wp.xz * .011 + ${seed.toFixed(1)};
      float n = fbm(vec3(p + vec2(uTime * .006, uTime * .002), uTime * .01)) * .75 + fbm(vec3(p * 3.1 - uTime * .01, 2.)) * .35;
      float c = smoothstep(.38,.8,n);
      vec3 col = mix(vec3(.035,.035,.04), vec3(.3,.28,.26), c) + vec3(.45,.4,.34) * pow(c, 3.) * .2;
      float r = length(wp.xz);
      gl_FragColor = vec4(col, (.35 + .65 * c) * ${alpha.toFixed(2)} * smoothstep(1500., 250., r) * smoothstep(${(hole * .4).toFixed(1)}, ${hole.toFixed(1)}, r)); }`,
  }));
  m.position.y = y; m.renderOrder = -1; scene.add(m); skyBits.push(m);
}

// key light from the black hole (warm white, soft shadows), a neutral grey sky fill with warm dust bounce from below,
// and a faint cool rim from the opposite side so silhouettes read against the dark sky
const hemi = new THREE.HemisphereLight(0x8d94a8, 0x2b241d, 0.35); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xfff0d8, 2); // named moon for history; it's the black hole's light now
moon.position.copy(BH).multiplyScalar(70);
const rim = new THREE.DirectionalLight(0x6f86b8, .35);
rim.position.set(-BH.x, .35, -BH.z).multiplyScalar(70); scene.add(rim);
moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -.0004; moon.shadow.normalBias = .04;
Object.assign(moon.shadow.camera, { left: -27, right: 27, top: 27, bottom: -27, near: 10, far: 160 });
moon.shadow.camera.updateProjectionMatrix();
scene.add(moon);
{ // image-based lighting from the sky, so gold and bronze actually reflect something
  const pmrem = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene();
  envScene.add(sky.clone());
  scene.environment = pmrem.fromScene(envScene, .02).texture; scene.environmentIntensity = .7;
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = HQ ? new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.48, 0.45, 1.0) : null;
if (bloomPass) composer.addPass(bloomPass);
composer.addPass(new OutputPass());
const filmPass = new ShaderPass({ // film look: cool shadows, warm highlights, a touch of fringe, vignette, grain (+ time-stop grey, flashes)
  uniforms: { tDiffuse: { value: null }, uTime, uGray: { value: 0 }, uWhite: { value: 0 }, uFilm: { value: 1 }, uTint: { value: new THREE.Vector3(0, 0, 0) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uGray, uWhite, uFilm; uniform vec3 uTint; varying vec2 vUv;
  void main(){
    vec2 c = vUv - .5; float r = dot(c, c); vec2 off = c * r * (.01 * uFilm + uGray * .04);
    vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b), raw = col;
    float l = dot(col, vec3(.299,.587,.114));
    col *= mix(vec3(.92,.95,1.12), vec3(1.06,1.,.94), smoothstep(.15,.8,l));
    col = mix(vec3(l), col, 1.15);
    col *= 1. - r * .85;
    col += (fract(sin(dot(vUv * 1000. + uTime, vec2(12.9898,78.233))) * 43758.5453) - .5) * .022;
    col = mix(raw, col, uFilm); // Visuals > Film filter off: skip grade, vignette and grain
    float g = dot(col, vec3(.299,.587,.114)); col = mix(col, vec3(g) * vec3(1.08, 1., .82), uGray);
    col += uTint * (.4 + r); col = mix(col, vec3(1.), uWhite);
    gl_FragColor = vec4(col, 1.); }`,
});
composer.addPass(filmPass);
function setLowQuality() {
  if (!HQ) return;
  HQ = false;
  if (bloomPass) bloomPass.enabled = false;
  renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; moon.castShadow = false;
  scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  composer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

// ===================== Blender assets =====================
// index.html parsed every glb before loading the scripts (window.GLB); see blender/build_*.py
const { arena, duel: duelG, fp_rig: rig, spells: spellsG, enemies: enemiesG, wizard: wizardG, elements: elementsG } = window.GLB;
for (const root of [arena, duelG, rig, spellsG, enemiesG, wizardG, elementsG]) root.traverse(o => { if (o.isMesh) o.material.emissiveIntensity *= .6; });
// solid things cast and catch moon shadows; glowing bits (eyes, flames, crystals, sigils) don't cast
const glows = m => m.emissive && m.emissive.getHex() && m.emissiveIntensity > .4;
for (const root of [arena, duelG, enemiesG, wizardG]) root.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = !glows(o.material) && !/sigil_/.test(o.parent?.name + o.name); } });
rig.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
// Blender dedupes names across the .blend (ring_outer, ring_outer.001 -> "ring_outer001"), so ignore numeric suffixes
const grab = (root, name) => { const o = root.children.find(c => c.name.replace(/\d+$/, '') === name); o.position.set(0, 0, 0); return o; };
const CIRCLE_PARTS = ['ring_outer', 'runes', 'ring_inner', 'sigil'];
// elements.glb names everything "<element>__<part>" (unique, so no dedupe suffixes)
const NODE = {};
for (const o of [...elementsG.children]) { NODE[o.name] = o; o.position.set(0, 0, 0); }
const CTPL = { sigil: CIRCLE_PARTS.map(n => { const o = arena.getObjectByName('sigil_' + n).clone(); o.position.set(0, 0, 0); o.scale.set(1, 1, 1); return o; }) };
for (const n in NODE) { const m = n.match(/^(\w+?)__ring_outer$/); if (m) CTPL[m[1]] = CIRCLE_PARTS.map(p => NODE[m[1] + '__' + p]); }
const sp = n => grab(spellsG, n);
const T = {
  fireball: ['fireball_core', 'fireball_shell', 'fireball_tail'].map(sp), shard: sp('ice_shard'), spike: sp('ice_spike'),
  bolt: sp('bolt'), shock: sp('shockwave'), steam: sp('steam_burst'), shatter: sp('shatter_burst'), overload: sp('overload_burst'),
  beam: sp('beam'), disc: sp('glow_disc'),
};
const WIZ = grab(wizardG, 'wizard'); // your partner's third-person body

// shader looks for Blender meshes that need motion: fire, mana falls, cast light pillars and ground glow
const addShader = (frag, extraU = {}) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime, ...extraU },
  vertexShader: `varying vec3 lp; varying vec2 vUv; void main(){ lp = position; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform float uTime; varying vec3 lp; varying vec2 vUv; ${GLSL_NOISE}\n${frag}`,
});
const FIRE_MAT = addShader(`void main(){
  float h = clamp(lp.y / 1.25, 0., 1.), n = fbm(vec3(lp.x * 3., lp.y * 2.6 - uTime * 2.4, lp.z * 3.));
  float a = smoothstep(.25, .7, n + (1. - h) * .5 - h * .2) * (1. - h);
  gl_FragColor = vec4(mix(vec3(1.,.8,.4) * 1.5, vec3(1.,.22,.04) * .9, smoothstep(0.,.7,h)) * a * .8, a); }`);
// per-instance animated flame (FIRE_MAT look + fade), for element flame tongues
const flameMat = () => addShader(`uniform float uA; void main(){
  float h = clamp(lp.y / 1.4, 0., 1.), n = fbm(vec3(lp.x * 4.5, lp.y * 3.2 - uTime * 3.4, lp.z * 4.5));
  float tongue = fbm(vec3(lp.x * 9., lp.y * 1.4 - uTime * 4.5, lp.z * 9.));
  float a = smoothstep(.42, .72, n * .6 + tongue * .55 + (1. - h) * .45 - h * .35) * (1. - h * h) * uA;
  gl_FragColor = vec4(mix(vec3(1.,.8,.4) * 1.3, vec3(1.,.22,.04) * .8, smoothstep(0.,.7,h)) * a * .55, a); }`, { uA: { value: 1 } });
// tsunami water: deep-to-light gradient up the face, foam on the crest, streaks rushing down (UV v = height)
const waveMat = () => Object.assign(addShader(`uniform float uA; void main(){
  float crest = smoothstep(.55, 1., vUv.y), n = fbm(vec3(vUv.x * 12., vUv.y * 6. - uTime * 1.5, uTime * .3));
  float streak = smoothstep(.55, .9, fbm(vec3(vUv.x * 30., vUv.y * 3. + uTime * 3., 1.)));
  vec3 col = mix(vec3(.02, .16, .5), vec3(.25, .7, 1.), vUv.y) + vec3(.9, .97, 1.) * (crest * smoothstep(.45, .75, n) + streak * .3);
  float a = (.6 + .35 * vUv.y) * smoothstep(0., .08, vUv.x) * smoothstep(1., .92, vUv.x) * uA;
  gl_FragColor = vec4(col * 1.25, a); }`, { uA: { value: 1 } }), { blending: THREE.NormalBlending });
const MANA_MAT = addShader(`void main(){
  float s = smoothstep(.45, .8, fbm(vec3(vUv.x * 7., vUv.y * 5. - uTime * 1.3, 1.)));
  float a = (s * .8 + .22) * smoothstep(0.,.2,vUv.x) * smoothstep(1.,.8,vUv.x) * smoothstep(1.,.5,vUv.y) * smoothstep(0.,.03,vUv.y);
  gl_FragColor = vec4(mix(vec3(.2,.6,1.), vec3(.85,1.,1.), s) * 2. * a, a); }`);
const beamMat = color => addShader(`uniform vec3 uColor; uniform float uA; void main(){
  float s = .55 + .45 * noise3(vec3(lp.x * 3., lp.y * 4. - uTime * 3., lp.z * 3.)), a = pow(1. - lp.y, 1.7) * s * uA;
  gl_FragColor = vec4(uColor * a, a); }`, { uColor: { value: new THREE.Color(color).multiplyScalar(1.6) }, uA: { value: 1 } });
const discMat = color => addShader(`uniform vec3 uColor; uniform float uA; void main(){
  float a = pow(max(0., 1. - length(lp.xz)), 2.2) * uA; gl_FragColor = vec4(uColor * a, a); }`, { uColor: { value: new THREE.Color(color).multiplyScalar(1.4) }, uA: { value: 1 } });

// rim light + burn-away dissolve on enemies and the partner's wizard
function enhance(m, rim) {
  m.userData.dis = { value: 0 }; m.userData.rim = { value: new THREE.Color(rim) };
  m.onBeforeCompile = s => {
    s.uniforms.uDis = m.userData.dis; s.uniforms.uRim = m.userData.rim;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.)).xyz;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uDis; uniform vec3 uRim; varying vec3 vWp;\n${GLSL_NOISE}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float dn = noise3(vWp * 2.5);
        if (uDis > 0. && dn < uDis) discard;
        totalEmissiveRadiance += vec3(1.,.45,.15) * 7. * smoothstep(uDis + .1, uDis, dn) * step(.001, uDis);
        totalEmissiveRadiance += uRim * pow(1. - abs(dot(normalize(vViewPosition), normal)), 3.) * .7;`);
  };
  m.customProgramCacheKey = () => 'enhanced';
}
// a few point lights that ride along with projectiles so spells light up the arena as they fly
const shotLights = Array.from({ length: 6 }, () => { const l = new THREE.PointLight(0xffffff, 0, 10, 2); scene.add(l); return l; });

scene.add(arena);
const amb = { sig: CIRCLE_PARTS.map(n => arena.getObjectByName('sigil_' + n)), flames: [], lights: [], rocks: [], cry: new Set(), banners: [], monos: [], falls: [] };
arena.traverse(o => {
  if (/^brazier_flame_\d+$/.test(o.name)) { // not its split child meshes (brazier_flame_0_1...), or every brazier spawns 3 lights
    amb.flames.push(o);
    o.traverse(c => { if (c.isMesh) { c.visible = !/core/.test(c.material.name); c.material = FIRE_MAT; c.castShadow = false; } });
    const l = new THREE.PointLight(0xff8a3a, 30, 18, 2); l.position.copy(o.position); l.position.y += .7; scene.add(l); amb.lights.push(l);
  }
  if (/^manafall_\d+$/.test(o.name)) { o.material = MANA_MAT; o.castShadow = false; amb.falls.push(o); }
  if (/^banner_\d+$/.test(o.name)) { const a = TAU * +o.name.split('_')[1] / 8 + TAU / 16; amb.banners.push({ o, axis: V(Math.sin(a), 0, Math.cos(a)) }); }
  if (/^monolith_\d+$/.test(o.name)) amb.monos.push({ o, r: Math.hypot(o.position.x, o.position.z), a: Math.atan2(o.position.z, o.position.x), y: o.position.y, ry: o.rotation.y, ph: Math.random() * TAU });
  if (/^float_rock_\d+$/.test(o.name)) amb.rocks.push({ o, y: o.position.y, ph: Math.random() * TAU });
  if (/^pillar_\d+$/.test(o.name) && !/^pillar_\d+$/.test(o.parent?.name || '')) PILLARS.push( // not its same-named mesh child at (0,0)
    { x: o.position.x, z: o.position.z, r: 1.15 });
  if (o.isMesh && /crystal_/.test(o.material.name)) amb.cry.add(o.material);
});
const cryBase = [...amb.cry].map(m => m.emissiveIntensity);
const ARENA_PILLARS = PILLARS.slice();
// the 1v1 duel platform (blender/build_assets.py): hidden until a duel starts (see showScenery in modes.js)
const DUEL_PILLARS = [], duelAmb = { flames: [], lights: [], rocks: [] };
scene.add(duelG); duelG.visible = false;
duelG.traverse(o => {
  if (/^duel_pillar_\d+$/.test(o.name) && !/^duel_pillar_\d+$/.test(o.parent?.name || '')) DUEL_PILLARS.push({ x: o.position.x, z: o.position.z, r: 1.05 });
  if (/^duel_flame_\d+$/.test(o.name)) {
    duelAmb.flames.push(o);
    o.traverse(c => { if (c.isMesh) { c.material = FIRE_MAT; c.castShadow = false; } });
    const l = new THREE.PointLight(0xff8a3a, 22, 16, 2); l.position.copy(o.position); l.position.y += .7; l.visible = false; scene.add(l); duelAmb.lights.push(l);
  }
  if (/^duel_rock_\d+$/.test(o.name)) duelAmb.rocks.push({ o, y: o.position.y, ph: Math.random() * TAU });
});
// floor sigil in gold to suit the End sky (own material copies: the purple arcane circle is still a cast-circle template)
amb.sig.forEach(s => s.traverse(o => { if (o.isMesh) { const c = /core/.test(o.material.name) ? 0xffe2a0 : 0xd9a441; o.material = o.material.clone(); o.material.color.set(c); o.material.emissive.set(c); o.material.emissiveIntensity = 1.1; } }));

// first-person viewmodel
const vm = new THREE.Group(); camera.add(vm);
const handL = rig.getObjectByName('hand_L'), handR = rig.getObjectByName('hand_R');
vm.add(handL, handR);
handR.position.add(V(.05, -.1, .02)); handR.rotation.z -= .3; // staff leans out of the line of sight
const hL0 = handL.position.clone(), hR0 = handR.position.clone(), hLr = handL.rotation.clone();
const rigMats = {};
vm.traverse(o => { if (o.isMesh && /staff_gem|hand_rune/.test(o.material.name)) rigMats[o.material.name] = o.material = o.material.clone(); });
function tintRig(el) {
  for (const m of Object.values(rigMats)) { m.color.set(EL[el].color); m.emissive.set(EL[el].color); m.emissiveIntensity = 4; }
  document.documentElement.style.setProperty('--el', css(EL[el].color));
}
let vmKick = 0, vmBob = 0;

// ===================== VFX =====================
function glowMats(color) {
  const c = new THREE.Color(color);
  const mk = (col, mul) => new THREE.MeshBasicMaterial({ color: col.multiplyScalar(mul), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  return [mk(c.clone(), 2.2), mk(c.clone().lerp(new THREE.Color(1, 1, 1), .6), 3)];
}
function glowify(obj, mats) { obj.traverse(o => { if (o.isMesh) { o.material = /core/.test(o.material.name) ? mats[1] : mats[0]; o.castShadow = o.receiveShadow = false; } }); return obj; }
const setOpacity = (mats, a) => mats.forEach(m => m.opacity = a);
function makeCircle(el, color = EL[el]?.color ?? 0x9a5cff) {
  const mats = glowMats(color), g = new THREE.Group();
  for (const t of CTPL[el]) g.add(glowify(t.clone(), mats));
  g.userData.mats = mats;
  return g;
}
const SPINS = [1.2, -2, 2.6, -1.1];
const spinCircle = (c, dt, s = 1) => c.children.forEach((ch, i) => ch.rotation.y += SPINS[i] * dt * s);

// additive "energy" look for the glowing parts of element meshes: fresnel rim, flowing noise, per-instance tint + fade
function energyMat(color, core = false, flat = false) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uTime, uColor: { value: new THREE.Color(color) }, uA: { value: 1 }, uCore: { value: core ? 1 : 0 }, uFlat: { value: flat ? 1 : 0 } },
    vertexShader: `varying vec3 vN, vV, lp; void main(){ lp = position; vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uTime, uA, uCore, uFlat; uniform vec3 uColor; varying vec3 vN, vV, lp; ${GLSL_NOISE}
    void main(){
      float f = mix(pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.6), .75, uFlat);
      float n = noise3(lp * 4.5 + vec3(0., -uTime * 2.2, uTime * .7)), band = .5 + .5 * sin(lp.y * 14. - uTime * 6. + n * 4.);
      vec3 c = mix(uColor * 1.7 + vec3(.25) * f, mix(uColor, vec3(1.), .65) * 2.4, uCore);
      float a = mix((.1 + .9 * f) * (.75 + .25 * band), .95, uCore) * (.65 + .6 * n) * uA;
      gl_FragColor = vec4(c, clamp(a, 0., 1.)); }`,
  });
}
// clone an element mesh from elements.glb: *_glow / *_core materials become energy shaders tinted `color`
function model(name, color = 0xffffff, { flat = false, shadow = false, flame = false } = {}) {
  const src = NODE[name];
  if (!src) { console.warn('missing model', name); return Object.assign(new THREE.Group(), { userData: { mats: [] } }); }
  const o = src.clone(), g = flame ? flameMat() : energyMat(color, false, flat), c = flame ? g : energyMat(color, true, flat), mats = flame ? [g] : [g, c];
  o.position.set(0, 0, 0);
  o.traverse(m => {
    if (!m.isMesh) return;
    const n = m.material.name;
    if (/_glow$/.test(n)) m.material = g;
    else if (/_core$/.test(n)) { m.material = c; if (flame) m.visible = false; } // flames read better without the inner core shell
    else { m.material = m.material.clone(); mats.push(m.material); m.castShadow = shadow; m.receiveShadow = true; return; }
    m.castShadow = false;
  });
  o.userData.mats = mats;
  return o;
}
function fade(o, a) {
  for (const m of o.userData.mats || []) {
    if (m.uniforms) m.uniforms.uA.value = a;
    else { if (a < .999 && !m.transparent) { m.transparent = true; m.needsUpdate = true; } m.opacity = a; }
  }
}
const tint = (o, color) => (o.userData.mats || []).forEach(m => m.uniforms?.uColor.value.set(color));

const fx = [];
function addFx(obj, life, update, parent = scene) { parent.add(obj); fx.push({ obj, life, t: 0, update }); return obj; }
function stepFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.t += dt; const k = f.t / f.life;
    if (k >= 1) { f.obj.removeFromParent(); fx.splice(i, 1); continue; }
    f.update(f.obj, k, dt);
  }
}
// the Elemental-Battlegrounds-style cast circle: pops in, counter-rotates its rings, fades
function circleFx(el, pos, radius, { parent = scene, quat = null, life = .75, color } = {}) {
  const c = makeCircle(el, color); c.position.copy(pos); if (quat) c.quaternion.copy(quat);
  return addFx(c, life, (o, k, dt) => {
    o.scale.setScalar(Math.max(.001, radius * easeOutBack(Math.min(1, k * 4))));
    spinCircle(o, dt, 2.2);
    setOpacity(o.userData.mats, (k < .55 ? 1 : 1 - (k - .55) / .45) * (o.userData.dim ?? 1));
  }, parent);
}
// rising light pillar + ground glow under a cast circle
function pillarFx(x, y, z, r, h, color, life = .6) {
  const bm = beamMat(color), dm = discMat(color), b = T.beam.clone(), d = T.disc.clone();
  b.material = bm; d.material = dm; b.castShadow = d.castShadow = false; b.visible = h > 0;
  const g = new THREE.Group(); g.add(b, d); g.position.set(x, y, z);
  addFx(g, life, (o, k) => {
    b.scale.set(r * (1 - k * .3), h * easeOut(Math.min(1, k * 3)), r * (1 - k * .3)); d.scale.setScalar(r * 1.8);
    bm.uniforms.uA.value = (1 - k) ** 1.5; dm.uniforms.uA.value = (1 - k) * 1.2;
  });
}
function ringFx(x, y, z, r, color, life = .45, r0 = .3) {
  const mats = glowMats(color), o = glowify(T.shock.clone(), mats); o.position.set(x, y, z);
  addFx(o, life, (o, k) => { o.scale.setScalar(r0 + (r - r0) * easeOut(k)); setOpacity(mats, 1 - k); });
}
function meshFx(tpl, pos, life, s0, s1, spin = 0) {
  const o = tpl.clone(), mats = [];
  o.traverse(c => { if (c.isMesh) { c.material = c.material.clone(); c.material.transparent = true; c.material.depthWrite = false; mats.push(c.material); } });
  o.position.copy(pos); o.rotation.y = rand(0, TAU);
  addFx(o, life, (o, k, dt) => { o.scale.setScalar(s0 + (s1 - s0) * easeOut(k)); o.rotation.y += spin * dt; mats.forEach(m => m.opacity = 1 - k * k); });
}
function boltFx(pts, color) {
  const mats = glowMats(color);
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = V(...pts[i]), b = V(...pts[i + 1]), L = a.distanceTo(b);
    for (let j = 0; j < 2; j++) {
      const o = glowify(T.bolt.clone(), mats); o.position.copy(a); o.lookAt(b); o.rotateZ(rand(0, TAU));
      o.scale.set(rand(.7, 1.6) * (j ? -1 : 1), rand(.7, 1.6), L);
      addFx(o, .18, (o, k) => setOpacity(mats, (1 - k) * (Math.random() < .3 ? .35 : 1)));
    }
  }
}

// pooled additive particles
const PN = 4000;
const pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3);
const pSize = new Float32Array(PN), pAlpha = new Float32Array(PN), pS0 = new Float32Array(PN), pLife = new Float32Array(PN), pMax = new Float32Array(PN), pGrav = new Float32Array(PN), pDrag = new Float32Array(PN);
let pHead = 0;
const pGeo = new THREE.BufferGeometry();
for (const [n, a, s] of [['position', pPos, 3], ['pcolor', pCol, 3], ['psize', pSize, 1], ['palpha', pAlpha, 1]]) pGeo.setAttribute(n, new THREE.BufferAttribute(a, s).setUsage(THREE.DynamicDrawUsage));
const pts = new THREE.Points(pGeo, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute vec3 pcolor; attribute float psize; attribute float palpha; varying vec3 vC; varying float vA;
    void main(){ vC = pcolor; vA = palpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(psize * (420.0 / -mv.z), 48.0); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec3 vC; varying float vA;
    void main(){ float d = length(gl_PointCoord - .5); if (d > .5 || vA <= 0.) discard; float f = 1. - d * 2., a = pow(f, 1.6) * vA;
      gl_FragColor = vec4(mix(vC, vec3(1.), pow(f, 6.) * .35) * a * 2.2, 1.); }`,
}));
pts.frustumCulled = false; scene.add(pts);
const _c = new THREE.Color(), _v = V();
function emit(x, y, z, vx, vy, vz, color, size, life, grav = 0, drag = 1.5) {
  const i = pHead, j = i * 3; pHead = (pHead + 1) % PN; _c.set(color);
  pPos[j] = x; pPos[j + 1] = y; pPos[j + 2] = z; pVel[j] = vx; pVel[j + 1] = vy; pVel[j + 2] = vz;
  pCol[j] = _c.r; pCol[j + 1] = _c.g; pCol[j + 2] = _c.b; pS0[i] = size; pLife[i] = pMax[i] = life; pGrav[i] = grav; pDrag[i] = drag;
}
function burst(x, y, z, n, color, speed, size, life, grav = 0, up = 0) {
  for (let k = 0; k < n; k++) { const d = _v.randomDirection(); emit(x, y, z, d.x * speed * rand(.3, 1), d.y * speed * rand(.3, 1) + up, d.z * speed * rand(.3, 1), color, size * rand(.6, 1.3), life * rand(.6, 1.2), grav); }
}
function stepParticles(dt) {
  for (let i = 0; i < PN; i++) {
    if (pLife[i] <= 0) continue;
    if ((pLife[i] -= dt) <= 0) { pAlpha[i] = 0; continue; }
    const dr = Math.exp(-pDrag[i] * dt), j = i * 3;
    pVel[j] *= dr; pVel[j + 1] = pVel[j + 1] * dr - pGrav[i] * dt; pVel[j + 2] *= dr;
    pPos[j] += pVel[j] * dt; pPos[j + 1] += pVel[j + 1] * dt; pPos[j + 2] += pVel[j + 2] * dt;
    const k = pLife[i] / pMax[i]; pAlpha[i] = k; pSize[i] = pS0[i] * (.4 + .6 * k);
  }
  for (const n of ['position', 'pcolor', 'psize', 'palpha']) pGeo.attributes[n].needsUpdate = true;
}

// light flashes
const flashes = Array.from({ length: 6 }, () => { const l = new THREE.PointLight(0xffffff, 0, 16, 2); scene.add(l); return { l, t: 0, d: 1, i: 0 }; });
let flashHead = 0;
function flash(x, y, z, color, i = 40, d = .25) { const f = flashes[flashHead++ % flashes.length]; f.l.position.set(x, y, z); f.l.color.set(color); Object.assign(f, { i, t: d, d }); }
function stepFlashes(dt) { for (const f of flashes) { f.t -= dt; f.l.intensity = f.t > 0 ? f.i * f.t / f.d : 0; } }

// floating damage numbers
const nums = [];
function popNum(x, y, z, text, color, cls = '') {
  if (nums.length > 70) return;
  const el = document.createElement('div'); el.className = (text >= 40 ? 'num big ' : 'num ') + cls; el.textContent = text; el.style.color = color; $('hud').appendChild(el);
  nums.push({ el, p: V(x, y, z), t: 0, vx: rand(-.8, .8) });
}
function stepNums(dt) {
  for (let i = nums.length - 1; i >= 0; i--) {
    const n = nums[i]; n.t += dt; n.p.y += dt * 1.6; n.p.x += n.vx * dt;
    if (n.t > .8) { n.el.remove(); nums.splice(i, 1); continue; }
    const s = _v.copy(n.p).project(camera);
    n.el.style.display = s.z > 1 ? 'none' : '';
    n.el.style.left = (s.x * .5 + .5) * innerWidth + 'px'; n.el.style.top = (-s.y * .5 + .5) * innerHeight + 'px';
    n.el.style.opacity = 1 - n.t / .8; n.el.style.scale = 1.3 - n.t * .5;
  }
}
let trauma = 0, fovKick = 0, hurtT = 0;
const shake = a => trauma = Math.min(1, trauma + a);
function banner(text, color = '#fff', dur = 1800) {
  const b = $('banner'); b.textContent = text; b.style.color = color; b.style.opacity = 1;
  clearTimeout(banner.t); banner.t = setTimeout(() => b.style.opacity = 0, dur);
}
function comboText(name, color) { const c = $('combo'); c.textContent = name + '!'; c.style.color = css(color); c.style.textShadow = `0 0 30px ${css(color)}, 0 0 8px #fff`; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }

// ===================== sound: real CC0 recordings (see audio/CREDITS.md), layered and varied =====================
// window.MAGE_AUDIO = { sfx: { name: base64 }, music: { 'file.ogg': base64 } } is packed in by pack.py.
// Every sound is 1-4 layers; each layer picks a random sample whose name starts with its pool, with a little pitch drift,
// so nothing repeats exactly. Layers can be filtered, delayed, reversed, trimmed and sent to a shared reverb.
let AC = null, master, sfxBus, revBus, musicBus;
const lastSfx = {}, SAMPLES = {}, POOLS = {};
let sfxVol = .35, musicVol = .4, voices = 0;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; } // Safari / iOS start audio suspended until a tap
  const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
  AC = new Ctx();
  master = AC.createGain(); master.gain.value = sfxVol;
  const comp = AC.createDynamicsCompressor(); // big moments stack many layers: squash peaks instead of clipping
  comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .25;
  sfxBus = AC.createGain(); sfxBus.connect(comp); comp.connect(master); master.connect(AC.destination);
  // reverb: a generated stone-hall impulse (decaying, darkening noise)
  const len = AC.sampleRate * 2.2 | 0, ir = AC.createBuffer(2, len, AC.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const k = i / len; lp += (Math.random() * 2 - 1 - lp) * (.5 - .42 * k); d[i] = lp * Math.pow(1 - k, 2.6); } }
  const conv = AC.createConvolver(); conv.buffer = ir; revBus = AC.createGain(); revBus.gain.value = .5; revBus.connect(conv); conv.connect(sfxBus);
  const lim = AC.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 3; lim.ratio.value = 12; lim.attack.value = .002; lim.release.value = .2; // music never clips, even at 150%
  musicBus = AC.createGain(); musicBus.gain.value = musicVol; musicBus.connect(lim); lim.connect(AC.destination);
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)).buffer;
  for (const [n, s] of Object.entries(window.MAGE_AUDIO?.sfx || {})) {
    // older Safari can't decode Ogg: those layers are simply skipped
    AC.decodeAudioData(b64(s), buf => { // level every sample by its loudest moment (not its peak), so recipe volumes mean the same thing
      const d0 = buf.getChannelData(0); let pk = 0, loud = 0;
      for (let i = 0; i < d0.length; i += 512) { let q = 0; const e = Math.min(d0.length, i + 1024); for (let j = i; j < e; j++) q += d0[j] * d0[j]; loud = Math.max(loud, Math.sqrt(q / (e - i))); }
      for (let c = 0; c < buf.numberOfChannels; c++) for (const v of buf.getChannelData(c)) pk = Math.max(pk, Math.abs(v));
      const k = Math.min(.3 / loud, 1.5 / pk); // ...but never push a spiky sample's peak far past full scale
      if (loud > 0) for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
      SAMPLES[n] = buf; for (const k in POOLS) delete POOLS[k];
    }, () => {});
  }
}
// layer: [pool (a sample-name prefix, or a list of them), volume, { r: rate or [lo, hi], d: delay, lp / hp: filter Hz, rev: reverb send, rv: reversed, len: trim seconds }]
const SFX = {
  hit: [['impactPunch_medium', .81, { r: [.9, 1.15] }], ['impactGeneric_light', .32, { r: [1, 1.3] }]],
  crit: [['impactPunch_heavy', 1.13], ['impactMetal_light', .52, { r: [1.2, 1.5] }], ['impactGlass_light', .31, { r: [1.3, 1.6], rev: .3 }]],
  die: [['creature_hurt', .54, { r: [.6, .9] }], ['impactSoft_heavy', .74, { r: [.8, 1] }], ['creature_die', .41, { r: [.8, 1.1], d: .04 }]],
  hurt: [['impactPunch_heavy', 1.17, { r: [.75, .9] }], ['impactSoft_heavy', .73, { r: [.7, .8], lp: 900 }]],
  smash: [['impactMining', .84, { r: [.6, .75], rev: .25 }], ['lowFrequency_explosion_001', .96, { r: [.9, 1.1] }], ['stones', .42, { d: .05 }]],
  boom: [['explosionCrunch', .83, { r: [.85, 1.05], rev: .3 }], ['lowFrequency_explosion', .83]],
  ring: [['creature_roar', .83, { r: [.45, .55], rev: .5 }], ['lowFrequency_explosion_000', 1.06], ['explosionCrunch', .41, { r: [.6, .7], lp: 1200 }]],
  spawn: [[['creature_monster_03', 'creature_monster_04'], .23, { r: [.6, .8], rev: .3 }], ['slime_000', .15, { r: .6 }]],
  combo: [['explosionCrunch', .87, { r: [1, 1.15], rev: .4 }], ['impactBell_heavy_000', .67, { r: [.9, 1.1], rev: .6 }], ['magical_3', .74, { rev: .4 }], ['lowFrequency_explosion_001', 1.07]],
  wave: [['impactBell_heavy_001', .89, { r: .5, rev: .7 }], ['lowFrequency_explosion_000', .65, { r: .8 }]],
  pick: [[['item_gem_01', 'item_gem_04'], 1.17, { r: [1, 1.15] }], ['impactBell_heavy_004', .57, { r: 2, rev: .4 }]],
  swap: [['cloth', .5, { r: [1.1, 1.3] }], ['item_gem_02', .33, { r: [1.2, 1.4], rev: .3 }]],
  dash: [['blade', .41, { r: [.55, .7], lp: 3000 }], ['cloth1', .31, { r: [1.3, 1.5] }]],
  dodge: [['blade', .57, { r: [.8, .9] }], ['magical_5', .57, { r: [1.2, 1.3], rev: .5 }], ['impactBell_heavy_004', .28, { r: 2.5, rev: .6 }]],
  ult: [['magical_3', 1, { r: [.8, .9], rev: .5 }], ['forceField', .6, { r: .7 }], ['lowFrequency_explosion_000', 1.06], ['explosionCrunch', .47, { d: .08, rev: .4 }]],
  ready: [['impactBell_heavy_004', .96, { r: 2, rev: .5 }], ['item_gem_04', .82, { r: 1.2 }]],
  heal: [['magical_1_0', .49, { r: [1.1, 1.2], rev: .5 }], ['item_gem_04', .28, { r: 1.3, rev: .4 }]],
  pickup: [['item_coins_01', .82], ['item_gem_01', .58, { r: 1.2 }]],
  stagger: [['impactPlate_heavy', 1.12, { r: .7 }], ['impactMetal_heavy', .71, { r: .8, rev: .3 }]],
  block: [['impactMetal_heavy', 1.55], ['impactPlate_medium', .98, { r: 1.2 }]],
  tele: [['creature_misc_05', .16, { r: .6, lp: 1500 }]],
  fuse: [['metalClick', .21, { r: [1.4, 1.6] }]],
  tink: [['impactGlass_light', 1.24, { r: [1, 1.25], rev: .25 }]],
  resume: [['forceField', .54, { r: 1.3 }], ['magical_2', .54, { rev: .4 }]],
  orb: [['magical_6_0', .29, { r: 1.3 }]],
  step: [['footstep_concrete', .57, { r: [.85, 1.1], lp: 2500 }]],
  stepD: [['footstep_concrete', .62, { r: [.85, 1.05], rev: .15 }]],
  jump: [['cloth', .3, { r: [1.2, 1.4] }]],
  land: [['footstep_concrete', .72, { r: .7 }], ['impactSoft_medium', .51, { r: .8, lp: 600 }]],
  // elements: <el> for the basic attack, <el>_big for everything heavier
  fire: [[['spell_fire_01', 'spell_fire_02', 'spell_fire_05', 'spell_fire_06', 'spell_fire_07'], .53, { r: [1, 1.2], len: .5 }], ['thrusterFire', .16, { len: .3, hp: 500 }]],
  fire_big: [['spell_fire', .93, { r: [.8, .9], rev: .3 }], ['explosionCrunch', .44, { r: .8, rev: .3 }], ['lowFrequency_explosion_001', .6]],
  frost: [['impactGlass_medium', .52, { r: [1.1, 1.3], rev: .3 }], ['magical_5', .35, { r: 1.4, len: .5 }]],
  frost_big: [['impactGlass_heavy', 1.92, { r: [.8, .9], rev: .4 }], ['impactGlass_medium', 1.33, { d: .06, r: .7 }], ['forceField', .74, { r: 1.5, hp: 800 }]],
  storm: [['explosionCrunch_002', .71, { r: [1.6, 1.9], hp: 1500 }], ['impactMetal_light', .4, { r: [1.5, 1.8] }], ['chain', .32, { r: 1.5 }]],
  storm_big: [['explosionCrunch', .82, { r: [1.3, 1.5], hp: 900, rev: .4 }], ['lowFrequency_explosion_000', .69, { d: .12, lp: 300, rev: .6 }], ['chain', .32, { r: 1.3 }]],
  water: [['creature_slime', .43, { r: [.7, .9] }], ['slime_000', .28, { r: .8 }]],
  water_big: [['creature_slime', .71, { r: .5, rev: .4 }], ['impactSoft_heavy', .58, { r: .6 }], ['thrusterFire', .39, { len: .9, lp: 1200, rev: .3 }]],
  earth: [['stones', .86, { r: [.8, 1] }], ['impactMining', .52, { r: .7 }]],
  earth_big: [['impactMining', .76, { r: [.5, .6], rev: .3 }], ['stones_03', .56, { r: .8 }], ['lowFrequency_explosion_001', .81]],
  wind: [['thrusterFire', .53, { len: .4, hp: 1200 }], ['cloth', .56, { r: 1.4 }]],
  wind_big: [['thrusterFire', 1.15, { len: 1.2, hp: 500, rev: .4 }], ['blade', .77, { r: .5 }]],
  nature: [[['wood_03', 'wood_04', 'wood_05'], 1.04, { r: [.9, 1.2] }], ['cloth', .57, { r: 1.6 }]],
  nature_big: [['creak', .66, { r: .8, rev: .3 }], ['impactWood_heavy', .81, { r: .7 }], ['wood_0', .51, { d: .05 }]],
  shadow: [['magical_4', .34, { r: [.6, .7], len: .7, rev: .25 }], ['cloth', .17, { r: .6 }]],
  shadow_big: [['magical_4', .65, { r: .5, rev: .6 }], ['creature_monster_03', .3, { r: .5, rev: .5 }], ['lowFrequency_explosion_000', .45]],
  light: [['magical_7_0', .48, { r: [1.2, 1.3], len: .7, rev: .4 }], ['impactBell_heavy_004', .21, { r: 3, rev: .5 }]],
  light_big: [['impactBell_heavy_000', .67, { r: 1.6, rev: .7 }], ['magical_7_0', .73, { rev: .5 }], ['magical_2', .47, { r: 1.3 }]],
  venom: [['creature_slime', .46, { r: [1.1, 1.3] }], ['slime_000', .26, { r: 1.3 }]],
  venom_big: [['slime_001', .68, { len: .9, r: .8, rev: .3 }], ['creature_slime', .76, { r: .8 }], ['impactSoft_medium', .59]],
  steel: [['blade', .61, { r: [1, 1.15] }], ['impactMetal_light', .34, { r: [1.1, 1.3], d: .03 }]],
  steel_big: [['knifeSlice', 1.05], ['impactMetal_heavy', 1.05, { r: .8, rev: .3 }], ['chain', .57]],
  magma: [['spell_fire', .44, { r: .7 }], ['stones_04', .31, { r: .8 }]],
  magma_big: [['explosionCrunch', .63, { r: [.6, .7], rev: .4 }], ['stones_03', .44, { r: .7 }], ['lowFrequency_explosion_000', .73], ['spell_fire', .44, { r: .6 }]],
  crystal: [[['item_gem_01', 'item_gem_04'], 1.61, { r: [1.1, 1.3], rev: .3 }], ['impactGlass_light', .9, { r: 1.5 }]],
  crystal_big: [['impactGlass_heavy', 3.06, { r: 1.1, rev: .5 }], ['item_gem_04', 2.51, { r: 1.4, rev: .4 }], ['impactBell_heavy_002', 1.57, { r: 2.2, rev: .6 }]],
  sonic: [['impactBell_heavy_003', .52, { r: [1.4, 1.6], rev: .3 }], ['forceField', .42, { r: 1.8, len: .3 }]],
  sonic_big: [['forceField', .51, { r: 1.1, rev: .4 }], ['impactBell_heavy_002', .41, { r: .9, rev: .5 }], ['lowFrequency_explosion_001', .51]],
  gravity: [['forceField', .25, { r: [.5, .55], rev: .2, len: .7 }], ['lowFrequency_explosion_001', .22, { r: .7, len: .6 }]],
  gravity_big: [['lowFrequency_explosion_000', .71, { r: .7, rev: .5 }], ['magical_4', .37, { r: .45, rv: 1, rev: .5 }], ['forceField', .29, { r: .4 }]],
  chrono: [['lock', .33, { r: [1.2, 1.4] }], ['magical_6_0', .33, { r: 1.2, rv: 1 }]],
  chrono_big: [['impactBell_heavy_001', .74, { rv: 1, r: 1.2, rev: .6 }], ['lock', .57, { d: .1 }], ['magical_3', .57, { rv: 1 }]],
  blood: [['impactSoft_medium', .56, { r: [.8, 1] }], ['creature_slime', .35, { r: .7 }]],
  blood_big: [['impactSoft_heavy', 1.04, { r: .7 }], ['creature_hurt', .57, { r: .5, rev: .4 }], ['slime_000', .66, { r: .6 }]],
  spirit: [['magical_1_0', .42, { r: [1.2, 1.4], len: .7, rev: .5 }], ['creature_misc_03', .19, { r: 1.5, rev: .6 }]],
  spirit_big: [['magical_1_0', .78, { r: .8, rev: .6 }], ['impactBell_heavy_000', .39, { rv: 1, r: 1.4, rev: .6 }], ['forceField', .39, { r: 1.2 }]],
  cosmic: [['magical_7_0', .47, { r: [.8, .9], len: .6, rev: .3 }], ['forceField', .29, { r: 1.6, len: .3 }]],
  cosmic_big: [['magical_3', .61, { r: .7, rev: .6 }], ['lowFrequency_explosion_000', .72], ['impactBell_heavy_000', .39, { r: .8, rev: .7 }]],
  explosion: [['explosionCrunch', .38, { r: [1, 1.2] }], ['lowFrequency_explosion_001', .28]],
  explosion_big: [['explosionCrunch', .77, { r: [.75, .85], rev: .4 }], ['lowFrequency_explosion_000', .77], ['stones', .32, { d: .1 }]],
  illusion: [['magical_5', .4, { r: [1.3, 1.5], len: .6, rev: .5 }], ['item_gem_02', .45, { r: [1.6, 1.9], rev: .4 }]],
  illusion_big: [['magical_5', .6, { r: .85, rv: 1, rev: .6 }], ['impactGlass_light', .8, { r: .8, rev: .6 }], ['forceField', .35, { r: 1.9, len: .6 }]],
  bone: [['impactWood_medium', .75, { r: [1.25, 1.45] }], ['blade', .3, { r: [1.3, 1.5] }]],
  bone_big: [['impactWood_heavy', .85, { r: .8, rev: .3 }], ['impactPlank_medium', .75, { r: .7 }], ['creature_monster_03', .25, { r: .7, rev: .4 }]],
  rune: [['bookFlip', .7, { r: [1.1, 1.3] }], ['magical_7_0', .35, { r: [1.4, 1.6], len: .5, rev: .4 }]],
  rune_big: [['book_0', .75, { r: .9, rev: .3 }], ['impactBell_heavy_001', .55, { r: 1.3, rev: .6 }], ['impactMining', .4, { r: .8 }]],
  plasma: [['laserRetro', .45, { r: [.8, .95] }], ['thrusterFire', .2, { len: .25, hp: 800 }]],
  plasma_big: [['laserLarge', .7, { r: .7, rev: .3 }], ['explosionCrunch', .45, { r: 1.2, rev: .3 }], ['spaceEngineSmall', .3, { len: .6, r: 1.5 }]],
  soul: [['magical_4', .35, { r: [.9, 1], len: .6, rev: .5 }], ['forceField', .22, { r: 2, len: .3 }]],
  soul_big: [['magical_1_0', .7, { r: .6, rev: .7 }], ['creature_roar', .25, { r: .8, rev: .6 }], ['lowFrequency_explosion_000', .5]],
  abyss: [['creature_slime', .45, { r: [.55, .7] }], ['magical_4', .28, { r: .45, len: .5, rev: .4 }]],
  abyss_big: [['creature_monster', .4, { r: .55, rev: .5 }], ['slime_001', .6, { r: .6, len: .9 }], ['lowFrequency_explosion_000', .6, { r: .7 }]],
  laser: [['laserSmall', .5, { r: [.95, 1.1] }]],
  laser_big: [['laserLarge', .8, { r: [.9, 1] }], ['laserRetro', .35, { r: 1.3, d: .03 }], ['forceField', .3, { r: 1.6, len: .4 }]],
  arcane: [['magical_6_0', .38, { r: [1.1, 1.3], rev: .4 }], ['spell_0', .32, { r: [1.2, 1.4], len: .4 }]],
  arcane_big: [['magical_3', .7, { r: 1.1, rev: .6 }], ['spell_0', .6, { r: .9, rev: .4 }], ['impactBell_heavy_002', .4, { r: 1.6, rev: .6 }]],
  blades: [['drawKnife', .6, { r: [1.05, 1.25] }], ['blade', .3, { r: [1.2, 1.4] }]],
  blades_big: [['drawKnife', .9, { r: .85, rev: .3 }], ['metal_0', .6, { r: .9 }], ['impactBell_heavy_004', .35, { r: 1.5, rev: .5 }]],
};
const REV = new WeakMap(); // reversed copies, made on first use
const live = {}; // per sound: the copies still ringing, oldest first
function pickSample(pool) {
  const list = POOLS[pool] ||= Object.keys(SAMPLES).filter(n => [].concat(pool).some(p => n.startsWith(p)));
  const b = list[Math.random() * list.length | 0]; return b && SAMPLES[b];
}
function sfx(type) {
  if (!AC || !SFX[type] || AC.state !== 'running') return;
  const t = AC.currentTime;
  if (t - (lastSfx[type] || 0) < .06 || voices > 40) return; // same sound re-fired within a few frames, or too many at once
  lastSfx[type] = t;
  const drift = 1 + (Math.random() - .5) * .08, inst = { gs: [], srcs: [] }, L = live[type] ||= [];
  if (L.length >= 2) { const o = L.shift(); for (const g of o.gs) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + .08); } for (const x of o.srcs) try { x.stop(t + .1); } catch {} } // spammed: fade the oldest copy instead of stacking a third
  for (const [pool, v, o = {}] of SFX[type]) {
    let buf = pickSample(pool); if (!buf) continue;
    if (o.rv) { if (!REV.has(buf)) { const r = AC.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate); for (let c = 0; c < buf.numberOfChannels; c++) r.getChannelData(c).set(buf.getChannelData(c).slice().reverse()); REV.set(buf, r); } buf = REV.get(buf); }
    const src = AC.createBufferSource(); src.buffer = buf;
    src.playbackRate.value = (Array.isArray(o.r) ? o.r[0] + Math.random() * (o.r[1] - o.r[0]) : o.r || 1) * drift;
    let node = src;
    for (const [type, f] of [['lowpass', o.lp], ['highpass', o.hp]]) if (f) { const q = AC.createBiquadFilter(); q.type = type; q.frequency.value = f; node.connect(q); node = q; }
    const g = AC.createGain(), at = t + (o.d || 0); g.gain.value = v;
    if (o.len) { g.gain.setValueAtTime(v, at + o.len * .7); g.gain.linearRampToValueAtTime(0, at + o.len); }
    node.connect(g); g.connect(sfxBus);
    if (o.rev) { const s = AC.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(revBus); }
    src.start(at); if (o.len) src.stop(at + o.len + .01);
    voices++; inst.gs.push(g); inst.srcs.push(src);
    src.onended = () => { voices--; if (inst.srcs.every(x => x.done || x === src)) { const i = L.indexOf(inst); if (i >= 0) L.splice(i, 1); } src.done = true; };
  }
  if (inst.srcs.length) L.push(inst);
}
// ---- music: real CC0 tracks per situation, crossfaded; each list shuffles without repeating the track just heard ----
const MUSIC = {
  menu: ['fantasy_orchestral_theme.mp3', 'dark_shrine.ogg'],
  arena: ['battle_theme_a.mp3', 'swordfight.ogg', 'heartfelt_battle.ogg', 'random_battle.mp3', 'mythica.mp3'],
  duel: ['swordfight.ogg', 'random_battle.mp3', 'battle_theme_a.mp3', 'heartfelt_battle.ogg'],
  dungeon: ['dungeon_ambience.ogg', 'dungeon_theme.mp3', 'cave_explorer.mp3', 'forgotten_tombs.mp3'],
  boss: ['weltherrscher.ogg', 'mythica.mp3'],
  over: ['dark_shrine.ogg'],
};
// per-track level in dB: the tracks were mastered 28 dB apart, measured and evened out (battle a bit louder than ambience)
const MUSIC_DB = { 'battle_theme_a.mp3': -4.4, 'cave_explorer.mp3': 3.2, 'dark_shrine.ogg': 3.9, 'dungeon_ambience.ogg': 20.7, 'dungeon_theme.mp3': -5.7, 'fantasy_orchestral_theme.mp3': -1.1,
  'forgotten_tombs.mp3': -1.6, 'heartfelt_battle.ogg': 5.4, 'mythica.mp3': -3.5, 'random_battle.mp3': -3.9, 'swordfight.ogg': -1.7, 'weltherrscher.ogg': 1 };
const tracks = {}; let musicMood = null, musicNow = null;
function track(name) { // an <audio> element streamed from the packed bytes, routed through its own fade gain
  if (tracks[name]) return tracks[name];
  const s = window.MAGE_AUDIO?.music?.[name]; if (!s || !AC) return null;
  const el = new Audio(); // fetch() unpacks the base64 off the main thread: no stutter when a big track starts mid-fight
  fetch(`data:${name.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'};base64,${s}`).then(r => r.blob()).then(b => { el.src = URL.createObjectURL(b); if (el.want) el.play().catch(() => {}); });
  const g = AC.createGain(); g.gain.value = 0; AC.createMediaElementSource(el).connect(g); g.connect(musicBus);
  el.onended = () => { if (musicNow === name) playMood(musicMood, name); };
  el.onerror = () => { el.bad = true; if (musicNow === name) playMood(musicMood, name); }; // e.g. Ogg on older Safari: try the next one
  return tracks[name] = { el, g };
}
function playMood(mood, avoid) {
  const list = (MUSIC[mood] || []).filter(n => n !== avoid && !tracks[n]?.el.bad);
  const name = list[Math.random() * list.length | 0], t = AC.currentTime;
  for (const [n, tr] of Object.entries(tracks)) if (n !== name && !tr.el.paused) { // fade out whatever else is playing
    tr.g.gain.cancelScheduledValues(t); tr.g.gain.setValueAtTime(tr.g.gain.value, t); tr.g.gain.linearRampToValueAtTime(0, t + 2.5);
    tr.el.want = false; clearTimeout(tr.stop); tr.stop = setTimeout(() => tr.el.pause(), 2600);
  }
  musicMood = mood; musicNow = name;
  const tr = name && track(name); if (!tr) return;
  clearTimeout(tr.stop); if (tr.el.ended) tr.el.currentTime = 0;
  tr.el.want = true; tr.el.play().catch(() => {}); // before the bytes are unpacked this fails quietly, and the fetch above starts it
  tr.g.gain.cancelScheduledValues(t); tr.g.gain.setValueAtTime(tr.g.gain.value, t); tr.g.gain.linearRampToValueAtTime(Math.pow(10, (MUSIC_DB[name] || 0) / 20), t + 2.5);
}
function music(mood) { // call every frame with what's happening; switches only when the mood changes
  if (!AC || mood === musicMood) return;
  if (!musicMood) for (const n in window.MAGE_AUDIO?.music) track(n); // first call: unpack every track in the background, so later switches are instant
  if (musicNow && MUSIC[mood]?.includes(musicNow)) { musicMood = mood; return; } // the current track fits the new mood too: keep it
  playMood(mood);
}
// browsers only allow sound after a click or key press: start the audio (and the menu music) on the first one
const wake = () => { initAudio(); if (AC) { removeEventListener('pointerdown', wake); removeEventListener('keydown', wake); } };
addEventListener('pointerdown', wake); addEventListener('keydown', wake);

// ===================== input (keyboard + mouse, touch, gamepad) =====================
const keys = {};
const inp = { yaw: 0, pitch: 0, jumpN: 0, dashN: 0, swapN: 0, p: false, s: false };
// virtual controls from touch / gamepad: analog stick + held move slots
const virt = { mx: 0, mz: 0, k: [false, false, false, false, false], jump: false, t: -1e9 };
let sens = .0022;
const locked = () => document.pointerLockElement === renderer.domElement;
const usingVirt = () => performance.now() - virt.t < 8000; // touch or a controller was used recently: no pointer lock needed
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'Space') inp.jumpN++;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') inp.dashN++;
  if (e.code === 'Tab') { e.preventDefault(); inp.swapN++; }
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('mousemove', e => {
  if (!locked()) return;
  inp.yaw -= e.movementX * sens; inp.pitch = clamp(inp.pitch - e.movementY * sens, -1.45, 1.45);
});
// Mac trackpads: Ctrl+click is a right click (F also works as right click everywhere)
addEventListener('mousedown', e => { if (!locked()) return; if (e.button === 0 && !e.ctrlKey) inp.p = true; if (e.button === 2 || (e.button === 0 && e.ctrlKey)) inp.s = true; });
addEventListener('mouseup', e => { if (e.button === 0) { inp.p = false; if (e.ctrlKey) inp.s = false; } if (e.button === 2) inp.s = false; });
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('blur', () => { for (const k in keys) keys[k] = false; inp.p = inp.s = false; virt.k.fill(false); });
// requestPointerLock is missing on iPhone/iPad Safari and returns undefined (not a promise) on older desktop Safari
const lockMouse = () => { if (usingVirt()) return; try { renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); } catch {} };
const unlockMouse = () => { try { document.exitPointerLock?.(); } catch {} };
renderer.domElement.addEventListener('click', () => { if (playing) lockMouse(); });
// k = held state of the 5 move slots: LMB, RMB, Q, E, R. mx / mz = analog strafe / forward (-1..1)
const localInput = () => ({ yaw: inp.yaw, pitch: inp.pitch, jumpN: inp.jumpN, dashN: inp.dashN, swapN: inp.swapN, jump: !!keys.Space || virt.jump,
  mx: clamp((keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + virt.mx, -1, 1), mz: clamp((keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0) + virt.mz, -1, 1),
  k: [inp.p || virt.k[0], inp.s || !!keys.KeyF || virt.k[1], !!keys.KeyQ || virt.k[2], !!keys.KeyE || virt.k[3], !!keys.KeyR || virt.k[4]] });

// ---- touch: left side = move stick, right side = look, buttons for moves / jump / dash / swap ----
function setupTouch() {
  const ui = $('touch'); if (!ui) return;
  let stick = null, look = null;
  const knob = $('stickKnob'), base = $('stick');
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { virt.t = performance.now(); document.body.classList.add('touching'); } }, true);
  renderer.domElement.style.touchAction = 'none';
  ui.addEventListener('pointerdown', e => {
    virt.t = performance.now();
    const b = e.target.closest('[data-k]');
    if (b) {
      e.preventDefault(); b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch {}
      const k = b.dataset.k;
      if (k === 'jump') { inp.jumpN++; virt.jump = true; } else if (k === 'dash') inp.dashN++; else if (k === 'swap') inp.swapN++; else virt.k[+k] = true;
      const up = () => { b.classList.remove('on'); if (k === 'jump') virt.jump = false; else if (!isNaN(+k)) virt.k[+k] = false; b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      return;
    }
    if (e.clientX < innerWidth * .42 && !stick) { stick = { id: e.pointerId, x: e.clientX, y: e.clientY }; base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px'; base.classList.add('on'); }
    else if (!look) look = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  ui.addEventListener('pointermove', e => {
    if (stick && e.pointerId === stick.id) {
      let dx = e.clientX - stick.x, dy = e.clientY - stick.y; const L = Math.hypot(dx, dy), R = 60;
      if (L > R) { dx *= R / L; dy *= R / L; }
      virt.mx = dx / R; virt.mz = -dy / R; knob.style.transform = `translate(${dx}px, ${dy}px)`;
    } else if (look && e.pointerId === look.id) {
      inp.yaw -= (e.clientX - look.x) * sens * 1.6; inp.pitch = clamp(inp.pitch - (e.clientY - look.y) * sens * 1.6, -1.45, 1.45);
      look.x = e.clientX; look.y = e.clientY;
    }
  });
  const end = e => {
    if (stick && e.pointerId === stick.id) { stick = null; virt.mx = virt.mz = 0; knob.style.transform = ''; base.classList.remove('on'); }
    if (look && e.pointerId === look.id) look = null;
  };
  ui.addEventListener('pointerup', end); ui.addEventListener('pointercancel', end);
}
setupTouch();

// ---- gamepad (standard mapping): left stick move, right stick look, RT/LT/LB/RB/Y = LMB/RMB/Q/E/R, A jump, B dash, X swap, Start menu ----
const padPrev = [];
let padOn = false;
function pollPad(dt) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = [...pads].find(p => p && p.connected);
  if (!gp) { if (padOn) { padOn = false; virt.mx = virt.mz = 0; virt.k.fill(false); virt.jump = false; } return; }
  const ax = i => { const v = gp.axes[i] || 0; return Math.abs(v) < .15 ? 0 : v; }, bt = i => !!gp.buttons[i]?.pressed;
  if (gp.buttons.some(b => b.pressed) || gp.axes.some(a => Math.abs(a) > .3)) { virt.t = performance.now(); padOn = true; }
  if (!padOn) return;
  virt.mx = ax(0); virt.mz = -ax(1);
  inp.yaw -= ax(2) * dt * 2.8 * (sens / .0022); inp.pitch = clamp(inp.pitch - ax(3) * dt * 2.2 * (sens / .0022), -1.45, 1.45);
  virt.k = [bt(7), bt(6), bt(4), bt(5), bt(3)];
  virt.jump = bt(0);
  const edge = i => bt(i) && !padPrev[i];
  if (edge(0)) inp.jumpN++; if (edge(1)) inp.dashN++; if (edge(2)) inp.swapN++;
  if (edge(9) && playing) toggleSettings(); // Start: pause / menu
  gp.buttons.forEach((b, i) => padPrev[i] = b.pressed);
}

function animateArena(dt, t, dark) {
  if (duelG.visible) { // duel platform: flickering braziers and drifting rocks
    duelAmb.flames.forEach((f, i) => { const s = 1 + Math.sin(t * 13 + i * 2) * .08; f.scale.set(s, s * 1.1, s); if (Math.random() < .5) emit(f.position.x + rand(-.2, .2), f.position.y + rand(.3, .8), f.position.z + rand(-.2, .2), rand(-.3, .3), rand(1.5, 3), rand(-.3, .3), Math.random() < .5 ? 0xff9a3a : 0xffd27a, rand(.05, .12), rand(.8, 1.4), -.4, .4); });
    duelAmb.lights.forEach((l, i) => l.intensity = 14 + Math.sin(t * 11 + i * 3) * 4);
    duelAmb.rocks.forEach(r => r.o.position.y = r.y + Math.sin(t * .4 + r.ph) * .6);
  }
  if (!arena.visible) return;
  amb.sig.forEach((o, i) => o.rotation.y += dt * [.05, -.08, .11, -.04][i]);
  amb.rocks.forEach(r => r.o.position.y = r.y + Math.sin(t * .4 + r.ph) * .6);
  amb.flames.forEach((f, i) => {
    const s = 1 + Math.sin(t * 13 + i * 2) * .08 + Math.sin(t * 7.3 + i) * .06; f.scale.set(s, s * 1.1, s);
    if (Math.random() < .5) emit(f.position.x + rand(-.25, .25), f.position.y + rand(.3, .9), f.position.z + rand(-.25, .25), rand(-.3, .3), rand(1.5, 3.2), rand(-.3, .3), Math.random() < .5 ? 0xff9a3a : 0xffd27a, rand(.05, .12), rand(.8, 1.6), -.4, .4);
  });
  amb.banners.forEach((b, i) => b.o.quaternion.setFromAxisAngle(b.axis, Math.sin(t * 1.3 + i * 2) * .07 + Math.sin(t * 3.1 + i) * .02));
  amb.monos.forEach(m => {
    const a = m.a - t * .02;
    m.o.position.set(Math.cos(a) * m.r, m.y + Math.sin(t * .5 + m.ph) * .8, Math.sin(a) * m.r);
    m.o.rotation.y = m.ry + t * .02;
  });
  for (const [k, fa] of [[0, -.9], [1, 2.3]]) if (Math.random() < .6) { // spray where the mana falls leave the island
    const s = Math.random() ** 2, r = 22.3 + 3.4 * Math.sqrt(s);
    emit(Math.cos(fa) * r + rand(-1, 1), -.6 - 26 * s * s, -Math.sin(fa) * r + rand(-1, 1), rand(-.5, .5), rand(-.5, 1), rand(-.5, .5), k ? 0x9fe8ff : 0x7fd8ff, rand(.25, .6), rand(1, 2), .3, .5);
  }
  amb.lights.forEach((l, i) => l.intensity = (dark ? 8 : 16) + Math.sin(t * 11 + i * 3) * 4);
  [...amb.cry].forEach((m, i) => m.emissiveIntensity = cryBase[i] * (.75 + .35 * Math.sin(t * 1.5 + i)));
  scene.fog.density += ((dark ? .07 : .007) - scene.fog.density) * Math.min(1, dt * 2);
  if (Math.random() < .3) { const a = rand(0, TAU), r = rand(3, 21); emit(Math.cos(a) * r, rand(0, .3), Math.sin(a) * r, 0, rand(.3, .8), 0, 0xe0d2b8, rand(.08, .16), rand(2, 4), -.05, .2); }
}
