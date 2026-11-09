// Mage Arena settings: the Settings screen (its own full page, like the Arena screen), every option on it, and saving them.
// Graphics presets and effects live in gfx.js; this file holds everything else plus the UI. Opened from the main screen,
// the lobby's Settings button, or Esc in a game, where its Game tab is the pause menu (switch element, cheats, leave).
'use strict';

const pct = v => Math.round(v * 100) + '%';
let baseFov = 75, fpsCap = 0, fpsNow = 0; // fpsNow: measured by the frame loop (net.js)
const SET_DEF = { v: 2, preset: 'high', ...GFX_PRESETS.high, autoQ: true,
  full: false, fpsCap: 0, showFps: false, bright: 1, con: 1, sat: 1, tone: 'aces', grade: true, vig: 1, grain: 1, ca: 1,
  master: 1, vol: 1, mus: 1, rev: 1, menuMusic: true, bgMute: false,
  sens: 1, invert: false, raw: false, blockMode: 'hold', padSens: 1, padInvert: false, dead: .15, rumble: true, keys: {},
  fov: 75, shake: 1, kick: 1, bob: 1, hands: true, nums: true, numSize: 1, autoPause: true,
  hudScale: 1, hudAlpha: 1, ping: true, cross: 'rune', crossSize: 1, crossCol: 'el', menuFx: true,
  cb: 'off', cbK: 1, noFlash: false, calm: false };

const PRESET_INFO = { // name, what you get, cost (1-5)
  low: ['Low', 'Fastest. No shadows or effects, 75% resolution, sharpened.', 1],
  medium: ['Medium', 'Soft shadows, bloom and FXAA edges.', 2],
  high: ['High', 'Ambient occlusion, god rays, mist and MSAA 4× edges.', 3],
  vhigh: ['Very High', 'Ray-traced reflections, volumetric light, contact shadows, 4K shadows.', 4],
  ultra: ['Ultra', 'Everything: ray-traced light, reflections and bounce lighting, contact-hardening soft shadows, MSAA 8×.', 5],
};
const LOOKS = { // Display > Look presets: only the style, never the frame rate
  default: ['Default', { grade: true, vig: 1, grain: 1, ca: 1, sat: 1, con: 1, tone: 'aces' }],
  cinematic: ['Cinematic', { grade: true, vig: 1.4, grain: 1.5, ca: 1.6, sat: .92, con: 1.06, tone: 'agx' }],
  vivid: ['Vivid', { grade: true, vig: .6, grain: .4, ca: .5, sat: 1.3, con: 1.08, tone: 'aces' }],
  clean: ['Clean', { grade: false, vig: 0, grain: 0, ca: 0, sat: 1, con: 1, tone: 'neutral' }],
};
const SET_TABS = [['game', '◆', 'Game'], ['graphics', '✦', 'Graphics'], ['display', '▣', 'Display'], ['audio', '♪', 'Audio'], ['controls', '⌖', 'Controls'],
  ['gameplay', '⚔', 'Gameplay'], ['interface', '◎', 'Interface'], ['access', '◐', 'Accessibility']];
