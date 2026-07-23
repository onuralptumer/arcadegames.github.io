import type { Dir, Game, GameInit, Snapshot } from '../../engine/types.js';

const N = 4;
const SLIDE = 0.09; // saniye

interface Tile {
  v: number;
  /** Kaynak hücre (animasyon için). */
  fx: number;
  fy: number;
  x: number;
  y: number;
  /** Birleşerek doğduysa büyüyerek belirir. */
  born: boolean;
}

export class Katla implements Game {
  private o!: GameInit;
  private grid: number[] = [];
  private tiles: Tile[] = [];
  private anim = 0;
  private score = 0;
  private over = false;
  private overFor = 0;

  /** Tahta kare; alan yatay ise ortalanır. */
  private side = 0;
  private ox = 0;
  private oy = 0;
  private cell = 0;

  init(o: GameInit) {
    this.o = o;
    this.side = Math.min(o.field.w, o.field.h) * 0.94;
    this.ox = (o.field.w - this.side) / 2;
    this.oy = (o.field.h - this.side) / 2;
    this.cell = this.side / N;
    this.reset();
  }

  private reset() {
    this.grid = new Array(N * N).fill(0);
    this.tiles = [];
    this.score = 0;
    this.over = false;
    this.overFor = 0;
    this.addTile();
    this.addTile();
    this.sync();
  }

  private addTile() {
    const free: number[] = [];
    for (let i = 0; i < N * N; i++) if (!this.grid[i]) free.push(i);
    if (!free.length) return;
    const i = free[Math.floor(this.o.rng() * free.length)];
    this.grid[i] = this.o.rng() < 0.9 ? 2 : 4;
  }

  /** Animasyonsuz durum: kutucukları gridden yeniden kur. */
  private sync() {
    this.tiles = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = this.grid[y * N + x];
        if (v) this.tiles.push({ v, fx: x, fy: y, x, y, born: false });
      }
    }
  }

  private canMove(): boolean {
    for (let i = 0; i < N * N; i++) {
      if (!this.grid[i]) return true;
      const x = i % N;
      const y = (i / N) | 0;
      if (x + 1 < N && this.grid[i] === this.grid[i + 1]) return true;
      if (y + 1 < N && this.grid[i] === this.grid[i + N]) return true;
    }
    return false;
  }

  /** Hamleyi uygular. Tahta değişmediyse false döner. */
  private move(d: Dir): boolean {
    const dx = d === 'left' ? -1 : d === 'right' ? 1 : 0;
    const dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;

    // Hareket yönünün tersinden tara ki öndeki kutucuk önce yerleşsin.
    const xs = dx > 0 ? [3, 2, 1, 0] : [0, 1, 2, 3];
    const ys = dy > 0 ? [3, 2, 1, 0] : [0, 1, 2, 3];

    const next: Tile[] = [];
    const merged = new Set<number>();
    let changed = false;

    for (const y of ys) {
      for (const x of xs) {
        const v = this.grid[y * N + x];
        if (!v) continue;
        let cx = x;
        let cy = y;
        while (true) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) break;
          const t = this.grid[ny * N + nx];
          if (t === 0) {
            this.grid[ny * N + nx] = this.grid[cy * N + cx];
            this.grid[cy * N + cx] = 0;
            cx = nx;
            cy = ny;
            changed = true;
          } else if (t === this.grid[cy * N + cx] && !merged.has(ny * N + nx)) {
            this.grid[ny * N + nx] = t * 2;
            this.grid[cy * N + cx] = 0;
            merged.add(ny * N + nx);
            this.score += t * 2;
            cx = nx;
            cy = ny;
            changed = true;
            break;
          } else break;
        }
        next.push({ v, fx: x, fy: y, x: cx, y: cy, born: false });
      }
    }

    if (!changed) return false;

    this.tiles = next;
    this.anim = SLIDE;
    if (this.o.mode !== 'demo') this.o.events.score(this.score);
    return true;
  }

  snapshot(): Snapshot {
    const s: Snapshot = { score: this.score, over: this.over ? 1 : 0, busy: this.anim > 0 ? 1 : 0 };
    for (let i = 0; i < N * N; i++) s[`c${i}`] = this.grid[i];
    return s;
  }

  update(dt: number) {
    if (this.anim > 0) {
      this.anim -= dt;
      if (this.anim <= 0) {
        this.addTile();
        this.sync();
        if (!this.canMove()) {
          this.over = true;
          if (this.o.mode !== 'demo') this.o.events.gameOver(this.score);
        }
      }
      return;
    }

    if (this.over) {
      this.overFor += dt;
      if (this.o.mode === 'demo' && this.overFor > 1.2) this.reset();
      return;
    }

    const it = this.o.input.poll(this.snapshot());
    if (it.dir) this.move(it.dir);
  }

  render() {
    const { ctx, palette } = this.o;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, this.o.field.w, this.o.field.h);

    const pad = this.cell * 0.06;
    const s = this.cell - pad * 2;
    const r = Math.max(1, this.cell * 0.1);

    // Boş hücreler: zeminden bir tık ayrışan çerçeve.
    ctx.fillStyle = palette.dim;
    ctx.globalAlpha = 0.28;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        this.roundRect(ctx, this.ox + x * this.cell + pad, this.oy + y * this.cell + pad, s, s, r);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    const t = this.anim > 0 ? 1 - this.anim / SLIDE : 1;
    const ease = t * (2 - t);

    for (const tile of this.tiles) {
      const gx = tile.fx + (tile.x - tile.fx) * ease;
      const gy = tile.fy + (tile.y - tile.fy) * ease;
      const px = this.ox + gx * this.cell + pad;
      const py = this.oy + gy * this.cell + pad;

      // Tek renk, değere göre koyulaşan opaklık. İkinci renk yok.
      const tier = Math.min(1, Math.log2(tile.v) / 11);
      ctx.globalAlpha = 0.32 + tier * 0.68;
      ctx.fillStyle = palette.fg;
      this.roundRect(ctx, px, py, s, s, r);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (this.o.mode !== 'demo') {
        const label = String(tile.v);
        const size = s * (label.length > 3 ? 0.3 : label.length > 2 ? 0.38 : 0.46);
        ctx.fillStyle = palette.bg;
        ctx.font = `500 ${size}px ui-monospace, Menlo, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, px + s / 2, py + s / 2 + size * 0.04);
      }
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  destroy() {
    this.tiles = [];
    this.grid = [];
  }
}
