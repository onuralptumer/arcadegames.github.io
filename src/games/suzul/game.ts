import type { Game, GameInit, Snapshot } from '../../engine/types.js';

interface Gate {
  x: number;
  /** Boşluğun merkezi. */
  cy: number;
  scored: boolean;
}

export class Suzul implements Game {
  private o!: GameInit;
  private W = 0;
  private H = 0;

  private y = 0;
  private py = 0;
  private vy = 0;
  private x = 0;
  private r = 0;

  private gravity = 0;
  private lift = 0;
  private scroll = 0;
  private gap = 0;
  private gateW = 0;
  private spacing = 0;

  private gates: Gate[] = [];
  private score = 0;
  private dead = false;
  private deadFor = 0;

  init(o: GameInit) {
    this.o = o;
    this.W = o.field.w;
    this.H = o.field.h;

    this.x = this.W * 0.28;
    this.r = this.W * 0.028;
    // Zıplama başına kazanılan yükseklik = lift² / (2·gravity).
    // Büyük değerler kaba bir testere dişi üretir ve dar boşluklarda kontrol kaybolur;
    // küçük genlik + sık zıplama daha iyi hissettiriyor.
    this.gravity = this.H * 2.4;
    this.lift = -this.H * 0.46;
    this.scroll = this.W * 0.42;
    // Önizlemede alan basık: boşluk oranını büyütmezsek geçilmez olur.
    this.gap = this.H * (o.mode === 'demo' ? 0.46 : 0.3);
    this.gateW = this.W * 0.11;
    this.spacing = this.W * 0.58;

    this.reset();
  }

  private reset() {
    this.y = this.py = this.H / 2;
    this.vy = 0;
    this.score = 0;
    this.dead = false;
    this.deadFor = 0;
    this.gates = [];
    for (let i = 0; i < 4; i++) this.spawn(this.W + i * this.spacing);
  }

  private spawn(x: number) {
    const margin = this.gap / 2 + this.H * 0.08;
    const lo = margin;
    const hi = this.H - margin;
    const prev = this.gates.length ? this.gates[this.gates.length - 1].cy : this.H / 2;
    // Ardışık kapılar arasındaki dikey fark sınırlı olmalı: zıplama başına
    // kazanılan yükseklik sabit, sınırsız sıçrama fiziken geçilemez kapı üretir.
    const reach = this.H * 0.17;
    const a = Math.max(lo, prev - reach);
    const b = Math.min(hi, prev + reach);
    this.gates.push({ x, cy: a + this.o.rng() * (b - a), scored: false });
  }

  snapshot(): Snapshot {
    let nx = this.W * 4;
    let ncy = this.H / 2;
    for (const g of this.gates) {
      if (g.x + this.gateW >= this.x - this.r && g.x < nx) {
        nx = g.x;
        ncy = g.cy;
      }
    }
    return {
      y: this.y,
      vy: this.vy,
      x: this.x,
      gateX: nx,
      gateCY: ncy,
      gap: this.gap,
      fieldH: this.H,
      fieldW: this.W,
      gravity: this.gravity,
      dead: this.dead ? 1 : 0,
    };
  }

  update(dt: number) {
    const it = this.o.input.poll(this.snapshot());

    if (this.dead) {
      this.deadFor += dt;
      if (this.deadFor > (this.o.mode === 'demo' ? 0.7 : 1.1)) this.reset();
      return;
    }

    if (it.pressed) this.vy = this.lift;

    this.py = this.y;
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;

    for (const g of this.gates) g.x -= this.scroll * dt;

    if (this.gates.length && this.gates[0].x + this.gateW < 0) {
      this.gates.shift();
      this.spawn(this.gates[this.gates.length - 1].x + this.spacing);
    }

    for (const g of this.gates) {
      if (!g.scored && g.x + this.gateW < this.x - this.r) {
        g.scored = true;
        this.score += 1;
        if (this.o.mode !== 'demo') this.o.events.score(this.score);
      }
      const overlapX = this.x + this.r > g.x && this.x - this.r < g.x + this.gateW;
      if (overlapX) {
        const top = g.cy - this.gap / 2;
        const bot = g.cy + this.gap / 2;
        if (this.y - this.r < top || this.y + this.r > bot) return this.die();
      }
    }

    if (this.y + this.r > this.H || this.y - this.r < 0) return this.die();
  }

  private die() {
    this.dead = true;
    this.deadFor = 0;
    if (this.o.mode !== 'demo') this.o.events.gameOver(this.score);
  }

  render(alpha: number) {
    const { ctx, palette } = this.o;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.fillStyle = palette.dim;
    for (const g of this.gates) {
      const top = g.cy - this.gap / 2;
      const bot = g.cy + this.gap / 2;
      ctx.fillRect(g.x, 0, this.gateW, top);
      ctx.fillRect(g.x, bot, this.gateW, this.H - bot);
    }

    const y = this.dead ? this.y : this.py + (this.y - this.py) * alpha;
    ctx.fillStyle = palette.fg;
    ctx.beginPath();
    ctx.arc(this.x, y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }

  destroy() {
    this.gates = [];
  }
}
