const BASE = { ax: 0, ay: 0, pointer: null, dir: null };
/**
 * Beş satırlık bot: hedef yüksekliğin altına düşünce zıpla.
 * Hedefe küçük bir sapma eklenir, yoksa hiç ölmez ve kart ölü görünür.
 */
export class SuzulBot {
    rng;
    skill;
    held = false;
    bias = 0;
    t = 0;
    constructor(rng, 
    /** 0..1. Düşükse hedefi daha çok şaşırır. */
    skill = 0.85) {
        this.rng = rng;
        this.skill = skill;
    }
    attach() { }
    detach() { }
    poll(s) {
        if (s.dead === 1) {
            this.held = false;
            return { ...BASE, action: false, pressed: false };
        }
        if (--this.t <= 0) {
            this.t = 8 + Math.floor(this.rng() * 10);
            this.bias = (this.rng() - 0.5) * s.gap * (1 - this.skill) * 2.2;
        }
        // Yerçekimi altında düşerken hedefin biraz üstünü nişan al.
        const aim = s.gateCY + this.bias - s.gap * 0.08;
        const want = s.y > aim && s.vy > -s.fieldH * 0.05;
        const pressed = want && !this.held;
        this.held = want;
        return { ...BASE, action: want, pressed };
    }
}
//# sourceMappingURL=bot.js.map