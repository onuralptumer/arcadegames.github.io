import type { Game, GameInit, Snapshot } from '../../engine/types.js';

interface Enemy {
  x: number;
  y: number;
  alive: boolean;
}

interface Shot {
  x: number;
  y: number;
  vy: number;
  live: boolean;
}

export class Nobet implements Game {
  private o!: GameInit;
  private W = 0;
  private H = 0;

  private px = 0;
  private ppx = 0;
  private pw = 0;
  private ph = 0;
  private py = 0;
  private speed = 0;

  private enemies: Enemy[] = [];
  private cols = 0;
  private rows = 0;
  private ew = 0;
  private eh = 0;
  private edir = 1;
  private espeed = 0;
  private baseSpeed = 0;

  // Mermiler havuzdan gelir; her atışta nesne üretmek çöp toplayıcıyı çalıştırır.
  private shots: Shot[] = [];
  private bombs: Shot[] = [];
  private cool = 0;
  private fireEvery = 0;
  private bombEvery = 0;
  private bombT = 0;

  private wave = 1;
  private score = 0;

  init(o: GameInit) {
    this.o = o;
    this.W = o.field.w;
    this.H = o.field.h;

    this.pw = this.W * 0.09;
    this.ph = Math.max(2, this.H * 0.03);
    this.py = this.H - this.H * 0.09;
    this.px = this.ppx = this.W / 2;
    this.speed = this.W * 0.95;

    // Kart yatay: orada daha çok sütun, daha az satır iyi görünüyor.
    this.cols = o.mode === 'demo' ? 9 : 7;
    this.rows = o.mode === 'demo' ? 2 : 4;
    this.ew = this.W * 0.062;
    this.eh = this.H * (o.mode === 'demo' ? 0.1 : 0.05);
    this.baseSpeed = this.W * (o.mode === 'demo' ? 0.16 : 0.11);

    // Atis hizi ile bomba sikligi birlikte ayarlanir: dalga ~28 dusman,
    // saniyede 3.5 atisla en az 8 saniye surer; bombalar o sureyi asmali.
    this.fireEvery = 0.28;
    this.bombEvery = o.mode === 'demo' ? 1.5 : 1.9;

    for (let i = 0; i < 24; i++) this.shots.push({ x: 0, y: 0, vy: 0, live: false });
    for (let i = 0; i < 16; i++) this.bombs.push({ x: 0, y: 0, vy: 0, live: false });

    this.reset();
  }

  private reset() {
    this.wave = 1;
    this.score = 0;
    for (const s of this.shots) s.live = false;
    for (const b of this.bombs) b.live = false;
    this.spawnWave();
  }

