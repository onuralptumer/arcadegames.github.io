const BASE = { ax: 0, ay: 0, action: false, pressed: false, pointer: null };
const ALL = ['up', 'down', 'left', 'right'];
/**
 * Yeme doğru git, kovalayan yakınsa ters yöne kaç.
 * Yol bulma yok — bu yüzden köşelerde sıkışıp yakalanıyor, ki önizlemede
 * düzenli sıfırlanmasını sağlayan da bu.
 */
export class DolambacBot {
    rng;
    skill;
    wait = 0;
    constructor(rng, skill = 0.85) {
        this.rng = rng;
        this.skill = skill;
    }
    attach() { }
    detach() { }
    poll(s) {
        if (s.stun === 1)
            return { ...BASE, dir: null };
        if (--this.wait > 0)
            return { ...BASE, dir: null };
        this.wait = 2;
        const free = ALL.filter((d) => s[`free${d}`] === 1);
        if (!free.length)
            return { ...BASE, dir: null };
        const flee = s.threatDist < 4 && s.scared === 0;
        const tx = flee ? s.px * 2 - s.threatX : s.foodX;
        const ty = flee ? s.py * 2 - s.threatY : s.foodY;
        if (this.rng() > this.skill) {
            return { ...BASE, dir: free[Math.floor(this.rng() * free.length)] };
        }
        let best = free[0];
        let bd = Infinity;
        for (const d of free) {
            const nx = s.px + (d === 'left' ? -1 : d === 'right' ? 1 : 0);
            const ny = s.py + (d === 'up' ? -1 : d === 'down' ? 1 : 0);
            let score = Math.abs(nx - tx) + Math.abs(ny - ty);
            if (s[`pellet${d}`] === 1)
                score -= 1.5;
            if (score < bd) {
                bd = score;
                best = d;
            }
        }
        return { ...BASE, dir: best };
    }
}
//# sourceMappingURL=bot.js.map