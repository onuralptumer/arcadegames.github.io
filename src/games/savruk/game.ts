import type { Game, GameInit, Snapshot } from '../../engine/types.js';

interface Rock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 3 büyük, 2 orta, 1 küçük. 1 vurulunca yok olur. */
  size: number;
  live: boolean;
  spin: number;
  a: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  live: boolean;
}

export class Savruk implements Game {
  private o!: GameInit;
  private W = 0;
  private H = 0;

  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private a = -Math.PI / 2;
  private r = 0;
  private thrustPow = 0;
  private turnRate = 0;
  private drag = 0;

  private rocks: Rock[] = [];
  private bullets: Bullet[] = [];
  private cool = 0;
  private thrusting = false;

  private wave = 1;
  private score = 0;
  private dead = false;
  private deadFor = 0;
  /** Yeniden doğunca kısa dokunulmazlık; yoksa aynı kayaya tekrar çarpıyor. */
  private safe = 0;

  init(o: GameInit) {
    this.o = o;
    this.W = o.field.w;
    this.H = o.field.h;
    this.r = Math.min(this.W, this.H) * 0.035;
    this.thrustPow = Math.min(this.W, this.H) * 1.5;
    this.turnRate = 3.6;
    this.drag = 0.42;

    for (let i = 0; i < 18; i++)
      this.bullets.push({ x: 0, y: 0, vx: 0, vy: 0, t: 0, live: false });

    this.reset();
  }

  private reset() {
    this.wave = 1;
    this.score = 0;
    this.rocks = [];
    this.respawn();
    this.spawnWave();
  }

  private respawn() {
    this.x = this.W / 2;
    this.y = this.H / 2;
    this.vx = 0;
    this.vy = 0;
    this.a = -Math.PI / 2;
    this.dead = false;
    this.deadFor = 0;
    this.safe = 1.2;
    for (const b of this.bullets) b.live = false;
  }

