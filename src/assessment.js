export function sanitizeQuizResult(quiz, input) {
  return {
    cursor: Math.max(0, Math.min(Number.isInteger(input?.cursor) ? input.cursor : 0, quiz.questions.length - 1)),
    questions: quiz.questions.map((question, index) => {
      const saved = input?.questions?.[index];
      const choice = Number.isInteger(saved?.choice) && saved.choice >= 0 && saved.choice < question.options.length ? saved.choice : null;
      const attempts = Number.isInteger(saved?.attempts) ? Math.max(0, Math.min(saved.attempts, 100000)) : 0;
      return { choice, attempts, checked: saved?.checked === true && choice !== null && attempts > 0 };
    })
  };
}

export const questionPassed = (quiz, result, index) => result.questions[index]?.checked === true && result.questions[index].choice === quiz.questions[index].correct;
export const quizPassed = (quiz, result) => !!result && quiz.questions.every((_, index) => questionPassed(quiz, result, index));

export function gradeQuestion(quiz, input, index) {
  const result = sanitizeQuizResult(quiz, input);
  const answer = result.questions[index];
  if (!answer || answer.choice === null) return { result, submitted: false, passed: false };
  answer.attempts++;
  answer.checked = true;
  return { result, submitted: true, passed: questionPassed(quiz, result, index) };
}

export function sanitizePracticeResult(step, input) {
  const rule = step.rule;
  const samples = Array.isArray(input?.samples) ? input.samples.slice(0, 20).filter(value => {
    if (rule.kind === 'compare-settings') return value && rule.fields.every(field => typeof value[field] === 'number' && Number.isFinite(value[field]));
    return typeof value === 'string' ? value.trim().length >= 2 && value.length <= 40 : typeof value === 'number' && Number.isFinite(value);
  }) : [];
  return { samples, played: input?.played === true };
}

export function practicePassed(step, result) {
  if (!result) return false;
  const rule = step.rule;
  if (rule.kind === 'play' || rule.kind === 'setting') return result.played === true;
  const samples = result.samples || [];
  return samples.some((a, index) => samples.slice(index + 1).some(b => {
    if (rule.kind === 'compare-settings') return rule.fields.filter(field => Math.abs(a[field] - b[field]) > 0.00001).length >= rule.changes;
    if (typeof a === 'string' && typeof b === 'string') return a.trim() !== b.trim();
    return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) + 0.00001 >= rule.minDifference;
  }));
}

export function recordPracticeSample(step, input, config) {
  const result = sanitizePracticeResult(step, input);
  const value = step.rule.kind === 'compare-settings' ? Object.fromEntries(step.rule.fields.map(field => [field, config[field]])) : config[step.rule.field];
  if (!result.samples.some(previous => JSON.stringify(previous) === JSON.stringify(value))) result.samples.push(value);
  result.samples = result.samples.slice(-20);
  return result;
}

export function observePractice(rule, run, snapshot) {
  const next = { ...run };
  if (rule.kind === 'setting') return { ...next, done: snapshot.config[rule.field] >= rule.min && snapshot.config[rule.field] <= rule.max };
  if (rule.kind === 'compare' || rule.kind === 'compare-settings') {
    const done = rule.observe === 'instant' || rule.observe === 'move' && Math.abs(snapshot.x - run.startX) >= 12 || rule.observe === 'jump' && snapshot.jumps > 0 || rule.observe === 'collect' && snapshot.pickups > 0;
    return { ...next, done };
  }
  if (rule.field && snapshot.config[rule.field] !== rule.value) return next;
  switch (rule.action) {
    case 'walk-stop':
      if (snapshot.x - run.startX >= rule.distance) next.stage = 1;
      if (next.stage === 1) next.restFrames = !snapshot.right && Math.abs(snapshot.vx) < 0.01 ? (next.restFrames || 0) + 1 : 0;
      next.done = next.restFrames >= 3;
      break;
    case 'return-trip':
      if (snapshot.x >= rule.turnX) next.stage = 1;
      next.done = next.stage === 1 && Math.abs(snapshot.x - run.startX) <= Math.max(5, snapshot.config.speed);
      break;
    case 'platform':
      next.done = snapshot.jumps > 0 && snapshot.onGround && (rule.target === 1 ? snapshot.x >= 96 && snapshot.x <= 160 && Math.abs(snapshot.y - 182) < 1 : snapshot.x >= 224 && snapshot.x <= 288 && Math.abs(snapshot.y - 150) < 1);
      break;
    case 'air-guard': next.done = snapshot.airAttempts > 0 && snapshot.jumps === 1; break;
    case 'collect': next.done = snapshot.pickups >= rule.count && snapshot.score >= rule.count * snapshot.config.fruitPoints; break;
    case 'win': next.done = snapshot.won; break;
    case 'bonus-win': next.done = snapshot.won && snapshot.pickups >= rule.count && snapshot.bonus === snapshot.pickups * 2; break;
    case 'fire-crossing':
      if (snapshot.x >= 278 && snapshot.x < 302 && snapshot.onGround) next.stage = 1;
      if (next.stage === 1 && !snapshot.onGround && snapshot.x >= 302) next.stage = 0;
      next.done = next.stage === 1 && snapshot.x > 320 && snapshot.onGround && !snapshot.trapActive && snapshot.deaths === 0;
      break;
    case 'checkpoint':
      if (snapshot.checkpoint && next.stage !== 1) { next.stage = 1; next.checkpointDeaths = snapshot.deaths; }
      next.done = next.stage === 1 && snapshot.deaths > next.checkpointDeaths && snapshot.checkpoint && snapshot.x >= 190 && snapshot.x <= 204;
      break;
  }
  return next;
}

export function assessmentSummary(course, results) {
  const quizzes = course.filter(step => step.kind === 'quiz');
  const questions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
  const passed = quizzes.reduce((sum, quiz) => sum + (quizPassed(quiz, results[quiz.id]) ? 1 : 0), 0);
  return { quizzes: quizzes.length, passed, questions };
}
