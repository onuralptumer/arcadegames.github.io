import type { Dir, InputSource, Intent, Snapshot } from './types.js';

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const ACT = new Set(['Space', 'Enter']);

const SWIPE_MIN = 24;

export class HumanInput implements InputSource {
  private held = new Set<string>();
  private action = false;
  private actionPrev = false;
  private pointer: { x: number; y: number } | null = null;
  private dir: Dir | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private touchStart: { x: number; y: number } | null = null;

  attach(canvas: HTMLCanvasElement) {
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

  private onBlur = () => {
    this.held.clear();
    this.action = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const c = e.code;
    if (LEFT.has(c)) this.dir = 'left';
    else if (RIGHT.has(c)) this.dir = 'right';
    else if (UP.has(c)) this.dir = 'up';
    else if (DOWN.has(c)) this.dir = 'down';
    else if (ACT.has(c)) this.action = true;
    else return;
    this.held.add(c);
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.held.delete(e.code);
    if (ACT.has(e.code)) this.action = false;
  };

  private norm(e: PointerEvent) {
    const r = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  }

  private onMove = (e: PointerEvent) => {
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

  private onDown = (e: PointerEvent) => {
    this.pointer = this.norm(e);
    this.action = true;
    this.touchStart = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLCanvasElement).focus?.();
  };

  private onUp = () => {
    this.action = false;
    this.touchStart = null;
  };

  private onLeave = () => {
    this.pointer = null;
    this.touchStart = null;
  };

  poll(_s: Snapshot): Intent {
    let ax = 0;
    let ay = 0;
    for (const c of this.held) {
      if (LEFT.has(c)) ax -= 1;
      else if (RIGHT.has(c)) ax += 1;
      else if (UP.has(c)) ay -= 1;
      else if (DOWN.has(c)) ay += 1;
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

export const IDLE: Intent = {
  ax: 0,
  ay: 0,
  action: false,
  pressed: false,
  pointer: null,
  dir: null,
};

export class NullInput implements InputSource {
  attach() {}
  detach() {}
  poll(): Intent {
    return IDLE;
  }
}
