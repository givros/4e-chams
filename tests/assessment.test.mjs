import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSE, COURSE_PHASES, MISSION_COUNT, QUIZ_COUNT, CODE_STEP_INDEX } from '../src/course.js';
import { sanitizeQuizResult, gradeQuestion, questionPassed, quizPassed, recordPracticeSample, practicePassed, observePractice, assessmentSummary, sanitizePracticeResult } from '../src/assessment.js';
import { freshState, sanitizeState } from '../src/project.js';
import { solutionSource } from '../src/missions.js';
import { inferLineOwners } from '../src/editor-lines.js';

const step = id => COURSE.find(item => item.id === id);
const snapshot = (extra = {}) => ({ x: 43, y: 230, vx: 0, onGround: true, jumps: 0, airAttempts: 0, pickups: 0, deaths: 0, score: 0, checkpoint: false, won: false, right: false, config: { startX: 43, speed: 4, fruitPoints: 2 }, ...extra });
const run = () => ({ startX: 43, stage: 0 });
const passedQuiz = quiz => ({ cursor: quiz.questions.length - 1, questions: quiz.questions.map(question => ({ choice: question.correct, checked: true, attempts: 1 })) });

test('Forty missions plus twelve assessments form a prerequisite-ordered course', () => {
  assert.equal(COURSE.length, 52);
  assert.equal(MISSION_COUNT, 40);
  assert.equal(QUIZ_COUNT, 12);
  assert.equal(COURSE.filter(item => item.kind === 'code').length, 20);
  assert.equal(COURSE.filter(item => item.kind === 'practice').length, 20);
  assert.equal(new Set(COURSE.map(item => item.id)).size, COURSE.length);
  let taught = -1;
  for (const item of COURSE) {
    if (item.kind === 'code') taught = item.moduleIndex;
    else assert.ok(item.moduleIndex <= taught, item.id + ' needs an untaught rule.');
  }
  assert.equal(COURSE.at(-1).final, true);
  COURSE_PHASES.forEach((_, phase) => assert.equal(COURSE.filter(item => item.phase === phase && item.kind !== 'quiz').length, 5));
  for (const quiz of COURSE.filter(item => item.kind === 'quiz')) {
    assert.ok(quiz.questions.length >= 2);
    for (const question of quiz.questions) {
      assert.ok(question.prompt && question.options.length === 3);
      assert.ok(question.options[question.correct]);
      assert.ok(question.options.every(option => option.feedback));
      assert.doesNotThrow(() => new Function(question.snippet));
    }
  }
});

test('A quiz requires checked answers for every question and records retries', () => {
  const quiz = step('quiz-read');
  let result = sanitizeQuizResult(quiz);
  assert.equal(quizPassed(quiz, result), false);
  assert.equal(gradeQuestion(quiz, result, 0).submitted, false);
  result.questions[0].choice = 1;
  let grade = gradeQuestion(quiz, result, 0);
  assert.equal(grade.passed, false);
  assert.equal(grade.result.questions[0].attempts, 1);
  grade.result.questions[0].choice = quiz.questions[0].correct;
  grade = gradeQuestion(quiz, grade.result, 0);
  assert.equal(grade.passed, true);
  assert.equal(grade.result.questions[0].attempts, 2);
  assert.equal(quizPassed(quiz, grade.result), false);
  grade.result.questions[1].choice = quiz.questions[1].correct;
  const complete = gradeQuestion(quiz, grade.result, 1).result;
  assert.equal(quizPassed(quiz, complete), true);
  assert.equal(questionPassed(quiz, complete, 0), true);
});

test('Quiz imports reject invalid choices and do not turn an unchecked correct choice into mastery', () => {
  const quiz = step('quiz-read');
  const result = sanitizeQuizResult(quiz, { cursor: 900, questions: [{ choice: '0', checked: true, attempts: 1 }, { choice: 99, checked: true, attempts: -1 }] });
  assert.equal(result.cursor, 1);
  assert.ok(result.questions.every(answer => answer.choice === null && !answer.checked));
  const unchecked = passedQuiz(quiz);
  unchecked.questions[0].checked = false;
  assert.equal(quizPassed(quiz, unchecked), false);
});

