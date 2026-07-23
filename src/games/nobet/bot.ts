import type { InputSource, Intent, Snapshot } from '../../engine/types.js';

/**
 * Hedefe hizalan, ateş et, bomba yaklaşınca kaç.
 * Kaçınma eşiği bilerek dar tutuldu; her bombadan kaçan bot hiç ölmez.
 */
export class NobetBot implements InputSource {
  private t = 0;
  private jitter = 0;

  constructor(
    private rng: () => number,
    private skill = 0.85
  ) {}

  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    this.t++;
    if (this.t % 9 === 0) {
      this.jitter = (this.rng() - 0.5) * s.fieldW * 0.09 * (1 - this.skill) * 6;
    }

    let want = s.targetX + this.jitter;

    // Bomba yakınsa yana sıyrıl.
    const danger = s.bombY > s.fieldH * 0.45 && Math.abs(s.bombX - s.px) < s.fieldW * 0.075;
    if (danger && this.rng() < this.skill) {
      want = s.bombX + (s.bombX > s.fieldW / 2 ? -1 : 1) * s.fieldW * 0.18;
    }

    const x = Math.max(0, Math.min(1, want / s.fieldW));
    // Hizalıyken ateş et; sürekli basılı tutmak da olurdu ama nişan almış görünmüyor.
    const aligned = Math.abs(want - s.px) < s.fieldW * 0.05;
    return {
      ax: 0,
      ay: 0,
      action: aligned && s.canFire === 1,
      pressed: false,
      pointer: { x, y: 0.9 },
      dir: null,
    };
  }
}
