// Built-in problem set. {braces} in text are filled from the fields so text and numbers never disagree.
const LEVELS = {
  1: 'Pressure: units & manometers',
  2: 'Two states: one equation, cross out what is constant',
  3: 'One state: PV = nRT, molar mass, density',
  4: 'Gas stoichiometry',
  5: "Dalton's law & gases collected over water",
  6: 'Kinetic theory: u(rms) & Graham\'s law',
  7: 'Real gases: van der Waals & Boyle temperature'
};

const PROBLEMS = [
  // ---- Level 1: pressure ----
  { id: 'p1', level: 1, type: 'pconv', val: '30.44 inHg', to: 'psi', src: 'Slide 7, Example 1', text: 'A barometer reads {val}. What is the pressure in psi?' },
  { id: 'p2', level: 1, type: 'pconv', val: '23.8 inHg', to: 'Pa', src: 'Slide 7, Example 2', text: 'A barometer high in the mountains reads {val}. What is the pressure in pascals?' },
  { id: 'p3', level: 1, type: 'pconv', val: '745 mmHg', to: 'atm', text: 'The barometric pressure today is {val}. Express it in atmospheres.' },
  { id: 'p4', level: 1, type: 'pconv', val: '2.50 atm', to: 'kPa', text: 'A gas cylinder is at {val}. What is that in kPa?' },
  { id: 'p5', level: 1, type: 'pconv', val: '32.0 psi', to: 'kPa', text: 'A car tire is inflated to {val}. Express this pressure in kPa.' },
  { id: 'p6', level: 1, type: 'pconv', val: '0.0500 atm', to: 'torr', text: 'A vacuum line holds {val}. What is that in torr?' },
  { id: 'm1', level: 1, type: 'mano', Patm: '760 mmHg', h: '120 mm', side: 'higher', to: 'psi', src: 'Slide 6', text: 'An open-end mercury manometer is attached to a flask. Atmospheric pressure is {Patm}. The mercury in the open arm stands {h} higher than in the arm connected to the flask. What is the gas pressure in psi?' },
  { id: 'm2', level: 1, type: 'mano', Patm: '752 mmHg', h: '47 mm', side: 'lower', to: 'atm', text: 'Atmospheric pressure is {Patm}. In an open-end manometer, the mercury in the arm connected to the flask is {h} higher than in the open arm. What is the gas pressure in atm?' },
  { id: 'm3', level: 1, type: 'mano', Patm: '765 mmHg', h: '85 mm', side: 'higher', to: 'mmHg', text: 'Atmospheric pressure is {Patm}. The mercury in the open arm of a manometer is {h} higher than in the flask arm. What is the gas pressure in mmHg?' },
  { id: 'm4', level: 1, type: 'mano', Patm: '740 mmHg', h: '215 mm', side: 'lower', to: 'kPa', text: 'Atmospheric pressure is {Patm}. The mercury in the flask arm of an open-end manometer is {h} higher than in the open arm. What is the gas pressure in kPa?' },

  // ---- Level 2: two states ----
  { id: 't1', level: 2, type: 'two', hold: 'nT', find: 'V', P1: '1.00 atm', V1: '5.00 L', P2: '2.50 atm', text: 'A sample of gas occupies {V1} at {P1}. At constant temperature, it is compressed until the pressure is {P2}. What is the new volume?' },
  { id: 't2', level: 2, type: 'two', hold: 'nT', find: 'V', P1: '745 mmHg', V1: '2.40 L', P2: '1.50 atm', text: 'A gas occupies {V1} at {P1}. The pressure is raised to {P2} with the temperature held constant. What volume does the gas now occupy?' },
  { id: 't3', level: 2, type: 'two', hold: 'nT', find: 'P', P1: '1.20 atm', V1: '750. mL', V2: '250. mL', text: 'A gas occupies {V1} at {P1}. What pressure is needed to squeeze it into {V2} at the same temperature?' },
  { id: 't4', level: 2, type: 'two', hold: 'Pn', find: 'V', V1: '2.50 L', T1: '25 °C', T2: '100 °C', text: 'A balloon holds {V1} of air at {T1}. It is heated to {T2} at constant pressure. What is its new volume?' },
  { id: 't5', level: 2, type: 'two', hold: 'Pn', find: 'T', ansU: 'C', V1: '1.20 L', T1: '20 °C', V2: '1.50 L', text: 'A gas occupies {V1} at {T1}. At what temperature, in °C, will it occupy {V2} at the same pressure?' },
  { id: 't6', level: 2, type: 'two', hold: 'Pn', find: 'V', V1: '4.00 L', T1: '27 °C', T2: '-73 °C', text: 'A {V1} sample of gas at {T1} is cooled to {T2} at constant pressure. What is the new volume?' },
  { id: 't7', level: 2, type: 'two', hold: 'Vn', find: 'P', P1: '1.80 atm', T1: '22 °C', T2: '300. °C', text: 'A sealed aerosol can is at {P1} at {T1}. It is tossed into a fire and reaches {T2}. What is the pressure inside the can?' },
  { id: 't8', level: 2, type: 'two', hold: 'Vn', find: 'P', P1: '32.0 psi', T1: '10 °C', T2: '45 °C', text: 'A tire is filled to {P1} on a cold morning at {T1}. After a long drive the air inside is at {T2}. Assuming the volume does not change, what is the tire pressure now?' },
  { id: 't9', level: 2, type: 'two', hold: 'PT', find: 'V', V1: '3.50 L', n1: '0.150 mol', n2: '0.250 mol', text: 'A balloon holds {n1} of gas in {V1}. More gas is added until it holds {n2}, at the same temperature and pressure. What is the new volume?' },
  { id: 't10', level: 2, type: 'two', hold: 'PT', find: 'n', V1: '2.00 L', n1: '0.0850 mol', V2: '5.20 L', text: 'A {V1} balloon contains {n1} of helium. How many moles are in it when it is inflated to {V2} at the same temperature and pressure?' },
  { id: 't11', level: 2, type: 'two', hold: 'n', find: 'V', V1: '500. mL', P1: '745 mmHg', T1: '25 °C', P2: '760 mmHg', T2: '0 °C', text: 'A gas sample occupies {V1} at {T1} and {P1}. What volume would it occupy at STP ({T2} and {P2})?' },
  { id: 't12', level: 2, type: 'two', hold: 'n', find: 'V', V1: '25.0 L', P1: '1.00 atm', T1: '22 °C', P2: '0.350 atm', T2: '-30 °C', text: 'A weather balloon holds {V1} of helium at {P1} and {T1}. It rises to where the pressure is {P2} and the temperature is {T2}. What is its volume there?' },
  { id: 't13', level: 2, type: 'two', hold: 'n', find: 'P', P1: '2.00 atm', V1: '1.50 L', T1: '300. K', V2: '2.25 L', T2: '400. K', text: 'A gas at {P1} occupies {V1} at {T1}. It is moved to a {V2} container and heated to {T2}. What is the new pressure?' },

  // ---- Level 3: one state ----
  { id: 'o1', level: 3, type: 'one', find: 'P', n: '0.500 mol', V: '10.0 L', T: '25 °C', text: 'What pressure does {n} of an ideal gas exert in a {V} container at {T}?' },
  { id: 'o2', level: 3, type: 'one', find: 'V', n: '2.50 mol', P: '1.50 atm', T: '300. K', text: 'What volume does {n} of nitrogen occupy at {P} and {T}?' },
  { id: 'o3', level: 3, type: 'one', find: 'n', V: '500. mL', P: '745 mmHg', T: '25 °C', text: 'How many moles of gas are in a {V} flask at {P} and {T}?' },
  { id: 'o4', level: 3, type: 'one', find: 'T', ansU: 'C', n: '0.250 mol', V: '5.00 L', P: '1.20 atm', text: 'At what temperature, in °C, does {n} of gas in a {V} container exert {P}?' },
  { id: 'o5', level: 3, type: 'one', find: 'mass', gas: 'CO2', V: '2.00 L', P: '1.10 atm', T: '30 °C', text: 'How many grams of {gas} are in a {V} flask at {P} and {T}?' },
  { id: 'o6', level: 3, type: 'one', find: 'V', n: '0.750 mol', P: '1 atm', T: '0 °C', text: 'What volume does {n} of an ideal gas occupy at STP ({T} and {P})?' },
  { id: 'o7', level: 3, type: 'one', find: 'P', gas: 'O2', mass: '8.00 g', V: '3.00 L', T: '50 °C', text: '{mass} of {gas} is placed in a {V} container at {T}. What is the pressure?' },
  { id: 'o8', level: 3, type: 'one', find: 'M', mass: '1.25 g', V: '0.500 L', P: '735 mmHg', T: '27 °C', text: 'A {mass} sample of an unknown gas occupies {V} at {P} and {T}. What is its molar mass, and which gas is it?' },
  { id: 'o9', level: 3, type: 'one', find: 'M', mass: '0.380 g', V: '250. mL', P: '1.00 atm', T: '100 °C', text: 'A brown gas: {mass} of it fills a {V} bulb at {P} and {T}. Find its molar mass and identify it.' },
  { id: 'o10', level: 3, type: 'one', find: 'd', gas: 'CO2', P: '1 atm', T: '0 °C', text: 'What is the density of {gas} at STP ({T} and {P}), in g/L?' },
  { id: 'o11', level: 3, type: 'one', find: 'd', gas: 'He', P: '1.00 atm', T: '25 °C', text: 'What is the density of {gas} at {T} and {P}, in g/L?' },
  { id: 'o12', level: 3, type: 'one', find: 'd', gas: 'SF6', P: '755 mmHg', T: '20 °C', text: 'Sulfur hexafluoride, {gas}, is one of the densest gases. What is its density at {P} and {T}?' },
  { id: 'o13', level: 3, type: 'one', find: 'Md', d: '3.17 g/L', P: '1 atm', T: '0 °C', text: 'A yellow-green gas has a density of {d} at STP ({T} and {P}). Find its molar mass and identify it.' },
  { id: 'o14', level: 3, type: 'one', find: 'P', ansU: 'mmHg', n: '0.0200 mol', V: '250. mL', T: '20 °C', text: 'What is the pressure, in mmHg, of {n} of gas in a {V} flask at {T}?' },

  // ---- Type 4: gas stoichiometry ----
  { id: 's1', level: 4, type: 'stoich', sub: 'm2V', rxn: '2 KClO3 -> 2 KCl + 3 O2', known: 'KClO3', target: 'O2', mass: '12.25 g', P: '1 atm', T: '0 °C', text: 'Potassium chlorate decomposes on heating: {rxn}. What volume of {target} at STP ({T} and {P}) forms from {mass} of {known}?' },
  { id: 's2', level: 4, type: 'stoich', sub: 'm2V', rxn: 'Zn + 2 HCl -> ZnCl2 + H2', known: 'Zn', target: 'H2', mass: '5.00 g', P: '745 mmHg', T: '25 °C', text: 'Zinc dissolves in hydrochloric acid: {rxn}. What volume of dry {target} at {P} and {T} is produced from {mass} of {known}?' },
  { id: 's3', level: 4, type: 'stoich', sub: 'm2V', rxn: '2 NaN3 -> 2 Na + 3 N2', known: 'NaN3', target: 'N2', mass: '65.0 g', P: '1.00 atm', T: '30 °C', text: 'An air bag inflates by the reaction {rxn}. What volume of {target} at {P} and {T} does {mass} of sodium azide, {known}, produce?' },
  { id: 's4', level: 4, type: 'stoich', sub: 'm2V', rxn: '2 C8H18 + 25 O2 -> 16 CO2 + 18 H2O', known: 'C8H18', target: 'CO2', mass: '100. g', P: '1.00 atm', T: '25 °C', text: 'Octane burns: {rxn}. What volume of {target} at {P} and {T} forms when {mass} of {known} burns completely?' },
  { id: 's5', level: 4, type: 'stoich', sub: 'V2m', rxn: 'CaCO3 -> CaO + CO2', known: 'CO2', target: 'CaCO3', V: '2.50 L', P: '1.00 atm', T: '25 °C', text: 'Limestone decomposes: {rxn}. The reaction releases {V} of {known} at {P} and {T}. What mass of {target} decomposed?' },
  { id: 's6', level: 4, type: 'stoich', sub: 'V2m', rxn: '2 H2 + O2 -> 2 H2O', known: 'O2', target: 'H2O', V: '4.80 L', P: '1 atm', T: '0 °C', text: 'Hydrogen burns: {rxn}. If {V} of {known}, measured at STP ({T} and {P}), reacts completely, what mass of water forms?' },
  { id: 's7', level: 4, type: 'stoich', sub: 'V2m', rxn: '2 Al + 6 HCl -> 2 AlCl3 + 3 H2', known: 'H2', target: 'Al', V: '355 mL', P: '752 mmHg', T: '22 °C', text: 'Aluminum reacts with acid: {rxn}. To collect {V} of dry {known} at {P} and {T}, what mass of {target} must react?' },
  { id: 's8', level: 4, type: 'stoich', sub: 'V2V', rxn: 'N2 + 3 H2 -> 2 NH3', known: 'H2', target: 'NH3', V: '15.0 L', text: 'In the Haber process, {rxn}. What volume of {target} can form from {V} of {known}, with both gases at the same temperature and pressure?' },
  { id: 's9', level: 4, type: 'stoich', sub: 'V2V', rxn: 'C3H8 + 5 O2 -> 3 CO2 + 4 H2O', known: 'C3H8', target: 'O2', V: '2.40 L', text: 'Propane burns: {rxn}. What volume of {target} is needed to burn {V} of {known}, both measured at the same temperature and pressure?' },

  // ---- Type 5: Dalton ----
  { id: 'd1', level: 5, type: 'dalton', sub: 'sum', parts: [['N2', '593 mmHg'], ['O2', '159 mmHg'], ['Ar', '7.1 mmHg'], ['CO2', '0.3 mmHg']], text: 'Dry air at sea level has these partial pressures: N<sub>2</sub> 593 mmHg, O<sub>2</sub> 159 mmHg, Ar 7.1 mmHg, CO<sub>2</sub> 0.3 mmHg. What is the total pressure?' },
  { id: 'd2', level: 5, type: 'dalton', sub: 'frac', moles: [['He', 1.50], ['Ne', 0.50]], target: 'He', Ptot: '2.40 atm', text: 'A tank contains 1.50 mol He and 0.50 mol Ne at a total pressure of {Ptot}. What is the partial pressure of {target}?' },
  { id: 'd3', level: 5, type: 'dalton', sub: 'frac', moles: [['N2', 0.420], ['O2', 0.180], ['CO2', 0.0400]], target: 'O2', Ptot: '1.25 atm', text: 'A gas mixture contains 0.420 mol N<sub>2</sub>, 0.180 mol O<sub>2</sub> and 0.0400 mol CO<sub>2</sub> at a total pressure of {Ptot}. What is the partial pressure of {target}?' },
  { id: 'd4', level: 5, type: 'dalton', sub: 'water', find: 'n', gas: 'H2', V: '235 mL', T: '25 °C', Ptot: '752 mmHg', src: 'Slide 15 setup', text: 'Zinc reacts with HCl, and the {gas} is collected over water: {V} at {T}. The barometric pressure is {Ptot}. How many moles of {gas} were collected?' },
  { id: 'd5', level: 5, type: 'dalton', sub: 'water', find: 'mass', gas: 'O2', V: '0.500 L', T: '30 °C', Ptot: '745 mmHg', text: '{gas} from decomposing KClO<sub>3</sub> is collected over water: {V} at {T}, with a barometric pressure of {Ptot}. What mass of {gas} was collected?' },
  { id: 'd6', level: 5, type: 'dalton', sub: 'water', find: 'Pg', gas: 'N2', T: '20 °C', Ptot: '755 mmHg', text: '{gas} is collected over water at {T}. The total pressure in the collection bottle is {Ptot}. What is the partial pressure of the {gas}?' },
  { id: 'd7', level: 5, type: 'dalton', sub: 'water', find: 'n', gas: 'H2', V: '1.20 L', T: '35 °C', Ptot: '763 mmHg', text: '{V} of {gas} is collected over water at {T}; the barometer reads {Ptot}. How many moles of {gas} were collected?' },

  // ---- Type 6: kinetic theory ----
  { id: 'k1', level: 6, type: 'kmt', sub: 'urms', gas: 'N2', T: '25 °C', text: 'What is the root-mean-square speed of {gas} molecules at {T}?' },
  { id: 'k2', level: 6, type: 'kmt', sub: 'urms', gas: 'He', T: '0 °C', text: 'What is the root-mean-square speed of {gas} atoms at {T}?' },
  { id: 'k3', level: 6, type: 'kmt', sub: 'urms', gas: 'Xe', T: '500. K', text: 'What is the root-mean-square speed of {gas} atoms at {T}?' },
  { id: 'k4', level: 6, type: 'kmt', sub: 'ke', T: '25 °C', text: 'What is the average kinetic energy of one mole of any ideal gas at {T}, in J/mol?' },
  { id: 'k5', level: 6, type: 'kmt', sub: 'graham', A: 'H2', B: 'O2', text: 'How many times faster does {A} effuse than {B}? Find rate({A}) / rate({B}).' },
  { id: 'k6', level: 6, type: 'kmt', sub: 'graham', A: 'SO2', B: 'CH4', text: 'Find the ratio of effusion rates, rate({A}) / rate({B}).' },
  { id: 'k7', level: 6, type: 'kmt', sub: 'grahamM', known: 'CH4', ratio: 0.500, text: 'An unknown gas effuses {ratio} times as fast as {known} under the same conditions. Find its molar mass and identify it.' },

  // ---- Type 7: real gases ----
  { id: 'r1', level: 7, type: 'real', sub: 'vdw', find: 'Z', gas: 'CO2', n: '1.00 mol', V: '1.00 L', T: '300. K', text: '{n} of {gas} is compressed into {V} at {T}. Use the van der Waals equation to find its pressure, then find Z.' },
  { id: 'r2', level: 7, type: 'real', sub: 'vdw', find: 'Z', gas: 'He', n: '1.00 mol', V: '1.00 L', T: '300. K', text: '{n} of {gas} is held in {V} at {T}. Find the van der Waals pressure and Z. Compare with CO<sub>2</sub> under the same conditions.' },
  { id: 'r3', level: 7, type: 'real', sub: 'vdw', find: 'P', gas: 'N2', n: '2.00 mol', V: '0.500 L', T: '0 °C', text: 'A high-pressure cylinder holds {n} of {gas} in {V} at {T}. What pressure does the van der Waals equation predict?' },
  { id: 'r4', level: 7, type: 'real', sub: 'vdw', find: 'Z', gas: 'Cl2', n: '0.500 mol', V: '2.00 L', T: '25 °C', text: '{n} of {gas} is in a {V} flask at {T}. Find the van der Waals pressure and the compressibility factor Z.' },
  { id: 'r5', level: 7, type: 'real', sub: 'vdw', find: 'P', gas: 'Xe', n: '1.00 mol', V: '0.250 L', T: '500. K', text: '{n} of {gas} is squeezed into {V} at {T}. What pressure does the van der Waals equation predict?' },
  { id: 'r6', level: 7, type: 'real', sub: 'vdw', find: 'Z', gas: 'CH4', n: '5.00 mol', V: '1.00 L', T: '25 °C', text: 'A natural-gas tank holds {n} of {gas} in {V} at {T}. Find the van der Waals pressure and Z.' },
  { id: 'r7', level: 7, type: 'real', sub: 'boyle', gas: 'N2', src: 'Slide 23', text: 'The Boyle temperature is where a gas behaves ideally over the widest pressure range. Find the Boyle temperature of {gas}.' },
  { id: 'r8', level: 7, type: 'real', sub: 'boyle', gas: 'He', text: 'Find the Boyle temperature of {gas}. Why is it so low?' },
  { id: 'r9', level: 7, type: 'real', sub: 'boyle', gas: 'CO2', text: 'Find the Boyle temperature of {gas}. Is CO<sub>2</sub> more or less ideal than N<sub>2</sub> at room temperature?' }
];

if (typeof module !== 'undefined') module.exports = { PROBLEMS, LEVELS };
