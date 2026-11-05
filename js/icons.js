// ===================== spell icons =====================
// A painted, full-colour icon for every move (64x64 SVG, transparent background), showing what the move does.
// Each element's icons are painted from its own colour by a small kit of glowing primitives (orbs, flames, bolts,
// crystals, clouds, blades...). moveIcon(m) returns the <svg>; a move with no icon keeps its emoji.
// When a move changes what it does or looks like, change its icon here too (see CLAUDE.md).
const SPELL_ART = {};
const paintKit = (() => {
  const f = v => +(+v).toFixed(1);
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  const tongue = (x, y, w, h, lean = 0) => `M${f(x - w / 2)} ${f(y)}C${f(x - w / 2)} ${f(y - h * .45)} ${f(x - w * .12 + lean * .3)} ${f(y - h * .62)} ${f(x + lean)} ${f(y - h)}C${f(x + w * .18 + lean * .45)} ${f(y - h * .6)} ${f(x + w / 2)} ${f(y - h * .45)} ${f(x + w / 2)} ${f(y)}A${f(w / 2)} ${f(w * .45)} 0 0 1 ${f(x - w / 2)} ${f(y)}Z`;
  return (id, col) => {
    const M = col, D = mix(col, '#000000', .6), L = mix(col, '#ffffff', .62), W = mix(col, '#ffffff', .9);
    const u = n => `url(#${id}${n})`;
    const defs = `<defs>
<radialGradient id="${id}o" cx=".4" cy=".36" r=".64"><stop offset="0" stop-color="${W}"/><stop offset=".3" stop-color="${L}"/><stop offset=".68" stop-color="${M}"/><stop offset="1" stop-color="${D}"/></radialGradient>
<linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L}"/><stop offset=".55" stop-color="${M}"/><stop offset="1" stop-color="${D}"/></linearGradient>
<linearGradient id="${id}fo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${M}"/><stop offset=".55" stop-color="${mix(M, D, .5)}"/><stop offset="1" stop-color="${D}" stop-opacity=".2"/></linearGradient>
<linearGradient id="${id}fm" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${L}"/><stop offset=".6" stop-color="${M}"/><stop offset="1" stop-color="${M}" stop-opacity=".3"/></linearGradient>
<linearGradient id="${id}fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="${W}"/><stop offset="1" stop-color="${L}" stop-opacity=".4"/></linearGradient>
<linearGradient id="${id}mt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c9d2e2"/><stop offset=".55" stop-color="#7d8496"/><stop offset="1" stop-color="#3a3f4c"/></linearGradient>
<linearGradient id="${id}gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#e0a020"/><stop offset="1" stop-color="#7a4a08"/></linearGradient>
<linearGradient id="${id}bn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbea"/><stop offset=".55" stop-color="#d8ccaa"/><stop offset="1" stop-color="#7a6a4a"/></linearGradient>
<linearGradient id="${id}rk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8b07a"/><stop offset=".5" stop-color="#8a5a32"/><stop offset="1" stop-color="#3a2414"/></linearGradient>
<linearGradient id="${id}cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(L, '#ffffff', .5)}"/><stop offset=".6" stop-color="${mix(M, '#6a6a80', .55)}"/><stop offset="1" stop-color="${mix(D, '#1a1a2a', .5)}"/></linearGradient>
<linearGradient id="${id}dk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(M, '#000000', .35)}"/><stop offset="1" stop-color="${mix(D, '#000000', .6)}"/></linearGradient>
<radialGradient id="${id}fd" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${M}" stop-opacity=".75"/><stop offset="1" stop-color="${M}" stop-opacity="0"/></radialGradient>
<filter id="${id}g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2"/></filter>
<filter id="${id}g2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.1"/></filter>
</defs>`;
    const k = {
      id, M, D, L, W, u, defs, mix, f, tongue,
      glow: (x, y, r, o = .55, c = M) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}" opacity="${o}" filter="${u('g')}"/>`,
      halo: (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${u('fd')}"/>`,
      orb: (x, y, r, hl = true) => k.glow(x, y, r * 1.35) + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${u('o')}"/>` + (hl ? `<path d="M${f(x - r * .62)} ${f(y - r * .2)}A${f(r * .7)} ${f(r * .7)} 0 0 1 ${f(x - r * .1)} ${f(y - r * .7)}" stroke="#fff" stroke-width="${f(Math.max(1, r * .16))}" stroke-linecap="round" fill="none" opacity=".7"/>` : ''),
      flame: (x, y, w, h, lean = 0, o = 1) => `<g opacity="${o}"><path d="${tongue(x, y, w, h, lean)}" fill="${u('fo')}"/><path d="${tongue(x + lean * .08, y - h * .02, w * .7, h * .78, lean * .8)}" fill="${u('fm')}"/><path d="${tongue(x + lean * .12, y - h * .03, w * .38, h * .5, lean * .6)}" fill="${u('fi')}"/></g>`,
      // a tapering streak from the tail (x1, y1) to the head (x2, y2), w wide at the head
      streak: (x1, y1, x2, y2, w, o = .7, c = M) => { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
        return `<path d="M${f(x1)} ${f(y1)}L${f(x2 + nx)} ${f(y2 + ny)}L${f(x2 - nx)} ${f(y2 - ny)}Z" fill="${c}" opacity="${o}"/><path d="M${f(x1 + dx * .3)} ${f(y1 + dy * .3)}L${f(x2 + nx * .4)} ${f(y2 + ny * .4)}L${f(x2 - nx * .4)} ${f(y2 - ny * .4)}Z" fill="${L}" opacity="${o}"/>`; },
      bolt: (pts, w = 2.6) => { const p = pts.map(q => q.map(f).join(',')).join(' ');
        return `<polyline points="${p}" fill="none" stroke="${M}" stroke-width="${w * 3.2}" stroke-linejoin="round" stroke-linecap="round" opacity=".55" filter="${u('g2')}"/><polyline points="${p}" fill="none" stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${p}" fill="none" stroke="#fff" stroke-width="${f(w * .4)}" stroke-linejoin="round" stroke-linecap="round"/>`; },
      beam: (x1, y1, x2, y2, w = 4, o = 1) => `<g opacity="${o}"><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${M}" stroke-width="${f(w * 2.4)}" stroke-linecap="round" opacity=".6" filter="${u('g2')}"/><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${L}" stroke-width="${f(w)}" stroke-linecap="round"/><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#fff" stroke-width="${f(w * .38)}" stroke-linecap="round"/></g>`,
      ring: (x, y, rx, ry, w = 2.5, o = 1) => `<g opacity="${o}"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${M}" stroke-width="${f(w * 2.6)}" opacity=".55" filter="${u('g2')}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${L}" stroke-width="${f(w)}"/></g>`,
      // a faceted crystal shard centred on (x, y), s tall (half-length), turned by rot degrees
      shard: (x, y, s, rot = 0, glow = true) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">${glow ? k.glow(0, 0, s * .7, .45) : ''}<path d="M0 ${f(-s)}L${f(s * .36)} ${f(-s * .3)}L0 ${f(s)}Z" fill="${M}"/><path d="M0 ${f(-s)}L${f(-s * .36)} ${f(-s * .3)}L0 ${f(s)}Z" fill="${L}"/><path d="M${f(-s * .36)} ${f(-s * .3)}L0 ${f(-s * .1)}L${f(s * .36)} ${f(-s * .3)}" fill="none" stroke="${W}" stroke-width=".8" opacity=".8"/><path d="M0 ${f(-s)}L${f(s * .36)} ${f(-s * .3)}L0 ${f(s)}L${f(-s * .36)} ${f(-s * .3)}Z" fill="none" stroke="${W}" stroke-width=".7" opacity=".6"/></g>`,
      burst: (x, y, r, n = 8, ri = .38, rot = 0) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot * Math.PI / 180 + i * Math.PI / n, rr = i % 2 ? r * ri : r; p.push(`${f(x + Math.cos(a) * rr)},${f(y + Math.sin(a) * rr)}`); }
        return k.glow(x, y, r * .9, .6) + `<polygon points="${p.join(' ')}" fill="${u('o')}"/>`; },
      star: (x, y, r) => k.burst(x, y, r, 5, .45, -90),
      sparks: (pts, c = W) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join(''),
      twinkle: (x, y, r) => `<path d="M${f(x)} ${f(y - r)}L${f(x + r * .22)} ${f(y - r * .22)}L${f(x + r)} ${f(y)}L${f(x + r * .22)} ${f(y + r * .22)}L${f(x)} ${f(y + r)}L${f(x - r * .22)} ${f(y + r * .22)}L${f(x - r)} ${f(y)}L${f(x - r * .22)} ${f(y - r * .22)}Z" fill="#fff"/>`,
      cloud: (x, y, s = 1, fill = u('cl')) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><ellipse cx="0" cy="7" rx="17" ry="4" fill="${D}" opacity=".45"/><circle cx="-9" cy="1" r="7.5" fill="${fill}"/><circle cx="9" cy="1" r="8" fill="${fill}"/><circle cx="-1" cy="-5" r="10" fill="${fill}"/><rect x="-16" y="0" width="33" height="8" rx="4" fill="${fill}"/><path d="M-9 -9a10 10 0 0 1 12-4" stroke="#fff" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/></g>`,
      drop: (x, y, s = 1, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><path d="M0 -12C6 -4 9 1 9 5a9 9 0 0 1-18 0c0-4 3-9 9-17z" fill="${u('o')}"/><path d="M-5 4a5 5 0 0 1 3-5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".75"/></g>`,
      rock: (x, y, s = 1, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><path d="M-9 3L-7 -6L1 -9L8 -5L10 3L4 9L-5 8Z" fill="${u('rk')}"/><path d="M-7 -6L1 -9L8 -5L1 -3Z" fill="#f0d0a0" opacity=".45"/><path d="M-2 0l3 2 2 4" stroke="#2a1608" stroke-width="1" fill="none" opacity=".6"/></g>`,
      // a sword with its hilt at (x, y), pointing at angle rot (0 = up), len long
      blade: (x, y, len = 34, rot = 0, sc = 1, glow = true) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${sc})">${glow ? `<path d="M0 ${-len}L3.4 ${f(-len + 6)}V-4H-3.4V${f(-len + 6)}Z" fill="${M}" opacity=".55" filter="${u('g2')}"/>` : ''}<path d="M0 ${-len}L3.4 ${f(-len + 6)}V-4H-3.4V${f(-len + 6)}Z" fill="${u('mt')}"/><path d="M0 ${f(-len + 2)}V-5" stroke="#fff" stroke-width=".7" opacity=".7"/><rect x="-7" y="-4.5" width="14" height="3" rx="1.4" fill="${u('gd')}"/><rect x="-1.6" y="-1.5" width="3.2" height="8" fill="#5a3418"/><circle cx="0" cy="7.5" r="2.2" fill="${u('gd')}"/></g>`,
      dagger: (x, y, len = 20, rot = 0, sc = 1) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${sc})"><path d="M0 ${-len}L3 ${f(-len + 7)}V-3H-3V${f(-len + 7)}Z" fill="${M}" opacity=".6" filter="${u('g2')}"/><path d="M0 ${-len}L3 ${f(-len + 7)}V-3H-3V${f(-len + 7)}Z" fill="${u('mt')}"/><rect x="-5" y="-3.5" width="10" height="2.4" rx="1" fill="${u('gd')}"/><rect x="-1.3" y="-1.2" width="2.6" height="6" fill="#3a2418"/></g>`,
      skull: (x, y, s = 1, eyes = M) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M0 -14a12 12 0 0 0-12 12c0 4 2 6.5 4 8v5h16v-5c2-1.5 4-4 4-8a12 12 0 0 0-12-12z" fill="${u('bn')}"/><ellipse cx="-4.6" cy="-1" rx="3.3" ry="3.8" fill="#1a1012"/><ellipse cx="4.6" cy="-1" rx="3.3" ry="3.8" fill="#1a1012"/>${k.glow(-4.6, -1, 2.4, .9, eyes)}${k.glow(4.6, -1, 2.4, .9, eyes)}<circle cx="-4.6" cy="-1" r="1.2" fill="${eyes}"/><circle cx="4.6" cy="-1" r="1.2" fill="${eyes}"/><path d="M-1.4 5l1.4-2.4 1.4 2.4z" fill="#3a2a22"/><path d="M-4 9v4M0 9v4M4 9v4" stroke="#5a4a3a" stroke-width="1"/><path d="M-8 -9a11 11 0 0 1 7-3.5" stroke="#fff" stroke-width="1.4" fill="none" opacity=".6" stroke-linecap="round"/></g>`,
      bone: (x1, y1, x2, y2, w = 4) => { const a = Math.atan2(y2 - y1, x2 - x1), px = -Math.sin(a) * w * .55, py = Math.cos(a) * w * .55, knob = (x, y) => `<circle cx="${f(x + px)}" cy="${f(y + py)}" r="${f(w * .62)}" fill="${u('bn')}"/><circle cx="${f(x - px)}" cy="${f(y - py)}" r="${f(w * .62)}" fill="${u('bn')}"/>`;
        return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#d8ccaa" stroke-width="${w}" stroke-linecap="round"/><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="#fffbea" stroke-width="${f(w * .35)}" stroke-linecap="round" transform="translate(${f(-px * .4)} ${f(-py * .4)})"/>` + knob(x1, y1) + knob(x2, y2); },
      tentacle: (d, w = 6) => `<path d="${d}" fill="none" stroke="${D}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${M}" stroke-width="${f(w * .62)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${L}" stroke-width="${f(w * .18)}" stroke-linecap="round" stroke-dasharray="1.5 3" opacity=".9"/>`,
      spiral: (x, y, r, turns = 2.2, w = 2.4, o = 1) => { let d = '', n = 40; for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * Math.PI * 2, rr = r * (.12 + .88 * t); d += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`; }
        return `<g opacity="${o}"><path d="${d}" fill="none" stroke="${M}" stroke-width="${f(w * 2.6)}" opacity=".5" filter="${u('g2')}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${L}" stroke-width="${w}" stroke-linecap="round"/></g>`; },
      eye: (x, y, s = 1, pupil = D) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">${k.glow(0, 0, 14, .5)}<path d="M-18 0C-11 -11 11 -11 18 0C11 11 -11 11 -18 0Z" fill="${W}"/><circle cx="0" cy="0" r="8" fill="${u('o')}"/><ellipse cx="0" cy="0" rx="2.2" ry="6.5" fill="${pupil}"/><circle cx="-3" cy="-3.2" r="1.6" fill="#fff"/><path d="M-18 0C-11 -11 11 -11 18 0C11 11 -11 11 -18 0Z" fill="none" stroke="${D}" stroke-width="1.2"/></g>`,
      figure: (x, y, s = 1, c1 = '#8a7aa8', c2 = '#2a2040') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M0 -10c3.4 0 5.6 2.8 5.6 6.2 0 1.6-.6 2.8-1.1 3.9L8 10H-8l3.5-9.9C-5 -1 -5.6 -2.2 -5.6 -3.8-5.6 -7.2-3.4 -10 0 -10z" fill="${c1}"/><path d="M0 -10c3.4 0 5.6 2.8 5.6 6.2 0 1.6-.6 2.8-1.1 3.9L8 10H0z" fill="${c2}" opacity=".6"/></g>`,
      ground: (y = 56, rx = 28, o = .55) => `<ellipse cx="32" cy="${y}" rx="${rx}" ry="${f(rx * .18)}" fill="${D}" opacity="${o}"/>`,
      smoke: (x, y, s = 1, c = '#6a6070', o = .6) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})" opacity="${o}" filter="${u('g2')}"><circle cx="-5" cy="2" r="6" fill="${c}"/><circle cx="4" cy="-2" r="7" fill="${c}"/><circle cx="1" cy="5" r="6" fill="${mix(c, '#000000', .3)}"/></g>`,
      moon: (x, y, r, fill = u('o')) => k.glow(x, y, r * 1.2, .5) + `<path d="M${f(x + r * .3)} ${f(y - r)}A${f(r)} ${f(r)} 0 1 0 ${f(x + r * .3)} ${f(y + r)}A${f(r * .8)} ${f(r * .8)} 0 0 1 ${f(x + r * .3)} ${f(y - r)}Z" fill="${fill}"/>`,
      saw: (x, y, r, n = 12) => { const p = []; for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n; p.push(`${f(x + Math.cos(a) * r)},${f(y + Math.sin(a) * r)}`, `${f(x + Math.cos(a + Math.PI / n * .55) * r * .78)},${f(y + Math.sin(a + Math.PI / n * .55) * r * .78)}`, `${f(x + Math.cos(a + Math.PI / n * 1.4) * r * .8)},${f(y + Math.sin(a + Math.PI / n * 1.4) * r * .8)}`); }
        return `<polygon points="${p.join(' ')}" fill="${u('mt')}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .55)}" fill="none" stroke="#fff" stroke-width=".8" opacity=".5"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .2)}" fill="#3a3f4c"/>`; },
      bomb: (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#2a2a34"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${id}o)" opacity=".18"/><path d="M${f(x - r * .6)} ${f(y - r * .35)}a${f(r * .7)} ${f(r * .7)} 0 0 1 ${f(r * .45)} ${f(-r * .4)}" stroke="#fff" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/><rect x="${f(x - r * .3)}" y="${f(y - r * 1.15)}" width="${f(r * .6)}" height="${f(r * .3)}" fill="#55556a"/>`,
      hand: (x, y, s = 1, fill = u('v')) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-8 14v-8l-4-5a2 2 0 0 1 3-2.6L-6 1v-11a2 2 0 0 1 4 0v8-11a2 2 0 0 1 4 0v11-9a2 2 0 0 1 4 0v10-6a2 2 0 0 1 4 0V6l-3 8z" fill="${fill}"/></g>`,
      foe: (x, y, s = 1, eyes = '#ff3a3a') => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-8 10V0c0-5 3.5-9 8-9s8 4 8 9v10l-3-2-2.5 2-2.5-2-2.5 2-2.5-2z" fill="#3a2430"/><path d="M-6 -6l-3-5 5 3M6 -6l3-5-5 3" fill="#2a1a24"/><circle cx="-3" cy="-1" r="1.4" fill="${eyes}"/><circle cx="3" cy="-1" r="1.4" fill="${eyes}"/></g>`,
      wave: (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-30 14V2C-22 -4 -16 -16 -2 -18 10 -19 18 -12 18 -4 13 -9 6 -9 3 -4 0 1 6 6 12 6H30v8z" fill="${u('v')}"/><path d="M-26 0C-18 -6 -12 -14 -2 -15 8 -16 15 -11 16 -5 12 -8 6 -8 3 -4" fill="none" stroke="#fff" stroke-width="2" opacity=".8" stroke-linecap="round"/><path d="M-30 9c6-3 10-3 15 0s10 3 15 0 10-3 15 0 10 3 15 0" fill="none" stroke="${W}" stroke-width="1.4" opacity=".6"/></g>`,
    };
    return k;
  };
})();
let iconSeq = 0;
function moveIcon(m) {
  const i = +String(m.key || '').split('.')[1], fn = SPELL_ART[m.el]?.[i];
  if (!fn) return m.icon;
  const id = 'pi' + (iconSeq++).toString(36) + '_', col = '#' + (EL[m.el]?.color ?? 0xffffff).toString(16).padStart(6, '0'), k = paintKit(id, col);
  return `<svg class="pico" viewBox="0 0 64 64" aria-hidden="true">${k.defs}${fn(k)}</svg>`;
}

