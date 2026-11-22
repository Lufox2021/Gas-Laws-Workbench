// Gas Laws Workbench — engine
// Every problem type has a calc(p, err) function. With err = {} it returns the
// correct value of every step; with one error flag set it returns what a student
// who makes that mistake would get. Diagnostics come from comparing the two.

const PU = { atm: 1, mmHg: 760, torr: 760, psi: 14.70, inHg: 29.92, Pa: 101325, kPa: 101.325 };
const PU_LABEL = { atm: 'atm', mmHg: 'mmHg', torr: 'torr', psi: 'psi', inHg: 'in Hg', Pa: 'Pa', kPa: 'kPa' };
const VU = { L: 1, mL: 1000 };
const R_ATM = 0.08206;   // L·atm/(mol·K)
const R_J = 8.314;       // J/(mol·K)
const GAS = {
  H2: 2.016, He: 4.003, CH4: 16.04, NH3: 17.03, Ne: 20.18, N2: 28.02, O2: 32.00,
  Ar: 39.95, CO2: 44.01, NO2: 46.01, SO2: 64.07, Cl2: 70.90, Kr: 83.80, Xe: 131.29, SF6: 146.06
};
// Vapor pressure of water, mmHg (deck slide 15 / Tro Table 6.4)
// Atomic masses for formula parsing (molar mass of any formula, e.g. KClO3, Ca(OH)2)
const ATOMIC = { H: 1.008, He: 4.003, Li: 6.941, B: 10.81, C: 12.01, N: 14.01, O: 16.00, F: 19.00, Ne: 20.18, Na: 22.99, Mg: 24.31, Al: 26.98,
  Si: 28.09, P: 30.97, S: 32.07, Cl: 35.45, Ar: 39.95, K: 39.10, Ca: 40.08, Cr: 52.00, Mn: 54.94, Fe: 55.85, Cu: 63.55, Zn: 65.38,
  Br: 79.90, Kr: 83.80, Ag: 107.87, I: 126.90, Xe: 131.29, Ba: 137.33, Hg: 200.59, Pb: 207.2, U: 238.03 };
function formulaMass(f) {
  const toks = String(f).match(/[A-Z][a-z]?|\d+|\(|\)|./g) || [];
  const stack = [0]; let i = 0;
  while (i < toks.length) {
    const t = toks[i++];
    if (t === '(') stack.push(0);
    else if (t === ')') { if (stack.length < 2) return NaN; let g = stack.pop(); if (/^\d+$/.test(toks[i] || '')) g *= +toks[i++]; stack[stack.length - 1] += g; }
    else if (ATOMIC[t] != null) { let m = ATOMIC[t]; if (/^\d+$/.test(toks[i] || '')) m *= +toks[i++]; stack[stack.length - 1] += m; }
    else return NaN;
  }
  return stack.length === 1 && stack[0] > 0 ? stack[0] : NaN;
}
function molar(f) { return GAS[f] != null ? GAS[f] : formulaMass(f); }

// Balanced equations: "2 KClO3 -> 2 KCl + 3 O2"
function parseRxn(str) {
  if (!str) return null;
  const sides = String(str).split(/->|→|=/);
  if (sides.length !== 2) return null;
  const terms = side => side.split('+').map(t => t.trim()).filter(Boolean).map(t => {
    const m = t.match(/^(\d*)\s*(.+)$/); return { c: m[1] ? +m[1] : 1, f: m[2].trim() };
  });
  return { left: terms(sides[0]), right: terms(sides[1]) };
}
function rxnHTML(str) {
  const r = parseRxn(str); if (!r) return str;
  const side = ts => ts.map(t => `${t.c > 1 ? t.c + ' ' : ''}${gasHTML(t.f)}`).join(' + ');
  return `${side(r.left)} → ${side(r.right)}`;
}
function coefOf(p, f) { const r = parseRxn(p.rxn); const t = r && [...r.left, ...r.right].find(x => x.f === f); return t ? t.c : NaN; }

// van der Waals constants (deck slide 23 / Tro Table 6.5): [a in L²·atm/mol², b in L/mol]
const VDW = { He: [0.0342, 0.02370], Ne: [0.211, 0.0171], Ar: [1.35, 0.0322], Kr: [2.32, 0.0398], Xe: [4.19, 0.0511], H2: [0.244, 0.0266],
  N2: [1.39, 0.0391], O2: [1.36, 0.0318], Cl2: [6.49, 0.0562], H2O: [5.46, 0.0305], CH4: [2.25, 0.0428], CO2: [3.59, 0.0427], CCl4: [20.4, 0.1383] };

const PH2O = { 0: 4.58, 5: 6.54, 10: 9.21, 15: 12.79, 20: 17.55, 25: 23.78, 30: 31.86, 35: 42.23, 40: 55.40, 45: 71.97, 50: 92.6 };

const VARNAME = { P: 'pressure', V: 'volume', T: 'temperature', n: 'amount (moles)' };

function gasHTML(f) { return f.replace(/(\d+)/g, '<sub>$1</sub>'); }

// "745 mmHg" -> {v:745, u:'mmHg', s:'745'}
function Q(str) {
  if (str == null) return null;
  const s = String(str).trim();
  const i = s.indexOf(' ');
  const num = i < 0 ? s : s.slice(0, i);
  let u = i < 0 ? '' : s.slice(i + 1).trim();
  if (u === '°C' || u === 'C') u = 'C';
  return { v: parseFloat(num), u, s: num };
}
function qHTML(q) {
  if (!q) return '';
  const u = q.u === 'C' ? '°C' : q.u === 'K' ? 'K' : (PU_LABEL[q.u] || q.u);
  return `${q.s} ${u}`;
}
function unitLabel(u) { return u === 'C' ? '°C' : (PU_LABEL[u] || u); }

const FLAG_MSG = {
  celsius: 'That is what you get with the Celsius temperature. Gas-law temperatures must be in kelvin: K = °C + 273.15.',
  invert: 'Your answer moved in the wrong direction — the ratio is upside down. Ask first: should it get bigger or smaller?',
  nounit: 'The two states use different units. Convert so both sides of the equation use the same unit.',
  R8314: 'You used R = 8.314 J/(mol·K) with atm and liters. With atm and L, use R = 0.08206 L·atm/(mol·K).',
  mL: 'The volume is still in mL. R = 0.08206 L·atm/(mol·K) needs liters.',
  Praw: 'The pressure was not converted to atm. With R = 0.08206 L·atm/(mol·K), pressure must be in atm.',
  gramsAsMol: 'You used grams where moles belong. Divide by the molar mass first.',
  noM: 'That is the number of moles. Multiply by the molar mass to get grams.',
  noC: 'That is the temperature in kelvin; the question asks for °C.',
  nosub: 'The collected gas is mixed with water vapor. Subtract water\'s vapor pressure: P(gas) = P(total) − P(H₂O).',
  add: 'Water\'s vapor pressure must be subtracted from the total, not added.',
  gmol: 'In u(rms) = √(3RT/M), M must be in kg/mol to give m/s (1 J = 1 kg·m²/s²).',
  Ratm: 'Use R = 8.314 J/(mol·K) here — energy units are needed.',
  no3: 'The formula has a 3 in it: u(rms) = √(3RT/M).',
  ginv: 'Upside down. The lighter gas moves faster: rate(A)/rate(B) = √(M(B)/M(A)).',
  nosqrt: 'Graham\'s law uses the square root of the molar-mass ratio.',
  sign: 'Check which arm is higher. If the open arm is higher, the gas pushes harder than the atmosphere: P(gas) = P(atm) + h. If the gas-side arm is higher, P(gas) = P(atm) − h.',
  pinv: 'The conversion factor is upside down — the unit you start with must cancel.',
  nodiv: 'That is n × P(total). First divide the gas\'s moles by the total moles to get the mole fraction χ.',
  inv2: 'Upside down: the rate ratio squared gives M(known)/M(unknown), so M(unknown) = M(known) ÷ (ratio)².',
  nosq: 'Graham\'s law has a square root, so the rate ratio must be squared to get the molar-mass ratio.',
  ratioinv: 'The mole ratio is upside down. n(wanted) = n(given) × (coefficient of wanted ÷ coefficient of given).',
  noratio: 'You skipped the mole ratio from the balanced equation.',
  nonb: 'Subtract the volume the particles themselves occupy: use V − nb, not V.',
  bnon: 'b is per mole, so multiply it by n: V − nb.',
  non2: 'The attraction term is a·n²/V² — both n and V are squared.',
  plus: 'Attractions pull particles away from the walls and lower the pressure, so subtract a·n²/V².',
  inv: 'Upside down: T(Boyle) = a ÷ (bR), with a on top.'
};

