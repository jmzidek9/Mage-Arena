// Mage Arena graphics: the five quality presets (Low → Ultra) and the screen-space lighting behind them.
// Loaded right after core.js. The scene renders into its own target (MSAA + depth); one pass then adds what the
// settings turn on: ambient occlusion with bounce light and contact shadows, ray-marched floor reflections,
// volumetric light traced through the shadow map, sky god rays and height mist. Bloom, tone mapping, FXAA and the
// film pass follow (core.js). The models keep their low-poly faces: only light, shadow and air get better.
// All ray tracing here is screen space (the depth buffer is the scene): browsers have no ray tracing hardware.
'use strict';

// ---- Ultra shadows: contact-hardening soft shadows (PCSS) inside three's Soft PCF filter, switched by the light's
// shadow.radius (Soft PCF ignores it): radius > 50 means PCSS. One shader for High through Ultra, so moving in or out
// of Ultra (or Adaptive quality dropping out of it mid-fight) never recompiles every material in the scene.
// The key light is orthographic, so depth is linear and the penumbra grows with the gap between blocker and receiver.
// The tap spiral turns by the golden angle with one fixed rotation per tap: the same 16 + 24 taps at the same angles as
// a sin/cos per tap, without the sin/cos, so it looks identical and is cheaper to run and to compile.
{
  const c = THREE.ShaderChunk.shadowmap_pars_fragment, g = c.indexOf('float getShadow('), tag = '#elif defined( SHADOWMAP_TYPE_PCF_SOFT )', i = c.indexOf(tag, g), j = c.indexOf('#elif', i + tag.length);
  const pcss = `float pcssShadow( sampler2D map, vec2 uv, float z ) {
		const mat2 G = mat2( -.7373688, .6754904, -.6754904, -.7373688 );
		float a = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( .06711056, .00583715 ) ) ) ) * 6.2831853, bs = 0., bn = 0.;
		vec2 o = vec2( cos( a ), sin( a ) );
		for ( int i = 0; i < 16; i ++ ) { float r = sqrt( ( float( i ) + .5 ) / 16. ) * .0065;
			float d = unpackRGBAToDepth( textureLod( map, uv + o * r, 0. ) ), k = step( d, z - .0004 - r * .3 ); bs += d * k; bn += k; o = G * o; }
		if ( bn < .5 ) return 1.;
		float pen = clamp( ( z - bs / bn ) * .45, .0003, .0065 ), lit = 0.;
		o = vec2( cos( a * 1.618 ), sin( a * 1.618 ) );
		for ( int i = 0; i < 24; i ++ ) { float r = sqrt( ( float( i ) + .5 ) / 24. );
			lit += step( z - r * pen * .5, unpackRGBAToDepth( textureLod( map, uv + o * r * pen, 0. ) ) ); o = G * o; }
		return lit / 24.;
	}
	`;
  if (g > 0 && i > g && j > i) THREE.ShaderChunk.shadowmap_pars_fragment = c.slice(0, g) + pcss + c.slice(g, i) + tag +
    '\n\t\t\tif ( shadowRadius > 50. ) shadow = pcssShadow( shadowMap, shadowCoord.xy, shadowCoord.z ); else {' + c.slice(i + tag.length, j) + '}\n\t\t' + c.slice(j);
  else console.warn('gfx: three shadow chunk changed, Ultra falls back to Soft PCF shadows');
}

const GFX_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
// shared by every pass: view-space position and face normal rebuilt from depth (exact on flat-shaded low-poly faces)
const GFX_HEAD = `uniform sampler2D tDepth; uniform mat4 uProj, uProjInv; uniform vec2 uRes; uniform float uNear, uFar, uFrame; varying vec2 vUv;
float dep(vec2 uv) { return textureLod(tDepth, uv, 0.).x; } // explicit LOD: these are read inside loops
vec3 vpos(vec2 uv, float d) { vec4 p = uProjInv * vec4(vec3(uv, d) * 2. - 1., 1.); return p.xyz / p.w; }
float lin(float d) { return uNear * uFar / (uFar - d * (uFar - uNear)); }
vec2 toUv(vec3 q) { vec4 c = uProj * vec4(q, 1.); return c.xy / c.w * .5 + .5; }
float ign(vec2 px) { return fract(52.9829189 * fract(dot(px, vec2(.06711056, .00583715)))); }
vec3 vnorm(vec2 uv, vec3 p) { // the nearer neighbour on each axis, so edges don't bend the normal
  vec2 ex = vec2(1. / uRes.x, 0.), ey = vec2(0., 1. / uRes.y);
  vec3 l = vpos(uv - ex, dep(uv - ex)), r = vpos(uv + ex, dep(uv + ex)), b = vpos(uv - ey, dep(uv - ey)), t = vpos(uv + ey, dep(uv + ey));
  return normalize(cross(abs(r.z - p.z) < abs(p.z - l.z) ? r - p : p - l, abs(t.z - p.z) < abs(p.z - b.z) ? t - p : p - b)); }
`;

