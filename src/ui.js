// Gas Laws Workbench — user interface
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const strip = s => String(s).replace(/<[^>]+>/g, '');
const VARS = ['P', 'V', 'n', 'T'];
const VLABEL = { P: 'pressure', V: 'volume', n: 'moles', T: 'temperature' };
let ACTIVE = PROBLEMS;

// ---------- tabs ----------
function showTab(name) {
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  $$('section.tab').forEach(s => s.classList.toggle('on', s.id === 'tab-' + name));
  if (name === 'lab') labStart(); else labStop();
  window.scrollTo(0, 0);
}
$$('nav button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

// ---------- shared: cross-out chips ----------
function chipsHTML(held) {
  return VARS.map(v => `<button class="chip${held.includes(v) ? ' x' : ''}" data-v="${v}" title="${VLABEL[v]}">${v}</button>`).join('');
}
function lawTag(held) {
  const name = lawName(held);
  return name ? `<span class="law">This is ${name}</span>` : `<span class="law none">No special name</span>`;
}

// ---------- Review ----------
(function review() {
  let held = [];
  const draw = () => {
    $('#rv-eq').innerHTML = masterEqHTML(held);
    $('#rv-chips').innerHTML = chipsHTML(held);
    $('#rv-red').innerHTML = held.length === 4 ? '—' : reducedEqHTML(held);
    $('#rv-law').innerHTML = held.length && held.length < 4 ? lawTag(held) : '';
  };
  $('#rv-chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    const v = b.dataset.v;
    held = held.includes(v) ? held.filter(x => x !== v) : [...held, v];
    draw();
  });
  draw();
  const ks = Object.keys(PH2O);
  let t = '<tr><th>T (°C)</th>' + ks.map(k => `<td>${k}</td>`).join('') + '</tr><tr><th>P<sub>H₂O</sub> (mmHg)</th>' + ks.map(k => `<td>${PH2O[k]}</td>`).join('') + '</tr>';
  $('#vp-table').innerHTML = t;
  $('#vdw-table').innerHTML = '<tr><th>Gas</th><th>a (L²·atm/mol²)</th><th>b (L/mol)</th></tr>' + Object.keys(VDW).map(g => `<tr><td>${gasHTML(g)}</td><td>${VDW[g][0]}</td><td>${VDW[g][1]}</td></tr>`).join('');
})();
// constants students need that are not in the problem text
function givensNote(p) {
  if (p.type === 'real') { const c = VDW[p.gas]; return `<p class="note">Van der Waals constants for ${gasHTML(p.gas)}: a = ${c[0]} L²·atm/mol², b = ${c[1]} L/mol.</p>`; }
  return '';
}

// ---------- problem pickers ----------
function fillLevels(sel) {
  sel.innerHTML = '<option value="all">All problem types</option>' + Object.keys(LEVELS).map(k => `<option value="${k}">${k} · ${LEVELS[k]}</option>`).join('');
}
function probsAt(level) { return ACTIVE.filter(p => level === 'all' || String(p.level) === String(level)); }
function fillProbs() {
  const lv = $('#c-level').value;
  $('#c-prob').innerHTML = '<option value="">— choose a problem —</option>' + probsAt(lv).map(p => {
    const t = strip(textFor(p)); return `<option value="${p.id}">${p.id} · ${t.length > 70 ? t.slice(0, 68) + '…' : t}</option>`;
  }).join('');
}
fillLevels($('#c-level')); fillLevels($('#t-level')); fillProbs();
$('#c-level').addEventListener('change', fillProbs);
$('#c-prob').addEventListener('change', e => { const p = ACTIVE.find(q => q.id === e.target.value); if (p) loadCoach(p); });
$('#c-pick').addEventListener('click', () => {
  const list = probsAt($('#c-level').value).filter(p => !C.p || p.id !== C.p.id);
  const p = list[Math.floor(Math.random() * list.length)];
  if (!p) return;
  $('#c-prob').value = p.id; loadCoach(p);
});

// ---------- drawings ----------
function manometerSVG(p) {
  const up = p.side === 'higher'; // open arm higher
  const base = 150, d = 32;
  const yOpen = up ? base - d : base + d, yFlask = up ? base + d : base - d;
  return `<svg viewBox="0 0 370 250" width="340" style="display:block;margin-top:10px">
  <circle cx="60" cy="90" r="42" fill="#e8f1fa" stroke="#456" stroke-width="2"/>
  <text x="60" y="95" text-anchor="middle" font-size="13" fill="#245">gas</text>
  <path d="M102 90 H170 V215" fill="none" stroke="#456" stroke-width="12" stroke-linecap="round"/>
  <path d="M102 90 H170 V215" fill="none" stroke="#fff" stroke-width="8"/>
  <path d="M170 215 Q170 235 195 235 Q220 235 220 215 V40" fill="none" stroke="#456" stroke-width="12"/>
  <path d="M170 215 Q170 235 195 235 Q220 235 220 215 V40" fill="none" stroke="#fff" stroke-width="8"/>
  <rect x="166" y="${yFlask}" width="8" height="${215 - yFlask}" fill="#9aa3ad"/>
  <rect x="216" y="${yOpen}" width="8" height="${215 - yOpen}" fill="#9aa3ad"/>
  <path d="M170 215 Q170 231 195 231 Q220 231 220 215" fill="none" stroke="#9aa3ad" stroke-width="8"/>
  <text x="220" y="30" text-anchor="middle" font-size="12" fill="#555">open to air</text>
  <line x1="150" y1="${Math.min(yOpen, yFlask)}" x2="250" y2="${Math.min(yOpen, yFlask)}" stroke="#c45a00" stroke-dasharray="4 3"/>
  <line x1="150" y1="${Math.max(yOpen, yFlask)}" x2="250" y2="${Math.max(yOpen, yFlask)}" stroke="#c45a00" stroke-dasharray="4 3"/>
  <line x1="262" y1="${Math.min(yOpen, yFlask)}" x2="262" y2="${Math.max(yOpen, yFlask)}" stroke="#c45a00" stroke-width="2" marker-start="url(#ar)" marker-end="url(#ar)"/>
  <defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#c45a00"/></marker></defs>
  <text x="270" y="${base + 5}" font-size="13" fill="#c45a00">h = ${Q(p.h).s} mm</text>
  <text x="195" y="248" text-anchor="middle" font-size="11" fill="#666">mercury</text></svg>`;
}