const FLAGS = {
  pconv: ['pinv'],
  mano: ['sign'],
  two: ['celsius', 'invert', 'nounit', 'noC'],
  one: ['R8314', 'celsius', 'mL', 'Praw', 'gramsAsMol', 'noM', 'noC'],
  dalton: ['nodiv', 'nosub', 'add', 'Praw', 'mL', 'celsius', 'noM'],
  kmt: ['gmol', 'celsius', 'Ratm', 'no3', 'ginv', 'nosqrt', 'inv2', 'nosq'],
  stoich: ['ratioinv', 'noratio', 'gramsAsMol', 'celsius', 'Praw', 'mL', 'R8314', 'noM'],
  real: ['celsius', 'nonb', 'bnon', 'non2', 'plus', 'inv', 'R8314']
};

// ---------- calc functions: return {key: value} for every step ----------

function calcPconv(p, e) {
  const q = Q(p.val), f = PU[q.u], t = PU[p.to];
  const o = {};
  o.atm = e.pinv ? q.v * f : q.v / f;
  o.ans = e.pinv ? o.atm / t : o.atm * t;
  return o;
}

function calcMano(p, e) {
  const Pa = Q(p.Patm), h = Q(p.h);
  const s = p.side === 'higher' ? 1 : -1;
  const o = {};
  o.pmm = Pa.v + (e.sign ? -s : s) * h.v;
  if (p.to && p.to !== 'mmHg') o.ans = o.pmm / 760 * PU[p.to];
  return o;
}

function twoStates(p, e) {
  const held = p.hold.split('');
  const a1 = { P: 1, V: 1, T: 1, n: 1 }, a2 = { P: 1, V: 1, T: 1, n: 1 };
  const o = {};
  const T = (q, key) => {
    if (q.u === 'C') { const k = e.celsius ? q.v : q.v + 273.15; o[key] = k; return k; }
    return q.v;
  };
  if (!held.includes('P')) {
    const P1 = Q(p.P1); a1.P = P1.v;
    if (p.P2) { const P2 = Q(p.P2); if (P2.u !== P1.u) { o.P2c = e.nounit ? P2.v : P2.v / PU[P2.u] * PU[P1.u]; a2.P = o.P2c; } else a2.P = P2.v; }
  }
  if (!held.includes('V')) {
    const V1 = Q(p.V1); a1.V = V1.v;
    if (p.V2) { const V2 = Q(p.V2); if (V2.u !== V1.u) { o.V2c = e.nounit ? V2.v : V2.v / VU[V2.u] * VU[V1.u]; a2.V = o.V2c; } else a2.V = V2.v; }
  }
  if (!held.includes('T')) {
    a1.T = T(Q(p.T1), 'T1K');
    if (p.T2) a2.T = T(Q(p.T2), 'T2K');
  }
  if (!held.includes('n')) {
    a1.n = Q(p.n1).v;
    if (p.n2) a2.n = Q(p.n2).v;
  }
  return { a1, a2, o };
}

function calcTwo(p, e) {
  const { a1, a2, o } = twoStates(p, e);
  const K = a1.P * a1.V / (a1.n * a1.T);
  let x;
  switch (p.find) {
    case 'P': x = K * a2.n * a2.T / a2.V; break;
    case 'V': x = K * a2.n * a2.T / a2.P; break;
    case 'T': x = a2.P * a2.V / (K * a2.n); break;
    case 'n': x = a2.P * a2.V / (K * a2.T); break;
  }
  if (e.invert) x = a1[p.find] * a1[p.find] / x;
  o.x = x;
  if (p.find === 'T' && p.ansU === 'C') o.xC = (e.noC || e.celsius) ? x : x - 273.15;
  if ((p.find === 'P' || p.find === 'V') && p.ansU) {
    const u1 = Q(p[p.find + '1']).u, tab = p.find === 'P' ? PU : VU;
    if (p.ansU !== u1) o.xU = x / tab[u1] * tab[p.ansU];
  }
  return o;
}

function nearestGas(M) {
  let best = null, bd = Infinity;
  for (const g in GAS) { const d = Math.abs(GAS[g] - M); if (d < bd) { bd = d; best = g; } }
  return best;
}

function calcOne(p, e) {
  const o = {};
  const Rv = e.R8314 ? R_J : R_ATM;
  let P = null, V = null, T = null, n = null;
  if (p.P) { const q = Q(p.P); if (q.u !== 'atm') { o.Patm = e.Praw ? q.v : q.v / PU[q.u]; P = o.Patm; } else P = q.v; }
  if (p.V) { const q = Q(p.V); if (q.u !== 'L') { o.VL = e.mL ? q.v : q.v / VU[q.u]; V = o.VL; } else V = q.v; }
  if (p.T) { const q = Q(p.T); if (q.u === 'C') { o.TK = e.celsius ? q.v : q.v + 273.15; T = o.TK; } else T = q.v; }
  if (p.n) n = Q(p.n).v;
  if (p.mass && p.find !== 'M') { const m = Q(p.mass).v; o.nmol = e.gramsAsMol ? m : m / molar(p.gas); n = o.nmol; }
  switch (p.find) {
    case 'P': o.x = n * Rv * T / V; break;
    case 'V': o.x = n * Rv * T / P; break;
    case 'T': o.x = P * V / (n * Rv); break;
    case 'n': o.x = P * V / (Rv * T); break;
    case 'mass': o.n = P * V / (Rv * T); o.x = e.noM ? o.n : o.n * molar(p.gas); break;
    case 'M': o.n = P * V / (Rv * T); o.x = Q(p.mass).v / o.n; o.id = nearestGas(o.x); break;
    case 'd': o.Mg = molar(p.gas); o.x = P * o.Mg / (Rv * T); break;
    case 'Md': o.x = Q(p.d).v * Rv * T / P; o.id = nearestGas(o.x); break;
  }
  if (p.find === 'T' && p.ansU === 'C') o.xC = e.noC ? o.x : o.x - 273.15;
  if (p.find === 'P' && p.ansU && p.ansU !== 'atm') o.xU = o.x * PU[p.ansU];
  return o;
}

