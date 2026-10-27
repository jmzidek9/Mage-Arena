// Mage Arena client view (same on host and guest): host events -> VFX, scene sync (enemies, projectiles,
// entities, partner wizard), first-person channel / charge / aim visuals, HUD, lobby and end screens.
'use strict';

let myId = 'h', role = 'host', playing = false;
let timeFx = 0, whiteFx = 0;
const views = { p: new Map(), e: new Map(), s: new Map(), n: new Map(), ch: new Map(), aura: new Map() };
const Q_FACE = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2);
const distTo = (x, z) => Math.hypot(camera.position.x - x, camera.position.z - z);
const me = () => role === 'guest' ? G : S.players[myId];
const srcState = () => role === 'guest' ? R : S;
let castFxN = 0;

// ===================== cast + event VFX =====================
function castFx(e) {
  const m = MOVE[e.m]; if (!m) return;
  castFxN++;
  const el = m.el, col = EL[el].color, mine = e.id === myId, big = (e.mega ? 1.8 : 1) * [1, 1.25, 1.35, 1.35, 2.2][m.slot];
  const fc = circleFx(el, V(e.x, e.y + .07, e.z), 1.7 * big, { life: m.slot === 4 ? 1.2 : .75 });
  if (mine) fc.userData.dim = .45; // the circle under your own camera fills the view, keep it subtle
  if (!mine) { pillarFx(e.x, e.y + .05, e.z, 1.35 * big, 3.6 * big, col); flash(e.x, e.y + .6, e.z, col, 12, .35); } // never stack glow around your own camera
  if (mine) { circleFx(el, V(-.26, -.17, -.85), .17 * Math.min(big, 1.6), { parent: camera, quat: Q_FACE, life: .4 }); vmKick = 1; shake(e.mega ? .3 : m.slot === 4 ? .35 : .05); }
  else circleFx(el, V(...e.o), .55 * big, { quat: new THREE.Quaternion().setFromUnitVectors(UP, V(...e.d)), life: .45 });
  for (let k = 0; k < 22; k++) {
    const a = rand(0, TAU), r = rand(.6, 1.6) * big;
    emit(e.x + Math.cos(a) * r, e.y + .1, e.z + Math.sin(a) * r, -Math.sin(a) * 2, rand(2, 4.5), Math.cos(a) * 2, col, rand(.15, .3) * (mine ? .3 : 1), rand(.5, .9), -1, 1);
  }
  const [ox, oy, oz] = e.o, [dx, dy, dz] = e.d;
  for (let k = 0; k < 10; k++) emit(ox + dx * .3, oy + dy * .3, oz + dz * .3, dx * rand(3, 8) + rand(-1, 1), dy * rand(3, 8) + rand(-1, 1), dz * rand(3, 8) + rand(-1, 1), col, rand(.03, .07), rand(.2, .4));
  flash(ox, oy, oz, col, mine ? 2 : 14, .2);
  sfx(m.slot === 0 ? el : el + '_big');
  try { m.fx?.cast?.(e); } catch (err) { console.error(err); }
}
// ground warning shapes for enemy attacks: an outline plus a fill that grows until the strike
const teleMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
function teleFx(e) {
  const col = e.ally ? 0x40ff90 : 0xff2a30, g = new THREE.Group(), d = e.d || .5;
  let fill, edge;
  if (e.shape === 'circle') {
    edge = new THREE.Mesh(new THREE.RingGeometry(e.r - .12, e.r, 48).rotateX(-Math.PI / 2), teleMat(col, .8));
    fill = new THREE.Mesh(new THREE.CircleGeometry(e.r, 48).rotateX(-Math.PI / 2), teleMat(col, .28));
  } else if (e.shape === 'cone') {
    const a = e.ang * Math.PI / 180, st = -Math.PI / 2 - a / 2;
    edge = new THREE.Mesh(new THREE.RingGeometry(e.r - .12, e.r, 24, 1, st, a).rotateX(-Math.PI / 2), teleMat(col, .8));
    fill = new THREE.Mesh(new THREE.CircleGeometry(e.r, 24, st, a).rotateX(-Math.PI / 2), teleMat(col, .28));
    g.rotation.y = e.yaw;
  } else if (e.shape === 'line') {
    edge = new THREE.Mesh(new THREE.PlaneGeometry(e.w, e.len).rotateX(-Math.PI / 2).translate(0, 0, e.len / 2), teleMat(col, .18));
    fill = new THREE.Mesh(new THREE.PlaneGeometry(e.w, 1).rotateX(-Math.PI / 2).translate(0, 0, .5), teleMat(col, .35));
    g.rotation.y = e.yaw;
  } else return;
  g.add(edge, fill); g.position.set(e.x, .09, e.z);
  addFx(g, d + .12, (o, k) => {
    const u = Math.min(1, k * (d + .12) / d);
    if (e.shape === 'line') fill.scale.z = Math.max(.01, e.len * u); else fill.scale.setScalar(Math.max(.01, u));
    fill.material.opacity = .2 + .25 * u; edge.material.opacity = (u >= 1 ? 1 - (k * (d + .12) - d) / .12 : .6 + .4 * Math.sin(u * 30));
  });
  if (distTo(e.x, e.z) < 16) sfx('tele');
}
const COMBO_FX = {
  steam(e) { meshFx(T.steam, V(e.x, e.y, e.z), 1.1, 1, 3.4, .6); burst(e.x, e.y, e.z, 60, 0xffffff, 7, .6, 1, -1.5, 1); },
  shatter(e) { meshFx(T.shatter, V(e.x, e.y, e.z), .7, .5, 2.6, 4); burst(e.x, e.y, e.z, 70, 0x9feaff, 12, .25, .7, 8); ringFx(e.x, .1, e.z, 3.5, 0x7fe6ff, .5); },
  overload(e) { meshFx(T.overload, V(e.x, e.y, e.z), .55, .3, 3.6, 2); burst(e.x, e.y, e.z, 80, 0xffc040, 14, .3, .6, 2); burst(e.x, e.y, e.z, 40, 0xc0a0ff, 10, .3, .5); ringFx(e.x, .1, e.z, 6, 0xffc040, .55); },
};
function onEvent(e) {
  switch (e.k) {
    // the guest already drew its own casts instantly in stepCast(predict), so skip the host's late echo
    case 'cast': if (role !== 'guest' || e.id !== myId) castFx(e); break;
    case 'fx': try { MOVE[e.m]?.fx?.[e.f]?.(e); if (e.m === 'foe' && e.f === 'mend') { ringFx(e.x, .1, e.z, 9, 0x40ff90, .6); burst(e.x, 1.5, e.z, 40, 0x80ffb0, 6, .3, .7, -2); sfx('heal'); } } catch (err) { console.error(e, err); } break;
    case 'bolt': {
      const col = EL[e.el]?.color ?? EL.storm.color;
      boltFx(e.pts, col);
      for (const p of e.pts.slice(1)) { burst(...p, e.q ? 6 : 14, 0xd8c8ff, 6, .15, .3); if (!e.q) flash(...p, col, 30, .15); }
      if (e.sky) { shake(.12); sfx('storm'); } else if (e.q && Math.random() < .3) sfx('storm');
      break;
    }
    case 'crown': { const col = EL[e.el].color; boltFx(e.pts, col); const [x, y, z] = e.pts[1]; burst(x, y, z, 20, col, 6, .2, .35); flash(x, y, z, col, 30, .2); sfx(e.el); break; }
    case 'dmg': {
      const col = e.b ? '#9a9aa8' : e.c ? '#ffe36a' : css(EL[e.el]?.color ?? 0xffffff);
      if (!e.d || Math.random() < .5) popNum(e.x, e.y, e.z, e.c ? e.n + '!' : e.n, col, (e.c ? 'crit ' : '') + (e.d ? 'dot' : ''));
      const v = views.e.get(e.id); if (v && !e.d) { v.flash = .09; v.flinch = Math.min(1.3, v.flinch + (e.c ? 1.1 : .6)); }
      if (!e.d) sfx(e.c ? 'crit' : 'hit');
      break;
    }
    case 'combo': {
      const p = V(e.x, e.y, e.z), A = EL[e.a].color, B = EL[e.b].color;
      comboText(e.name, e.color);
      if (COMBO_FX[e.kind]) COMBO_FX[e.kind](e);
      else { burst(e.x, e.y, e.z, 50, A, 10, .35, .6, 2); burst(e.x, e.y, e.z, 50, B, 12, .3, .6, -1); ringFx(e.x, .1, e.z, 4.5, B, .5); circleFx(e.b, V(e.x, .1, e.z), 3, { life: .6 }); }
      flash(e.x, e.y + 1, e.z, e.color, 45, .4);
      shake(.45); sfx('combo');
      break;
    }
    case 'die': {
      const col = EL[e.el]?.color ?? 0xb08cff, s = e.sc * (e.boss ? 3 : 1);
      burst(e.x, e.y + 1 * s, e.z, e.boss ? 260 : 36, col, 7 * s, .3 * s, .7, 3);
      burst(e.x, e.y + 1 * s, e.z, e.boss ? 120 : 18, 0x2a1840, 5 * s, .4 * s, .8, 4);
      ringFx(e.x, .08, e.z, 2 * s, col, .4);
      const v = views.e.get(e.id); if (v) v.died = { col, kx: e.x - camera.position.x, kz: e.z - camera.position.z };
      if (e.boss || e.elite) { flash(e.x, 2, e.z, col, 70, .8); shake(.8); banner(e.boss ? 'TYRANT SLAIN' : 'ELITE SLAIN', '#ffd36a'); }
      sfx(e.boss ? 'ring' : 'die');
      break;
    }
    case 'blk': cityApply(e); break; // Mage City: blocks blasted out or collapsing
    case 'prop': cityPropFx(e); break;
    case 'cityreset': if (role === 'guest') cityReset(); break;
    case 'spawn': {
      circleFx('sigil', V(e.x, .06, e.z), 1.6 * Math.max(1, e.s * 1.4), { life: 1.1, color: 0xff3050 });
      for (let k = 0; k < 16; k++) emit(e.x + rand(-1, 1), .1, e.z + rand(-1, 1), 0, rand(2, 5), 0, 0xff3050, .25, .8);
      sfx('spawn');
      break;
    }
    case 'tele': teleFx(e); { const v = views.e.get(e.id); if (v) v.wind = e.d; } break;
    case 'strike': { const v = views.e.get(e.id); if (v) v.strike = 1; if (e.a === 'smash' || e.a === 'slam') sfx('smash'); break; }
    case 'stagger': popNum(e.x, e.y + .4, e.z, 'STAGGER', '#ffd36a', 'tag'); ringFx(e.x, e.y, e.z, 1.5, 0xffd36a, .3); sfx('stagger'); break;
    case 'miss': if (e.id === myId) popNum(camera.position.x, camera.position.y + .2, camera.position.z, 'MISSED: A PHANTOM', '#f0a6ff', 'tag'); else popNum(e.x, e.y, e.z, 'MISS', '#f0a6ff', 'tag'); burst(e.x, e.y - .5, e.z, 20, 0xffc8ff, 4, .2, .4); sfx('illusion'); break;
    case 'block': burst(e.x, e.y, e.z, 12, 0xffe0a0, 6, .12, .25, 6); flash(e.x, e.y, e.z, 0xffe0a0, 8, .1); sfx('block'); break;
    case 'land': dustFx(e.x, e.z, e.s * 2); shake(clamp(.25 - distTo(e.x, e.z) * .01, 0, .2)); sfx('smash'); break;
    case 'dodge':
      if (e.id === myId) { banner('PERFECT DODGE', '#8ae8ff', 1000); dodgeFx = .6; sfx('dodge'); const m = me(); if (m) m.dcd = 0; }
      break;
    case 'enrage': banner('THE TYRANT IS ENRAGED', '#ff5a3a', 2200); shake(.6); sfx('ring'); break;
    case 'ult': if (e.id !== myId) banner(`PARTNER: ${e.name.toUpperCase()}`, css(EL[e.el].color), 1300); else sfx('ult'); break;
    case 'echo': if (e.id === myId) popNum(camera.position.x, camera.position.y + .3, camera.position.z, 'ECHO', '#ffd36a', 'tag'); break;
    case 'heal': if (e.id === myId) { healT = 1; } break;
    case 'pickup': burst(e.x, .8, e.z, e.big ? 80 : 30, 0x6aff9a, 6, .3, .6, -2); sfx(e.big ? 'heal' : 'pickup'); if (e.big) banner('HEARTSTONE: TEAM HEALED', '#8affc0', 1400); break;
    case 'hurt': if (e.id === myId) { hurtT = 1; shake(.35); sfx('hurt'); } break;
    case 'down': banner(e.id === myId ? 'YOU ARE DOWN' : 'PARTNER DOWN, REVIVE THEM', '#ff6a8a'); break;
    case 'up': banner(e.id === myId ? 'REVIVED' : 'PARTNER REVIVED', '#8affc0'); sfx('pick'); break;
    case 'wave': {
      banner(e.boss ? `WAVE ${e.n}: THE TYRANT` : `WAVE ${e.n}`, e.boss ? '#ff8a4a' : '#e8dcff', 2200);
      $('mod').textContent = e.mod ? { swarm: '⚠ Swarm: twice the enemies, half the health', haste: '⚠ Haste: enemies move faster', darkness: '⚠ Darkness falls', elite: '⚠ An elite stalks you' }[e.mod] : '';
      sfx('wave');
      break;
    }
    case 'clear': banner(`WAVE ${e.n} CLEARED`, '#8affc0'); $('mod').textContent = ''; timeFx = 0; break;
    case 'ring': {
      const mats = glowMats(0xff6a2a), o = glowify(T.shock.clone(), mats); o.position.set(e.x, .12, e.z);
      addFx(o, 2.4, (o, k) => { o.scale.setScalar(e.r + 11 * 2.4 * k); setOpacity(mats, 1 - k); });
      shake(.35); sfx('ring');
      break;
    }
    case 'roar': circleFx('sigil', V(e.x, .08, e.z), 4, { life: 1, color: 0xff2020 }); teleFx({ shape: 'line', x: e.x, z: e.z, yaw: e.yaw, len: 14, w: 4.4, d: .25 }); shake(.25); sfx('ring'); break;
    case 'swap': break;
    case 'over': setTimeout(showOver, 1400, e); break;
    case 'floor': banner(`FLOOR ${e.n}${e.boss ? ' · THE WARDEN WAITS' : ''}`, e.boss ? '#ff8a4a' : '#ffd8a0', 2400); sfx('wave'); break;
    case 'room': if (e.f === 'enter') { banner(e.boss ? 'THE BONE WARDEN AWAKENS' : (DUN?.rooms[e.i]?.name || '').toUpperCase(), e.boss ? '#ff6a3a' : '#e8c890', 2000); if (e.boss) { sfx('smash'); shake(.25); } } else { banner(e.stairs ? 'THE WAY DOWN IS OPEN' : 'CHAMBER CLEARED', '#8affc0', 1800); sfx('pick'); } break;
    case 'duel': {
      const me = e.w === myId;
      if (e.f === 'ready') banner(`ROUND ${e.n}`, '#f6ecd0', 1600);
      else if (e.f === 'fight') { banner('FIGHT!', '#ffd36a', 900); sfx('wave'); }
      else if (e.f === 'draw') banner('DRAW · AGAIN', '#cfc8e8', 1800);
      else if (e.f === 'round') { banner(`${me ? 'ROUND WON' : 'ROUND LOST'}${e.ring ? ' · RING OUT' : ''}`, me ? '#8affc0' : '#ff8aa0', 2200); sfx(me ? 'pick' : 'hurt'); }
      break;
    }
  }
}