// ambient occlusion (rays in a disc around each pixel: how much of the sky the nearby geometry hides), bounce light
// (the colour those rays land on, so lit surfaces tint their neighbours) and contact shadows (a short ray toward the light)
const GFX_AO = `uniform sampler2D tColor; uniform float uRad, uInt; uniform vec3 uLightV;
void main(){
  float d = dep(vUv);
  if (d >= 1.) { gl_FragColor = vec4(0., 0., 0., 1.); return; }
  vec3 p = vpos(vUv, d), n = vnorm(vUv, p), gi = vec3(0.);
  float jit = ign(gl_FragCoord.xy + uFrame * 5.588), ao = 1.;
#if N > 0
  // horizon-based: walk N directions across the screen, keep the highest the nearby geometry rises above this surface
  float ruv = min(uRad * uProj[1][1] * .5 / -p.z, .15), asp = uRes.y / uRes.x, occ = 0., ws = 0.;
  for (int i = 0; i < N; i++) {
    float a = (float(i) + jit) / float(N) * 6.2831853, h = 0., k = fract(jit * 7.31 + float(i) * .618);
    vec2 dir = vec2(cos(a) * asp, sin(a)) * ruv;
    for (int j = 1; j <= M; j++) {
      vec2 su = vUv + dir * ((float(j) - 1. + k) / float(M) + .02);
      vec3 v = vpos(su, dep(su)) - p; float vl = length(v);
      float e = dot(v, n) / max(vl, 1e-4) * max(0., 1. - vl * vl / (uRad * uRad)); // how high it rises, fading with distance
  #ifdef GI
      if (e > h) gi += min(textureLod(tColor, su, 0.).rgb, vec3(1.2)) * (e - h); // what you'd see there bounces back here
  #endif
      h = max(h, e);
    }
    occ += h;
  }
  ao = clamp(1. - occ / float(N) * uInt, 0., 1.); gi /= float(N);
#endif
#ifdef CONTACT
  float nl = dot(n, uLightV);
  if (nl > .02 && -p.z > .7) for (int i = 0; i < 14; i++) {
    float t = (float(i) + jit) / 14.; t = .02 + t * t * .8;
    vec3 q = p + uLightV * t; vec2 su = toUv(q);
    if (su.x < 0. || su.x > 1. || su.y < 0. || su.y > 1.) break;
    float df = vpos(su, dep(su)).z - q.z;
    if (df > .01 + t * .02 && df < .35) { ao *= 1. - .6 * smoothstep(.02, .25, nl) * (1. - t / .82); break; }
  }
#endif
  gl_FragColor = vec4(gi, ao);
}`;
// separable blur that stops at depth edges (cleans the noisy half-res buffers without bleeding across silhouettes)
const GFX_BLUR = `uniform sampler2D tSrc; uniform vec2 uStep;
void main(){
  float z0 = lin(dep(vUv)); vec4 s = texture2D(tSrc, vUv); float w = 1.;
  for (int i = -4; i <= 4; i++) { if (i == 0) continue;
    vec2 uv = vUv + uStep * float(i);
    float k = exp(-float(i * i) * .1) * max(0., 1. - abs(lin(dep(uv)) - z0) / (z0 * .05 + .03));
    s += textureLod(tSrc, uv, 0.) * k; w += k; }
  gl_FragColor = s / w;
}`;
// reflections: march the mirrored view ray through the depth buffer, refine the hit, fade at screen edges and with Fresnel.
// Only near-flat surfaces facing up (floors, steps, tops): faceted low-poly walls would just sparkle
const GFX_SSR = `uniform sampler2D tColor; uniform mat3 uV2W; uniform float uMax;
void main(){
  float d = dep(vUv);
  if (d >= 1.) { gl_FragColor = vec4(0.); return; }
  vec3 p = vpos(vUv, d), n = vnorm(vUv, p);
  float mask = smoothstep(.72, .96, (uV2W * n).y);
  if (mask <= 0. || -p.z < .6) { gl_FragColor = vec4(0.); return; }
  vec3 v = normalize(p), r = reflect(v, n);
  float jit = ign(gl_FragCoord.xy + uFrame * 7.13), prev = 0., hit = -1., sky = 0.; vec2 huv = vec2(0.), last = vec2(-1.);
  for (int i = 1; i <= STEPS; i++) {
    float t = (float(i) - 1. + jit) / float(STEPS); t = .05 + t * t * uMax;
    vec3 q = p + r * t; if (q.z > -uNear) break;
    vec2 su = toUv(q); if (su.x < 0. || su.x > 1. || su.y < 0. || su.y > 1.) break;
    float sd = dep(su), df = vpos(su, sd).z - q.z; last = su; sky = step(1., sd);
    if (sd < 1. && df > 0. && df < .3 + t * .08) {
      float a = prev, b = t;
      for (int k = 0; k < REFINE; k++) { float m = (a + b) * .5; vec3 qm = p + r * m; vec2 um = toUv(qm); if (vpos(um, dep(um)).z - qm.z > 0.) { b = m; su = um; } else a = m; }
      hit = t; huv = su; break;
    }
    prev = t;
  }
  float open = 1.;
  if (hit < 0.) { // nothing in the way: the ray leaves into the open sky, so the floor mirrors the sky (dimmer: it's further, softer)
    if (sky < .5 || last.x < 0.) { gl_FragColor = vec4(0.); return; }
    huv = last; hit = uMax * .5; open = .55;
  }
  vec2 e = smoothstep(0., .07, huv) * smoothstep(1., .93, huv);
  float fres = .04 + .96 * pow(1. - clamp(dot(-v, n), 0., 1.), 5.);
  float k = mask * e.x * e.y * (1. - smoothstep(.55, 1., hit / uMax)) * (1. - smoothstep(.15, .6, r.z)) * fres * open;
  vec3 hc = textureLod(tColor, huv, 0.).rgb; hc *= min(1., 1.6 / max(max(hc.r, hc.g), max(hc.b, 1e-4))); // glowing hits reflect bright, not blinding
  gl_FragColor = vec4(hc * k, k);
}`;
// volumetric light: walk each view ray through the air, asking the moon's shadow map whether each point is lit,
// so pillars and enemies cut real shafts through the haze (Henyey-Greenstein: brightest looking toward the light)
const GFX_VOL = `#include <packing>
uniform sampler2D tShadow; uniform mat4 uShadowM, uCamW; uniform vec3 uCamPos, uLDir, uLCol; uniform float uDens, uMax;
void main(){
  float d = dep(vUv); vec3 p = vpos(vUv, min(d, .99999));
  float L = d >= 1. ? uMax : min(length(p), uMax);
  vec3 dir = normalize((uCamW * vec4(p, 0.)).xyz);
  float jit = ign(gl_FragCoord.xy + uFrame * 3.71), st = L / float(VSTEPS), T = 1.; vec3 acc = vec3(0.);
  float g = .55, ct = dot(dir, uLDir), ph = (1. - g * g) / (12.566 * pow(1. + g * g - 2. * g * ct, 1.5)) + .02;
  for (int i = 0; i < VSTEPS; i++) {
    vec3 w = uCamPos + dir * ((float(i) + jit) * st);
    vec4 sc = uShadowM * vec4(w, 1.); vec3 s = sc.xyz / sc.w;
    float lit = s.x > 0. && s.x < 1. && s.y > 0. && s.y < 1. && s.z < 1. ? step(s.z - .002, unpackRGBAToDepth(textureLod(tShadow, s.xy, 0.))) : 1.;
    float den = uDens * exp(-max(w.y - 1., 0.) * .16);
    acc += T * lit * den * st; T *= exp(-den * st * .5);
  }
  gl_FragColor = vec4(acc * ph * uLCol, T);
}`;
// god rays: march toward the black hole on screen, gathering the open sky that shows through
const GFX_GOD = `uniform sampler2D tColor; uniform vec2 uL; uniform float uOn;
void main(){
  vec2 dl = (uL - vUv) * (.9 / float(GSTEPS)), uv = vUv + dl * ign(gl_FragCoord.xy + uFrame * 9.1);
  vec3 acc = vec3(0.); float w = 1.;
  for (int i = 0; i < GSTEPS; i++) {
    vec2 c = clamp(uv, vec2(.001), vec2(.999));
    acc += max(textureLod(tColor, c, 0.).rgb - .1, 0.) * step(.99999, dep(c)) * w;
    w *= .96; uv += dl;
  }
  gl_FragColor = vec4(min(acc * (uOn / float(GSTEPS)), vec3(6.)), 1.);
}`;
// everything meets here: motion blur, then AO and bounce light, reflections, mist, volumetric light and god rays.
// Half-res buffers come back up with depth-aware weights so nothing bleeds over silhouettes. Glowing pixels are left alone
const GFX_COMP = `uniform sampler2D tColor, tAO, tSSR, tVol, tGod; uniform vec2 uLo; uniform mat4 uCamW, uPrevVP;
uniform vec3 uCamPos, uLDir, uFogCol, uSunCol; uniform float uGI, uSSRK, uVolK, uVolT, uGodK, uFogK, uMB, uDbg; // uDbg: show one buffer (MP.gfxDebug)
vec4 W; vec2 B;
void lowTaps(vec2 uv, float z0) {
  vec2 st = uv * uLo - .5, f = fract(st), e = 1. / uLo; B = (floor(st) + .5) * e;
  vec4 bw = vec4((1. - f.x) * (1. - f.y), f.x * (1. - f.y), (1. - f.x) * f.y, f.x * f.y);
  vec4 z = vec4(lin(dep(B)), lin(dep(B + vec2(e.x, 0.))), lin(dep(B + vec2(0., e.y))), lin(dep(B + e)));
  W = bw * exp(-abs(z - z0) / z0 * 50.) + 1e-4; W /= dot(W, vec4(1.));
}
vec4 low(sampler2D t) { vec2 e = 1. / uLo; return texture2D(t, B) * W.x + texture2D(t, B + vec2(e.x, 0.)) * W.y + texture2D(t, B + vec2(0., e.y)) * W.z + texture2D(t, B + e) * W.w; }
void main(){
  float d = dep(vUv); vec3 col = texture2D(tColor, vUv).rgb;
  vec3 p = vpos(vUv, min(d, .99999)); float z0 = -p.z;
#ifdef MB
  { vec4 pc = uPrevVP * (uCamW * vec4(p, 1.)); vec2 vel = (vUv - (pc.xy / pc.w * .5 + .5)) * uMB; float vl = length(vel);
    if (z0 > .9 && vl > 4e-4) { vel *= min(1., .035 / vl); vec3 acc = col; float ws = 1., j = ign(gl_FragCoord.xy + uFrame) - .5;
      for (int i = 0; i < 8; i++) { vec2 su = vUv + vel * ((float(i) + .5 + j * .5) / 8. - .5); if (lin(dep(su)) > .9) { acc += textureLod(tColor, su, 0.).rgb; ws += 1.; } }
      col = acc / ws; } }
#endif
  float lum = dot(col, vec3(.2126, .7152, .0722)), glow = smoothstep(1., 3., lum);
#if defined(SSR) || defined(VOL) || defined(AOLO)
  lowTaps(vUv, z0);
#endif
#ifdef AO
  #ifdef AOLO
  vec4 ao = low(tAO);
  #else
  vec4 ao = texture2D(tAO, vUv);
  #endif
  if (d < 1.) col = col * mix(ao.a, 1., glow) + ao.rgb * uGI * (1. - glow);
  if (uDbg == 1.) { gl_FragColor = vec4(vec3(ao.a) + ao.rgb * uGI * 4., 1.); return; }
#endif
#ifdef SSR
  col += low(tSSR).rgb * uSSRK * (1. - glow);
  if (uDbg == 2.) { gl_FragColor = vec4(low(tSSR).rgb * 3., 1.); return; }
#endif
#ifdef FOG
  if (d < 1.) {
    float L = length(p); vec3 wd = (uCamW * vec4(p / L, 0.)).xyz;
    float H = .085, k = uFogK * exp(-H * (uCamPos.y + 4.)), hy = wd.y;
    float od = abs(hy) < 1e-3 ? k * L : k * (1. - exp(-H * hy * L)) / (H * hy);
    col = mix(col, mix(uFogCol, uSunCol, pow(max(dot(wd, uLDir), 0.), 5.)), 1. - exp(-clamp(od, 0., 8.)));
  }
#endif
#ifdef VOL
  vec4 vl = low(tVol); col = col * mix(1., vl.a, uVolT) + vl.rgb * uVolK;
  if (uDbg == 3.) { gl_FragColor = vec4(vl.rgb * 4., 1.); return; }
#endif
#ifdef GOD
  col += texture2D(tGod, vUv).rgb * uGodK;
#endif
  gl_FragColor = vec4(col, 1.);
}`;
// FXAA (after tone mapping): finds stair-stepped edges by contrast and blends along them
const GFX_FXAA = `uniform sampler2D tDiffuse; uniform vec2 uTexel; varying vec2 vUv;
void main(){
  vec3 nw = texture2D(tDiffuse, vUv + vec2(-1., -1.) * uTexel).rgb, ne = texture2D(tDiffuse, vUv + vec2(1., -1.) * uTexel).rgb;
  vec3 sw = texture2D(tDiffuse, vUv + vec2(-1., 1.) * uTexel).rgb, se = texture2D(tDiffuse, vUv + vec2(1., 1.) * uTexel).rgb, m = texture2D(tDiffuse, vUv).rgb;
  vec3 L = vec3(.299, .587, .114); float lnw = dot(nw, L), lne = dot(ne, L), lsw = dot(sw, L), lse = dot(se, L), lm = dot(m, L);
  float mn = min(lm, min(min(lnw, lne), min(lsw, lse))), mx = max(lm, max(max(lnw, lne), max(lsw, lse)));
  vec2 dir = vec2(-((lnw + lne) - (lsw + lse)), (lnw + lsw) - (lne + lse));
  float red = max((lnw + lne + lsw + lse) * .03125, 1. / 128.), rc = 1. / (min(abs(dir.x), abs(dir.y)) + red);
  dir = clamp(dir * rc, -8., 8.) * uTexel;
  vec3 a = .5 * (texture2D(tDiffuse, vUv - dir / 6.).rgb + texture2D(tDiffuse, vUv + dir / 6.).rgb);
  vec3 b = a * .5 + .25 * (texture2D(tDiffuse, vUv - dir * .5).rgb + texture2D(tDiffuse, vUv + dir * .5).rgb);
  float lb = dot(b, L);
  gl_FragColor = vec4(lb < mn || lb > mx ? a : b, 1.);
}`;