test('Experiments require two meaningfully different values and deduplicate identical retries', () => {
  const mission = step('gravity-compare');
  let result = recordPracticeSample(mission, undefined, { gravity: 0.35 });
  result = recordPracticeSample(mission, result, { gravity: 0.35 });
  assert.equal(result.samples.length, 1);
  assert.equal(practicePassed(mission, result), false);
  result = recordPracticeSample(mission, result, { gravity: 0.45 });
  assert.equal(practicePassed(mission, result), true);
  const names = step('name-swap');
  assert.equal(practicePassed(names, { samples: ['Nova', 'Nova '] }), false);
  assert.equal(practicePassed(names, { samples: ['Nova', 'Pixel'] }), true);
});

test('Final tuning requires two settings to change between played samples', () => {
  const mission = step('final-tuning');
  let result = recordPracticeSample(mission, undefined, { speed: 3, jumpPower: 9, gravity: 0.5 });
  result = recordPracticeSample(mission, result, { speed: 5, jumpPower: 9, gravity: 0.5 });
  assert.equal(practicePassed(mission, result), false);
  result = recordPracticeSample(mission, result, { speed: 5, jumpPower: 11, gravity: 0.5 });
  assert.equal(practicePassed(mission, result), true);
  assert.equal(sanitizePracticeResult(mission, { samples: [{ speed: 'bad' }] }).samples.length, 0);
});

test('Jumping and collection experiments cannot be recorded before the corresponding game action', () => {
  assert.equal(observePractice(step('jump-compare').rule, run(), snapshot()).done, false);
  assert.equal(observePractice(step('jump-compare').rule, run(), snapshot({ jumps: 1 })).done, true);
  assert.equal(observePractice(step('fruit-compare').rule, run(), snapshot()).done, false);
  assert.equal(observePractice(step('fruit-compare').rule, run(), snapshot({ pickups: 1 })).done, true);
  assert.equal(observePractice(step('speed-compare').rule, run(), snapshot({ x: 50 })).done, false);
  assert.equal(observePractice(step('speed-compare').rule, run(), snapshot({ x: 60 })).done, true);
});

test('A return trip requires the outbound position before returning near the start', () => {
  const rule = step('return-trip').rule;
  assert.equal(observePractice(rule, run(), snapshot()).done, false);
  const outbound = observePractice(rule, run(), snapshot({ x: 122 }));
  assert.equal(outbound.done, false);
  assert.equal(observePractice(rule, outbound, snapshot({ x: 46 })).done, true);
});

test('Stopping requires releasing the command rather than running into the wall', () => {
  const rule = step('walk-stop').rule;
  let progress = observePractice(rule, run(), snapshot({ x: 120, right: true }));
  for (let i = 0; i < 5; i++) progress = observePractice(rule, progress, snapshot({ x: 446, right: true }));
  assert.equal(progress.done, false);
  for (let i = 0; i < 3; i++) progress = observePractice(rule, progress, snapshot({ x: 120 }));
  assert.equal(progress.done, true);
});

test('Landing checks the correct platform, height, and actual contact', () => {
  const rule = step('high-platform').rule;
  assert.equal(observePractice(rule, run(), snapshot({ x: 250, y: 150, jumps: 2, onGround: false })).done, false);
  assert.equal(observePractice(rule, run(), snapshot({ x: 250, y: 150, jumps: 2 })).done, true);
  assert.equal(observePractice(rule, run(), snapshot({ x: 125, y: 182, jumps: 1 })).done, false);
});