  private spawnWave() {
    this.enemies = [];
    const gapX = this.W * 0.03;
    const totalW = this.cols * this.ew + (this.cols - 1) * gapX;
    const left = (this.W - totalW) / 2;
    const top = this.H * 0.1;
    const gapY = this.eh * 0.5;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.enemies.push({
          x: left + c * (this.ew + gapX),
          y: top + r * (this.eh + gapY),
          alive: true,
        });
      }
    }
    this.edir = 1;
    this.espeed = this.baseSpeed * (1 + (this.wave - 1) * 0.18);
  }

  private alive(): number {
    let n = 0;
    for (const e of this.enemies) if (e.alive) n++;
    return n;
  }

  snapshot(): Snapshot {
    // Bot için: en alttaki canlı düşmanın konumu ve en yakın bombanın durumu.
    let tx = this.W / 2;
    let ty = -1;
    for (const e of this.enemies) {
      if (e.alive && e.y > ty) {
        ty = e.y;
        tx = e.x + this.ew / 2;
      }
    }
    let bx = -1;
    let by = -1;
    for (const b of this.bombs) {
      if (b.live && b.y > by) {
        by = b.y;
        bx = b.x;
      }
    }
    return {
      px: this.px,
      targetX: tx,
      targetY: ty,
      bombX: bx,
      bombY: by,
      fieldW: this.W,
      fieldH: this.H,
      playerY: this.py,
      canFire: this.cool <= 0 ? 1 : 0,
      alive: this.alive(),
    };
  }

  update(dt: number) {
    const it = this.o.input.poll(this.snapshot());

    this.ppx = this.px;
    const half = this.pw / 2;
    if (it.pointer) {
      const t = it.pointer.x * this.W;
      this.px += (t - this.px) * (1 - Math.exp(-14 * dt));
    } else if (it.ax !== 0) {
      this.px += it.ax * this.speed * dt;
    }
    this.px = Math.max(half, Math.min(this.W - half, this.px));

    this.cool -= dt;
    if (it.action && this.cool <= 0) {
      const s = this.shots.find((v) => !v.live);
      if (s) {
        s.x = this.px;
        s.y = this.py;
        s.vy = -this.H * 1.35;
        s.live = true;
        this.cool = this.fireEvery;
      }
    }

    // Düşman kümesi kenara değince aşağı iner ve yön değiştirir.
    let hitEdge = false;
    const step = this.espeed * (1 + (1 - this.alive() / (this.cols * this.rows)) * 1.6);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.x += this.edir * step * dt;
      if (e.x < 0 || e.x + this.ew > this.W) hitEdge = true;
    }
    if (hitEdge) {
      this.edir *= -1;
      for (const e of this.enemies) if (e.alive) e.y += this.eh * 0.55;
    }

    this.bombT -= dt;
    if (this.bombT <= 0) {
      this.bombT = this.bombEvery * (0.6 + this.o.rng() * 0.8);
      this.dropBomb();
    }

    for (const s of this.shots) {
      if (!s.live) continue;
      s.y += s.vy * dt;
      if (s.y < 0) {
        s.live = false;
        continue;
      }
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (s.x > e.x && s.x < e.x + this.ew && s.y > e.y && s.y < e.y + this.eh) {
          e.alive = false;
          s.live = false;
          this.score += 10 * this.wave;
          if (this.o.mode !== 'demo') this.o.events.score(this.score);
          break;
        }
      }
    }

    for (const b of this.bombs) {
      if (!b.live) continue;
      b.y += b.vy * dt;
      if (b.y > this.H) {
        b.live = false;
        continue;
      }
      if (
        b.y > this.py &&
        b.y < this.py + this.ph * 2 &&
        Math.abs(b.x - this.px) < half
      ) {
        b.live = false;
        return this.die();
      }
    }

    for (const e of this.enemies) {
      if (e.alive && e.y + this.eh >= this.py) return this.die();
    }

    if (this.alive() === 0) {
      this.wave++;
      if (this.o.mode !== 'demo') this.o.events.levelUp(this.wave);
      this.spawnWave();
    }
  }

  private dropBomb() {
    // Yalnızca sütununun en altındaki düşman bomba atar.
    const lowest = new Map<number, Enemy>();
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const k = Math.round(e.x / (this.ew * 0.5));
      const cur = lowest.get(k);
      if (!cur || e.y > cur.y) lowest.set(k, e);
    }
    const list = [...lowest.values()];
    if (!list.length) return;
    const src = list[Math.floor(this.o.rng() * list.length)];
    const b = this.bombs.find((v) => !v.live);
    if (!b) return;
    b.x = src.x + this.ew / 2;
    b.y = src.y + this.eh;
    b.vy = this.H * 0.5;
    b.live = true;
  }

  private die() {
    if (this.o.mode !== 'demo') this.o.events.gameOver(this.score);
    this.reset();
  }

  render(alpha: number) {
    const { ctx, palette } = this.o;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.fillStyle = palette.dim;
    for (const e of this.enemies) {
      if (e.alive) ctx.fillRect(e.x, e.y, this.ew, this.eh);
    }
    for (const b of this.bombs) {
      if (b.live) ctx.fillRect(b.x - this.W * 0.006, b.y, this.W * 0.012, this.H * 0.028);
    }

    ctx.fillStyle = palette.fg;
    const x = this.ppx + (this.px - this.ppx) * alpha;
    // Gemi: gövde + burun. İki dikdörtgen, siluet olarak yeterli.
    ctx.fillRect(x - this.pw / 2, this.py, this.pw, this.ph);
    ctx.fillRect(x - this.pw * 0.13, this.py - this.ph * 0.8, this.pw * 0.26, this.ph * 0.8);
    for (const s of this.shots) {
      if (s.live) ctx.fillRect(s.x - this.W * 0.006, s.y, this.W * 0.012, this.H * 0.03);
    }
  }

  destroy() {
    this.enemies = [];
    this.shots = [];
    this.bombs = [];
  }
}