// ---- the passes ----
const GX = { ao: 0, gi: false, contact: false, ssr: 0, vol: 0, god: false, fog: false, mb: 0, aoS: .5 }; // what's on now (applyGfx)
const sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(1, 1) });
const gfxRT = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
const aoA = gfxRT(), aoB = gfxRT(), rfA = gfxRT(), volA = gfxRT(), volB = gfxRT(), godA = gfxRT();
const GU = { tDepth: { value: sceneRT.depthTexture }, tColor: { value: sceneRT.texture }, uProj: { value: new THREE.Matrix4() }, uProjInv: { value: new THREE.Matrix4() },
  uRes: { value: new THREE.Vector2(1, 1) }, uNear: { value: .05 }, uFar: { value: 1800 }, uFrame: { value: 0 } };
const gmat = (frag, u = {}, defines = {}) => new THREE.ShaderMaterial({ defines, uniforms: { ...GU, ...u }, vertexShader: GFX_VS, fragmentShader: GFX_HEAD + frag, depthTest: false, depthWrite: false });
const GM = {
  ao: gmat(GFX_AO, { uRad: { value: 1 }, uInt: { value: 1.4 }, uLightV: { value: V() } }, { N: 4, M: 4 }),
  blur: gmat(GFX_BLUR, { tSrc: { value: null }, uStep: { value: new THREE.Vector2() } }),
  ssr: gmat(GFX_SSR, { uV2W: { value: new THREE.Matrix3() }, uMax: { value: 18 } }, { STEPS: 32, REFINE: 4 }),
  vol: gmat(GFX_VOL, { tShadow: { value: null }, uShadowM: { value: new THREE.Matrix4() }, uCamW: { value: new THREE.Matrix4() }, uCamPos: { value: V() }, uLDir: { value: BH }, uLCol: { value: new THREE.Color() }, uDens: { value: .004 }, uMax: { value: 45 } }, { VSTEPS: 16 }),
  god: gmat(GFX_GOD, { uL: { value: new THREE.Vector2() }, uOn: { value: 0 } }, { GSTEPS: 48 }),
  comp: gmat(GFX_COMP, { tAO: { value: aoA.texture }, tSSR: { value: rfA.texture }, tVol: { value: volA.texture }, tGod: { value: godA.texture }, uLo: { value: new THREE.Vector2(1, 1) },
    uCamW: { value: new THREE.Matrix4() }, uPrevVP: { value: new THREE.Matrix4() }, uCamPos: { value: V() }, uLDir: { value: BH },
    uFogCol: { value: new THREE.Color(.11, .1, .1) }, uSunCol: { value: new THREE.Color(.95, .78, .55) },
    uDbg: { value: 0 }, uGI: { value: .35 }, uSSRK: { value: 1 }, uVolK: { value: 1 }, uVolT: { value: 0 }, uGodK: { value: 0 }, uFogK: { value: .005 }, uMB: { value: 0 } }),
};
const FSQ = new ShaderPass({ uniforms: {}, vertexShader: GFX_VS, fragmentShader: 'void main(){ gl_FragColor = vec4(0.); }' }).fsQuad; // three's full-screen triangle
const blit = (r, m, rt) => { FSQ.material = m; r.setRenderTarget(rt); FSQ.render(r); };
const setDefs = (m, d) => { const k = JSON.stringify(d); if (m.userData.defs === k) return; m.userData.defs = k; m.defines = Object.fromEntries(Object.entries(d).filter(([, v]) => v !== false).map(([n, v]) => [n, v === true ? '' : v])); m.needsUpdate = true; };
let gfxInfo = { calls: 0, triangles: 0, points: 0, lines: 0 }; // the scene's own draw stats (renderer.info only keeps the last full-screen pass)
const _gd = V(), _gp = V(), _gvp = new THREE.Matrix4(), _gcam = V(1e9, 0, 0);
const gfxPass = { // stands in for RenderPass: draws the scene, then the lighting, into the composer's write buffer
  enabled: true, needsSwap: true, clear: false, renderToScreen: false, w: 1, h: 1,
  setSize(w, h) {
    this.w = w; this.h = h; sceneRT.setSize(w, h); GU.uRes.value.set(w, h);
    const lw = Math.max(1, Math.round(w / 2)), lh = Math.max(1, Math.round(h / 2));
    aoA.setSize(Math.max(1, Math.round(w * GX.aoS)), Math.max(1, Math.round(h * GX.aoS))); aoB.setSize(aoA.width, aoA.height);
    for (const t of [rfA, volA, volB, godA]) t.setSize(lw, lh);
    GM.comp.uniforms.uLo.value.set(lw, lh);
    filmPass.uniforms.uTexel.value.set(1 / w, 1 / h); fxaaPass.uniforms.uTexel.value.set(1 / w, 1 / h);
  },
  render(r, write) {
    r.setRenderTarget(sceneRT); r.clear(); r.render(scene, camera);
    gfxInfo = { ...r.info.render };
    GU.uProj.value.copy(camera.projectionMatrix); GU.uProjInv.value.copy(camera.projectionMatrixInverse);
    GU.uNear.value = camera.near; GU.uFar.value = camera.far; // the noise stays put (uFrame 0): with no temporal filter, moving noise would shimmer
    const open = sky.visible, C = GM.comp.uniforms; // the black hole's light only lights the open sky's maps
    if (GX.ao || GX.contact) {
      GM.ao.uniforms.uLightV.value.copy(BH).transformDirection(camera.matrixWorldInverse);
      blit(r, GM.ao, aoA);
      GM.blur.uniforms.tSrc.value = aoA.texture; GM.blur.uniforms.uStep.value.set(1 / aoA.width, 0); blit(r, GM.blur, aoB);
      GM.blur.uniforms.tSrc.value = aoB.texture; GM.blur.uniforms.uStep.value.set(0, 1 / aoA.height); blit(r, GM.blur, aoA);
    }
    if (GX.ssr) { GM.ssr.uniforms.uV2W.value.setFromMatrix4(camera.matrixWorld); blit(r, GM.ssr, rfA); }
    C.uVolT.value = C.uVolK.value = 0;
    if (GX.vol && open && moon.castShadow && moon.shadow.map) {
      const u = GM.vol.uniforms; u.tShadow.value = moon.shadow.map.texture; u.uShadowM.value.copy(moon.shadow.matrix);
      u.uCamW.value.copy(camera.matrixWorld); u.uCamPos.value.copy(camera.position); u.uLCol.value.copy(moon.color).multiplyScalar(moon.intensity * .55);
      blit(r, GM.vol, volA);
      GM.blur.uniforms.tSrc.value = volA.texture; GM.blur.uniforms.uStep.value.set(1 / volA.width, 0); blit(r, GM.blur, volB);
      GM.blur.uniforms.tSrc.value = volB.texture; GM.blur.uniforms.uStep.value.set(0, 1 / volA.height); blit(r, GM.blur, volA);
      C.uVolT.value = .6; C.uVolK.value = 1;
    }
    C.uGodK.value = 0;
    if (GX.god && open) {
      camera.getWorldDirection(_gd); const face = THREE.MathUtils.smoothstep(_gd.dot(BH), .1, .5);
      if (face > 0) {
        _gp.copy(BH).multiplyScalar(1000).add(camera.position).project(camera);
        GM.god.uniforms.uL.value.set(_gp.x * .5 + .5, _gp.y * .5 + .5); GM.god.uniforms.uOn.value = face;
        blit(r, GM.god, godA); C.uGodK.value = .55;
      }
    }
    _gvp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    if (_gcam.distanceToSquared(camera.position) > 9) C.uPrevVP.value.copy(_gvp); // a respawn or a new map: no blur across the cut
    C.uCamW.value.copy(camera.matrixWorld); C.uCamPos.value.copy(camera.position); C.uFogK.value = open ? .005 : 0;
    C.uMB.value = [0, .5, 1][GX.mb] * (1 - Math.min(1, trauma)); // a hard shake jitters every frame: blurring that just smears the picture
    blit(r, GM.comp, this.renderToScreen ? null : write);
    C.uPrevVP.value.copy(_gvp); _gcam.copy(camera.position);
  },
  dispose() {},
};
// shader warm-ups (warmFx, the city's first visit) draw into the scene target, the way play draws. Drawn straight to the
// screen, three compiles the tone-mapped sRGB versions instead, and every warmed effect then compiled again, as a hitch,
// the first time it really showed up
function warmRender() {
  const rt = renderer.getRenderTarget(); renderer.setRenderTarget(sceneRT);
  try { renderer.compile(scene, camera); renderer.render(scene, camera); } catch (err) { console.error(err); }
  renderer.setRenderTarget(rt);
}
window.MP_gfxDebug = k => { GM.comp.uniforms.uDbg.value = k; }; // 1 AO + bounce, 2 reflections, 3 volumetric light (tuning)
const fxaaPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uTexel: { value: new THREE.Vector2(1, 1) } }, vertexShader: GFX_VS, fragmentShader: GFX_FXAA });
fxaaPass.enabled = false;
composer.insertPass(gfxPass, 0);
composer.insertPass(fxaaPass, composer.passes.indexOf(filmPass));
filmPass.uniforms.tFlare.value = bloomPass.renderTargetsVertical[2]?.texture || null; // bloom's blurred highlights, mirrored into lens ghosts

