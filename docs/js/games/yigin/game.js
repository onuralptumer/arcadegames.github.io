import { KICKS, PIECES, rotated } from './pieces.js?v=4fc8ef5321';
/** Yatay basılı tutmada ilk gecikme ve tekrar aralığı (saniye). */
const DAS = 0.17;
const ARR = 0.045;
export class Yigin {
    o;
    cols = 0;
    rows = 0;
    cell = 0;
    board;
    piece = 0;
    rot = 0;
    px = 0;
    py = 0;
    fall = 0;
    fallEvery = 0;
    dasT = 0;
    lastAx = 0;
    /** Her doğuşta artar. Bot yeni parçayı bundan anlar — py'ye bakmak
     *  guvenilir degil, sert dusurmede parca ayni tick icinde dogup dusuyor. */
    pieceId = 0;
    score = 0;
    lines = 0;
    level = 1;
    /** Satır temizlenince kısa bir duraklama; yoksa temizlik gözden kaçıyor. */
    flash = 0;
    flashRows = [];
    init(o) {
        this.o = o;
        // Kart yatay ve alçak: orada 10×20 tahta okunmaz, geniş ve basık tahta gerekir.
        this.cell = o.mode === 'demo' ? o.field.w / 20 : o.field.w / 10;
        this.cols = Math.round(o.field.w / this.cell);
        this.rows = Math.floor(o.field.h / this.cell);
        this.board = new Uint8Array(this.cols * this.rows);
        this.fallEvery = o.mode === 'demo' ? 0.11 : 0.55;
        this.reset();
    }
    reset() {
        this.board.fill(0);
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.flash = 0;
        this.flashRows = [];
        this.spawn();
    }
    spawn() {
        this.pieceId++;
        this.piece = Math.floor(this.o.rng() * PIECES.length);
        this.rot = 0;
        const p = PIECES[this.piece];
        this.px = Math.floor((this.cols - p.size) / 2);
        this.py = 0;
        this.fall = 0;
        if (this.collides(this.px, this.py, this.rot)) {
            if (this.o.mode !== 'demo')
                this.o.events.gameOver(this.score);
            this.reset();
        }
    }
    collides(px, py, rot) {
        for (const [cx, cy] of rotated(PIECES[this.piece], rot)) {
            const x = px + cx;
            const y = py + cy;
            if (x < 0 || x >= this.cols || y >= this.rows)
                return true;
            if (y >= 0 && this.board[y * this.cols + x])
                return true;
        }
        return false;
    }
    tryRotate() {
        const next = (this.rot + 1) % 4;
        for (const [kx, ky] of KICKS) {
            if (!this.collides(this.px + kx, this.py + ky, next)) {
                this.px += kx;
                this.py += ky;
                this.rot = next;
                return;
            }
        }
    }
    lock() {
        for (const [cx, cy] of rotated(PIECES[this.piece], this.rot)) {
            const y = this.py + cy;
            if (y >= 0)
                this.board[y * this.cols + this.px + cx] = 1;
        }
        this.clearLines();
        this.spawn();
    }
    clearLines() {
        const full = [];
        for (let y = 0; y < this.rows; y++) {
            let ok = true;
            for (let x = 0; x < this.cols; x++) {
                if (!this.board[y * this.cols + x]) {
                    ok = false;
                    break;
                }
            }
            if (ok)
                full.push(y);
        }
        if (!full.length)
            return;
        for (const y of full) {
            this.board.copyWithin(this.cols, 0, y * this.cols);
            this.board.fill(0, 0, this.cols);
        }
        this.lines += full.length;
        // Aynı anda çok satır daha çok puan: tek tek temizlemeyi cezalandırır.
        this.score += [0, 40, 100, 300, 1200][full.length] * this.level;
        const nextLevel = 1 + Math.floor(this.lines / 10);
        if (nextLevel > this.level) {
            this.level = nextLevel;
            this.fallEvery = Math.max(0.09, 0.55 * Math.pow(0.85, this.level - 1));
            if (this.o.mode !== 'demo')
                this.o.events.levelUp(this.level);
        }
        if (this.o.mode !== 'demo')
            this.o.events.score(this.score);
        this.flashRows = full;
        this.flash = 0.12;
    }
    hardDrop() {
        while (!this.collides(this.px, this.py + 1, this.rot))
            this.py++;
        this.lock();
    }
    snapshot() {
        return {
            cols: this.cols,
            rows: this.rows,
            piece: this.piece,
            pieceId: this.pieceId,
            rot: this.rot,
            px: this.px,
            py: this.py,
            score: this.score,
            // Bot tahtayı sütun yüksekliklerinden okur; tam tahtayı taşımaya gerek yok.
            ...this.profile(),
        };
    }
    /**
     * Snapshot yalnizca sayi tasiyabiliyor; tahtanin tamamini gecirmek yerine
     * sutun basina yukseklik (h*) ve delik sayisi (o*) veriliyor. Bot icin yeterli,
     * sozlesmeyi genisletmeye gerek birakmiyor.
     */
    profile() {
        const out = {};
        for (let x = 0; x < this.cols; x++) {
            let top = this.rows;
            for (let y = 0; y < this.rows; y++) {
                if (this.board[y * this.cols + x]) {
                    top = y;
                    break;
                }
            }
            let holes = 0;
            for (let y = top + 1; y < this.rows; y++) {
                if (!this.board[y * this.cols + x])
                    holes++;
            }
            out[`h${x}`] = this.rows - top;
            out[`o${x}`] = holes;
        }
        return out;
    }
    update(dt) {
        if (this.flash > 0) {
            this.flash -= dt;
            return;
        }
        const it = this.o.input.poll(this.snapshot());
        // Döndürme: yukarı ok, yukarı kaydırma veya dokunma.
        if (it.dir === 'up' || it.pressed)
            this.tryRotate();
        if (it.dir === 'down')
            this.hardDrop();
        if (it.dir === 'left' && !this.collides(this.px - 1, this.py, this.rot))
            this.px--;
        if (it.dir === 'right' && !this.collides(this.px + 1, this.py, this.rot))
            this.px++;
        // Klavyede basılı tutunca kayma (DAS/ARR). Tek basış zaten dir ile geldi.
        if (it.ax !== 0) {
            if (it.ax !== this.lastAx)
                this.dasT = -DAS;
            else {
                this.dasT += dt;
                while (this.dasT >= ARR) {
                    this.dasT -= ARR;
                    if (!this.collides(this.px + it.ax, this.py, this.rot))
                        this.px += it.ax;
                }
            }
        }
        this.lastAx = it.ax;
        this.fall += dt;
        if (this.fall >= this.fallEvery) {
            this.fall -= this.fallEvery;
            if (this.collides(this.px, this.py + 1, this.rot))
                this.lock();
            else
                this.py++;
        }
    }
    render() {
        const { ctx, palette } = this.o;
        const c = this.cell;
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, this.o.field.w, this.o.field.h);
        const pad = c * 0.09;
        const s = c - pad * 2;
        // Yerleşmiş bloklar sönük, düşen parça tam tonda.
        ctx.fillStyle = palette.dim;
        for (let y = 0; y < this.rows; y++) {
            if (this.flash > 0 && this.flashRows.includes(y))
                continue;
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y * this.cols + x])
                    ctx.fillRect(x * c + pad, y * c + pad, s, s);
            }
        }
        ctx.fillStyle = palette.fg;
        if (this.flash > 0) {
            for (const y of this.flashRows)
                ctx.fillRect(0, y * c + pad, this.o.field.w, s);
        }
        else {
            for (const [cx, cy] of rotated(PIECES[this.piece], this.rot)) {
                const y = this.py + cy;
                if (y >= 0)
                    ctx.fillRect((this.px + cx) * c + pad, y * c + pad, s, s);
            }
        }
    }
    destroy() {
        this.board = new Uint8Array(0);
    }
}
//# sourceMappingURL=game.js.map