function stateTable(p) {
  const held = p.hold.split('');
  const cell = (v, i) => {
    if (held.includes(v)) return `<td class="held">${p[v + '1'] ? qHTML(Q(p[v + '1'])) : 'same'}</td>`;
    if (i === 2 && v === p.find) return '<td class="unk">?</td>';
    const q = p[v + i]; return `<td>${q ? qHTML(Q(q)) : ''}</td>`;
  };
  return `<table class="st"><tr><th></th><th>State 1</th><th>State 2</th></tr>${VARS.map(v => `<tr><th><i>${v}</i></th>${cell(v, 1)}${cell(v, 2)}</tr>`).join('')}</table>`;
}

// ---------- Coaching ----------
const C = { p: null, S: null, dk: null, si: 0, tries: 0, shown: 0, dTries: 0, held: [], hints: 0 };

function loadCoach(p) {
  C.p = p; C.S = stepsFor(p); C.dk = decodeFor(p); C.si = 0; C.tries = 0; C.shown = 0; C.dTries = 0; C.held = []; C.hints = 0;
  C.S.forEach(s => { s.wasShown = false; s.hintUsed = false; });
  const area = $('#c-area');
  area.innerHTML = `<div class="card"><div class="ptag">Problem type ${p.level} · ${LEVELS[p.level]}${p.src ? ' · ' + p.src : ''}</div>
    <p class="ptext">${textFor(p)}</p>${givensNote(p)}${p.type === 'mano' ? manometerSVG(p) : ''}${p.type === 'dalton' && p.sub === 'water' ? '<p class="note">Vapor pressure of water: see the table in Review §5, or <a href="#" id="c-vp">show it here</a>.</p><div id="c-vpt"></div>' : ''}</div>
    <div id="c-decode"></div><div id="c-steps"></div><div id="c-sum"></div>`;
  const vp = $('#c-vp');
  if (vp) vp.addEventListener('click', e => { e.preventDefault(); $('#c-vpt').innerHTML = `<table class="st">${$('#vp-table').innerHTML}</table>`; });
  if (C.dk) renderDecode(); else startSteps();
}

function mark(id, ok) { const m = $('#' + id); if (m) { m.className = 'mk ' + (ok ? 'ok' : 'no'); m.textContent = ok ? '✓' : '✗'; } }
function clearHints(box) { $$('.hint.auto', box).forEach(h => h.remove()); }
function addHint(id, text, auto) {
  const m = $('#' + id); if (!m) return;
  const q = m.closest('.q');
  if (q && $('.hint:not(.auto)', q)) return; // already revealed by the student
  m.insertAdjacentHTML('afterend', `<span class="hint${auto ? ' auto' : ''}">${text}</span>`);
}

