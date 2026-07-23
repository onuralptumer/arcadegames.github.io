export class Sekme {
    o;
    W = 0;
    H = 0;
    x = 0;
    px = 0;
    y = 0;
    py = 0;
    vy = 0;
    r = 0;
    gravity = 0;
    bounce = 0;
    moveSpeed = 0;
    plats = [];
    platW = 0;
    platH = 0;
    spacing = 0;
    highest = 0;
    climbed = 0;
    score = 0;
    dead = false;
    deadFor = 0;
    init(o) {
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
    reset() {
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
        while (this.highest > -this.spacing)
            this.addPlat();
    }
    addPlat() {
        this.highest -= this.spacing * (0.75 + this.o.rng() * 0.5);
        const w = this.platW * (0.75 + this.o.rng() * 0.5);
        this.plats.push({ x: this.o.rng() * (this.W - w), y: this.highest, w });
    }
    snapshot() {
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
        if (by === 1e9)
            by = -1e9;
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
    update(dt) {
        const it = this.o.input.poll(this.snapshot());
        if (this.dead) {
            this.deadFor += dt;
            if (this.deadFor > (this.o.mode === 'demo' ? 0.7 : 1.1))
                this.reset();
            return;
        }
        this.px = this.x;
        if (it.pointer) {
            const t = it.pointer.x * this.W;
            this.x += (t - this.x) * (1 - Math.exp(-13 * dt));
        }
        else if (it.ax !== 0) {
            this.x += it.ax * this.moveSpeed * dt;
        }
        // Kenardan çıkınca öbür taraftan girer; köşeye sıkışmayı önlüyor.
        if (this.x < -this.r)
            this.x = this.W + this.r;
        else if (this.x > this.W + this.r)
            this.x = -this.r;
        this.py = this.y;
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;
        // Yalnızca düşerken ve platformun üstünden geçerken sekme olur.
        if (this.vy > 0) {
            for (const p of this.plats) {
                if (this.py + this.r <= p.y &&
                    this.y + this.r >= p.y &&
                    this.x > p.x - this.r * 0.5 &&
                    this.x < p.x + p.w + this.r * 0.5) {
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
            for (const p of this.plats)
                p.y += d;
            this.highest += d;
            while (this.highest > -this.spacing)
                this.addPlat();
            this.plats = this.plats.filter((p) => p.y < this.H + this.spacing);
            const s = Math.floor(this.climbed / this.H * 10);
            if (s > this.score) {
                this.score = s;
                if (this.o.mode !== 'demo')
                    this.o.events.score(this.score);
            }
        }
        if (this.y - this.r > this.H) {
            this.dead = true;
            this.deadFor = 0;
            if (this.o.mode !== 'demo')
                this.o.events.gameOver(this.score);
        }
    }
    render(alpha) {
        const { ctx, palette } = this.o;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, this.W, this.H);
        ctx.fillStyle = palette.dim;
        for (const p of this.plats) {
            if (p.y > -this.platH && p.y < this.H)
                ctx.fillRect(p.x, p.y, p.w, this.platH);
        }
        if (this.dead)
            return;
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
//# sourceMappingURL=game.js.map