import { MISSIONS, STORAGE_KEY, getGameFeatures, solutionSource } from './missions.js';
import { COURSE, COURSE_PHASES, MISSION_COUNT, QUIZ_COUNT, codeModulesThrough } from './course.js';
import { sanitizeQuizResult, gradeQuestion, questionPassed, quizPassed, recordPracticeSample, practicePassed, observePractice, assessmentSummary } from './assessment.js';
import { StudentRuntime } from './runtime.js';
import { WorkshopGame, CHARACTERS } from './game.js';
import { createPaneSplitter } from './splitter.js';
import { freshState, sanitizeState, continueSource, prepareMissionSource, verifiedFeatures, SOURCE_FILE } from './project.js';
import { updateLineOwners } from './editor-lines.js';

export { sanitizeState } from './project.js';

const $ = id => document.getElementById(id);
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHTML = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const inlineCode = text => escapeHTML(text).replace(/`([^`]+)`/g, '<code>$1</code>');

let state;
let storageAvailable = true;
try { const saved = localStorage.getItem(STORAGE_KEY); state = saved ? sanitizeState(JSON.parse(saved)) : freshState(); }
catch { state = freshState(); storageAvailable = false; }

let openPhase = COURSE[state.index].phase;
let lastRun = null;
let lastRunIndex = -1;
let runSequence = 0;
let checking = false;
let introActive = !state.introSeen;
let hintDepth = 0;
let saveTimer;
let toastTimer;
let confirmationAction;
let practiceRun = null;
let lastWin = null;
const currentStep = () => COURSE[state.index];

const runtime = new StudentRuntime(error => showError(error));
export const game = new WorkshopGame($('game-canvas'), runtime, {
  onState: status => {
    $('metric-score').textContent = status.score;
    $('metric-x').textContent = status.x;
    $('game-state').textContent = !game.playable ? 'À vérifier' : status.won ? 'Victoire !' : status.blocked ? game.features.gate && !status.checkpoint ? 'Drapeau requis' : 'Score insuffisant' : status.running ? 'En jeu' : 'À toi de jouer';
    observeCurrentPractice();
  },
  onFocus: () => updatePlaybackUI(),
  onReset: () => { lastWin = null; if (practiceRun) practiceRun = { index: practiceRun.index, config: practiceRun.config, startX: game.player.x, stage: 0 }; $('game-win').hidden = true; updatePlaybackUI(); },
  onLock: () => { $('game-win').hidden = true; updatePlaybackUI(); },
  onWin: result => {
    lastWin = result;
    $('victory-message').textContent = result.text;
    $('victory-score').textContent = game.features.bonus ? `${result.score} points + ${result.bonus} de prime` : `${result.score} points`;
    $('game-win').hidden = false;
    $('focus-hint').hidden = true;
    if (currentStep().final && !introActive) completeMission();
  },
  onError: error => showError(error)
});
game.character = state.character;

function updatePlaybackUI() {
  const playable = game.playable && !game.failed;
  $('focus-hint-label').textContent = playable ? 'Clique pour jouer' : introActive ? 'Préparation du jeu…' : 'Vérifie ton code';
  $('focus-hint').hidden = playable && (document.activeElement === $('game-canvas') || game.won);
  document.querySelector('.game-viewport').classList.toggle('is-locked', !playable);
  $('game-canvas').setAttribute('aria-disabled', String(!playable));
  $('replay-button').disabled = !playable;
  $('jump-control').hidden = !game.features.jump;
  $('move-control').hidden = !game.features.controls;
  $('left-key').hidden = !game.features.left;
  $('game-inspector').hidden = introActive || !game.features.position;
  $('avatar-controls').hidden = !game.features.player;
  $('metric-jump').parentElement.hidden = !game.features.jump;
  $('metric-x').parentElement.hidden = !game.features.position;
  $('metric-speed').parentElement.hidden = !game.features.speed;
  $('metric-score').parentElement.hidden = !game.features.fruits;
  $('metric-target').parentElement.hidden = !game.features.goal;
  $('game-canvas').setAttribute('aria-label', 'Jeu de plateforme. Flèches pour se déplacer.' + (game.features.jump ? ' Espace pour sauter.' : ''));
}

function invalidateExecution() {
  practiceRun = null;
  runSequence++;
  runtime.stop();
  game.lock();
  lastRun = null;
  lastRunIndex = -1;
  $('next-button').hidden = true;
  updatePlaybackUI();
}

function recordSource(source) {
  if (source === state.code) return;
  state.lineOwners = updateLineOwners(state.code, source, state.lineOwners, state.index);
  state.code = source;
}

function saveNow() {
  clearTimeout(saveTimer);
  recordSource($('code-editor').value);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
    $('save-status').textContent = 'Enregistré';
  } catch {
    storageAvailable = false;
    $('save-status').textContent = 'Sauvegarde indisponible · utilise Exporter';
  }
}

function scheduleSave() { $('save-status').textContent = 'Enregistrement…'; clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4200);
}

function renderNavigation() {
  $('mission-navigation').replaceChildren();
  COURSE_PHASES.forEach((phase, phaseIndex) => {
    const items = COURSE.filter(item => item.phase === phaseIndex);
    const section = document.createElement('section');
    section.className = 'phase-section' + (openPhase === phaseIndex ? ' is-open' : '');
    const header = document.createElement('button');
    header.className = 'phase-button';
    header.type = 'button';
    header.setAttribute('aria-expanded', String(openPhase === phaseIndex));
    const count = items.filter(item => state.completed.includes(item.index)).length;
    header.innerHTML = `<span class="phase-number">${phaseIndex + 1}</span><span>${escapeHTML(phase.title)}</span><span class="phase-count">${count}/${items.length}</span>${icon('chevron')}`;
    header.addEventListener('click', () => { openPhase = phaseIndex; renderNavigation(); });
    section.append(header);
    if (openPhase === phaseIndex) {
      const list = document.createElement('div');
      list.className = 'mission-list';
      for (const item of items) {
        const index = item.index;
        const completed = state.completed.includes(index);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mission-button ' + item.kind + (state.index === index ? ' active' : '') + (completed ? ' complete' : '');
        button.disabled = index > state.completed.length;
        button.setAttribute('aria-current', state.index === index ? 'step' : 'false');
        button.setAttribute('aria-label', `${item.kind === 'quiz' ? 'Bilan QCM' : 'Mission'} ${item.number} : ${item.title}${completed ? ', terminée' : ''}`);
        button.innerHTML = `<span class="mission-order">${completed ? icon('check') : item.kind === 'quiz' ? 'Q' + item.number : String(item.number).padStart(2, '0')}</span><span><strong>${escapeHTML(item.title)}</strong></span>`;
        button.addEventListener('click', () => visitMission(index));
        list.append(button);
      }
      section.append(list);
    }
    $('mission-navigation').append(section);
  });
  $('progress-number').textContent = `${state.completed.length}/${COURSE.length}`;
  $('mission-progress').textContent = `${state.completed.filter(index => COURSE[index].kind !== 'quiz').length}/${MISSION_COUNT} missions`;
  $('quiz-progress').textContent = `${state.completed.filter(index => COURSE[index].kind === 'quiz').length}/${QUIZ_COUNT} bilans`;
  $('progress-fill').style.width = `${state.completed.length / COURSE.length * 100}%`;
  document.querySelector('.overall-progress').setAttribute('aria-valuenow', state.completed.length);
  $('mission-navigation').querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function highlightCode(source) {
  const pattern = /\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|true|false|null|undefined|new|break|continue)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*(?=\s*\()/g;
  let html = '', previous = 0;
  for (const match of source.matchAll(pattern)) {
    html += escapeHTML(source.slice(previous, match.index));
    const token = match[0];
    const type = token.startsWith('//') ? 'comment' : /^["'`]/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : /^(const|let|var|function|return|if|else|for|while|true|false|null|undefined|new|break|continue)$/.test(token) ? 'keyword' : 'function';
    html += `<span class="token-${type}">${escapeHTML(token)}</span>`;
    previous = match.index + token.length;
  }
  return html + escapeHTML(source.slice(previous));
}