const DECODE = {
  mano: {
    html: () => `<div class="q"><b>a.</b> Look at the mercury levels. Which relationship gives the gas pressure?<br>
      <label><input type="radio" name="d-sign" value="+"> P<sub>gas</sub> = P<sub>atm</sub> + h</label>&nbsp;&nbsp;
      <label><input type="radio" name="d-sign" value="-"> P<sub>gas</sub> = P<sub>atm</sub> − h</label><span class="mk" id="mk-a"></span></div>`,
    parts: k => [['mk-a', () => ($('input[name=d-sign]:checked') || {}).value === k.sign,
      'Mercury is pushed away from the side with the higher pressure. If the open arm is higher, the gas is pushing harder than the air.',
      () => { $(`input[name=d-sign][value="${k.sign}"]`).checked = true; }]],
    done: k => `P<sub>gas</sub> = P<sub>atm</sub> ${k.sign === '+' ? '+' : '−'} h`
  },
  two: {
    html: () => `<p>Start from the one equation for a fixed sample going from state 1 to state 2:</p>
      <div class="eqbox" id="d-eq"></div>
      <div class="q"><b>a.</b> What are you solving for?
        <select id="d-find"><option value="">—</option>${VARS.map(v => `<option value="${v}">${v}₂ (${VLABEL[v]})</option>`).join('')}</select><span class="mk" id="mk-a"></span></div>
      <div class="q"><b>b.</b> Which quantities stay the same from state 1 to state 2? Click each one to cross it out.
        <div class="chips" id="d-chips"></div><span class="mk" id="mk-b"></span></div>
      <div class="q"><b>c.</b> Predict before you calculate: compared with its state-1 value, the unknown will be
        <select id="d-pred"><option value="">—</option><option value="up">larger</option><option value="down">smaller</option><option value="same">the same</option></select><span class="mk" id="mk-c"></span></div>`,
    init: () => {
      const draw = () => { $('#d-eq').innerHTML = masterEqHTML(C.held); $('#d-chips').innerHTML = chipsHTML(C.held); };
      $('#d-chips').addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        const v = b.dataset.v; C.held = C.held.includes(v) ? C.held.filter(x => x !== v) : [...C.held, v]; draw();
      });
      draw();
    },
    parts: k => [
      ['mk-a', () => $('#d-find').value === k.find, 'Read the question: which quantity does it ask for in the final state?',
        () => { $('#d-find').value = k.find; }],
      ['mk-b', () => holdKey(C.held) === holdKey(k.held),
        'A quantity is held constant when the problem says "constant" or "same", or implies it: a sealed or rigid container (V), a sample with no gas added or removed (n). Cross out only those.',
        () => { C.held = [...k.held]; $('#d-eq').innerHTML = masterEqHTML(C.held); $('#d-chips').innerHTML = chipsHTML(C.held); }],
      ['mk-c', () => $('#d-pred').value === k.predict,
        'Reason it out: P and V move in opposite directions; V moves with T and with n; P moves with T and with n. If two changes compete, weigh which is bigger.',
        () => { $('#d-pred').value = k.predict; }]
    ],
    done: k => `<div>${reducedEqHTML(k.held)} ${lawTag(k.held)}</div>${stateTable(C.p)}`
  },
  one: {
    html: () => `<p>One state, so use <span class="formula">PV = nRT</span> directly.</p>
      <div class="q"><b>a.</b> What are you solving for?
        <select id="d-find"><option value="">—</option><option value="P">pressure, P</option><option value="V">volume, V</option><option value="T">temperature, T</option><option value="n">moles, n</option><option value="mass">mass (grams)</option><option value="M">molar mass, M</option><option value="d">density, d</option></select><span class="mk" id="mk-a"></span></div>
      <div class="q"><b>b.</b> We will work in atm, liters, moles and kelvin. Which value of R matches?
        <select id="d-R"><option value="">—</option><option value="atm">0.08206 L·atm/(mol·K)</option><option value="J">8.314 J/(mol·K)</option><option value="mm">62.36 L·mmHg/(mol·K)</option></select><span class="mk" id="mk-b"></span></div>
      <div class="q"><b>c.</b> Which given values must be converted before you substitute? (Check all that apply — maybe none.)<br>
        <label><input type="checkbox" class="d-cv" value="TK"> °C → K</label>&nbsp;
        <label><input type="checkbox" class="d-cv" value="VL"> mL → L</label>&nbsp;
        <label><input type="checkbox" class="d-cv" value="Patm"> pressure → atm</label>&nbsp;
        <label><input type="checkbox" class="d-cv" value="nmol"> grams → moles</label><span class="mk" id="mk-c"></span></div>`,
    parts: k => [
      ['mk-a', () => $('#d-find').value === k.find, 'What quantity does the last sentence of the problem ask for?', () => { $('#d-find').value = k.find; }],
      ['mk-b', () => $('#d-R').value === 'atm', 'R must carry exactly the units you work in: L, atm, mol, K.', () => { $('#d-R').value = 'atm'; }],
      ['mk-c', () => { const s = $$('.d-cv:checked').map(c => c.value).sort().join(); return s === [...k.conv].sort().join(); },
        'Check each given value: temperature must be in K, volume in L, pressure in atm, and the amount in moles. (When you are finding molar mass, keep the grams for the last step.)',
        () => { $$('.d-cv').forEach(c => c.checked = k.conv.includes(c.value)); }]
    ],
    done: k => ({ P: 'P = nRT / V', V: 'V = nRT / P', T: 'T = PV / (nR)', n: 'n = PV / (RT)', mass: 'n = PV / (RT), then mass = n × M', M: C.p.find === 'Md' ? 'M = dRT / P' : 'n = PV / (RT), then M = mass ÷ n', d: 'd = PM / (RT)' })[k.find]
  },
  water: {
    html: () => `<div class="q"><b>a.</b> The collection bottle holds the gas and water vapor. Which pressure belongs to the gas you collected?<br>
      <label><input type="radio" name="d-pg" value="tot"> P<sub>total</sub></label>&nbsp;&nbsp;
      <label><input type="radio" name="d-pg" value="sub"> P<sub>total</sub> − P<sub>H₂O</sub></label>&nbsp;&nbsp;
      <label><input type="radio" name="d-pg" value="add"> P<sub>total</sub> + P<sub>H₂O</sub></label><span class="mk" id="mk-a"></span></div>`,
    parts: k => [['mk-a', () => ($('input[name=d-pg]:checked') || {}).value === 'sub',
      "Dalton's law: P(total) = P(gas) + P(H₂O). Solve that for P(gas).", () => { $('input[name=d-pg][value=sub]').checked = true; }]],
    done: () => 'P<sub>gas</sub> = P<sub>total</sub> − P<sub>H₂O</sub>, then PV = nRT'
  },
  urms: {
    html: k => `<div class="q"><b>a.</b> Which R?
        <select id="d-R"><option value="">—</option><option value="atm">0.08206 L·atm/(mol·K)</option><option value="J">8.314 J/(mol·K)</option></select><span class="mk" id="mk-a"></span></div>
      ${k.M ? `<div class="q"><b>b.</b> In u<sub>rms</sub> = √(3RT/M), the molar mass goes in as
        <select id="d-M"><option value="">—</option><option value="g">g/mol</option><option value="kg">kg/mol</option></select><span class="mk" id="mk-b"></span></div>` : ''}`,
    parts: k => {
      const a = [['mk-a', () => $('#d-R').value === 'J', 'You want energy (J) or speed (m/s), so R must be in joules: 8.314 J/(mol·K).', () => { $('#d-R').value = 'J'; }]];
      if (k.M) a.push(['mk-b', () => $('#d-M').value === 'kg', '1 J = 1 kg·m²/s². For the units to come out in m/s, M must be in kg/mol.', () => { $('#d-M').value = 'kg'; }]);
      return a;
    },
    done: k => k.M ? 'u<sub>rms</sub> = √(3RT/M) with R = 8.314 J/(mol·K), M in kg/mol' : 'KE = (3/2)RT with R = 8.314 J/(mol·K)'
  },
  stoich: {
    html: k => {
      const opts = [...new Set([`${k.ct}/${k.ck}`, `${k.ck}/${k.ct}`, '1/1', ...(k.ct === k.ck ? ['1/2', '2/1'] : [])])];
      return `<div class="q"><b>a.</b> From the balanced equation: moles of ${gasHTML(k.target)} = moles of ${gasHTML(k.known)} ×
        <select id="d-ratio"><option value="">—</option>${opts.map(o => `<option value="${o}">(${o})</option>`).join('')}</select><span class="mk" id="mk-a"></span></div>
      ${k.needR ? `<div class="q"><b>b.</b> Which given values must be converted before you use them? (Check all that apply.)<br>
        <label><input type="checkbox" class="d-cv" value="TK"> °C → K</label>&nbsp;
        <label><input type="checkbox" class="d-cv" value="VL"> mL → L</label>&nbsp;
        <label><input type="checkbox" class="d-cv" value="Patm"> pressure → atm</label>&nbsp;
        <label><input type="checkbox" class="d-cv" value="nmol"> grams → moles</label><span class="mk" id="mk-b"></span></div>`
      : `<div class="q"><b>b.</b> Both gases are at the same temperature and pressure. Do you need PV = nRT (and R) to solve this?
        <select id="d-needR"><option value="">—</option><option value="yes">yes</option><option value="no">no</option></select><span class="mk" id="mk-b"></span></div>`}`;
    },
    parts: k => [
      ['mk-a', () => $('#d-ratio').value === `${k.ct}/${k.ck}`, 'Use the coefficients: (coefficient of what you want) ÷ (coefficient of what you have).', () => { $('#d-ratio').value = `${k.ct}/${k.ck}`; }],
      k.needR
        ? ['mk-b', () => { const s = $$('.d-cv:checked').map(c => c.value).sort().join(); return s === [...k.conv].sort().join(); },
          'Grams of a substance must become moles before the mole ratio. For PV = nRT, temperature must be in K, volume in L and pressure in atm.',
          () => { $$('.d-cv').forEach(c => c.checked = k.conv.includes(c.value)); }]
        : ['mk-b', () => $('#d-needR').value === 'no', 'At the same T and P, V is proportional to n (Avogadro), so gas volumes combine in the same ratio as moles. R cancels out.', () => { $('#d-needR').value = 'no'; }]
    ],
    done: k => k.needR ? `amount → moles of ${gasHTML(k.known)} → × (${k.ct}/${k.ck}) → moles of ${gasHTML(k.target)} → PV = nRT or mass` : `V(${gasHTML(k.target)}) = V(${gasHTML(k.known)}) × (${k.ct}/${k.ck}) — no R needed`
  },
  vdw: {
    html: () => `<p>The van der Waals equation corrects PV = nRT twice: <span class="formula">[P + a(n/V)²](V − nb) = nRT</span></p>
      <div class="q"><b>a.</b> The <b>a</b> term accounts for attractions between particles. Compared with the ideal pressure, it makes the real pressure
        <select id="d-a"><option value="">—</option><option value="higher">higher</option><option value="lower">lower</option></select><span class="mk" id="mk-a"></span></div>
      <div class="q"><b>b.</b> The <b>b</b> term accounts for the volume of the particles themselves. Compared with the ideal pressure, it makes the real pressure
        <select id="d-b"><option value="">—</option><option value="higher">higher</option><option value="lower">lower</option></select><span class="mk" id="mk-b"></span></div>`,
    parts: k => [
      ['mk-a', () => $('#d-a').value === k.a, 'Pulled back by their neighbors, particles hit the walls less hard.', () => { $('#d-a').value = k.a; }],
      ['mk-b', () => $('#d-b').value === k.b, 'With less empty space to move in, particles hit the walls more often.', () => { $('#d-b').value = k.b; }]
    ],
    done: () => 'P = nRT/(V − nb) − a·n²/V². Which correction wins decides whether Z is below or above 1.'
  },
  graham: {
    html: k => `<div class="q"><b>a.</b> Which gas effuses faster?
      <label><input type="radio" name="d-f" value="A"> ${gasHTML(k.A)}</label>&nbsp;&nbsp;
      <label><input type="radio" name="d-f" value="B"> ${gasHTML(k.B)}</label><span class="mk" id="mk-a"></span></div>`,
    parts: k => [['mk-a', () => ($('input[name=d-f]:checked') || {}).value === k.faster, 'Lighter particles move faster at the same temperature. Compare the molar masses.',
      () => { $(`input[name=d-f][value=${k.faster}]`).checked = true; }]],
    done: k => `The ${k.faster === 'A' ? 'first' : 'second'} gas is lighter, so it is faster. rate(A)/rate(B) = √(M(B)/M(A))`
  }
};