function calcDalton(p, e) {
  const o = {};
  if (p.sub === 'sum') {
    o.x = p.parts.reduce((s, pr) => s + Q(pr[1]).v, 0);
  } else if (p.sub === 'frac') {
    const tot = p.moles.reduce((s, m) => s + m[1], 0);
    const ni = p.moles.find(m => m[0] === p.target)[1];
    o.chi = e.nodiv ? ni : ni / tot;
    o.x = o.chi * Q(p.Ptot).v;
  } else { // water
    const Pt = Q(p.Ptot).v, Pv = PH2O[Q(p.T).v];
    o.pv = Pv;
    o.pg = e.nosub ? Pt : e.add ? Pt + Pv : Pt - Pv;
    if (p.find === 'Pg') return o;
    o.Patm = e.Praw ? o.pg : o.pg / 760;
    const Vq = Q(p.V); o.VL = e.mL ? Vq.v : Vq.v / VU[Vq.u];
    o.TK = e.celsius ? Q(p.T).v : Q(p.T).v + 273.15;
    o.n = o.Patm * o.VL / (R_ATM * o.TK);
    if (p.find === 'mass') o.x = e.noM ? o.n : o.n * molar(p.gas);
  }
  return o;
}

function calcKmt(p, e) {
  const o = {};
  if (p.sub === 'urms') {
    const M = molar(p.gas);
    o.Mk = e.gmol ? M : M / 1000;
    const Tq = Q(p.T);
    let T = Tq.v; if (Tq.u === 'C') { o.TK = e.celsius ? Tq.v : Tq.v + 273.15; T = o.TK; }
    const Rv = e.Ratm ? R_ATM : R_J, c = e.no3 ? 1 : 3;
    o.x = Math.sqrt(c * Rv * T / o.Mk);
  } else if (p.sub === 'ke') {
    const Tq = Q(p.T);
    let T = Tq.v; if (Tq.u === 'C') { o.TK = e.celsius ? Tq.v : Tq.v + 273.15; T = o.TK; }
    o.x = 1.5 * (e.Ratm ? R_ATM : R_J) * T;
  } else if (p.sub === 'graham') {
    o.MA = molar(p.A); o.MB = molar(p.B);
    const r = e.ginv ? o.MA / o.MB : o.MB / o.MA;
    o.x = e.nosqrt ? r : Math.sqrt(r);
  } else if (p.sub === 'grahamM') {
    o.MK = molar(p.known);
    const r = p.ratio;
    o.x = e.nosq ? o.MK / r : e.inv2 ? o.MK * r * r : o.MK / (r * r);
    o.id = nearestGas(o.x);
  }
  return o;
}

function convPVT(p, e, o) {
  let P = null, V = null, T = null;
  if (p.P) { const q = Q(p.P); if (q.u !== 'atm') { o.Patm = e.Praw ? q.v : q.v / PU[q.u]; P = o.Patm; } else P = q.v; }
  if (p.V) { const q = Q(p.V); if (q.u !== 'L') { o.VL = e.mL ? q.v : q.v / VU[q.u]; V = o.VL; } else V = q.v; }
  if (p.T) { const q = Q(p.T); if (q.u === 'C') { o.TK = e.celsius ? q.v : q.v + 273.15; T = o.TK; } else T = q.v; }
  return { P, V, T };
}

function calcStoich(p, e) {
  const o = {};
  const ck = coefOf(p, p.known), ct = coefOf(p, p.target);
  const r = e.ratioinv ? ck / ct : e.noratio ? 1 : ct / ck;
  const Rv = e.R8314 ? R_J : R_ATM;
  if (p.sub === 'V2V') { o.x = Q(p.V).v * r; return o; }
  if (p.sub === 'm2V') {
    o.Mk = molar(p.known);
    const m = Q(p.mass).v;
    o.nk = e.gramsAsMol ? m : m / o.Mk;
    o.nt = o.nk * r;
    const { P, T } = convPVT(p, e, o);
    o.x = o.nt * Rv * T / P;
  } else { // V2m: gas volume of the known -> mass of the target
    const { P, V, T } = convPVT(p, e, o);
    o.nk = P * V / (Rv * T);
    o.nt = o.nk * r;
    o.Mt = molar(p.target);
    o.x = e.noM ? o.nt : o.nt * o.Mt;
  }
  return o;
}

function calcReal(p, e) {
  const o = {}, c = VDW[p.gas], a = c[0], b = c[1];
  const Rv = e.R8314 ? R_J : R_ATM;
  if (p.sub === 'boyle') { o.x = e.inv ? b * Rv / a : a / (b * Rv); return o; }
  const n = Q(p.n).v, V = Q(p.V).v;
  const Tq = Q(p.T); let T = Tq.v; if (Tq.u === 'C') { o.TK = e.celsius ? Tq.v : Tq.v + 273.15; T = o.TK; }
  o.Pid = n * Rv * T / V;
  o.Vf = e.nonb ? V : e.bnon ? V - b : V - n * b;
  o.att = e.non2 ? a * n / (V * V) : a * n * n / (V * V);
  o.x = n * Rv * T / o.Vf + (e.plus ? o.att : -o.att);
  if (p.find === 'Z') o.Z = o.x / o.Pid;
  return o;
}

const CALC = { pconv: calcPconv, mano: calcMano, two: calcTwo, one: calcOne, dalton: calcDalton, kmt: calcKmt, stoich: calcStoich, real: calcReal };


// ---------- the one master equation ----------
const LAW_NAMES = {
  Tn: "Boyle's law", Pn: "Charles's law", PT: "Avogadro's law",
  Vn: "Gay-Lussac's (Amontons's) law", n: 'the combined gas law', '': 'the full two-state equation'
};
function holdKey(held) { return ['P', 'V', 'T', 'n'].filter(v => held.includes(v)).join(''); }
function lawName(held) { return LAW_NAMES[holdKey(held)] || null; }

function sub(v, i) { return `<i>${v}</i><sub>${i}</sub>`; }
// Full equation with held variables struck through
function masterEqHTML(held) {
  const cell = (v, i) => `<span class="ev${held.includes(v) ? ' struck' : ''}">${sub(v, i)}</span>`;
  const side = i => `<span class="frac"><span class="num">${cell('P', i)}${cell('V', i)}</span><span class="den">${cell('n', i)}${cell('T', i)}</span></span>`;
  return `<span class="eq">${side(1)}<span class="eqs">=</span>${side(2)}</span>`;
}
// What is left after crossing out
function reducedEqHTML(held) {
  const num = ['P', 'V'].filter(v => !held.includes(v));
  const den = ['n', 'T'].filter(v => !held.includes(v));
  const side = i => {
    const N = num.map(v => sub(v, i)).join(''), D = den.map(v => sub(v, i)).join('');
    if (!N && !D) return '1';
    if (!D) return `<span>${N}</span>`;
    if (!N) return `<span>${D}</span>`; // both sides 1/D -> write D1 = D2
    return `<span class="frac"><span class="num">${N}</span><span class="den">${D}</span></span>`;
  };
  return `<span class="eq">${side(1)}<span class="eqs">=</span>${side(2)}</span>`;
}

