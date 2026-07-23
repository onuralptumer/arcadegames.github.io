/**
 * Tehdidin önüne patlama koyar. Patlama büyümesi zaman aldığı için
 * füzenin şu anki değil, gelecekteki konumuna nişan almak gerekiyor.
 */
export class KalkanBot {
    rng;
    skill;
    cool = 0;
    constructor(rng, skill = 0.8) {
        this.rng = rng;
        this.skill = skill;
    }
    attach() { }
    detach() { }
    poll(s) {
        if (--this.cool > 0 || s.threats === 0 || s.canFire === 0) {
            return { ax: 0, ay: 0, action: false, pressed: false, pointer: null, dir: null };
        }
        this.cool = 4 + Math.floor(this.rng() * 5);
        const lead = 0.32;
        const err = (1 - this.skill) * s.fieldW * 0.35;
        const x = (s.threatX + s.threatVX * lead + (this.rng() - 0.5) * err) / s.fieldW;
        const y = (s.threatY + s.threatVY * lead + (this.rng() - 0.5) * err) / s.fieldH;
        return {
            ax: 0, ay: 0, action: true, pressed: true,
            pointer: { x: Math.max(0, Math.min(1, x)), y: Math.max(0.05, Math.min(0.85, y)) },
            dir: null,
        };
    }
}
//# sourceMappingURL=bot.js.map