function renderDecode() {
  const k = C.dk, D = DECODE[k.kind];
  $('#c-decode').innerHTML = `<div class="card" id="dec"><h3>Step 1 · Decode the problem</h3>${D.html(k)}
    <div class="row" style="margin-top:8px"><button class="b" id="d-check">Check</button><span id="d-show"></span></div><div class="fb" id="d-fb"></div></div>`;
  if (D.init) D.init(k);
  D.parts(k).forEach(([id, , hint]) => {
    const m = $('#' + id);
    m.insertAdjacentHTML('beforebegin', `<button class="hbtn" data-for="${id}">Hint</button>`);
    const btn = m.previousElementSibling;
    btn.addEventListener('click', () => { $$('.hint.auto', btn.closest('.q')).forEach(h => h.remove()); addHint(id, hint); btn.disabled = true; C.hints++; });
  });
  $('#d-check').addEventListener('click', () => checkDecode());
}

function checkDecode(force) {
  const k = C.dk, D = DECODE[k.kind], box = $('#dec');
  const parts = D.parts(k);
  if (force) parts.forEach(p => p[3]());
  clearHints(box);
  let all = true;
  parts.forEach(([id, test]) => { const ok = test(); mark(id, ok); if (!ok) all = false; });
  if (all) {
    $('#d-fb').innerHTML = `<span class="good">✓ Decoded.</span> <div style="margin-top:6px">Plan: ${D.done(k)}</div>`;
    $('#d-check').remove(); $('#d-show').innerHTML = '';
    if (force) C.shown++;
    $$('#dec select, #dec input').forEach(el => el.disabled = true);
    $$('#dec .chip, #dec .hbtn').forEach(el => el.disabled = true);
    startSteps();
    return;
  }
  C.dTries++;
  $('#d-fb').innerHTML = '<span class="bad">Not all parts are right yet — see the marks.</span>';
  if (C.dTries >= 2) parts.forEach(([id, test, hint]) => { if (!test()) addHint(id, hint, true); });
  if (C.dTries >= 3 && !$('#d-showbtn')) {
    $('#d-show').innerHTML = '<button class="b2" id="d-showbtn">Show me</button>';
    $('#d-showbtn').addEventListener('click', () => checkDecode(true));
  }
}

function startSteps() { C.si = 0; C.tries = 0; renderSteps(); }

function inputFor(s, id) {
  if (s.choice) return `<select id="${id}"><option value="">— choose —</option>${s.choice.map(g => `<option value="${g}">${strip(gasHTML(g))} (${GAS[g]} g/mol)</option>`).join('')}</select>`;
  return `<input type="text" class="ans" id="${id}" autocomplete="off" inputmode="decimal"><span class="unit">${s.unit}</span>`;
}

function renderSteps() {
  const S = C.S;
  let html = `<div class="card"><h3>Step ${C.dk ? 2 : 1} · Solve</h3><ol class="steps">`;
  S.forEach((s, i) => {
    if (i < C.si) html += `<li class="done"><span class="sl">${s.label}</span>${s.wasShown ? '<span class="shownTag">shown</span>' : s.hintUsed ? '<span class="shownTag">hint</span>' : ''}<span class="sw">${s.show}</span></li>`;
    else if (i === C.si) html += `<li><div>${s.label}</div><div class="row" style="margin-top:4px">${inputFor(s, 's-in')}<button class="b" id="s-check">Check</button><button class="hbtn" id="s-hintbtn"${s.hintUsed ? ' disabled' : ''}>Hint</button><span id="s-show"></span></div><div id="s-hint">${s.hintUsed ? `<span class="hint">${s.hint}</span>` : ''}</div><div class="fb" id="s-fb"></div></li>`;
  });
  html += '</ol></div>';
  $('#c-steps').innerHTML = html;
  if (C.si >= S.length) { renderSummary(); return; }
  const inp = $('#s-in');
  inp.focus();
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') checkStep(); });
  $('#s-check').addEventListener('click', () => checkStep());
  $('#s-hintbtn').addEventListener('click', e => {
    const s = S[C.si]; if (!s.hintUsed) { s.hintUsed = true; C.hints++; }
    $('#s-hint').innerHTML = `<span class="hint">${s.hint}</span>`; e.target.disabled = true;
  });
}

