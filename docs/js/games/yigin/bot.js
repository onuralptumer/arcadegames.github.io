import { PIECES, rotated } from './pieces.js?v=4fc8ef5321';
const BASE = { ax: 0, ay: 0, action: false, pressed: false, pointer: null };
/**
 * Klasik yükseklik/delik/pürüz sezgiseli. Tahtanın tamamını görmez, yalnızca
 * sütun profilini görür — bu yüzden kapalı boşlukları tam hesaplayamaz ve
 * zamanla tıkanır. Önizleme için istenen de bu: düzenli olarak sıfırlanması.
 */
export class YiginBot {
    rng;
    skill;
    plan = null;
    lastPieceId = -1;
    constructor(rng, 
    /** 0..1. Düşükse ara sıra bilerek kötü sütun seçer. */
    skill = 0.85) {
        this.rng = rng;
        this.skill = skill;
    }
    attach() { }
    detach() { }
    poll(s) {
        const cols = s.cols;
        if (s.pieceId !== this.lastPieceId) {
            this.lastPieceId = s.pieceId;
            this.plan = null;
        }
        if (!this.plan)
            this.plan = this.choose(s, cols);
        const dir = this.stepToward(s);
        return { ...BASE, dir };
    }
    stepToward(s) {
        const p = this.plan;
        if (s.rot !== p.rot)
            return 'up';
        if (s.px < p.x)
            return 'right';
        if (s.px > p.x)
            return 'left';
        return 'down'; // hizalandı, sert düşür
    }
    choose(s, cols) {
        const h = [];
        const o = [];
        for (let x = 0; x < cols; x++) {
            h.push(s[`h${x}`]);
            o.push(s[`o${x}`]);
        }
        const piece = PIECES[s.piece];
        let best = { x: s.px, rot: s.rot };
        let bestCost = Infinity;
        for (let rot = 0; rot < 4; rot++) {
            const cells = rotated(piece, rot);
            // Parçanın her sütunundaki en alt hücre ve genişliği.
            const minX = Math.min(...cells.map((c) => c[0]));
            const maxX = Math.max(...cells.map((c) => c[0]));
            const bottom = new Map();
            for (const [cx, cy] of cells) {
                bottom.set(cx, Math.max(bottom.get(cx) ?? -1, cy));
            }
            for (let px = -minX; px + maxX < cols; px++) {
                // Parça hangi satıra oturur: her sütunda gerekli boşluğa göre en kısıtlayıcı.
                let landTop = Infinity;
                for (const [cx, cyMax] of bottom) {
                    const col = px + cx;
                    const surface = s.rows - h[col]; // ilk dolu satır
                    landTop = Math.min(landTop, surface - cyMax - 1);
                }
                if (landTop < 0)
                    continue;
                const nh = h.slice();
                let newHoles = 0;
                for (const [cx, cyMax] of bottom) {
                    const col = px + cx;
                    const top = landTop + cyMax;
                    const gap = s.rows - h[col] - top - 1;
                    if (gap > 0)
                        newHoles += gap;
                    nh[col] = Math.max(nh[col], s.rows - (landTop + this.minCy(cells, cx)));
                }
                let agg = 0;
                let maxH = 0;
                for (let x = 0; x < cols; x++) {
                    agg += nh[x];
                    maxH = Math.max(maxH, nh[x]);
                }
                let bump = 0;
                for (let x = 1; x < cols; x++)
                    bump += Math.abs(nh[x] - nh[x - 1]);
                const holes = o.reduce((a, b) => a + b, 0) + newHoles;
                const cost = holes * 9 + agg * 0.55 + bump * 0.45 + maxH * 1.2;
                if (cost < bestCost) {
                    bestCost = cost;
                    best = { x: px, rot };
                }
            }
        }
        // Ara sıra bilerek ikinci en iyiye sapma: mükemmel bot izlemesi sıkıcı.
        if (this.rng() > this.skill) {
            best = { x: Math.max(0, Math.min(cols - 1, best.x + (this.rng() < 0.5 ? -2 : 2))), rot: best.rot };
        }
        return best;
    }
    minCy(cells, cx) {
        let m = Infinity;
        for (const [x, y] of cells)
            if (x === cx)
                m = Math.min(m, y);
        return m;
    }
}
//# sourceMappingURL=bot.js.map