import type { Game, GameInit, Snapshot } from '../../engine/types.js';

interface Plat {
  x: number;
  y: number;
  w: number;
}

export class Sekme implements Game {
  private o!: GameInit;
  private W = 0;
  private H = 0;

  private x = 0;
  private px = 0;
  private y = 0;
  private py = 0;
  private vy = 0;
  private r = 0;

  private gravity = 0;
  private bounce = 0;
  private moveSpeed = 0;

  private plats: Plat[] = [];
  private platW = 0;
  private platH = 0;
  private spacing = 0;
  private highest = 0;

  private climbed = 0;
  private score = 0;
  private dead = false;
  private deadFor = 0;

  init(o: GameInit) {
    this.o = o;
    this.W = o.field.w;
    this.H = o.field.h;

    this.r = this.W * 0.03;
    // Zıplama yüksekliği = bounce² / (2·gravity). Platform aralığı bunun altında
    // kalmalı, yoksa erişilemeyen platform üretiriz.
    this.gravity = this.H * 1.9;
    this.bounce = -this.H * 0.95;
    this.moveSpeed = this.W * 0.85;

    this.platW = this.W * 0.2;
    this.platH = Math.max(1.5, this.H * 0.018);
    const reach = (this.bounce * this.bounce) / (2 * this.gravity);
    this.spacing = reach * 0.42;

    this.reset();
  }

  private reset() {
    this.plats = [];
    this.x = this.px = this.W / 2;
    this.y = this.py = this.H * 0.6;
    this.vy = this.bounce;
    this.climbed = 0;
    this.score = 0;
    this.dead = false;
    this.deadFor = 0;

    // Başlangıçta ayağının altında bir platform olsun.
    this.plats.push({ x: this.W / 2 - this.platW / 2, y: this.H * 0.72, w: this.platW });
    this.highest = this.H * 0.72;
    while (this.highest > -this.spacing) this.addPlat();
  }

  private addPlat() {
    this.highest -= this.spacing * (0.75 + this.o.rng() * 0.5);
    const w = this.platW * (0.75 + this.o.rng() * 0.5);
    this.plats.push({ x: this.o.rng() * (this.W - w), y: this.highest, w });
  }

  snapshot(): Snapshot {
    /*
     * Bot inis hedefini bilmeli. Top yukselirken platformlarin arasindan gecer;
     * carpisma yalnizca duserken olur. Dolayisiyla dogru hedef "ustteki en yakin
     * platform" degil, TEPE NOKTASININ hemen altindaki platform — inerken ilk
     * karsilasacagi ve en cok yukselti kazandiracak olan o.
     */
    const apex = this.vy < 0 ? this.y - (this.vy * this.vy) / (2 * this.gravity) : this.y;
    let bx = this.W / 2;
    let by = 1e9;
    for (const p of this.plats) {
      if (p.y > apex && p.y < by) {
        by = p.y;
        bx = p.x + p.w / 2;
      }
    }
    if (by === 1e9) by = -1e9;
    return {
      x: this.x,
      y: this.y,
      vy: this.vy,
      targetX: bx,
      targetY: by,
      fieldW: this.W,
      fieldH: this.H,
      dead: this.dead ? 1 : 0,
      score: this.score,
    };
  }

  update(dt: number) {
    const it = this.o.input.poll(this.snapshot());

    if (this.dead) {
      this.deadFor += dt;
      if (this.deadFor > (this.o.mode === 'demo' ? 0.7 : 1.1)) this.reset();
      return;
    }

    this.px = this.x;
    if (it.pointer) {
      const t = it.pointer.x * this.W;
      this.x += (t - this.x) * (1 - Math.exp(-13 * dt));
    } else if (it.ax !== 0) {
      this.x += it.ax * this.moveSpeed * dt;
    }
    // Kenardan çıkınca öbür taraftan girer; köşeye sıkışmayı önlüyor.
    if (this.x < -this.r) this.x = this.W + this.r;
    else if (this.x > this.W + this.r) this.x = -this.r;

    this.py = this.y;
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;

    // Yalnızca düşerken ve platformun üstünden geçerken sekme olur.
    if (this.vy > 0) {
      for (const p of this.plats) {
        if (
          this.py + this.r <= p.y &&
          this.y + this.r >= p.y &&
          this.x > p.x - this.r * 0.5 &&
          this.x < p.x + p.w + this.r * 0.5
        ) {
          this.vy = this.bounce;
          break;
        }
      }
    }

    // Ekranın üst yarısını geçince dünya aşağı kayar, oyuncu yerinde kalır.
    const line = this.H * 0.42;
    if (this.y < line) {
      const d = line - this.y;
      this.y = line;
      this.py += d;
      this.climbed += d;
      for (const p of this.plats) p.y += d;
      this.highest += d;
      while (this.highest > -this.spacing) this.addPlat();
      this.plats = this.plats.filter((p) => p.y < this.H + this.spacing);

      const s = Math.floor(this.climbed / this.H * 10);
      if (s > this.score) {
        this.score = s;
        if (this.o.mode !== 'demo') this.o.events.score(this.score);
      }
    }

    if (this.y - this.r > this.H) {
      this.dead = true;
      this.deadFor = 0;
      if (this.o.mode !== 'demo') this.o.events.gameOver(this.score);
    }
  }

  render(alpha: number) {
    const { ctx, palette } = this.o;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.fillStyle = palette.dim;
    for (const p of this.plats) {
      if (p.y > -this.platH && p.y < this.H) ctx.fillRect(p.x, p.y, p.w, this.platH);
    }

    if (this.dead) return;
    const x = this.px + (this.x - this.px) * alpha;
    const y = this.py + (this.y - this.py) * alpha;
    ctx.fillStyle = palette.fg;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }

  destroy() {
    this.plats = [];
  }
}