function checkStep(force) {
  const s = C.S[C.si];
  if (force) { s.wasShown = true; C.shown++; C.si++; C.tries = 0; renderSteps(); return; }
  const raw = $('#s-in').value;
  let ok;
  if (s.choice) ok = raw === s.ans;
  else {
    const x = parseNum(raw);
    if (isNaN(x)) { $('#s-fb').innerHTML = '<span class="bad">Enter a number (for example 2.45 or 1.2e-3).</span>'; return; }
    ok = isRight(s, x);
    if (!ok) {
      C.tries++;
      const d = matchDiag(s, x);
      let msg = d ? `<span class="diag">${d.msg}</span>` : '<span class="bad">Not quite. Check your arithmetic and units.</span>';
      if (C.tries >= 2 && !s.hintUsed) msg += `<span class="hint">${s.hint}</span>`;
      $('#s-fb').innerHTML = msg;
      if (C.tries >= 3 && !$('#s-showbtn')) { $('#s-show').innerHTML = '<button class="b2" id="s-showbtn">Show me</button>'; $('#s-showbtn').addEventListener('click', () => checkStep(true)); }
      return;
    }
  }
  if (!ok) {
    C.tries++;
    let msg = '<span class="bad">Not that one.</span>';
    if (C.tries >= 2 && !s.hintUsed) msg += `<span class="hint">${s.hint}</span>`;
    $('#s-fb').innerHTML = msg;
    if (C.tries >= 3 && !$('#s-showbtn')) { $('#s-show').innerHTML = '<button class="b2" id="s-showbtn">Show me</button>'; $('#s-showbtn').addEventListener('click', () => checkStep(true)); }
    return;
  }
  C.si++; C.tries = 0; renderSteps();
}

function answerHTML(S) {
  const f = S[S.finalIndex];
  let a = `${fmt(f.ans)} ${f.unit}`;
  const id = S.find(s => s.choice);
  if (id) a += ` — the gas is ${gasHTML(id.ans)}`;
  const z = S.find(s => s.key === 'Z');
  if (z) { const P = S.find(s => s.key === 'x'); a = `P = ${fmt(P.ans)} atm, Z = ${fmt(z.ans)} — ${z.ans < 1 ? 'Z < 1: attractions win' : 'Z > 1: particle volume wins'}`; }
  return a;
}

