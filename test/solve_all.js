// node test/solve_all.js  — checks every built-in problem
const E = require('../src/engine.js');
const { PROBLEMS } = require('../src/problems.js');
let bad = 0;
const strip = s => String(s).replace(/<[^>]+>/g, '');
for (const p of PROBLEMS) {
  let S;
  try { S = E.stepsFor(p); } catch (err) { console.log('ERROR', p.id, err.message); bad++; continue; }
  const txt = strip(E.textFor(p));
  if (/\{\w+\}/.test(txt)) { console.log('UNFILLED', p.id, txt); bad++; }
  const parts = [];
  for (const s of S) {
    if (s.choice) { parts.push(`${s.key}=${s.ans}`); if (!s.ans) { console.log('NO ID', p.id); bad++; } continue; }
    if (s.ans == null || !isFinite(s.ans)) { console.log('BAD ANS', p.id, s.key, s.ans); bad++; }
    if (!E.isRight(s, s.ans)) { console.log('SELF FAIL', p.id, s.key); bad++; }
    for (const d of s.diags) if (E.isRight(s, d.v)) { console.log('DIAG ACCEPTED', p.id, s.key, d.flag); bad++; }
    parts.push(`${s.key}=${strip(E.fmt(s.ans))}${s.diags.length ? '[' + s.diags.map(d => d.flag).join(',') + ']' : ''}`);
  }
  const fin = S[S.finalIndex];
  const dec = E.decodeFor(p);
  console.log(p.id.padEnd(4), parts.join('  '), '| final', fin.key, dec ? '| decode ' + JSON.stringify(dec) : '');
}
// every built-in passes upload validation, and survives a spreadsheet round trip
for (const p of PROBLEMS) {
  const v = E.validateProblem(p);
  if (v.length) { console.log('VALIDATION', p.id, v); bad++; }
  const back = E.rowToProblem(E.problemToRow(p));
  const a = E.stepsFor(p), b = E.stepsFor(back);
  if (a.length !== b.length || a.some((s, i) => String(s.ans) !== String(b[i].ans))) { console.log('ROUNDTRIP', p.id); bad++; }
}
// a few bad rows must be rejected
const badRows = [
  { id: 'x1', problem_type: '3', solver: 'one', find: 'P', V: '2.0 L', T: '25 °C' },
  { id: 'x2', problem_type: '2', solver: 'two', hold: 'nT', find: 'V', P1: '1 atm', V1: '2 gallons', P2: '2 atm' },
  { id: 'x3', problem_type: '4', solver: 'stoich', sub: 'm2V', rxn: '2 H2 + O2 -> 2 H2O', known: 'H2', target: 'NH3', mass: '4 g', P: '1 atm', T: '0 °C' },
  { id: 'x4', problem_type: '9', solver: 'pconv', val: '1 atm', to: 'psi' }];
for (const r of badRows) { const v = E.validateProblem(E.rowToProblem(r)); if (!v.length) { console.log('NOT REJECTED', r.id); bad++; } else console.log('rejected', r.id, '→', v.join('; ')); }
// default wording when text is blank
for (const id of ['t12', 'o8', 's2', 'r1', 'd4']) { const q = Object.assign({}, PROBLEMS.find(p => p.id === id)); delete q.text; console.log('auto text', id, '→', strip(E.textFor(q))); }
console.log(bad ? `${bad} problem(s)` : `All ${PROBLEMS.length} problems OK`);
process.exit(bad ? 1 : 0);