const TAB_INFO = {
  game: ['Paused', 'Switch element, use the test cheats, or leave to the menu. Online, the game keeps running for your partner.'],
  graphics: ['Graphics', 'Pick one of the five presets, then fine-tune anything below. The game behind this menu is live, so every change shows at once.'],
  display: ['Display', 'The screen, frame rate and the look of the picture. Look presets change only the style, never the frame rate.'],
  audio: ['Audio', 'Volumes for everything you hear.'],
  controls: ['Controls', 'Mouse, controller and keys. Click a key, then press the new one (Esc cancels; taking a used key swaps the two).'],
  gameplay: ['Gameplay', 'How the fight feels: view, shake, hands and damage numbers.'],
  interface: ['Interface', 'The HUD, crosshair and menus.'],
  access: ['Accessibility', 'Colour-blind filters and calmer, safer visuals.'],
};
// a row: k setting, t control (seg: buttons, step: ‹ value ›, range: slider, tog: switch), n name, d what it does,
// o options [value, label], c GPU cost 1-5, need: only usable when (needT says why not)
const SET_UI = {
  graphics: [{ t: 'presets' },
    { h: 'Lighting' },
    { k: 'shadowQ', t: 'seg', n: 'Shadows', o: [[0, 'Off'], [1, 'Low'], [2, 'Medium'], [3, 'High'], [4, 'Ultra']], c: 3, d: 'Shadows from the black hole’s light, drawn sharper from Low (1024 map) to High (4096). Ultra adds contact-hardening soft shadows: crisp where things touch the ground, softer the further they fall, like real sunlight.' },
    { k: 'ao', t: 'seg', n: 'Ambient occlusion', o: [[0, 'Off'], [1, 'Low'], [2, 'High'], [3, 'Ray-traced']], c: 3, d: 'Soft shadow in corners and creases and wherever things meet the floor, so nothing looks pasted on. Ray-traced walks 8 directions per pixel at full resolution and adds bounce light.' },
    { k: 'gi', t: 'tog', n: 'Bounce lighting', c: 2, need: o => o.ao > 0, needT: 'Needs ambient occlusion.', d: 'Global illumination: light that hits a surface bounces onto its neighbours and carries its colour, traced with the same rays as ambient occlusion.' },
    { k: 'ssr', t: 'seg', n: 'Reflections', o: [[0, 'Off'], [1, 'Low'], [2, 'High'], [3, 'Ray-traced']], c: 4, d: 'The floor mirrors the arena, spells and monsters, strongest at low angles like polished stone. Each pixel traces a ray through the scene, up to 56 steps on Ray-traced.' },
    { k: 'contact', t: 'tog', n: 'Contact shadows', c: 1, d: 'A short ray toward the light from every pixel, so feet, rubble and small details cast crisp shadows the shadow map is too coarse for.' },
    { k: 'vlight', t: 'seg', n: 'Volumetric light', o: [[0, 'Off'], [1, 'Low'], [2, 'High']], c: 3, need: o => o.shadowQ > 0, needT: 'Needs shadows.', d: 'Light you can see in the air. Rays are traced through the shadow map, so pillars and monsters cut real beams through the haze.' },
    { k: 'god', t: 'tog', n: 'God rays', c: 1, d: 'Shafts of light streaming from the black hole while it’s on screen, blocked by anything in front of it.' },
    { k: 'fog', t: 'tog', n: 'Atmosphere', c: 1, d: 'Height mist that gathers below the island and in the distance, warmed where it faces the light. Gives the world depth.' },
    { k: 'lights', t: 'tog', n: 'Spell lights', c: 2, d: 'Projectiles and impacts light up the floor, walls and monsters around them. Turning it off saves the most on slow devices.' },
    { h: 'Effects' },
    { k: 'bloom', t: 'seg', n: 'Bloom', o: [[0, 'Off'], [1, 'Low'], [2, 'High'], [3, 'Ultra']], c: 2, d: 'Bright light glows past its edges: spells, flames, crystals and the black hole.' },
    { k: 'flare', t: 'tog', n: 'Lens flare', c: 1, need: o => o.bloom > 0, needT: 'Needs bloom.', d: 'Ghosts and a halo from the brightest lights, as if seen through a real camera lens.' },
    { k: 'mblur', t: 'seg', n: 'Motion blur', o: [[0, 'Off'], [1, 'Low'], [2, 'High']], c: 1, d: 'Blurs the picture while the camera moves fast. Your hands stay sharp.' },
    { k: 'particles', t: 'seg', n: 'Particles', o: [[.5, '50%'], [.75, '75%'], [1, '100%'], [1.25, '125%']], c: 2, d: 'How many sparks, embers and motes spells and braziers throw.' },
    { h: 'Image quality' },
    { k: 'scale', t: 'range', n: 'Render scale', min: .5, max: 2, step: .05, f: pct, c: 5, d: 'How many pixels the game draws. Under 100% runs faster but softer; over 100% supersamples for the cleanest picture (heavy).' },
    { k: 'aa', t: 'step', n: 'Anti-aliasing', o: [['off', 'Off'], ['fxaa', 'FXAA'], ['msaa2', 'MSAA 2×'], ['msaa4', 'MSAA 4×'], ['msaa8', 'MSAA 8×']], c: 2, d: 'Smooths jagged edges. FXAA is a cheap filter; MSAA samples every edge 2 to 8 times.' },
    { k: 'sharpen', t: 'range', n: 'Sharpening', min: 0, max: 1, step: .05, f: pct, c: 1, d: 'Contrast-adaptive sharpening brings back fine detail, especially below 100% render scale.' },
    { k: 'aniso', t: 'step', n: 'Texture filtering', o: [[1, 'Off'], [2, '2×'], [4, '4×'], [8, '8×'], [16, '16×']], c: 1, d: 'Keeps textures on floors and walls sharp at low angles (anisotropic filtering).' },
    { k: 'autoQ', t: 'tog', n: 'Adaptive quality', d: 'If a game runs under 30 FPS for a few seconds, the game drops one preset by itself.' }],
  display: [{ h: 'Screen' },
    { k: 'full', t: 'tog', n: 'Fullscreen', d: 'Fill the whole screen. Esc leaves fullscreen in most browsers.' },
    { k: 'fpsCap', t: 'step', n: 'Frame rate limit', o: [[0, 'Unlimited'], [30, '30'], [60, '60'], [90, '90'], [120, '120'], [144, '144'], [165, '165'], [240, '240']], d: 'Caps how often the game draws. Lower saves battery and keeps laptops cool; your screen’s refresh rate is always the ceiling.' },
    { k: 'showFps', t: 'tog', n: 'Show FPS', d: 'A small frame-rate counter in the corner.' },
    { h: 'Picture' },
    { k: 'bright', t: 'range', n: 'Brightness', min: .6, max: 1.6, step: .05, f: pct, d: 'Exposure of the whole scene.' },
    { k: 'con', t: 'range', n: 'Contrast', min: .8, max: 1.3, step: .02, f: pct, d: 'Separation between darks and lights.' },
    { k: 'sat', t: 'range', n: 'Saturation', min: 0, max: 1.6, step: .05, f: pct, d: 'Colour strength. 0% is black and white.' },
    { k: 'tone', t: 'step', n: 'Tone mapping', o: [['aces', 'ACES Filmic'], ['agx', 'AgX'], ['neutral', 'Neutral'], ['reinhard', 'Reinhard'], ['cineon', 'Cineon']], d: 'How bright light is squeezed onto the screen. ACES is punchy and filmic, AgX softer and truer in strong colour, Neutral keeps colours as they were made.' },
    { h: 'Look' },
    { t: 'looks' },
    { k: 'grade', t: 'tog', n: 'Colour grade', d: 'Cool shadows and warm highlights, with a little extra colour.' },
    { k: 'vig', t: 'range', n: 'Vignette', min: 0, max: 2, step: .05, f: pct, d: 'Darkens the corners of the screen.' },
    { k: 'grain', t: 'range', n: 'Film grain', min: 0, max: 2, step: .05, f: pct, d: 'Fine moving grain, like film.' },
    { k: 'ca', t: 'range', n: 'Chromatic aberration', min: 0, max: 2, step: .05, f: pct, d: 'A thin colour fringe toward the edges, like a real lens.' }],
  audio: [
    { k: 'master', t: 'range', n: 'Master volume', min: 0, max: 1, step: .05, f: pct, d: 'Everything at once.' },
    { k: 'vol', t: 'range', n: 'Sound effects', min: 0, max: 1.5, step: .05, f: pct, d: 'Spells, hits, footsteps and the menus.' },
    { k: 'mus', t: 'range', n: 'Music', min: 0, max: 1.5, step: .05, f: pct, d: 'The soundtrack.' },
    { k: 'rev', t: 'range', n: 'Reverb', min: 0, max: 1.5, step: .05, f: pct, d: 'The stone-hall echo on big spells.' },
    { k: 'menuMusic', t: 'tog', n: 'Menu music', d: 'Music on the menus as well as in battle.' },
    { k: 'bgMute', t: 'tog', n: 'Mute in background', d: 'Silence the game while it’s in another tab or window.' }],
  controls: [{ h: 'Mouse' },
    { k: 'sens', t: 'range', n: 'Sensitivity', min: .2, max: 3, step: .05, f: v => v.toFixed(2), d: 'How far the camera turns as you move the mouse.' },
    { k: 'invert', t: 'tog', n: 'Invert Y', d: 'Push the mouse forward to look down.' },
    { k: 'raw', t: 'tog', n: 'Raw input', d: 'Skips your system’s mouse acceleration for one-to-one aim (Chrome and Edge).' },
    { h: 'Combat' },
    { k: 'blockMode', t: 'seg', n: 'Block', o: [['hold', 'Hold'], ['toggle', 'Toggle']], d: 'Hold the block key, or tap it once to raise your guard and again to lower it.' },
    { h: 'Controller' },
    { k: 'padSens', t: 'range', n: 'Look speed', min: .3, max: 3, step: .05, f: v => v.toFixed(2), d: 'How fast the right stick turns the camera.' },
    { k: 'padInvert', t: 'tog', n: 'Invert Y', d: 'Push the right stick up to look down.' },
    { k: 'dead', t: 'range', n: 'Stick dead zone', min: .05, max: .35, step: .01, f: pct, d: 'How far a stick has to move before it counts. Raise it if the camera drifts.' },
    { k: 'rumble', t: 'tog', n: 'Vibration', d: 'The controller rumbles with hits and explosions.' },
    { h: 'Keys' },
    { t: 'binds' }],
  gameplay: [
    { k: 'fov', t: 'range', n: 'Field of view', min: 60, max: 110, step: 1, f: v => v + '°', d: 'How wide you see. Wider shows more of the arena; narrower feels closer.' },
    { k: 'shake', t: 'range', n: 'Screen shake', min: 0, max: 1.5, step: .05, f: pct, d: 'How hard the camera shakes on big hits and explosions.' },
    { k: 'kick', t: 'range', n: 'Speed effects', min: 0, max: 1.5, step: .05, f: pct, d: 'The quick widening of the view on dashes and heavy casts.' },
    { k: 'bob', t: 'range', n: 'Hand sway', min: 0, max: 1.5, step: .05, f: pct, d: 'How much your hands bob while you walk.' },
    { k: 'hands', t: 'tog', n: 'Show hands', d: 'Your casting hands in first person.' },
    { k: 'nums', t: 'tog', n: 'Damage numbers', d: 'Numbers that pop off enemies when you hit them.' },
    { k: 'numSize', t: 'range', n: 'Number size', min: .6, max: 1.6, step: .05, f: pct, need: o => o.nums, needT: 'Needs damage numbers.', d: 'How big those numbers are.' },
    { k: 'autoPause', t: 'tog', n: 'Pause when you look away', d: 'A solo game pauses when you switch to another window or tab.' }],
  interface: [{ h: 'HUD' },
    { k: 'hudScale', t: 'range', n: 'HUD size', min: .7, max: 1.4, step: .05, f: pct, d: 'Health, guard, dash and the spell bar.' },
    { k: 'hudAlpha', t: 'range', n: 'HUD opacity', min: .3, max: 1, step: .05, f: pct, d: 'Fade the HUD to see more of the fight.' },
    { k: 'ping', t: 'tog', n: 'Show ping', d: 'Your connection delay to your friend in online games.' },
    { h: 'Crosshair' },
    { k: 'cross', t: 'step', n: 'Style', o: [['rune', 'Rune ring'], ['dot', 'Dot'], ['cross', 'Cross'], ['circle', 'Circle'], ['none', 'None']], d: 'The aiming mark in the middle of the screen.' },
    { k: 'crossSize', t: 'range', n: 'Size', min: .5, max: 2, step: .05, f: pct, d: 'How big the crosshair is.' },
    { k: 'crossCol', t: 'step', n: 'Colour', o: [['el', 'Element'], ['#ffffff', 'White'], ['#5dff8a', 'Green'], ['#ffe14a', 'Yellow'], ['#4ae3ff', 'Cyan'], ['#ff5ad8', 'Pink'], ['#ff4a4a', 'Red']], d: 'Element matches the colour of the element you’re playing.' },
    { h: 'Menus' },
    { k: 'menuFx', t: 'tog', n: 'Menu effects', d: 'The element’s weather filling the screen on the element select.' }],
  access: [
    { k: 'cb', t: 'step', n: 'Colour-blind filter', o: [['off', 'Off'], ['protan', 'Protanopia'], ['deutan', 'Deuteranopia'], ['tritan', 'Tritanopia']], d: 'Shifts colours you might confuse into ones you can tell apart. Protanopia and deuteranopia are red-green; tritanopia is blue-yellow.' },
    { k: 'cbK', t: 'range', n: 'Filter strength', min: 0, max: 1, step: .05, f: pct, need: o => o.cb !== 'off', needT: 'Pick a filter first.', d: 'How strongly the filter shifts colours.' },
    { k: 'noFlash', t: 'tog', n: 'Reduce flashing', d: 'Dims light flashes, white-outs and lightning across the sky.' },
    { k: 'calm', t: 'tog', n: 'Reduce motion', d: 'Turns off screen shake, speed effects, hand sway and menu animation.' }],
};
const SET_ROWS = Object.fromEntries(Object.values(SET_UI).flat().filter(r => r.k).map(r => [r.k, r]));

