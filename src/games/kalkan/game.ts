import type { Game, GameInit, Snapshot } from '../../engine/types.js';

interface Missile {
  x: number;
  y: number;
  tx: number;
  vx: number;
  vy: number;
  live: boolean;
}

interface Blast {
  x: number;
  y: number;
  t: number;
  live: boolean;
}

/** Patlamanın büyüyüp sönme süresi (saniye). */
const BLAST_LIFE = 0.75;

export class Kalkan implements Game {
  private o!: GameInit;
  private W = 0;
  private H = 0;

  private bases: { x: number; alive: boolean }[] = [];
  private baseW = 0;
  private baseH = 0;
  private groundY = 0;

  private missiles: Missile[] = [];
  private blasts: Blast[] = [];
  private maxR = 0;

  private wave = 1;
  private toSpawn = 0;
  private spawnT = 0;
  private spawnEvery = 0;
  private score = 0;
  private cool = 0;
  private speed = 0;

  init(o: GameInit) {
    this.o = o;
    this.W = o.field.w;
    this.H = o.field.h;

    this.groundY = this.H * 0.9;
    this.baseW = this.W * 0.075;
    this.baseH = this.H * 0.07;
    // Yaricap cok genis olunca nisan almanin onemi kalmiyor: her atis her seyi
    // vuruyor ve oyun kaybedilemez hale geliyor. Dar tutulmali.
    this.maxR = this.W * 0.068;

    for (let i = 0; i < 30; i++)
      this.missiles.push({ x: 0, y: 0, tx: 0, vx: 0, vy: 0, live: false });
    for (let i = 0; i < 14; i++) this.blasts.push({ x: 0, y: 0, t: 0, live: false });

    this.reset();
  }

  private reset() {
    this.wave = 1;
    this.score = 0;
    this.bases = [];
    const n = this.o.mode === 'demo' ? 6 : 5;
    for (let i = 0; i < n; i++) {
      this.bases.push({ x: ((i + 0.5) / n) * this.W, alive: true });
    }
    for (const m of this.missiles) m.live = false;
    for (const b of this.blasts) b.live = false;
    this.startWave();
  }

  private startWave() {
    this.toSpawn = 6 + this.wave * 3;
    this.speed = this.H * (0.07 + this.wave * 0.016);
    this.spawnEvery = Math.max(0.22, 1.0 - this.wave * 0.075);
    this.spawnT = 0.3;
  }

  private launch() {
    const m = this.missiles.find((v) => !v.live);
    if (!m) return;
    const alive = this.bases.filter((b) => b.alive);
    if (!alive.length) return;
    const target = alive[Math.floor(this.o.rng() * alive.length)];
    m.x = this.o.rng() * this.W;
    m.y = 0;
    m.tx = target.x;
    const dx = m.tx - m.x;
    const dy = this.groundY;
    const len = Math.hypot(dx, dy);
    m.vx = (dx / len) * this.speed;
    m.vy = (dy / len) * this.speed;
    m.live = true;
  }

  snapshot(): Snapshot {
    // Bot için: en tehlikeli (en alçak) canlı füzenin konumu ve hızı.
    let bx = -1;
    let by = -1;
    let vx = 0;
    let vy = 0;
    let n = 0;
    for (const m of this.missiles) {
      if (!m.live) continue;
      n++;
      if (m.y > by) {
        by = m.y;
        bx = m.x;
        vx = m.vx;
        vy = m.vy;
      }
    }
    return {
      threatX: bx,
      threatY: by,
      threatVX: vx,
      threatVY: vy,
      threats: n,
      fieldW: this.W,
      fieldH: this.H,
      groundY: this.groundY,
      blastR: this.maxR,
      canFire: this.cool <= 0 ? 1 : 0,
      bases: this.bases.filter((b) => b.alive).length,
    };
  }

