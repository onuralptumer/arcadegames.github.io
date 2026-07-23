import type { InputSource, Intent, Snapshot } from '../../engine/types.js';

/**
 * İyi oynamak amaç değil, izlenebilir oynamak amaç.
 * Tuğla sekmelerini tahmin etmez; bu yüzden doğal olarak yanılır.
 */
export class DeflektBot implements InputSource {
  private t = 0;
  private hold = 0;
  private target = 0.5;

  constructor(
    private rng: () => number,
    private skill = 0.8
  ) {}

  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    this.t++;
    if (--this.hold <= 0) {
      this.hold = 2 + Math.floor(this.rng() * 4);
      if (s.ballVY > 0) {
        const big = this.rng() > this.skill;
        const err = (this.rng() - 0.5) * s.padW * (big ? 3.4 : 0.55);
        this.target = (this.predict(s) + err) / s.fieldW;
      } else {
        this.target = 0.5 + Math.sin(this.t * 0.035) * 0.16;
      }
    }
    const x = Math.max(0, Math.min(1, this.target));
    return { ax: 0, ay: 0, action: true, pressed: false, pointer: { x, y: 0.9 }, dir: null };
  }

  /** Düz çizgi + duvar katlaması. Tuğlalar hesaba katılmaz. */
  private predict(s: Snapshot): number {
    if (s.ballVY <= 0) return s.ballX;
    const w = s.fieldW;
    const period = 2 * w;
    let x = s.ballX + s.ballVX * ((s.padY - s.ballY) / s.ballVY);
    x = ((x % period) + period) % period;
    return x > w ? period - x : x;
  }
}
