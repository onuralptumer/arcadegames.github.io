import type { Dir, InputSource, Intent, Snapshot } from '../../engine/types.js';
import { PIECES, rotated } from './pieces.js';

const BASE = { ax: 0, ay: 0, action: false, pressed: false, pointer: null };

interface Plan {
  x: number;
  rot: number;
}

/**
 * Klasik yükseklik/delik/pürüz sezgiseli. Tahtanın tamamını görmez, yalnızca
 * sütun profilini görür — bu yüzden kapalı boşlukları tam hesaplayamaz ve
 * zamanla tıkanır. Önizleme için istenen de bu: düzenli olarak sıfırlanması.
 */
export class YiginBot implements InputSource {
  private plan: Plan | null = null;
  private lastPieceId = -1;

  constructor(
    private rng: () => number,
    /** 0..1. Düşükse ara sıra bilerek kötü sütun seçer. */
    private skill = 0.85
  ) {}

  attach() {}
  detach() {}

  poll(s: Snapshot): Intent {
    const cols = s.cols;
    if (s.pieceId !== this.lastPieceId) {
      this.lastPieceId = s.pieceId;
      this.plan = null;
    }
    if (!this.plan) this.plan = this.choose(s, cols);

    const dir = this.stepToward(s);
    return { ...BASE, dir };
  }

  private stepToward(s: Snapshot): Dir | null {
    const p = this.plan!;
    if (s.rot !== p.rot) return 'up';
    if (s.px < p.x) return 'right';
    if (s.px > p.x) return 'left';
    return 'down'; // hizalandı, sert düşür
  }

  private choose(s: Snapshot, cols: number): Plan {
    const h: number[] = [];
    const o: number[] = [];
    for (let x = 0; x < cols; x++) {
      h.push(s[`h${x}`]);
      o.push(s[`o${x}`]);
    }
    const piece = PIECES[s.piece];

    let best: Plan = { x: s.px, rot: s.rot };
    let bestCost = Infinity;

    for (let rot = 0; rot < 4; rot++) {
      const cells = rotated(piece, rot);
      // Parçanın her sütunundaki en alt hücre ve genişliği.
      const minX = Math.min(...cells.map((c) => c[0]));
      const maxX = Math.max(...cells.map((c) => c[0]));
      const bottom = new Map<number, number>();
      for (const [cx, cy] of cells) {
        bottom.set(cx, Math.max(bottom.get(cx) ?? -1, cy));
      }

      for (let px = -minX; px + maxX < cols; px++) {
        // Parça hangi satıra oturur: her sütunda gerekli boşluğa göre en kısıtlayıcı.
        let landTop = Infinity;
        for (const [cx, cyMax] of bottom) {
          const col = px + cx;
          const surface = s.rows - h[col]; // ilk dolu satır
          landTop = Math.min(landTop, surface - cyMax - 1);
        }
        if (landTop < 0) continue;

        const nh = h.slice();
        let newHoles = 0;
        for (const [cx, cyMax] of bottom) {
          const col = px + cx;
          const top = landTop + cyMax;
          const gap = s.rows - h[col] - top - 1;
          if (gap > 0) newHoles += gap;
          nh[col] = Math.max(nh[col], s.rows - (landTop + this.minCy(cells, cx)));
        }

        let agg = 0;
        let maxH = 0;
        for (let x = 0; x < cols; x++) {
          agg += nh[x];
          maxH = Math.max(maxH, nh[x]);
        }
        let bump = 0;
        for (let x = 1; x < cols; x++) bump += Math.abs(nh[x] - nh[x - 1]);

        const holes = o.reduce((a, b) => a + b, 0) + newHoles;
        const cost = holes * 9 + agg * 0.55 + bump * 0.45 + maxH * 1.2;

        if (cost < bestCost) {
          bestCost = cost;
          best = { x: px, rot };
        }
      }
    }

    // Ara sıra bilerek ikinci en iyiye sapma: mükemmel bot izlemesi sıkıcı.
    if (this.rng() > this.skill) {
      best = { x: Math.max(0, Math.min(cols - 1, best.x + (this.rng() < 0.5 ? -2 : 2))), rot: best.rot };
    }
    return best;
  }

  private minCy(cells: [number, number][], cx: number): number {
    let m = Infinity;
    for (const [x, y] of cells) if (x === cx) m = Math.min(m, y);
    return m;
  }
}
