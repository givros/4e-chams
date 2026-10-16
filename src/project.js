import { MISSIONS } from './missions.js';
import { CHARACTERS } from './game.js';
import { inferLineOwners } from './editor-lines.js';
import { LEGACY_MISSIONS, LEGACY_PROGRESS } from './legacy-curriculum.js';
import { COURSE, CODE_STEP_INDEX } from './course.js';
import { sanitizeQuizResult, sanitizePracticeResult, quizPassed, practicePassed } from './assessment.js';

export const SOURCE_FILE = 'game.js';
export const MAX_SOURCE_LENGTH = 400000;

export const freshState = () => ({ version: 5, introSeen: false, index: 0, completed: [], code: '', verifiedCode: '', verifiedModules: [], lineOwners: [-1], verifiedOwners: [-1], quizResults: {}, practiceResults: {}, legacyCourse: false, character: CHARACTERS[0] });

export function continueSource(source) {
  if (!source || source.endsWith('\n\n')) return source;
  return source + (source.endsWith('\n') ? '\n' : '\n\n');
}

export function prepareMissionSource(source, index, completed) {
  const mission = MISSIONS[index];
  if (!mission.scaffold || mission.edit || completed.includes(index)) return source;
  const declaration = new RegExp('\\b(?:function|const|let|var)\\s+' + mission.exportName + '\\b');
  return declaration.test(source) ? source : continueSource(source) + mission.scaffold;
}

function legacySource(input, completed, appliedOnly = false) {
  const parts = [];
  for (let index = 0; index < MISSIONS.length; index++) {
    const draft = input.drafts?.[index];
    const applied = input.applied?.[index];
    const source = appliedOnly ? applied : typeof draft === 'string' ? draft : applied;
    if (typeof source !== 'string' || source.length > 16000 || !source.trim()) continue;
    if (!appliedOnly && !completed.includes(index) && LEGACY_MISSIONS[index].previousStarters.includes(source)) continue;
    parts.push(source);
  }
  return parts.join('\n\n');
}

export function sanitizeState(input) {
  if (!input || ![1, 2, 3, 4, 5].includes(input.version) || !Array.isArray(input.completed)) throw new Error('Cette sauvegarde n’est pas au format Code Quest.');
  const result = freshState();
  const expanded = input.version === 5;
  const completedSet = new Set(input.completed);
  for (let index = 0; index < (expanded ? COURSE.length : MISSIONS.length) && completedSet.has(index); index++) result.completed.push(index);
  const oldCompleted = [...result.completed];
  const legacy = input.version < 4;
  const legacyModules = indices => [...new Set(indices.flatMap(index => Array.from({ length: LEGACY_PROGRESS[index + 1] - LEGACY_PROGRESS[index] }, (_, offset) => LEGACY_PROGRESS[index] + offset)))].sort((a, b) => a - b);
  if (legacy) result.completed = legacyModules(result.completed);
  const index = Number.isInteger(input.index) ? input.index : 0;
  const coreIndex = Math.max(0, Math.min(legacy ? LEGACY_PROGRESS[index] ?? 0 : index, MISSIONS.length - 1));
  if (input.version === 1) {
    result.code = legacySource(input, oldCompleted);
    result.verifiedCode = legacySource(input, oldCompleted, true);
    result.verifiedModules = legacyModules(MISSIONS.flatMap((_, index) => typeof input.applied?.[index] === 'string' && input.applied[index].trim() ? [index] : []));
  } else {
    for (const key of ['code', 'verifiedCode']) {
      if (typeof input[key] !== 'string' || input[key].length > MAX_SOURCE_LENGTH) throw new Error('Le fichier de code de cette sauvegarde est invalide ou trop volumineux.');
      result[key] = input[key];
    }
    if (Array.isArray(input.verifiedModules)) {
      const modules = [...new Set(input.verifiedModules.filter(index => Number.isInteger(index) && index >= 0 && index < MISSIONS.length))].sort((a, b) => a - b);
      result.verifiedModules = legacy ? legacyModules(modules) : modules;
    }
  }
  const ownersFor = (key, source) => Array.isArray(input[key]) && input[key].length === source.split('\n').length && input[key].every(index => Number.isInteger(index) && index >= -1 && index < (expanded ? COURSE.length : MISSIONS.length)) ? input[key].map(index => !expanded && index >= 0 ? CODE_STEP_INDEX[legacy ? Math.min(19, LEGACY_PROGRESS[index]) : index] : index) : inferLineOwners(source);
  result.lineOwners = ownersFor('lineOwners', result.code);
  result.verifiedOwners = ownersFor('verifiedOwners', result.verifiedCode);
  for (const step of COURSE) {
    if (step.kind === 'quiz' && input.quizResults?.[step.id]) result.quizResults[step.id] = sanitizeQuizResult(step, input.quizResults[step.id]);
    if (step.kind === 'practice' && input.practiceResults?.[step.id]) result.practiceResults[step.id] = sanitizePracticeResult(step, input.practiceResults[step.id]);
  }
  const completed = new Set(result.completed);
  result.completed = [];
  for (const step of COURSE) {
    const requested = expanded ? completed.has(step.index) : step.kind === 'code' && completed.has(step.moduleIndex);
    if (!requested) break;
    if (expanded && step.kind === 'quiz' && !quizPassed(step, result.quizResults[step.id])) break;
    if (expanded && step.kind === 'practice' && !practicePassed(step, result.practiceResults[step.id])) break;
    result.completed.push(step.index);
  }
  result.index = Math.max(0, Math.min(expanded ? index : CODE_STEP_INDEX[coreIndex], result.completed.length, COURSE.length - 1));
  if (CHARACTERS.includes(input.character)) result.character = input.character;
  result.legacyCourse = legacy || input.legacyCourse === true;
  result.introSeen = input.introSeen === true || result.completed.length > 0 || result.verifiedModules.length > 0;
  return result;
}

export function verifiedFeatures(state) {
  return Object.fromEntries(state.verifiedModules.map(index => [index, 'verified']));
}