// ===================== scene sync =====================
function sync(map, list, make, upd, drop) {
  const seen = new Set();
  for (const x of list) {
    seen.add(x.id);
    let v = map.get(x.id), fresh = false;
    if (!v) { v = make(x); map.set(x.id, v); fresh = true; }
    upd(v, x, fresh);
  }
  for (const [id, v] of map) if (!seen.has(id)) { drop(v); map.delete(id); }
}

// ---------- enemies: articulated rigs (parts named <type>_armL etc. in enemies.glb) ----------
const ETPL = {};
for (const k in ET) ETPL[k] = enemiesG.children.find(c => c.name.replace(/\d+$/, '') === k) || null;
const FALLBACK = { bomber: 'runner', knight: 'grunt', shaman: 'shooter', skeleton: 'grunt', rat: 'runner', archer: 'shooter', ghoul: 'splitter', dknight: 'knight', warden: 'boss' };
const PART_RE = /_(body|head|jaw|armL|armR|legL|legR|leg\d|tail|wingL|wingR|ring|tent\d|shield|weapon|eye|fuse|staff|crown)$/;
const RIM = { boss: 0xff5a20, bomber: 0xffa020, knight: 0xa0c0ff, shaman: 0x40ff90, skeleton: 0xbfd4ff, rat: 0xffb060, archer: 0xbfd4ff, ghoul: 0x7aff6a, dknight: 0xff4a4a, warden: 0x5ad8ff };
function makeEnemy(e) {
  const tpl = ETPL[e.type] || ETPL[FALLBACK[e.type]] || ETPL.grunt;
  const g = tpl.clone(), mats = [], parts = {};
  g.position.set(0, 0, 0); g.rotation.order = 'YXZ';
  g.traverse(o => {
    if (o !== g) { const m = o.name.match(PART_RE); if (m) parts[m[1]] = { o, r: o.rotation.clone(), p: o.position.clone() }; }
    if (o.isMesh) { o.material = o.material.clone(); enhance(o.material, e.elite ? 0xffc640 : RIM[e.type] ?? 0x7a4cff); mats.push({ m: o.material, c: o.material.emissive.clone(), i: o.material.emissiveIntensity }); }
  });
  if (!ETPL[e.type]) for (const m of mats) m.c.set(RIM[e.type]), m.i = .5; // placeholder tint until the rig exists
  g.scale.setScalar(e.sc);
  let ring = null;
  if (e.elite) { ring = makeCircle('sigil', 0xffc640); ring.scale.setScalar(1.4); ring.position.y = .05; g.add(ring); }
  scene.add(g);
  return { g, mats, parts, flash: 0, flinch: 0, strike: 0, wind: 0, ph: rand(0, TAU), spd: 0, last: null, ring, ov: {}, bar: null, sc: e.sc };
}
const CC_OV = {
  freeze: (r, h) => { const o = model('frost__block', 0x4cc8ff); o.scale.set(r * 2.2, h * 1.05, r * 2.2); return o; },
  encase: (r, h) => { const o = model('crystal__tomb', 0xff5ad8); o.scale.set(r * 1.9, h * .8, r * 1.9); return o; },
  bubble: (r, h) => { const o = model('gen__orb', 0x4aa0ff); o.scale.setScalar(Math.max(r, h * .5) * 1.3); o.position.y = h * .5; return o; },
  stasis: (r, h) => { const o = model('chrono__clock', 0xffb43a, { flat: true }); o.scale.setScalar(.6); o.position.y = h + .7; return o; },
  root: (r) => { const o = model('nature__roots', 0x4ee04a); o.scale.setScalar(r * .9); return o; },
  fear: (r, h) => { const o = model('spirit__skull', 0x5effc8); o.scale.setScalar(.7); o.position.y = h + .6; return o; },
  lift: (r) => { const o = model('gravity__rings', 0xa040ff, { flat: true }); o.scale.setScalar(r * 2); o.position.y = -2.6; return o; },
  charm: () => { const o = model('illusion__mask', 0xf0a6ff); o.scale.setScalar(1.1); return o; },
  poly: (r, h) => { const o = model('arcane__sheep', 0xd84cff, { shadow: true }); o.scale.setScalar(Math.max(.9, r * 1.6)); return o; }, // the monster itself is hidden meanwhile
};
function animEnemy(v, e, dt, t) {
  const tp = ET[e.type], P = v.parts, g = v.g;
  const pos = g.position, last = v.last || pos.clone();
  const sp = Math.hypot(pos.x - last.x, pos.z - last.z) / Math.max(dt, 1e-4);
  v.last = pos.clone(); v.spd += (Math.min(sp, 20) - v.spd) * Math.min(1, dt * 8);
  const frozen = e.ts || (e.cc && ['freeze', 'stasis', 'encase'].includes(e.cc));
  const walk = frozen ? 0 : clamp(v.spd / (tp.spd * 1.1), 0, 1.6);
  if (!frozen) v.ph += dt * (3 + v.spd * 1.7);
  v.flinch = Math.max(0, v.flinch - dt * 6); v.strike = Math.max(0, v.strike - dt * 4);
  const wind = frozen ? (v.windKeep || 0) : (e.a || 0); v.windKeep = wind;
  const S1 = Math.sin(v.ph), C1 = Math.cos(v.ph), stun = e.cc === 'stun', breath = Math.sin(t * 2.2 + e.id);
  // whole body: bob, lean into the windup, lunge on the strike, flinch from hits, wobble when stunned
  const bob = Math.abs(S1) * .06 * walk;
  g.rotation.x = -wind * .28 + v.strike * .35 - v.flinch * .22 + (tp.boss ? 0 : walk * .06);
  g.rotation.z = stun ? Math.sin(t * 13) * .14 : 0;
  g.position.y += bob * v.sc;
  if (!Object.keys(P).length) { g.scale.set(v.sc * (1 - wind * .08 + v.flinch * .05), v.sc * (1 + wind * .12 - v.flinch * .08 + breath * .02), v.sc * (1 - wind * .08)); return; }
  const set = (k, rx = 0, ry = 0, rz = 0, py = 0) => { const q = P[k]; if (!q) return; q.o.rotation.set(q.r.x + rx, q.r.y + ry, q.r.z + rz); if (py) q.o.position.y = q.p.y + py; };
  set('body', walk * .08 + breath * .02, 0, S1 * .05 * walk, breath * .01);
  if (e.type === 'splitter' && P.body) { const q = Math.sin(t * 6 + e.id) * .06 + Math.abs(S1) * .08 * walk + wind * .18 - v.flinch * .1; P.body.o.scale.set(1 + q, 1 - q * 1.4, 1 + q); P.body.o.rotation.x = 0; }
  set('legL', S1 * .75 * walk); set('legR', -S1 * .75 * walk);
  for (let i = 0; i < 4; i++) set('leg' + i, Math.sin(v.ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * .8 * walk);
  const raise = wind * (tp.atk === 'smash' ? 2.6 : 1.9), swing = v.strike * (tp.atk === 'smash' ? 3.2 : 2.2);
  set('armL', -S1 * .5 * walk - raise + swing, 0, breath * .05);
  set('armR', S1 * .5 * walk - raise * (tp.atk === 'swipe' ? 1.2 : 1) + swing, 0, -breath * .05);
  set('head', -v.flinch * .3 + breath * .04 + (wind > 0 ? -wind * .25 : 0), Math.sin(t * .7 + e.id) * .15);
  set('jaw', wind * .6 + v.strike * .4);
  set('tail', 0, Math.sin(t * 6 + e.id) * .5);
  set('wingL', 0, 0, Math.sin(t * 30) * .6); set('wingR', 0, 0, -Math.sin(t * 30) * .6);
  set('ring', 0, t * (1 + wind * 6), 0);
  for (let i = 0; i < 6; i++) set('tent' + i, Math.sin(t * 3 + i * 1.3) * .3, 0, Math.cos(t * 2.5 + i) * .3);
  set('shield', wind * -.4, 0, 0);
  set('weapon', -wind * 1.4 + swing * .8);
  set('staff', -wind * .8, 0, Math.sin(t * 2) * .1);
  set('eye', 0, Math.sin(t * 1.3 + e.id) * .25, 0);
  if (P.fuse) { P.fuse.o.scale.setScalar(1 + wind * (1 + Math.sin(t * 40)) * .6); }
}
let linkPool = [];
function renderEnemies(src, dt, t, a) {
  const links = {};
  sync(views.e, src.enemies, makeEnemy, (v, e, fresh) => {
    const tg = V(e.x, e.y, e.z), tp = ET[e.type];
    if (fresh) v.g.position.copy(tg); else v.g.position.lerp(tg, a);
    v.g.rotation.y = lerpAngle(v.g.rotation.y, e.yaw, fresh ? 1 : Math.min(1, a * 1.5));
    if (e.type === 'shooter' || e.type === 'shaman') v.g.position.y += Math.sin(t * 2 + e.id) * .15;
    animEnemy(v, e, dt, t);
    if (v.ring) spinCircle(v.ring, dt, .6);
    v.flash -= dt;
    const fz = e.cc === 'freeze' || e.cc === 'encase', grey = e.cc === 'stasis' || e.ts;
    for (const m of v.mats) {
      if (v.flash > 0) { m.m.emissive.setRGB(1, .95, .9); m.m.emissiveIntensity = 1.3; }
      else if (grey) { m.m.emissive.setRGB(.5, .45, .3); m.m.emissiveIntensity = .5; }
      else if (fz || (e.st || []).includes(1)) { m.m.emissive.copy(m.c).lerp(ICE_TINT, .6); m.m.emissiveIntensity = Math.max(m.i, .8); }
      else if (e.a > 0) { m.m.emissive.copy(m.c).lerp(WARN_TINT, e.a * .45); m.m.emissiveIntensity = m.i + e.a * .8; }
      else { m.m.emissive.copy(m.c); m.m.emissiveIntensity = m.i; }
    }
    // crowd-control overlays
    const h = tp.h * e.sc, r = tp.r * e.sc;
    for (const k in v.ov) if (k !== e.cc) { v.ov[k].removeFromParent(); delete v.ov[k]; }
    if (e.cc && CC_OV[e.cc] && !v.ov[e.cc]) { const o = CC_OV[e.cc](r, h); v.ov[e.cc] = o; scene.add(o); }
    for (const k in v.ov) { const o = v.ov[k]; o.position.x = v.g.position.x; o.position.z = v.g.position.z; if (k === 'freeze' || k === 'encase' || k === 'root') o.position.y = v.g.position.y; if (k === 'bubble') o.position.y = v.g.position.y + h * .5; if (k === 'stasis' || k === 'fear' || k === 'charm') { o.position.y = v.g.position.y + h + .7 + (k === 'charm' ? Math.sin(t * 3 + e.id) * .15 : 0); o.lookAt(camera.position); } if (k === 'lift') o.position.y = .1; o.rotation.y += dt * (k === 'lift' ? 2 : 0);
      if (k === 'poly') { o.position.y = v.g.position.y + Math.abs(Math.sin(t * 5 + e.id)) * .12; o.rotation.y = v.g.rotation.y; } } // a sheep hops about
    v.g.visible = e.cc !== 'poly';
    if (e.cc === 'charm' && Math.random() < .3) emit(v.g.position.x + rand(-r, r), v.g.position.y + h * rand(.3, 1), v.g.position.z + rand(-r, r), 0, .6, 0, shimmer(t + e.id).getHex(), .12, .5, -.3);
    const px = v.g.position.x, pz = v.g.position.z, py = v.g.position.y;
    if (e.cc === 'stun' && Math.random() < .5) { const ang = t * 6 + rand(0, .5); emit(px + Math.cos(ang) * r * .8, py + h + .3, pz + Math.sin(ang) * r * .8, 0, 0, 0, 0xffe36a, .12, .25); }
    if (e.cc === 'blind' && Math.random() < .4) emit(px + rand(-r, r), py + h * .85, pz + rand(-r, r), 0, .5, 0, 0xfff0b0, .15, .4);
    if (e.sh > 0 && Math.random() < .3) emit(px + rand(-r, r) * 1.2, py + rand(0, h), pz + rand(-r, r) * 1.2, 0, .3, 0, 0x40ff90, .15, .4);
    for (const si of e.st || []) { const el = ELIST[si]; if (Math.random() < .28) emit(px + rand(-r, r), py + rand(0, h), pz + rand(-r, r), rand(-.5, .5), rand(.5, 2), rand(-.5, .5), EL[el].color, rand(.07, .16), .5, -1); }
    if (e.lk) (links[e.lk] ??= []).push(V(px, py + h * .6, pz));
    // health bar for wounded regular enemies
    if (e.hp < e.max && !tp.boss) {
      if (!v.bar) { v.bar = document.createElement('div'); v.bar.className = 'ebar'; v.bar.innerHTML = '<i></i><b></b>'; $('hud').appendChild(v.bar); }
      const s = _v.set(px, py + h + .45, pz).project(camera), far = distTo(px, pz) > 34;
      v.bar.style.display = s.z > 1 || far ? 'none' : '';
      v.bar.style.left = (s.x * .5 + .5) * innerWidth + 'px'; v.bar.style.top = (-s.y * .5 + .5) * innerHeight + 'px';
      v.bar.firstChild.style.width = Math.max(0, e.hp / e.max * 100) + '%'; v.bar.lastChild.style.width = e.sh > 0 ? Math.min(100, e.sh / e.max * 300) + '%' : '0';
    }
  }, v => { // break apart / burn away instead of vanishing
    v.bar?.remove(); v.g.visible = true; // a polymorphed monster shows its true form as it dies
    for (const k in v.ov) v.ov[k].removeFromParent();
    for (const m of v.mats) { m.m.emissive.copy(m.c); m.m.emissiveIntensity = m.i; }
    const parts = Object.values(v.parts);
    if (parts.length && v.died) {
      const d = v.died, L = Math.hypot(d.kx, d.kz) || 1;
      v.g.updateMatrixWorld(true);
      for (const q of parts) {
        const o = q.o, wp = o.getWorldPosition(V()), wq = o.getWorldQuaternion(new THREE.Quaternion()), ws = o.getWorldScale(V());
        scene.attach(o); o.position.copy(wp); o.quaternion.copy(wq); o.scale.copy(ws);
        const vel = V(d.kx / L * rand(2, 5) + rand(-2, 2), rand(3, 7), d.kz / L * rand(2, 5) + rand(-2, 2)), spin = V(rand(-8, 8), rand(-8, 8), rand(-8, 8));
        addFx(o, 1.1, (o, k, dt) => { vel.y -= 18 * dt; o.position.addScaledVector(vel, dt); if (o.position.y < .1) { o.position.y = .1; vel.y *= -.3; vel.x *= .6; vel.z *= .6; } o.rotation.x += spin.x * dt; o.rotation.y += spin.y * dt; o.rotation.z += spin.z * dt; });
      }
    }
    addFx(v.g, parts.length ? 1.1 : .7, (o, k, dt) => { for (const m of v.mats) m.m.userData.dis.value = .05 + k * (parts.length ? .9 : 1); if (!parts.length) o.position.y -= .4 * dt; });
  });
  // harmonic links: beams between enemies sharing a link group
  let n = 0;
  for (const g in links) { const l = links[g]; for (let i = 0; i + 1 < l.length; i++) { const b = linkPool[n] ||= (() => { const b = beamMesh(0x3ee8ff, .06); scene.add(b); return b; })(); b.visible = true; aimBeam(b, l[i], l[i + 1], .05 + .03 * Math.sin(t * 20 + i)); n++; } }
  for (let i = n; i < linkPool.length; i++) linkPool[i].visible = false;
}
const ICE_TINT = new THREE.Color(0x3fc8ff), WARN_TINT = new THREE.Color(0xff2020);

// ---------- projectiles ----------
const FOE_MAT = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x40ff70).multiplyScalar(2.5) });
function makeShot(s) {
  let o, look = null;
  if (s.foe) { o = new THREE.Group(); T.fireball.forEach(t => o.add(t.clone())); o.traverse(c => c.isMesh && (c.material = FOE_MAT)); o.scale.setScalar(.6); }
  else {
    const m = MOVE[s.mv]; look = m?.look || { m: 'gen__orb', s: .3 };
    if (look.m === 'T.shard') { o = T.shard.clone(); o.userData.mats = []; }
    else o = model(look.m, look.c ?? EL[s.el].color, { flat: !!look.flat });
    o.userData.base = (look.s || 1);
    o.scale.setScalar(o.userData.base * (s.sc || 1));
  }
  scene.add(o);
  const light = shotLights.find(l => !l.userData.used);
  if (light) { light.userData.used = true; light.color.set(s.foe ? 0x40ff70 : EL[s.el].color); light.intensity = s.foe ? 5 : look?.light ?? 3; }
  return { o, light, look };
}
function renderShots(src, dt, t, a) {
  sync(views.s, src.shots, makeShot, (v, s, fresh) => {
    const tg = V(s.x, s.y, s.z), L = v.look;
    if (fresh) v.o.position.copy(tg); else v.o.position.lerp(tg, a);
    if (!L?.noFace && Math.hypot(s.vx, s.vy, s.vz) > .5) v.o.lookAt(_v.set(v.o.position.x + s.vx, v.o.position.y + s.vy, v.o.position.z + s.vz));
    if (s.foe) { v.o.children[1].rotation.z += dt * 8; emit(tg.x, tg.y, tg.z, 0, 0, 0, 0x40ff70, .14, .35, -1); }
    if (L) {
      v.sp ??= V();
      if (L.spin) { v.sp.x += L.spin[0] * dt; v.sp.y += L.spin[1] * dt; v.sp.z += L.spin[2] * dt; if (L.noFace) v.o.rotation.set(v.sp.x, v.sp.y, v.sp.z); else { v.o.rotateX(v.sp.x); v.o.rotateY(v.sp.y); v.o.rotateZ(v.sp.z); } }
      if (L.roll) { v.roll = (v.roll || 0) + Math.hypot(s.vx, s.vz) * dt / (v.o.userData.base || 1); v.o.rotateX(v.roll); }
      v.o.scale.setScalar(v.o.userData.base * (s.sc || 1) * (L.flick ? rand(.85, 1.15) : 1));
      if (L.flap) v.o.scale.x *= .35 + .65 * Math.abs(Math.sin(t * 22 + s.id)); // wings beating
      if (L.jaw) { const j = v.jaw ??= v.o.getObjectByName(L.jaw); if (j) j.rotation.x = Math.abs(Math.sin(t * 16 + s.id)) * .55; }
      if (L.wag) { const j = v.wag ??= v.o.getObjectByName(L.wag), w = Math.sin(t * 13 + s.id); if (j) j.rotation.y = w * .6; v.o.rotateY(-w * .15); } // a swimming tail
      if (L.blink) fade(v.o, .6 + .4 * Math.sin(t * 20));
      if (L.dust && v.o.position.y < 2.5 && Math.random() < .35) smokeFx(v.o.position.x, .3, v.o.position.z, .9, L.dust, 1, 1, .5); // kicks up real dust as it rolls
      if (L.suck) { const [c, R] = L.suck, p = v.o.position; for (let k = 0; k < 2; k++) { const a = rand(0, TAU), b = rand(-.6, .6), d = V(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)); emit(p.x + d.x * R, p.y + d.y * R, p.z + d.z * R, -d.x * R * 3.2, -d.y * R * 3.2, -d.z * R * 3.2, c, rand(.05, .1), .3, 0, 0); } } // matter dragged into it
      if (L.trail) { const [c, sz, life, grav, n] = L.trail; const p = v.o.position; for (let k = 0; k < n; k++) emit(p.x + rand(-.1, .1), p.y + rand(-.1, .1), p.z + rand(-.1, .1), rand(-.5, .5), rand(0, 1), rand(-.5, .5), typeof c === 'function' ? c() : c, sz * (s.sc || 1), life, grav); }
    }
    if (v.light) v.light.position.copy(v.o.position);
  }, v => { v.o.removeFromParent(); if (v.light) { v.light.intensity = 0; v.light.userData.used = false; } });
}

