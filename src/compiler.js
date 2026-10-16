import { MISSIONS, getGameFeatures } from './missions.js';
import { MAX_SOURCE_LENGTH } from './project.js';

const same = (actual, expected) => typeof expected === 'number' ? typeof actual === 'number' && Math.abs(actual - expected) < 0.00001 : actual === expected;
const preview = value => {
  try { return (JSON.stringify(value) ?? String(value)).slice(0, 100); } catch { return String(value).slice(0, 100); }
};

export function checkMission(index, value, context = {}) {
  const results = [];
  const check = (label, expected, calculate, compare = same) => {
    try {
      const actual = calculate();
      results.push({ label, passed: compare(actual, expected), expected: preview(expected), actual: preview(actual) });
    } catch (error) {
      results.push({ label, passed: false, expected: preview(expected), actual: error.message });
    }
  };
  const call = (...args) => {
    if (typeof value !== 'function') throw new Error('Une fonction est attendue.');
    return value(...args);
  };
  const nextX = (x, speed, keys) => {
    const player = { x, y: 100, vx: 0 };
    call(player, { right: false, left: false, ...keys }, speed);
    return player.x;
  };
  switch (index) {
    case 0:
      check('Le nom est du texte, entre 2 et 16 caractères', true, () => typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 16);
      check('Le personnage possède ton propre nom', true, () => typeof value === 'string' && value.trim().toLowerCase() !== 'player');
      break;
    case 1:
      check('startX est un nombre, sans guillemets', true, () => typeof value === 'number');
      check('Choisis un départ entre 24 et 70', true, () => value >= 24 && value <= 70 && typeof value === 'number');
      break;
    case 2:
      check('speed est un nombre, sans guillemets', true, () => typeof value === 'number');
      check('Choisis une vitesse entre 3 et 5', true, () => value >= 3 && value <= 5 && typeof value === 'number');
      break;
    case 3:
      check('À droite : x = 40 et un pas de 2 donnent x = 42', 42, () => nextX(40, 2, { right: true }));
      check('Le calcul garde la position de départ : 100 + 5 = 105', 105, () => nextX(100, 5, { right: true }));
      break;
    case 4:
      check('La flèche droite fait avancer le héros', 44, () => nextX(40, 4, { right: true }));
      check('Sans flèche, le héros doit rester sur place', 60, () => nextX(60, 4, {}));
      break;
    case 5:
      check('À gauche : x = 40 et un pas de 2 donnent x = 38', 38, () => nextX(40, 2, { left: true }));
      check('Le calcul marche à une autre position : 100 - 5 = 95', 95, () => nextX(100, 5, { left: true }));
      check('La flèche droite fonctionne toujours', 65, () => nextX(60, 5, { right: true }));
      check('Les deux flèches ensemble se compensent', 60, () => nextX(60, 4, { right: true, left: true }));
      break;
    case 6:
      check('La puissance est un nombre', true, () => typeof value === 'number');
      check('La puissance se situe entre 9 et 11', true, () => value >= 9 && value <= 11 && typeof value === 'number');
      break;
    case 7:
      check('La gravité est un nombre décimal', true, () => typeof value === 'number' && Number.isFinite(value));
      check('La gravité se situe entre 0.35 et 0.6', true, () => value >= 0.35 && value <= 0.6 && typeof value === 'number');
      break;
    case 8:
      check('Une puissance de 8 donne une vitesse de -8', -8, () => call(8));
      check('Une puissance de 11 donne une vitesse de -11', -11, () => call(11));
      break;
    case 9:
      check('Sur le sol, le saut est autorisé', true, () => call({ onGround: true }));
      check('En l’air, le saut est refusé', false, () => call({ onGround: false }));
      break;
    case 10:
      check('Les points sont un nombre entier', true, () => typeof value === 'number' && Number.isInteger(value));
      check('Chaque fruit rapporte de 1 à 3 points', true, () => typeof value === 'number' && value >= 1 && value <= 3);
      break;
    case 11:
      check('0 point + 1 point donne 1', 1, () => call(0, 1));
      check('4 points + 2 points donne 6', 6, () => call(4, 2));
      check('7 points + 3 points donne 10', 10, () => call(7, 3));
      break;
    case 12:
      check('L’objectif est un entier', true, () => typeof value === 'number' && Number.isInteger(value));
      check('L’objectif se situe entre 3 et 5', true, () => typeof value === 'number' && value >= 3 && value <= 5);
      break;
    case 13:
      check('Un score trop petit est refusé', false, () => call(2, 3));
      check('Le score exact est accepté', true, () => call(3, 3));
      check('Un score supérieur est accepté', true, () => call(5, 3));
      check('La fonction respecte aussi un autre objectif', false, () => call(4, 5));
      break;
    case 14:
      check('Le feu actif est dangereux', true, () => call({ active: true }));
      check('Le feu éteint est sans danger', false, () => call({ active: false }));
      break;
    case 15:
      check('Avant le drapeau, rien n’est enregistré', false, () => call(100, 192));
      check('À la position exacte, le drapeau s’active', true, () => call(192, 192));
      check('Après le drapeau, il s’active aussi', true, () => call(230, 192));
      check('La fonction respecte une autre position', false, () => call(230, 300));
      break;
    case 16:
      check('fruitGap est un nombre', true, () => typeof value === 'number');
      check('Choisis un écart entre 16 et 24', true, () => typeof value === 'number' && value >= 16 && value <= 24);
      break;
    case 17:
      check('3 fruits donnent une prime de 6', 6, () => call(3));
      check('5 fruits donnent une prime de 10', 10, () => call(5));
      check('Sans fruit, la prime vaut 0', 0, () => call(0));
      break;
    case 18:
      check('Score suffisant + drapeau actif : ouvert', true, () => call(3, 3, true));
      check('Score insuffisant + drapeau actif : fermé', false, () => call(2, 3, true));
      check('Score suffisant + drapeau inactif : fermé', false, () => call(5, 3, false));
      check('Les deux conditions fausses : fermé', false, () => call(0, 4, false));
      break;
    case 19:
      check('Le message contient le nom reçu', true, () => { const result = call('Pixel', 12); return typeof result === 'string' && result.includes('Pixel'); });
      check('Le message contient le score reçu', true, () => { const result = call('Luna', 27); return typeof result === 'string' && result.includes('27'); });
      check('Un autre nom est utilisé sans réécrire le code', true, () => { const result = call('Nova', 8); return typeof result === 'string' && result.includes('Nova') && result.includes('8'); });
      break;
    default: throw new Error('Unknown mission.');
  }
  return results;
}