// ---- Fire ----
SPELL_ART.fire = [
  // Fireball: a white-hot core wrapped in fire, flames streaming back behind it
  k => k.glow(38, 26, 20) + `<g transform="rotate(-135 38 26)">${k.flame(38, 22, 26, 44, 0, .9)}${k.flame(31, 24, 14, 30, -3, .8)}${k.flame(45, 24, 14, 28, 3, .8)}</g>` + `<circle cx="38" cy="26" r="14" fill="${k.u('o')}"/><path d="M30 20a10 10 0 0 1 9-6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".7"/>` + k.sparks([[12, 48, 1.4], [8, 40, 1], [18, 56, 1.1], [24, 50, .8], [6, 54, .7]], '#ffd27a'),
  // Flamethrower: a turbulent jet of fire roaring out of a gauntlet, dark smoke rolling off its end
  k => k.smoke(50, 9, .75, '#3a2a28', .75) + `<path d="M12 50L40 6C52 10 60 22 58 34z" fill="${k.M}" opacity=".5" filter="${k.u('g')}"/><path d="M13 49C22 36 28 20 38 8c4 4 8 2 11 6 3 1 4 6 8 8-2 4 1 8-1 12-4 1-6 5-10 6-3 3-8 2-11 5C26 46 20 47 13 49z" fill="${k.u('fm')}"/><path d="M14 48C22 38 28 28 36 20c3 2 6 1 8 4 1 3 4 5 5 7-3 2-5 5-9 6-6 4-14 8-26 11z" fill="#ffeaa0" opacity=".85"/><path d="M15 47c6-6 12-12 18-16 2 1 4 3 5 5-6 4-14 8-23 11z" fill="#fff" opacity=".8"/><path d="M4 60l9-13 6 4-8 12z" fill="#4a3e4e" stroke="#8a7a8a" stroke-width="1"/><path d="M11 47l6 4" stroke="#ffcf6a" stroke-width="2"/>` + k.sparks([[46, 44, 1.3], [54, 40, 1], [50, 50, .9], [30, 12, 1], [56, 16, .8]], '#ffd27a'),
  // Phoenix Strike: a phoenix of living flame, wings spread, streaming fire behind it as it dives
  k => k.glow(32, 30, 26, .5) + `<g transform="rotate(150 32 36)">${k.flame(32, 34, 12, 30, 0, .85)}${k.flame(25, 34, 8, 22, -3, .7)}${k.flame(39, 34, 8, 22, 3, .7)}</g>`
    + `<path d="M32 31C25 19 15 13 3 14c6 3 9 7 11 12-4-1-8 0-10 2 7 1 14 3 19 7z" fill="${k.u('fm')}"/><path d="M32 31C39 19 49 13 61 14c-6 3-9 7-11 12 4-1 8 0 10 2-7 1-14 3-19 7z" fill="${k.u('fm')}"/>`
    + `<path d="M30 29C24 22 17 18 9 17M34 29C40 22 47 18 55 17M29 31C23 27 16 25 10 26M35 31C41 27 48 25 54 26" stroke="${k.W}" stroke-width="1.2" fill="none" opacity=".8" stroke-linecap="round"/>`
    + `<ellipse cx="32" cy="31" rx="5" ry="9" fill="${k.u('o')}"/><circle cx="32" cy="20" r="4.2" fill="${k.W}"/><path d="M32 14l-2.4 3.4h4.8z" fill="${k.L}"/><path d="M29.5 18c-2 -3 -1 -6 1 -8M34.5 18c2 -3 1 -6 -1 -8" stroke="${k.L}" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="32" cy="20.5" r="1.3" fill="${k.D}"/>`,
  // Ring of Fire: seen from above, a circle of flames bursting outward round the caster
  k => `<circle cx="32" cy="32" r="30" fill="${k.u('fd')}"/>` + Array.from({ length: 12 }, (_, i) => `<g transform="rotate(${i * 30} 32 32)">${k.flame(32, 16, 9, 15, 0, i % 2 ? .8 : 1)}</g>`).join('') + k.ring(32, 32, 16, 16, 2.5) + `<circle cx="32" cy="32" r="13.5" fill="#1a0a10" opacity=".75"/>` + k.figure(32, 32, .95) + `<path d="M29 29.5h6" stroke="#ffcf6a" stroke-width="1.2" opacity=".8"/>`,
  // Conflagration: a towering wall of fire rolling across the ground
  k => `<ellipse cx="32" cy="42" rx="26" ry="16" fill="${k.M}" opacity=".45" filter="${k.u('g')}"/>` + k.flame(6, 50, 14, 30, -2, .7) + k.flame(58, 50, 14, 30, 2, .7) + k.flame(20, 52, 16, 40, -1, .85) + k.flame(44, 52, 16, 40, 1, .85) + k.flame(32, 56, 22, 52) + k.flame(12, 58, 14, 30, -3) + k.flame(52, 58, 14, 30, 3) + k.ground(58, 31, .6) + k.sparks([[10, 12, 1.2], [54, 10, 1], [26, 6, .9], [42, 16, 1.1], [60, 30, .8], [4, 28, .8]], '#ffd27a'),
];