// ---- load (and bring an old save across) ----
let settings = { ...SET_DEF };
try {
  const raw = JSON.parse(localStorage.getItem('magepact_settings') || '{}');
  if (raw.v === 2) settings = { ...SET_DEF, ...raw };
  else { // the old pop-up menu: keep its sliders, start graphics from a preset (Low if they'd picked low graphics)
    if (localStorage.getItem('magepact_gfx') === 'low') Object.assign(settings, GFX_PRESETS.low);
    for (const k of ['sens', 'vol', 'mus', 'fov', 'bright', 'shake', 'nums', 'invert', 'keys']) if (raw[k] !== undefined) settings[k] = raw[k];
    if (raw.film === false) Object.assign(settings, { grade: false, vig: 0, grain: 0, ca: 0 });
  }
} catch {}
for (const r of Object.values(SET_ROWS)) { // anything broken or out of range goes back to its default
  const v = settings[r.k];
  if (r.o) { if (!r.o.some(o => o[0] === v)) settings[r.k] = SET_DEF[r.k]; }
  else if (r.t === 'range') settings[r.k] = typeof v === 'number' && isFinite(v) ? clamp(v, r.min, r.max) : SET_DEF[r.k];
  else settings[r.k] = !!v;
}
if (!settings.keys || typeof settings.keys !== 'object') settings.keys = {};
settings.full = !!document.fullscreenElement; settings.preset = gfxPreset(settings);

