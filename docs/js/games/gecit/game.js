export class Gecit {
    o;
    cols = 0;
    rows = 0;
    cell = 0;
    ox = 0;
    oy = 0;
    lanes = [];
    px = 0;
    py = 0;
    score = 0;
    level = 1;
    /** Ölüm sonrası kısa duraklama; anında ışınlanmak okunmuyor. */
    stun = 0;
    init(o) {
        this.o = o;
        // Hücre kare kalsın diye alandan türetilir, sonra ortalanır.
        this.cols = o.mode === 'demo' ? 17 : 11;
        this.rows = o.mode === 'demo' ? 7 : 11;
        this.cell = Math.min(o.field.w / this.cols, o.field.h / this.rows);
        this.ox = (o.field.w - this.cols * this.cell) / 2;
        this.oy = (o.field.h - this.rows * this.cell) / 2;
        this.reset(true);
    }
    reset(full) {
        if (full) {
            this.score = 0;
            this.level = 1;
        }
        this.px = Math.floor(this.cols / 2);
        this.py = this.rows - 1;
        this.stun = 0;
        if (full)
            this.buildLanes();
    }
    buildLanes() {
        this.lanes = [];
        // En üst ve en alt satır güvenli; aradakiler trafik.
        for (let y = 1; y < this.rows - 1; y++) {
            const dir = y % 2 === 0 ? 1 : -1;
            const len = 1 + (this.o.rng() < 0.35 ? 1 : 0);
            // Seviye artisi hafif: 9 seride birlesince kucuk carpanlar bile hizla sertlesiyor.
            const speed = (0.9 + this.o.rng() * 1.2) * (1 + (this.level - 1) * 0.07);
            const items = [];
            const gap = len + 3 + Math.floor(this.o.rng() * 3);
            for (let x = 0; x < this.cols; x += gap)
                items.push(x + this.o.rng());
            this.lanes.push({ y, dir, speed, items, len });
        }
    }
    snapshot() {
        const s = {
            px: this.px,
            py: this.py,
            cols: this.cols,
            rows: this.rows,
            score: this.score,
            stun: this.stun > 0 ? 1 : 0,
        };
        /*
         * Anlik doluluk yetmiyor: arabalar surekli hareket ettigi icin bos gorunen
         * hucreye adim atarken araba icine giriyor. Bot'a "bu hucre kac saniye daha
         * guvenli" bilgisini veriyoruz.
         */
        s.safeHere = this.safeAt(this.px, this.py);
        s.safeUp = this.safeAt(this.px, this.py - 1);
        s.safeDown = this.safeAt(this.px, this.py + 1);
        s.safeLeft = this.safeAt(this.px - 1, this.py);
        s.safeRight = this.safeAt(this.px + 1, this.py);
        return s;
    }
    /** Herhangi bir hücrenin güvenli kalma süresi. Güvenli satırlarda sonsuz. */
    safeAt(x, y) {
        if (y < 0 || y >= this.rows)
            return 0;
        if (x < 0 || x >= this.cols)
            return 0;
        const l = this.lanes.find((v) => v.y === y);
        if (!l)
            return 99;
        return this.safeFor(l, x);
    }
    /** Bu sütun kaç saniye daha boş kalır. Doluysa 0. */
    safeFor(l, col) {
        if (this.occupied(l, col))
            return 0;
        const lo = col + 0.25 - l.len;
        const hi = col + 0.75;
        let best = 99;
        for (const x of l.items) {
            // Araç bu aralığa girene kadar geçen süre.
            const d = l.dir > 0 ? lo - x : x - hi;
            const t = d >= 0 ? d / l.speed : (d + this.cols + l.len) / l.speed;
            if (t < best)
                best = t;
        }
        return best;
    }
    occupied(l, col) {
        for (const x of l.items) {
            if (col + 0.75 > x && col + 0.25 < x + l.len)
                return true;
        }
        return false;
    }
    update(dt) {
        if (this.stun > 0) {
            this.stun -= dt;
            if (this.stun <= 0)
                this.reset(false);
            return;
        }
        const it = this.o.input.poll(this.snapshot());
        if (it.dir === 'up' && this.py > 0)
            this.py--;
        else if (it.dir === 'down' && this.py < this.rows - 1)
            this.py++;
        else if (it.dir === 'left' && this.px > 0)
            this.px--;
        else if (it.dir === 'right' && this.px < this.cols - 1)
            this.px++;
        for (const l of this.lanes) {
            for (let i = 0; i < l.items.length; i++) {
                l.items[i] += l.dir * l.speed * dt;
                if (l.dir > 0 && l.items[i] > this.cols)
                    l.items[i] = -l.len;
                else if (l.dir < 0 && l.items[i] < -l.len)
                    l.items[i] = this.cols;
            }
            if (l.y === this.py && this.occupied(l, this.px))
                return this.die();
        }
        if (this.py === 0) {
            this.score += 100 * this.level;
            this.level++;
            if (this.o.mode !== 'demo') {
                this.o.events.score(this.score);
                this.o.events.levelUp(this.level);
            }
            this.buildLanes();
            this.reset(false);
        }
    }
    die() {
        if (this.o.mode === 'demo') {
            this.stun = 0.4;
            return;
        }
        this.o.events.gameOver(this.score);
        this.reset(true);
    }
    render() {
        const { ctx, palette } = this.o;
        const c = this.cell;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, this.o.field.w, this.o.field.h);
        // Güvenli satırlar hafif bir bantla işaretli: nereye kaçacağını görmek gerekiyor.
        ctx.fillStyle = palette.dim;
        ctx.globalAlpha = 0.25;
        for (const y of [0, this.rows - 1]) {
            ctx.fillRect(this.ox, this.oy + y * c, this.cols * c, c);
        }
        ctx.globalAlpha = 1;
        const pad = c * 0.1;
        for (const l of this.lanes) {
            for (const x of l.items) {
                ctx.fillRect(this.ox + x * c + pad, this.oy + l.y * c + pad, l.len * c - pad * 2, c - pad * 2);
            }
        }
        if (this.stun > 0 && Math.floor(this.stun * 12) % 2 === 0)
            return;
        ctx.fillStyle = palette.fg;
        const s = c - pad * 2.4;
        ctx.beginPath();
        ctx.arc(this.ox + this.px * c + c / 2, this.oy + this.py * c + c / 2, s / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    destroy() {
        this.lanes = [];
    }
}
//# sourceMappingURL=game.js.map