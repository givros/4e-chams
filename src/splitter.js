export function createPaneSplitter(panes, divider, storageKey) {
  const defaultRatio = 0.85 / 2.2;
  let ratio = defaultRatio;
  let pointer = null;
  try {
    const saved = Number(localStorage.getItem(storageKey));
    if (saved > 0 && saved < 1) ratio = saved;
  } catch { /* The splitter still works when browser storage is unavailable. */ }

  const limits = () => {
    const width = panes.getBoundingClientRect().width - divider.getBoundingClientRect().width;
    return { width, min: 330 / width, max: 1 - 420 / width };
  };
  const apply = (requested = ratio, persist = false) => {
    const { min, max } = limits();
    if (!Number.isFinite(min) || min > max) return;
    ratio = Math.max(min, Math.min(max, requested));
    panes.style.setProperty('--editor-fr', ratio + 'fr');
    panes.style.setProperty('--preview-fr', (1 - ratio) + 'fr');
    const percentage = Math.round(ratio * 100);
    divider.setAttribute('aria-valuemin', Math.round(min * 100));
    divider.setAttribute('aria-valuemax', Math.round(max * 100));
    divider.setAttribute('aria-valuenow', percentage);
    divider.setAttribute('aria-valuetext', `Éditeur ${percentage} %, jeu ${100 - percentage} %`);
    if (persist) {
      try { localStorage.setItem(storageKey, String(ratio)); } catch { /* Optional preference. */ }
    }
  };
  const finish = event => {
    if (pointer === null || (event && event.pointerId !== pointer)) return;
    pointer = null;
    document.body.classList.remove('is-resizing');
    divider.classList.remove('is-dragging');
    apply(ratio, true);
  };

  divider.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    divider.focus();
    pointer = event.pointerId;
    divider.setPointerCapture(pointer);
    document.body.classList.add('is-resizing');
    divider.classList.add('is-dragging');
  });
  divider.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    const bounds = panes.getBoundingClientRect();
    const handleWidth = divider.getBoundingClientRect().width;
    apply((event.clientX - bounds.left - handleWidth / 2) / (bounds.width - handleWidth));
  });
  divider.addEventListener('pointerup', finish);
  divider.addEventListener('pointercancel', finish);
  divider.addEventListener('lostpointercapture', finish);
  divider.addEventListener('dblclick', () => apply(defaultRatio, true));
  divider.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const { min, max } = limits();
    const step = event.shiftKey ? 0.05 : 0.02;
    apply(event.key === 'Home' ? min : event.key === 'End' ? max : ratio + (event.key === 'ArrowRight' ? step : -step), true);
  });
  new ResizeObserver(() => apply()).observe(panes);
  apply();
}