// ---------- step builder ----------
const TOL = 0.01; // 1% relative

function step(key, label, unit, hint, show, opts = {}) { return Object.assign({ key, label, unit, hint, show }, opts); }

function stepsFor(p) {
  const v = CALC[p.type](p, {});
  const S = [];
  const f3 = x => fmt(x);
  if (p.type === 'pconv') {
    const q = Q(p.val);
    if (q.u !== 'atm' && p.to !== 'atm')
      S.push(step('atm', `Convert ${qHTML(q)} to atm`, 'atm', `1 atm = ${PU[q.u]} ${unitLabel(q.u)}. Divide so ${unitLabel(q.u)} cancels.`,
        `${qHTML(q)} × (1 atm / ${PU[q.u]} ${unitLabel(q.u)}) = ${f3(v.atm)} atm`));
    const from = q.u !== 'atm' && p.to !== 'atm' ? `${f3(v.atm)} atm` : qHTML(q);
    S.push(step('ans', `Convert to ${unitLabel(p.to)}`, unitLabel(p.to), (p.to === 'atm' ? `Divide by ${PU[q.u]} ${unitLabel(q.u)} per 1 atm so ${unitLabel(q.u)} cancels.` : `Multiply the value in atm by (${PU[p.to]} ${unitLabel(p.to)} / 1 atm) so atm cancels.`),
      `${from} → ${f3(v.ans)} ${unitLabel(p.to)}`));
  }
  if (p.type === 'mano') {
    const s = p.side === 'higher' ? '+' : '−';
    S.push(step('pmm', 'Gas pressure', 'mmHg', 'P(gas) = P(atm) ± h, with h in mmHg (1 mm of Hg height = 1 mmHg).',
      `P(gas) = ${Q(p.Patm).s} ${s} ${Q(p.h).s} = ${f3(v.pmm)} mmHg`));
    if (v.ans != null) S.push(step('ans', `Convert to ${unitLabel(p.to)}`, unitLabel(p.to), `1 atm = 760 mmHg = ${PU[p.to]} ${unitLabel(p.to)}.`,
      `${f3(v.pmm)} mmHg × (${PU[p.to]} ${unitLabel(p.to)} / 760 mmHg) = ${f3(v.ans)} ${unitLabel(p.to)}`));
  }
  if (p.type === 'two') {
    if (v.T1K != null) S.push(step('T1K', `T<sub>1</sub> in kelvin`, 'K', 'K = °C + 273.15', `${qHTML(Q(p.T1))} + 273.15 = ${fK(v.T1K)} K`));
    if (v.T2K != null) S.push(step('T2K', `T<sub>2</sub> in kelvin`, 'K', 'K = °C + 273.15', `${qHTML(Q(p.T2))} + 273.15 = ${fK(v.T2K)} K`));
    if (v.P2c != null) { const u = Q(p.P1).u; S.push(step('P2c', `P<sub>2</sub> in ${unitLabel(u)} (same unit as P<sub>1</sub>)`, unitLabel(u), `1 atm = 760 mmHg = 14.70 psi = 101.325 kPa`, `${qHTML(Q(p.P2))} = ${f3(v.P2c)} ${unitLabel(u)}`)); }
    if (v.V2c != null) { const u = Q(p.V1).u; S.push(step('V2c', `V<sub>2</sub> in ${u} (same unit as V<sub>1</sub>)`, u, '1 L = 1000 mL', `${qHTML(Q(p.V2))} = ${f3(v.V2c)} ${u}`)); }
    const xu = p.find === 'T' ? 'K' : p.find === 'n' ? 'mol' : unitLabel(Q(p[p.find + '1']).u);
    S.push(step('x', `Solve for ${p.find}<sub>2</sub>`, xu, twoHint(p), `${p.find}<sub>2</sub> = ${f3(v.x)} ${xu}`));
    if (v.xC != null) S.push(step('xC', `T<sub>2</sub> in °C`, '°C', '°C = K − 273.15', `${f3(v.x)} K − 273.15 = ${f3(v.xC)} °C`, { abs: 0.5 }));
    if (v.xU != null) S.push(step('xU', `${p.find}<sub>2</sub> in ${unitLabel(p.ansU)}`, unitLabel(p.ansU), 'Convert units.', `${f3(v.xU)} ${unitLabel(p.ansU)}`));
  }
  if (p.type === 'one' || (p.type === 'dalton' && p.sub === 'water')) {
    if (p.type === 'dalton') {
      S.push(step('pv', `Vapor pressure of water at ${qHTML(Q(p.T))}`, 'mmHg', 'Read it from the vapor-pressure table.', `P(H<sub>2</sub>O) = ${f3(v.pv)} mmHg`));
      S.push(step('pg', `Pressure of the ${gasHTML(p.gas)} alone`, 'mmHg', 'Dalton: P(total) = P(gas) + P(H₂O), so P(gas) = P(total) − P(H₂O).', `${Q(p.Ptot).s} − ${f3(v.pv)} = ${f3(v.pg)} mmHg`));
      if (p.find !== 'Pg') S.push(step('Patm', `P(${gasHTML(p.gas)}) in atm`, 'atm', '1 atm = 760 mmHg', `${f3(v.pg)} / 760 = ${f3(v.Patm)} atm`));
    } else if (v.Patm != null) S.push(step('Patm', 'Pressure in atm', 'atm', `1 atm = ${PU[Q(p.P).u]} ${unitLabel(Q(p.P).u)}`, `${qHTML(Q(p.P))} = ${f3(v.Patm)} atm`));
    if (v.VL != null) S.push(step('VL', 'Volume in liters', 'L', '1 L = 1000 mL', `${qHTML(Q(p.V))} = ${f3(v.VL)} L`));
    if (v.TK != null) S.push(step('TK', 'Temperature in kelvin', 'K', 'K = °C + 273.15', `${qHTML(Q(p.T))} + 273.15 = ${fK(v.TK)} K`));
    if (v.nmol != null) S.push(step('nmol', `Moles of ${gasHTML(p.gas)}`, 'mol', `n = mass ÷ molar mass (${gasHTML(p.gas)}: ${molar(p.gas)} g/mol)`, `${qHTML(Q(p.mass))} ÷ ${molar(p.gas)} g/mol = ${f3(v.nmol)} mol`));
    const lab = { P: ['Pressure', 'atm', 'P = nRT/V'], V: ['Volume', 'L', 'V = nRT/P'], T: ['Temperature', 'K', 'T = PV/(nR)'], n: ['Moles', 'mol', 'n = PV/(RT)'] };
    if (p.type === 'one' && lab[p.find]) { const [a, u, h] = lab[p.find]; S.push(step('x', a, u, h + ' with R = 0.08206 L·atm/(mol·K)', `${h} = ${f3(v.x)} ${u}`)); }
    if (p.find === 'mass' || p.find === 'M' || (p.type === 'dalton' && p.find !== 'Pg'))
      S.push(step('n', `Moles of ${p.gas ? gasHTML(p.gas) : 'gas'}`, 'mol', 'n = PV/(RT) with R = 0.08206 L·atm/(mol·K)', `n = PV/(RT) = ${f3(v.n)} mol`));
    if (p.find === 'mass') S.push(step('x', `Mass of ${gasHTML(p.gas)}`, 'g', `mass = n × molar mass (${molar(p.gas)} g/mol)`, `${f3(v.n)} mol × ${molar(p.gas)} g/mol = ${f3(v.x)} g`));
    if (p.find === 'M') S.push(step('x', 'Molar mass', 'g/mol', 'M = mass ÷ moles', `${qHTML(Q(p.mass))} ÷ ${f3(v.n)} mol = ${f3(v.x)} g/mol`));
    if (p.find === 'd') {
      S.push(step('Mg', `Molar mass of ${gasHTML(p.gas)}`, 'g/mol', 'Add up atomic masses.', `M = ${f3(v.Mg)} g/mol`));
      S.push(step('x', 'Density', 'g/L', 'd = PM/(RT) — from PV = nRT with n = m/M', `d = PM/(RT) = ${f3(v.x)} g/L`));
    }
    if (p.find === 'Md') S.push(step('x', 'Molar mass', 'g/mol', 'M = dRT/P', `M = dRT/P = ${f3(v.x)} g/mol`));
    if (v.id) S.push(step('id', 'Which gas is it?', '', 'Match the molar mass to the closest gas.', `${gasHTML(v.id)} (${GAS[v.id]} g/mol)`, { choice: Object.keys(GAS) }));
    if (v.xC != null) S.push(step('xC', 'Temperature in °C', '°C', '°C = K − 273.15', `${f3(v.x)} − 273.15 = ${f3(v.xC)} °C`, { abs: 0.5 }));
    if (v.xU != null) S.push(step('xU', `Pressure in ${unitLabel(p.ansU)}`, unitLabel(p.ansU), `1 atm = ${PU[p.ansU]} ${unitLabel(p.ansU)}`, `${f3(v.xU)} ${unitLabel(p.ansU)}`));
    if (p.type === 'dalton' && p.find === 'Pg') S[S.length - 1].final = true;
  }
  if (p.type === 'dalton' && p.sub === 'sum') S.push(step('x', 'Total pressure', unitLabel(Q(p.parts[0][1]).u), 'P(total) = P₁ + P₂ + …', `P(total) = ${p.parts.map(pr => Q(pr[1]).s).join(' + ')} = ${f3(v.x)} ${unitLabel(Q(p.parts[0][1]).u)}`));
  if (p.type === 'dalton' && p.sub === 'frac') {
    const tot = p.moles.reduce((s, m) => s + m[1], 0);
    S.push(step('chi', `Mole fraction of ${gasHTML(p.target)}, χ`, '', 'χ = n(gas) ÷ n(total)', `χ = ${p.moles.find(m => m[0] === p.target)[1]} / ${fmt(tot)} = ${f3(v.chi)}`));
    S.push(step('x', `Partial pressure of ${gasHTML(p.target)}`, unitLabel(Q(p.Ptot).u), 'P(gas) = χ × P(total)', `${f3(v.chi)} × ${qHTML(Q(p.Ptot))} = ${f3(v.x)} ${unitLabel(Q(p.Ptot).u)}`));
  }
  if (p.type === 'kmt') {
    if (p.sub === 'urms') {
      S.push(step('Mk', `Molar mass of ${gasHTML(p.gas)} in kg/mol`, 'kg/mol', `${molar(p.gas)} g/mol ÷ 1000`, `${molar(p.gas)} g/mol = ${f3(v.Mk)} kg/mol`));
      if (v.TK != null) S.push(step('TK', 'Temperature in kelvin', 'K', 'K = °C + 273.15', `${qHTML(Q(p.T))} + 273.15 = ${fK(v.TK)} K`));
      S.push(step('x', 'Root-mean-square speed', 'm/s', 'u(rms) = √(3RT/M), R = 8.314 J/(mol·K)', `u(rms) = √(3 × 8.314 × T / M) = ${f3(v.x)} m/s`));
    }
    if (p.sub === 'ke') {
      if (v.TK != null) S.push(step('TK', 'Temperature in kelvin', 'K', 'K = °C + 273.15', `${qHTML(Q(p.T))} + 273.15 = ${fK(v.TK)} K`));
      S.push(step('x', 'Average kinetic energy per mole', 'J/mol', 'KE = (3/2)RT with R = 8.314 J/(mol·K)', `(3/2)(8.314)(T) = ${f3(v.x)} J/mol`));
    }
    if (p.sub === 'graham') {
      S.push(step('MA', `Molar mass of ${gasHTML(p.A)}`, 'g/mol', 'Add up atomic masses.', `${f3(v.MA)} g/mol`));
      S.push(step('MB', `Molar mass of ${gasHTML(p.B)}`, 'g/mol', 'Add up atomic masses.', `${f3(v.MB)} g/mol`));
      S.push(step('x', `rate(${gasHTML(p.A)}) / rate(${gasHTML(p.B)})`, '', 'rate(A)/rate(B) = √(M(B)/M(A))', `√(${f3(v.MB)} / ${f3(v.MA)}) = ${f3(v.x)}`));
    }
    if (p.sub === 'grahamM') {
      S.push(step('MK', `Molar mass of ${gasHTML(p.known)}`, 'g/mol', 'Add up atomic masses.', `${f3(v.MK)} g/mol`));
      S.push(step('x', 'Molar mass of the unknown gas', 'g/mol', 'rate(unk)/rate(known) = √(M(known)/M(unk)), so M(unk) = M(known) ÷ (ratio)²', `${f3(v.MK)} ÷ (${p.ratio})² = ${f3(v.x)} g/mol`));
      S.push(step('id', 'Which gas is it?', '', 'Match the molar mass to the closest gas.', `${gasHTML(v.id)} (${GAS[v.id]} g/mol)`, { choice: Object.keys(GAS) }));
    }
  }
  if (p.type === 'stoich') {
    const ck = coefOf(p, p.known), ct = coefOf(p, p.target), K = gasHTML(p.known), Tg = gasHTML(p.target);
    const ratioHint = `From the balanced equation: ${ct} mol ${Tg} for every ${ck} mol ${K}, so multiply by (${ct}/${ck}).`;
    const convSteps = () => {
      if (v.Patm != null) S.push(step('Patm', 'Pressure in atm', 'atm', `1 atm = ${PU[Q(p.P).u]} ${unitLabel(Q(p.P).u)}`, `${qHTML(Q(p.P))} = ${f3(v.Patm)} atm`));
      if (v.VL != null) S.push(step('VL', 'Volume in liters', 'L', '1 L = 1000 mL', `${qHTML(Q(p.V))} = ${f3(v.VL)} L`));
      if (v.TK != null) S.push(step('TK', 'Temperature in kelvin', 'K', 'K = °C + 273.15', `${qHTML(Q(p.T))} + 273.15 = ${fK(v.TK)} K`));
    };
    if (p.sub === 'V2V') {
      S.push(step('x', `Volume of ${Tg}`, Q(p.V).u, `At the same T and P, volume is proportional to moles (Avogadro), so gas volumes combine in the coefficient ratio: multiply by (${ct}/${ck}). R is not needed.`,
        `${qHTML(Q(p.V))} × (${ct}/${ck}) = ${f3(v.x)} ${Q(p.V).u}`));
    } else if (p.sub === 'm2V') {
      S.push(step('Mk', `Molar mass of ${K}`, 'g/mol', 'Add up the atomic masses.', `M(${K}) = ${f3(v.Mk)} g/mol`));
      S.push(step('nk', `Moles of ${K}`, 'mol', 'n = mass ÷ molar mass', `${qHTML(Q(p.mass))} ÷ ${f3(v.Mk)} g/mol = ${f3(v.nk)} mol`));
      S.push(step('nt', `Moles of ${Tg}`, 'mol', ratioHint, `${f3(v.nk)} × (${ct}/${ck}) = ${f3(v.nt)} mol`));
      convSteps();
      S.push(step('x', `Volume of ${Tg}`, 'L', 'V = nRT/P with R = 0.08206 L·atm/(mol·K)', `V = nRT/P = ${f3(v.x)} L`));
    } else {
      convSteps();
      S.push(step('nk', `Moles of ${K}`, 'mol', 'n = PV/(RT) with R = 0.08206 L·atm/(mol·K)', `n = PV/(RT) = ${f3(v.nk)} mol`));
      S.push(step('nt', `Moles of ${Tg}`, 'mol', ratioHint, `${f3(v.nk)} × (${ct}/${ck}) = ${f3(v.nt)} mol`));
      S.push(step('Mt', `Molar mass of ${Tg}`, 'g/mol', 'Add up the atomic masses.', `M(${Tg}) = ${f3(v.Mt)} g/mol`));
      S.push(step('x', `Mass of ${Tg}`, 'g', 'mass = n × molar mass', `${f3(v.nt)} mol × ${f3(v.Mt)} g/mol = ${f3(v.x)} g`));
    }
  }
  if (p.type === 'real') {
    const c = VDW[p.gas], G = gasHTML(p.gas);
    if (p.sub === 'boyle') {
      S.push(step('x', `Boyle temperature of ${G}`, 'K', `T(Boyle) = a ÷ (bR), with a = ${c[0]} L²·atm/mol², b = ${c[1]} L/mol and R = 0.08206 L·atm/(mol·K).`,
        `T(Boyle) = ${c[0]} ÷ (${c[1]} × 0.08206) = ${f3(v.x)} K`));
    } else {
      if (v.TK != null) S.push(step('TK', 'Temperature in kelvin', 'K', 'K = °C + 273.15', `${qHTML(Q(p.T))} + 273.15 = ${fK(v.TK)} K`));
      S.push(step('Pid', 'Ideal-gas pressure', 'atm', 'P(ideal) = nRT/V', `P(ideal) = nRT/V = ${f3(v.Pid)} atm`));
      S.push(step('Vf', 'Volume the particles can move in, V − nb', 'L', `b = ${c[1]} L/mol for ${G}; subtract n × b from V.`, `${Q(p.V).s} − ${Q(p.n).s} × ${c[1]} = ${f3(v.Vf)} L`));
      S.push(step('att', 'Attraction correction, a·n²/V²', 'atm', `a = ${c[0]} L²·atm/mol² for ${G}; square both n and V.`, `${c[0]} × ${Q(p.n).s}² ÷ ${Q(p.V).s}² = ${f3(v.att)} atm`));
      S.push(step('x', 'Van der Waals pressure', 'atm', 'P = nRT/(V − nb) − a·n²/V²', `P = nRT/(V − nb) − a·n²/V² = ${f3(v.x)} atm`));
      if (p.find === 'Z') S.push(step('Z', 'Compressibility factor, Z = P(real) / P(ideal)', '', 'Z = PV/(nRT). With the same n, V and T, that is P(vdW) ÷ P(ideal). Z < 1: attractions win; Z > 1: particle volume wins.',
        `Z = ${f3(v.x)} ÷ ${f3(v.Pid)} = ${f3(v.Z)}`));
    }
  }
  // answers + diagnostics
  for (const s of S) {
    s.ans = v[s.key];
    s.diags = [];
    if (s.choice) continue;
    for (const fl of FLAGS[p.type]) {
      const w = CALC[p.type](p, { [fl]: true })[s.key];
      if (w == null || !isFinite(w)) continue;
      if (isRight(s, w)) continue;
      if (s.diags.some(d => Math.abs(d.v - w) <= Math.abs(w) * 1e-6)) continue;
      s.diags.push({ v: w, flag: fl, msg: FLAG_MSG[fl] });
    }
  }
  // final = last numeric step unless marked
  let fi = S.findIndex(s => s.final);
  if (fi < 0) { fi = S.length - 1; while (fi > 0 && S[fi].choice) fi--; }
  S.finalIndex = fi;
  return S;
}