export function compileModule(index, source) {
  const item = MISSIONS[index];
  if (!item || typeof source !== 'string' || source.length > 16000) throw new Error('Le code de cette mission est trop long ou invalide.');
  if (!source.trim()) throw new Error(`À toi d’écrire ${item.exportName}. Utilise le modèle au-dessus de l’éditeur pour commencer.`);
  const value = new Function('"use strict";\n' + source + '\n;return typeof ' + item.exportName + ' !== "undefined" ? ' + item.exportName + ' : undefined;\n//# sourceURL=student-' + item.file)();
  return validateValue(index, value);
}

function validateValue(index, value) {
  const item = MISSIONS[index];
  if (value === undefined) throw new Error(`Il manque ${item.exportName}. Ajoute cette déclaration dans game.js en gardant le code des missions précédentes.`);
  if (typeof value !== item.type) {
    throw new Error(item.type === 'string' ? 'Le nom doit être du texte entre guillemets.' : item.type === 'number' ? `${item.exportName} doit être un nombre, sans guillemets.` : `Garde le cadre de la fonction ${item.exportName}.`);
  }
  if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > 1000)) throw new Error('Choisis un petit nombre positif pour pouvoir tester le jeu.');
  if (typeof value === 'string' && value.length > 40) throw new Error('Choisis un nom plus court pour le personnage.');
  return value;
}

export function compileProgram(sources, activeIndex) {
  const parts = new Map();
  for (const [index, source] of Object.entries(sources)) if (typeof source === 'string' && MISSIONS[index]) parts.set(MISSIONS[index].exportName, source);
  return compileProject([...parts.values()].join('\n\n'), activeIndex);
}