function updateHighlight() {
  const source = $('code-editor').value;
  $('code-highlight').firstElementChild.innerHTML = highlightCode(source) + '\n';
  $('line-numbers').innerHTML = source.split('\n').map((_, index) => `<span${state.lineOwners[index] === state.index ? ' class="current-mission-line"' : ''}>${index + 1}</span>`).join('');
  $('mission-line-label').textContent = currentStep().kind === 'quiz' ? 'Lecture du code' : 'Ajouts en vert';
  const line = source.slice(0, editorTarget(state.index)).split('\n').length;
  $('focus-code').textContent = `Ligne ${line} ↓`;
  $('focus-code').setAttribute('aria-label', `Écrire à la ligne ${line}`);
  $('dirty-dot').hidden = source === lastRun && state.index === lastRunIndex;
  $('reset-code').disabled = source === state.verifiedCode;
  syncScroll();
}

function syncScroll() {
  $('code-highlight').scrollTop = $('code-editor').scrollTop;
  $('code-highlight').scrollLeft = $('code-editor').scrollLeft;
  $('line-numbers').scrollTop = $('code-editor').scrollTop;
  const lineHeight = parseFloat(getComputedStyle($('code-editor')).lineHeight);
  const scrollTop = $('code-editor').scrollTop;
  $('mission-highlights').innerHTML = state.lineOwners.flatMap((owner, index) => owner === state.index ? [`<span style="top:${index * lineHeight - scrollTop}px;height:${lineHeight}px"></span>`] : []).join('');
}