  private boom(x: number, y: number) {
    const b = this.blasts.find((v) => !v.live);
    if (!b) return;
    b.x = x;
    b.y = y;
    b.t = 0;
    b.live = true;
  }

  update(dt: number) {
    const it = this.o.input.poll(this.snapshot());

    this.cool -= dt;
    if (it.pressed && it.pointer && this.cool <= 0) {
      this.boom(it.pointer.x * this.W, it.pointer.y * this.H);
      this.cool = 0.34;
    }

    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.toSpawn > 0) {
      this.spawnT = this.spawnEvery * (0.6 + this.o.rng() * 0.8);
      this.toSpawn--;
      this.launch();
    }

    for (const b of this.blasts) {
      if (!b.live) continue;
      b.t += dt;
      if (b.t >= BLAST_LIFE) b.live = false;
    }

    for (const m of this.missiles) {
      if (!m.live) continue;
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      for (const b of this.blasts) {
        if (!b.live) continue;
        if (Math.hypot(m.x - b.x, m.y - b.y) < this.radius(b)) {
          m.live = false;
          this.score += 25;
          if (this.o.mode !== 'demo') this.o.events.score(this.score);
          // Zincirleme patlama daha kucuk; yoksa tek atis tum dalgayi siliyor.
          this.chain(m.x, m.y);
          break;
        }
      }
      if (!m.live) continue;

      if (m.y >= this.groundY) {
        m.live = false;
        this.boom(m.x, this.groundY);
        for (const base of this.bases) {
          if (base.alive && Math.abs(base.x - m.x) < this.baseW) base.alive = false;
        }
        if (!this.bases.some((b) => b.alive)) return this.die();
      }
    }

    const flying = this.missiles.some((m) => m.live);
    if (this.toSpawn === 0 && !flying) {
      this.wave++;
      this.score += 100;
      if (this.o.mode !== 'demo') {
        this.o.events.score(this.score);
        this.o.events.levelUp(this.wave);
      }
      // Uc dalgada bir tek us onarilir. Daha sik onarim oyunu bitmez hale getiriyor;
      // hic onarim olmamasi da kacinilmaz kayba dusuruyor.
      if (this.wave % 3 === 0) {
        const dead = this.bases.find((b) => !b.alive);
        if (dead) dead.alive = true;
      }
      this.startWave();
    }
  }

  /** Zincirleme patlama: normalin yarisi kadar. */
  private chain(x: number, y: number) {
    const b = this.blasts.find((v) => !v.live);
    if (!b) return;
    b.x = x;
    b.y = y;
    b.t = BLAST_LIFE * 0.45;
    b.live = true;
  }

  private radius(b: Blast): number {
    // Hızlı büyür, yavaş söner.
    const t = b.t / BLAST_LIFE;
    return this.maxR * (t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7);
  }

  private die() {
    if (this.o.mode !== 'demo') this.o.events.gameOver(this.score);
    this.reset();
  }

  render() {
    const { ctx, palette } = this.o;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.fillStyle = palette.dim;
    ctx.fillRect(0, this.groundY, this.W, this.H - this.groundY);
    for (const m of this.missiles) {
      if (!m.live) continue;
      // İz: geldiği yönde kısa bir çizgi. Nereye düşeceğini okumak gerekiyor.
      const len = this.H * 0.05;
      const n = Math.hypot(m.vx, m.vy) || 1;
      ctx.fillRect(m.x - this.W * 0.005, m.y - (m.vy / n) * len, this.W * 0.01, len);
    }

    ctx.fillStyle = palette.fg;
    for (const b of this.bases) {
      if (b.alive) ctx.fillRect(b.x - this.baseW / 2, this.groundY - this.baseH, this.baseW, this.baseH);
    }
    for (const b of this.blasts) {
      if (!b.live) continue;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(0, this.radius(b)), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  destroy() {
    this.missiles = [];
    this.blasts = [];
    this.bases = [];
  }
}
