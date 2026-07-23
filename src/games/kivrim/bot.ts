import type { Dir, InputSource, Intent, Snapshot } from '../../engine/types.js';

const IDLE = { ax: 0, ay: 0, action: false, pressed: false, pointer: null };

/**
 * Aç gözlü: yeme doğru git, engelliyse serbest yöne sap.
 * Kuyruk sıkışmasını çözmez — bu yüzden düzenli ölür, ki izlemesi keyifli olan da bu.
 */
export class KivrimBot implements InputSource {
  constructor(
    private rng: () => number,
    /** 0..1. Düşükse daha sık rastgele hamle yapar. */
    private skill = 0.9
  ) {}

  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    const free: Record<Dir, boolean> = {
      up: s.freeUp === 1,
      down: s.freeDown === 1,
      left: s.freeLeft === 1,
      right: s.freeRight === 1,
    };
    const dx = s.foodX - s.headX;
    const dy = s.foodY - s.headY;

    // Yeme doğru tercih sırası: uzun eksen önce.
    const want: Dir[] = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx !== 0) want.push(dx > 0 ? 'right' : 'left');
      if (dy !== 0) want.push(dy > 0 ? 'down' : 'up');
    } else {
      if (dy !== 0) want.push(dy > 0 ? 'down' : 'up');
      if (dx !== 0) want.push(dx > 0 ? 'right' : 'left');
    }
    for (const d of (['up', 'down', 'left', 'right'] as Dir[])) {
      if (!want.includes(d)) want.push(d);
    }

    let pick: Dir | null = null;
    if (this.rng() > this.skill) {
      const opts = (Object.keys(free) as Dir[]).filter((d) => free[d]);
      if (opts.length) pick = opts[Math.floor(this.rng() * opts.length)];
    }
    if (!pick) pick = want.find((d) => free[d]) ?? null;

    const cur: Dir =
      s.dirX === 1 ? 'right' : s.dirX === -1 ? 'left' : s.dirY === 1 ? 'down' : 'up';
    return { ...IDLE, dir: pick && pick !== cur ? pick : null };
  }
}
