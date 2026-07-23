const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const ACT = new Set(['Space', 'Enter']);
const SWIPE_MIN = 24;
export class HumanInput {
    held = new Set();
    action = false;
    actionPrev = false;
    pointer = null;
    dir = null;
    canvas = null;
    touchStart = null;
    attach(canvas) {
        this.canvas = canvas;
        canvas.tabIndex = 0;
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
        canvas.addEventListener('pointermove', this.onMove);
        canvas.addEventListener('pointerdown', this.onDown);
        canvas.addEventListener('pointerup', this.onUp);
        canvas.addEventListener('pointercancel', this.onUp);
        canvas.addEventListener('pointerleave', this.onLeave);
    }
    detach() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
        const c = this.canvas;
        if (c) {
            c.removeEventListener('pointermove', this.onMove);
            c.removeEventListener('pointerdown', this.onDown);
            c.removeEventListener('pointerup', this.onUp);
            c.removeEventListener('pointercancel', this.onUp);
            c.removeEventListener('pointerleave', this.onLeave);
        }
        this.canvas = null;
    }
    onBlur = () => {
        this.held.clear();
        this.action = false;
    };
    onKeyDown = (e) => {
        if (e.repeat)
            return;
        const c = e.code;
        if (LEFT.has(c))
            this.dir = 'left';
        else if (RIGHT.has(c))
            this.dir = 'right';
        else if (UP.has(c))
            this.dir = 'up';
        else if (DOWN.has(c))
            this.dir = 'down';
        else if (ACT.has(c))
            this.action = true;
        else
            return;
        this.held.add(c);
        e.preventDefault();
    };
    onKeyUp = (e) => {
        this.held.delete(e.code);
        if (ACT.has(e.code))
            this.action = false;
    };
    norm(e) {
        const r = e.currentTarget.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
            y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
        };
    }
    onMove = (e) => {
        this.pointer = this.norm(e);
        const t = this.touchStart;
        if (t) {
            const dx = e.clientX - t.x;
            const dy = e.clientY - t.y;
            if (Math.abs(dx) > SWIPE_MIN || Math.abs(dy) > SWIPE_MIN) {
                this.dir =
                    Math.abs(dx) > Math.abs(dy)
                        ? dx > 0
                            ? 'right'
                            : 'left'
                        : dy > 0
                            ? 'down'
                            : 'up';
                this.touchStart = { x: e.clientX, y: e.clientY };
            }
        }
    };
    onDown = (e) => {
        this.pointer = this.norm(e);
        this.action = true;
        this.touchStart = { x: e.clientX, y: e.clientY };
        e.currentTarget.focus?.();
    };
    onUp = () => {
        this.action = false;
        this.touchStart = null;
    };
    onLeave = () => {
        this.pointer = null;
        this.touchStart = null;
    };
    poll(_s) {
        let ax = 0;
        let ay = 0;
        for (const c of this.held) {
            if (LEFT.has(c))
                ax -= 1;
            else if (RIGHT.has(c))
                ax += 1;
            else if (UP.has(c))
                ay -= 1;
            else if (DOWN.has(c))
                ay += 1;
        }
        const pressed = this.action && !this.actionPrev;
        this.actionPrev = this.action;
        const dir = this.dir;
        this.dir = null; // tek atımlık: okundu, tüketildi
        return {
            ax: Math.max(-1, Math.min(1, ax)),
            ay: Math.max(-1, Math.min(1, ay)),
            action: this.action,
            pressed,
            pointer: this.pointer,
            dir,
        };
    }
}
export const IDLE = {
    ax: 0,
    ay: 0,
    action: false,
    pressed: false,
    pointer: null,
    dir: null,
};
export class NullInput {
    attach() { }
    detach() { }
    poll() {
        return IDLE;
    }
}
//# sourceMappingURL=input.js.map