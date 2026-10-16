import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, solutionSource } from '../src/missions.js';
import { compileProject, stepProgram } from '../src/compiler.js';
import { freshState, sanitizeState, continueSource, prepareMissionSource } from '../src/project.js';
import { inferLineOwners } from '../src/editor-lines.js';

test('The single file grows through all twenty missions without losing earlier declarations', () => {
  let code = '';
  for (const [index, mission] of MISSIONS.entries()) {
    const previous = code;
    code = solutionSource(index);
    if (!mission.extension) assert.ok(code.startsWith(previous));
    else assert.equal((code.match(/function updateX/g) || []).length, 1, 'The left branch extends the existing function.');
    const result = compileProject(code, index);
    assert.ok(result.checks.every(check => check.passed));
    assert.deepEqual(result.projectFailures, []);
    assert.deepEqual(result.modules, Array.from({ length: index + 1 }, (_, i) => i));
  }
  const { program, config } = compileProject(code, 19);
  assert.ok(Object.values(config.features).every(Boolean));
  const result = stepProgram(program, { player: { x: 200, vy: 0, onGround: true }, keys: { right: true, jump: true }, score: 2, pickupCount: 1, collectedCount: 3, checkpoint: false, trapActive: false });
  assert.equal(result.vx, 4);
  assert.ok(result.vy < 0);
  assert.equal(result.score, 3);
  assert.equal(result.goalAllowed, true);
});

test('Student declarations share one scope, including helpers and alternative function syntax', () => {
  const code = [
    'const hero = "Pixel";',
    'const playerName = hero;',
    'const startX = 20 + 30;',
    'let speed = 2 + 2;',
    'function inverse(value) { return -value; }',
    'const updateX = (p, buttons, step) => { if (buttons.right) p.x += step; if (buttons.left) p.x += inverse(step); };'
  ].join('\n');
  const result = compileProject(code, 5);
  assert.deepEqual(result.projectFailures, []);
  assert.equal(result.config.playerName, 'Pixel');
  assert.equal(result.config.speed, 4);
  const player = { x: 50 };
  result.program.updateX(player, { left: true }, 5);
  assert.equal(player.x, 45);
  assert.equal(result.config.startX, 50);
});

test('A newly added rule cannot silently replace missing or broken previous code with engine defaults', () => {
  assert.throws(() => compileProject(MISSIONS[3].solution, 3), /playerName/);
  const broken = [MISSIONS[0].solution, MISSIONS[1].solution, 'const speed = 2;', MISSIONS[3].solution].join('\n\n');
  const result = compileProject(broken, 3);
  assert.ok(result.checks.every(check => check.passed));
  assert.deepEqual(result.projectFailures, [MISSIONS[2].title]);
  const removed = [MISSIONS[0].solution, MISSIONS[1].solution, MISSIONS[3].solution].join('\n\n');
  assert.throws(() => compileProject(removed, 0, 3), /speed/);
  assert.throws(() => compileProject('', 0), /playerName/);
  assert.throws(() => compileProject(MISSIONS[0].solution + '\nconst playerName = "Again";', 0), SyntaxError);
});

test('Legacy drafts and verified rules migrate to a single file while preserving unfinished edits', () => {
  const name = 'const playerName = "My Hero";';
  const speed = 'let speed = 4;';
  const pending = '// My next rule\nfunction moveRight(speed) {\n  return';
  const result = sanitizeState({ version: 1, index: 2, completed: [0, 1], drafts: { 0: name, 1: speed, 2: pending }, applied: { 0: name, 1: speed }, character: 'Pink Man' });
  assert.equal(result.version, 5);
  assert.equal(result.code, [name, speed, pending].join('\n\n'));
  assert.equal(result.verifiedCode, [name, speed].join('\n\n'));
  assert.deepEqual(result.verifiedModules, [0, 1, 2]);
  assert.deepEqual(result.completed, [0]);
  assert.equal(result.index, 1, 'New practice and assessment steps are not marked complete during migration.');
  assert.equal(result.character, 'Pink Man');
  assert.equal(result.introSeen, true);
  assert.equal(result.legacyCourse, true);
  assert.equal(result.lineOwners.length, result.code.split('\n').length);
  assert.ok(!('drafts' in result) && !('applied' in result));
});

test('Migration removes old untouched exercise templates and preserves a deliberately cleared draft', () => {
  const fresh = sanitizeState({ version: 1, completed: [], drafts: { 0: 'const playerName = "Player";' }, applied: {} });
  assert.equal(fresh.code, '');
  assert.equal(fresh.introSeen, false);
  const cleared = sanitizeState({ version: 1, completed: [0], drafts: { 0: '' }, applied: { 0: MISSIONS[0].solution } });
  assert.equal(cleared.code, '');
  assert.equal(cleared.verifiedCode, MISSIONS[0].solution);
});