function editorTarget(index) {
  const source = $('code-editor').value;
  const item = COURSE[index];
  const declaration = new RegExp('\\b(?:function|const|let|var)\\s+' + item.exportName + '\\b').exec(source);
  if (!declaration) return source.length;
  if (item.focus) {
    const target = source.indexOf(item.focus, declaration.index);
    if (target >= 0) return target;
  }
  return declaration.index;
}

function positionEditor(index) {
  const editor = $('code-editor');
  const source = editor.value;
  const position = editorTarget(index);
  editor.setSelectionRange(position, position);
  editor.scrollTop = Math.max(0, (source.slice(0, position).split('\n').length - 3) * parseFloat(getComputedStyle(editor).lineHeight));
  syncScroll();
}

function setConsoleMode(mode) {
  const panel = document.querySelector('.console-panel');
  panel.classList.remove('console-compact', 'console-message', 'console-detailed');
  panel.classList.add('console-' + mode);
}

function welcomeConsole(message = '') {
  setConsoleMode(message ? 'message' : 'compact');
  $('console-output').replaceChildren();
  if (message) {
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    $('console-output').append(paragraph);
  }
  $('console-count').textContent = 'À TOI';
}

function setLessonView(view) {
  const reading = view === 'learn';
  const quiz = currentStep().kind === 'quiz';
  $('lesson-read').hidden = quiz || !reading;
  $('lesson-write').hidden = quiz || reading;
  for (const [id, selected] of [['learn-tab', reading], ['code-tab', !reading]]) {
    $(id).setAttribute('aria-selected', String(selected));
    $(id).tabIndex = selected ? 0 : -1;
  }
}

function updateVerifyAvailability() {
  const step = currentStep();
  const result = state.quizResults[step.id];
  const question = result?.questions[result.cursor];
  $('verify-button').hidden = step.kind === 'quiz' && question?.checked === true;
  $('verify-button').disabled = checking || introActive || step.kind === 'quiz' && (!question || question.choice === null || questionPassed(step, result, result.cursor));
}