// ---------- persistent entities ----------
function makeEnt(n) {
  let o;
  if (n.mv === 'orb') { o = model(n.el === 'big' ? 'crystal__prism' : 'light__orb', n.el === 'big' ? 0xff5a8a : 0x5aff8a); o.scale.setScalar(n.el === 'big' ? 1.6 : 1.4); }
  else { const vw = MOVE[n.mv]?.view; try { o = vw?.make ? vw.make(n) : new THREE.Group(); } catch (err) { console.error(n.mv, err); o = new THREE.Group(); } }
  o.userData.mats ??= [];
  o.position.set(n.x, n.y || 0, n.z);
  scene.add(o);
  return { o, mv: n.mv };
}
function renderEnts(src, dt, t, a) {
  sync(views.n, src.ents, makeEnt, (v, n, fresh) => {
    if (!fresh) { v.o.position.x += (n.x - v.o.position.x) * a; v.o.position.z += (n.z - v.o.position.z) * a; v.o.position.y += ((n.y || 0) - v.o.position.y) * a; }
    if (n.mv === 'orb') { v.o.position.y = .7 + Math.sin(t * 3 + n.id) * .2; v.o.rotation.y += dt * 2; if (Math.random() < .3) emit(n.x, .7, n.z, 0, 1, 0, n.el === 'big' ? 0xff5a8a : 0x6aff9a, .15, .5); return; }
    v.n = n;
    try { MOVE[n.mv]?.view?.upd?.(v.o, n, dt, t); } catch (err) { console.error(n.mv, err); }
  }, v => { const vw = MOVE[v.mv]?.view; try { if (v.mv !== 'orb' && vw?.drop) vw.drop(v.o, v.n); else v.o.removeFromParent(); } catch (err) { console.error(v.mv, err); v.o.removeFromParent(); } });
}

