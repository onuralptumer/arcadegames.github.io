import { makeRng } from './rng.js?v=4fc8ef5321';
import { HumanInput, NullInput } from './input.js?v=4fc8ef5321';
import { Runner, scheduler } from './scheduler.js?v=4fc8ef5321';
const noop = () => { };
export function mount(canvas, GameCtor, opts) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const isDemo = opts.mode === 'demo';
    const input = opts.input ?? (isDemo ? new NullInput() : new HumanInput());
    const game = new GameCtor();
    // Demo'da DPR 1'e sabit: 88px yüksekliğinde retina çizmenin görsel karşılığı yok,
    // maliyeti dört kat.
    const dpr = isDemo ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
        const r = canvas.getBoundingClientRect();
        if (r.width < 1 || r.height < 1)
            return;
        canvas.width = Math.round(r.width * dpr);
        canvas.height = Math.round(r.height * dpr);
        ctx.setTransform(canvas.width / opts.field.w, 0, 0, canvas.height / opts.field.h, 0, 0);
    };
    resize();
    input.attach(canvas);
    game.init({
        ctx,
        field: opts.field,
        mode: opts.mode,
        palette: opts.palette,
        rng: makeRng(opts.seed ?? 1337),
        input,
        events: {
            score: opts.events?.score ?? noop,
            gameOver: opts.events?.gameOver ?? noop,
            levelUp: opts.events?.levelUp ?? noop,
        },
    });
    const reduce = typeof matchMedia !== 'undefined' &&
        matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isDemo && reduce) {
        // Hareket yok: tek kare çiz, zamanlayıcıya hiç kaydolma.
        for (let i = 0; i < 30; i++)
            game.update(1 / 20);
        game.render(0);
        return {
            still: true,
            pause: noop,
            resume: noop,
            destroy: () => {
                input.detach();
                game.destroy();
            },
        };
    }
    const runner = new Runner(game, {
        tickRate: opts.tickRate ?? (isDemo ? 20 : 60),
        renderOnTick: isDemo,
    });
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver((es) => {
            for (const e of es)
                runner.visible = e.isIntersecting;
            scheduler.kick();
        }, { threshold: 0.01 });
        io.observe(canvas);
    }
    else {
        runner.visible = true;
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    scheduler.add(runner);
    return {
        still: false,
        pause: () => {
            runner.paused = true;
        },
        resume: () => {
            runner.paused = false;
            scheduler.kick();
        },
        destroy: () => {
            io?.disconnect();
            ro?.disconnect();
            scheduler.remove(runner);
            input.detach();
            game.destroy();
        },
    };
}
//# sourceMappingURL=mount.js.map