function renderQuiz() {
  const step = currentStep();
  const quiz = step.kind === 'quiz';
  const visible = quiz && !introActive && !(game.playable && lastRunIndex === state.index);
  $('quiz-panel').hidden = !visible;
  document.querySelector('.game-stage').classList.toggle('has-quiz', visible);
  if (!quiz) { updateVerifyAvailability(); return; }
  const result = state.quizResults[step.id] ||= sanitizeQuizResult(step);
  const index = result.cursor;
  const question = step.questions[index];
  const answer = result.questions[index];
  const passed = questionPassed(step, result, index);
  const count = step.questions.filter((_, index) => questionPassed(step, result, index)).length;
  $('quiz-summary').textContent = `${count}/${step.questions.length} réponses validées`;
  $('quiz-position').textContent = `${index + 1}/${step.questions.length}`;
  $('quiz-prev').disabled = index === 0;
  $('quiz-question').textContent = question.prompt;
  $('quiz-code').hidden = !question.snippet;
  $('quiz-code').firstElementChild.innerHTML = highlightCode(question.snippet);
  $('quiz-options').replaceChildren();
  question.options.forEach((option, choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(answer.choice === choice));
    button.tabIndex = answer.choice === choice || answer.choice === null && choice === 0 ? 0 : -1;
    button.disabled = passed;
    button.hidden = answer.checked && answer.choice !== choice;
    button.innerHTML = `<span class="quiz-letter">${String.fromCharCode(65 + choice)}</span><span>${escapeHTML(option.text)}</span>`;
    button.addEventListener('click', () => {
      answer.choice = choice; answer.checked = false;
      saveNow(); renderQuiz();
      $('quiz-options').children[choice]?.focus();
    });
    $('quiz-options').append(button);
  });
  $('quiz-feedback').hidden = !answer.checked;
  $('quiz-feedback').classList.toggle('is-correct', passed);
  $('quiz-feedback').innerHTML = answer.checked ? `<strong>${passed ? 'Bien compris !' : 'Regarde ce point :'}</strong><p>${escapeHTML(question.options[answer.choice].feedback)}</p>` : '';
  $('quiz-next').hidden = !passed;
  $('quiz-next').innerHTML = `${index === step.questions.length - 1 ? 'Valider le bilan' : 'Question suivante'} ${icon('arrow')}`;
  $('quiz-retry').hidden = !answer.checked || passed;
  updateVerifyAvailability();
}

function submitQuiz() {
  const step = currentStep();
  const existing = state.quizResults[step.id] ||= sanitizeQuizResult(step);
  if (quizPassed(step, existing)) return true;
  const graded = gradeQuestion(step, existing, existing.cursor);
  if (!graded.submitted) return false;
  state.quizResults[step.id] = graded.result;
  saveNow(); welcomeConsole(); renderQuiz();
  $('console-count').textContent = graded.passed ? 'BIEN COMPRIS' : 'À REVOIR';
  return false;
}

function renderPracticeProgress() {
  const step = currentStep();
  const field = $('practice-progress');
  field.hidden = step.kind !== 'practice';
  if (step.kind !== 'practice') return;
  const result = state.practiceResults[step.id];
  let text = 'Vérifie, puis réalise le défi dans le jeu.';
  if (state.completed.includes(state.index)) text = 'Défi validé !';
  else if (step.rule.kind.startsWith('compare')) text = result?.samples.length ? 'Premier essai noté · change le réglage et teste à nouveau.' : 'Deux essais différents à comparer.';
  else if (step.rule.kind === 'setting') text = `Place ${step.rule.field} entre ${step.rule.min} et ${step.rule.max}.`;
  else if (step.rule.field && game.config?.[step.rule.field] !== step.rule.value) text = `Pour ce défi, règle ${step.rule.field} à ${step.rule.value}.`;
  else if (practiceRun?.stage === 1 && step.rule.action === 'return-trip') text = `Demi-tour ! Reviens près de X = ${practiceRun.startX}.`;
  else if (practiceRun?.stage === 1 && step.rule.action === 'walk-stop') text = 'Relâche la flèche pour t’arrêter.';
  else if (practiceRun?.stage === 1 && step.rule.action === 'checkpoint') text = 'Drapeau activé · teste maintenant le feu.';
  if (field.textContent !== text) field.textContent = text;
}

function observeCurrentPractice() {
  if (!practiceRun || !game.playable || practiceRun.index !== state.index || lastRun !== $('code-editor').value) return;
  const step = currentStep();
  const snapshot = {
    ...game.player, config: game.config, startX: practiceRun.startX,
    score: game.score, checkpoint: game.checkpoint, won: game.won,
    jumps: game.telemetry.jumps, airAttempts: game.telemetry.airAttempts,
    pickups: game.telemetry.pickups, deaths: game.telemetry.deaths,
    right: game.keys.right, trapActive: game.elapsed % 3.8 > 1.1 && game.elapsed % 3.8 < 2.9,
    bonus: lastWin?.bonus
  };
  practiceRun = observePractice(step.rule, practiceRun, snapshot);
  renderPracticeProgress();
  if (!practiceRun.done) return;
  state.practiceResults[step.id] = step.rule.kind.startsWith('compare') ? recordPracticeSample(step, state.practiceResults[step.id], game.config) : { samples: [], played: true };
  practiceRun = null;
  saveNow(); renderPracticeProgress();
  if (practicePassed(step, state.practiceResults[step.id])) { completeMission(); renderPracticeProgress(); }
  else { welcomeConsole('Essai enregistré. Change le réglage, vérifie et teste une autre valeur.'); $('console-count').textContent = '1/2 ESSAIS'; }
}

