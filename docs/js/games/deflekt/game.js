import { DEMO_PATTERN, LEVELS } from './levels.js?v=51ac2eb329';
const COLS = 10;
export class Deflekt {
    o;
    W = 0;
    H = 0;
    bricks = [];
    padX = 0;
    padPX = 0;
    padW = 0;
    padH = 0;
    padY = 0;
    padSpeed = 0;
    bx = 0;
    by = 0;
    bpx = 0;
    bpy = 0;
    vx = 0;
    vy = 0;
    r = 0;
    speed = 0;
    baseSpeed = 0;
    launched = false;
    level = 0;
    score = 0;
    lives = 3;
    init(o) {
        this.o = o;
        this.W = o.field.w;
        this.H = o.field.h;
        this.padW = this.W * 0.16;
        this.padH = Math.max(1.5, this.H * 0.022);
        this.padY = this.H - this.H * 0.07;
        this.padSpeed = this.W * 1.3;
        this.padX = this.padPX = this.W / 2;
        this.r = Math.max(1.2, this.W * 0.013);
        // Demo alanı alçak: aynı hız orada yavaş görünür.
        this.baseSpeed = this.H * (o.mode === 'demo' ? 0.74 : 0.62);
        this.loadLevel(0);
    }
    pattern() {
        return this.o.mode === 'demo' ? DEMO_PATTERN : LEVELS[this.level % LEVELS.length];
    }
    loadLevel(level) {
        this.level = level;
        const rows = this.pattern();
        const margin = this.W * 0.03;
        const bw = (this.W - margin * 2) / COLS;
        // Kart yüksekliği küçük olduğu için önizlemede tuğlalar kalınlaşır,
        // yoksa kartın üst çeyreğinde sıkışıp kalır ve kart boş görünür.
        const bh = this.H * (this.o.mode === 'demo' ? 0.078 : 0.055);
        const top = this.H * 0.09;
        const gap = Math.min(bw, bh) * 0.12;
        this.bricks = [];
        for (let ry = 0; ry < rows.length; ry++) {
            for (let cx = 0; cx < COLS; cx++) {
                const ch = rows[ry][cx];
                if (ch !== '1' && ch !== '2')
                    continue;
                this.bricks.push({
                    x: margin + cx * bw + gap / 2,
                    y: top + ry * bh + gap / 2,
                    w: bw - gap,
                    h: bh - gap,
                    hp: ch === '2' ? 2 : 1,
                });
            }
        }
        this.resetBall();
    }
    resetBall() {
        this.launched = false;
        this.speed = this.baseSpeed;
        this.bx = this.bpx = this.padX;
        this.by = this.bpy = this.padY - this.r * 1.6;
        this.vx = 0;
        this.vy = 0;
    }
    launch() {
        const spread = (this.o.rng() - 0.5) * 0.7;
        this.vx = Math.sin(spread) * this.speed;
        this.vy = -Math.cos(spread) * this.speed;
        this.launched = true;
    }
    snapshot() {
        return {
            ballX: this.bx,
            ballY: this.by,
            ballVX: this.vx,
            ballVY: this.vy,
            padX: this.padX,
            padW: this.padW,
            padY: this.padY,
            fieldW: this.W,
            fieldH: this.H,
            launched: this.launched ? 1 : 0,
        };
    }
    update(dt) {
        const it = this.o.input.poll(this.snapshot());
        const half = this.padW / 2;
        this.padPX = this.padX;
        if (it.pointer) {
            const target = it.pointer.x * this.W;
            // Kare hızından bağımsız yumuşatma: dt*k kullanırsan 20 tick demo ile
            // 60 tick oyun farklı hissettirir.
            this.padX += (target - this.padX) * (1 - Math.exp(-12 * dt));
        }
        else if (it.ax !== 0) {
            this.padX += it.ax * this.padSpeed * dt;
        }
        this.padX = Math.max(half, Math.min(this.W - half, this.padX));
        if (!this.launched) {
            this.bpx = this.bx;
            this.bpy = this.by;
            this.bx = this.padX;
            this.by = this.padY - this.r * 1.6;
            if (it.action || this.o.mode === 'demo')
                this.launch();
            return;
        }
        this.bpx = this.bx;
        this.bpy = this.by;
        this.bx += this.vx * dt;
        this.by += this.vy * dt;
        if (this.bx < this.r) {
            this.bx = this.r;
            this.vx = Math.abs(this.vx);
        }
        else if (this.bx > this.W - this.r) {
            this.bx = this.W - this.r;
            this.vx = -Math.abs(this.vx);
        }
        if (this.by < this.r) {
            this.by = this.r;
            this.vy = Math.abs(this.vy);
        }
        if (this.vy > 0 &&
            this.by + this.r >= this.padY &&
            this.by - this.r <= this.padY + this.padH &&
            this.bx >= this.padX - half - this.r &&
            this.bx <= this.padX + half + this.r) {
            const t = Math.max(-1, Math.min(1, (this.bx - this.padX) / half));
            const angle = t * 1.05;
            this.speed = Math.min(this.speed * 1.015, this.baseSpeed * 1.7);
            this.vx = Math.sin(angle) * this.speed;
            this.vy = -Math.cos(angle) * this.speed;
            this.by = this.padY - this.r;
        }
        this.hitBricks();
        if (this.by - this.r > this.H) {
            if (this.o.mode === 'demo') {
                this.resetBall();
            }
            else {
                this.lives--;
                if (this.lives <= 0) {
                    this.o.events.gameOver(this.score);
                    this.lives = 3;
                    this.score = 0;
                    this.loadLevel(0);
                }
                else {
                    this.resetBall();
                }
            }
        }
    }
    hitBricks() {
        for (let i = 0; i < this.bricks.length; i++) {
            const b = this.bricks[i];
            if (this.bx + this.r < b.x ||
                this.bx - this.r > b.x + b.w ||
                this.by + this.r < b.y ||
                this.by - this.r > b.y + b.h)
                continue;
            // Hangi eksenden girdiğini örtüşme derinliğinden bul.
            const ox = this.vx > 0 ? this.bx + this.r - b.x : b.x + b.w - (this.bx - this.r);
            const oy = this.vy > 0 ? this.by + this.r - b.y : b.y + b.h - (this.by - this.r);
            if (ox < oy)
                this.vx = -this.vx;
            else
                this.vy = -this.vy;
            b.hp--;
            if (b.hp <= 0) {
                this.bricks.splice(i, 1);
                this.score += 10;
            }
            else {
                this.score += 5;
            }
            if (this.o.mode !== 'demo')
                this.o.events.score(this.score);
            if (this.bricks.length === 0) {
                const next = this.level + 1;
                if (this.o.mode !== 'demo')
                    this.o.events.levelUp(next + 1);
                this.loadLevel(next);
            }
            return;
        }
    }
    render(alpha) {
        const { ctx, palette } = this.o;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, this.W, this.H);
        // İki tonlu: sağlam tuğla fg, çatlak tuğla dim. Üçüncü renk yok.
        ctx.fillStyle = palette.fg;
        for (const b of this.bricks)
            if (b.hp <= 1)
                ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = palette.dim;
        for (const b of this.bricks)
            if (b.hp > 1)
                ctx.fillRect(b.x, b.y, b.w, b.h);
        const px = this.padPX + (this.padX - this.padPX) * alpha;
        const bx = this.bpx + (this.bx - this.bpx) * alpha;
        const by = this.bpy + (this.by - this.bpy) * alpha;
        ctx.fillStyle = palette.fg;
        ctx.fillRect(px - this.padW / 2, this.padY, this.padW, this.padH);
        ctx.beginPath();
        ctx.arc(bx, by, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
    destroy() {
        this.bricks = [];
    }
}
//# sourceMappingURL=game.js.map