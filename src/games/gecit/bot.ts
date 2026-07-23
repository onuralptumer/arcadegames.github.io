import type { Dir, InputSource, Intent, Snapshot } from '../../engine/types.js';

const BASE = { ax: 0, ay: 0, action: false, pressed: false, pointer: null };

/**
 * Iki isi birden yapmasi gerekiyor: ilerlemek ve bulundugu hucreden kacmak.
 * Sadece "ustu bos mu" diye bakan bir bot, beklerken uzerinden araba geciyor.
 */
export class GecitBot implements InputSource {
  private wait = 0;

  constructor(private rng: () => number, private skill = 0.9) {}
  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    if (s.stun === 1) return { ...BASE, dir: null };
    if (--this.wait > 0) return { ...BASE, dir: null };
    this.wait = 2 + Math.floor(this.rng() * 2);

    // Adim ~0.15 sn; bu kadar sureyle guvende olmayan hucreye girilmez.
    const need = 0.5;
    const sloppy = this.rng() > this.skill;

    if (s.safeUp > need && !sloppy) return { ...BASE, dir: 'up' };

    // Durdugu yer tehlikeliyse en guvenli komsuya kac.
    if (s.safeHere < need) {
      const opts: [Dir, number][] = [
        ['up', s.safeUp],
        ['left', s.safeLeft],
        ['right', s.safeRight],
        ['down', s.safeDown],
      ];
      opts.sort((a, b) => b[1] - a[1]);
      if (opts[0][1] > s.safeHere) return { ...BASE, dir: opts[0][0] };
    }
    return { ...BASE, dir: null };
  }
}