// ---- Frost ----
SPELL_ART.frost = [
  // Ice Shard: crystal shards streaking forward
  k => k.streak(4, 62, 24, 40, 8, .5) + k.shard(34, 30, 17, 45) + k.streak(30, 18, 42, 8, 4, .5) + k.shard(48, 6, 6, 45, false) + k.streak(44, 60, 54, 48, 4, .5) + k.shard(57, 45, 6, 45, false) + k.twinkle(14, 20, 3) + k.sparks([[20, 50, 1], [50, 30, .9]]),
  // Glacial Lance: a long spear of ice punching through, frost trailing off it
  k => k.streak(2, 62, 20, 44, 10, .45) + `<g transform="translate(34 30) rotate(45) scale(.42 1)">${k.shard(0, 0, 32, 0)}</g>` + k.shard(16, 48, 5, -20, false) + k.shard(22, 54, 4, 70, false) + k.twinkle(54, 10, 3.5) + k.sparks([[10, 40, 1], [40, 52, 1.1], [50, 26, .8]]),
  // Frost Orb: a churning ball of ice spraying shards out in a spinning spiral
  k => [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * 45 + 20, r1 = 13 + i * .8, r2 = 24 + i * 1.2, c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return k.streak(32 + c * r1, 32 + s * r1, 32 + c * r2, 32 + s * r2, 3, .45) + k.shard(32 + c * r2, 32 + s * r2, 4.5, a + 90, false); }).join('')
    + k.orb(32, 32, 11) + `<path d="M24 30l6 2-4 5M40 28l-5 4 5 4M31 23l1 6 5-3" stroke="${k.W}" stroke-width="1.3" fill="none" opacity=".75" stroke-linecap="round"/>`,
  // Frost Nova: ice spikes erupting from frosted ground in a ring all round the caster, cold mist rolling off
  k => k.halo(32, 44, 30) + `<ellipse cx="32" cy="46" rx="29" ry="11" fill="${k.L}" opacity=".35" filter="${k.u('g2')}"/><ellipse cx="32" cy="46" rx="22" ry="8" fill="none" stroke="${k.W}" stroke-width="1.2" opacity=".7"/>`
    + [[200, 12, .7], [235, 15, .8], [270, 17, .85], [305, 15, .8], [340, 12, .7], [160, 13, .9], [125, 17, 1], [90, 20, 1.1], [55, 17, 1], [20, 13, .9]].map(([a, h, o]) => { const x = 32 + Math.cos(a * Math.PI / 180) * 24, y = 46 + Math.sin(a * Math.PI / 180) * 9; return `<g opacity="${o}">${k.shard(x, y - h * .7, h * .75, (x - 32) * .9, false)}</g>`; }).join('')
    + k.smoke(10, 50, .55, '#dff4ff', .5) + k.smoke(54, 51, .55, '#dff4ff', .5) + k.sparks([[20, 20, 1.2], [44, 16, 1], [32, 12, 1.4], [52, 26, 1]]),
  // Blizzard: a storm cloud driving hail and snow down at a slant
  k => k.cloud(32, 21, 1.2) + [[14, 34], [24, 38], [34, 34], [44, 38], [52, 32], [20, 50], [32, 52], [44, 50]].map(([x, y]) => k.streak(x + 5, y - 9, x, y, 2.6, .8)).join('') + k.twinkle(10, 50, 2.6) + k.twinkle(56, 54, 2.2) + k.twinkle(38, 60, 2),
];
// ---- Storm ----
SPELL_ART.storm = [
  // Chain Lightning: a bolt leaping from one target to the next
  k => k.bolt([[6, 56], [14, 44], [10, 40], [22, 30], [26, 34], [36, 22], [34, 18], [46, 14], [50, 18], [58, 6]], 2.4) + k.orb(22, 30, 4.5, false) + k.orb(46, 14, 4.5, false) + k.orb(6, 56, 3.5, false) + k.sparks([[30, 40, 1], [52, 26, 1]]),
  // Lightning Dash: the caster streaking forward as a bolt, a fading afterimage left where they stood
  k => `<g opacity=".35">${k.figure(12, 40, 1.15, k.M, k.D)}</g>` + k.streak(10, 44, 50, 30, 10, .35) + k.bolt([[10, 44], [20, 36], [24, 42], [34, 32], [38, 37], [50, 28]], 2.6)
    + k.glow(52, 28, 10, .6) + `<g>${k.figure(52, 30, 1.15, k.W, k.M)}</g>` + k.sparks([[30, 50, 1.2], [42, 46, 1], [20, 28, 1], [58, 40, 1.3]]),
  // Thunderclap: a huge bolt slamming into the ground
  k => k.ring(30, 52, 24, 6, 2, .8) + k.burst(30, 50, 12, 10, .3) + k.bolt([[38, 0], [30, 16], [38, 20], [28, 36], [34, 38], [30, 50]], 4) + k.rock(12, 44, .5, 20) + k.rock(50, 42, .45, -30) + k.sparks([[8, 30, 1.2], [56, 28, 1], [44, 54, 1]]),
  // Tesla Coil: a coil tower crackling with arcs
  k => k.ground(58, 18) + `<path d="M24 58h16l-3-6H27z" fill="#4a4e5e"/><rect x="28" y="22" width="8" height="30" fill="#5a3a20"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => `<ellipse cx="32" cy="${50 - i * 4}" rx="7" ry="2" fill="none" stroke="#e0a050" stroke-width="2"/>`).join('') + `<ellipse cx="32" cy="18" rx="12" ry="4" fill="url(#${k.id}mt)"/>` + k.orb(32, 11, 6) + k.bolt([[32, 11], [20, 8], [16, 14], [4, 10]], 1.4) + k.bolt([[32, 11], [44, 6], [48, 12], [60, 6]], 1.4) + k.bolt([[32, 11], [46, 20], [52, 28], [58, 26]], 1.2),
  // Thunderstorm: a black storm cloud hurling bolts down
  k => k.cloud(32, 21, 1.25, k.u('dk')) + `<g transform="translate(32 21) scale(1.25)"><path d="M-10 -10a10 10 0 0 1 12-4" stroke="${k.L}" stroke-width="1.4" fill="none" opacity=".6"/></g>` + k.bolt([[22, 28], [16, 40], [22, 42], [14, 58]], 2.6) + k.bolt([[42, 28], [38, 38], [44, 40], [40, 52]], 2) + k.sparks([[8, 40, 1], [54, 54, 1.1], [30, 52, .9]]),
];
// ---- Water ----
SPELL_ART.water = [
  // Aqua Bullets: water bullets fired in a burst
  k => [[16, 50], [32, 34], [48, 18]].map(([x, y], i) => k.streak(x - 12, y + 12, x - 2, y + 2, 7 - i, .55) + k.drop(x, y, .62 + i * .08, 45)).join('') + k.sparks([[54, 34, 1.2], [36, 54, 1], [22, 26, .9]]),
  // Riptide Ring: a spinning hoop of water racing forward with a monster caught inside it
  k => k.streak(2, 50, 22, 40, 10, .35) + k.streak(4, 30, 22, 32, 6, .3) + k.foe(38, 34, .85) + k.ring(38, 40, 20, 7, 3) + `<path d="M18 40a20 7 0 0 0 40 0" fill="none" stroke="${k.W}" stroke-width="2" stroke-linecap="round"/>` + k.drop(14, 46, .3, -60) + k.drop(60, 32, .3, 60) + k.drop(56, 50, .28, 120) + k.sparks([[24, 30, 1], [52, 26, 1.1], [44, 52, 1]]),
  // Water Cannon: a thick jet of water blasting a monster backwards, spray bursting off it
  k => `<path d="M4 40L50 26L52 38L6 48Z" fill="${k.u('v')}" opacity=".9"/><path d="M8 43L48 31" stroke="${k.W}" stroke-width="2" stroke-dasharray="7 4" stroke-linecap="round"/>` + `<g transform="rotate(-18 52 30)">${k.foe(54, 32, .7)}</g>` + k.drop(44, 14, .4, 30) + k.drop(60, 18, .35, 60) + k.drop(46, 50, .35, 150) + k.drop(60, 46, .3, 120) + k.sparks([[38, 20, 1.2], [36, 50, 1]]),
  // Waterfall: a column of water pouring out of a dark cloud onto a monster, spray bursting off the pool
  k => `<rect x="22" y="12" width="20" height="40" fill="${k.u('v')}" opacity=".85"/><path d="M26 14v36M32 14v38M38 14v36" stroke="${k.W}" stroke-width="1.4" opacity=".7" stroke-dasharray="6 4"/>` + k.cloud(32, 12, 1.05, k.u('dk')) + k.ring(32, 54, 24, 6, 2) + k.foe(32, 50, .6) + k.drop(10, 44, .35, -50) + k.drop(54, 42, .35, 50) + k.drop(6, 54, .25, -70) + k.drop(58, 54, .25, 70) + k.sparks([[16, 36, 1], [48, 34, 1.1]]),
  // Tsunami: a towering wave crashing over everything
  k => k.wave(34, 40, 1.35) + k.rock(10, 58, .45) + k.foe(52, 56, .55) + k.sparks([[46, 8, 1.3], [54, 14, 1], [40, 4, .9], [58, 22, 1]]),
];
// ---- Earth ----
SPELL_ART.earth = [
  // Stone Shot: a blast of pebbles spraying out
  k => [[22, 40, .55, 10], [34, 30, .7, 40], [46, 18, .6, -20], [40, 44, .5, 70], [52, 34, .45, 15], [28, 16, .4, 30]].map(([x, y, s, r]) => k.streak(6, 58, x - (x - 6) * .25, y - (y - 58) * .25, 3, .4) + k.rock(x, y, s, r)).join('') + k.burst(8, 56, 6, 8, .3),
  // Boulder: a huge boulder ploughing forward in a cloud of dust
  k => k.smoke(14, 50, 1.2, '#8a7058', .55) + k.smoke(52, 52, .9, '#8a7058', .5) + k.ground(56, 28) + k.rock(32, 32, 2.5, 15) + `<path d="M6 30h10M4 38h12M8 22h8" stroke="${k.L}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
  // Stone Pillar: a pillar of stone erupting, flinging a monster skyward
  k => k.ground(58, 26) + `<path d="M22 58V28l4-4h12l4 4v30z" fill="url(#${k.id}rk)"/><path d="M22 28l4-4h12l4 4z" fill="#f0d0a0" opacity=".55"/><path d="M26 36l4 4-2 6M36 44l2 4" stroke="#2a1608" stroke-width="1.2" fill="none" opacity=".6"/>` + k.rock(12, 52, .55, 30) + k.rock(52, 50, .5, -20) + k.foe(32, 10, .6) + `<path d="M24 16l-3-4M40 16l3-4" stroke="${k.L}" stroke-width="1.6" stroke-linecap="round"/>`,
  // Fissure: the ground splitting open, spikes bursting up along it
  k => `<path d="M2 50L62 38V50L2 62z" fill="url(#${k.id}rk)" opacity=".7"/>` + k.glow(32, 47, 14, .5) + `<path d="M4 55L16 50L22 53L32 46L40 48L50 42L60 43" fill="none" stroke="#1a0c04" stroke-width="3" stroke-linejoin="round"/><path d="M16 50L22 53L32 46L40 48L50 42" fill="none" stroke="${k.M}" stroke-width="1" opacity=".9"/>` + [[16, 50, 12], [30, 46, 18], [44, 44, 14], [56, 42, 9]].map(([x, y, h]) => `<path d="M${x - 4} ${y}L${x} ${y - h}L${x + 4} ${y}z" fill="url(#${k.id}rk)"/><path d="M${x - 4} ${y}L${x} ${y - h}L${x} ${y}z" fill="#f0d0a0" opacity=".5"/>`).join(''),
  // Tectonic Quake: molten cracks racing out from the centre, spikes and slabs heaving up, shockwaves rolling out
  k => `<path d="M32 46l-8 3-9-2-12 5M32 46l7 4 6 7M32 46l10-2 8 2 12-3M32 46l-3-5-9-3" fill="none" stroke="#ff9a30" stroke-width="3.2" stroke-linecap="round" opacity=".55" filter="url(#${k.id}g2)"/><path d="M32 46l-8 3-9-2-12 5M32 46l7 4 6 7M32 46l10-2 8 2 12-3M32 46l-3-5-9-3" fill="none" stroke="#ffd27a" stroke-width="1.2" stroke-linecap="round"/>` + k.ring(32, 46, 30, 9, 1.5, .6) + k.ring(32, 46, 19, 6, 1.5, .8) + `<path d="M4 44l14-6 8 6-4 10-16 2z" fill="url(#${k.id}rk)"/><path d="M28 40l10-8 12 6-2 10-14 4z" fill="url(#${k.id}rk)"/><path d="M40 52l14-4 8 6-6 6H44z" fill="url(#${k.id}rk)"/><path d="M4 44l14-6 8 6M28 40l10-8 12 6M40 52l14-4 8 6" fill="none" stroke="#f0d0a0" stroke-width="1" opacity=".6"/>` + k.rock(20, 18, .45, 10) + k.rock(48, 14, .4, -30) + k.rock(34, 8, .3) + `<path d="M8 26l-3-3M56 24l3-3M14 30l-4-1" stroke="${k.L}" stroke-width="1.8" stroke-linecap="round"/>`,
];
// ---- Wind ----
SPELL_ART.wind = [
  // Wind Blades: crescent blades of air slicing forward
  k => [[0, 0, 1], [-10, 12, .75], [8, -14, .6]].map(([dx, dy, s]) => `<g transform="translate(${30 + dx} ${34 + dy}) rotate(-35) scale(${s})">${k.glow(0, 0, 12, .35)}<path d="M-16 4C-8 -14 10 -16 18 -4 8 -10 -4 -8 -16 4z" fill="${k.u('v')}"/><path d="M-14 2C-6 -10 8 -12 16 -4" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8"/></g>`).join('') + `<path d="M4 52h12M2 44h8M10 60h10" stroke="${k.L}" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`,
  // Jet Stream: a tunnel of wind hoops racing ahead, a monster swept through it and hurled out of the far end
  k => [[10, 50, 7], [22, 42, 8.5], [34, 34, 10], [46, 26, 11.5]].map(([x, y, r]) => k.ring(x, y, r * .45, r, 1.8, .5 + x / 100)).join('') + k.streak(2, 58, 50, 22, 6, .45) + k.streak(6, 46, 40, 24, 3, .4) + k.streak(14, 60, 46, 34, 3, .4)
    + `<g transform="rotate(-25 54 14)">${k.foe(54, 16, .55)}</g>` + `<path d="M50 6l10-4M56 18l7-2" stroke="${k.W}" stroke-width="1.6" stroke-linecap="round"/>` + k.sparks([[60, 10, 1.1], [44, 8, .9]]),
  // Updraft: a rising column of air lifting the caster up
  k => k.ground(58, 18) + k.halo(32, 34, 22) + [[22, 56, 22, 14], [42, 56, 42, 12], [32, 60, 32, 6]].map(([x1, y1, x2, y2]) => k.streak(x1, y1, x2, y2, 4, .6)).join('') + k.figure(32, 26, 1) + `<path d="M12 40l6-6 6 6M40 22l6-6 6 6" fill="none" stroke="${k.L}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Tornado: a spinning funnel sucking up debris
  k => k.glow(32, 30, 20, .3) + [[10, 26, 4], [18, 22, 3.6], [26, 18, 3.2], [34, 14, 2.8], [42, 10, 2.4], [50, 7, 2], [56, 5, 1.6]].map(([y, rx, ry], i) => `<ellipse cx="${32 + Math.sin(i) * 2}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${i % 2 ? k.L : k.M}" stroke-width="${3.2 - i * .25}"/>`).join('') + k.ground(58, 12) + k.rock(10, 22, .35, 20) + k.rock(54, 34, .3, -10) + `<path d="M14 40c2-1 4 0 4 2-2 1-4 0-4-2z" fill="#6ad84a"/>`,
  // Downburst: monsters ripped into the sky by a whirlwind, then hurled down
  k => k.spiral(32, 22, 20, 1.8, 2, .7) + k.foe(18, 14, .5) + k.foe(44, 10, .5) + k.foe(36, 26, .5) + `<path d="M32 36v16M24 46l8 8 8-8" fill="none" stroke="${k.L}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` + k.ring(32, 58, 22, 4, 2),
];

