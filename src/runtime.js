export class StudentRuntime {
  constructor(onError) {
    this.onError = onError;
    this.sequence = 0;
    this.pending = new Map();
    this.worker = null;
  }

  stop() {
    this.worker?.terminate();
    this.worker = null;
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(Object.assign(new Error('Execution replaced'), { cancelled: true }));
    }
    this.pending.clear();
  }

  async compile(sources, activeIndex, requiredThrough = activeIndex, options = {}) {
    this.stop();
    this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    this.worker.onmessage = event => {
      const entry = this.pending.get(event.data.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      this.pending.delete(event.data.id);
      event.data.ok ? entry.resolve(event.data.result) : entry.reject(Object.assign(new Error(event.data.error.message), { name: event.data.error.name }));
    };
    this.worker.onerror = event => {
      event.preventDefault();
      const error = new Error('Le programme n’a pas pu démarrer. Relis la dernière modification puis réessaie.');
      for (const entry of this.pending.values()) { clearTimeout(entry.timer); entry.reject(error); }
      this.pending.clear();
      this.worker?.terminate();
      this.worker = null;
    };
    return this.request('compile', { sources, activeIndex, requiredThrough, options }, 1600);
  }

  request(type, payload, timeout = 350) {
    if (!this.worker) return Promise.reject(new Error('Clique sur Vérifier pour relancer le jeu.'));
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        const error = new Error('Le programme prend trop de temps. Une boucle ne s’arrête peut-être jamais. Corrige sa condition, puis clique sur Vérifier.');
        reject(error);
        this.stop();
        this.onError?.(error);
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, type, payload });
    });
  }

  step(state) { return this.request('step', state); }
}