function isRight(s, x) {
  if (s.abs != null) return Math.abs(x - s.ans) <= s.abs;
  return Math.abs(x - s.ans) <= TOL * Math.abs(s.ans) + 1e-12;
}
function matchDiag(s, x) {
  // a diagnostic matches if within 1% of the wrong value
  return s.diags.find(d => Math.abs(x - d.v) <= 0.01 * Math.abs(d.v) + (s.abs ? s.abs : 0));
}

function parseNum(str) {
  if (str == null) return NaN;
  let s = String(str).trim().replace(/,/g, '').replace(/−/g, '-').replace(/\s+/g, '');
  s = s.replace(/[x×*]10\^?/i, 'e').replace(/e\+/i, 'e');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return parseFloat(s);
}

function fK(x) { return (Math.round(x * 100) / 100).toFixed(2); }
function fmt(x) {
  if (x == null || !isFinite(x)) return String(x);
  const a = Math.abs(x);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) {
    const e = Math.floor(Math.log10(a)); const m = x / Math.pow(10, e);
    return `${m.toPrecision(4)} × 10<sup>${e}</sup>`;
  }
  return Number(x.toPrecision(4)).toString();
}

// ---------- decode answer keys ----------
function decodeFor(p) {
  const v = CALC[p.type](p, {});
  if (p.type === 'mano') return { kind: 'mano', sign: p.side === 'higher' ? '+' : '-' };
  if (p.type === 'two') {
    const { a1 } = twoStates(p, {});
    const x = v.x;
    const ref = a1[p.find];
    return { kind: 'two', find: p.find, held: p.hold.split(''), predict: x > ref * 1.0001 ? 'up' : x < ref * 0.9999 ? 'down' : 'same' };
  }
  if (p.type === 'one') {
    const conv = [];
    if (v.Patm != null) conv.push('Patm');
    if (v.VL != null) conv.push('VL');
    if (v.TK != null) conv.push('TK');
    if (v.nmol != null) conv.push('nmol');
    return { kind: 'one', find: p.find === 'Md' ? 'M' : p.find, conv };
  }
  if (p.type === 'dalton' && p.sub === 'water') return { kind: 'water', pg: 'sub' };
  if (p.type === 'kmt' && (p.sub === 'urms' || p.sub === 'ke')) return { kind: 'urms', R: 'J', M: p.sub === 'urms' ? 'kg' : null };
  if (p.type === 'stoich') {
    const conv = [];
    if (p.sub === 'm2V') conv.push('nmol');
    if (v.Patm != null) conv.push('Patm');
    if (v.VL != null) conv.push('VL');
    if (v.TK != null) conv.push('TK');
    return { kind: 'stoich', ck: coefOf(p, p.known), ct: coefOf(p, p.target), known: p.known, target: p.target, conv, needR: p.sub !== 'V2V' };
  }
  if (p.type === 'real' && p.sub === 'vdw') return { kind: 'vdw', a: 'lower', b: 'higher' };
  if (p.type === 'kmt' && p.sub === 'graham') return { kind: 'graham', faster: molar(p.A) < molar(p.B) ? 'A' : 'B', A: p.A, B: p.B };
  return null;
}