// ---------- partner wizard ----------
function makeWizard(p) {
  const g = WIZ.clone(); g.rotation.order = 'YXZ';
  const mats = [];
  g.traverse(o => { if (!o.isMesh) return; o.material = o.material.clone(); enhance(o.material, EL[p.cur || p.el].color); mats.push(o.material); });
  const rc = makeCircle(p.el); rc.visible = false;
  scene.add(g, rc);
  return { g, rc, mats, cur: null };
}
function tintWizard(v, el) {
  v.cur = el; const c = EL[el].color;
  for (const m of v.mats) { m.userData.rim.value.set(c); if (/staff_gem|hand_rune/.test(m.name)) { m.color.set(c); m.emissive.set(c); m.emissiveIntensity = 4; } }
}
function renderPartner(src, dt, t, a) {
  sync(views.p, Object.values(src.players).filter(p => p.id !== myId), makeWizard, (v, p, fresh) => {
    if (v.cur !== (p.cur || p.el)) tintWizard(v, p.cur || p.el);
    const tg = V(p.x, p.y, p.z);
    if (fresh) v.g.position.copy(tg); else v.g.position.lerp(tg, a);
    v.g.rotation.y = lerpAngle(v.g.rotation.y, p.yaw + Math.PI, fresh ? 1 : a);
    v.g.rotation.x += ((p.down ? -1.35 : 0) - v.g.rotation.x) * Math.min(1, dt * 8);
    v.rc.visible = p.down; v.rc.position.set(v.g.position.x, .08, v.g.position.z); v.rc.scale.setScalar(1.3); spinCircle(v.rc, dt, .5 + p.rev * 3);
    setOpacity(v.rc.userData.mats, .25 + p.rev * .75);
  }, v => { v.g.removeFromParent(); v.rc.removeFromParent(); });
}

// ---------- channels (flamethrower, solar beam) for every player, aim reticle + charge for you ----------
function renderChannels(src, dt, t) {
  const live = new Set();
  for (const p of Object.values(src.players)) {
    const mine = p.id === myId, q = mine ? me() : p, ch = q?.ch;
    if (!ch || q.down) continue;
    const m = MOVE[ch]; if (!m?.chv) continue;
    live.add(p.id);
    let v = views.ch.get(p.id);
    if (!v || v.mv !== ch) { v?.o.removeFromParent(); const o = m.chv.make(q); scene.add(o); v = { o, mv: ch }; views.ch.set(p.id, v); }
    const a = handPos(p.id), d = mine ? camera.getWorldDirection(V()) : aimOf({ yaw: p.yaw, pitch: p.pitch || 0 });
    try { m.chv.upd(v.o, a, d, dt, t, q, q.chT); } catch (err) { console.error(err); }
  }
  for (const [id, v] of views.ch) if (!live.has(id)) { v.o.removeFromParent(); views.ch.delete(id); }
}
// ---------- element auras: Blades' orbiting swords, harvested Souls, Arcane charges, Plasma heat ----------
// p.r = [heat, souls, arcane charges, swords, (unused), rune count, laser focus] (see snap)
function renderAuras(src, dt, t) {
  const live = new Set();
  for (const p of Object.values(src.players)) {
    live.add(p.id);
    const mine = p.id === myId, q = mine ? me() : p, R = p.r || [], bf = p.bf || {}, down = p.down;
    const v = views.aura.get(p.id) || (views.aura.set(p.id, { swords: [], souls: [], arc: [] }), views.aura.get(p.id));
    const g = views.p.get(p.id)?.g, pos = mine || !g ? V(q.x, q.y, q.z) : g.position.clone(), yaw = q.yaw || 0;
    const pool = (list, n, make) => { while (list.length < n) { const o = make(); scene.add(o); list.push(o); } list.forEach((o, i) => o.visible = i < n && !down); return list.slice(0, down ? 0 : n); };
    // swords circle at the waist, pointing along their orbit
    const sw = pool(v.swords, R[3] || 0, () => model('blades__sword', EL.blades.color));
    sw.forEach((o, i) => { const a = t * 1.6 + TAU * i / sw.length, rr = mine ? 1.25 : 1.35, y = pos.y + (mine ? .75 : 1.1) + Math.sin(t * 2 + i) * .08; o.position.set(pos.x + Math.cos(a) * rr, y, pos.z + Math.sin(a) * rr); o.lookAt(o.position.x - Math.sin(a), y, o.position.z + Math.cos(a)); o.scale.setScalar(mine ? .7 : .85); fade(o, mine ? .7 : 1); });
    // harvested souls drift round you, slowly
    const so = pool(v.souls, Math.min(15, R[1] || 0), () => model('soul__flame', EL.soul.color));
    so.forEach((o, i) => { const a = -t * .8 + TAU * i / so.length, rr = mine ? 1.1 : .9, y = pos.y + (mine ? .45 : 1.6) + Math.sin(t * 3 + i * 1.7) * .15; o.position.set(pos.x + Math.cos(a) * rr, y, pos.z + Math.sin(a) * rr); o.lookAt(o.position.x + Math.sin(a), y + .4, o.position.z - Math.cos(a)); o.scale.setScalar(.55); });
    // arcane charges whirl round you, quick and small
    const ac = pool(v.arc, R[2] || 0, () => model('arcane__orb', EL.arcane.color));
    ac.forEach((o, i) => { const a = t * 3.2 + TAU * i / 4, rr = mine ? .9 : .7; o.position.set(pos.x + Math.cos(a) * rr, pos.y + (mine ? .9 : 1.3) + Math.sin(t * 4 + i) * .06, pos.z + Math.sin(a) * rr); o.rotation.z += dt * 6; o.scale.setScalar(.35); });
    // Plasma: sparks off your hand as Heat builds, smoke while overheated
    if (!down && ((R[0] || 0) > 35 || bf.overheat > 0) && Math.random() < (bf.overheat > 0 ? .6 : (R[0] - 35) / 80)) {
      const h = handPos(p.id), hot = bf.overheat > 0;
      emit(h.x, h.y, h.z, rand(-.5, .5), rand(.5, 2), rand(-.5, .5), hot ? 0x6a5a66 : Math.random() < .5 ? 0xff3ca8 : 0xffd0f0, hot ? rand(.15, .3) : rand(.03, .07), hot ? .9 : .35, hot ? -1 : 2);
    }
  }
  for (const [id, v] of views.aura) if (!live.has(id)) { for (const k in v) if (Array.isArray(v[k])) v[k].forEach(o => o.removeFromParent()); views.aura.delete(id); }
}
let reticle = null, reticleEl = null, chargeCircle = null;
function renderAim(mp, dt) {
  const chg = mp?.chg, m = chg && MOVE[chg.m];
  const aiming = m?.mode === 'aim' && !mp.down, charging = m?.mode === 'charge' && !mp.down;
  if (aiming) {
    if (!reticle || reticleEl !== m.el) { reticle?.removeFromParent(); reticle = makeCircle(m.el); reticleEl = m.el; scene.add(reticle); }
    const q = groundAt(mp, m.range ?? 20), r = (m.aimR || 2) * (['ice wall', 'constellation'].includes(m.name.toLowerCase()) ? 1 : stats(mp).aoe);
    reticle.visible = true; reticle.position.set(q.x, .1, q.z); reticle.scale.setScalar(r); spinCircle(reticle, dt, 1.5);
    setOpacity(reticle.userData.mats, .55 + .25 * Math.sin(performance.now() / 120));
  } else if (reticle) reticle.visible = false;
  const k = charging ? clamp(chg.t / m.charge, 0, 1) : 0;
  $('charge').classList.toggle('hidden', !charging);
  if (charging) { $('chargeBar').style.width = k * 100 + '%'; $('charge').classList.toggle('full', k >= 1); }
  if (charging) {
    if (!chargeCircle || chargeCircle.userData.el !== m.el) { chargeCircle?.removeFromParent(); chargeCircle = makeCircle(m.el); chargeCircle.userData.el = m.el; chargeCircle.quaternion.copy(Q_FACE); chargeCircle.position.set(-.26, -.17, -.85); camera.add(chargeCircle); }
    chargeCircle.visible = true; chargeCircle.scale.setScalar(.05 + .14 * k); spinCircle(chargeCircle, dt, 2 + k * 6);
  } else if (chargeCircle) chargeCircle.visible = false;
  return k;
}