// ---- the five presets: only the settings that cost frame time (looks and comfort live in their own tabs) ----
const GFX_KEYS = ['scale', 'aa', 'shadowQ', 'ao', 'gi', 'ssr', 'contact', 'vlight', 'god', 'fog', 'bloom', 'flare', 'mblur', 'lights', 'particles', 'aniso', 'sharpen'];
const GFX_PRESETS = {
  low: { scale: .75, aa: 'off', shadowQ: 0, ao: 0, gi: false, ssr: 0, contact: false, vlight: 0, god: false, fog: false, bloom: 0, flare: false, mblur: 0, lights: false, particles: .5, aniso: 1, sharpen: .4 },
  medium: { scale: 1, aa: 'fxaa', shadowQ: 1, ao: 0, gi: false, ssr: 0, contact: false, vlight: 0, god: false, fog: false, bloom: 1, flare: false, mblur: 0, lights: true, particles: .75, aniso: 4, sharpen: .15 },
  high: { scale: 1, aa: 'msaa4', shadowQ: 2, ao: 1, gi: false, ssr: 0, contact: false, vlight: 0, god: true, fog: true, bloom: 2, flare: false, mblur: 0, lights: true, particles: 1, aniso: 8, sharpen: 0 },
  vhigh: { scale: 1, aa: 'msaa4', shadowQ: 3, ao: 2, gi: false, ssr: 2, contact: true, vlight: 1, god: true, fog: true, bloom: 2, flare: true, mblur: 0, lights: true, particles: 1, aniso: 16, sharpen: .1 },
  ultra: { scale: 1, aa: 'msaa8', shadowQ: 4, ao: 3, gi: true, ssr: 3, contact: true, vlight: 2, god: true, fog: true, bloom: 3, flare: true, mblur: 1, lights: true, particles: 1.25, aniso: 16, sharpen: .2 },
};
const GFX_ORDER = ['low', 'medium', 'high', 'vhigh', 'ultra'];
const gfxPreset = o => GFX_ORDER.find(p => GFX_KEYS.every(k => GFX_PRESETS[p][k] === o[k])) || 'custom';
const gfxNear = o => GFX_ORDER.reduce((b, p) => { const n = GFX_KEYS.filter(k => GFX_PRESETS[p][k] === o[k]).length; return n > b[1] ? [p, n] : b; }, ['high', -1])[0]; // the preset a custom mix is closest to