// ---- Nature ----
const _root = (d, w = 5) => `<path d="${d}" fill="none" stroke="#2a1a0c" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#7a5228" stroke-width="${w * .6}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#c8a060" stroke-width="${w * .18}" stroke-linecap="round" opacity=".7"/>`;
const _leaf = (k, x, y, s = 1, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C3 -6 9 -7 12 -6 10 -2 6 2 0 0z" fill="${k.u('v')}"/><path d="M0 0L10 -5" stroke="${k.D}" stroke-width=".6"/></g>`;
SPELL_ART.nature = [
  // Thorn Volley: three barbed thorns shooting forward
  k => [[16, 48], [32, 32], [48, 16]].map(([x, y]) => k.streak(x - 12, y + 12, x - 4, y + 4, 5, .45) + `<g transform="translate(${x} ${y}) rotate(45) scale(1.45)">${k.glow(0, 0, 7, .35)}<path d="M0 -13C2.5 -5 4 2 3 9H-3C-4 2 -2.5 -5 0 -13z" fill="#6a4a1e"/><path d="M0 -13C1 -5 1.5 2 1 9H-3C-4 2 -2.5 -5 0 -13z" fill="#a8803a"/><path d="M2.5 -2l3-2M2.6 3l3-1.5M-3 0l-3-2" stroke="#4a3010" stroke-width="1.2" stroke-linecap="round"/></g>`).join('') + _leaf(k, 50, 46, .9, -20),
  // Entangle: roots bursting from the ground and binding a monster
  k => k.ground(56, 26) + k.foe(32, 34, 1.15) + _root('M14 58C10 46 20 40 30 38S46 30 40 22') + _root('M50 58C54 46 44 42 34 44S18 38 24 28') + _root('M30 60C28 52 36 50 40 46', 4) + _leaf(k, 40, 22, .8, -30) + _leaf(k, 22, 30, .7, 200) + _leaf(k, 46, 52, .6, -60),
  // Sleepcaps: glowing toadstools puffing sleep spores over a dozing monster
  k => k.foe(44, 30, .75) + `<text x="50" y="14" font-size="9" font-weight="bold" fill="${k.W}" font-family="sans-serif">z</text><text x="56" y="8" font-size="7" font-weight="bold" fill="${k.W}" font-family="sans-serif">z</text>` + k.smoke(38, 40, .9, '#7ac8a0', .7)
    + [[16, 58, 1.1], [30, 60, .8], [6, 60, .6]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2.4" y="-12" width="4.8" height="12" rx="2" fill="#e8e0c8"/><path d="M-11 -11a11 9 0 0 1 22 0z" fill="#2a8a6a"/><path d="M-11 -11h22" stroke="#7affd0" stroke-width="1.6"/><circle cx="-4" cy="-15" r="1.4" fill="#e8e0c8"/><circle cx="3" cy="-17" r="1.2" fill="#e8e0c8"/><circle cx="6" cy="-13" r="1" fill="#e8e0c8"/></g>`).join('') + k.sparks([[24, 36, 1.2], [30, 28, 1], [18, 42, .9]], '#9affd0'),
  // Bramble Wall: a hedge of thorny brambles across the floor, a monster stopped dead against it
  k => k.foe(50, 22, .7) + `<path d="M2 58C8 40 14 50 18 36S26 48 32 34 40 50 46 38 56 52 62 40V60H2Z" fill="#2a4a1a"/>` + k.tentacle('M2 50C12 40 20 54 32 44S52 50 62 42', 4.5) + [[8, 44, -30], [18, 34, 10], [28, 40, -15], [36, 32, 20], [46, 40, -10], [56, 36, 25], [14, 52, 40], [42, 52, -35]].map(([x, y, r]) => `<path d="M${x} ${y}l-2.4 7h4.8z" fill="${k.L}" transform="rotate(${r} ${x} ${y + 3})"/>`).join('') + k.sparks([[60, 14, 1], [40, 12, 1]]),
  // World Tree: a great glowing tree, its roots seizing the monsters round it
  k => k.halo(32, 22, 28) + `<path d="M28 58C29 46 26 38 30 30h4c4 8 1 16 2 28z" fill="#5a3a1e"/><path d="M31 58C31 46 30 38 32 30h2c2 8 0 16 0 28z" fill="#8a6234"/>` + `<circle cx="32" cy="20" r="14" fill="${k.u('o')}"/><circle cx="18" cy="26" r="9" fill="${k.u('o')}"/><circle cx="46" cy="26" r="9" fill="${k.u('o')}"/>` + _root('M28 58C20 56 14 58 6 54', 3.5) + _root('M36 58C44 56 50 58 58 54', 3.5) + k.foe(8, 50, .45) + k.foe(56, 50, .45) + k.sparks([[24, 14, 1.2], [40, 18, 1], [32, 8, 1]]),
];
// ---- Shadow ----
SPELL_ART.shadow = [
  // Shadow Daggers: a fan of three daggers trailing shadow
  k => [-28, 0, 28].map((r, i) => `<g transform="rotate(${r} 32 60)">${k.streak(32, 62, 32, 40, 6, .5, k.D)}</g>` + k.dagger(32 + Math.sin(r * Math.PI / 180) * 26, 60 - Math.cos(r * Math.PI / 180) * 26, 22, r)).join(''),
  // Nightmare Pit: a monster sinking into a black pit, shadowy hands clawing up round it
  k => `<ellipse cx="32" cy="48" rx="28" ry="10" fill="${k.M}" opacity=".5" filter="url(#${k.id}g2)"/><ellipse cx="32" cy="48" rx="25" ry="8" fill="#05020a"/>` + `<g>${k.foe(32, 40, .9)}</g><path d="M7 48a25 8 0 0 0 50 0z" fill="#05020a"/>` + k.tentacle('M12 50C8 38 14 30 18 26', 3.4) + k.tentacle('M52 50C56 38 50 30 46 26', 3.4) + k.tentacle('M22 54C20 44 26 40 26 34', 2.6) + k.tentacle('M42 54C44 44 38 40 38 34', 2.6) + k.ring(32, 48, 25, 8, 1.6, .9) + k.sparks([[10, 20, 1], [54, 18, 1.1], [32, 8, 1]]),
  // Shadow Snare: shadow tendrils bursting from a dark pool and pinning a monster
  k => `<ellipse cx="32" cy="54" rx="26" ry="6" fill="#0c0614"/>` + k.glow(32, 54, 18, .4) + k.foe(32, 38, 1.1) + k.tentacle('M12 54C8 42 18 36 26 40', 4.5) + k.tentacle('M52 54C56 42 46 34 38 40', 4.5) + k.tentacle('M22 56C20 46 32 46 30 30', 4) + k.tentacle('M42 56C44 46 34 46 36 32', 3.5),
  // Shade Ambush: three shadow assassins dashing through a monster from three sides, violet slashes crossing on it
  k => k.foe(32, 36, .9) + [[8, 20, 56, 52], [56, 18, 10, 54], [32, 62, 32, 6]].map(([x1, y1, x2, y2]) => k.streak(x1, y1, x2, y2, 4, .45, k.D) + k.beam(x1 + (x2 - x1) * .25, y1 + (y2 - y1) * .25, x1 + (x2 - x1) * .75, y1 + (y2 - y1) * .75, 1.6, .9)).join('')
    + `<g opacity=".8">${k.figure(10, 22, .65, '#1a0a2a', '#0a0414')}</g><g opacity=".8">${k.figure(54, 20, .65, '#1a0a2a', '#0a0414')}</g><g opacity=".8">${k.figure(32, 58, .65, '#1a0a2a', '#0a0414')}</g>` + k.sparks([[24, 30, 1.2], [40, 42, 1.1], [30, 46, 1]]),
  // Eclipse: a black sun with a blazing violet corona over a darkened land, a monster below cut by a shadow slash
  k => `<rect x="0" y="0" width="64" height="64" rx="10" fill="#0a0414" opacity=".55"/>` + k.glow(32, 22, 22, .8) + k.ring(32, 22, 16, 16, 2.4) + `<circle cx="32" cy="22" r="13" fill="#000"/><path d="M22 14a13 13 0 0 1 8-4" stroke="${k.W}" stroke-width="1.6" fill="none" opacity=".8"/>`
    + [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return k.streak(32 + Math.cos(r) * 17, 22 + Math.sin(r) * 17, 32 + Math.cos(r) * 24, 22 + Math.sin(r) * 24, 2.4, .7); }).join('')
    + k.foe(32, 52, .7) + `<path d="M18 58C26 44 40 44 48 40" stroke="${k.L}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` + k.sparks([[10, 46, 1], [54, 50, 1.1]]),
];
// ---- Light ----
SPELL_ART.light = [
  // Radiant Orbs: dead-straight bolts of light
  k => [[40, 18, 6], [26, 38, 5], [48, 42, 4]].map(([x, y, r]) => k.streak(x - 30, y + 14, x - r * .6, y + r * .3, r * 1.5, .5) + k.orb(x, y, r)).join('') + k.twinkle(14, 14, 3),
  // Solar Beam: a piercing beam of sunlight
  k => k.burst(14, 30, 12, 12, .55) + k.orb(14, 30, 7) + k.beam(18, 30, 62, 30, 8) + k.sparks([[40, 20, 1.2], [52, 42, 1], [30, 44, .9]]),
  // Blinding Flash: a small sun flaring ahead of the caster's hand, rays of light lancing out across a cone, a golden fan on the floor
  k => `<path d="M32 60L2 14A40 40 0 0 1 62 14Z" fill="${k.u('fd')}"/>` + [-50, -30, -10, 10, 30, 50].map(a => { const r = (a - 90) * Math.PI / 180; return k.streak(32 + Math.cos(r) * 10, 46 + Math.sin(r) * 10, 32 + Math.cos(r) * 40, 46 + Math.sin(r) * 40, 4, .8); }).join('') + k.orb(32, 46, 8) + k.twinkle(32, 46, 6) + k.twinkle(10, 12, 2.6) + k.twinkle(54, 10, 2.6),
  // Penance: a monster branded with a halo, two spears of light hanging over it, one already falling
  k => k.foe(32, 46, 1.1) + k.glow(32, 26, 12, .45) + k.ring(32, 26, 12, 4, 2.2) + `<g transform="translate(18 4) rotate(180) scale(.8)" opacity=".9">${k.dagger(-4, 0, 18, 0)}</g>` + `<g transform="translate(46 4) rotate(180) scale(.8)" opacity=".9">${k.dagger(4, 0, 18, 0)}</g>` + k.beam(32, 2, 32, 34, 3, .9) + k.burst(32, 36, 7, 8, .3) + k.twinkle(10, 30, 2.6) + k.twinkle(56, 34, 2.4),
  // Divine Judgment: a colossal pillar of light crashing down from the heavens
  k => k.glow(32, 30, 22, .5) + `<path d="M20 0H44L40 54H24z" fill="${k.u('fd')}"/>` + k.beam(32, 0, 32, 52, 10) + k.ring(32, 54, 22, 6, 2.4) + k.burst(32, 52, 9, 8, .3) + k.twinkle(10, 20, 2.6) + k.twinkle(54, 14, 3),
];
// ---- Venom ----
SPELL_ART.venom = [
  // Venom Spit: a glob of venom splashing into a toxic puddle
  k => `<path d="M8 12C20 4 34 10 40 30" fill="none" stroke="${k.M}" stroke-width="2" stroke-dasharray="3 3" opacity=".7"/>` + k.drop(40, 34, .9, 160) + `<ellipse cx="38" cy="54" rx="20" ry="5" fill="${k.u('v')}"/>` + k.sparks([[24, 46, 1.6], [52, 46, 1.4], [46, 42, 1]], k.L) + `<circle cx="32" cy="53" r="1.6" fill="${k.W}"/><circle cx="44" cy="55" r="1.2" fill="${k.W}"/>`,
  // Toxic Cloud: a drifting cloud of poison gas
  k => k.cloud(32, 30, 1.45, k.u('v')) + `<g opacity=".7"><circle cx="20" cy="50" r="2.2" fill="none" stroke="${k.L}" stroke-width="1.2"/><circle cx="34" cy="54" r="1.6" fill="none" stroke="${k.L}" stroke-width="1"/><circle cx="46" cy="50" r="2.6" fill="none" stroke="${k.L}" stroke-width="1.2"/></g>` + k.skull(32, 26, .5, k.D),
  // Serpent: a venom serpent slithering toward its prey
  k => { const d = 'M6 54C16 54 18 42 28 42S40 54 50 50 54 36 46 30'; return `<path d="${d}" fill="none" stroke="${k.D}" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${k.M}" stroke-width="6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${k.L}" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 4"/><g transform="translate(44 26) rotate(-30)"><path d="M-6 4C-7 -4 -3 -8 2 -8S9 -4 8 2 2 8 -6 4z" fill="${k.u('v')}"/><circle cx="1" cy="-3" r="1.6" fill="#ffda3a"/><path d="M7 -1l6 -2M10 -2l2 2" stroke="#e02a3a" stroke-width="1.2" stroke-linecap="round"/></g>`; },
  // Scorpion Sting: a giant segmented tail bursting from the ground and stabbing down into a monster
  k => `<ellipse cx="18" cy="58" rx="14" ry="4" fill="${k.D}"/>` + [[16, 54, 6], [12, 44, 5.6], [12, 34, 5.2], [16, 25, 4.8], [24, 18, 4.4], [33, 15, 4], [42, 17, 3.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${k.id}dk)" stroke="${k.M}" stroke-width="1.2"/>`).join('')
    + `<path d="M44 18L54 34L48 22Z" fill="${k.L}" stroke="${k.M}" stroke-width="1"/>` + k.burst(54, 38, 7, 8, .3) + k.foe(50, 50, .6) + k.drop(56, 28, .3, 20) + k.sparks([[60, 46, 1], [40, 40, 1]]),
  // Hydra: three venom serpent heads rising out of a poison pool, one spitting
  k => `<ellipse cx="32" cy="58" rx="24" ry="5" fill="${k.D}"/>` + k.tentacle('M18 58C12 44 22 34 14 20', 7) + k.tentacle('M32 58C30 40 38 30 32 12', 7) + k.tentacle('M46 58C52 44 42 34 50 22', 7)
    + [[14, 18, -20], [32, 10, 0], [50, 20, 20]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-6 4C-7 -3 -3 -7 0 -7S7 -3 6 4L0 2Z" fill="${k.M}" stroke="${k.D}" stroke-width="1.2"/><circle cx="-2.4" cy="-2" r="1.1" fill="#ff3a3a"/><circle cx="2.4" cy="-2" r="1.1" fill="#ff3a3a"/><path d="M-2 3l-1 3M2 3l1 3" stroke="#fff" stroke-width="1"/></g>`).join('') + k.drop(58, 36, .4, 140) + k.sparks([[60, 44, 1], [6, 40, 1]]),
];
// ---- Steel ----
SPELL_ART.steel = [
  // Saw Blade: a spinning saw blade throwing sparks
  k => k.glow(32, 32, 22, .35) + k.saw(32, 32, 20, 14) + `<path d="M6 20a28 28 0 0 1 10-12M58 44a28 28 0 0 1-10 12" fill="none" stroke="${k.L}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>` + k.sparks([[54, 14, 1.4], [58, 20, 1], [50, 8, 1]], '#ffb83a') + `<path d="M50 14l6-4M52 18l7-1" stroke="#ffb83a" stroke-width="1.2" stroke-linecap="round"/>`,
  // Railgun: a hypersonic rail spike tearing down the rails
  k => `<rect x="4" y="22" width="46" height="5" rx="1" fill="url(#${k.id}mt)"/><rect x="4" y="37" width="46" height="5" rx="1" fill="url(#${k.id}mt)"/>` + k.bolt([[8, 27], [14, 37], [20, 27], [26, 37], [32, 27]], 1.2) + k.beam(6, 32, 54, 32, 3.4) + `<path d="M44 29.5h12l6 2.5-6 2.5H44z" fill="url(#${k.id}mt)"/>` + k.burst(62, 32, 5, 6, .3),
  // Magnetize: a great magnet dragging monsters in
  k => `<path d="M14 6V30a18 18 0 0 0 36 0V6H40V30a8 8 0 0 1-16 0V6z" fill="#d8303a"/><path d="M14 6V30a18 18 0 0 0 9 15.6" fill="none" stroke="#ff8a90" stroke-width="2" opacity=".7"/><rect x="14" y="4" width="10" height="9" fill="url(#${k.id}mt)"/><rect x="40" y="4" width="10" height="9" fill="url(#${k.id}mt)"/>` + `<path d="M8 10C2 20 4 34 10 40M56 10C62 20 60 34 54 40" fill="none" stroke="${k.L}" stroke-width="1.6" stroke-dasharray="3 3"/>` + k.foe(14, 56, .5) + k.foe(50, 56, .5) + `<path d="M20 54l6-4M44 54l-6-4" stroke="${k.L}" stroke-width="1.8" stroke-linecap="round"/>`,
  // Caltrops: a field of steel caltrops
  k => k.ground(54, 30, .5) + [[14, 46, 1.4], [34, 52, 1.6], [52, 42, 1.3], [26, 30, 1.1], [44, 26, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -10L2 0H-2z" fill="url(#${k.id}mt)"/><path d="M-9 6L-1 -1 1 2z" fill="url(#${k.id}mt)"/><path d="M9 6L1 -1-1 2z" fill="#7d8496"/><path d="M0 2L2 0-2 0z" fill="#3a3f4c"/></g>`).join('') + k.sparks([[22, 22, 1], [46, 20, 1]]),
  // Blade Storm: giant swords whirling round the caster
  k => k.ring(32, 34, 26, 26, 1.6, .6) + k.figure(32, 36, 1) + [0, 72, 144, 216, 288].map(a => { const r = a * Math.PI / 180; return k.blade(32 + Math.cos(r) * 20, 34 + Math.sin(r) * 20, 18, a + 180, .8); }).join(''),
];

// ---- Magma ----
const _lava = (k, x, y, r) => k.glow(x, y, r * 1.3, .7) + `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.u('o')}"/><path d="M${x - r * .7} ${y - r * .2}l${r * .5} ${r * .3}l${r * .3} ${-r * .5}M${x + r * .1} ${y + r * .3}l${r * .4} ${r * .3}" stroke="#2a0804" stroke-width="${Math.max(1, r * .2)}" fill="none" stroke-linecap="round" opacity=".75"/>`;
SPELL_ART.magma = [
  // Magma Glob: a heavy glob of magma bouncing before it splashes
  k => `<path d="M6 48Q16 20 28 46Q38 30 46 40" fill="none" stroke="${k.M}" stroke-width="2" stroke-dasharray="3 3" opacity=".7"/>` + `<ellipse cx="50" cy="52" rx="12" ry="3.5" fill="${k.M}" opacity=".7"/>` + _lava(k, 46, 38, 11) + `<path d="M40 48c0 4 1 6 0 8M48 49c1 3 0 5 1 7" stroke="${k.M}" stroke-width="2.4" stroke-linecap="round"/>`,
  // Eruption: the ground cracks and a geyser of lava erupts
  k => `<ellipse cx="32" cy="56" rx="22" ry="5" fill="#2a1008"/>` + k.glow(32, 54, 14, .8) + k.flame(32, 58, 18, 46) + k.flame(24, 58, 9, 24, -4, .9) + k.flame(40, 58, 9, 24, 4, .9) + _lava(k, 14, 18, 4) + _lava(k, 50, 12, 3.5) + _lava(k, 52, 30, 3),
  // Heat Wave: a rolling wall of shimmering heat
  k => [10, 20, 30, 40, 50].map((x, i) => `<path d="M${x} 58c-5-8 5-12 0-20s5-12 0-20" fill="none" stroke="${i % 2 ? k.L : k.M}" stroke-width="${4 - Math.abs(2 - i) * .6}" stroke-linecap="round" opacity="${.9 - Math.abs(2 - i) * .15}"/>`).join('') + `<path d="M4 58c-2-4 2-6 0-10" fill="none" stroke="${k.M}" stroke-width="2" opacity=".5"/>` + k.glow(32, 38, 22, .35) + `<path d="M56 30l6 6-6 6" fill="none" stroke="${k.L}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Volcano: a small volcano lobbing magma bombs
  k => `<path d="M4 60L24 24h16l20 36z" fill="url(#${k.id}rk)"/><path d="M24 24h16l-4 8-4-4-4 6-4-6z" fill="${k.M}"/><path d="M28 28c-2 8-4 14-8 20M36 28c1 6 4 12 8 16" stroke="${k.M}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` + k.glow(32, 20, 10, .8) + k.flame(32, 26, 12, 16) + _lava(k, 14, 10, 4) + _lava(k, 52, 8, 4.5) + `<path d="M28 18Q20 6 14 10M36 18Q46 2 52 8" fill="none" stroke="${k.M}" stroke-width="1.6" stroke-dasharray="2 3"/>`,
  // Meteor: a colossal meteor streaking down
  k => `<g transform="rotate(-140 40 24)">${k.flame(40, 22, 26, 50, 0, .9)}</g>` + k.glow(40, 24, 18, .7) + `<path d="M28 22L34 12L46 10L54 18L52 32L40 36L30 32z" fill="url(#${k.id}rk)"/><path d="M28 22L34 12L46 10L54 18L52 32L40 36L30 32z" fill="${k.M}" opacity=".35"/><path d="M34 18l6 4 2 8M46 16l2 6" stroke="${k.L}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + k.sparks([[10, 54, 1.4], [16, 60, 1], [6, 46, 1]], '#ffd27a'),
];
// ---- Crystal ----
SPELL_ART.crystal = [
  // Prism Shard: a shard that splits into three on impact
  k => k.streak(2, 62, 14, 50, 6, .45) + k.shard(22, 42, 13, 45) + k.burst(34, 30, 5, 6, .35) + k.shard(52, 22, 7, 70, false) + k.shard(46, 12, 7, 30, false) + k.shard(54, 36, 7, 110, false) + `<path d="M38 26l8-4M36 26l6-8M38 30l8 2" stroke="${k.L}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`,
  // Geode Bomb: a geode cracking open, spraying crystal shards
  k => `<path d="M10 40C10 24 20 16 32 16S54 24 54 40C54 50 44 56 32 56S10 50 10 40z" fill="url(#${k.id}rk)"/><path d="M14 34L20 40L26 32L32 40L38 32L44 40L50 34C52 42 46 52 32 52S12 42 14 34z" fill="#2a0a24"/>` + [[20, 42, 7, -15], [28, 40, 9, 0], [36, 40, 9, 8], [44, 42, 7, 20]].map(([x, y, s, r]) => k.shard(x, y, s, r, false)).join('') + k.glow(32, 42, 12, .5) + k.shard(14, 12, 5, -40, false) + k.shard(32, 6, 5, 0, false) + k.shard(50, 12, 5, 40, false),
  // Resonant Crystal: a planted crystal humming with power
  k => k.ground(56, 18) + k.shard(32, 34, 21, 0) + [10, 16].map((r, i) => `<path d="M${32 - r - 8} ${20}a${r + 8} ${r + 12} 0 0 0 0 ${28}M${32 + r + 8} 20a${r + 8} ${r + 12} 0 0 1 0 28" fill="none" stroke="${k.L}" stroke-width="${2 - i * .6}" opacity="${.9 - i * .35}" stroke-linecap="round"/>`).join(''),
  // Crystal Spire: a crystal spire firing at enemies
  k => k.ground(58, 20) + k.shard(28, 36, 22, 0) + k.shard(18, 46, 12, -15, false) + k.shard(38, 48, 10, 15, false) + k.beam(30, 18, 60, 6, 2.4) + k.burst(60, 6, 4, 6, .3),
  // Crystal Tomb: a monster sealed inside a block of crystal
  k => k.glow(32, 34, 24, .4) + k.foe(32, 38, 1.3) + `<path d="M16 58V20L32 6 48 20V58z" fill="${k.M}" opacity=".35"/><path d="M16 20L32 6 48 20 32 28z" fill="${k.W}" opacity=".35"/><path d="M16 58V20L32 6 48 20V58zM16 20L32 28 48 20M32 28V58" fill="none" stroke="${k.W}" stroke-width="1.4" opacity=".8"/><path d="M20 24l4 10" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>` + k.ground(58, 22),
];
// ---- Sonic ----
SPELL_ART.sonic = [
  // Sound Wave: a wave of sound widening as it travels
  k => k.orb(10, 32, 4) + [14, 24, 34, 44].map((r, i) => `<path d="M${10 + r} ${32 - r * .5 - 4}a${r * .5} ${r * .55 + 4} 0 0 1 0 ${r + 8}" fill="none" stroke="${k.M}" stroke-width="${7 - i}" opacity=".35" filter="url(#${k.id}g2)" stroke-linecap="round"/><path d="M${10 + r} ${32 - r * .5 - 4}a${r * .5} ${r * .55 + 4} 0 0 1 0 ${r + 8}" fill="none" stroke="${k.L}" stroke-width="${3 - i * .4}" stroke-linecap="round"/>`).join(''),
  // Sonic Boom: a blast of sound cone erupting forward
  k => `<path d="M8 32L54 6Q64 32 54 58z" fill="${k.u('fd')}"/>` + [24, 36, 48].map((x, i) => `<path d="M${x} ${32 - x * .55}Q${x + 8} 32 ${x} ${32 + x * .55}" fill="none" stroke="${k.L}" stroke-width="${3.4 - i * .6}" stroke-linecap="round"/>`).join('') + k.burst(10, 32, 9, 8, .35) + k.orb(10, 32, 4.5),
  // Implosion: a pocket of silence sucking everything in
  k => k.halo(32, 32, 28) + [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return k.streak(32 + c * 28, 32 + s * 28, 32 + c * 12, 32 + s * 12, 4, .7); }).join('') + `<circle cx="32" cy="32" r="8" fill="#06141a"/>` + k.ring(32, 32, 9, 9, 1.6),
  // Harmonic Link: monsters bound together by a ringing chord
  k => `<path d="M12 46L32 18L52 46Z" fill="none" stroke="${k.M}" stroke-width="5" opacity=".45" filter="url(#${k.id}g2)"/><path d="M12 46L32 18L52 46Z" fill="none" stroke="${k.L}" stroke-width="1.8"/>` + k.foe(12, 48, .7) + k.foe(52, 48, .7) + k.foe(32, 18, .7) + `<g fill="${k.W}" stroke="${k.W}"><ellipse cx="28" cy="40" rx="2.6" ry="2" transform="rotate(-20 28 40)"/><path d="M30.4 39.2V30l6 2v8" fill="none" stroke-width="1.6"/><ellipse cx="34.4" cy="41" rx="2.6" ry="2" transform="rotate(-20 34.4 41)"/></g>`,
  // Bass Drop: a speaker pounding out shockwaves
  k => k.ring(32, 32, 28, 28, 1.4, .5) + k.ring(32, 32, 22, 22, 1.8, .75) + `<circle cx="32" cy="32" r="16" fill="#1a1a24"/><circle cx="32" cy="32" r="16" fill="none" stroke="url(#${k.id}mt)" stroke-width="2.4"/><circle cx="32" cy="32" r="11" fill="url(#${k.id}dk)"/><circle cx="32" cy="32" r="5" fill="${k.u('o')}"/><circle cx="32" cy="32" r="11" fill="none" stroke="${k.L}" stroke-width=".8" opacity=".6"/>`,
];
// ---- Gravity ----
SPELL_ART.gravity = [
  // Graviton: a slow, heavy orb dragging things toward it
  k => k.ring(32, 32, 24, 8, 1.6, .7) + k.glow(32, 32, 16, .7) + `<circle cx="32" cy="32" r="12" fill="#0c0618"/><circle cx="32" cy="32" r="12" fill="none" stroke="${k.L}" stroke-width="2"/><path d="M24 26a9 9 0 0 1 6-4" stroke="${k.W}" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>` + k.streak(4, 10, 14, 18, 4, .6) + k.rock(16, 19, .35) + k.streak(60, 56, 50, 47, 4, .6) + k.rock(48, 46, .3) + k.streak(58, 8, 50, 16, 3, .5),
  // Crush: gravity multiplied, slamming a monster flat
  k => [14, 32, 50].map(x => `<path d="M${x} 4v16" stroke="${k.L}" stroke-width="3" stroke-linecap="round"/><path d="M${x - 6} 14l6 7 6-7" fill="none" stroke="${k.L}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('') + k.glow(32, 28, 20, .4) + `<g transform="translate(32 46) scale(1.5 .55)">${k.foe(0, 0, 1)}</g>` + k.ring(32, 52, 24, 5, 2) + `<path d="M8 56l6-4M56 56l-6-4" stroke="${k.L}" stroke-width="1.6" stroke-linecap="round"/>`,
  // Levitate: monsters lifted helplessly into the air
  k => [[18, 26, .8], [44, 18, .75]].map(([x, y, s]) => k.foe(x, y, s) + k.ring(x, y + 16, 11 * s + 3, 3, 1.4, .8) + k.ring(x, y + 22, 8 * s + 2, 2.4, 1.2, .5)).join('') + `<path d="M30 50V36M26 40l4-4 4 4" fill="none" stroke="${k.L}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>` + k.ground(58, 22, .4),
  // Repulsor: everything blasted away, shots flung back
  k => k.halo(32, 32, 30) + k.ring(32, 32, 20, 20, 2.2) + k.orb(32, 32, 7) + [0, 90, 180, 270].map(a => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return k.streak(32 + c * 14, 32 + s * 14, 32 + c * 29, 32 + s * 29, 5, .8); }).join('') + k.foe(54, 10, .45) + k.foe(10, 54, .45),
  // Singularity: a black hole devouring everything near it
  k => k.halo(32, 32, 30) + `<ellipse cx="32" cy="32" rx="28" ry="9" fill="none" stroke="${k.M}" stroke-width="6" opacity=".5" filter="url(#${k.id}g2)" transform="rotate(-18 32 32)"/><ellipse cx="32" cy="32" rx="28" ry="9" fill="none" stroke="${k.W}" stroke-width="2" transform="rotate(-18 32 32)"/>` + k.spiral(32, 32, 18, 1.6, 1.4, .8) + `<circle cx="32" cy="32" r="9" fill="#000"/><circle cx="32" cy="32" r="9" fill="none" stroke="${k.W}" stroke-width="1.6"/>` + `<path d="M8 36a28 9 0 0 0 48 -12" fill="none" stroke="${k.W}" stroke-width="2" transform="rotate(-18 32 32)" opacity=".9"/>`,
];
// ---- Chrono ----
const _clock = (k, x, y, r, h1 = -60, h2 = 30) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.u('o')}"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${k.u('gd')}" stroke-width="${r * .14}"/>` + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a); return `<line x1="${x + c * r * .72}" y1="${y + s * r * .72}" x2="${x + c * r * .86}" y2="${y + s * r * .86}" stroke="#5a3a08" stroke-width="${i % 3 ? r * .05 : r * .1}"/>`; }).join('') + `<path d="M${x} ${y}L${x + Math.cos(h1 * Math.PI / 180) * r * .5} ${y + Math.sin(h1 * Math.PI / 180) * r * .5}M${x} ${y}L${x + Math.cos(h2 * Math.PI / 180) * r * .72} ${y + Math.sin(h2 * Math.PI / 180) * r * .72}" stroke="#3a2004" stroke-width="${r * .1}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${r * .1}" fill="#3a2004"/>`;
SPELL_ART.chrono = [
  // Chrono Bolt: a bolt of frozen time with its echo following behind
  k => `<g opacity=".35">${_clock(k, 22, 42, 9)}</g>` + k.streak(2, 62, 34, 30, 12, .5) + k.glow(42, 22, 14, .6) + _clock(k, 42, 22, 12) + k.sparks([[56, 40, 1.2], [28, 14, 1]]),
  // Stasis: a monster frozen inside a ring of stopped time
  k => k.glow(32, 32, 26, .4) + `<g opacity=".75" filter="saturate(0)">${k.foe(32, 34, 1.4, '#ffe0a0')}</g>` + k.ring(32, 32, 24, 24, 2.4) + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${32 + Math.cos(a) * 20}" y1="${32 + Math.sin(a) * 20}" x2="${32 + Math.cos(a) * 24}" y2="${32 + Math.sin(a) * 24}" stroke="${k.W}" stroke-width="${i % 3 ? 1 : 2}"/>`; }).join('') + `<rect x="25" y="4" width="5" height="10" rx="1" fill="${k.W}"/><rect x="34" y="4" width="5" height="10" rx="1" fill="${k.W}"/>`,
  // Rewind: monsters dragged back to where they stood
  k => `<g opacity=".3">${k.foe(16, 40, .9)}</g><g opacity=".55">${k.foe(28, 40, .9)}</g>` + k.foe(44, 40, .9) + `<path d="M50 20A20 20 0 1 0 54 44" fill="none" stroke="${k.M}" stroke-width="7" opacity=".4" filter="url(#${k.id}g2)"/><path d="M50 20A20 20 0 1 0 54 44" fill="none" stroke="${k.L}" stroke-width="2.6" stroke-linecap="round"/><path d="M50 20l-2-8M50 20l-8 1" stroke="${k.L}" stroke-width="2.6" stroke-linecap="round"/>`,
  // Slow Field: a dome of sluggish time with an hourglass at its heart
  k => `<path d="M4 56A28 28 0 0 1 60 56z" fill="${k.u('fd')}"/><path d="M4 56A28 28 0 0 1 60 56" fill="none" stroke="${k.L}" stroke-width="1.6" stroke-dasharray="4 3"/>` + `<rect x="21" y="12" width="22" height="4" rx="1.5" fill="url(#${k.id}gd)"/><rect x="21" y="48" width="22" height="4" rx="1.5" fill="url(#${k.id}gd)"/><path d="M24 16C24 28 40 28 40 32S24 36 24 48H40C40 36 24 36 24 32S40 28 40 16z" fill="${k.W}" opacity=".35"/><path d="M24 16C24 28 40 28 40 32S24 36 24 48M40 16C40 28 24 28 24 32S40 36 40 48" fill="none" stroke="${k.W}" stroke-width="1.4"/><path d="M27 21h10L32 28zM26 47c0-4 3-6 6-8 3 2 6 4 6 8z" fill="${k.M}"/><path d="M32 28v12" stroke="${k.M}" stroke-width="1"/>`,
  // Time Stop: a great clock cracked and frozen
  k => k.halo(32, 32, 31) + _clock(k, 32, 32, 24, -90, -90) + `<path d="M32 8l-3 10 5 6-4 8M52 22l-8 4-2 6M18 52l6-8 6 2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" opacity=".9"/>` + k.twinkle(8, 10, 3) + k.twinkle(56, 54, 3),
];

// ---- Blood ----
SPELL_ART.blood = [
  // Blood Bolt: a fast bolt of blood magic
  k => k.streak(2, 62, 30, 34, 12, .5) + k.drop(40, 24, 1.1, 45) + k.sparks([[14, 40, 1.4], [24, 54, 1.1], [10, 52, .9]], k.M),
  // Crimson Fan: five blood blades fanning out
  k => k.glow(10, 54, 12, .5) + [-62, -38, -14, 10, 34].map(r => `<g transform="translate(10 54) rotate(${r})"><path d="M0 -10C10 -22 12 -38 4 -50 18 -40 20 -22 6 -8z" fill="${k.u('v')}"/><path d="M2 -14C9 -24 11 -36 6 -46" fill="none" stroke="${k.W}" stroke-width="1" opacity=".7"/></g>`).join('') + k.drop(56, 14, .3, 30) + k.drop(48, 6, .25, 20),
  // Exsanguinate: a bleeding monster ripped open, its blood erupting out
  k => k.halo(32, 40, 26) + k.foe(32, 46, 1.2) + k.burst(32, 34, 10, 7, .4) + [[-50, 18, 14], [-20, 26, 6], [20, 38, 6], [50, 46, 14]].map(([r, x, y]) => k.streak(32, 34, x, y, 5, .8) + k.drop(x, y, .4, r)).join('') + k.sparks([[14, 30, 1.4], [50, 30, 1.4], [32, 6, 1.6]], k.L),
  // Crimson Mire: a pool of blood dragging monsters into its swirl
  k => `<ellipse cx="32" cy="44" rx="28" ry="12" fill="${k.u('dk')}"/><ellipse cx="32" cy="44" rx="26" ry="10.5" fill="${k.u('fd')}"/>` + k.ring(32, 44, 18, 7, 1.6, .8) + k.ring(32, 44, 9, 3.5, 1.4, .9) + k.foe(10, 32, .55) + k.foe(54, 32, .55) + `<path d="M16 38q6 4 10 4M48 38q-6 4-10 4" stroke="${k.L}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + k.drop(26, 22, .35) + k.drop(38, 18, .3, 15) + k.drop(32, 28, .25),
  // Blood Moon: a blood moon rising in its halo, draining everything below it
  k => k.halo(32, 22, 30) + k.orb(32, 22, 16, false) + `<circle cx="26" cy="18" r="3" fill="${k.D}" opacity=".5"/><circle cx="38" cy="26" r="4" fill="${k.D}" opacity=".45"/><circle cx="34" cy="14" r="2" fill="${k.D}" opacity=".5"/>` + k.foe(12, 56, .55) + k.foe(52, 56, .55) + k.foe(32, 60, .45) + [[14, 44, -20], [50, 44, 20], [22, 50, -10], [42, 50, 10], [32, 46, 0]].map(([x, y, r]) => k.drop(x, y, .28, r)).join(''),
];
// ---- Spirit ----
const _wisp = (k, x, y, s = 1, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${k.flame(0, 10, 14, 26, 0, .95)}<circle cx="-2.5" cy="2" r="1.6" fill="#0a2a20"/><circle cx="2.5" cy="2" r="1.6" fill="#0a2a20"/></g>`;
SPELL_ART.spirit = [
  // Soul Wisps: spirit wisps hunting enemies on their own
  k => _wisp(k, 20, 30, 1.1, -30) + _wisp(k, 44, 18, .9, -20) + _wisp(k, 42, 46, .8, -40) + k.sparks([[10, 52, 1.2], [54, 30, 1], [30, 56, .9]]),
  // Command: pointing out a target for every spirit to lunge at
  k => k.ring(44, 42, 13, 13, 1.8) + `<path d="M44 26v6M44 52v6M28 42h6M54 42h6" stroke="${k.L}" stroke-width="2" stroke-linecap="round"/>` + k.foe(44, 42, .8) + `<g transform="translate(16 18) rotate(-45)">${k.hand(0, 0, 1.1)}</g>` + _wisp(k, 12, 52, .5, 40) + _wisp(k, 56, 12, .5, 220),
  // Banshee: a wailing banshee, her shriek terrifying everything near
  k => k.glow(32, 30, 20, .45) + `<path d="M18 58C16 44 16 30 20 22 22 12 28 8 32 8S42 12 44 22C48 30 48 44 46 58L41 54 37 58 32 54 27 58 23 54z" fill="${k.u('v')}" opacity=".9"/><path d="M20 22C18 30 14 38 10 44M44 22C46 30 50 38 54 44" fill="none" stroke="${k.L}" stroke-width="2" opacity=".7"/><ellipse cx="28" cy="22" rx="2" ry="2.6" fill="#0a2a20"/><ellipse cx="36" cy="22" rx="2" ry="2.6" fill="#0a2a20"/><ellipse cx="32" cy="31" rx="3" ry="5" fill="#0a2a20"/>` + `<path d="M8 20a14 14 0 0 0 0 18M4 16a20 20 0 0 0 0 26M56 20a14 14 0 0 1 0 18M60 16a20 20 0 0 1 0 26" fill="none" stroke="${k.L}" stroke-width="1.8" stroke-linecap="round"/>`,
  // Spirit Wolf: a spectral wolf on the hunt
  k => k.glow(32, 32, 22, .45) + `<path d="M14 8L22 22H42L50 8 54 28C54 42 44 54 32 58 20 54 10 42 10 28z" fill="${k.u('v')}"/><path d="M18 14l4 8M46 14l-4 8" stroke="${k.D}" stroke-width="1.4"/><path d="M20 32l7 2-2 3zM44 32l-7 2 2 3z" fill="#fff"/>` + k.glow(24, 34, 3, .9, k.W) + k.glow(40, 34, 3, .9, k.W) + `<path d="M28 46l4 4 4-4z" fill="#0a2a20"/><path d="M26 52l3-2M38 52l-3-2M32 50v4" stroke="${k.D}" stroke-width="1.2"/>`,
  // Army of the Dead: spectral knights rising to fight
  k => k.ground(58, 30, .5) + [[14, 40, .8], [50, 40, .8], [32, 36, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})">${k.glow(0, 0, 12, .4)}<path d="M-8 22V6c0-8 4-12 8-12s8 4 8 12v16z" fill="${k.u('v')}" opacity=".85"/><path d="M-6 0h12v-4c0-4-3-6-6-6s-6 2-6 6z" fill="url(#${k.id}mt)"/><path d="M-4 -2h8" stroke="#0a2a20" stroke-width="1.4"/></g>`).join('') + k.blade(22, 28, 22, 20, .55, false) + k.blade(42, 28, 22, -20, .55, false),
];
// ---- Cosmic ----
SPELL_ART.cosmic = [
  // Star Shot: shooting stars streaking forward
  k => k.streak(2, 62, 34, 30, 14, .45) + k.star(40, 24, 13) + k.streak(30, 60, 46, 46, 5, .4) + k.star(50, 42, 5) + k.twinkle(14, 14, 2.6) + k.twinkle(56, 8, 2),
  // Orbiting Moons: three moons circling the caster
  k => k.ring(32, 36, 26, 10, 1.4, .7) + k.figure(32, 36, 1) + k.moon(8, 34, 5) + k.moon(52, 28, 5) + k.moon(36, 48, 5) + k.twinkle(12, 10, 2.4) + k.twinkle(54, 8, 2),
  // Constellation: stars linked by beams of starlight
  k => k.beam(12, 48, 26, 14, 2, .9) + k.beam(26, 14, 52, 30, 2, .9) + k.beam(52, 30, 12, 48, 2, .9) + k.foe(30, 34, .55) + k.star(12, 48, 7) + k.star(26, 14, 7) + k.star(52, 30, 7) + k.twinkle(48, 8, 2) + k.twinkle(8, 22, 1.8),
  // Meteor Shower: shooting stars raining down on an area
  k => [[16, 32, 5], [30, 44, 6], [44, 30, 5], [52, 50, 4], [26, 20, 3.5]].map(([x, y, r]) => k.streak(x - 14, y - 22, x, y, r * 1.4, .5) + k.star(x, y, r)).join('') + k.ring(32, 56, 24, 4, 1.6, .7),
  // Supernova: a star swelling, then exploding
  k => k.halo(32, 32, 32) + k.ring(32, 32, 26, 26, 2, .7) + k.burst(32, 32, 24, 12, .3) + k.burst(32, 32, 14, 8, .4, 22) + `<circle cx="32" cy="32" r="6" fill="#fff"/>` + k.twinkle(8, 8, 3) + k.twinkle(58, 56, 2.6),
];
// ---- Explosion ----
const _boom = (k, x, y, r) => k.glow(x, y, r * 1.2, .8) + `<path d="${Array.from({ length: 9 }, (_, i) => { const a = i * Math.PI * 2 / 9, rr = r * (i % 2 ? .75 : 1); return `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`; }).join('')}Z" fill="${k.M}"/><circle cx="${x}" cy="${y}" r="${r * .55}" fill="${k.L}"/><circle cx="${x}" cy="${y}" r="${r * .28}" fill="#fff"/>`;
SPELL_ART.explosion = [
  // Grenade: a bouncing grenade, fuse fizzing
  k => `<path d="M6 54Q14 30 24 50T44 40" fill="none" stroke="${k.L}" stroke-width="1.6" stroke-dasharray="3 3" opacity=".7"/>` + `<g transform="translate(40 30) rotate(20)"><ellipse cx="0" cy="4" rx="10" ry="12" fill="#3a4a2a"/><path d="M-10 0h20M-10 8h20M-4 -8v24M4 -8v24" stroke="#1e2a14" stroke-width="1.2"/><ellipse cx="-3" cy="-1" rx="3" ry="4" fill="#fff" opacity=".2"/><rect x="-4" y="-12" width="8" height="5" fill="url(#${k.id}mt)"/><path d="M4 -10q8-2 6 6" fill="none" stroke="url(#${k.id}mt)" stroke-width="1.6"/></g>` + k.burst(38, 14, 5, 8, .3),
  // Sticky Bomb: a bomb clinging to a monster, about to blow
  k => k.foe(30, 40, 1.4) + `<path d="M28 34c-4 2-8 6-6 10M40 34c4 2 6 6 4 10" stroke="#9aff3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>` + k.bomb(34, 30, 10) + `<path d="M34 19q4-6 10-4" fill="none" stroke="#8a6a4a" stroke-width="1.6"/>` + k.burst(45, 15, 5, 8, .3) + k.glow(34, 30, 3, 1, '#ff3a3a') + `<circle cx="34" cy="30" r="1.8" fill="#ff5a5a"/>`,
  // Rocket Jump: blasting the ground to launch skyward
  k => _boom(k, 30, 52, 14) + k.smoke(14, 54, .8, '#5a4a40') + k.smoke(48, 54, .8, '#5a4a40') + k.streak(30, 44, 36, 22, 6, .6) + k.figure(38, 16, .9) + `<path d="M28 10l4-4M46 10l-4-4" stroke="${k.L}" stroke-width="1.8" stroke-linecap="round"/>`,
  // Proximity Mines: mines tossed ahead, each blinking, waiting for a step
  k => [[16, 46], [34, 52], [50, 40], [28, 32]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 2}" rx="8" ry="3" fill="#000" opacity=".35"/><ellipse cx="${x}" cy="${y}" rx="7" ry="3.5" fill="url(#${k.id}mt)"/><ellipse cx="${x}" cy="${y - 1.5}" rx="4" ry="1.8" fill="#4a4e5e"/>` + k.glow(x, y - 2, 3, .9, '#ff3a3a') + `<circle cx="${x}" cy="${y - 2}" r="1.3" fill="#ff7a6a"/>`).join('') + `<ellipse cx="34" cy="52" rx="16" ry="6" fill="none" stroke="#ff5a4a" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>`,
  // Carpet Bomb: a line of bombs raining down, blasts marching across the ground
  k => [[10, 8], [24, 14], [38, 20], [52, 26]].map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="3" ry="5" fill="#2a2a34"/><path d="M-3 -5l-2-3h10l-2 3" fill="#4a4e5e"/></g>`).join('') + _boom(k, 14, 52, 9) + _boom(k, 32, 50, 11) + _boom(k, 50, 54, 7) + k.ground(60, 30, .5),
];
// ---- Illusion ----
const _moth = (k, x, y, s = 1, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}">${k.glow(0, 0, 12, .5)}<path d="M0 -2C-6 -14 -18 -12 -16 -2-14 4 -6 2 0 0z" fill="${k.u('v')}"/><path d="M0 -2C6 -14 18 -12 16 -2 14 4 6 2 0 0z" fill="${k.u('v')}"/><path d="M0 1C-4 4 -12 8 -10 12-6 14 -2 8 0 4zM0 1C4 4 12 8 10 12 6 14 2 8 0 4z" fill="${k.M}"/><circle cx="-9" cy="-6" r="2.4" fill="${k.W}"/><circle cx="9" cy="-6" r="2.4" fill="${k.W}"/><ellipse cx="0" cy="2" rx="1.6" ry="7" fill="#3a1a4a"/><path d="M0 -5l-3-5M0 -5l3-5" stroke="#3a1a4a" stroke-width=".8"/></g>`;
SPELL_ART.illusion = [
  // Phantom Moths: a glowing moth flanked by two phantoms
  k => _moth(k, 14, 46, .7, .45) + _moth(k, 50, 46, .7, .45) + _moth(k, 32, 26, 1.2),
  // Decoy: a phantom double conjured to draw the monsters
  k => k.figure(18, 38, 1.4) + `<g opacity=".55">${k.figure(44, 38, 1.4, k.W, k.M)}</g>` + k.glow(44, 38, 14, .4) + `<path d="M36 22l2-6M52 22l-2-6M44 20v-6" stroke="${k.L}" stroke-width="1.6" stroke-linecap="round"/>` + k.foe(56, 58, .45) + k.foe(32, 60, .4),
  // Mesmerize: a hypnotic pulse charming the monsters
  k => k.eye(32, 26, 1.1) + `<g transform="translate(32 26)"><circle r="8" fill="${k.u('o')}"/></g>` + k.spiral(32, 26, 7, 2.2, 1.2) + k.foe(14, 52, .6) + k.foe(50, 52, .6) + `<path d="M12 42c-1-2 1-3 2-1 1-2 3-1 2 1l-2 2z" fill="#ff7ab0"/><path d="M48 42c-1-2 1-3 2-1 1-2 3-1 2 1l-2 2z" fill="#ff7ab0"/>`,
  // Kaleidoscope: a prism shard splintering a monster into glittering copies
  k => k.foe(32, 40, 1.1) + `<g opacity=".5">${k.foe(14, 30, .8)}${k.foe(50, 30, .8)}</g>` + k.shard(32, 16, 8, 0) + [0, 60, 120, 180, 240, 300].map(a => `<path d="M32 40L${32 + Math.cos(a * Math.PI / 180) * 26} ${40 + Math.sin(a * Math.PI / 180) * 20}" stroke="${k.L}" stroke-width="1" opacity=".5"/>`).join('') + k.twinkle(10, 52, 2.6) + k.twinkle(54, 52, 2.6) + k.twinkle(32, 60, 2),
  // Phantasmagoria: a hall of mirrors full of phantom monsters
  k => [[8, -10], [32, 0], [56, 10]].map(([x, r]) => `<g transform="rotate(${r} ${x} 34)"><rect x="${x - 9}" y="10" width="18" height="44" rx="9" fill="${k.M}" opacity=".25"/><rect x="${x - 9}" y="10" width="18" height="44" rx="9" fill="none" stroke="url(#${k.id}gd)" stroke-width="2.4"/><path d="M${x - 5} 18l4 -4" stroke="#fff" stroke-width="1.4" opacity=".7"/><g opacity="${x === 32 ? 1 : .55}">${k.foe(x, 36, .65)}</g></g>`).join('') + k.twinkle(20, 8, 2.4) + k.twinkle(44, 60, 2.4),
];

// ---- Bone ----
const _ghost = '#7affb0'; // the green soulfire burning in bone magic
SPELL_ART.bone = [
  // Bone Toss: a spinning bone that pierces through enemies
  k => `<path d="M12 46a22 22 0 0 1 4-24M52 20a22 22 0 0 1-4 24" fill="none" stroke="${k.L}" stroke-width="2" stroke-linecap="round" opacity=".7"/>` + k.bone(18, 42, 46, 22, 6) + k.streak(2, 60, 14, 48, 6, .4),
  // Cackling Skull: a burning skull leaping from one enemy to the next
  k => `<g transform="rotate(-130 36 26)">${k.flame(36, 26, 22, 40, 0, .85).replace(new RegExp(k.id + 'f', 'g'), k.id + 'f')}</g>`.replace(/url\(#[^)]*f[omi]\)/g, m => m) + k.glow(36, 26, 14, .6, _ghost) + k.skull(36, 26, 1.05, _ghost) + `<path d="M24 14l-3-4M30 10l-1-5M38 10l1-5" stroke="${_ghost}" stroke-width="2" stroke-linecap="round"/>` + k.foe(10, 54, .5),
  // Marrow Burst: skeletons exploding in a storm of bone shrapnel
  k => k.burst(32, 34, 14, 10, .35) + [[10, 12, 18, 20], [46, 10, 54, 18], [6, 44, 14, 40], [50, 46, 58, 52], [28, 6, 34, 10], [30, 56, 38, 60]].map(([a, b, c, d]) => k.bone(a, b, c, d, 3)).join('') + k.skull(32, 34, .6, _ghost),
  // Bone Cage: ribs of bone bursting from the ground to cage a monster
  k => k.ground(58, 26) + k.foe(32, 42, 1) + [[10, -1], [18, -1], [26, -1], [38, 1], [46, 1], [54, 1]].map(([x, s]) => `<path d="M${x} 58C${x} 40 ${x + s * -2} 24 ${32 + (x - 32) * .15} 12" fill="none" stroke="#7a6a4a" stroke-width="4.4" stroke-linecap="round"/><path d="M${x} 58C${x} 40 ${x + s * -2} 24 ${32 + (x - 32) * .15} 12" fill="none" stroke="url(#${k.id}bn)" stroke-width="3" stroke-linecap="round"/>`).join('') + `<path d="M8 30h48" stroke="url(#${k.id}bn)" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,
  // Bone Dragon: a skeletal dragon raised from the dead
  k => `<path d="M30 30L6 12 10 26 2 28 12 34z" fill="url(#${k.id}bn)" opacity=".85"/><path d="M34 30L58 12 54 26 62 28 52 34z" fill="url(#${k.id}bn)" opacity=".85"/><path d="M8 14L28 30M56 14L36 30" stroke="#6a5a3a" stroke-width="1.2"/>` + `<g transform="translate(32 34)"><path d="M-10 -8L-16 -20-6 -12M10 -8L16 -20 6 -12" fill="url(#${k.id}bn)"/><path d="M-11 -6C-11 -14 11 -14 11 -6L9 8 4 22H-4L-9 8z" fill="url(#${k.id}bn)"/><path d="M-6 -2l4 2-4 2zM6 -2l-4 2 4 2z" fill="#1a1012"/>${k.glow(-4, 0, 2.6, 1, _ghost)}${k.glow(4, 0, 2.6, 1, _ghost)}<path d="M-4 12v8M0 12v9M4 12v8" stroke="#5a4a3a" stroke-width="1"/></g>`,
];
// ---- Rune ----
const _glyph = (k, x, y, r, sy = 1) => `<g transform="translate(${x} ${y}) scale(1 ${sy})">${k.glow(0, 0, r, .5)}<circle r="${r}" fill="none" stroke="${k.L}" stroke-width="2"/><circle r="${r * .78}" fill="none" stroke="${k.M}" stroke-width="1" stroke-dasharray="2 2"/><path d="M0 ${-r * .6}L${r * .52} ${r * .3}H${-r * .52}Z" fill="none" stroke="${k.W}" stroke-width="1.6"/><circle r="${r * .14}" fill="${k.W}"/></g>`;
SPELL_ART.rune = [
  // Rune Bolt: a spinning rune piercing through an enemy
  k => k.streak(2, 62, 28, 36, 14, .45) + `<g transform="translate(38 26) rotate(20)">${k.glow(0, 0, 12, .6)}<path d="M0 -13L11 0 0 13-11 0z" fill="${k.u('o')}"/><path d="M0 -7v14M-4 -3l8 6" stroke="#0a3a2c" stroke-width="2" stroke-linecap="round"/></g>` + `<path d="M52 12a14 14 0 0 1 4 10M22 40a14 14 0 0 1-4-10" fill="none" stroke="${k.L}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
  // Glyph Trap: a ward glyph inscribed on the floor, armed and waiting
  k => _glyph(k, 32, 42, 22, .42) + k.foe(52, 22, .55) + `<path d="M14 34v-10M32 30v-14M50 34v-10" stroke="${k.L}" stroke-width="1.4" stroke-dasharray="2 3" opacity=".7"/>` + k.twinkle(32, 14, 2.6),
  // Sigilfall: a sigil ward that calls rune stones crashing down
  k => _glyph(k, 32, 50, 22, .38) + [[18, 14, -10], [32, 6, 0], [46, 16, 12]].map(([x, y, r]) => k.streak(x, y - 10, x, y + 10, 5, .5) + `<g transform="translate(${x} ${y + 14}) rotate(${r})"><rect x="-5" y="-6" width="10" height="12" rx="2" fill="url(#${k.id}rk)"/><path d="M0 -3v6M-2 -1l4 2" stroke="${k.L}" stroke-width="1.4" stroke-linecap="round"/></g>`).join(''),
  // Binding Circle: a great binding circle chaining a monster in place
  k => _glyph(k, 32, 48, 26, .4) + k.foe(32, 34, 1.2) + [[10, 44, 26, 34], [54, 44, 38, 34], [32, 60, 32, 44]].map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${k.L}" stroke-width="2.4" stroke-dasharray="3 1.5"/>`).join('') + k.ring(32, 32, 12, 4, 1.6),
  // Word of Ruin: the word of ruin rising from an ancient tome
  k => k.halo(32, 22, 26) + `<path d="M4 46C14 40 24 42 32 48 40 42 50 40 60 46V58C50 52 40 54 32 60 24 54 14 52 4 58z" fill="#5a3a24"/><path d="M8 44C16 40 24 42 32 47V56C24 51 16 50 8 54zM56 44C48 40 40 42 32 47V56C40 51 48 50 56 54z" fill="#f0e2c0"/><path d="M12 47l14 3M12 50l12 2M38 50l14-3M40 53l12-2" stroke="#8a7050" stroke-width=".8"/>` + `<g transform="translate(32 22)">${k.glow(0, 0, 12, .7)}<path d="M-12 -6l6 12 6-12 6 12 6-12" fill="none" stroke="${k.W}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>` + k.sparks([[18, 34, 1.2], [46, 32, 1.2], [26, 8, 1], [40, 6, 1]]),
];
// ---- Plasma ----
SPELL_ART.plasma = [
  // Plasma Bolt: superheated bolts splashing on impact
  k => k.streak(2, 62, 24, 40, 10, .45) + k.orb(30, 34, 8) + k.ring(30, 34, 12, 4, 1.4, .8) + k.burst(52, 14, 9, 10, .35) + k.streak(36, 30, 46, 20, 4, .5),
  // Plasma Cannon: a sphere of plasma charging, ready to fire
  k => `<path d="M6 20L20 28M6 44L20 36" stroke="url(#${k.id}mt)" stroke-width="5" stroke-linecap="round"/>` + k.bolt([[18, 28], [26, 24], [30, 30]], 1) + k.bolt([[18, 36], [24, 40], [30, 34]], 1) + k.orb(36, 32, 15) + `<circle cx="36" cy="32" r="6" fill="#fff" opacity=".7"/>` + k.sparks([[56, 14, 1.2], [58, 48, 1], [50, 56, 1]]),
  // Vent: all the stored heat dumped in a shockwave
  k => k.halo(32, 36, 30) + k.ring(32, 38, 28, 10, 2, .6) + k.ring(32, 38, 18, 6, 2.4, .9) + k.figure(32, 34, 1.1) + [14, 26, 38, 50].map(x => `<path d="M${x} 24c-3-4 3-6 0-10s3-6 0-10" fill="none" stroke="${k.L}" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>`).join(''),
  // Thermal Lance: a thin white-hot lance thrust straight ahead
  k => k.figure(8, 40, .7) + k.beam(14, 34, 62, 26, 2.6) + k.glow(56, 27, 8, .7) + k.foe(48, 40, .6) + k.foe(32, 44, .55) + k.burst(62, 26, 4, 6, .3),
  // Fusion Beam: a colossal beam of plasma pouring out
  k => k.glow(32, 32, 24, .45) + `<path d="M10 26L64 14V50L10 38z" fill="${k.u('fd')}"/>` + k.beam(10, 32, 64, 32, 12) + k.orb(10, 32, 9) + k.bolt([[20, 22], [30, 14], [38, 18]], 1) + k.bolt([[22, 42], [32, 50], [40, 46]], 1),
];
// ---- Soul ----
SPELL_ART.soul = [
  // Soulfire: bolts of pale soulfire
  k => `<g transform="rotate(-135 40 24)">${k.flame(40, 22, 20, 38, 0, .85)}</g>` + k.orb(40, 24, 9) + `<g transform="rotate(-135 18 46)">${k.flame(18, 44, 10, 18, 0, .7)}</g>` + k.orb(18, 46, 4.5, false),
  // Reap: a spectral scythe sweeping through everything in front
  k => `<path d="M6 46A30 30 0 0 1 56 20" fill="none" stroke="${k.M}" stroke-width="10" opacity=".35" filter="url(#${k.id}g2)"/><path d="M6 46A30 30 0 0 1 56 20" fill="none" stroke="${k.L}" stroke-width="1.6" stroke-dasharray="4 3"/>` + `<path d="M20 60L44 12" stroke="#5a4a5a" stroke-width="3.4" stroke-linecap="round"/><path d="M44 12C52 12 60 18 62 28 54 22 46 20 40 22z" fill="${k.u('v')}"/><path d="M44 13C52 14 58 19 60 25" fill="none" stroke="#fff" stroke-width="1" opacity=".8"/>`,
  // Soul Rend: a ghostly hand ripping the soul out of a monster
  k => k.foe(18, 44, 1.2) + `<path d="M24 40C30 34 34 30 40 26" stroke="${k.L}" stroke-width="2" stroke-dasharray="2 2"/>` + _wisp(k, 40, 24, .8, 30) + `<g transform="translate(50 20) rotate(-150)" opacity=".9">${k.hand(0, 0, 1.15)}</g>`,
  // Soulstorm: shrieking soul missiles hunting enemies down
  k => k.spiral(32, 32, 24, 1.4, 1.6, .5) + [[14, 18, -60], [48, 14, 30], [52, 44, 120], [18, 50, 210]].map(([x, y, r]) => _wisp(k, x, y, .6, r)).join('') + k.orb(32, 32, 5),
  // The Reaper: the Reaper summoned to harvest souls
  k => k.glow(28, 30, 22, .45) + `<path d="M10 60L14 30C14 18 20 8 28 8S42 18 42 30L46 60z" fill="url(#${k.id}dk)"/><path d="M18 30C18 20 22 14 28 14S38 20 38 30z" fill="#06060c"/>` + k.glow(24, 24, 2.4, 1, k.L) + k.glow(32, 24, 2.4, 1, k.L) + `<circle cx="24" cy="24" r="1.4" fill="#fff"/><circle cx="32" cy="24" r="1.4" fill="#fff"/><path d="M52 62L52 4" stroke="#5a4a5a" stroke-width="3" stroke-linecap="round"/><path d="M52 6C44 4 34 8 30 16 38 12 46 12 52 14z" fill="url(#${k.id}mt)"/>`,
];
// ---- Abyss ----
SPELL_ART.abyss = [
  // Void Bolt: a bolt of black water bursting on impact
  k => k.streak(2, 62, 28, 36, 12, .5, k.D) + k.glow(36, 28, 14, .6) + `<circle cx="36" cy="28" r="10" fill="#05040e"/><circle cx="36" cy="28" r="10" fill="none" stroke="${k.L}" stroke-width="2"/>` + k.drop(52, 14, .4, 40) + k.drop(54, 34, .35, 100) + k.drop(44, 8, .3, 10),
  // Grasp of the Deep: a great tentacle erupting to seize a monster
  k => `<ellipse cx="30" cy="56" rx="22" ry="5" fill="#05040e"/>` + k.glow(30, 56, 16, .45) + k.tentacle('M22 58C16 40 26 30 36 30S50 20 44 10', 9) + k.foe(46, 20, .7) + k.tentacle('M38 58C40 50 46 46 52 46', 4),
  // Maw of the Deep: a maw hidden in the floor snapping shut on its prey
  k => k.glow(32, 40, 22, .45) + `<ellipse cx="32" cy="42" rx="28" ry="14" fill="#140a1e"/><ellipse cx="32" cy="42" rx="20" ry="9" fill="#05030a"/>` + `<path d="M12 38l4 6 4-7 4 8 4-8 4 8 4-8 4 8 4-7 4 6M12 46l4-5 4 6 4-7 4 7 4-7 4 7 4-7 4 6 4-5" fill="none" stroke="#f0eadc" stroke-width="2" stroke-linejoin="round"/>` + k.ring(32, 42, 28, 14, 1.6, .8) + k.foe(32, 18, .7),
  // Tentacle Ring: eight tentacles lashing round the caster
  k => `<ellipse cx="32" cy="46" rx="28" ry="9" fill="#05040e"/>` + k.figure(32, 40, 1) + ['M6 46C2 34 10 28 8 18', 'M58 46C62 34 54 28 56 18', 'M16 52C12 40 20 34 16 24', 'M48 52C52 40 44 34 48 24', 'M24 56C22 46 26 42 22 34', 'M40 56C42 46 38 42 42 34'].map(d => k.tentacle(d, 4.6)).join(''),
  // Kraken: the Kraken stirring, colossal tentacles bursting from the floor
  k => k.tentacle('M6 60C2 40 14 30 10 14', 7) + k.tentacle('M58 60C62 40 50 30 54 14', 7) + `<ellipse cx="32" cy="56" rx="22" ry="5" fill="#05040e"/>` + k.eye(32, 40, .85, '#05030a') + k.tentacle('M20 62C18 54 22 50 18 44', 4) + k.tentacle('M44 62C46 54 42 50 46 44', 4),
];

// ---- Laser ----
const _wall = (k, x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="url(#${k.id}rk)"/><path d="M${x} ${y + h * .35}h${w}M${x} ${y + h * .7}h${w}" stroke="#2a1608" stroke-width=".8" opacity=".6"/>`;
SPELL_ART.laser = [
  // Pulse Laser: an instant laser pulse bouncing off whatever it meets
  k => _wall(k, 50, 4, 10, 30) + k.beam(6, 54, 48, 20, 3) + k.beam(48, 20, 20, 6, 2.4, .85) + k.burst(48, 20, 6, 8, .3) + k.orb(6, 54, 4),
  // Ricochet Beam: a thick beam ricocheting from pillar to pillar
  k => _wall(k, 2, 4, 8, 24) + _wall(k, 54, 20, 8, 24) + _wall(k, 18, 50, 24, 8) + k.beam(30, 50, 54, 32, 3.4) + k.beam(54, 32, 10, 16, 3.4) + k.beam(10, 16, 46, 4, 2.6, .8) + k.burst(54, 32, 5, 8, .3) + k.burst(10, 16, 5, 8, .3),
  // Refractor: a floating lens splitting a beam into many
  k => k.beam(2, 32, 28, 32, 3.4) + [-16, -6, 6, 16].map(dy => k.beam(36, 32, 62, 32 + dy * 1.6, 2, .85)).join('') + `<g transform="translate(32 32)">${k.glow(0, 0, 10, .6)}<path d="M0 -14L8 0 0 14-8 0z" fill="${k.W}" opacity=".55"/><path d="M0 -14L8 0 0 14-8 0zM0 -14V14M-8 0H8" fill="none" stroke="#fff" stroke-width="1.2"/></g>`,
  // Laser Drone: a hovering drone firing bouncing shots
  k => `<g transform="translate(22 20)"><ellipse cx="0" cy="0" rx="14" ry="5" fill="url(#${k.id}mt)"/><ellipse cx="0" cy="-2" rx="7" ry="4" fill="#3a3f4c"/><path d="M-18 -6h10M8 -6h10" stroke="#9aa4b8" stroke-width="2" stroke-linecap="round"/><path d="M-13 -6v4M13 -6v4" stroke="#6a7080" stroke-width="2"/>${k.glow(0, 3, 4, .9)}<circle cx="0" cy="3" r="2" fill="${k.W}"/></g>` + k.beam(22, 24, 48, 50, 2.4) + k.foe(52, 54, .7) + k.burst(48, 50, 5, 8, .3),
  // Prism Nova: a great spinning prism firing beams in every direction
  k => [0, 45, 90, 135, 180, 225, 270, 315].map(a => k.beam(32, 34, 32 + Math.cos(a * Math.PI / 180) * 30, 34 + Math.sin(a * Math.PI / 180) * 30, 2, .8)).join('') + `<g transform="translate(32 34)">${k.glow(0, 0, 14, .7)}<path d="M0 -14L13 9H-13z" fill="${k.W}" opacity=".6"/><path d="M0 -14L13 9H-13zM0 -14L0 9M0 9L-13 9" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M0 -14L13 9 0 9z" fill="${k.M}" opacity=".5"/></g>`,
];
// ---- Arcane ----
SPELL_ART.arcane = [
  // Arcane Missiles: three missiles weaving toward their target
  k => ['M4 58C14 50 10 36 22 30S34 18 46 16', 'M8 62C20 58 22 46 32 42S46 34 56 26', 'M2 46C10 40 6 28 14 22S24 10 32 6'].map(d => `<path d="${d}" fill="none" stroke="${k.M}" stroke-width="5" opacity=".4" filter="url(#${k.id}g2)" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${k.L}" stroke-width="1.6" stroke-linecap="round"/>`).join('') + k.star(46, 16, 6) + k.star(56, 26, 6) + k.star(32, 6, 5),
  // Arcane Barrage: every stored charge spent in a barrage of heavy bolts
  k => [[16, 22, 5], [24, 40, 6], [38, 28, 7], [48, 46, 5.5], [50, 14, 4.5]].map(([x, y, r]) => k.streak(x - 16, y + 10, x - r * .5, y + r * .3, r * 1.5, .45) + k.orb(x, y, r)).join('') + k.twinkle(8, 8, 2.6),
  // Arcane Familiar: a spectral owl circling and casting
  k => k.glow(32, 32, 22, .45) + `<path d="M14 54C10 40 12 24 20 16L18 6 26 12H38L46 6 44 16C52 24 54 40 50 54 42 60 22 60 14 54z" fill="${k.u('v')}" opacity=".92"/><path d="M14 40C8 34 4 26 6 18 12 26 14 32 18 36zM50 40C56 34 60 26 58 18 52 26 50 32 46 36z" fill="${k.M}" opacity=".8"/>` + `<circle cx="25" cy="26" r="6.5" fill="${k.W}"/><circle cx="39" cy="26" r="6.5" fill="${k.W}"/><circle cx="25" cy="26" r="3" fill="#2a0a3a"/><circle cx="39" cy="26" r="3" fill="#2a0a3a"/><path d="M30 32l2 4 2-4z" fill="#ffcf5a"/><path d="M24 44l4 2M36 44l4-2M28 50l4 2 4-2" stroke="${k.L}" stroke-width="1.2" opacity=".7"/>`,
  // Polymorph: a monster turned into a harmless sheep
  k => k.halo(32, 36, 28) + `<g opacity=".35">${k.foe(14, 18, .7)}</g><path d="M22 22l6 6" stroke="${k.L}" stroke-width="2" stroke-linecap="round"/>` + `<g transform="translate(34 40)"><circle cx="-10" cy="-2" r="7" fill="#fff8f0"/><circle cx="0" cy="-6" r="8" fill="#fff8f0"/><circle cx="10" cy="-2" r="7" fill="#fff8f0"/><circle cx="0" cy="3" r="9" fill="#f4ece0"/><ellipse cx="16" cy="-4" rx="5" ry="6" fill="#3a2a2a"/><circle cx="18" cy="-5" r="1" fill="#fff"/><path d="M-8 10v6M-2 11v6M4 11v6M10 10v6" stroke="#3a2a2a" stroke-width="2.2" stroke-linecap="round"/></g>` + k.twinkle(12, 40, 3) + k.twinkle(54, 20, 2.6) + k.twinkle(30, 14, 2.2),
  // Arcane Torrent: a rift tearing open overhead, raining homing missiles
  k => k.glow(32, 10, 20, .6) + `<ellipse cx="32" cy="10" rx="26" ry="7" fill="#12041e"/><ellipse cx="32" cy="10" rx="26" ry="7" fill="none" stroke="${k.L}" stroke-width="2"/>` + k.spiral(32, 10, 6, 1.5, 1.2, .9) + [[10, 34], [22, 46], [34, 38], [46, 50], [56, 32], [28, 58]].map(([x, y]) => k.streak(32 + (x - 32) * .3, 14, x, y, 3, .55) + k.star(x, y, 3.4)).join(''),
];
// ---- Blades ----
SPELL_ART.blades = [
  // Flying Daggers: a pair of daggers curving in toward the enemy
  k => `<path d="M4 54C18 52 26 40 34 26M10 62C26 58 38 50 50 36" fill="none" stroke="${k.L}" stroke-width="1.6" stroke-dasharray="3 3" opacity=".7"/>` + k.dagger(38, 26, 22, 30) + k.dagger(52, 38, 22, 50),
  // Sword Volley: every orbiting sword launched at the crosshair
  k => [[18, 40], [30, 50], [12, 54]].map(([x, y]) => k.streak(x - 10, y + 10, x, y, 4, .4) + k.blade(x, y, 26, 45, .75)).join('') + k.ring(52, 14, 8, 8, 1.6) + `<path d="M52 2v6M52 20v6M40 14h6M58 14h6" stroke="${k.L}" stroke-width="1.6" stroke-linecap="round"/>`,
  // Blade Dance: a dash through enemies in a whirl of blades
  k => k.streak(2, 46, 36, 36, 14, .35) + k.ring(38, 34, 18, 18, 1.6, .7) + k.figure(38, 36, 1) + [0, 120, 240].map(a => { const r = a * Math.PI / 180; return k.dagger(38 + Math.cos(r) * 18, 34 + Math.sin(r) * 18, 16, a + 90, .9); }).join(''),
  // Rain of Blades: swords raining down in a ring round the target
  k => k.ring(32, 52, 24, 7, 1.6, .7) + k.foe(32, 46, .7) + [[10, 50], [20, 58], [44, 58], [54, 50], [18, 44], [46, 44]].map(([x, y], i) => k.blade(x, y - 24 + (i % 2) * 4, 22, 180, .65)).join(''),
  // Colossal Blade: a colossal sword falling from the heavens
  k => k.glow(32, 30, 18, .45) + k.blade(32, 8, 48, 180, 1.15) + k.ring(32, 56, 24, 6, 2) + k.burst(32, 56, 8, 8, .3) + k.rock(10, 52, .45, 20) + k.rock(54, 50, .4, -30),
];
// ---- Ink ----
const _ink = (k, d, w) => `<path d="${d}" fill="none" stroke="#06060e" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${k.M}" stroke-width="${w * .3}" stroke-linecap="round" opacity=".7"/>`;
SPELL_ART.ink = [
  // Ink Bolt: a glob of ink splashing where it lands
  k => k.streak(4, 60, 26, 38, 10, .4, '#06060e') + `<circle cx="38" cy="26" r="11" fill="#06060e"/><circle cx="38" cy="26" r="11" fill="none" stroke="${k.M}" stroke-width="1.6"/><path d="M32 20a7 7 0 0 1 5-3" stroke="${k.L}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + [[54, 14, 3], [56, 32, 2.4], [48, 44, 2], [24, 12, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#06060e" stroke="${k.M}" stroke-width=".8"/>`).join(''),
  // Brush Stroke: a giant brush sweeping a wide arc of ink
  k => _ink(k, 'M6 50C14 22 40 12 58 22', 9) + `<path d="M50 28L60 8" stroke="#8a5a2a" stroke-width="4" stroke-linecap="round"/><path d="M50 28c-4 2-6 6-4 8 4 0 6-2 6-6z" fill="#06060e"/><rect x="56" y="10" width="5" height="3" fill="url(#${k.id}gd)" transform="rotate(25 58 11)"/>` + k.sparks([[12, 56, 1.6], [20, 58, 1.2], [30, 34, 1]], '#06060e'),
  // Ink Koi: koi of living ink swimming along the floor
  k => k.ground(54, 28, .4) + [[34, 30, 1, 0], [16, 46, .6, 10], [50, 50, .55, -10]].map(([x, y, s, r]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${k.glow(0, 0, 14, .4)}<path d="M-18 0C-10 -10 8 -10 14 -2L24 -8 20 0 24 8 14 2C8 10 -10 10 -18 0z" fill="#0a0a16"/><path d="M-16 0C-8 -7 6 -7 12 -2" fill="none" stroke="${k.L}" stroke-width="1.4" opacity=".8"/><circle cx="-10" cy="-2" r="1.6" fill="${k.W}"/><path d="M-2 -6l4-6 3 5M-2 6l3 5 3-4" fill="#0a0a16"/></g>`).join(''),
  // Ink Pool: a pool of ink that drags in whatever wades through it
  k => `<ellipse cx="32" cy="46" rx="28" ry="11" fill="#06060e"/><ellipse cx="32" cy="46" rx="28" ry="11" fill="none" stroke="${k.M}" stroke-width="1.6"/><ellipse cx="32" cy="46" rx="16" ry="6" fill="none" stroke="${k.M}" stroke-width="1" opacity=".6"/>` + `<g transform="translate(32 40)">${k.foe(0, 0, .9)}</g><ellipse cx="32" cy="48" rx="12" ry="4" fill="#06060e"/>` + _ink(k, 'M10 46c-2-6 0-10 4-12', 3) + _ink(k, 'M54 46c2-6 0-10-4-12', 3) + `<path d="M32 4v12M27 11l5 5 5-5" fill="none" stroke="${k.L}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Ink Dragon: a great ink dragon bursting up and coiling
  k => _ink(k, 'M6 60C10 44 30 50 30 36S12 26 22 14', 9) + `<g transform="translate(26 12) rotate(-20)"><path d="M-8 4C-10 -4 -4 -10 4 -10S16 -6 14 0 6 8 -8 4z" fill="#06060e"/><path d="M-2 -10l-4-6M4 -10l2-7" stroke="#06060e" stroke-width="2" stroke-linecap="round"/><circle cx="4" cy="-3" r="1.8" fill="#ff4a3a"/><path d="M14 0l6 2M14 2l5 4" stroke="${k.L}" stroke-width="1" stroke-linecap="round"/></g>` + `<path d="M34 44l6-4-2 6zM14 52l-4-5 6 1z" fill="#06060e"/>` + k.sparks([[46, 20, 1.6], [52, 34, 1.2], [40, 8, 1]], '#06060e'),
];
// ---- God Mode ----
SPELL_ART.god = [
  // Smite: everything at the aimed spot dies
  k => k.halo(32, 40, 30) + k.ring(32, 52, 26, 7, 2.2) + k.burst(32, 50, 14, 12, .3) + k.bolt([[36, 0], [26, 18], [36, 22], [28, 40], [32, 50]], 4.4) + k.twinkle(10, 14, 3) + k.twinkle(54, 10, 3),
  // Divine Beam: a vast beam of light that kills everything in its path
  k => k.glow(32, 32, 26, .5) + `<path d="M2 18H64V46H2z" fill="${k.u('fd')}"/>` + k.beam(4, 32, 62, 32, 16) + k.burst(6, 32, 10, 12, .35) + k.twinkle(40, 10, 2.6) + k.twinkle(50, 54, 2.6),
  // Heaven's Wrath: a nova of holy fire, everything near the caster dies
  k => k.halo(32, 34, 31) + Array.from({ length: 10 }, (_, i) => `<g transform="rotate(${i * 36} 32 34)">${k.flame(32, 22, 8, 16, 0, .9)}</g>`).join('') + k.ring(32, 34, 24, 24, 2, .8) + k.ring(32, 34, 14, 14, 2.4) + `<circle cx="32" cy="34" r="12" fill="#2a1e08" opacity=".55"/>` + k.figure(32, 34, .9, '#fff6d0', '#c8a040') + k.twinkle(8, 8, 2.6) + k.twinkle(56, 8, 2.6),
  // Chain of Judgement: lightning leaping to every enemy at once
  k => k.orb(10, 32, 6) + [[34, 10], [52, 22], [56, 42], [36, 54], [24, 40]].map(([x, y]) => k.bolt([[10, 32], [(10 + x) / 2 + 4, (32 + y) / 2 - 4], [x, y]], 1.4) + k.foe(x, y + 2, .45)).join(''),
  // Armageddon: the sky falls and everything dies
  k => `<ellipse cx="32" cy="10" rx="22" ry="9" fill="#ff6a1a" opacity=".3" filter="url(#${k.id}g)"/>` + k.orb(32, 8, 8) + [[12, 36, 5], [28, 48, 6], [46, 38, 5], [56, 56, 4], [18, 58, 3.5]].map(([x, y, r]) => `<g transform="rotate(-28 ${x} ${y})">${k.flame(x, y + r * .4, r * 2.2, r * 5, 0, .8).replace(/url\(#[^)]*?(fo|fm|fi)\)/g, (m, g) => `url(#${k.id}${g})`)}</g>` + k.glow(x, y, r * 1.4, .7, '#ff6a1a') + `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${k.id}rk)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ff6a1a" opacity=".35"/>`).join('') + k.ground(62, 30, .6),
];