function renderSummary() {
  const p = C.p;
  const law = p.type === 'two' ? `<p>Equation used: ${reducedEqHTML(p.hold.split(''))} ${lawTag(p.hold.split(''))}</p>` : '';
  $('#c-sum').innerHTML = `<div class="card summary"><h3>Summary</h3><p class="big">${answerHTML(C.S)}</p>${law}
    <p class="note">${C.shown || C.hints ? `Help used: ${C.hints} hint${C.hints === 1 ? '' : 's'}, ${C.shown} step${C.shown === 1 ? '' : 's'} shown. Try a similar problem with less help.` : 'Solved without hints or shown steps. Nice work.'}</p>
    <div class="row"><button class="b" id="c-next">Next problem</button><button class="b2" id="c-again">Try this one again</button></div></div>`;
  $('#c-next').addEventListener('click', () => $('#c-pick').click());
  $('#c-again').addEventListener('click', () => loadCoach(p));
  $('#c-sum').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---------- Testing ----------
const T = { p: null, S: null, tries: 0, done: false, att: 0, solved: 0, first: 0, last: null };
function score() { $('#t-score').textContent = `Solved ${T.solved} of ${T.att} attempted · ${T.first} on the first try`; }
function newTest() {
  const list = probsAt($('#t-level').value).filter(p => p.id !== T.last);
  const p = list[Math.floor(Math.random() * list.length)];
  if (!p) return;
  T.p = p; T.S = stepsFor(p); T.tries = 0; T.done = false; T.counted = false; T.last = p.id; T.hi = 0;
  const f = T.S[T.S.finalIndex];
  $('#t-area').innerHTML = `<div class="card"><div class="ptag">Problem type ${p.level} · ${LEVELS[p.level]}</div><p class="ptext">${textFor(p)}</p>${givensNote(p)}
    ${p.type === 'mano' ? manometerSVG(p) : ''}
    <div class="row" style="margin-top:10px"><span>${f.label}:</span><input type="text" class="ans" id="t-in" autocomplete="off"><span class="unit">${f.unit}</span>
    <button class="b" id="t-check">Check</button><button class="hbtn" id="t-hintbtn">Hint (1 of ${T.S.length})</button><span id="t-more"></span></div>
    <ol class="plan" id="t-hints"></ol><div class="fb" id="t-fb"></div>
    <div class="row" style="margin-top:12px"><button class="b2" id="t-coach">Coach me through this one</button></div></div>`;
  $('#t-in').focus();
  $('#t-in').addEventListener('keydown', e => { if (e.key === 'Enter') checkTest(); });
  $('#t-check').addEventListener('click', checkTest);
  $('#t-hintbtn').addEventListener('click', e => {
    const s = T.S[T.hi++];
    $('#t-hints').insertAdjacentHTML('beforeend', `<li><b>${s.label}</b> — ${s.hint}</li>`);
    if (T.hi >= T.S.length) e.target.disabled = true; else e.target.textContent = `Hint (${T.hi + 1} of ${T.S.length})`;
  });
  $('#t-coach').addEventListener('click', () => { showTab('coach'); $('#c-level').value = 'all'; fillProbs(); $('#c-prob').value = p.id; loadCoach(p); });
  score();
}
function solutionHTML(S) { return `<ol class="plan">${S.map(s => `<li>${s.label}: <span style="font-family:Georgia,serif">${s.show}</span></li>`).join('')}</ol>`; }
function checkTest() {
  if (T.done) return;
  const f = T.S[T.S.finalIndex];
  const x = parseNum($('#t-in').value);
  if (isNaN(x)) { $('#t-fb').innerHTML = '<span class="bad">Enter a number.</span>'; return; }
  if (!T.counted) { T.att++; T.counted = true; }
  if (isRight(f, x)) {
    T.done = true; T.solved++; if (T.tries === 0) T.first++;
    $('#t-fb').innerHTML = `<span class="good">✓ Correct: ${answerHTML(T.S)}</span><details><summary>See the full solution</summary>${solutionHTML(T.S)}</details>`;
    $('#t-more').innerHTML = '<button class="b2" id="t-next">Next problem</button>';
    $('#t-next').addEventListener('click', newTest);
    score(); return;
  }
  T.tries++;
  const d = matchDiag(f, x);
  let msg = d ? `<span class="diag">${d.msg}</span>` : '<span class="bad">Not quite. Check your conversions and arithmetic.</span>';
  if (T.tries >= 2) msg += `<div style="margin-top:6px"><b>Plan:</b><ol class="plan">${T.S.map(s => `<li>${s.label}</li>`).join('')}</ol></div>`;
  $('#t-fb').innerHTML = msg;
  if (T.tries >= 3 && !$('#t-sol')) {
    $('#t-more').innerHTML = '<button class="b2" id="t-sol">Show the solution</button>';
    $('#t-sol').addEventListener('click', () => { T.done = true; $('#t-fb').innerHTML = `<div><b>Answer:</b> ${answerHTML(T.S)}</div>${solutionHTML(T.S)}`; $('#t-more').innerHTML = '<button class="b2" id="t-next">Next problem</button>'; $('#t-next').addEventListener('click', newTest); });
  }
  score();
}
$('#t-new').addEventListener('click', newTest);
score();

// ---------- Gas Lab ----------
const LR = { P: [0.25, 4, 0.01, 'atm'], V: [2, 100, 0.1, 'L'], n: [0.2, 3, 0.01, 'mol'], T: [100, 800, 1, 'K'] };
const L = { s: { P: 1, n: 1, T: 300, V: 0 }, held: ['n', 'T'], change: 'P', pts: [], built: false, raf: null, parts: [], last: 0 };
L.s.V = R_ATM * L.s.n * L.s.T / L.s.P;
function labResp() { return VARS.find(v => !L.held.includes(v) && v !== L.change); }
function solveFor(v, s) {
  switch (v) { case 'P': return s.n * R_ATM * s.T / s.V; case 'V': return s.n * R_ATM * s.T / s.P; case 'n': return s.P * s.V / (R_ATM * s.T); case 'T': return s.P * s.V / (s.n * R_ATM); }
}
function inRange(v, x) { return x >= LR[v][0] - 1e-9 && x <= LR[v][1] + 1e-9; }
function fmtV(v, x) { return v === 'T' ? Math.round(x) : v === 'V' ? x.toFixed(1) : x.toFixed(2); }

function labBuild() {
  $('#lab-cards').innerHTML = VARS.map(v => `<div class="vcard" data-v="${v}">
    <div class="vh"><span><b>${v}</b> ${VLABEL[v]}</span><span class="vval" id="lv-${v}"></span></div>
    <input type="range" id="lr-${v}" min="${LR[v][0]}" max="${LR[v][1]}" step="${LR[v][2]}">
    <div class="vopts"><label><input type="checkbox" class="lhold" value="${v}"> hold constant</label>
    <label><input type="radio" name="lchg" class="lchg" value="${v}"> I change this</label></div>
    <div class="vrole" id="lrole-${v}"></div></div>`).join('');
  $$('.lhold').forEach(c => c.addEventListener('change', () => {
    const v = c.value;
    if (c.checked) { L.held.push(v); if (L.held.length > 2) L.held.shift(); }
    else L.held = L.held.filter(x => x !== v);
    if (L.held.includes(L.change) || !L.change) L.change = VARS.find(x => !L.held.includes(x));
    L.pts = []; labSync();
  }));
  $$('.lchg').forEach(r => r.addEventListener('change', () => { if (!L.held.includes(r.value)) { L.change = r.value; L.pts = []; } labSync(); }));
  VARS.forEach(v => $('#lr-' + v).addEventListener('input', e => labMove(v, parseFloat(e.target.value))));
  $('#lab-inv').addEventListener('change', labPlot);
  $('#lab-clear').addEventListener('click', () => { L.pts = []; labPlot(); });
  $('#lab-reset').addEventListener('click', () => { L.s = { P: 1, n: 1, T: 300, V: R_ATM * 300 }; L.pts = []; labSync(); });
  $('#lab-svg').innerHTML = `
    <rect x="66" y="56" width="8" height="280" fill="#7d8790"/><rect x="206" y="56" width="8" height="280" fill="#7d8790"/>
    <rect x="66" y="330" width="148" height="8" fill="#7d8790"/>
    <rect id="lab-gas" x="74" y="0" width="132" height="0" fill="#eaf3fb"/>
    <g id="lab-parts"></g>
    <rect id="lab-piston" x="74" y="0" width="132" height="12" fill="#55606b"/>
    <rect id="lab-rod" x="134" y="0" width="12" height="16" fill="#55606b"/>
    <g id="lab-weights"></g>
    <g id="lab-pins"></g>
    <g id="lab-flame"></g>
    <circle cx="66" cy="318" r="7" fill="#fff" stroke="#c45a00" stroke-width="2"/><line x1="20" y1="318" x2="59" y2="318" stroke="#c45a00" stroke-width="3"/>
    <text x="2" y="302" font-size="11" fill="#c45a00">gas in/out</text>
    <text x="140" y="-52" text-anchor="middle" font-size="12" fill="#555" id="lab-cap"></text>`;
  L.built = true;
}

function labMove(v, x) {
  if (L.held.length !== 2 || v !== L.change) return;
  const r = labResp(), s = Object.assign({}, L.s); s[v] = x; s[r] = solveFor(r, s);
  if (!inRange(r, s[r])) { $('#lab-note').textContent = `${VLABEL[r][0].toUpperCase() + VLABEL[r].slice(1)} would go off the scale of the apparatus.`; $('#lr-' + v).value = L.s[v]; return; }
  $('#lab-note').textContent = '';
  L.s = s;
  const span = LR[v][1] - LR[v][0];
  if (!L.pts.length || Math.abs(L.pts[L.pts.length - 1][0] - x) > span / 60) L.pts.push([x, s[r]]);
  labSync(true);
}

function labSync(fromMove) {
  const ok = L.held.length === 2, r = ok ? labResp() : null;
  VARS.forEach(v => {
    const card = $(`.vcard[data-v="${v}"]`), held = L.held.includes(v);
    card.className = 'vcard' + (held ? ' held' : ok && v === L.change ? ' chg' : ok && v === r ? ' resp' : '');
    $(`.lhold[value="${v}"]`).checked = held;
    const rb = $(`.lchg[value="${v}"]`); rb.checked = ok && v === L.change; rb.disabled = held;
    $('#lr-' + v).disabled = !(ok && v === L.change);
    if (!fromMove || v !== L.change) $('#lr-' + v).value = L.s[v];
    $('#lv-' + v).textContent = `${fmtV(v, L.s[v])} ${LR[v][3]}`;
    $('#lrole-' + v).textContent = held ? 'held constant' : !ok ? '' : v === L.change ? 'you change this' : 'responds';
  });
  $('#lab-note').textContent = ok ? (fromMove ? $('#lab-note').textContent : '') : 'Hold exactly two quantities constant.';
  $('#lab-eq').innerHTML = masterEqHTML(L.held);
  $('#lab-red').innerHTML = ok ? reducedEqHTML(L.held) : '—';
  $('#lab-law').innerHTML = ok ? lawTag(L.held) : '';
  const k = L.s.P * L.s.V / (L.s.n * L.s.T);
  let c = `<i>PV</i>/(<i>nT</i>) = ${k.toFixed(5)} L·atm/(mol·K) = R, always.`;
  if (ok) {
    const num = ['P', 'V'].filter(v => !L.held.includes(v)), den = ['n', 'T'].filter(v => !L.held.includes(v));
    const val = num.reduce((a, v) => a * L.s[v], 1) / den.reduce((a, v) => a * L.s[v], 1);
    const lab = (num.length ? num.join('·') : '1') + (den.length ? ' / ' + (den.length > 1 ? '(' + den.join('·') + ')' : den[0]) : '');
    c += `<br>Here <i>${lab}</i> = ${val.toPrecision(4)} and stays constant as you move the slider.`;
  }
  $('#lab-const').innerHTML = c;
  labDraw(); labPlot();
}

function labDraw() {
  const s = L.s, gasH = 10 + Math.min(s.V, 100) / 100 * 250, top = 330 - gasH;
  $('#lab-gas').setAttribute('y', top); $('#lab-gas').setAttribute('height', gasH);
  $('#lab-piston').setAttribute('y', top - 12);
  $('#lab-rod').setAttribute('y', top - 28);
  const nb = Math.max(1, Math.min(16, Math.round(s.P / 0.25)));
  let w = ''; for (let i = 0; i < nb; i++) w += `<rect x="100" y="${top - 28 - (i + 1) * 5.5}" width="80" height="5" fill="${i % 2 ? '#a66a3a' : '#c4834e'}"/>`;
  $('#lab-weights').innerHTML = w;
  $('#lab-pins').innerHTML = L.held.includes('V') ? `<rect x="56" y="${top - 20}" width="26" height="6" fill="#b3261e"/><rect x="198" y="${top - 20}" width="26" height="6" fill="#b3261e"/><text x="226" y="${top - 13}" font-size="10" fill="#b3261e">locked</text>` : '';
  const f = 0.3 + (s.T - 100) / 700 * 0.9;
  $('#lab-flame').innerHTML = `<path transform="translate(140 378) scale(${f})" d="M0 0 C-22 -10 -14 -34 0 -52 C14 -34 22 -10 0 0Z" fill="#f08a24"/><path transform="translate(140 378) scale(${f * 0.6})" d="M0 0 C-12 -8 -8 -24 0 -36 C8 -24 12 -8 0 0Z" fill="#ffd34d"/>`;
  $('#lab-cap').textContent = `${nb} weight${nb > 1 ? 's' : ''} ≈ ${s.P.toFixed(2)} atm`;
  // particles
  const N = Math.max(3, Math.min(45, Math.round(s.n * 15)));
  while (L.parts.length < N) L.parts.push({ x: 80 + Math.random() * 120, y: 300, a: Math.random() * 2 * Math.PI });
  L.parts.length = N;
  L.box = { x0: 78, x1: 202, y0: top + 4, y1: 326 };
}

function labTick(t) {
  const dt = Math.min(0.05, (t - (L.last || t)) / 1000); L.last = t;
  const b = L.box, sp = 70 * Math.sqrt(L.s.T / 300);
  let html = '';
  for (const p of L.parts) {
    p.x += Math.cos(p.a) * sp * dt; p.y += Math.sin(p.a) * sp * dt;
    if (p.x < b.x0) { p.x = b.x0; p.a = Math.PI - p.a; } if (p.x > b.x1) { p.x = b.x1; p.a = Math.PI - p.a; }
    if (p.y < b.y0) { p.y = b.y0; p.a = -p.a; } if (p.y > b.y1) { p.y = b.y1; p.a = -p.a; }
    html += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#1f5f99"/>`;
  }
  $('#lab-parts').innerHTML = html;
  L.raf = requestAnimationFrame(labTick);
}
function labStart() { if (!L.built) { labBuild(); labSync(); } if (!L.raf) { L.last = 0; L.raf = requestAnimationFrame(labTick); } }
function labStop() { if (L.raf) cancelAnimationFrame(L.raf); L.raf = null; }

function labPlot() {
  const cv = $('#lab-plot'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.font = '13px system-ui'; g.fillStyle = '#555';
  if (L.held.length !== 2) { g.fillText('Hold two quantities constant to start an experiment.', 20, H / 2); return; }
  const xv = L.change, yv = labResp(), inv = $('#lab-inv').checked;
  const m = { l: 58, r: 16, t: 14, b: 44 };
  const X = x => inv ? 1 / x : x;
  const niceStep = x => { const e = Math.pow(10, Math.floor(Math.log10(x))), f = x / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
  const xs = [LR[xv][0], LR[xv][1]].map(X), xstep = niceStep(Math.max(...xs) / 5), xmax = Math.ceil(Math.max(...xs) / xstep - 1e-9) * xstep;
  const curve = [];
  for (let i = 0; i <= 200; i++) {
    const x = LR[xv][0] + (LR[xv][1] - LR[xv][0]) * i / 200, s = Object.assign({}, L.s); s[xv] = x;
    const y = solveFor(yv, s); if (inRange(yv, y)) curve.push([X(x), y]);
  }
  const yraw = Math.max(LR[yv][0], ...curve.map(c => c[1]), ...L.pts.map(p => p[1])), ystep = niceStep(yraw / 5), ymax = Math.ceil(yraw / ystep - 1e-9) * ystep;
  const px = x => m.l + x / xmax * (W - m.l - m.r), py = y => H - m.b - y / ymax * (H - m.t - m.b);
  g.strokeStyle = '#999'; g.lineWidth = 1; g.beginPath(); g.moveTo(m.l, m.t); g.lineTo(m.l, H - m.b); g.lineTo(W - m.r, H - m.b); g.stroke();
  g.fillStyle = '#555'; g.textAlign = 'center';
  for (let x = 0; x <= xmax + 1e-9; x += xstep) g.fillText(Number(x.toPrecision(3)), px(x), H - m.b + 16);
  g.textAlign = 'right';
  for (let y = 0; y <= ymax + 1e-9; y += ystep) g.fillText(Number(y.toPrecision(3)), m.l - 6, py(y) + 4);
  g.textAlign = 'center';
  g.fillText(inv ? `1/${xv} (1/${LR[xv][3]})` : `${xv} (${LR[xv][3]})`, (m.l + W - m.r) / 2, H - 8);
  g.save(); g.translate(16, (m.t + H - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText(`${yv} (${LR[yv][3]})`, 0, 0); g.restore();
  g.strokeStyle = '#c9d8e6'; g.lineWidth = 2; g.beginPath();
  curve.forEach((c, i) => i ? g.lineTo(px(c[0]), py(c[1])) : g.moveTo(px(c[0]), py(c[1]))); g.stroke();
  g.fillStyle = '#c45a00';
  L.pts.forEach(p => { g.beginPath(); g.arc(px(X(p[0])), py(p[1]), 4, 0, 2 * Math.PI); g.fill(); });
  g.fillStyle = '#1f5f99'; g.beginPath(); g.arc(px(X(L.s[xv])), py(L.s[yv]), 6, 0, 2 * Math.PI); g.fill();
}

// ---------- problem set: built-ins, problems.json, and problems saved in this browser ----------
let BASE = PROBLEMS, UPLOADED = [];
const STORE = 'gas-laws-workbench-uploaded';
function mergeSets(base, extra) {
  const ids = new Set(extra.map(p => p.id));
  return [...base.filter(p => !ids.has(p.id)), ...extra].sort((a, b) => a.level - b.level);
}
function refreshSets() {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { saved = []; }
  ACTIVE = mergeSets(BASE, saved);
  fillProbs();
  const n = $('#i-saved');
  if (n) n.textContent = saved.length ? `${saved.length} uploaded problem${saved.length > 1 ? 's are' : ' is'} saved in this browser and mixed into Coaching and Testing here (students don't see them).` : 'No uploaded problems are saved in this browser.';
}
if (location.protocol === 'file:') refreshSets();
else try {
  fetch('problems.json').then(r => r.ok ? r.json() : null).then(arr => { if (Array.isArray(arr) && arr.length) BASE = arr; }).catch(() => {}).finally(refreshSets);
} catch (e) { refreshSets(); }

// ---------- spreadsheet text ----------
function parseDelimited(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const d = first.includes('\t') ? '\t' : ',';
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === d) { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim());
  return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] || ''])));
}
function toCSV(rows) {
  const esc = v => /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return [PROBLEM_COLS.join(','), ...rows.map(r => PROBLEM_COLS.map(c => esc(r[c] || '')).join(','))].join('\r\n');
}

