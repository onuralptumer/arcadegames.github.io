import type { InputSource, Intent, Snapshot } from '../../engine/types.js';

/**
 * En yakın kayaya döner, hizalanınca ateş eder, çok yaklaşınca iter.
 * Ateş isabetini bilerek düşürdüm: hiç ıskalamayan bot kayaları anında
 * temizleyip boş ekran bırakıyor, kart ölü görünüyor.
 */
export class SavrukBot implements InputSource {
  private t = 0;
  private wobble = 0;

  constructor(private rng: () => number, private skill = 0.82) {}
  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    this.t++;
    if (this.t % 11 === 0) this.wobble = (this.rng() - 0.5) * (1 - this.skill) * 2.4;

    const want = Math.atan2(s.nearDY, s.nearDX) + this.wobble;
    let d = want - s.angle;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;

    const aligned = Math.abs(d) < 0.22;
    // Kaya çok yakınsa ters yöne it.
    const danger = s.nearDist < (s.nearR + s.shipR) * 3.2;
    const thrust = danger && Math.abs(d) > Math.PI * 0.55;

    return {
      ax: Math.abs(d) < 0.05 ? 0 : d > 0 ? 1 : -1,
      ay: thrust ? -1 : 0,
      action: aligned && s.canFire === 1,
      pressed: false,
      pointer: null,
      dir: null,
    };
  }
}
