import { integratePlayer, intersects } from './physics.js';
import { getGameFeatures } from './missions.js';

export const CHARACTERS = ['Ninja Frog', 'Pink Man', 'Virtual Guy', 'Mask Dude'];
export const SOLIDS = [
  { x: 16, y: 256, w: 448, h: 32 },
  { x: 96, y: 208, w: 64, h: 48 },
  { x: 224, y: 176, w: 64, h: 80 },
  { x: 352, y: 208, w: 64, h: 48 }
];

async function loadImage(relative, width, height) {
  const image = new Image();
  image.src = new URL('../' + relative, import.meta.url).href;
  await image.decode();
  if (image.naturalWidth !== width || image.naturalHeight !== height) throw new Error('Dimensions inattendues : ' + relative);
  return image;
}

export class WorkshopGame {
  constructor(canvas, runtime, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.runtime = runtime;
    this.callbacks = callbacks;
    this.images = {};
    this.character = 'Ninja Frog';
    this.keys = { left: false, right: false, jump: false };
    this.config = null;
    this.features = getGameFeatures({});
    this.playable = false;
    this.running = false;
    this.pending = false;
    this.elapsed = 0;
    this.frame = 0;
    this.generation = 0;
    this.won = false;
    this.effects = [];
    this.telemetry = { won: false, jumps: 0, airAttempts: 0, pickups: 0, deaths: 0 };
    this.player = { x: this.config?.startX ?? 43, y: 230, w: 18, h: 26, vx: 0, vy: 0, onGround: true };
    this.score = 0;
    this.checkpoint = false;
    this.facing = 1;
    this.animation = 'Idle';
    this.bindInput();
    this.ready = this.loadAssets();
    this.lastFrame = performance.now();
    this.accumulator = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  async loadAssets() {
    const entries = [
      ['terrain', 'Terrain/Terrain (16x16).png', 352, 176],
      ['background', 'Background/Brown.png', 64, 64],
      ['apple', 'Items/Fruits/Apple.png', 544, 32],
      ['orange', 'Items/Fruits/Orange.png', 544, 32],
      ['collected', 'Items/Fruits/Collected.png', 192, 32],
      ['goal', 'Items/Checkpoints/End/End (Idle).png', 64, 64],
      ['goal-win', 'Items/Checkpoints/End/End (Pressed) (64x64).png', 512, 64],
      ['flag-off', 'Items/Checkpoints/Checkpoint/Checkpoint (No Flag).png', 64, 64],
      ['flag-on', 'Items/Checkpoints/Checkpoint/Checkpoint (Flag Idle)(64x64).png', 640, 64],
      ['fire-off', 'Traps/Fire/Off.png', 16, 32],
      ['fire-on', 'Traps/Fire/On (16x32).png', 48, 32],
      ['font', 'Menu/Text/Text (White) (8x10).png', 80, 50],
      ['confetti', 'Other/Confetti (16x16).png', 96, 16]
    ];
    for (const name of CHARACTERS) for (const [state, frames] of [['Idle', 11], ['Run', 12], ['Jump', 1], ['Fall', 1], ['Hit', 7]]) entries.push([name + '/' + state, `Main Characters/${name}/${state} (32x32).png`, frames * 32, 32]);
    await Promise.all(entries.map(async ([key, path, width, height]) => { this.images[key] = await loadImage(path, width, height); }));
    this.assetsReady = true;
  }

  bindInput() {
    const keyAction = event => {
      if (['ArrowLeft', 'KeyA', 'KeyQ'].includes(event.code)) return 'left';
      if (['ArrowRight', 'KeyD'].includes(event.code)) return 'right';
      if (['Space', 'ArrowUp', 'KeyW', 'KeyZ'].includes(event.code)) return 'jump';
      return null;
    };
    this.canvas.addEventListener('keydown', event => {
      const action = keyAction(event);
      if (!action) return;
      event.preventDefault();
      if (!this.playable || this.failed || this.won) return;
      if (action === 'jump') { if (!event.repeat) this.keys.jump = true; }
      else this.keys[action] = true;
      if (this.config) this.running = true;
    });
    window.addEventListener('keyup', event => { const action = keyAction(event); if (action && action !== 'jump') this.keys[action] = false; });
    this.canvas.addEventListener('pointerdown', () => this.canvas.focus());
    this.canvas.addEventListener('focus', () => { if (this.playable && this.config && !this.failed && !this.won) this.running = true; this.callbacks.onFocus?.(true); });
    this.canvas.addEventListener('blur', () => { this.pause(); this.callbacks.onFocus?.(false); });
    window.addEventListener('blur', () => this.pause());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
  }

  pause() { this.running = false; this.keys = { left: false, right: false, jump: false }; }

  lock() {
    this.playable = false;
    this.pause();
    this.generation++;
    this.pending = false;
    this.won = false;
    this.telemetry.won = false;
    this.callbacks.onLock?.();
    this.emitState();
  }

  setProgram(config, focus = false) {
    this.config = config;
    this.features = config.features;
    this.playable = true;
    this.failed = false;
    this.reset(focus);
  }

  setPreviewFeatures(features) {
    this.features = features;
    this.reset(false);
  }

  get solids() { return this.features.jump ? SOLIDS : SOLIDS.slice(0, 1); }

  reset(focus = false) {
    this.generation++;
    this.pending = false;
    this.won = false;
    this.elapsed = 0;
    this.score = 0;
    this.collectedCount = 0;
    this.pickupCount = 0;
    this.checkpoint = false;
    this.hitUntil = 0;
    this.immuneUntil = 0;
    this.player = { x: this.config?.startX ?? 43, y: 230, w: 18, h: 26, vx: 0, vy: 0, onGround: true };
    this.facing = 1;
    this.animation = 'Idle';
    this.effects = [];
    this.keys = { left: false, right: false, jump: false };
    this.telemetry = { won: false, jumps: 0, airAttempts: 0, pickups: 0, deaths: 0 };
    this.fruits = this.features.fruits ? [
      { x: 69, y: 236, category: 'easy' },
      ...(this.features.fruitLine ? this.config?.fruitPositions || [0, 24, 48] : []).map(position => ({ x: 104 + position, y: 190, category: 'reward' })),
      { x: 242, y: 158, category: 'guidance' }, { x: 266, y: 158, category: 'reward' },
      { x: 368, y: 190, category: 'guidance' }, { x: 392, y: 190, category: 'reward' },
      { x: 335, y: 236, category: 'easy' }
    ] : [];
    this.accumulator = 0;
    this.running = this.playable && (focus || document.activeElement === this.canvas);
    this.callbacks.onReset?.();
    this.emitState();
    if (focus && this.playable) this.canvas.focus();
  }

  emitState(extra = {}) {
    this.callbacks.onState?.({ x: Math.round(this.player.x * 10) / 10, score: this.score, checkpoint: this.checkpoint, running: this.running, won: this.won, ...extra });
  }

  async tick() {
    if (!this.playable) return;
    const generation = this.generation;
    this.pending = true;
    const keys = { ...this.keys };
    this.keys.jump = false;
    const trapActive = this.features.danger && this.elapsed % 3.8 > 1.1 && this.elapsed % 3.8 < 2.9;
    const pickupCount = this.pickupCount;
    this.pickupCount = 0;
    try {
      const result = await this.runtime.step({ player: { ...this.player }, keys, score: this.score, pickupCount, checkpoint: this.checkpoint, collectedCount: this.collectedCount, trapActive });
      if (generation !== this.generation) return;
      if (!this.running) { this.pickupCount += pickupCount; return; }
      const before = this.player;
      if (keys.jump && !before.onGround) this.telemetry.airAttempts++;
      this.player = integratePlayer(before, result.vx, result.vy, this.solids);
      if (keys.jump && result.vy < before.vy - 1) this.telemetry.jumps++;
      this.animation = result.animation;
      if (result.vx !== 0) this.facing = result.vx > 0 ? 1 : -1;
      this.score = result.score;
      this.checkpoint = result.checkpoint;
      this.elapsed += 1 / 60;
      for (const fruit of this.fruits) {
        if (fruit.collected) continue;
        if (intersects(this.player, { x: fruit.x - 8, y: fruit.y - 8, w: 16, h: 16 })) {
          fruit.collected = true;
          this.pickupCount++;
          this.collectedCount++;
          this.telemetry.pickups++;
          this.effects.push({ x: fruit.x, y: fruit.y, started: this.elapsed });
        }
      }
      if (result.danger && this.elapsed > this.immuneUntil && intersects(this.player, { x: 305, y: 225, w: 14, h: 31 })) {
        this.telemetry.deaths++;
        this.player = { ...this.player, x: this.checkpoint ? 195 : this.config.startX, y: 230, vx: 0, vy: 0, onGround: true };
        this.hitUntil = this.elapsed + 0.35;
        this.immuneUntil = this.elapsed + 1.2;
      }
      let blocked = false;
      if (this.features.goal && this.player.x > 417 && this.player.y + this.player.h > 218) {
        if (result.goalAllowed && !this.pickupCount) {
          this.won = true;
          this.running = false;
          this.telemetry.won = true;
          this.callbacks.onWin?.({ score: this.score, bonus: result.bonus, text: result.victoryText });
        } else blocked = true;
      }
      this.emitState({ blocked });
    } catch (error) {
      if (generation !== this.generation || error.cancelled) return;
      this.running = false;
      this.failed = true;
      this.callbacks.onError?.(error);
    } finally {
      if (generation === this.generation) this.pending = false;
    }
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (this.playable && this.running && !this.pending && this.config && this.assetsReady) {
      this.accumulator = Math.min(this.accumulator + dt, 0.05);
      if (this.accumulator >= 1 / 60) { this.accumulator -= 1 / 60; this.tick(); }
    } else if (!this.running) this.accumulator = 0;
    this.frame = now / 1000;
    this.draw();
    requestAnimationFrame(this.loop);
  }

  drawBlock(block) {
    const ctx = this.ctx;
    for (let row = 0; row < block.h / 16; row++) for (let column = 0; column < block.w / 16; column++) {
      const sx = column === 0 ? 96 : column === block.w / 16 - 1 ? 128 : 112;
      const sy = row === 0 ? 0 : row === block.h / 16 - 1 ? 32 : 16;
      ctx.drawImage(this.images.terrain, sx, sy, 16, 16, block.x + column * 16, block.y + row * 16, 16, 16);
    }
  }

  drawText(text, x, y) {
    const mapping = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ    0123456789';
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') continue;
      const index = mapping.indexOf(text[i]);
      if (index < 0) continue;
      this.ctx.drawImage(this.images.font, index % 10 * 8, Math.floor(index / 10) * 10, 8, 10, x + i * 7, y, 8, 10);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    if (!this.assetsReady) { ctx.fillStyle = '#211f31'; ctx.fillRect(0, 0, 480, 288); return; }
    for (let y = 0; y < 288; y += 64) for (let x = 0; x < 480; x += 64) ctx.drawImage(this.images.background, x, y);
    for (const block of this.solids) this.drawBlock(block);

    // Small decorative blocks use the same atlas as the supplied references.
    for (const [x, y] of [[16, 16], [32, 16], [16, 32], [448, 16]]) ctx.drawImage(this.images.terrain, 192, 0, 16, 16, x, y, 16, 16);
    if (this.features.position && !this.features.jump) {
      ctx.save();
      ctx.strokeStyle = '#48604f';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(24, 70); ctx.lineTo(450, 70);
      ctx.moveTo(444, 66); ctx.lineTo(450, 70); ctx.lineTo(444, 74);
      for (const x of [32, 128, 224, 320, 416]) { ctx.moveTo(x, 66); ctx.lineTo(x, 74); this.drawText(String(x), x - 8, 52); }
      ctx.stroke();
      ctx.fillStyle = '#73cda0'; ctx.fillRect(Math.round(this.player.x) - 2, 64, 4, 12);
      this.drawText('X', 440, 50);
      ctx.restore();
    }
    const fruitFrame = Math.floor(this.frame * 20) % 17;
    for (const [index, fruit] of (this.fruits || []).entries()) {
      if (!fruit.collected) ctx.drawImage(this.images[index % 2 ? 'orange' : 'apple'], fruitFrame * 32, 0, 32, 32, Math.round(fruit.x - 16), fruit.y - 16, 32, 32);
    }
    this.effects = this.effects.filter(effect => this.elapsed - effect.started < 0.3);
    for (const effect of this.effects) ctx.drawImage(this.images.collected, Math.min(5, Math.floor((this.elapsed - effect.started) * 20)) * 32, 0, 32, 32, effect.x - 16, effect.y - 16, 32, 32);
    if (this.features.checkpoint) {
      if (this.checkpoint) ctx.drawImage(this.images['flag-on'], Math.floor(this.frame * 20) % 10 * 64, 0, 64, 64, 160, 192, 64, 64);
      else ctx.drawImage(this.images['flag-off'], 160, 192);
    }
    const fireOn = this.elapsed % 3.8 > 1.1 && this.elapsed % 3.8 < 2.9;
    if (this.features.danger) {
      if (fireOn) ctx.drawImage(this.images['fire-on'], Math.floor(this.frame * 20) % 3 * 16, 0, 16, 32, 304, 224, 16, 32);
      else ctx.drawImage(this.images['fire-off'], 304, 224);
    }
    if (this.features.goal) {
      if (this.won) ctx.drawImage(this.images['goal-win'], Math.floor(this.frame * 20) % 8 * 64, 0, 64, 64, 404, 192, 64, 64);
      else ctx.drawImage(this.images.goal, 404, 192);
    }

    if (this.features.player) {
      const p = this.player;
      let state = this.animation;
      if (!p.onGround) state = p.vy < 0 ? 'Jump' : 'Fall';
      if (this.elapsed < this.hitUntil) state = 'Hit';
      const frames = { Idle: 11, Run: 12, Jump: 1, Fall: 1, Hit: 7 };
      const sprite = this.images[this.character + '/' + state];
      ctx.save();
      ctx.translate(Math.round(p.x + p.w / 2), Math.round(p.y + p.h));
      ctx.scale(this.facing, 1);
      if (this.elapsed < this.immuneUntil && Math.floor(this.frame * 12) % 2) ctx.globalAlpha = 0.5;
      ctx.drawImage(sprite, Math.floor(this.frame * 20) % frames[state] * 32, 0, 32, 32, -16, -32, 32, 32);
      ctx.restore();
    }

    // Draw the arena frame last so the world stays inside its metal border.
    for (let column = 0; column < 30; column++) {
      const sx = column === 0 ? 0 : column === 29 ? 32 : 16;
      ctx.drawImage(this.images.terrain, sx, 0, 16, 16, column * 16, 0, 16, 16);
      ctx.drawImage(this.images.terrain, sx, 32, 16, 16, column * 16, 272, 16, 16);
    }
    for (let row = 1; row < 17; row++) {
      ctx.drawImage(this.images.terrain, 0, 16, 16, 16, 0, row * 16, 16, 16);
      ctx.drawImage(this.images.terrain, 32, 16, 16, 16, 464, row * 16, 16, 16);
    }
    ctx.fillStyle = '#44382d70';
    if (this.features.fruits) { ctx.fillRect(22, 22, 105, 18); this.drawText('SCORE ' + this.score, 27, 26); }
    if (this.features.goal) { ctx.fillRect(338, 22, 120, 18); this.drawText('OBJECTIF ' + (this.config?.targetScore ?? 3), 343, 26); }
    if (this.won) {
      for (let index = 0; index < 32; index++) {
        const x = (index * 83 + Math.sin(index) * 15 + 480) % 448 + 16;
        const y = (this.frame * 40 + index * 53) % 256 + 16;
        ctx.drawImage(this.images.confetti, index % 6 * 16, 0, 16, 16, Math.round(x), Math.round(y), 3, 5);
      }
    }
  }
}
