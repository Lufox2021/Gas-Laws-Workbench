# Gas Laws Workbench

A student tool for general chemistry gas problems, built on one idea: **PV = nRT is the only equation you need.** For a fixed sample, P₁V₁/(n₁T₁) = P₂V₂/(n₂T₂); Boyle's, Charles's, Gay-Lussac's and Avogadro's laws are that equation with the constant quantities crossed out.

**Live tool:** https://lufox2021.github.io/Gas-Laws-Workbench/

## Tabs
- **Review** — pressure, the one equation, one-state uses, gas stoichiometry, Dalton's law, kinetic theory, real gases, common mistakes.
- **Coaching** — decode the problem, then solve step by step, with a hint button on every step and a diagnosis of common mistakes.
- **Testing** — final answer only, with step-by-step hints and a score.
- **Gas Lab** — a piston you control: hold two quantities, change one, watch the fourth respond.
- **Instructor** — upload problems as .csv or tab-delimited .txt; the tool solves and checks every row, and makes a `problems.json` for students.

## Problem types (69 built-in problems)
1 Pressure · 2 Two states · 3 One state · 4 Gas stoichiometry · 5 Dalton's law · 6 Kinetic theory · 7 Real gases

## Adding your own problems
Instructor tab → upload your spreadsheet → **Download problems.json** → on this repository, **Add file → Upload files** → commit. The page loads `problems.json` if it is present; otherwise it uses the built-in set.

## For developers
`index.html` is built from `src/` with `python3 build.py`. Tests: `node test/solve_all.js` (engine) and `python3 test/browser_test.py` (Playwright).