function renderWorld(src, dt, t) {
  const a = role === 'guest' ? 1 - Math.exp(-dt * 14) : 1;
  renderEnemies(src, dt, t, a);
  renderShots(src, dt, t, a);
  renderEnts(src, dt, t, a);
  renderPartner(src, dt, t, a);
  renderChannels(src, dt, t);
  renderAuras(src, dt, t);
}

// ===================== HUD =====================
let healT = 0, dodgeFx = 0, hudKey = '';
const touchBtns = [0, 1, 2, 3, 4].map(i => document.querySelector(`#touch .tb[data-k="${i}"]`));
function buildBar(kit) {
  document.querySelectorAll('#touch .tb').forEach(b => { const i = +b.dataset.k; if (!isNaN(i)) b.textContent = kit.moves[i].icon; });
  $('slots').innerHTML = kit.moves.map((m, i) => `<div class="slot${i === 4 ? ' ult' : ''}" title="${m.name}: ${m.desc.replace(/"/g, '&quot;')}"><div class="ico">${m.icon}</div><i class="cdv"></i><b>${slotKey(i)}</b><span>${m.name}</span></div>`).join('');
}
function hud(src, mp) {
  const sp = src.players[myId];
  if (!sp || !mp) return;
  const cur = mp.cur || mp.el, kit = EL[cur];
  const key = cur + (mp.el2 || '');
  if (key !== hudKey) {
    hudKey = key; buildBar(kit); tintRig(cur);
    $('elName').innerHTML = `<b>${kit.glyph} ${kit.name}</b>${mp.el2 ? ` <em>TAB ⇄ ${EL[mp.el2 === cur ? mp.el : mp.el2].glyph} ${EL[mp.el2 === cur ? mp.el : mp.el2].name}</em>` : ''}`;
  }
  $('meHp').style.width = sp.hp / sp.max * 100 + '%';
  $('meName').textContent = `${Math.ceil(sp.hp)} / ${sp.max}`;
  $('dashBar').style.width = (1 - clamp(mp.dcd / stats(mp).dashCd, 0, 1)) * 100 + '%';
  const slots = $('slots').children, cds = mp.cds?.[cur] || [];
  for (let i = 0; i < 5; i++) {
    const m = kit.moves[i], el = slots[i]; if (!el) continue;
    let f = 0, label = '';
    if (i === 4) { f = 1 - (sp.ult ?? mp.ult ?? 0); el.classList.toggle('ready', f <= 0); }
    else { const full = cdOf(mp, m), c = Math.max(0, cds[i] || 0); f = full ? c / full : 0; if (c > .05 && full > 1.5) label = c.toFixed(c < 3 ? 1 : 0); }
    const hot = cur === 'plasma' && i < 4 ? sp.bf?.overheat || 0 : 0; // overheated: Plasma spells are locked
    if (hot > 0) { f = Math.max(f, hot / 2.5); label = hot.toFixed(1); }
    const active = (mp.ch === m.key) || (mp.chg?.m === m.key);
    el.style.setProperty('--cd', clamp(f, 0, 1)); touchBtns[i]?.style.setProperty('--cd', clamp(f, 0, 1));
    el.classList.toggle('cool', f > 0.001); el.classList.toggle('active', active);
    el.querySelector('.cdv').textContent = label;
  }
  if (sp.ult >= 1 && !hud.ultReady) sfx('ready');
  hud.ultReady = sp.ult >= 1;
  const bf = sp.bf || {}, tags = [];
  for (const [k, n, c] of [['glide', 'GLIDE', '#9dffd6'], ['fusion', 'FUSION', '#ff3ca8']])
    if (bf[k] > 0) tags.push(`<span style="color:${c};border-color:${c}">${n} ${Math.ceil(bf[k])}</span>`);
  const tagHtml = tags.join('');
  if (tagHtml !== hud.tags) { $('buffs').innerHTML = tagHtml; hud.tags = tagHtml; }
  // the current element's resource, if it has one
  const R = sp.r || [], pips = (n, of) => Array.from({ length: of }, (_, i) => `<span class="pip${i < n ? ' on' : ''}"></span>`).join(''), meter = f => `<span class="meter"><i style="width:${Math.round(clamp(f, 0, 1) * 100)}%"></i></span>`;
  const res = cur === 'plasma' ? (bf.overheat > 0 ? `OVERHEATED ${meter(1)}` : bf.fusion > 0 ? `FUSION ${meter(bf.fusion / 4)}` : `HEAT ${meter(R[0] / 100)} ${R[0] | 0}`)
    : cur === 'soul' ? `SOULS ${meter(R[1] / 15)} ${R[1] || 0}` : cur === 'arcane' ? `CHARGES ${pips(R[2], 4)}` : cur === 'blades' ? `SWORDS ${pips(R[3], 6)}`
    : cur === 'rune' ? (R[5] === 2 ? `NEXT SPELL EMPOWERED ${pips(2, 2)}` : `RUNE ${pips(R[5], 2)}`) : cur === 'laser' ? `FOCUS ${pips(R[6], 6)}` : '';
  if (res !== hud.res) { hud.res = res; $('res').innerHTML = res; $('res').classList.toggle('hidden', !res); $('res').classList.toggle('hot', cur === 'plasma' && (bf.overheat > 0 || R[0] > 80)); }
  const combo = sp.combo || 0;
  $('comboCt').classList.toggle('hidden', combo < 5);
  if (combo >= 5) $('comboCt').innerHTML = `<b>${combo}</b> HITS${combo >= 10 ? ` <em>+${Math.min(30, Math.floor(combo / 10) * 5)}% dmg</em>` : ''}`;
  const other = Object.values(src.players).find(p => p.id !== myId);
  $('mate').classList.toggle('hidden', !other);
  if (other) { $('mateHp').style.width = other.hp / other.max * 100 + '%'; $('mateName').textContent = `${other.down ? '💀 DOWN · ' : ''}${src.mode === 'duel' ? other.ai ? 'AI Wizard' : 'Opponent' : 'Partner'} · ${EL[other.cur || other.el].glyph} ${EL[other.cur || other.el].name}`; $('mateUlt').style.width = (other.ult || 0) * 100 + '%'; }
  const D = src.duel, opp = other?.id || (myId === 'h' ? 'g' : 'h');
  const U = src.dun;
  $('wave').textContent = src.mode === 'dungeon' && U ? `Floor ${U.floor}` : src.mode === 'duel' && D ? `Round ${D.round} · ${D.wins[myId]} – ${D.wins[opp]}` : src.phase === 'rest' ? `Wave ${src.wave + 1} incoming` : src.wave ? `Wave ${src.wave}` : '';
  const boss = src.enemies.find(e => ET[e.type].boss);
  $('boss').classList.toggle('hidden', !boss);
  if (boss) { $('bossHp').style.width = Math.max(0, boss.hp / boss.max * 100) + '%'; $('boss').firstChild.textContent = boss.type === 'warden' ? 'THE BONE WARDEN' : 'THE OBSIDIAN TYRANT'; }
  if (src.mode === 'dungeon' && U) $('mod').textContent = U.wait ? 'Waiting for your partner on the stairs' : U.st.includes(1) ? 'Monsters are hunting you' : U.stairs ? 'The way down is open: take the stairs' : `Explore · ${U.st.filter(s => s === 2).length - 1}/${U.st.length - 1} chambers cleared`;
  $('downMsg').classList.toggle('hidden', !sp.down || src.phase === 'over');
  if (sp.down) $('downMsg').textContent = other && !other.down ? `YOU ARE DOWN · revive ${Math.round(sp.rev * 100)}%` : 'YOU ARE DOWN';
  $('lock').classList.toggle('hidden', locked() || usingVirt());
  $('touch').classList.toggle('hidden', !document.body.classList.contains('touching'));
  hurtT = Math.max(0, hurtT - 1 / 60 * 2.5); healT = Math.max(0, healT - 1 / 60 * 2);
  $('vignette').style.boxShadow = `inset 0 0 ${120 + hurtT * 80}px rgba(255,20,50,${hurtT * .8})` + (healT > 0 ? `, inset 0 0 140px rgba(60,255,140,${healT * .35})` : '');
}

