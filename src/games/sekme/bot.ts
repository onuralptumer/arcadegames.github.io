import type { InputSource, Intent, Snapshot } from '../../engine/types.js';

/** Yukarıdaki en yakın platformun altına geç. Nişan hatası olmadan hiç düşmez. */
export class SekmeBot implements InputSource {
  private bias = 0;
  private t = 0;

  constructor(private rng: () => number, private skill = 0.88) {}
  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    if (--this.t <= 0) {
      this.t = 10 + Math.floor(this.rng() * 12);
      this.bias = (this.rng() - 0.5) * s.fieldW * 0.22 * (1 - this.skill) * 5;
    }
    const want = s.targetY > -1e8 ? s.targetX + this.bias : s.fieldW / 2;
    const x = Math.max(0, Math.min(1, want / s.fieldW));
    return { ax: 0, ay: 0, action: false, pressed: false, pointer: { x, y: 0.5 }, dir: null };
  }
}
