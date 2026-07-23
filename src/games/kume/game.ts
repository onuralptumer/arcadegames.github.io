import type { Game, GameInit, Snapshot } from '../../engine/types.js';

/**
 * Klasik kabarcık oyunu 4-6 renge dayanır ama sitenin kuralı tek renk.
 * Renk yerine dört opaklık katmanı kullanılıyor — aynı oynanış, bozulmayan kimlik.
 */
const TIERS = 4;
const EMPTY = -1;

export class Kume implements Game {
  private o!: GameInit;
  private cols = 0;
  private rows = 0;
  private r = 0;
  private ox = 0;
  private rowH = 0;

  private grid!: Int8Array;
  private shotTier = 0;
  private nextTier = 0;

  private aim = -Math.PI / 2;
  private bx = 0;
  private by = 0;
  private bvx = 0;
  private bvy = 0;
  private flying = false;
  private speed = 0;

  private shooterY = 0;
  private loseY = 0;
  private score = 0;
  private shots = 0;

  init(o: GameInit) {
    this.o = o;
    this.cols = o.mode === 'demo' ? 13 : 9;
    this.r = o.field.w / (this.cols * 2 + 1);
    this.ox = this.r * 1.5;
    this.rowH = this.r * 1.732;
    this.shooterY = o.field.h - this.r * 2.2;
    this.loseY = this.shooterY - this.r * 2.5;
    this.rows = Math.max(6, Math.floor((this.loseY - this.r) / this.rowH));
    this.speed = o.field.h * 1.55;
    this.grid = new Int8Array(this.cols * this.rows);
    this.reset();
  }