// ===================== screens =====================
function showGame() {
  for (const id of ['modes', 'lobby', 'over']) $(id).classList.add('hidden');
  $('hud').classList.remove('hidden');
  hudKey = ''; tintRig(myEl); xpGiven = false;
  playing = true;
  lockMouse();
}
let xpGiven = false;
// XP for the run that just ended (once per run): waves or floors reached, kills, and duel results
function runXP(e, mp) {
  if (xpGiven) return ''; xpGiven = true;
  const kills = mp?.stats?.kills || 0, xp = e.duel ? (e.w === myId ? 250 : 100) : Math.round((srcState()?.mode === 'dungeon' ? 80 : 60) * (e.wave || 0) + 3 * kills);
  return gainXP(xp, [...new Set([mp?.el || myEl, mp?.el2].filter(k => k && unlocked(k)))]);
}
function showOver(e) {
  const mp = srcState()?.players[myId], el = mp?.el || myEl, xpHtml = runXP(e, mp);
  $('overTitle').textContent = 'FALLEN';
  if (e.duel) { // 1v1 result
    const won = e.w === myId, opp = myId === 'h' ? 'g' : 'h';
    $('overTitle').textContent = won ? 'VICTORY' : 'DEFEAT';
    $('overTxt').innerHTML = `${won ? 'You won' : 'You lost'} the duel <b>${e[myId]} – ${e[opp]}</b> as <b style="color:${css(EL[el].color)}">${EL[el].name}</b>.` + xpHtml + (role === 'guest' ? '<br>Waiting for the host to play again…' : '');
    $('againBtn').classList.toggle('hidden', role !== 'host'); $('over').classList.remove('hidden'); unlockMouse(); return;
  }
  if (srcState()?.mode === 'dungeon') { // how deep you got, best per element
    let best = 0; try { const per = JSON.parse(localStorage.getItem('magepact_best_floor') || '{}'); best = per[el] = Math.max(per[el] || 0, e.wave); localStorage.setItem('magepact_best_floor', JSON.stringify(per)); } catch {}
    $('overTxt').innerHTML = `You fell on floor ${e.wave} as <b style="color:${css(EL[el].color)}">${EL[el].name}</b>. Deepest: floor ${best}.` + xpHtml + (role === 'guest' ? '<br>Waiting for the host to play again…' : '');
    $('againBtn').classList.toggle('hidden', role !== 'host'); $('over').classList.remove('hidden'); unlockMouse(); return;
  }
  const wave = e.wave;
  let best = 0;
  try {
    best = Math.max(wave, +localStorage.getItem('magepact_best') || 0); localStorage.setItem('magepact_best', best);
    const per = JSON.parse(localStorage.getItem('magepact_best_el') || '{}'); per[el] = Math.max(per[el] || 0, wave); localStorage.setItem('magepact_best_el', JSON.stringify(per));
  } catch {}
  const st = mp?.stats;
  $('overTxt').innerHTML = `You held out until wave ${wave} as <b style="color:${css(EL[el].color)}">${EL[el].name}</b>. Best: wave ${best}.` + (st ? `<div class="stats"><span><b>${st.kills}</b>kills</span><span><b>${Math.round(st.dmg).toLocaleString()}</b>damage</span><span><b>${st.combos}</b>reactions</span><span><b>${st.dodges}</b>perfect dodges</span><span><b>${st.best}</b>best combo</span></div>` : '') + xpHtml + (role === 'guest' ? '<br>Waiting for the host to play again…' : '');
  $('againBtn').classList.toggle('hidden', role !== 'host');
  $('over').classList.remove('hidden');
  unlockMouse();
  renderLobby();
}

// ===================== mode browser: Arena / 1v1 Duel / Dungeon =====================
// card art: small inline SVG scenes (ids are prefixed per card so they don't clash)
const svg = body => `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
const STARS = [[30, 30], [70, 62], [120, 22], [160, 50], [345, 28], [375, 70], [330, 120], [20, 110], [95, 100], [380, 150]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? .8 : 1.4}" fill="#fff" opacity="${i % 2 ? .5 : .85}"/>`).join('');
const MODE_ART = {
  city: svg(`<defs><radialGradient id="cSky" cx="70%" cy="26%" r="90%"><stop offset="0" stop-color="#3d1f63"/><stop offset=".45" stop-color="#160b2b"/><stop offset="1" stop-color="#05040b"/></radialGradient>
    <radialGradient id="cHole"><stop offset=".3" stop-color="#000"/><stop offset=".36" stop-color="#ffd9a0"/><stop offset=".55" stop-color="#ff8a3a" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
    <linearGradient id="cStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f8a9c"/><stop offset="1" stop-color="#3c3752"/></linearGradient>
    <linearGradient id="cRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e3756"/><stop offset="1" stop-color="#0b0912"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#cSky)"/>${STARS}<circle class="pulse" cx="300" cy="62" r="46" fill="url(#cHole)" style="transform-origin:300px 62px"/>
    <path d="M10,196 L390,196 L330,236 L70,236 Z" fill="url(#cRock)"/>
    <g fill="url(#cStone)"><rect x="40" y="150" width="34" height="46"/><rect x="82" y="128" width="26" height="68"/><rect x="118" y="88" width="22" height="108"/><rect x="150" y="140" width="46" height="56"/><rect x="206" y="104" width="30" height="92"/><rect x="246" y="150" width="40" height="46"/><rect x="296" y="120" width="24" height="76"/><rect x="330" y="158" width="36" height="38"/></g>
    <g fill="#5c5769"><path d="M118,88 h22 v-6 h-4 v4 h-5 v-4 h-4 v4 h-5 v-4 h-4 z"/><path d="M206,104 h30 v-6 h-4 v4 h-5 v-4 h-4 v4 h-4 v-4 h-4 v4 h-5 v-4 h-4 z"/><path d="M82,128 h26 v-5 h-4 v3 h-5 v-3 h-4 v3 h-5 v-3 h-4 z"/></g>
    <g fill="#e9c46a"><rect x="118" y="92" width="22" height="3"/><rect x="206" y="108" width="30" height="3"/></g>
    <g fill="#14101f"><rect x="125" y="110" width="4" height="9"/><rect x="132" y="140" width="4" height="9"/><rect x="214" y="126" width="4" height="9"/><rect x="225" y="150" width="4" height="9"/><rect x="160" y="168" width="10" height="28"/><rect x="90" y="150" width="4" height="8"/><rect x="304" y="140" width="4" height="8"/></g>
    <path d="M129,82 l5,-14 l5,14 z M221,98 l4,-12 l4,12 z" fill="#daa0ff"/><circle class="pulse" cx="134" cy="72" r="10" fill="#daa0ff" opacity=".35" style="transform-origin:134px 72px"/>
    <path d="M150,140 l-8,-8 l14,-6 l6,10 z M246,150 l6,-9 l10,4 l-3,7 z" fill="#8f8a9c" opacity=".9"/>
    <g fill="#ff9a4a"><circle cx="58" cy="146" r="2.5"/><circle cx="268" cy="146" r="2.5"/></g>
    <g fill="#733895"><path d="M100,136 h6 v18 l-3,-3 l-3,3 z"/><path d="M308,130 h6 v18 l-3,-3 l-3,3 z"/></g>`),
  arena: svg(`<defs><radialGradient id="aSky" cx="62%" cy="30%" r="85%"><stop offset="0" stop-color="#3d1f63"/><stop offset=".45" stop-color="#160b2b"/><stop offset="1" stop-color="#05040b"/></radialGradient>
    <radialGradient id="aGlow"><stop offset=".28" stop-color="#ffe2b0"/><stop offset=".42" stop-color="#ff9a4a" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
    <linearGradient id="aRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e3756"/><stop offset="1" stop-color="#0b0912"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#aSky)"/>${STARS}
    <g class="spin" style="transform-origin:250px 78px"><circle cx="250" cy="78" r="78" fill="url(#aGlow)"/></g>
    <ellipse cx="250" cy="78" rx="70" ry="13" fill="none" stroke="#ffd59a" stroke-width="2.5" opacity=".8" transform="rotate(-14 250 78)"/>
    <circle cx="250" cy="78" r="25" fill="#000" stroke="#fff3d6" stroke-width="2"/>
    <path d="M181,93 A70,13 0 0 0 319,63" fill="none" stroke="#fff1d0" stroke-width="3.5" transform="rotate(-14 250 78)" opacity=".95"/>
    <path d="M30,184 L370,184 L338,200 L300,226 L238,240 L160,240 L100,222 L60,202 Z" fill="url(#aRock)"/>
    <ellipse cx="200" cy="184" rx="170" ry="13" fill="#4b4566"/><ellipse cx="200" cy="184" rx="90" ry="6" fill="none" stroke="#b48cff" stroke-width="1.5" opacity=".7"/>
    <rect x="70" y="128" width="12" height="56" fill="#5a5470"/><rect x="66" y="124" width="20" height="6" fill="#6a6482"/>
    <path d="M300,184 v-40 l4,-6 l3,5 l5,-3 v44 z" fill="#5a5470"/>
    <path d="M140,184 v-34 a22,22 0 0 1 44,0 v34 h-8 v-34 a14,14 0 0 0 -28,0 v34 z" fill="#4e4864"/>
    <circle cx="112" cy="176" r="10" fill="#ff9a4a" opacity=".35"/><path d="M112,166 l4,9 h-8 z" fill="#ffd9a8"/>
    <circle cx="262" cy="176" r="10" fill="#ff9a4a" opacity=".35"/><path d="M262,166 l4,9 h-8 z" fill="#ffd9a8"/>
    <path d="M40,120 l14,-6 l10,8 l-12,8 z" fill="#2c2840"/><path d="M350,110 l12,-4 l8,7 l-10,6 z" fill="#2c2840"/>`),
  duel: svg(`<defs><linearGradient id="dSky" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a140c"/><stop offset=".5" stop-color="#120a1e"/><stop offset="1" stop-color="#0a1c3a"/></linearGradient>
    <radialGradient id="dBurst"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#ffe9ff" stop-opacity=".9"/><stop offset="1" stop-color="#b48cff" stop-opacity="0"/></radialGradient>
    <filter id="dBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs>
    <rect width="400" height="240" fill="url(#dSky)"/>${STARS}
    <ellipse cx="200" cy="200" rx="185" ry="22" fill="#2a2638"/><ellipse cx="200" cy="196" rx="185" ry="20" fill="#3c3752"/>
    <ellipse cx="200" cy="196" rx="60" ry="6" fill="none" stroke="#e9c46a" stroke-width="1.2" opacity=".6"/>
    <g class="beam"><path d="M108,118 Q150,104 200,116" stroke="#ff7a2a" stroke-width="10" fill="none" filter="url(#dBlur)"/><path d="M108,118 Q150,104 200,116" stroke="#ffd2a8" stroke-width="3" fill="none"/>
    <path d="M292,118 Q250,130 200,116" stroke="#3aa8ff" stroke-width="10" fill="none" filter="url(#dBlur)"/><path d="M292,118 Q250,130 200,116" stroke="#cfeeff" stroke-width="3" fill="none"/></g>
    <circle class="pulse" cx="200" cy="116" r="34" fill="url(#dBurst)" style="transform-origin:200px 116px"/>
    <path d="M200,92 l5,17 l17,-5 l-12,13 l12,13 l-17,-5 l-5,17 l-5,-17 l-17,5 l12,-13 l-12,-13 l17,5 z" fill="#fff" opacity=".9"/>
    <g stroke="#ff9a5a" stroke-width="1.6" stroke-opacity=".85"><path d="M70,196 L80,140 L64,140 L86,92 L106,140 L92,140 L102,196 Z" fill="#14101f"/><circle cx="86" cy="128" r="8" fill="#14101f"/></g><path d="M98,150 L110,116" stroke="#14101f" stroke-width="4"/><circle cx="109" cy="117" r="5" fill="#ffb070"/>
    <g stroke="#7cc8ff" stroke-width="1.6" stroke-opacity=".85"><path d="M330,196 L320,140 L336,140 L314,92 L294,140 L308,140 L298,196 Z" fill="#14101f"/><circle cx="314" cy="128" r="8" fill="#14101f"/></g><path d="M302,150 L290,116" stroke="#14101f" stroke-width="4"/><circle cx="291" cy="117" r="5" fill="#9ad8ff"/>`),
  dungeon: svg(`<defs><pattern id="gBrick" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="#2b2420"/><path d="M0,23.5 H48 M24,0 V12 M0,11.5 H48 M12,12 V24 M36,12 V24" stroke="#120d0b" stroke-width="2"/></pattern>
    <radialGradient id="gTorch"><stop offset="0" stop-color="#ffb35a" stop-opacity=".75"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gDeep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050302"/><stop offset="1" stop-color="#2a160a"/></linearGradient></defs>
    <rect width="400" height="240" fill="url(#gBrick)"/><rect width="400" height="240" fill="#000" opacity=".25"/>
    <circle class="flick" cx="78" cy="96" r="70" fill="url(#gTorch)"/><circle class="flick" cx="322" cy="96" r="70" fill="url(#gTorch)" style="animation-delay:-.7s"/>
    <path d="M128,240 V118 A72,72 0 0 1 272,118 V240 Z" fill="#4a3f36"/><path d="M142,240 V120 A58,58 0 0 1 258,120 V240 Z" fill="url(#gDeep)"/>
    <path d="M160,240 L176,214 H224 L240,240 Z M180,208 L190,192 H210 L220,208 Z M194,186 L198,178 H202 L206,186 Z" fill="#5a3a22" opacity=".85"/>
    <g stroke="#6a5a48" stroke-width="3.5"><path d="M156,82 V150 M171,68 V150 M186,63 V150 M200,62 V150 M214,63 V150 M229,68 V150 M244,82 V150"/><path d="M144,100 H256 M143,125 H257 M143,148 H257"/></g>
    <g fill="#8a7a66"><path d="M153,150 l3,8 l3,-8 z M168,150 l3,8 l3,-8 z M183,150 l3,8 l3,-8 z M197,150 l3,8 l3,-8 z M211,150 l3,8 l3,-8 z M226,150 l3,8 l3,-8 z M241,150 l3,8 l3,-8 z"/></g>
    <rect x="74" y="104" width="8" height="30" fill="#3a2a1c"/><path class="flick" d="M78,80 q10,14 0,26 q-10,-12 0,-26" fill="#ffcf7a" style="transform-origin:78px 106px"/>
    <rect x="318" y="104" width="8" height="30" fill="#3a2a1c"/><path class="flick" d="M322,80 q10,14 0,26 q-10,-12 0,-26" fill="#ffcf7a" style="transform-origin:322px 106px;animation-delay:-.7s"/>`),
};
const MODES = {
  arena: { name: 'Arena', c: '#e9c46a', play: '⚔ Play Solo', tag: 'Hold the floating ruins under the black hole against endless waves.',
    info: ['Endless waves', 'Boss every 5', 'Solo or co-op'] },
  duel: { name: '1v1 Duel', c: '#ff8a5a', play: '⚔ Duel the AI', tag: 'Wizard against wizard on a floating platform. Burn them down or knock them off.',
    info: ['Best of 3', 'Vs a friend online', 'Or vs an AI wizard'] },
  dungeon: { name: 'Dungeon', c: '#ffa040', play: '⚔ Enter Alone', tag: 'Descend through torchlit medieval halls, floor after floor, as deep as you dare.',
    info: ['Endless floors', 'Boss every 5', 'Solo or co-op'] },
  city: { name: 'Mage City', c: '#c9a0ff', play: '⚔ Play Solo', tag: 'Endless waves through a floating city of towers and halls. Every wall can be blasted apart.',
    info: ['Huge map', 'Everything breaks', 'Solo or co-op'] },
};
let myMode = 'arena';
function renderModes() {
  $('modeCols').innerHTML = Object.entries(MODES).map(([k, m], i) => `<button class="mode" data-mode="${k}" style="--c:${m.c};animation-delay:${i * .08}s"><div class="art">${MODE_ART[k]}<kbd>${i + 1}</kbd></div>
    <div class="body"><h2>${m.name}</h2><p>${m.tag}</p><ul>${m.info.map(t => `<li>${t}</li>`).join('')}</ul></div><div class="go">Choose <span>→</span></div></button>`).join('');
  for (const b of $('modeCols').children) b.onclick = () => pickMode(b.dataset.mode);
}
addEventListener('keydown', e => { const k = Object.keys(MODES)[+e.key - 1]; if (k && !$('modes').classList.contains('hidden')) pickMode(k); });
function pickMode(k) {
  myMode = k; $('modes').classList.add('hidden'); $('lobby').classList.remove('hidden');
  $('modeName').textContent = MODES[k].name; $('soloBtn').textContent = MODES[k].play; sfx('pick'); renderLobby();
}
$('modeBack').onclick = () => { $('lobby').classList.add('hidden'); $('modes').classList.remove('hidden'); };
$('menuBtn').onclick = () => location.reload(); // back to the mode browser (also leaves any online room)
renderModes();