// Downloads: inside claude.ai the viewer's download service is used; on GitHub Pages a normal download.
// If neither works, a copy box is shown.
let DL = null;
if (window.claude && window.claude.use) window.claude.use('downloads').then(d => { DL = d; }).catch(() => {});
function copyBox(name, content, out, why) {
  out.innerHTML = `<p class="note">${why} Copy this text into a file named <b>${name}</b>.</p>
    <textarea readonly style="width:100%;height:150px;font:12px ui-monospace,monospace">${content.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</textarea>
    <button class="b2 i-copy">Copy</button>`;
  $('.i-copy', out).addEventListener('click', e => {
    const ta = $('textarea', out), done = () => { e.target.textContent = 'Copied'; };
    try { navigator.clipboard.writeText(content).then(done, () => { ta.select(); document.execCommand('copy'); done(); }); }
    catch (x) { ta.select(); document.execCommand('copy'); done(); }
  });
}
async function offerFile(name, content, mime, out) {
  if (DL) {
    try { await DL.save({ filename: name, data: content }); out.innerHTML = `<p class="note">Saved ${name}.</p>`; return; }
    catch (e) {
      if (e && e.code === 'declined') { out.innerHTML = '<p class="note">Download cancelled.</p>'; return; }
      copyBox(name, content, out, 'The download did not go through.'); return;
    }
  }
  if (location.hostname.endsWith('claude.ai') || location.hostname.endsWith('claudeusercontent.com')) { copyBox(name, content, out, 'Downloads are not available in this view.'); return; }
  try {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    out.innerHTML = `<p class="note">Downloaded ${name}. <a href="#" class="i-show">Show as text instead</a></p>`;
    $('.i-show', out).addEventListener('click', ev => { ev.preventDefault(); copyBox(name, content, out, ''); });
  } catch (e) { copyBox(name, content, out, 'The download did not start.'); }
}