  private spawnWave() {
    const n = Math.min(9, 3 + this.wave);
    const base = Math.min(this.W, this.H);
    for (let i = 0; i < n; i++) {
      // Gemiden uzakta doğsun, yoksa doğar doğmaz ölünür.
      let x = 0;
      let y = 0;
      for (let k = 0; k < 20; k++) {
        x = this.o.rng() * this.W;
        y = this.o.rng() * this.H;
        if (Math.hypot(x - this.x, y - this.y) > base * 0.3) break;
      }
      const ang = this.o.rng() * Math.PI * 2;
      const sp = base * (0.06 + this.o.rng() * 0.07) * (1 + (this.wave - 1) * 0.08);
      this.rocks.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: base * 0.075,
        size: 3,
        live: true,
        spin: (this.o.rng() - 0.5) * 1.6,
        a: this.o.rng() * Math.PI * 2,
      });
    }
  }

  /** Alan bir simit gibi sarılır: kenardan çıkan öbür kenardan girer. */
  private wrap(p: { x: number; y: number }) {
    if (p.x < 0) p.x += this.W;
    else if (p.x > this.W) p.x -= this.W;
    if (p.y < 0) p.y += this.H;
    else if (p.y > this.H) p.y -= this.H;
  }

  private wrapShip() {
    if (this.x < 0) this.x += this.W;
    else if (this.x > this.W) this.x -= this.W;
    if (this.y < 0) this.y += this.H;
    else if (this.y > this.H) this.y -= this.H;
  }

  snapshot(): Snapshot {
    // Bot için: en yakın kaya (sarma mesafesiyle) ve tehdit yakınlığı.
    let bx = 0;
    let by = 0;
    let bd = Infinity;
    let br = 0;
    let n = 0;
    for (const k of this.rocks) {
      if (!k.live) continue;
      n++;
      const dx = this.wrapD(k.x - this.x, this.W);
      const dy = this.wrapD(k.y - this.y, this.H);
      const d = Math.hypot(dx, dy);
      if (d < bd) {
        bd = d;
        bx = dx;
        by = dy;
        br = k.r;
      }
    }
    return {
      angle: this.a,
      nearDX: bx,
      nearDY: by,
      nearDist: bd === Infinity ? 1e6 : bd,
      nearR: br,
      rocks: n,
      shipR: this.r,
      canFire: this.cool <= 0 ? 1 : 0,
      dead: this.dead ? 1 : 0,
      fieldW: this.W,
      fieldH: this.H,
    };
  }

  /** Sarmalı alanda en kısa mesafe bileşeni. */
  private wrapD(d: number, size: number): number {
    if (d > size / 2) return d - size;
    if (d < -size / 2) return d + size;
    return d;
  }

  update(dt: number) {
    const it = this.o.input.poll(this.snapshot());

    if (this.dead) {
      this.deadFor += dt;
      if (this.deadFor > 1) this.respawn();
      return;
    }
    if (this.safe > 0) this.safe -= dt;

    // Klavye: sol/sağ döndürür. Dokunma: gemi parmağa döner.
    if (it.pointer) {
      const tx = it.pointer.x * this.W;
      const ty = it.pointer.y * this.H;
      const want = Math.atan2(this.wrapD(ty - this.y, this.H), this.wrapD(tx - this.x, this.W));
      let d = want - this.a;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.a += Math.max(-this.turnRate * dt, Math.min(this.turnRate * dt, d));
    } else if (it.ax !== 0) {
      this.a += it.ax * this.turnRate * dt;
    }

    this.thrusting = it.ay < 0 || (it.action && !!it.pointer);
    if (this.thrusting) {
      this.vx += Math.cos(this.a) * this.thrustPow * dt;
      this.vy += Math.sin(this.a) * this.thrustPow * dt;
    }
    // Sürtünme olmadan gemi kontrolden çıkıyor; klasik davranıştan bilinçli sapma.
    this.vx -= this.vx * this.drag * dt;
    this.vy -= this.vy * this.drag * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.wrapShip();

    this.cool -= dt;
    if (it.action && this.cool <= 0) {
      const b = this.bullets.find((v) => !v.live);
      if (b) {
        const sp = Math.min(this.W, this.H) * 1.05;
        b.x = this.x + Math.cos(this.a) * this.r;
        b.y = this.y + Math.sin(this.a) * this.r;
        b.vx = this.vx * 0.3 + Math.cos(this.a) * sp;
        b.vy = this.vy * 0.3 + Math.sin(this.a) * sp;
        b.t = 0;
        b.live = true;
        this.cool = 0.22;
      }
    }

    for (const b of this.bullets) {
      if (!b.live) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      this.wrap(b);
      b.t += dt;
      if (b.t > 0.85) {
        b.live = false;
        continue;
      }
      for (const k of this.rocks) {
        if (!k.live) continue;
        if (Math.hypot(this.wrapD(k.x - b.x, this.W), this.wrapD(k.y - b.y, this.H)) < k.r) {
          b.live = false;
          this.split(k);
          break;
        }
      }
    }

    for (const k of this.rocks) {
      if (!k.live) continue;
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.a += k.spin * dt;
      this.wrap(k);
      if (this.safe > 0) continue;
      const d = Math.hypot(this.wrapD(k.x - this.x, this.W), this.wrapD(k.y - this.y, this.H));
      if (d < k.r + this.r * 0.7) return this.die();
    }

    if (!this.rocks.some((k) => k.live)) {
      this.wave++;
      if (this.o.mode !== 'demo') this.o.events.levelUp(this.wave);
      this.rocks = this.rocks.filter((k) => k.live);
      this.spawnWave();
    }
  }

  private split(k: Rock) {
    k.live = false;
    this.score += k.size * 20;
    if (this.o.mode !== 'demo') this.o.events.score(this.score);
    if (k.size <= 1) return;
    for (let i = 0; i < 2; i++) {
      const ang = Math.atan2(k.vy, k.vx) + (i ? 0.7 : -0.7) + (this.o.rng() - 0.5) * 0.4;
      const sp = Math.hypot(k.vx, k.vy) * 1.25;
      this.rocks.push({
        x: k.x,
        y: k.y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: k.r * 0.58,
        size: k.size - 1,
        live: true,
        spin: (this.o.rng() - 0.5) * 2.4,
        a: this.o.rng() * Math.PI * 2,
      });
    }
  }

  private die() {
    this.dead = true;
    this.deadFor = 0;
    if (this.o.mode !== 'demo') this.o.events.gameOver(this.score);
    if (this.o.mode !== 'demo') {
      this.score = 0;
      this.wave = 1;
      this.rocks = [];
      this.spawnWave();
    }
  }

  render() {
    const { ctx, palette } = this.o;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, this.W, this.H);

    // Kayalar: düzgün çokgen değil, köşeleri kaydırılmış — daire gibi durmasın.
    ctx.strokeStyle = palette.dim;
    ctx.lineWidth = Math.max(0.8, this.r * 0.22);
    for (const k of this.rocks) {
      if (!k.live) continue;
      ctx.beginPath();
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * Math.PI * 2 + k.a;
        const rr = k.r * (0.78 + 0.22 * Math.abs(Math.sin(i * 2.1 + k.size)));
        const px = k.x + Math.cos(t) * rr;
        const py = k.y + Math.sin(t) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.fillStyle = palette.fg;
    for (const b of this.bullets) {
      if (!b.live) continue;
      ctx.beginPath();
      ctx.arc(b.x, b.y, this.r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.dead) return;
    if (this.safe > 0 && Math.floor(this.safe * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);
    ctx.beginPath();
    ctx.moveTo(this.r, 0);
    ctx.lineTo(-this.r * 0.7, this.r * 0.68);
    ctx.lineTo(-this.r * 0.35, 0);
    ctx.lineTo(-this.r * 0.7, -this.r * 0.68);
    ctx.closePath();
    ctx.fill();
    if (this.thrusting) {
      ctx.beginPath();
      ctx.moveTo(-this.r * 0.45, this.r * 0.3);
      ctx.lineTo(-this.r * 1.15, 0);
      ctx.lineTo(-this.r * 0.45, -this.r * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  destroy() {
    this.rocks = [];
    this.bullets = [];
  }
}