export function compileProject(source, activeIndex, requiredThrough = activeIndex, options = {}) {
  if (typeof source !== 'string' || source.length > MAX_SOURCE_LENGTH || !MISSIONS[activeIndex]) throw new Error('Le fichier game.js est trop long ou invalide.');
  if (!source.trim()) throw new Error(`À toi d’écrire ${MISSIONS[activeIndex].exportName}. Utilise le modèle au-dessus de l’éditeur pour commencer.`);
  const aliases = { jumpSpeed: 'jumpDirection', addPoints: 'collectFruit', canWin: 'canFinish', canSave: 'shouldSaveCheckpoint', canOpen: 'canOpenGate', victoryMessage: 'describeVictory' };
  const names = [...new Set([...MISSIONS.map(({ exportName }) => exportName), ...Object.values(aliases), 'moveRight', 'moveLeft', 'chooseAnimation', 'limitFall', 'createFruitLine'])];
  const exports = names.map(name => `${name}: typeof ${name} !== "undefined" ? ${name} : undefined`).join(',\n');
  const values = new Function('"use strict";\n' + source + '\n;return {\n' + exports + '\n};\n//# sourceURL=student-game.js')();
  const legacyMotion = values.updateX === undefined && (typeof values.moveRight === 'function' || typeof values.moveLeft === 'function');
  if (legacyMotion) values.updateX = (player, keys, speed) => {
    if (keys.right && values.moveRight) player.x += values.moveRight(speed);
    if (keys.left && values.moveLeft) player.x += values.moveLeft(speed);
  };
  if (options.allowLegacyCourse) {
    for (const [name, previous] of Object.entries(aliases)) if (values[name] === undefined && typeof values[previous] === 'function') values[name] = values[previous];
    if (values.startX === undefined && values.speed !== undefined) values.startX = 43;
    if (values.fruitGap === undefined && typeof values.createFruitLine === 'function') values.fruitGap = 24;
  }
  const modules = [];
  const program = {};
  const projectFailures = [];
  let checks;
  for (let index = 0; index < MISSIONS.length; index++) {
    const { exportName, title } = MISSIONS[index];
    const value = values[exportName];
    const introduced = !MISSIONS[index].extension || Math.max(activeIndex, requiredThrough) >= index;
    const present = value !== undefined && introduced && (!legacyMotion || ![3, 4, 5].includes(index) || typeof values[index === 5 ? 'moveLeft' : 'moveRight'] === 'function');
    if (!present && (index <= requiredThrough || index === activeIndex)) validateValue(index, undefined);
    if (present || program[exportName] === undefined) program[exportName] = present ? validateValue(index, value) : compileModule(index, MISSIONS[index].solution);
    if (present) {
      modules.push(index);
      const moduleChecks = checkMission(index, value);
      if (moduleChecks.some(check => !check.passed)) projectFailures.push(title);
      if (index === activeIndex) checks = moduleChecks;
    }
  }
  program.startX = values.startX ?? 43;
  program.chooseAnimation = values.chooseAnimation ?? (player => player.vx === 0 ? 'Idle' : 'Run');
  program.canJump = values.canJump ?? (() => true);
  program.limitFall = values.limitFall ?? (velocity => Math.min(velocity, 9));
  program.createFruitLine = values.createFruitLine ?? (count => Array.from({ length: count }, (_, index) => index * program.fruitGap));
  program.features = getGameFeatures(Object.fromEntries(modules.map(index => [index, 'defined'])));
  return programResult(program, checks, projectFailures, modules);
}

function programResult(program, checks, projectFailures, modules) {
  const positions = program.createFruitLine(3);
  if (!Array.isArray(positions) || positions.length > 20 || !positions.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 500)) throw new Error('La ligne de fruits doit être une liste de positions numériques, avec au maximum 20 fruits.');
  return { program, checks, projectFailures, modules, config: { playerName: program.playerName, startX: program.startX ?? 43, speed: program.speed, jumpPower: program.jumpPower, gravity: program.gravity, fruitPoints: program.fruitPoints, targetScore: program.targetScore, fruitGap: program.fruitGap, fruitPositions: positions, features: program.features } };
}

function number(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${name} doit renvoyer un nombre. As-tu oublié return ?`);
  return Math.max(min, Math.min(max, value));
}
function boolean(value, name) {
  if (typeof value !== 'boolean') throw new Error(`${name} doit renvoyer true ou false, sans guillemets.`);
  return value;
}

export function stepProgram(program, state) {
  const { features } = program;
  let vx = 0;
  if (features.right) {
    const player = { ...state.player };
    program.updateX(player, { right: !!state.keys.right, left: features.left && !!state.keys.left }, program.speed);
    if (typeof player.x !== 'number' || !Number.isFinite(player.x)) throw new Error('player.x doit rester un nombre. Vérifie le calcul de la position.');
    vx = number(player.x - state.player.x, 'player.x', -20, 20);
  }
  let vy = state.player.vy;
  if (features.jump && state.keys.jump && boolean(program.canJump({ ...state.player }), 'canJump')) vy = number(program.jumpSpeed(program.jumpPower), 'jumpSpeed', -24, 24);
  vy = number(program.limitFall(vy + program.gravity), 'limitFall', -24, 15);
  const animation = features.animation ? program.chooseAnimation({ ...state.player, vx }) : 'Idle';
  if (!['Idle', 'Run'].includes(animation)) throw new Error('chooseAnimation doit renvoyer "Idle" ou "Run".');
  let score = state.score;
  for (let index = 0; index < (features.fruits ? state.pickupCount || 0 : 0); index++) score = number(program.addPoints(score, program.fruitPoints), 'addPoints', 0, 10000);
  const checkpoint = features.checkpoint && (state.checkpoint || boolean(program.canSave(state.player.x, 192), 'canSave'));
  const goalAllowed = features.goal && boolean(program.canWin(score, program.targetScore), 'canWin') && (!features.gate || boolean(program.canOpen(score, program.targetScore, checkpoint), 'canOpen'));
  const danger = features.danger && boolean(program.isDangerous({ active: state.trapActive }), 'isDangerous');
  const bonus = features.bonus ? number(program.fruitBonus(state.collectedCount || 0), 'fruitBonus', 0, 10000) : 0;
  const victoryText = features.victory ? program.victoryMessage(program.playerName, score + bonus) : 'Niveau terminé !';
  if (typeof victoryText !== 'string') throw new Error('victoryMessage doit renvoyer du texte entre guillemets.');
  return { vx, vy, animation, score, checkpoint, goalAllowed, danger, bonus, victoryText: victoryText.slice(0, 180) };
}