// ---------- problem text ----------
// Specific rearranged form for the hint: X2 = X1 × (ratios of the quantities that change)
function twoHint(p) {
  const held = p.hold.split(''), f = p.find;
  const r = (a, b) => `(${a}/${b})`;
  const parts = {
    P: { V: r('V₁', 'V₂'), n: r('n₂', 'n₁'), T: r('T₂', 'T₁') },
    V: { P: r('P₁', 'P₂'), n: r('n₂', 'n₁'), T: r('T₂', 'T₁') },
    T: { P: r('P₂', 'P₁'), V: r('V₂', 'V₁'), n: r('n₁', 'n₂') },
    n: { P: r('P₂', 'P₁'), V: r('V₂', 'V₁'), T: r('T₁', 'T₂') }
  }[f];
  const terms = Object.keys(parts).filter(v => !held.includes(v)).map(v => parts[v]);
  const sub = { P: 'P', V: 'V', T: 'T', n: 'n' }[f];
  return `Rearranged: ${sub}₂ = ${sub}₁ × ${terms.join(' × ')}. Check the ratios against your prediction: each one should push the answer the way you expect.`;
}

// Value of R stated with every problem whose solution uses it
function rNote(p) {
  if (p.type === 'one' || (p.type === 'dalton' && p.sub === 'water' && p.find !== 'Pg')) return ' (R = 0.08206 L·atm/(mol·K))';
  if (p.type === 'kmt' && (p.sub === 'urms' || p.sub === 'ke')) return ' (R = 8.314 J/(mol·K))';
  if ((p.type === 'stoich' && p.sub !== 'V2V') || p.type === 'real') return ' (R = 0.08206 L·atm/(mol·K))';
  return '';
}