// ---- the screen ----
const setRow = r => {
  if (r.h) return `<h3>${r.h}</h3>`;
  if (r.t === 'presets') return `<div class="presets">${GFX_ORDER.map(p => `<button class="pre" data-pre="${p}"><b>${PRESET_INFO[p][0]}</b><small>${PRESET_INFO[p][1]}</small><i>${'●'.repeat(PRESET_INFO[p][2])}<u>${'●'.repeat(5 - PRESET_INFO[p][2])}</u></i></button>`).join('')}</div><div id="setCustom" class="hidden">◆ Custom: you’ve changed settings below. Pick a preset to reset them.</div>`;
  if (r.t === 'looks') return `<div class="looks">${Object.entries(LOOKS).map(([k, [n]]) => `<button class="ghost" data-look="${k}">${n}</button>`).join('')}</div>`;
  if (r.t === 'binds') return '<div id="binds"></div><button id="bindReset" class="ghost">Reset keys</button>';
  const c = r.t === 'seg' ? `<div class="seg">${r.o.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div>`
    : r.t === 'step' ? '<div class="step"><button data-d="-1" aria-label="Previous">‹</button><span></span><button data-d="1" aria-label="Next">›</button></div>'
    : r.t === 'range' ? `<input type="range" min="${r.min}" max="${r.max}" step="${r.step}" aria-label="${r.n}"><output></output>`
    : `<button class="tog" role="switch" aria-label="${r.n}"><i></i></button>`;
  return `<div class="srow" data-k="${r.k}"><span class="sn">${r.n}</span><div class="sc">${c}</div></div>`;
};
$('setNav').innerHTML = SET_TABS.map(([id, i, n]) => `<button data-tab="${id}"${id === 'game' ? ' class="hidden"' : ''}><i>${i}</i>${n}</button>`).join('');
$('setMain').insertAdjacentHTML('beforeend', Object.entries(SET_UI).map(([id, rows]) => `<div class="pane hidden" data-pane="${id}">${rows.map(setRow).join('')}</div>`).join(''));
let setTab = 'graphics', setHid = [];
function showTab(id) {
  setTab = id;
  for (const b of $('setNav').children) b.classList.toggle('on', b.dataset.tab === id);
  for (const p of document.querySelectorAll('#settings .pane')) p.classList.toggle('hidden', p.dataset.pane !== id);
  $('setMain').scrollTop = 0; setInfo(null); $('setReset').classList.toggle('hidden', id === 'game');
}
const COST = c => c ? `<span class="cost">GPU cost <i>${'●'.repeat(c)}</i><u>${'●'.repeat(5 - c)}</u></span>` : '';
function setInfo(el) {
  let n, d, c;
  if (el?.dataset.pre) [n, d, c] = [PRESET_INFO[el.dataset.pre][0] + ' preset', PRESET_INFO[el.dataset.pre][1], PRESET_INFO[el.dataset.pre][2]];
  else if (el?.dataset.k) { const r = SET_ROWS[el.dataset.k]; n = r.n; d = r.d + (r.need && !r.need(settings) ? ` <em>${r.needT}</em>` : ''); c = r.c; }
  else if (el?.dataset.look) [n, d] = [LOOKS[el.dataset.look][0] + ' look', 'Sets the grade, vignette, grain, fringe, saturation, contrast and tone mapping in one go.'];
  else [n, d] = TAB_INFO[setTab];
  $('setInfo').innerHTML = `<b>${n}</b><p>${d}</p>${COST(c)}`;
}
function syncSet() { // every control shows its setting
  for (const el of document.querySelectorAll('#settings .srow')) {
    const r = SET_ROWS[el.dataset.k], v = settings[r.k];
    el.classList.toggle('off', !!(r.need && !r.need(settings)));
    if (r.t === 'seg') for (const b of el.querySelectorAll('.seg button')) b.classList.toggle('on', b.dataset.v === String(v));
    else if (r.t === 'step') el.querySelector('.step span').textContent = r.o.find(o => o[0] === v)?.[1] ?? v;
    else if (r.t === 'range') { const i = el.querySelector('input'); if (+i.value !== v) i.value = v; el.querySelector('output').textContent = r.f(v); i.style.setProperty('--p', (v - r.min) / (r.max - r.min) * 100 + '%'); }
    else el.querySelector('.tog').classList.toggle('on', !!v);
  }
  const p = settings.preset, name = p === 'custom' ? 'Custom' : PRESET_INFO[p][0];
  for (const b of document.querySelectorAll('#settings .pre')) b.classList.toggle('on', b.dataset.pre === p);
  $('setCustom').classList.toggle('hidden', p !== 'custom');
  $('setPreset').innerHTML = `Graphics <b>${name}</b>`; $('gfxBtn').textContent = `Graphics: ${name}`;
}
function setVal(k, v) {
  if (settings[k] === v) return;
  settings[k] = v;
  if (GFX_KEYS.includes(k)) settings.preset = gfxPreset(settings);
  if (k === 'full') try { v ? document.documentElement.requestFullscreen?.()?.catch?.(() => {}) : document.fullscreenElement && document.exitFullscreen?.(); } catch {}
  saveSettings();
}
$('setNav').onclick = e => { const b = e.target.closest('button[data-tab]'); if (b) { showTab(b.dataset.tab); sfx('pick'); } };
$('setMain').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.pre) { Object.assign(settings, GFX_PRESETS[b.dataset.pre], { preset: b.dataset.pre }); sfx('pick'); saveSettings(); setInfo(b); return; }
  if (b.dataset.look) { Object.assign(settings, LOOKS[b.dataset.look][1]); sfx('pick'); saveSettings(); return; }
  const row = b.closest('.srow'); if (!row || row.classList.contains('off')) return;
  const r = SET_ROWS[row.dataset.k];
  if (r.t === 'seg') setVal(r.k, r.o.find(o => String(o[0]) === b.dataset.v)[0]);
  else if (r.t === 'step') { const i = r.o.findIndex(o => o[0] === settings[r.k]); setVal(r.k, r.o[(i + +b.dataset.d + r.o.length) % r.o.length][0]); }
  else if (r.t === 'tog') setVal(r.k, !settings[r.k]);
  sfx('pick'); setInfo(row);
});
// sliders apply as they move, except render scale (it rebuilds the frame buffers: once, on release)
$('setMain').addEventListener('input', e => {
  const row = e.target.closest('.srow'); if (!row || e.target.type !== 'range') return;
  const r = SET_ROWS[row.dataset.k], v = +e.target.value;
  if (r.k === 'scale') { row.querySelector('output').textContent = r.f(v); e.target.style.setProperty('--p', (v - r.min) / (r.max - r.min) * 100 + '%'); } else setVal(r.k, v);
});
$('setMain').addEventListener('change', e => { const row = e.target.closest('.srow'); if (row?.dataset.k === 'scale') setVal('scale', +e.target.value); });
$('setMain').addEventListener('pointerover', e => { const el = e.target.closest('.srow, .pre, [data-look]'); if (el) setInfo(el); });
$('setReset').onclick = () => { // this tab back to its defaults
  for (const r of SET_UI[setTab] || []) if (r.k && r.k !== 'full') settings[r.k] = SET_DEF[r.k];
  if (setTab === 'graphics') settings.preset = gfxPreset(settings);
  if (setTab === 'controls') settings.keys = {};
  sfx('pick'); saveSettings();
};
// hold to hide the menu and look at the live scene behind it
const peek = on => $('settings').classList.toggle('peek', on);
$('setPeek').addEventListener('pointerdown', () => peek(true));
for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) $('setPeek').addEventListener(ev, () => peek(false));
document.addEventListener('fullscreenchange', () => { settings.full = !!document.fullscreenElement; syncSet(); });