// ===================== progression: levels, element unlocks, talents, mastery (saved per browser) =====================
const STARTERS = ['fire', 'frost', 'storm', 'water', 'earth', 'wind', 'nature', 'shadow', 'light', 'venom'];
const TALENTS = { // 5 ranks each; they apply in the Arena and the Dungeon, never in Duels (withTalents)
  vit: { n: 'Vitality', i: '❤️', d: r => `+${6 * r}% max health` },
  power: { n: 'Power', i: '🔥', d: r => `+${4 * r}% damage` },
  haste: { n: 'Haste', i: '⏳', d: r => `${4 * r}% faster cooldowns` },
  swift: { n: 'Swiftness', i: '👟', d: r => `+${3 * r}% move speed` },
  focus: { n: 'Focus', i: '✨', d: r => `+${8 * r}% ultimate charge` },
};
const MASTERY = [400, 1200, 2500, 4500, 7500]; // element XP for each mastery star
const needXP = lvl => 200 + 60 * lvl;
const cleanTal = t => Object.fromEntries(Object.keys(TALENTS).map(k => [k, clamp(Math.floor(+t?.[k] || 0), 0, 5)]));
let PROG = { xp: 0, lvl: 1, keys: 0, pts: 0, unl: STARTERS.slice(), tal: {}, mast: {} };
try { PROG = { ...PROG, ...JSON.parse(localStorage.getItem('magepact_prog') || '{}') }; } catch {}
PROG.tal = cleanTal(PROG.tal); PROG.unl = PROG.unl.filter(k => EL[k]);
const saveProg = () => { try { localStorage.setItem('magepact_prog', JSON.stringify(PROG)); } catch {} };
const unlocked = k => PROG.unl.includes(k);
const stars = k => MASTERY.filter(x => (PROG.mast[k] || 0) >= x).length;
// end of a run: XP for you and the elements you carried; every level gives an unlock key (while any element is locked) and a talent point
function gainXP(xp, els) {
  const before = { lvl: PROG.lvl, stars: els.map(stars) };
  PROG.xp += xp;
  while (PROG.xp >= needXP(PROG.lvl)) { PROG.xp -= needXP(PROG.lvl); PROG.lvl++; if (PROG.unl.length + PROG.keys < ELIST.length) PROG.keys++; PROG.pts++; }
  for (const k of els) PROG.mast[k] = (PROG.mast[k] || 0) + xp;
  saveProg();
  const ups = PROG.lvl - before.lvl, newStars = els.filter((k, i) => stars(k) > before.stars[i]);
  return `<div class="xpgain"><b>+${xp} XP</b>${xpBar()}${ups ? `<div class="lvlup">LEVEL UP! Level ${PROG.lvl}${PROG.keys ? ' · 🔓 unlock an element' : ''} · ✦ talent point${ups > 1 ? 's' : ''}</div>` : ''}${newStars.map(k => `<div class="lvlup" style="color:${css(EL[k].color)}">${EL[k].glyph} ${EL[k].name} mastery ${'★'.repeat(stars(k))}</div>`).join('')}</div>`;
}
const xpBar = () => `<div class="xpbar"><span>Level ${PROG.lvl}</span><i><b style="width:${Math.round(100 * PROG.xp / needXP(PROG.lvl))}%"></b></i><span>${PROG.xp} / ${needXP(PROG.lvl)} XP</span></div>`;
function renderProg() {
  $('unlockAll').classList.toggle('hidden', PROG.unl.length >= ELIST.length);
  const spent = Object.values(PROG.tal).reduce((a, b) => a + b, 0);
  $('prog').innerHTML = `${xpBar()}<div class="pr">${PROG.keys ? `<span class="key">🔓 ${PROG.keys} unlock${PROG.keys > 1 ? 's' : ''}: click a locked element</span>` : `<span>${PROG.unl.length} / ${ELIST.length} elements</span>`}<button id="talBtn" class="ghost">✦ Talents${PROG.pts - spent > 0 ? ` (${PROG.pts - spent})` : ''}</button></div>`;
  $('talBtn').onclick = () => { $('talents').classList.remove('hidden'); renderTalents(); };
}
function renderTalents() {
  const free = PROG.pts - Object.values(PROG.tal).reduce((a, b) => a + b, 0);
  $('talList').innerHTML = `<p class="sub">${free} point${free === 1 ? '' : 's'} to spend · one per level · Arena &amp; Dungeon only (Duels stay fair)</p>` + Object.entries(TALENTS).map(([k, t]) => { const r = PROG.tal[k];
    return `<div class="tal"><span class="ti">${t.i}</span><div><b>${t.n}</b><small>${r ? t.d(r) : t.d(1) + ' a rank'}</small></div><span class="pips">${[0, 1, 2, 3, 4].map(i => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</span><button class="ghost" data-k="${k}"${free > 0 && r < 5 ? '' : ' disabled'}>+</button></div>`; }).join('');
  for (const b of $('talList').querySelectorAll('button[data-k]')) b.onclick = () => { PROG.tal[b.dataset.k]++; saveProg(); sfx('pick'); renderTalents(); renderProg(); };
}
$('unlockAll').onclick = () => { PROG.unl = ELIST.slice(); PROG.keys = 0; saveProg(); sfx('ready'); renderLobby(); };
$('talReset').onclick = () => { PROG.tal = cleanTal({}); saveProg(); renderTalents(); renderProg(); };
$('talClose').onclick = () => $('talents').classList.add('hidden');