test('Single-file backups round-trip code, progress, and the last verified source exactly', () => {
  const state = { ...freshState(), introSeen: true, index: 1, completed: [0], code: MISSIONS[0].solution + '\n\n// Working here\n', verifiedCode: MISSIONS[0].solution, verifiedModules: [0] };
  state.lineOwners = [0, 1, 1, 1];
  state.verifiedOwners = [0];
  assert.deepEqual(sanitizeState(JSON.parse(JSON.stringify(state))), state);
  assert.equal(continueSource(''), '');
  assert.equal(continueSource('const speed = 4;\n\n'), 'const speed = 4;\n\n');
  assert.equal(continueSource('const speed = 4;\n'), 'const speed = 4;\n\n');
});

test('Position and speed are separate missions, with varied numeric expressions accepted', () => {
  assert.throws(() => compileProject(MISSIONS[0].solution + '\nconst speed = 4;', 1), /startX/);
  for (const startX of [24, 43, 70]) {
    const result = compileProject(MISSIONS[0].solution + `\nconst speed = 8 / 2; const startX = ${startX};`, 1);
    assert.deepEqual(result.projectFailures, []);
    assert.equal(result.config.startX, startX);
  }
});

test('Older backups preserve source and behavior through the movement adapter', () => {
  const source = [MISSIONS[0].solution, 'const speed = 4;', 'function moveRight(step) { return step; }', 'function moveLeft(step) { return -step; }'].join('\n');
  const saved = sanitizeState({ version: 2, completed: [0, 1, 2, 3], code: source, verifiedCode: source, verifiedModules: [0, 1, 2, 3] });
  assert.equal(saved.code, source);
  assert.deepEqual(saved.completed, [0]);
  assert.deepEqual(saved.verifiedModules, [0, 1, 2, 3, 4, 5]);
  const result = compileProject(source, 5, 5, { allowLegacyCourse: saved.legacyCourse });
  assert.deepEqual(result.projectFailures, []);
  const player = { x: 80 };
  result.program.updateX(player, { left: true }, 4);
  assert.equal(player.x, 76);
  const early = compileProject([MISSIONS[0].solution, 'const speed = 4;'].join('\n'), 2, 2, { allowLegacyCourse: true });
  assert.deepEqual(early.projectFailures, []);
  assert.equal(early.config.startX, 43);
});

test('Scaffolds are added once and the keyboard missions edit the same movement function', () => {
  const previous = solutionSource(2);
  const prepared = prepareMissionSource(previous, 3, [0, 1, 2]);
  assert.equal(prepared, continueSource(previous) + MISSIONS[3].scaffold);
  assert.equal(prepareMissionSource(prepared, 3, [0, 1, 2]), prepared);
  const right = solutionSource(3);
  assert.equal(prepareMissionSource(right, 4, [0, 1, 2, 3]), right);
  for (const index of [8, 9, 11, 13, 14, 15, 17, 18, 19]) {
    const source = prepareMissionSource(solutionSource(index - 1), index, Array.from({ length: index }, (_, i) => i));
    const result = compileProject(source, index);
    assert.ok(result.checks.some(check => !check.passed), `Scaffold ${index} needs a real correction.`);
  }
});

test('Imported line metadata is validated and does not alter source', () => {
  const code = solutionSource(4);
  const state = sanitizeState({ ...freshState(), code, verifiedCode: code, lineOwners: [999], verifiedOwners: 'invalid', predictions: { 2: 99, 4: 1, 10: 0 } });
  assert.deepEqual(state.lineOwners, inferLineOwners(code));
  assert.deepEqual(state.verifiedOwners, inferLineOwners(code));
  assert.equal('predictions' in state, false);
  assert.equal(state.code, code);
});

test('The complete previous curriculum remains playable without rewriting saved source', () => {
  let source = solutionSource();
  const previousNames = { jumpSpeed: 'jumpDirection', addPoints: 'collectFruit', canWin: 'canFinish', canSave: 'shouldSaveCheckpoint', canOpen: 'canOpenGate', victoryMessage: 'describeVictory' };
  for (const [name, previous] of Object.entries(previousNames)) source = source.replaceAll(name, previous);
  source = source.replace('const fruitGap = 24;', 'function createFruitLine(count) { return Array.from({ length: count }, (_, i) => i * 24); }');
  const saved = sanitizeState({ version: 3, index: 19, completed: Array.from({ length: 20 }, (_, i) => i), code: source, verifiedCode: source, verifiedModules: Array.from({ length: 20 }, (_, i) => i) });
  assert.equal(saved.code, source);
  assert.equal(saved.completed.length, 1);
  assert.equal(saved.verifiedModules.length, 20);
  const result = compileProject(saved.code, 19, 19, { allowLegacyCourse: saved.legacyCourse });
  assert.deepEqual(result.projectFailures, []);
  assert.ok(Object.values(result.config.features).every(Boolean));
  assert.deepEqual(result.config.fruitPositions, [0, 24, 48]);
});