// opening covers (hides) the main screen or lobby, closing brings it back; in a game it opens on the Game tab
function openSettings(tab) {
  if (!$('settings').classList.contains('hidden')) { if (tab) showTab(tab); return; }
  unlockMouse(); // the menu needs the cursor (a controller's Start or switching away can open it while the mouse is captured)
  setHid = ['modes', 'lobby', 'over', 'talents'].filter(id => !$(id).classList.contains('hidden'));
  for (const id of setHid) $(id).classList.add('hidden');
  $('settings').classList.remove('hidden');
  $('setNav').querySelector('[data-tab=game]').classList.toggle('hidden', !playing);
  showTab(tab || (playing ? 'game' : setTab === 'game' ? 'graphics' : setTab));
  syncSet(); menuChanged(); fpsShow();
}
function closeSettings() {
  if ($('settings').classList.contains('hidden')) return;
  $('settings').classList.add('hidden'); peek(false); rebinding = null;
  if (!playing) for (const id of setHid) $(id).classList.remove('hidden'); // a game that started meanwhile keeps the screen
  setHid = []; menuChanged();
}
addEventListener('keydown', e => { if (e.code === 'Escape' && !playing && !$('settings').classList.contains('hidden')) closeSettings(); });

// ---- Controls > Keys: click a key, press the new one (Esc cancels). Stored as settings.keys ----
const BIND_NAMES = { fwd: 'Forward', back: 'Back', left: 'Left', right: 'Right', jump: 'Jump', dash: 'Dash', swap: 'Swap element', alt: 'Right click (key)', q: 'Skill 1', e: 'Skill 2', r: 'Ultimate', block: 'Block' };
let rebinding = null;
function renderBinds() {
  $('binds').innerHTML = Object.entries(BIND_NAMES).map(([k, n]) => `<div>${n}<button class="ghost${rebinding === k ? ' wait' : ''}" data-k="${k}">${rebinding === k ? 'press…' : keyName(BIND[k])}</button></div>`).join('');
  for (const b of $('binds').querySelectorAll('button')) b.onclick = () => { rebinding = b.dataset.k; renderBinds(); };
}
addEventListener('keydown', e => { // capture phase: the key goes to the binding, not the game (or Esc's menu toggle)
  if (!rebinding) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.code !== 'Escape') { for (const k in BIND) if (k !== rebinding && BIND[k] === e.code) settings.keys[k] = BIND[rebinding]; settings.keys[rebinding] = e.code; } // taking a used key swaps the two
  rebinding = null; saveSettings();
}, true);
$('bindReset').onclick = () => { settings.keys = {}; saveSettings(); };