async function visitMission(index, initial = false) {
  if (index > state.completed.length || index < 0 || index >= COURSE.length) return;
  if (!initial) saveNow();
  state.index = index;
  openPhase = COURSE[index].phase;
  const item = COURSE[index];
  const isQuiz = item.kind === 'quiz';
  $('mission-position').textContent = (isQuiz ? 'Q' : 'M') + String(item.number).padStart(2, '0');
  $('current-title').textContent = item.title;
  $('file-name').textContent = SOURCE_FILE;
  $('lesson-concept').textContent = item.concept || '';
  $('lesson-explanation').innerHTML = inlineCode(item.lesson?.text || '');
  $('lesson-example').firstElementChild.innerHTML = highlightCode(item.lesson?.example || '');
  $('lesson-example').hidden = !item.lesson?.example;
  $('mission-task').innerHTML = (item.steps || []).map(step => `<li>${inlineCode(step)}</li>`).join('');
  document.querySelector('.lesson-switch').hidden = isQuiz;
  document.querySelector('.editor-toolbar').hidden = isQuiz;
  (isQuiz ? $('quiz-actions') : document.querySelector('.editor-toolbar')).append($('verify-button'));
  $('quiz-intro').hidden = !isQuiz;
  $('hint-button').hidden = isQuiz;
  $('edit-context').textContent = item.edit ? 'DANS LE MÊME BLOC' : item.scaffold ? 'DANS LE NOUVEAU BLOC VERT' : index === 0 ? 'DANS LE FICHIER VIDE' : 'À LA SUITE DE TON CODE';
  setLessonView('learn');
  const editor = $('code-editor');
  editor.readOnly = isQuiz;
  const isNewMission = !initial && index === state.completed.length;
  const source = item.kind === 'code' ? prepareMissionSource(isNewMission && !item.edit ? continueSource(state.code) : state.code, item.moduleIndex, codeModulesThrough(state.completed)) : state.code;
  recordSource(source);
  if (editor.value !== source) editor.value = source;
  invalidateExecution();
  game.setPreviewFeatures(getGameFeatures(verifiedFeatures(state)));
  if (!game.features.player) $('preview-name').textContent = 'Mon jeu';
  editor.scrollLeft = 0;
  $('next-button').hidden = !state.completed.includes(index) || !!item.final;
  updateHighlight();
  positionEditor(index);
  renderNavigation();
  welcomeConsole();
  renderPracticeProgress();
  renderQuiz();
  saveNow();
}

async function showFinalResult() {
  const sequence = ++runSequence;
  try {
    const result = await runtime.compile(solutionSource(), 19);
    await game.ready;
    if (!introActive || sequence !== runSequence) return;
    updateMetrics(result.config);
    game.setProgram(result.config, false);
  } catch (error) {
    if (introActive && sequence === runSequence && !error.cancelled) $('intro-note').textContent = 'Tu peux commencer à construire ton jeu avec le bouton ci-dessous.';
  }
}

function loadWorkshop() {
  introActive = !state.introSeen;
  document.body.classList.toggle('is-intro', introActive);
  $('intro-panel').hidden = !introActive;
  game.config = null;
  visitMission(state.index, true);
  if (introActive) showFinalResult();
}

function updateMetrics(config) {
  $('preview-name').textContent = config.playerName;
  $('metric-speed').textContent = config.speed;
  $('metric-x').textContent = config.startX;
  $('metric-jump').textContent = config.jumpPower;
  $('metric-target').textContent = config.targetScore;
}

