import { compileProgram, compileProject, stepProgram } from './compiler.js';

let program;
self.onmessage = event => {
  const { id, type, payload } = event.data;
  try {
    if (type === 'compile') {
      const result = typeof payload.sources === 'string' ? compileProject(payload.sources, payload.activeIndex, payload.requiredThrough, payload.options) : compileProgram(payload.sources, payload.activeIndex);
      program = result.program;
      self.postMessage({ id, ok: true, result: { config: result.config, checks: result.checks, projectFailures: result.projectFailures, modules: result.modules } });
    } else if (type === 'step') {
      if (!program) throw new Error('Clique sur Vérifier avant de jouer.');
      self.postMessage({ id, ok: true, result: stepProgram(program, payload) });
    }
  } catch (error) {
    self.postMessage({ id, ok: false, error: { name: error.name, message: error.message } });
  }
};