  private reset() {
    this.grid.fill(EMPTY);
    const start = this.o.mode === 'demo' ? 4 : 5;
    for (let y = 0; y < start; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.grid[y * this.cols + x] = Math.floor(this.o.rng() * TIERS);
      }
    }
    this.score = 0;
    this.shots = 0;
    this.flying = false;
    this.shotTier = this.pickTier();
    this.nextTier = this.pickTier();
  }

  /** Yalnızca tahtada bulunan tonlardan seç; atılamayacak ton vermek haksızlık. */
  private pickTier(): number {
    const present = new Set<number>();
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] !== EMPTY) present.add(this.grid[i]);
    }
    const list = present.size ? [...present] : [0, 1, 2, 3];
    return list[Math.floor(this.o.rng() * list.length)];
  }

  private cx(x: number, y: number): number {
    return this.ox + (x + (y % 2 ? 0.5 : 0)) * this.r * 2;
  }
  private cy(y: number): number {
    return this.r + y * this.rowH;
  }

  private neighbors(x: number, y: number): [number, number][] {
    const odd = y % 2 === 1;
    const d: [number, number][] = odd
      ? [[-1, 0], [1, 0], [0, -1], [1, -1], [0, 1], [1, 1]]
      : [[-1, 0], [1, 0], [-1, -1], [0, -1], [-1, 1], [0, 1]];
    const out: [number, number][] = [];
    for (const [dx, dy] of d) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < this.cols && ny < this.rows) out.push([nx, ny]);
    }
    return out;
  }

  snapshot(): Snapshot {
    // Bot için: her sütunda en alttaki dolu hücrenin tonu ve yüksekliği.
    const s: Snapshot = {
      tier: this.shotTier,
      flying: this.flying ? 1 : 0,
      cols: this.cols,
      rows: this.rows,
      shooterX: this.o.field.w / 2,
      shooterY: this.shooterY,
      fieldW: this.o.field.w,
      score: this.score,
    };
    for (let x = 0; x < this.cols; x++) {
      let low = -1;
      let tier = -1;
      for (let y = this.rows - 1; y >= 0; y--) {
        if (this.grid[y * this.cols + x] !== EMPTY) {
          low = y;
          tier = this.grid[y * this.cols + x];
          break;
        }
      }
      s[`lowY${x}`] = low;
      s[`lowT${x}`] = tier;
      s[`cx${x}`] = this.cx(x, low < 0 ? 0 : low);
    }
    return s;
  }

  update(dt: number) {
    const it = this.o.input.poll(this.snapshot());

    if (!this.flying) {
      if (it.pointer) {
        const tx = it.pointer.x * this.o.field.w;
        const ty = it.pointer.y * this.o.field.h;
        const a = Math.atan2(ty - this.shooterY, tx - this.o.field.w / 2);
        // Yatayın altına nişan almak anlamsız; sınırla.
        this.aim = Math.max(-Math.PI * 0.93, Math.min(-Math.PI * 0.07, a));
      } else if (it.ax !== 0) {
        this.aim = Math.max(-Math.PI * 0.93, Math.min(-Math.PI * 0.07, this.aim + it.ax * 1.9 * dt));
      }
      if (it.action || it.pressed) {
        this.bx = this.o.field.w / 2;
        this.by = this.shooterY;
        this.bvx = Math.cos(this.aim) * this.speed;
        this.bvy = Math.sin(this.aim) * this.speed;
        this.flying = true;
      }
      return;
    }

    // Küçük adımlarla ilerlet: tek adımda tünel açıp içinden geçebiliyor.
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      this.bx += (this.bvx * dt) / steps;
      this.by += (this.bvy * dt) / steps;
      if (this.bx < this.r) {
        this.bx = this.r;
        this.bvx = Math.abs(this.bvx);
      } else if (this.bx > this.o.field.w - this.r) {
        this.bx = this.o.field.w - this.r;
        this.bvx = -Math.abs(this.bvx);
      }
      if (this.by <= this.r || this.hitsAny()) {
        this.stick();
        return;
      }
    }
  }

  private hitsAny(): boolean {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y * this.cols + x] === EMPTY) continue;
        if (Math.hypot(this.bx - this.cx(x, y), this.by - this.cy(y)) < this.r * 1.85) return true;
      }
    }
    return false;
  }

  private stick() {
    // En yakın boş hücreye otur.
    let best = -1;
    let bd = Infinity;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const i = y * this.cols + x;
        if (this.grid[i] !== EMPTY) continue;
        const d = Math.hypot(this.bx - this.cx(x, y), this.by - this.cy(y));
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
    }
    this.flying = false;
    if (best < 0) return this.lose();

    this.grid[best] = this.shotTier;
    const bxi = best % this.cols;
    const byi = (best / this.cols) | 0;

    const group = this.flood(bxi, byi, this.shotTier);
    if (group.length >= 3) {
      for (const i of group) this.grid[i] = EMPTY;
      this.score += group.length * 10;
      this.score += this.dropFloating() * 20;
      if (this.o.mode !== 'demo') this.o.events.score(this.score);
    }

    this.shots++;
    // Belirli aralıklarla üstten yeni sıra iner; oyun sonsuza kadar sürmesin.
    if (this.shots % (this.o.mode === 'demo' ? 7 : 9) === 0) this.pushRow();

    if (this.empty()) this.reset();

    this.shotTier = this.nextTier;
    this.nextTier = this.pickTier();
  }

  private empty(): boolean {
    for (let i = 0; i < this.grid.length; i++) if (this.grid[i] !== EMPTY) return false;
    return true;
  }

  private flood(x: number, y: number, tier: number): number[] {
    const seen = new Set<number>();
    const out: number[] = [];
    const stack: [number, number][] = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      const i = cy * this.cols + cx;
      if (seen.has(i) || this.grid[i] !== tier) continue;
      seen.add(i);
      out.push(i);
      for (const n of this.neighbors(cx, cy)) stack.push(n);
    }
    return out;
  }

  /** Üst sıraya bağlı olmayan kümeler düşer. */
  private dropFloating(): number {
    const keep = new Set<number>();
    const stack: [number, number][] = [];
    for (let x = 0; x < this.cols; x++) {
      if (this.grid[x] !== EMPTY) stack.push([x, 0]);
    }
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      const i = cy * this.cols + cx;
      if (keep.has(i) || this.grid[i] === EMPTY) continue;
      keep.add(i);
      for (const n of this.neighbors(cx, cy)) stack.push(n);
    }
    let dropped = 0;
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] !== EMPTY && !keep.has(i)) {
        this.grid[i] = EMPTY;
        dropped++;
      }
    }
    return dropped;
  }

  private pushRow() {
    for (let y = this.rows - 1; y > 0; y--) {
      for (let x = 0; x < this.cols; x++) {
        this.grid[y * this.cols + x] = this.grid[(y - 1) * this.cols + x];
      }
    }
    for (let x = 0; x < this.cols; x++) this.grid[x] = Math.floor(this.o.rng() * TIERS);

    for (let x = 0; x < this.cols; x++) {
      if (this.grid[(this.rows - 1) * this.cols + x] !== EMPTY) return this.lose();
    }
  }

  private lose() {
    if (this.o.mode !== 'demo') this.o.events.gameOver(this.score);
    this.reset();
  }

  private alphaFor(tier: number): number {
    return 0.3 + (tier / (TIERS - 1)) * 0.7;
  }

  render() {
    const { ctx, palette } = this.o;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, this.o.field.w, this.o.field.h);

    ctx.fillStyle = palette.fg;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const t = this.grid[y * this.cols + x];
        if (t === EMPTY) continue;
        ctx.globalAlpha = this.alphaFor(t);
        ctx.beginPath();
        ctx.arc(this.cx(x, y), this.cy(y), this.r * 0.92, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Nişan çizgisi: nereye gideceğini görmeden oynanmıyor.
    if (!this.flying) {
      ctx.strokeStyle = palette.dim;
      ctx.lineWidth = Math.max(0.6, this.r * 0.12);
      ctx.beginPath();
      ctx.moveTo(this.o.field.w / 2, this.shooterY);
      ctx.lineTo(
        this.o.field.w / 2 + Math.cos(this.aim) * this.r * 5,
        this.shooterY + Math.sin(this.aim) * this.r * 5
      );
      ctx.stroke();
    }

    ctx.fillStyle = palette.fg;
    ctx.globalAlpha = this.alphaFor(this.flying ? this.shotTier : this.shotTier);
    ctx.beginPath();
    ctx.arc(
      this.flying ? this.bx : this.o.field.w / 2,
      this.flying ? this.by : this.shooterY,
      this.r * 0.92,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  destroy() {
    this.grid = new Int8Array(0);
  }
}