test('Air jump validation requires an attempted second input with no second jump', () => {
  const rule = step('air-guard').rule;
  assert.equal(observePractice(rule, run(), snapshot({ jumps: 1 })).done, false);
  assert.equal(observePractice(rule, run(), snapshot({ jumps: 2, airAttempts: 1 })).done, false);
  assert.equal(observePractice(rule, run(), snapshot({ jumps: 1, airAttempts: 1 })).done, true);
});

test('A harvest challenge checks the setting, count, and accumulated score', () => {
  const rule = step('fruit-trio').rule;
  assert.ok(!observePractice(rule, run(), snapshot({ pickups: 3, score: 6, config: { fruitPoints: 1 } })).done);
  assert.equal(observePractice(rule, run(), snapshot({ pickups: 3, score: 2 })).done, false);
  assert.equal(observePractice(rule, run(), snapshot({ pickups: 3, score: 6 })).done, true);
});

test('Checkpoint proof requires a new death after activation and a real return to the flag', () => {
  const rule = step('checkpoint-test').rule;
  const activated = observePractice(rule, run(), snapshot({ checkpoint: true, deaths: 1, x: 195 }));
  assert.equal(activated.done, false);
  assert.equal(observePractice(rule, activated, snapshot({ checkpoint: true, deaths: 2, x: 195 })).done, true);
  assert.equal(observePractice(rule, activated, snapshot({ checkpoint: true, deaths: 2, x: 43 })).done, false);
});

test('Fire crossing must be approached, safe, grounded, and unburned', () => {
  const rule = step('fire-timing').rule;
  const approached = observePractice(rule, run(), snapshot({ x: 290 }));
  assert.equal(observePractice(rule, run(), snapshot({ x: 325 })).done, false);
  assert.equal(observePractice(rule, approached, snapshot({ x: 325, trapActive: true })).done, false);
  assert.equal(observePractice(rule, approached, snapshot({ x: 325, deaths: 1 })).done, false);
  assert.equal(observePractice(rule, approached, snapshot({ x: 325, trapActive: false })).done, true);
});

test('All assessment and experiment records round-trip without losing the full project', () => {
  const state = { ...freshState(), introSeen: true, index: COURSE.length - 1, completed: COURSE.map(item => item.index), code: solutionSource(), verifiedCode: solutionSource(), verifiedModules: Array.from({ length: 20 }, (_, i) => i) };
  state.lineOwners = inferLineOwners(state.code);
  state.verifiedOwners = [...state.lineOwners];
  for (const item of COURSE) {
    if (item.kind === 'quiz') state.quizResults[item.id] = passedQuiz(item);
    if (item.kind === 'practice') {
      state.practiceResults[item.id] = item.rule.kind === 'compare-settings' ? { samples: [{ speed: 3, jumpPower: 9, gravity: 0.4 }, { speed: 5, jumpPower: 11, gravity: 0.5 }], played: false }
        : item.rule.kind === 'compare' ? { samples: item.rule.field === 'playerName' ? ['Nova', 'Pixel'] : [1, 60], played: false } : { samples: [], played: true };
    }
  }
  assert.deepEqual(sanitizeState(JSON.parse(JSON.stringify(state))), state);
  const summary = assessmentSummary(COURSE, state.quizResults);
  assert.equal(summary.passed, 12);
  assert.ok(summary.questions >= 24);
  assert.equal(CODE_STEP_INDEX.at(-1), COURSE.length - 1);
});

test('Import cannot silently complete newly added quizzes or unplayed practice steps', () => {
  const input = { ...freshState(), completed: [0, 1, 2, 3], index: 3, code: solutionSource(1), verifiedCode: solutionSource(1), verifiedModules: [0, 1] };
  assert.deepEqual(sanitizeState(input).completed, [0]);
  input.practiceResults['name-swap'] = { samples: ['Nova', 'Pixel'], played: false };
  input.quizResults['quiz-read'] = passedQuiz(step('quiz-read'));
  input.quizResults['quiz-read'].questions[0].checked = false;
  assert.deepEqual(sanitizeState(input).completed, [0, 1]);
});