function textFor(p) {
  const T = s => s.replace(/\{(\w+)\}/g, (m, k) => {
    if (k === 'gas' || k === 'A' || k === 'B' || k === 'known' || k === 'target') return gasHTML(p[k]);
    if (k === 'ratio') return String(p.ratio);
    if (k === 'rxn') return rxnHTML(p.rxn);
    const q = Q(p[k]); return q ? qHTML(q) : m;
  });
  return T(p.text || defaultText(p)) + rNote(p);
}

// ---------- default wording when an uploaded row leaves "text" blank ----------
const FIND_WORD = { P: 'pressure', V: 'volume', T: 'temperature', n: 'number of moles', mass: 'mass', M: 'molar mass', d: 'density', Md: 'molar mass' };
function defaultText(p) {
  const given = keys => keys.filter(k => p[k]).map(k => `{${k}}`).join(', ');
  switch (p.type) {
    case 'pconv': return 'Convert {val} to ' + unitLabel(p.to) + '.';
    case 'mano': return `Atmospheric pressure is {Patm}. In an open-end mercury manometer, the mercury in the ${p.side === 'higher' ? 'open arm' : 'arm connected to the flask'} is {h} higher than in the other arm. What is the gas pressure${p.to ? ' in ' + unitLabel(p.to) : ''}?`;
    case 'two': {
      const held = p.hold.split('').map(v => VARNAME[v]).join(' and ');
      const s1 = ['P1', 'V1', 'T1', 'n1'].filter(k => p[k]).map(k => `{${k}}`).join(', ');
      const s2 = ['P2', 'V2', 'T2', 'n2'].filter(k => p[k]).map(k => `{${k}}`).join(', ');
      return `A gas sample starts at ${s1}. ${held ? `With its ${held} held constant, it` : 'It'} changes to ${s2}. Find the new ${VARNAME[p.find]}.`;
    }
    case 'one': {
      const what = p.gas ? '{gas}' : 'an ideal gas';
      return `A sample of ${what} has ${given(['mass', 'n', 'V', 'P', 'T', 'd'])}. Find its ${FIND_WORD[p.find]}${p.find === 'M' || p.find === 'Md' ? ' and identify the gas' : ''}.`;
    }
    case 'dalton':
      if (p.sub === 'sum') return 'A gas mixture has these partial pressures: ' + p.parts.map(pr => `${gasHTML(pr[0])} ${qHTML(Q(pr[1]))}`).join(', ') + '. What is the total pressure?';
      if (p.sub === 'frac') return 'A mixture contains ' + p.moles.map(m => `${m[1]} mol ${gasHTML(m[0])}`).join(', ') + ' at a total pressure of {Ptot}. What is the partial pressure of {target}?';
      return `{gas} is collected over water at {T} with a total pressure of {Ptot}${p.V ? ', volume {V}' : ''}. Find ${p.find === 'Pg' ? 'the partial pressure of {gas}' : p.find === 'mass' ? 'the mass of {gas} collected' : 'the moles of {gas} collected'}.`;
    case 'kmt':
      if (p.sub === 'urms') return 'What is the root-mean-square speed of {gas} at {T}?';
      if (p.sub === 'ke') return 'What is the average kinetic energy of one mole of gas at {T}, in J/mol?';
      if (p.sub === 'graham') return 'Find the ratio of effusion rates, rate({A}) / rate({B}).';
      return 'An unknown gas effuses {ratio} times as fast as {known}. Find its molar mass and identify it.';
    case 'stoich':
      if (p.sub === 'V2V') return 'For the reaction {rxn}, what volume of {target} forms from (or is needed for) {V} of {known}, both at the same temperature and pressure?';
      if (p.sub === 'm2V') return 'For the reaction {rxn}, what volume of {target} at {P} and {T} is produced from {mass} of {known}?';
      return 'For the reaction {rxn}, {V} of {known} at {P} and {T} reacts or forms. What mass of {target} is involved?';
    case 'real':
      if (p.sub === 'boyle') return 'Using the van der Waals constants, find the Boyle temperature of {gas}.';
      return `{n} of {gas} is held in a {V} container at {T}. Use the van der Waals equation to find the pressure${p.find === 'Z' ? ', then the compressibility factor Z' : ''}.`;
  }
  return '';
}

