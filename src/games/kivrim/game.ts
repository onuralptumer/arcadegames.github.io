import type { Dir, Game, GameInit, Snapshot } from '../../engine/types.js';

const DELTA: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export class Kivrim implements Game {
  private o!: GameInit;
  private cols = 0;
  private rows = 0;
  private cell = 0;

  private body: number[] = []; // paketlenmiş y*cols+x, baş = son eleman
  private occupied = new Set<number>();
  private dir: Dir = 'right';
  private queued: Dir | null = null;
  private food = 0;
  private score = 0;

  /** Yılan sabit tempoda ilerler; tick hızından bağımsız olsun diye biriktirici. */
  private acc = 0;
  private step = 0;

  init(o: GameInit) {
    this.o = o;
    // Hücre sayısını alandan türet: kart da oyun sayfası da aynı kodu kullanır.
    this.cols = o.mode === 'demo' ? 26 : 20;
    this.cell = o.field.w / this.cols;
    this.rows = Math.max(6, Math.floor(o.field.h / this.cell));
    this.step = o.mode === 'demo' ? 0.1 : 0.11;
    this.reset();
  }

  private reset() {
    const cy = Math.floor(this.rows / 2);
    const cx = Math.floor(this.cols / 4);
    this.body = [];
    this.occupied.clear();
    for (let i = 0; i < 4; i++) this.push(this.pack(cx + i, cy));
    this.dir = 'right';
    this.queued = null;
    this.score = 0;
    this.acc = 0;
    this.placeFood();
  }

  private pack(x: number, y: number) {
    return y * this.cols + x;
  }
  private px(v: number) {
    return v % this.cols;
  }
  private py(v: number) {
    return (v / this.cols) | 0;
  }

  private push(v: number) {
    this.body.push(v);
    this.occupied.add(v);
  }

  private placeFood() {
    // Boş hücre sayısı azaldığında rastgele deneme kötüleşir; küçük tahtada
    // deneme sayısını sınırlayıp taramaya düşüyoruz.
    const total = this.cols * this.rows;
    for (let i = 0; i < 60; i++) {
      const v = Math.floor(this.o.rng() * total);
      if (!this.occupied.has(v)) {
        this.food = v;
        return;
      }
    }
    for (let v = 0; v < total; v++) {
      if (!this.occupied.has(v)) {
        this.food = v;
        return;
      }
    }
  }

  snapshot(): Snapshot {
    const head = this.body[this.body.length - 1];
    return {
      headX: this.px(head),
      headY: this.py(head),
      foodX: this.px(this.food),
      foodY: this.py(this.food),
      cols: this.cols,
      rows: this.rows,
      len: this.body.length,
      dirX: DELTA[this.dir][0],
      dirY: DELTA[this.dir][1],
      // Bot çarpışma kontrolü için: dört komşunun boş olup olmadığı.
      freeUp: this.free(head, 'up'),
      freeDown: this.free(head, 'down'),
      freeLeft: this.free(head, 'left'),
      freeRight: this.free(head, 'right'),
    };
  }

  private free(from: number, d: Dir): number {
    const x = this.px(from) + DELTA[d][0];
    const y = this.py(from) + DELTA[d][1];
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return 0;
    const v = this.pack(x, y);
    // Kuyruk ucu bu adımda boşalacağı için engel sayılmaz.
    if (v === this.body[0]) return 1;
    return this.occupied.has(v) ? 0 : 1;
  }

  update(dt: number) {
    const it = this.o.input.poll(this.snapshot());
    if (it.dir && it.dir !== OPPOSITE[this.dir]) this.queued = it.dir;

    this.acc += dt;
    if (this.acc < this.step) return;
    this.acc -= this.step;

    if (this.queued) {
      this.dir = this.queued;
      this.queued = null;
    }

    const head = this.body[this.body.length - 1];
    const nx = this.px(head) + DELTA[this.dir][0];
    const ny = this.py(head) + DELTA[this.dir][1];

    if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) return this.die();
    const next = this.pack(nx, ny);
    const tail = this.body[0];
    if (this.occupied.has(next) && next !== tail) return this.die();

    const ate = next === this.food;
    if (!ate) {
      this.occupied.delete(this.body.shift()!);
    }
    this.push(next);

    if (ate) {
      this.score += 10;
      if (this.o.mode !== 'demo') this.o.events.score(this.score);
      this.placeFood();
    }
  }

  private die() {
    if (this.o.mode !== 'demo') this.o.events.gameOver(this.score);
    this.reset();
  }

  render() {
    const { ctx, palette } = this.o;
    const c = this.cell;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, this.o.field.w, this.o.field.h);

    const pad = c * 0.14;
    const s = c - pad * 2;

    // Gövde sönük tonda, baş ve yem tam tonda — iki renk, üç değil.
    ctx.fillStyle = palette.dim;
    for (let i = 0; i < this.body.length - 1; i++) {
      const v = this.body[i];
      ctx.fillRect(this.px(v) * c + pad, this.py(v) * c + pad, s, s);
    }

    ctx.fillStyle = palette.fg;
    const h = this.body[this.body.length - 1];
    ctx.fillRect(this.px(h) * c + pad, this.py(h) * c + pad, s, s);

    const fx = this.px(this.food) * c + c / 2;
    const fy = this.py(this.food) * c + c / 2;
    ctx.beginPath();
    ctx.arc(fx, fy, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  destroy() {
    this.body = [];
    this.occupied.clear();
  }
}
