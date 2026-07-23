export class Runner {
    game;
    opts;
    visible = false;
    paused = false;
    acc = 0;
    stepMs;
    constructor(game, opts) {
        this.game = game;
        this.opts = opts;
        this.stepMs = 1000 / opts.tickRate;
    }
    get active() {
        return this.visible && !this.paused;
    }
    advance(dtMs) {
        // Sekme geri geldiğinde 40 saniyelik borcu ödemeye çalışma.
        this.acc += Math.min(dtMs, 100);
        let ticks = 0;
        while (this.acc >= this.stepMs && ticks < 5) {
            this.game.update(this.stepMs / 1000);
            this.acc -= this.stepMs;
            ticks++;
        }
        if (this.opts.renderOnTick) {
            if (ticks > 0)
                this.game.render(0);
        }
        else {
            this.game.render(this.acc / this.stepMs);
        }
    }
}
class Scheduler {
    runners = new Set();
    raf = 0;
    last = 0;
    cost = 0;
    fps = 60;
    hidden = false;
    constructor() {
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                this.hidden = document.hidden;
                if (this.hidden)
                    this.stop();
                else
                    this.kick();
            });
        }
    }
    add(r) {
        this.runners.add(r);
        this.kick();
    }
    remove(r) {
        this.runners.delete(r);
        if (this.runners.size === 0)
            this.stop();
    }
    kick() {
        if (!this.raf && !this.hidden && this.runners.size > 0) {
            this.last = performance.now();
            this.raf = requestAnimationFrame(this.tick);
        }
    }
    stop() {
        if (this.raf)
            cancelAnimationFrame(this.raf);
        this.raf = 0;
    }
    tick = (now) => {
        const dt = now - this.last;
        this.last = now;
        this.fps += (1000 / Math.max(dt, 1) - this.fps) * 0.05;
        const t0 = performance.now();
        for (const r of this.runners)
            if (r.active)
                r.advance(dt);
        this.cost += (performance.now() - t0 - this.cost) * 0.05;
        this.raf = requestAnimationFrame(this.tick);
    };
    stats() {
        let active = 0;
        for (const r of this.runners)
            if (r.active)
                active++;
        return { registered: this.runners.size, active, frameCost: this.cost, fps: this.fps };
    }
}
/** Altı kart = altı rAF değil, bir rAF. */
export const scheduler = new Scheduler();
//# sourceMappingURL=scheduler.js.map