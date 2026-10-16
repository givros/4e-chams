import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, solutionSource } from '../src/missions.js';
import { checkMission, compileModule, compileProgram, compileProject, stepProgram } from '../src/compiler.js';
import { integratePlayer } from '../src/physics.js';

test('Twenty progressive missions teach concepts and vary the student activities', () => {
  assert.equal(MISSIONS.length, 20);
  assert.deepEqual(MISSIONS.map(mission => mission.id), Array.from({ length: 20 }, (_, i) => i + 1));
  for (const item of MISSIONS) {
    assert.ok(item.task && item.hint && item.secondHint && item.outcome && item.challenge);
    assert.ok(item.lesson.text && item.lesson.example);
    assert.equal(item.steps.length, 2);
    assert.equal(item.minutes, undefined);
    assert.doesNotThrow(() => new Function(item.lesson.example), `Mission ${item.id} must teach valid JavaScript syntax.`);
    assert.ok(!/\bfor\s*\(|\.push\(|\bwhile\s*\(/.test(item.solution));
  }
  assert.equal(MISSIONS[0].exportName, 'playerName');
  assert.equal(MISSIONS[1].exportName, 'startX');
  assert.equal(MISSIONS[2].exportName, 'speed');
  assert.ok(!MISSIONS[3].solution.includes('if'));
  assert.ok(MISSIONS[4].solution.includes('if'));
});

for (const [index, item] of MISSIONS.entries()) {
  test(`Mission ${item.id} accepts its solution and explains a blank file`, () => {
    const solved = checkMission(index, compileModule(index, item.solution));
    assert.ok(solved.length >= 2);
    assert.ok(solved.every(check => check.passed), JSON.stringify(solved));
    assert.equal(item.starter, '', 'Every new file starts empty.');
    assert.throws(() => compileModule(index, item.starter), new RegExp(item.exportName));
  });
}

test('Behavioral checks accept different syntax and calculations', () => {
  const alternatives = {
    1: 'let startX = 20 + 20;',
    2: 'let speed = 3 + 1;',
    3: 'const updateX = (p, buttons, step) => { p.x += step; };',
    4: 'const updateX = (p, buttons, step) => { if (buttons.right) p.x += step; };',
    5: 'function updateX(p, buttons, step) { if (buttons.right) p.x = step + p.x; if (buttons.left) p.x += 0 - step; }',
    8: 'const jumpSpeed = power => 0 - power;',
    9: 'function canJump(p) { if (p.onGround) { return true; } else { return false; } }',
    11: 'function addPoints(a, b) { let total = b + a; return total; }',
    13: 'function canWin(a, b) { if (a < b) return false; return true; }',
    16: 'const fruitGap = 12 * 2;',
    17: 'function fruitBonus(n) { return n + n; }',
    18: 'function canOpen(s, t, flag) { if (!flag) return false; if (s < t) return false; return true; }',
    19: 'function victoryMessage(name, value) { return `${name} gagne ${value} points`; }'
  };
  for (const [index, code] of Object.entries(alternatives)) assert.ok(checkMission(Number(index), compileModule(Number(index), code)).every(check => check.passed), `Alternative ${index} should pass.`);
});

test('Checks catch hardcoded answers and missed boundary cases', () => {
  const mistakes = {
    3: 'function updateX(p, keys, speed) { p.x = 42; }',
    4: 'function updateX(p, keys, speed) { p.x += speed; }',
    5: 'function updateX(p, keys, speed) { if (keys.right) p.x += speed; else if (keys.left) p.x -= speed; }',
    9: 'function canJump(p) { return true; }',
    11: 'function addPoints(score, points) { return 6; }',
    13: 'function canWin(score, target) { return score > target; }',
    15: 'function canSave(x, target) { return x > target; }',
    18: 'function canOpen(score, target, flag) { return score >= target || flag; }'
  };
  for (const [index, code] of Object.entries(mistakes)) assert.ok(checkMission(Number(index), compileModule(Number(index), code)).some(check => !check.passed), `Mistake ${index} must not pass.`);
});

test('Bad types, missing exports and syntax errors are reported', () => {
  assert.throws(() => compileModule(2, 'const speed = "4";'), /nombre/);
  assert.throws(() => compileModule(2, 'const other = 4;'), /speed/);
  assert.throws(() => compileModule(0, 'const playerName = "broken;'), SyntaxError);
  assert.throws(() => compileModule(7, 'const gravity = Infinity;'), /nombre/);
});

test('The full program combines independent student files', () => {
  const { program, config, projectFailures } = compileProgram(MISSIONS.map(item => item.solution), 19);
  assert.deepEqual(projectFailures, []);
  assert.deepEqual(config.fruitPositions, [0, 24, 48]);
  const result = stepProgram(program, { player: { x: 200, vy: 0, onGround: true }, keys: { right: true, left: false, jump: true }, score: 2, pickupCount: 1, collectedCount: 3, checkpoint: false, trapActive: false });
  assert.equal(result.vx, 4);
  assert.ok(result.vy < 0);
  assert.equal(result.score, 3);
  assert.equal(result.checkpoint, true);
  assert.equal(result.goalAllowed, true);
  assert.equal(result.danger, false);
  assert.equal(result.bonus, 6);
  assert.ok(result.victoryText.includes('Ninja') && result.victoryText.includes('9'));
});

test('A broken earlier file is reported during final integration', () => {
  const sources = MISSIONS.map(item => item.solution);
  sources[13] = 'function canWin(score, target) { return score > target; }';
  const result = compileProgram(sources, 19);
  assert.deepEqual(result.projectFailures, [MISSIONS[13].title]);
});

test('Future mechanics stay unavailable even though the engine provides their underlying rules', () => {
  const { program, config } = compileProgram({ 0: 'const playerName = "Pixel";' }, 0);
  assert.equal(config.features.player, true);
  assert.ok(Object.entries(config.features).filter(([name]) => name !== 'player').every(([, value]) => value === false));
  const result = stepProgram(program, { player: { x: 430, vy: 0, onGround: true }, keys: { right: true, jump: true }, score: 0, pickupCount: 3, collectedCount: 3, checkpoint: false, trapActive: true });
  assert.equal(result.vx, 0, 'Movement must wait for the student’s own function.');
  assert.ok(result.vy > 0, 'Space must not trigger an untaught jump.');
  assert.equal(result.animation, 'Idle');
  assert.equal(result.score, 0);
  assert.equal(result.checkpoint, false);
  assert.equal(result.goalAllowed, false);
  assert.equal(result.danger, false);
  assert.equal(result.bonus, 0);
  assert.equal(result.victoryText, 'Niveau terminé !');
});

test('A mechanic appears when its own code is applied, rather than when its file is opened', () => {
  const sources = {};
  for (let index = 0; index <= 6; index++) sources[index] = MISSIONS[index].solution;
  const { program, config } = compileProgram(sources, 6);
  assert.equal(config.features.animation, true);
  assert.equal(config.features.jump, true);
  assert.equal(config.features.fruits, false);
  const result = stepProgram(program, { player: { x: 40, vy: 0, onGround: true }, keys: { right: true, jump: true }, score: 0, checkpoint: false, trapActive: true });
  assert.ok(result.vy < 0);
  assert.equal(result.animation, 'Run');
  assert.throws(() => compileProgram({ 0: MISSIONS[0].solution }, 19), /startX/);
});

test('The goal is reachable before the checkpoint rule is introduced, and respects that rule afterwards', () => {
  const sources = MISSIONS.slice(0, 13).map(item => item.solution);
  const state = { player: { x: 100, vy: 0, onGround: true }, keys: {}, score: 3, checkpoint: false, trapActive: true };
  const early = compileProgram(sources, 12);
  assert.equal(early.config.features.goal, true);
  assert.equal(early.config.features.danger, false);
  assert.equal(early.config.features.fruitLine, false);
  assert.equal(stepProgram(early.program, state).goalAllowed, true);
  assert.equal(stepProgram(early.program, { ...state, score: 2 }).goalAllowed, false);
  const complete = compileProgram(MISSIONS.map(item => item.solution), 19);
  assert.ok(Object.values(complete.config.features).every(Boolean));
  assert.equal(stepProgram(complete.program, state).goalAllowed, false);
  assert.equal(stepProgram(complete.program, { ...state, checkpoint: true }).goalAllowed, true);
});

test('Runtime failures produce actionable messages', () => {
  const source = solutionSource(3).replace(MISSIONS[3].solution, 'function updateX(p) { p.x = "broken"; }');
  const { program } = compileProject(source, 3);
  assert.throws(() => stepProgram(program, { player: { x: 40, vy: 0, onGround: true }, keys: { right: true }, score: 0, checkpoint: false, trapActive: false }), /player.x/);
});

test('Movement first repeats a calculation, then the student adds a keyboard condition', () => {
  const state = { player: { x: 40, vy: 0, onGround: true }, keys: {}, score: 0, checkpoint: false, trapActive: false };
  const automatic = compileProject(solutionSource(3), 3);
  assert.equal(stepProgram(automatic.program, state).vx, 4);
  assert.equal(automatic.config.features.controls, false);
  const controlled = compileProject(solutionSource(4), 4);
  assert.equal(stepProgram(controlled.program, state).vx, 0);
  assert.equal(stepProgram(controlled.program, { ...state, keys: { right: true } }).vx, 4);
  assert.equal(controlled.config.features.left, false);
  const both = compileProject(solutionSource(5), 5);
  assert.equal(stepProgram(both.program, { ...state, keys: { left: true } }).vx, -4);
  assert.equal(stepProgram(both.program, { ...state, keys: { left: true, right: true } }).vx, 0);
});

test('The airborne jump is removed by the student onGround rule', () => {
  const state = { player: { x: 60, vy: 1, onGround: false }, keys: { jump: true }, score: 0, checkpoint: false, trapActive: false };
  const early = compileProject(solutionSource(8), 8);
  assert.ok(stepProgram(early.program, state).vy < 0);
  const groundedOnly = compileProject(solutionSource(9), 9);
  assert.ok(stepProgram(groundedOnly.program, state).vy > 0);
});

test('Solid collision supports landing, wall blocking, ceilings and falling off', () => {
  const floor = { x: 16, y: 256, w: 448, h: 32 };
  const block = { x: 96, y: 208, w: 64, h: 48 };
  const body = { x: 105, y: 175, w: 18, h: 26, vx: 0, vy: 0, onGround: false };
  const landing = integratePlayer(body, 0, 9, [floor, block]);
  assert.equal(landing.y, 182);
  assert.equal(landing.onGround, true);
  const wall = integratePlayer({ ...body, x: 77, y: 230 }, 4, 0.45, [floor, block]);
  assert.equal(wall.x, 78);
  const underside = integratePlayer({ ...body, y: 260 }, 0, -8, [block]);
  assert.equal(underside.y, 256);
  const offEdge = integratePlayer({ ...body, x: 159, y: 182, onGround: true }, 4, 0.45, [floor, block]);
  assert.equal(offEdge.onGround, false);
  assert.ok(offEdge.y > 182);
});