// ambient occlusion: [directions, steps, radius m, strength, resolution]; reflections: [steps, refinements, reach m]
const AO_Q = [[0, 0, 1, 0, .5], [4, 4, 1, 1.2, .5], [6, 5, 1.3, 1.35, .5], [8, 6, 1.6, 1.5, 1]], SSR_Q = [[0, 0, 0], [16, 3, 10], [32, 4, 18], [56, 6, 28]];
// the #defines each lighting pass is compiled with for these options (null: that pass is off)
function gfxDefs(o) {
  const A = AO_Q[o.ao], R = SSR_Q[o.ssr], ao = o.ao > 0 || o.contact, vol = o.shadowQ ? o.vlight : 0;
  return { ao: ao ? { N: A[0], M: A[1], GI: o.gi && o.ao > 0, CONTACT: o.contact } : null, ssr: o.ssr ? { STEPS: R[0], REFINE: R[1] } : null, vol: vol ? { VSTEPS: vol === 2 ? 32 : 16 } : null,
    comp: { AO: ao, AOLO: ao && A[4] < 1, SSR: o.ssr > 0, VOL: vol > 0, GOD: o.god, FOG: o.fog, MB: o.mblur > 0 } };
}
// Adaptive quality drops a preset in the middle of a fight, and the lighting passes of the lower preset are different
// shaders. Compile them when the game loads (warmFx), so the drop itself doesn't hitch the machine that's already struggling.
// (Medium to Low still recompiles the scene: Low has no shadows, and that's a different shader for every material.)
function warmGfxLower(o) {
  if (!o.autoQ) return;
  const rt = renderer.getRenderTarget(), cur = gfxDefs(o), use = d => { for (const k in d) if (d[k]) setDefs(GM[k], d[k]); };
  try {
    for (const p of GFX_ORDER.slice(0, GFX_ORDER.indexOf(gfxNear(o)))) {
      const d = gfxDefs(GFX_PRESETS[p]); use(d);
      for (const k in d) if (d[k]) blit(renderer, GM[k], aoB);
      if (GFX_PRESETS[p].aa === 'fxaa') blit(renderer, fxaaPass.material, aoB);
    }
  } catch (err) { console.error(err); }
  use(cur); renderer.setRenderTarget(rt);
}