const TEMPLATE_IDS = ['p3', 'm1', 't11', 't5', 'o8', 's2', 's8', 'd4', 'k1', 'r1', 'r7'];
$('#i-tmpl').addEventListener('click', () => {
  const rows = TEMPLATE_IDS.map((id, i) => { const r = problemToRow(PROBLEMS.find(p => p.id === id)); r.id = 'my' + (i + 1); r.src = ''; if (i % 2) r.text = ''; return r; });
  offerFile('gas-laws-template.csv', toCSV(rows), 'text/csv', $('#i-out'));
});
$('#i-cur').addEventListener('click', () => offerFile('gas-laws-problems.csv', toCSV(ACTIVE.map(problemToRow)), 'text/csv', $('#i-out')));

$('#i-file').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    const rows = parseDelimited(String(rd.result));
    UPLOADED = [];
    const seen = new Set();
    let html = '<table class="st" style="width:100%;text-align:left"><tr><th>id</th><th>Type</th><th>Problem</th><th>Answer the tool computed</th></tr>';
    rows.forEach((r, i) => {
      const p = rowToProblem(r);
      const errs = validateProblem(p);
      if (p.id && seen.has(p.id)) errs.push('duplicate id in this file');
      seen.add(p.id);
      let ans = '';
      if (!errs.length) { ans = answerHTML(stepsFor(p)); UPLOADED.push(p); }
      html += `<tr><td>${p.id || '(row ' + (i + 2) + ')'}</td><td>${p.level || ''} ${p.type || ''}</td>
        <td style="text-align:left">${errs.length ? '' : textFor(p)}</td>
        <td style="text-align:left">${errs.length ? `<span class="bad" style="color:var(--bad)">${errs.join('<br>')}</span>` : ans}</td></tr>`;
    });
    html += '</table>';
    const nb = rows.length - UPLOADED.length;
    $('#i-res').innerHTML = `<p><b>${rows.length} row${rows.length === 1 ? '' : 's'}:</b> ${UPLOADED.length} ready${nb ? `, <span style="color:var(--bad)">${nb} with errors (not used)</span>` : ''}.</p><div class="scroll">${html}</div>`;
    $('#i-acts').style.display = UPLOADED.length ? 'flex' : 'none';
    $('#i-json-out').innerHTML = '';
  };
  rd.readAsText(file);
});
$('#i-try').addEventListener('click', () => {
  try { localStorage.setItem(STORE, JSON.stringify(UPLOADED)); refreshSets(); $('#i-json-out').innerHTML = '<p class="good" style="color:var(--ok)">Saved. Your problems now appear in Coaching and Testing in this browser.</p>'; }
  catch (e) { ACTIVE = mergeSets(BASE, UPLOADED); fillProbs(); $('#i-json-out').innerHTML = '<p class="note">This browser would not save them, but they are loaded for this visit.</p>'; }
});
$('#i-json').addEventListener('click', () => {
  const set = $('#i-incl').checked ? mergeSets(BASE, UPLOADED) : UPLOADED;
  offerFile('problems.json', JSON.stringify(set, null, 1), 'application/json', $('#i-json-out'));
});
$('#i-clear').addEventListener('click', () => { try { localStorage.removeItem(STORE); } catch (e) { } refreshSets(); });