// ---- applying ----
const TONES = { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping, reinhard: THREE.ReinhardToneMapping, cineon: THREE.CineonToneMapping };
// colour-blind filter (daltonize): simulate what that eye sees, then move the difference it loses into colours it can see
const RGB2LMS = new THREE.Matrix3().set(17.8824, 43.5161, 4.11935, 3.45565, 27.1554, 3.86714, .0299566, .184309, 1.46709), LMS2RGB = RGB2LMS.clone().invert();
const CB_SIM = { protan: [0, 2.02344, -2.52581, 0, 1, 0, 0, 0, 1], deutan: [1, 0, 0, .494207, 0, 1.24827, 0, 0, 1], tritan: [1, 0, 0, 0, 1, 0, -.395913, .801109, 0] };
const CB_SHIFT = new THREE.Matrix3().set(0, 0, 0, .7, 1, 0, .7, 0, 1);
function cbMatrix(type, k) {
  const M = new THREE.Matrix3(); if (!CB_SIM[type]) return M;
  const sim = LMS2RGB.clone().multiply(new THREE.Matrix3().set(...CB_SIM[type])).multiply(RGB2LMS), err = new THREE.Matrix3();
  err.elements = err.elements.map((v, i) => v - sim.elements[i]);
  const fix = CB_SHIFT.clone().multiply(err);
  M.elements = M.elements.map((v, i) => v + k * fix.elements[i]);
  return M;
}
const reduceMedia = LFX.reduce;
// volumes: master scales both buses; the menu music and background mute come and go with the game
function audioGains() {
  const away = settings.bgMute && (document.hidden || !document.hasFocus()), m = away ? 0 : settings.master;
  sfxVol = .35 * settings.vol * m; musicVol = .4 * settings.mus * m * (playing || settings.menuMusic ? 1 : 0);
  if (master) master.gain.value = sfxVol; if (musicBus) musicBus.gain.value = musicVol; if (revBus) revBus.gain.value = .5 * settings.rev;
}
let audioPlaying = null;
const audioTick = () => { if (playing !== audioPlaying) { audioPlaying = playing; audioGains(); } }; // every frame (net.js)
addEventListener('focus', audioGains); addEventListener('blur', audioGains);
// a solo game pauses when you switch away (not under test automation, where pages blur all the time)
const lookAway = () => { if (settings.autoPause && !navigator.webdriver && playing && role === 'host' && !conn?.open && $('settings').classList.contains('hidden')) openSettings(); };
addEventListener('blur', lookAway);
document.addEventListener('visibilitychange', () => { if (document.hidden) lookAway(); audioGains(); });
function fpsShow() { // the frame-rate counter (and ping online), plus the live preview's readout
  if (!$('settings').classList.contains('hidden')) $('setFps').textContent = `${fpsNow} FPS`;
  const net = settings.ping && playing && conn?.open, on = settings.showFps || net;
  $('fpsMeter').classList.toggle('hidden', !on);
  if (on) $('fpsMeter').textContent = [settings.showFps && `${fpsNow} FPS · ${fpsNow ? (1000 / fpsNow).toFixed(1) : '–'} ms`, net && `Ping ${ping} ms`].filter(Boolean).join('   ');
}

