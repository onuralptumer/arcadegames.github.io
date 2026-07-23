import { mount } from '../engine/mount.js';
import { makeRng } from '../engine/rng.js';
import { GAMES, type Entry } from '../manifest.js';
import type { Palette } from '../engine/types.js';

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Önizleme iki tonlu: kart rengi zemin, açık tonu figür. Renkli minyatür değil. */
const previewPalette = (g: Entry): Palette => ({
  bg: g.solid,
  fg: g.tint,
  dim: rgba(g.tint, 0.4),
});

function card(g: Entry, seed: number): HTMLElement {
  const el = document.createElement(g.ready ? 'a' : 'div');
  el.className = 'card' + (g.ready ? '' : ' card--soon');
  if (g.ready) (el as HTMLAnchorElement).href = `./oyun/${g.slug}.html`;

  el.innerHTML = `
    <div class="card__art" style="background:${g.solid}">
      ${g.ready ? '<canvas aria-hidden="true"></canvas>' : ''}
      <span class="card__tag" style="background:${g.tint};color:${g.solid}">${g.name}</span>
      ${g.ready ? '' : '<span class="card__soon">yakında</span>'}
    </div>
    <div class="card__meta">
      <p class="card__kind">${g.kind}</p>
      <p class="card__blurb">${g.blurb}</p>
    </div>`;

  if (g.ready && g.load) {
    const canvas = el.querySelector('canvas') as HTMLCanvasElement;
    // Kart ekrana yaklaşana kadar oyun modülünü indirme.
    const io = new IntersectionObserver(
      (es) => {
        if (!es.some((e) => e.isIntersecting)) return;
        io.disconnect();
        g.load!().then(({ default: mod }) => {
          const field = mod.demoField ?? mod.field;
          mount(canvas, mod.Game, {
            mode: 'demo',
            field,
            palette: previewPalette(g),
            seed,
            input: mod.makeBot(makeRng(seed * 31)),
          });
        });
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
  }
  return el;
}

const grid = document.getElementById('grid')!;
GAMES.forEach((g, i) => grid.appendChild(card(g, 101 + i * 7)));

const ready = GAMES.filter((g) => g.ready).length;
const soon = GAMES.length - ready;
const el = document.getElementById('count');
if (el) el.textContent = soon ? `${ready} oyun · ${soon} yolda` : `${ready} oyun · kayıt yok`;
