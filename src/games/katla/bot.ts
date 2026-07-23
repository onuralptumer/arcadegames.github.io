import type { Dir, InputSource, Intent, Snapshot } from '../../engine/types.js';

const BASE = { ax: 0, ay: 0, action: false, pressed: false, pointer: null };
const N = 4;

/**
 * Köşe stratejisi: büyük kutucuğu bir köşede tut, öncelik sırasıyla oyna.
 * Yukarı hamlesi köşeyi bozduğu için en sona bırakılır — bu yüzden bot
 * sonunda tıkanır ve tahta sıfırlanır, ki önizlemede istenen de bu.
 */
export class KatlaBot implements InputSource {
  private wait = 0;

  constructor(private rng: () => number) {}

  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    if (s.busy === 1 || s.over === 1) return { ...BASE, dir: null };
    // İnsan hızında oyna; her tick hamle yaparsa izlenemez.
    if (--this.wait > 0) return { ...BASE, dir: null };
    this.wait = 4 + Math.floor(this.rng() * 4);

    const g: number[] = [];
    for (let i = 0; i < N * N; i++) g.push(s[`c${i}`]);

    const order: Dir[] = ['down', 'left', 'right', 'up'];
    for (const d of order) {
      if (this.changes(g, d)) return { ...BASE, dir: d };
    }
    return { ...BASE, dir: null };
  }

  /** Hamle tahtayı değiştirir mi — oyunun mantığını kopyalamadan, sadece kontrol. */
  private changes(g: number[], d: Dir): boolean {
    const dx = d === 'left' ? -1 : d === 'right' ? 1 : 0;
    const dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = g[y * N + x];
        if (!v) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const t = g[ny * N + nx];
        if (t === 0 || t === v) return true;
      }
    }
    return false;
  }
}