// ===================== lobby: 30 elements =====================
// picker info per element: playstyle tags, difficulty (1-3) and the model its preview shows
const ELMETA = {
  fire: ['Burst', 'Area', 1, 'fire__phoenix'], frost: ['Control', 'Burst', 1, 'frost__lance'], storm: ['Chain', 'Burst', 2, 'storm__coil'],
  water: ['Control', 'Area', 1, 'water__wave'], earth: ['Tank', 'Control', 1, 'earth__boulder'], wind: ['Mobility', 'Control', 2, 'wind__tornado'],
  nature: ['Sustain', 'Control', 1, 'nature__flower'], shadow: ['Assassin', 'Mobility', 3, 'shadow__dagger'], light: ['Sustain', 'Support', 1, 'light__spear'],
  venom: ['Damage over time', 'Area', 2, 'venom__wasp'], steel: ['Tank', 'Burst', 2, 'steel__sword'], magma: ['Area', 'Burst', 2, 'magma__volcano'],
  crystal: ['Defense', 'Burst', 2, 'crystal__spire'], sonic: ['Control', 'Area', 2, 'sonic__rings'], gravity: ['Control', 'Area', 2, 'gravity__hole'],
  chrono: ['Utility', 'Control', 3, 'chrono__hourglass'], blood: ['Sustain', 'High risk', 3, 'blood__scythe'], spirit: ['Summoner', 'Control', 2, 'spirit__wolf'],
  cosmic: ['Area', 'Burst', 2, 'cosmic__comet'], explosion: ['Burst', 'Mobility', 2, 'explosion__bomb'], illusion: ['Trickster', 'Control', 3, 'illusion__mask'],
  bone: ['Summoner', 'Tank', 2, 'bone__skull'], rune: ['Trapper', 'Burst', 3, 'rune__stone'], plasma: ['Burst', 'High risk', 3, 'plasma__orb'],
  soul: ['Snowball', 'Execute', 2, 'soul__reaper'], abyss: ['Control', 'Area', 2, 'abyss__tentacle'], laser: ['Precision', 'Burst', 3, 'laser__drone'],
  arcane: ['Combo', 'Burst', 2, 'arcane__owl'], blades: ['Melee', 'Mobility', 2, 'blades__sword'], ink: ['Control', 'Area', 2, 'ink__koi'],
};
const DIFF = ['', 'Easy', 'Medium', 'Hard'];
let myEl = 'fire', myEl2 = null, hoverEl = null;
try { const s = JSON.parse(localStorage.getItem('magepact_pick') || '{}'); if (EL[s.el]) myEl = s.el; if (EL[s.el2] && s.el2 !== myEl) myEl2 = s.el2; } catch {}
if (!unlocked(myEl)) myEl = PROG.unl[0]; if (myEl2 && !unlocked(myEl2)) myEl2 = null;
function bestFor(el) { try { return JSON.parse(localStorage.getItem(myMode === 'dungeon' ? 'magepact_best_floor' : 'magepact_best_el') || '{}')[el] || 0; } catch { return 0; } }
function renderLobby() {
  $('grid').innerHTML = ELIST.map(k => { const e = EL[k], b = bestFor(k), lock = !unlocked(k), st = stars(k); return `<button class="elc${k === myEl ? ' sel' : ''}${k === myEl2 ? ' sel2' : ''}${lock ? ' lock' : ''}${lock && PROG.keys ? ' can' : ''}" data-el="${k}" style="--c:${css(e.color)}"><span class="g">${lock ? '🔒' : e.glyph}</span><span class="n">${e.name}</span>${st ? `<span class="st">${'★'.repeat(st)}</span>` : ''}${b && myMode !== 'duel' ? `<span class="best">${myMode === 'dungeon' ? 'F' : 'W'}${b}</span>` : ''}${k === myEl2 ? '<span class="tab">TAB</span>' : ''}</button>`; }).join('');
  for (const b of $('grid').children) {
    b.onclick = () => {
      const k = b.dataset.el;
      if (!unlocked(k)) { if (!PROG.keys) { sfx('swap'); return; } PROG.keys--; PROG.unl.push(k); saveProg(); sfx('pick'); sfx('ready'); } // spend an unlock key
      myEl = k; if (myEl2 === myEl) myEl2 = null; savePick(); renderLobby(); sfx('pick');
    };
    b.oncontextmenu = ev => { ev.preventDefault(); const k = b.dataset.el; if (!unlocked(k)) return; myEl2 = k === myEl2 || k === myEl ? null : k; savePick(); renderLobby(); sfx('swap'); };
    b.onmouseenter = () => { hoverEl = b.dataset.el; renderDetail(); };
    b.onmouseleave = () => { hoverEl = null; renderDetail(); };
  }
  $('pickinfo').innerHTML = `<label>Second element<select id="el2Sel"><option value="">none</option>${ELIST.filter(x => x !== myEl && unlocked(x)).map(x => `<option value="${x}"${x === myEl2 ? ' selected' : ''}>${EL[x].name}</option>`).join('')}</select></label><span>Click an element to make it your main one. Right-click one (or pick it here) to carry a second element; Tab swaps between them in battle.</span>`;
  $('el2Sel').onchange = ev => { myEl2 = ev.target.value || null; savePick(); renderLobby(); };
  renderProg(); renderDetail();
}
// a live 3D preview in the detail panel: the element's spell circle under its signature model, turning (own small renderer)
const PV = { el: null, g: null, r: null };
function pvShow(el) {
  if (!PV.r) {
    PV.r = new THREE.WebGLRenderer({ canvas: $('pvc'), alpha: true, antialias: true }); PV.r.setPixelRatio(Math.min(devicePixelRatio, 2)); PV.r.setSize(200, 150, false);
    PV.r.toneMapping = renderer.toneMapping; PV.r.toneMappingExposure = 1.2; PV.r.outputColorSpace = renderer.outputColorSpace;
    PV.sc = new THREE.Scene(); PV.sc.add(new THREE.HemisphereLight(0xc8d4ff, 0x3a2050, 2)); const dl = new THREE.DirectionalLight(0xfff0e0, 2.5); dl.position.set(2, 4, 3); PV.sc.add(dl);
    PV.cam = new THREE.PerspectiveCamera(32, 200 / 150, .1, 50); PV.cam.position.set(0, 1.6, 4.6); PV.cam.lookAt(0, .75, 0);
    let last = performance.now();
    const tick = now => { requestAnimationFrame(tick); const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!PV.g || $('lobby').classList.contains('hidden')) return;
      PV.g.userData.m.rotation.y += dt * .8; spinCircle(PV.g.userData.c, dt, .6); PV.r.render(PV.sc, PV.cam); };
    requestAnimationFrame(tick);
  }
  if (PV.el === el) return;
  PV.el = el; if (PV.g) PV.sc.remove(PV.g);
  const g = new THREE.Group(), c = makeCircle(el), m = model(ELMETA[el][3], EL[el].color, { flat: true }), w = new THREE.Group(), tilt = new THREE.Group();
  c.scale.setScalar(1.25); w.add(tilt); tilt.add(m); // w spins, tilt tips it toward you
  if (el === 'abyss') curlTentacle(m, 1.2, 1, .15);
  const b = new THREE.Box3().setFromObject(m), s = b.getSize(V()), flat = s.y < .45 * Math.max(s.x, s.z), k = (flat ? 1.9 : 1.5) / Math.max(s.x, s.y, s.z, .01); // fit any model to about 1.5 m
  m.scale.multiplyScalar(k); b.setFromObject(m); m.position.set(-(b.min.x + b.max.x) / 2, .15 - b.min.y, -(b.min.z + b.max.z) / 2);
  if (flat) { w.position.y = .55; tilt.rotation.x = .3; } // projectiles fly level: float them and tip them toward you, rather than lying on the circle
  g.add(c, w); g.userData = { c, m: w }; PV.sc.add(g); PV.g = g;
  if (!unlocked(el)) w.traverse(o => { if (o.isMesh && !o.material.uniforms) { o.material = o.material.clone(); o.material.color.setScalar(.05); o.material.emissive?.setScalar(0); } }); // locked: a silhouette
}
function savePick() { try { localStorage.setItem('magepact_pick', JSON.stringify({ el: myEl, el2: myEl2 })); } catch {} }
function renderDetail() {
  const k = hoverEl || myEl, e = EL[k], [t1, t2, dif] = ELMETA[k], st = stars(k), mx = PROG.mast[k] || 0, nxt = MASTERY[st];
  document.documentElement.style.setProperty('--el', css(e.color));
  pvShow(k);
  $('detailBody').innerHTML = `<div class="dh"><div><b>${e.glyph} ${e.name}</b><small>${e.blurb}</small></div></div>
    <div class="tags"><span>${t1}</span><span>${t2}</span><span class="dif d${dif}">${'●'.repeat(dif)}${'○'.repeat(3 - dif)} ${DIFF[dif]}</span>${unlocked(k) ? `<span class="mast" title="Mastery: ${mx}${nxt ? ' / ' + nxt : ''} XP">${'★'.repeat(st)}${'☆'.repeat(5 - st)}</span>` : `<span class="lk">🔒 ${PROG.keys ? 'Click to unlock' : 'Locked: level up to unlock'}</span>`}</div>
    <div class="passive"><em>Passive</em> ${e.passive}</div>
    <div class="moves">${e.moves.map((m, i) => `<div class="mv"><kbd>${slotKey(i)}</kbd><span class="mi">${m.icon}</span><div><b>${m.name}</b>${m.mode === 'charge' ? ' <i>hold to charge</i>' : m.mode === 'channel' ? ' <i>hold</i>' : m.mode === 'aim' ? ' <i>hold to aim</i>' : ''}<small>${m.desc}</small></div></div>`).join('')}</div>`;
}

