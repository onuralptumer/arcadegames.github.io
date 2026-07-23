/** Elindeki tonla eşleşen bir sütuna nişan alır; yoksa en dolu sütuna atar. */
export class KumeBot {
    rng;
    skill;
    cool = 0;
    aimX = 0.5;
    constructor(rng, skill = 0.8) {
        this.rng = rng;
        this.skill = skill;
    }
    attach() { }
    detach() { }
    poll(s) {
        if (s.flying === 1)
            return this.idle();
        if (--this.cool > 0)
            return this.idle();
        this.cool = 6 + Math.floor(this.rng() * 6);
        const match = [];
        const any = [];
        for (let x = 0; x < s.cols; x++) {
            if (s[`lowY${x}`] < 0)
                continue;
            any.push(x);
            if (s[`lowT${x}`] === s.tier)
                match.push(x);
        }
        const pool = match.length ? match : any;
        if (!pool.length)
            return this.idle();
        const col = pool[Math.floor(this.rng() * pool.length)];
        const err = (1 - this.skill) * s.fieldW * 0.3;
        this.aimX = (s[`cx${col}`] + (this.rng() - 0.5) * err) / s.fieldW;
        this.aimX = Math.max(0.03, Math.min(0.97, this.aimX));
        return {
            ax: 0, ay: 0, action: true, pressed: true,
            pointer: { x: this.aimX, y: 0.1 }, dir: null,
        };
    }
    idle() {
        return {
            ax: 0, ay: 0, action: false, pressed: false,
            pointer: { x: this.aimX, y: 0.1 }, dir: null,
        };
    }
}
//# sourceMappingURL=bot.js.map