function showError(error) {
  if (error.cancelled) return;
  practiceRun = null;
  runtime.stop();
  game.failed = true;
  game.lock();
  $('console-count').textContent = 'À RÉPARER';
  setConsoleMode('detailed');
  $('next-button').hidden = true;
  const message = error.name === 'SyntaxError' ? /already been declared/.test(error.message) ? 'Ce nom existe déjà. Modifie sa ligne au lieu de le créer une deuxième fois.' : 'Vérifie la dernière ligne : les guillemets, parenthèses et accolades doivent être fermés.' : error.name === 'ReferenceError' ? 'Un nom n’est pas reconnu. Compare son écriture avec celle de l’exemple.' : error.message;
  const details = ['SyntaxError', 'ReferenceError'].includes(error.name) ? `<details class="check-details"><summary>Voir le détail</summary><p>${escapeHTML(error.message)}</p></details>` : '';
  $('console-output').innerHTML = `<div class="console-error"><strong>${escapeHTML(message)}</strong>${details}</div>`;
  $('game-state').textContent = 'Code à réparer';
}

function completeMission() {
  if (!state.completed.includes(state.index) && state.index === state.completed.length) state.completed.push(state.index);
  renderNavigation();
  saveNow();
  setConsoleMode('message');
  const item = currentStep();
  $('console-count').textContent = 'RÉUSSI !';
  $('console-output').innerHTML = `<div class="console-success">${icon('check')}<div><strong>${escapeHTML(item.outcome)}</strong>${item.challenge ? `<p>À tester : ${escapeHTML(item.challenge)}</p>` : ''}</div></div>`;
  $('next-button').hidden = !!item.final;
  if (item.final) {
    const summary = assessmentSummary(COURSE, state.quizResults);
    $('assessment-summary').textContent = `${summary.passed}/${summary.quizzes} bilans validés · ${summary.questions} questions travaillées`;
    game.pause(); $('finished-dialog').showModal();
  }
}

async function verifyCurrent() {
  if (checking || introActive) return;
  const item = currentStep();
  if (item.kind === 'quiz' && !submitQuiz()) return;
  practiceRun = null;
  checking = true;
  const sequence = ++runSequence;
  const index = state.index;
  const source = $('code-editor').value;
  game.lock();
  $('verify-button').disabled = true;
  $('next-button').hidden = true;
  try {
    const verifiedThrough = state.verifiedModules.reduce((last, moduleIndex) => moduleIndex === last + 1 ? moduleIndex : last, -1);
    const required = Math.max(item.moduleIndex, verifiedThrough, ...codeModulesThrough(state.completed));
    const result = await runtime.compile(source, item.moduleIndex, required, { allowLegacyCourse: state.legacyCourse });
    await game.ready;
    if (sequence !== runSequence) return;
    const checks = [...result.checks];
    const previousFailures = result.projectFailures.filter(title => title !== MISSIONS[item.moduleIndex].title);
    if (item.final || previousFailures.length) {
      checks.push({ label: previousFailures.length ? `Reprends la mission « ${previousFailures[0]} » : sa règle a changé.` : 'Toutes tes règles fonctionnent ensemble', passed: previousFailures.length === 0, expected: 'Toutes les règles', actual: previousFailures.join(', ') });
    }
    const passed = checks.filter(check => check.passed).length;
    $('console-count').textContent = passed === checks.length ? 'RÉUSSI !' : 'ENCORE UN ESSAI';
    if (passed !== checks.length) {
      runtime.stop();
      setConsoleMode('detailed');
      const firstFailure = checks.find(check => !check.passed);
      const rows = checks.map(check => `<div class="test-row ${check.passed ? 'passed' : 'failed'}"><span class="test-symbol">${check.passed ? '✓' : '○'}</span><span>${escapeHTML(check.label)}</span>${check.passed ? '' : `<span class="test-detail">obtenu : ${escapeHTML(check.actual)}</span>`}</div>`).join('');
      $('console-output').innerHTML = `<div class="console-error"><strong>${escapeHTML(firstFailure.label)}</strong></div><details class="check-details"><summary>Voir les essais du jeu</summary>${rows}</details>`;
      $('next-button').hidden = true;
      return;
    }
    lastRun = source;
    lastRunIndex = index;
    state.verifiedCode = source;
    state.verifiedOwners = [...state.lineOwners];
    state.verifiedModules = result.modules;
    setLessonView('code');
    updateMetrics(result.config);
    updateHighlight();
    if (item.final) {
      saveNow();
      welcomeConsole('Ton message est prêt. Termine une partie pour le découvrir au trophée !');
      $('console-count').textContent = 'À TOI DE JOUER';
    } else if (item.kind !== 'practice' || state.completed.includes(index)) completeMission();
    else {
      practiceRun = { index, config: result.config, startX: result.config.startX, stage: 0 };
      welcomeConsole('Code valide. Réalise le défi dans le jeu pour valider la mission.');
      $('console-count').textContent = 'À TESTER';
    }
    game.setProgram(result.config, true);
    renderQuiz();
    updatePlaybackUI();
  } catch (error) {
    if (sequence === runSequence && !error.cancelled) showError(error);
  } finally { checking = false; updateVerifyAvailability(); }
}

