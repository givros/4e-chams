import test from 'node:test';
import assert from 'node:assert/strict';
import { updateLineOwners, inferLineOwners } from '../src/editor-lines.js';
import { CODE_STEP_INDEX } from '../src/course.js';

test('Appending a mission keeps earlier line ownership', () => {
  assert.deepEqual(updateLineOwners('const name = "Luna";', 'const name = "Luna";\n\nconst speed = 4;', [0], 1), [0, 1, 1]);
});

test('Inserting a branch inside an existing function marks only the new lines', () => {
  const before = 'function updateX(p, keys, speed) {\n  if (keys.right) p.x += speed;\n}';
  const after = before.replace('\n}', '\n  if (keys.left) p.x -= speed;\n}');
  assert.deepEqual(updateLineOwners(before, after, [2, 2, 2], 3), [2, 2, 3, 2]);
});

test('Edits and deletions retain unchanged ownership above and below the change', () => {
  const before = 'const name = "Luna";\nconst speed = 4;\n// spare\nfunction run() {}';
  const after = 'const name = "Luna";\nconst speed = 5;\nfunction run() {}';
  assert.deepEqual(updateLineOwners(before, after, [0, 1, 1, 2], 5), [0, 5, 2]);
});

test('A pasted edit preserves unchanged lines between separate changes', () => {
  assert.deepEqual(updateLineOwners('one\ntwo\nthree\nfour', 'ONE\ntwo\nthree\nFOUR', [0, 1, 2, 3], 4), [4, 1, 2, 4]);
});

test('An unchanged source keeps all saved owners and migration recognizes the X declarations', () => {
  const source = 'const playerName = "Luna";\nconst startX = 40;\nconst speed = 4;\nfunction updateX(p) {\n  p.x += 4;\n}';
  const owners = inferLineOwners(source);
  assert.deepEqual(owners, [0, CODE_STEP_INDEX[1], CODE_STEP_INDEX[2], CODE_STEP_INDEX[3], CODE_STEP_INDEX[3], CODE_STEP_INDEX[3]]);
  assert.deepEqual(updateLineOwners(source, source, owners, 19), owners);
});

test('Large pasted changes use bounded memory and retain the unchanged ends', () => {
  const before = ['head', ...Array.from({ length: 500 }, (_, i) => `old${i}`), 'tail'].join('\n');
  const after = ['head', ...Array.from({ length: 500 }, (_, i) => `new${i}`), 'tail'].join('\n');
  const owners = updateLineOwners(before, after, Array(502).fill(0), 3);
  assert.deepEqual(owners, [0, ...Array(500).fill(3), 0]);
});