// apply the graphics half of the settings; cheap when nothing changed (it's called on every settings save)
function applyGfx(o) {
  const pr = Math.min(devicePixelRatio || 1, 2) * o.scale;
  if (Math.abs(renderer.getPixelRatio() - pr) > 1e-3) { renderer.setPixelRatio(pr); composer.setPixelRatio(pr); }
  const smp = Math.min({ msaa2: 2, msaa4: 4, msaa8: 8 }[o.aa] || 0, renderer.capabilities.maxSamples || 4);
  if (sceneRT.samples !== smp) { sceneRT.samples = smp; sceneRT.dispose(); }
  fxaaPass.enabled = o.aa === 'fxaa';
  // shadows: Low 1024, Medium 2048, High 4096, Ultra 4096 with contact-hardening PCSS (a uniform, not a new shader: see the top)
  const sq = o.shadowQ, size = [1024, 1024, 2048, 4096, 4096][sq], type = THREE.PCFSoftShadowMap;
  moon.shadow.radius = sq === 4 ? 100 : 1;
  if (renderer.shadowMap.enabled !== sq > 0 || renderer.shadowMap.type !== type || moon.shadow.mapSize.x !== size) {
    renderer.shadowMap.enabled = moon.castShadow = sq > 0; renderer.shadowMap.type = type;
    if (moon.shadow.mapSize.x !== size) { moon.shadow.mapSize.set(size, size); moon.shadow.map?.dispose(); moon.shadow.map = null; }
    scene.traverse(m => { for (const x of [].concat(m.material || [])) x.needsUpdate = true; }); // their shaders hold the shadow filter
  }
  // ambient occlusion (bounce light and contact shadows ride the same pass), reflections, volumetric light
  const A = AO_Q[o.ao], aoS = A[4], D = gfxDefs(o);
  GX.ao = o.ao; GX.gi = o.gi && o.ao > 0; GX.contact = o.contact; GX.ssr = o.ssr; GX.vol = o.shadowQ ? o.vlight : 0; GX.god = o.god; GX.fog = o.fog; GX.mb = o.mblur;
  for (const k in D) if (D[k]) setDefs(GM[k], D[k]);
  GM.ao.uniforms.uRad.value = A[2]; GM.ao.uniforms.uInt.value = A[3];
  GM.comp.uniforms.uGI.value = .35;
  GM.ssr.uniforms.uMax.value = SSR_Q[o.ssr][2]; GM.vol.uniforms.uDens.value = GX.vol === 2 ? .006 : .0045;
  if (GX.aoS !== aoS) { GX.aoS = aoS; gfxPass.setSize(gfxPass.w, gfxPass.h); }
  // bloom and the lens it feeds
  bloomPass.enabled = o.bloom > 0; bloomPass.strength = [0, .38, .48, .52][o.bloom]; bloomPass.radius = [0, .35, .45, .55][o.bloom];
  filmPass.uniforms.uFlare.value = o.flare && o.bloom > 0 ? 1 : 0;
  filmPass.uniforms.uSharp.value = o.sharpen;
  // spell lights (projectiles and impacts) join or leave the scene: fewer lights, cheaper shading
  for (const l of [...shotLights, ...flashes.map(f => f.l)]) if (o.lights !== !!l.parent) o.lights ? scene.add(l) : scene.remove(l);
  pMul = o.particles; HQ = o.particles >= .75;
  // texture filtering on whatever's textured
  const an = Math.min(o.aniso, renderer.capabilities.getMaxAnisotropy() || 1);
  if (applyGfx.an !== an) {
    applyGfx.an = an;
    scene.traverse(m => { for (const x of [].concat(m.material || [])) for (const k of ['map', 'normalMap', 'roughnessMap', 'emissiveMap', 'bumpMap', 'aoMap', 'metalnessMap']) { const t = x[k]; if (t && t.anisotropy !== an) { t.anisotropy = an; t.needsUpdate = true; } } });
  }
}