function openHelp() {
  const item = currentStep();
  hintDepth = 0;
  $('help-title').textContent = 'Une piste pour avancer';
  $('help-body').textContent = item.hint;
  $('help-extra').hidden = true;
  $('solution-area').hidden = true;
  $('more-hint').hidden = false;
  $('show-solution').hidden = true;
  $('help-dialog').showModal();
}

function askConfirmation(title, body, action) {
  game.pause();
  $('confirm-title').textContent = title;
  $('confirm-body').textContent = body;
  confirmationAction = action;
  $('confirm-dialog').showModal();
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBackup() { saveNow(); download('code-quest-backup.json', JSON.stringify(state, null, 2), 'application/json'); toast('Sauvegarde exportée : tu peux la réimporter pour continuer.'); }

function exportCode() {
  saveNow();
  download(SOURCE_FILE, state.code, 'text/javascript');
  toast('Ton fichier game.js a été exporté.');
}


for (const character of CHARACTERS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'avatar-button' + (character === state.character ? ' selected' : '');
  button.title = character;
  button.setAttribute('aria-label', 'Choisir ' + character);
  button.setAttribute('aria-pressed', String(character === state.character));
  const avatar = document.createElement('span');
  avatar.className = 'avatar-sprite';
  avatar.style.backgroundImage = `url("${new URL('../Main Characters/' + character + '/Idle (32x32).png', import.meta.url).href}")`;
  button.append(avatar);
  button.addEventListener('click', () => {
    state.character = character;
    game.character = character;
    for (const child of $('avatar-controls').children) { const active = child === button; child.classList.toggle('selected', active); child.setAttribute('aria-pressed', active); }
    saveNow();
  });
  $('avatar-controls').append(button);
}

$('code-editor').addEventListener('input', () => { recordSource($('code-editor').value); invalidateExecution(); updateHighlight(); scheduleSave(); welcomeConsole(); });
$('code-editor').addEventListener('scroll', syncScroll);
$('code-editor').addEventListener('keydown', event => {
  const editor = event.currentTarget;
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); verifyCurrent(); return; }
  if (editor.readOnly) return;
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault();
    document.execCommand('insertText', false, '  ');
  } else if (event.key === 'Enter') {
    const before = editor.value.slice(0, editor.selectionStart);
    const line = before.slice(before.lastIndexOf('\n') + 1);
    const indent = line.match(/^\s*/)?.[0] || '';
    event.preventDefault();
    document.execCommand('insertText', false, '\n' + indent + (line.trimEnd().endsWith('{') ? '  ' : ''));
  }
});
$('verify-button').addEventListener('click', verifyCurrent);
$('quiz-prev').addEventListener('click', () => {
  const step = currentStep();
  const result = state.quizResults[step.id];
  if (step.kind !== 'quiz' || !result || result.cursor === 0) return;
  result.cursor--;
  saveNow(); renderQuiz();
  $('quiz-question').tabIndex = -1; $('quiz-question').focus();
});
$('quiz-next').addEventListener('click', () => {
  const step = currentStep();
  const result = state.quizResults[step.id];
  if (step.kind !== 'quiz' || !questionPassed(step, result, result.cursor)) return;
  if (result.cursor === step.questions.length - 1) { verifyCurrent(); return; }
  result.cursor = Math.min(result.cursor + 1, step.questions.length - 1);
  saveNow(); renderQuiz();
  $('quiz-question').tabIndex = -1; $('quiz-question').focus();
});
$('quiz-retry').addEventListener('click', () => {
  const step = currentStep();
  const result = state.quizResults[step.id];
  if (step.kind !== 'quiz' || !result) return;
  result.questions[result.cursor].checked = false;
  saveNow(); renderQuiz();
  $('quiz-options').querySelector('[aria-checked="true"]')?.focus();
});
$('quiz-options').addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const choices = [...$('quiz-options').children];
  const current = choices.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (current + (['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1) + choices.length) % choices.length;
  if (!choices[next] || choices[next].disabled) return;
  event.preventDefault(); choices[next].click();
});
$('learn-tab').addEventListener('click', () => setLessonView('learn'));
$('code-tab').addEventListener('click', () => setLessonView('code'));
document.querySelector('.lesson-switch').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const view = ['ArrowLeft', 'Home'].includes(event.key) ? 'learn' : 'code';
  setLessonView(view);
  $(view === 'learn' ? 'learn-tab' : 'code-tab').focus();
});
$('focus-code').addEventListener('click', () => { positionEditor(state.index); $('code-editor').focus(); });
$('start-workshop').addEventListener('click', () => { state.introSeen = true; loadWorkshop(); $('code-editor').focus(); });
$('next-button').addEventListener('click', () => visitMission(state.index + 1));
$('replay-button').addEventListener('click', () => { if (game.playable && !game.failed) game.reset(true); });
$('win-replay').addEventListener('click', () => { if (game.playable && !game.failed) game.reset(true); });
$('hint-button').addEventListener('click', () => { game.pause(); openHelp(); });
$('more-hint').addEventListener('click', () => { hintDepth++; $('help-extra').textContent = currentStep().secondHint; $('help-extra').hidden = false; $('more-hint').hidden = hintDepth > 0; $('show-solution').hidden = !currentStep().solution; });
$('show-solution').addEventListener('click', () => { $('help-solution').textContent = currentStep().solution; $('solution-area').hidden = false; $('show-solution').hidden = true; });
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('confirm-action').addEventListener('click', () => { $('confirm-dialog').close(); confirmationAction?.(); confirmationAction = null; });
$('reset-code').addEventListener('click', () => askConfirmation('Revenir au dernier code vérifié ?', 'Tes modifications depuis la dernière vérification réussie seront annulées. Le code déjà validé est conservé.', () => { state.code = state.verifiedCode; state.lineOwners = [...state.verifiedOwners]; $('code-editor').value = state.code; invalidateExecution(); updateHighlight(); positionEditor(state.index); saveNow(); welcomeConsole(); }));
$('reset-workshop').addEventListener('click', () => { askConfirmation('Recommencer tout l’atelier ?', 'Le code et la progression enregistrés sur cet ordinateur seront effacés. Exporte une sauvegarde si tu souhaites les garder.', () => { state = freshState(); game.character = state.character; lastRun = null; for (const button of $('avatar-controls').children) { const active = button.title === state.character; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active); } loadWorkshop(); toast('Un nouvel atelier commence.'); }); });
$('export-button').addEventListener('click', () => { $('export-menu').hidden = !$('export-menu').hidden; });
document.addEventListener('click', event => { if (!event.target.closest('.sidebar-bottom')) $('export-menu').hidden = true; });
$('export-backup').addEventListener('click', () => { $('export-menu').hidden = true; exportBackup(); });
$('export-code').addEventListener('click', () => { $('export-menu').hidden = true; exportCode(); });
$('finish-export').addEventListener('click', exportBackup);
$('import-button').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 1000000) throw new Error('Ce fichier est trop volumineux pour une sauvegarde de l’atelier.');
    const imported = sanitizeState(JSON.parse(await file.text()));
    askConfirmation('Reprendre cette sauvegarde ?', `Elle contient ${imported.completed.length} mission(s) validée(s). Elle remplacera le travail actuellement enregistré dans ce navigateur.`, () => {
      state = imported; game.character = state.character; lastRun = null;
      for (const button of $('avatar-controls').children) { const active = button.title === state.character; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active); }
      loadWorkshop(); toast('Ta sauvegarde a été importée.');
    });
  } catch (error) { toast(error instanceof SyntaxError ? 'Ce fichier ne contient pas une sauvegarde JSON valide.' : error.message); }
});
window.addEventListener('beforeunload', saveNow);
window.addEventListener('resize', syncScroll);
createPaneSplitter(document.querySelector('.workspace-panes'), $('pane-divider'), STORAGE_KEY + '-layout');
loadWorkshop();
game.ready.catch(showError);
if (!storageAvailable) $('save-status').textContent = 'Sauvegarde indisponible · utilise Exporter';