// ---------- validation for uploaded rows ----------
function validateProblem(p) {
  const err = [];
  const need = (k, units, label) => {
    if (!p[k]) { err.push(`${k} is required`); return; }
    const q = Q(p[k]);
    if (!isFinite(q.v)) err.push(`${k}: "${p[k]}" is not a number with a unit`);
    else if (units && !units.includes(q.u)) err.push(`${k}: unit "${q.u}" not allowed (use ${label || units.join(', ')})`);
  };
  const P_UNITS = Object.keys(PU), V_UNITS = ['L', 'mL'], T_UNITS = ['C', 'K'];
  const formula = k => { if (!p[k]) err.push(`${k} is required`); else if (!isFinite(molar(p[k]))) err.push(`${k}: can't read formula "${p[k]}"`); };
  if (!p.id) err.push('id is required');
  if (!(p.level >= 1 && p.level <= 7)) err.push('problem_type must be 1–7');
  if (!CALC[p.type]) { err.push(`solver "${p.type}" not recognized`); return err; }
  if (p.type === 'pconv') { need('val', P_UNITS); if (!PU[p.to]) err.push('to must be a pressure unit'); }
  if (p.type === 'mano') { need('Patm', ['mmHg', 'torr']); need('h', ['mm']); if (!['higher', 'lower'].includes(p.side)) err.push('side must be "higher" (open arm higher) or "lower"'); if (p.to && !PU[p.to]) err.push('to must be a pressure unit'); }
  if (p.type === 'two') {
    const held = (p.hold || '').split('');
    if (held.some(v => !'PVTn'.includes(v))) err.push('hold may contain only P, V, T, n');
    if (!'PVTn'.includes(p.find) || !p.find) err.push('find must be P, V, T or n'); else if (held.includes(p.find)) err.push('find cannot also be held constant');
    const U = { P: P_UNITS, V: V_UNITS, T: T_UNITS, n: ['mol'] };
    'PVTn'.split('').filter(v => !held.includes(v)).forEach(v => { need(v + '1', U[v]); if (v !== p.find) need(v + '2', U[v]); });
  }
  if (p.type === 'one') {
    const req = { P: ['V', 'T'], V: ['P', 'T'], T: ['P', 'V'], n: ['P', 'V', 'T'], mass: ['P', 'V', 'T'], M: ['P', 'V', 'T', 'mass'], d: ['P', 'T'], Md: ['d', 'P', 'T'] }[p.find];
    if (!req) err.push('find must be P, V, T, n, mass, M, d or Md');
    else {
      const U = { P: P_UNITS, V: V_UNITS, T: T_UNITS, mass: ['g'], d: ['g/L'] };
      req.forEach(k => need(k, U[k]));
      if (['P', 'V', 'T'].includes(p.find) && !p.n && !p.mass) err.push('give n (mol) or mass (g) with gas');
      if ((p.mass && p.find !== 'M') || p.find === 'mass' || p.find === 'd') formula('gas');
    }
  }
  if (p.type === 'dalton') {
    if (p.sub === 'sum') { if (!p.parts || !p.parts.length) err.push('parts is required, e.g. "N2=593 mmHg; O2=159 mmHg"'); }
    else if (p.sub === 'frac') { if (!p.moles || !p.moles.length) err.push('moles is required, e.g. "He=1.50; Ne=0.50"'); else if (!p.moles.some(m => m[0] === p.target)) err.push('target must be one of the gases in moles'); need('Ptot', P_UNITS); }
    else if (p.sub === 'water') {
      need('Ptot', ['mmHg', 'torr']); need('T', ['C']);
      if (p.T && PH2O[Q(p.T).v] == null) err.push('T must be a temperature in the vapor-pressure table (0, 5, 10 … 50 °C)');
      if (!['Pg', 'n', 'mass'].includes(p.find)) err.push('find must be Pg, n or mass');
      if (p.find !== 'Pg') need('V', V_UNITS);
      formula('gas');
    } else err.push('sub must be sum, frac or water');
  }
  if (p.type === 'kmt') {
    if (p.sub === 'urms') { formula('gas'); need('T', T_UNITS); }
    else if (p.sub === 'ke') need('T', T_UNITS);
    else if (p.sub === 'graham') { formula('A'); formula('B'); }
    else if (p.sub === 'grahamM') { formula('known'); if (!(p.ratio > 0)) err.push('ratio must be a positive number'); }
    else err.push('sub must be urms, ke, graham or grahamM');
  }
  if (p.type === 'stoich') {
    const r = parseRxn(p.rxn);
    if (!r) err.push('rxn must look like "2 KClO3 -> 2 KCl + 3 O2"');
    else {
      if (!isFinite(coefOf(p, p.known))) err.push('known must be a formula written exactly as in rxn');
      if (!isFinite(coefOf(p, p.target))) err.push('target must be a formula written exactly as in rxn');
    }
    if (p.sub === 'm2V') { need('mass', ['g']); need('P', P_UNITS); need('T', T_UNITS); formula('known'); }
    else if (p.sub === 'V2m') { need('V', V_UNITS); need('P', P_UNITS); need('T', T_UNITS); formula('target'); }
    else if (p.sub === 'V2V') need('V', V_UNITS);
    else err.push('sub must be m2V, V2m or V2V');
  }
  if (p.type === 'real') {
    if (!VDW[p.gas]) err.push('gas must be one with van der Waals constants: ' + Object.keys(VDW).join(', '));
    if (p.sub === 'vdw') { need('n', ['mol']); need('V', ['L']); need('T', T_UNITS); if (p.find && !['P', 'Z'].includes(p.find)) err.push('find must be P or Z'); }
    else if (p.sub !== 'boyle') err.push('sub must be vdw or boyle');
  }
  if (!err.length) {
    try {
      const S = stepsFor(p);
      if (S.some(s => !s.choice && !(isFinite(s.ans)))) err.push('the numbers do not give a valid answer');
      if (S.some(s => !s.choice && s.ans <= 0 && s.unit !== '°C')) err.push('a step gives a zero or negative value — check the data');
    } catch (x) { err.push('could not solve: ' + x.message); }
  }
  return err;
}

// ---------- spreadsheet rows <-> problems ----------
const PROBLEM_COLS = ['id', 'problem_type', 'solver', 'sub', 'find', 'hold', 'ansU', 'text', 'src',
  'val', 'to', 'Patm', 'h', 'side', 'P', 'V', 'T', 'n', 'mass', 'gas', 'd',
  'P1', 'V1', 'T1', 'n1', 'P2', 'V2', 'T2', 'n2', 'Ptot', 'parts', 'moles', 'target', 'A', 'B', 'known', 'ratio', 'rxn'];
function rowToProblem(row) {
  const p = {};
  for (const c of PROBLEM_COLS) {
    let v = row[c]; if (v == null) continue; v = String(v).trim(); if (!v) continue;
    if (c === 'problem_type') p.level = parseInt(v, 10);
    else if (c === 'solver') p.type = v;
    else if (c === 'ratio') p.ratio = parseFloat(v);
    else if (c === 'parts' || c === 'moles') p[c] = v.split(';').map(x => x.trim()).filter(Boolean).map(x => { const [g, q] = x.split('='); return [g.trim(), c === 'moles' ? parseFloat(q) : (q || '').trim()]; });
    else p[c] = v.replace(/°C$/, '°C');
  }
  if (p.type === 'two' && p.hold == null) p.hold = '';
  return p;
}
function problemToRow(p) {
  const r = {};
  for (const c of PROBLEM_COLS) {
    let v = c === 'problem_type' ? p.level : c === 'solver' ? p.type : p[c];
    if (v == null) { r[c] = ''; continue; }
    if (c === 'parts' || c === 'moles') v = v.map(x => `${x[0]}=${x[1]}`).join('; ');
    r[c] = String(v);
  }
  return r;
}

if (typeof module !== 'undefined') module.exports = { molar, formulaMass, parseRxn, rxnHTML, VDW, ATOMIC, defaultText, validateProblem, PROBLEM_COLS, rowToProblem, problemToRow, PU, VU, GAS, PH2O, Q, CALC, FLAGS, stepsFor, decodeFor, isRight, matchDiag, parseNum, fmt, textFor, lawName, holdKey, masterEqHTML, reducedEqHTML, R_ATM, R_J, nearestGas, gasHTML, qHTML, unitLabel };