function applySettings(o) {
  sens = .0022 * o.sens; invertY = o.invert; rawMouse = o.raw; blockToggle = o.blockMode === 'toggle'; if (!blockToggle) blockLatch = false;
  padSens = o.padSens; padInvert = o.padInvert; padDead = o.dead; padRumble = o.rumble;
  baseFov = o.fov; shakeMul = o.calm ? 0 : o.shake; kickMul = o.calm ? 0 : o.kick; bobMul = o.calm ? 0 : o.bob;
  showNums = o.nums; numScale = o.numSize; showHands = o.hands; flashMul = o.noFlash ? .3 : 1; fpsCap = o.fpsCap;
  audioGains();
  applyGfx(o);
  const F = filmPass.uniforms;
  F.uGrade.value = o.grade ? 1 : 0; F.uVig.value = o.vig; F.uGrain.value = o.grain; F.uCA.value = o.ca; F.uSat.value = o.sat; F.uCon.value = o.con; F.uCB.value.copy(cbMatrix(o.cb, o.cbK));
  renderer.toneMapping = TONES[o.tone]; renderer.toneMappingExposure = 1.1 * o.bright;
  const st = document.documentElement.style;
  st.setProperty('--hudS', o.hudScale); st.setProperty('--hudA', o.hudAlpha); st.setProperty('--crossS', o.crossSize);
  if (o.crossCol === 'el') st.removeProperty('--xc'); else st.setProperty('--xc', o.crossCol);
  $('cross').dataset.s = o.cross;
  document.body.classList.toggle('calm', o.calm);
  LFX.reduce = o.calm || reduceMedia; menuFxOn = o.menuFx; $('elFx').classList.toggle('hidden', !o.menuFx);
  Object.assign(BIND, BIND_DEF, o.keys); hudKey = ''; renderBinds();
  syncSet();
}
const saveSettings = () => { applySettings(settings); try { localStorage.setItem('magepact_settings', JSON.stringify(settings)); } catch {} };
applySettings(settings);
$('gfxBtn').onclick = () => { sfx('pick'); openSettings('graphics'); };
