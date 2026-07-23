/**
 * Özgün yerleşim. '#' duvar, '.' yem, 'o' güç yemi, ' ' boş,
 * 'P' oyuncu başlangıcı, 'G' kovalayan başlangıcı, 'T' tünel ağzı.
 */
const MAZE = [
    '###################',
    '#o.......#.......o#',
    '#.##.###.#.###.##.#',
    '#.................#',
    '#.##.#.#####.#.##.#',
    '#....#...G...#....#',
    '##.#.###.#.###.#.##',
    'T.........P.......T',
    '##.#.###.#.###.#.##',
    '#....#.......#....#',
    '#.##.#.#####.#.##.#',
    '#.................#',
    '#o###.#######.###o#',
    '#.................#',
    '###################',
];
const DIRS = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
};
export class Dolambac {
    o;
    cols = 0;
    rows = 0;
    cell = 0;
    ox = 0;
    oy = 0;
    walls;
    pellets; // 0 yok, 1 yem, 2 güç yemi
    left = 0;
    px = 0;
    py = 0;
    dir = 'left';
    queued = null;
    moveT = 0;
    stepEvery = 0;
    chasers = [];
    chaseT = 0;
    chaserStep = 0;
    score = 0;
    level = 1;
    stun = 0;
    startPX = 0;
    startPY = 0;
    startGX = 0;
    startGY = 0;
    init(o) {
        this.o = o;
        this.cols = MAZE[0].length;
        this.rows = MAZE.length;
        // Hücre kare kalsın; alan farklı oranlıysa labirent ortalanır.
        this.cell = Math.min(o.field.w / this.cols, o.field.h / this.rows);
        this.ox = (o.field.w - this.cols * this.cell) / 2;
        this.oy = (o.field.h - this.rows * this.cell) / 2;
        this.walls = new Uint8Array(this.cols * this.rows);
        this.pellets = new Uint8Array(this.cols * this.rows);
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const ch = MAZE[y][x];
                const i = y * this.cols + x;
                if (ch === '#')
                    this.walls[i] = 1;
                if (ch === 'P') {
                    this.startPX = x;
                    this.startPY = y;
                }
                if (ch === 'G') {
                    this.startGX = x;
                    this.startGY = y;
                }
            }
        }
        this.stepEvery = o.mode === 'demo' ? 0.1 : 0.13;
        this.chaserStep = this.stepEvery * 1.22;
        this.reset(true);
    }
    reset(full) {
        if (full) {
            this.score = 0;
            this.level = 1;
            this.fillPellets();
        }
        this.px = this.startPX;
        this.py = this.startPY;
        this.dir = 'left';
        this.queued = null;
        this.moveT = 0;
        this.stun = 0;
        this.chasers = [];
        const n = this.o.mode === 'demo' ? 3 : 3;
        for (let i = 0; i < n; i++) {
            this.chasers.push({
                x: this.startGX + (i - 1),
                y: this.startGY,
                dir: 'left',
                kind: i % 3,
                scared: 0,
            });
        }
    }
    fillPellets() {
        this.left = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const ch = MAZE[y][x];
                const i = y * this.cols + x;
                this.pellets[i] = ch === '.' ? 1 : ch === 'o' ? 2 : 0;
                if (this.pellets[i])
                    this.left++;
            }
        }
    }
    wall(x, y) {
        if (y < 0 || y >= this.rows)
            return true;
        const wx = ((x % this.cols) + this.cols) % this.cols;
        return this.walls[y * this.cols + wx] === 1;
    }
    wrapX(x) {
        return ((x % this.cols) + this.cols) % this.cols;
    }
    snapshot() {
        const s = {
            px: this.px,
            py: this.py,
            cols: this.cols,
            rows: this.rows,
            score: this.score,
            left: this.left,
            stun: this.stun > 0 ? 1 : 0,
        };
        for (const d of ['up', 'down', 'left', 'right']) {
            s[`free${d}`] = this.wall(this.px + DIRS[d][0], this.py + DIRS[d][1]) ? 0 : 1;
            // Bot için: o yönde bir sonraki hücrede yem var mı.
            const nx = this.wrapX(this.px + DIRS[d][0]);
            const ny = this.py + DIRS[d][1];
            s[`pellet${d}`] =
                ny >= 0 && ny < this.rows && this.pellets[ny * this.cols + nx] ? 1 : 0;
        }
        let bd = 1e6;
        let bx = 0;
        let by = 0;
        for (const c of this.chasers) {
            const d = Math.abs(c.x - this.px) + Math.abs(c.y - this.py);
            if (d < bd) {
                bd = d;
                bx = c.x;
                by = c.y;
            }
        }
        s.threatDist = bd;
        s.threatX = bx;
        s.threatY = by;
        s.scared = this.chasers[0]?.scared > 0 ? 1 : 0;
        // En yakın yemin yönü: bot bunu hedef alır.
        const t = this.nearestPellet();
        s.foodX = t[0];
        s.foodY = t[1];
        return s;
    }
    /** Genişlik öncelikli arama: labirentte Manhattan mesafesi yanıltıcı. */
    nearestPellet() {
        const seen = new Uint8Array(this.cols * this.rows);
        const q = [this.py * this.cols + this.px];
        seen[q[0]] = 1;
        let head = 0;
        while (head < q.length) {
            const i = q[head++];
            const x = i % this.cols;
            const y = (i / this.cols) | 0;
            if (this.pellets[i])
                return [x, y];
            for (const d of ['up', 'down', 'left', 'right']) {
                const nx = this.wrapX(x + DIRS[d][0]);
                const ny = y + DIRS[d][1];
                if (ny < 0 || ny >= this.rows)
                    continue;
                const ni = ny * this.cols + nx;
                if (seen[ni] || this.walls[ni])
                    continue;
                seen[ni] = 1;
                q.push(ni);
            }
        }
        return [this.px, this.py];
    }
    update(dt) {
        if (this.stun > 0) {
            this.stun -= dt;
            if (this.stun <= 0)
                this.reset(false);
            return;
        }
        const it = this.o.input.poll(this.snapshot());
        if (it.dir)
            this.queued = it.dir;
        this.moveT += dt;
        if (this.moveT >= this.stepEvery) {
            this.moveT -= this.stepEvery;
            this.stepPlayer();
        }
        this.chaseT += dt;
        if (this.chaseT >= this.chaserStep) {
            this.chaseT -= this.chaserStep;
            this.stepChasers();
        }
        for (const c of this.chasers) {
            if (c.scared > 0)
                c.scared -= dt;
            if (c.x === this.px && c.y === this.py) {
                if (c.scared > 0) {
                    c.x = this.startGX;
                    c.y = this.startGY;
                    c.scared = 0;
                    this.score += 50;
                    if (this.o.mode !== 'demo')
                        this.o.events.score(this.score);
                }
                else
                    return this.die();
            }
        }
    }
    stepPlayer() {
        if (this.queued) {
            const [dx, dy] = DIRS[this.queued];
            if (!this.wall(this.px + dx, this.py + dy)) {
                this.dir = this.queued;
                this.queued = null;
            }
        }
        const [dx, dy] = DIRS[this.dir];
        if (!this.wall(this.px + dx, this.py + dy)) {
            this.px = this.wrapX(this.px + dx);
            this.py += dy;
        }
        const i = this.py * this.cols + this.px;
        if (this.pellets[i]) {
            this.score += this.pellets[i] === 2 ? 25 : 5;
            if (this.pellets[i] === 2)
                for (const c of this.chasers)
                    c.scared = 6;
            this.pellets[i] = 0;
            this.left--;
            if (this.o.mode !== 'demo')
                this.o.events.score(this.score);
            if (this.left === 0) {
                this.level++;
                if (this.o.mode !== 'demo')
                    this.o.events.levelUp(this.level);
                this.fillPellets();
                // Her seviyede kovalayanlar hızlanır.
                this.chaserStep = Math.max(this.stepEvery * 0.85, this.chaserStep * 0.9);
                this.reset(false);
            }
        }
    }
    stepChasers() {
        for (const c of this.chasers) {
            const opts = [];
            for (const d of ['up', 'down', 'left', 'right']) {
                // Geri dönmek yasak; yoksa koridorlarda titriyorlar.
                if (this.opposite(d) === c.dir)
                    continue;
                if (!this.wall(c.x + DIRS[d][0], c.y + DIRS[d][1]))
                    opts.push(d);
            }
            if (!opts.length) {
                c.dir = this.opposite(c.dir);
                continue;
            }
            let tx = this.px;
            let ty = this.py;
            if (c.kind === 1) {
                // Önünü kesen: oyuncunun gittiği yönün iki hücre ilerisini hedefler.
                tx = this.px + DIRS[this.dir][0] * 3;
                ty = this.py + DIRS[this.dir][1] * 3;
            }
            else if (c.kind === 2) {
                tx = this.o.rng() * this.cols;
                ty = this.o.rng() * this.rows;
            }
            if (c.scared > 0) {
                tx = this.cols - this.px;
                ty = this.rows - this.py;
            }
            let best = opts[0];
            let bd = Infinity;
            for (const d of opts) {
                const nx = c.x + DIRS[d][0];
                const ny = c.y + DIRS[d][1];
                const dd = (nx - tx) ** 2 + (ny - ty) ** 2;
                if (dd < bd) {
                    bd = dd;
                    best = d;
                }
            }
            c.dir = best;
            c.x = this.wrapX(c.x + DIRS[best][0]);
            c.y += DIRS[best][1];
        }
    }
    opposite(d) {
        return d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';
    }
    die() {
        if (this.o.mode === 'demo') {
            this.stun = 0.5;
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
        ctx.fillStyle = palette.dim;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.walls[y * this.cols + x]) {
                    ctx.fillRect(this.ox + x * c + c * 0.08, this.oy + y * c + c * 0.08, c * 0.84, c * 0.84);
                }
            }
        }
        ctx.fillStyle = palette.fg;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const p = this.pellets[y * this.cols + x];
                if (!p)
                    continue;
                ctx.beginPath();
                ctx.arc(this.ox + x * c + c / 2, this.oy + y * c + c / 2, c * (p === 2 ? 0.26 : 0.11), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // Kovalayanlar içi boş kare, oyuncu dolu daire: siluet olarak ayrışıyor.
        ctx.strokeStyle = palette.fg;
        ctx.lineWidth = Math.max(0.7, c * 0.13);
        for (const ch of this.chasers) {
            ctx.globalAlpha = ch.scared > 0 ? 0.4 : 1;
            ctx.strokeRect(this.ox + ch.x * c + c * 0.2, this.oy + ch.y * c + c * 0.2, c * 0.6, c * 0.6);
        }
        ctx.globalAlpha = 1;
        if (this.stun > 0 && Math.floor(this.stun * 12) % 2 === 0)
            return;
        ctx.beginPath();
        ctx.arc(this.ox + this.px * c + c / 2, this.oy + this.py * c + c / 2, c * 0.34, 0, Math.PI * 2);
        ctx.fill();
    }
    destroy() {
        this.chasers = [];
    }
}
//# sourceMappingURL=game.js.map