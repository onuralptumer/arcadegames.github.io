import type { InputSource, Intent, Snapshot } from '../../engine/types.js';

const BASE = { ax: 0, ay: 0, pointer: null, dir: null };

/**
 * Beş satırlık bot: hedef yüksekliğin altına düşünce zıpla.
 * Hedefe küçük bir sapma eklenir, yoksa hiç ölmez ve kart ölü görünür.
 */
export class SuzulBot implements InputSource {
  private held = false;
  private bias = 0;
  private t = 0;

  constructor(
    private rng: () => number,
    /** 0..1. Düşükse hedefi daha çok şaşırır. */
    private skill = 0.85
  ) {}

  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    if (s.dead === 1) {
      this.held = false;
      return { ...BASE, action: false, pressed: false };
    }
    if (--this.t <= 0) {
      this.t = 8 + Math.floor(this.rng() * 10);
      this.bias = (this.rng() - 0.5) * s.gap * (1 - this.skill) * 2.2;
    }
    // Yerçekimi altında düşerken hedefin biraz üstünü nişan al.
    const aim = s.gateCY + this.bias - s.gap * 0.08;
    const want = s.y > aim && s.vy > -s.fieldH * 0.05;
    const pressed = want && !this.held;
    this.held = want;
    return { ...BASE, action: want, pressed };
  }
}
