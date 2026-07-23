import type { Game } from './types.js';

export interface RunnerOpts {
  tickRate: number;
  /** true: sadece tick olunca çiz (demo). false: her karede çiz (oyun). */
  renderOnTick: boolean;
}

export class Runner {
  visible = false;
  paused = false;
  private acc = 0;
  private stepMs: number;

  constructor(
    readonly game: Game,
    private opts: RunnerOpts
  ) {
    this.stepMs = 1000 / opts.tickRate;
  }

  get active() {
    return this.visible && !this.paused;
  }

  advance(dtMs: number) {
    // Sekme geri geldiğinde 40 saniyelik borcu ödemeye çalışma.
    this.acc += Math.min(dtMs, 100);
    let ticks = 0;
    while (this.acc >= this.stepMs && ticks < 5) {
      this.game.update(this.stepMs / 1000);
      this.acc -= this.stepMs;
      ticks++;
    }
    if (this.opts.renderOnTick) {
      if (ticks > 0) this.game.render(0);
    } else {
      this.game.render(this.acc / this.stepMs);
    }
  }
}

export interface SchedulerStats {
  registered: number;
  active: number;
  /** Bir karedeki tüm oyunların toplam süresi, ms. Kayan ortalama. */
  frameCost: number;
  fps: number;
}

class Scheduler {
  private runners = new Set<Runner>();
  private raf = 0;
  private last = 0;
  private cost = 0;
  private fps = 60;
  private hidden = false;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.hidden = document.hidden;
        if (this.hidden) this.stop();
        else this.kick();
      });
    }
  }

  add(r: Runner) {
    this.runners.add(r);
    this.kick();
  }

  remove(r: Runner) {
    this.runners.delete(r);
    if (this.runners.size === 0) this.stop();
  }

  kick() {
    if (!this.raf && !this.hidden && this.runners.size > 0) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private tick = (now: number) => {
    const dt = now - this.last;
    this.last = now;
    this.fps += (1000 / Math.max(dt, 1) - this.fps) * 0.05;

    const t0 = performance.now();
    for (const r of this.runners) if (r.active) r.advance(dt);
    this.cost += (performance.now() - t0 - this.cost) * 0.05;

    this.raf = requestAnimationFrame(this.tick);
  };

  stats(): SchedulerStats {
    let active = 0;
    for (const r of this.runners) if (r.active) active++;
    return { registered: this.runners.size, active, frameCost: this.cost, fps: this.fps };
  }
}

/** Altı kart = altı rAF değil, bir rAF. */
export const scheduler = new Scheduler();
