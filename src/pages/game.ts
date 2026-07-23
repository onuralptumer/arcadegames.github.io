import { mount, type Handle } from '../engine/mount.js';
import { bySlug } from '../manifest.js';
import type { Palette } from '../engine/types.js';

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const slug = document.body.dataset.game!;
const g = bySlug(slug);
if (!g || !g.load) throw new Error(`Bilinmeyen oyun: ${slug}`);

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const scoreEl = document.getElementById('score')!;
const bestEl = document.getElementById('best')!;
const overlay = document.getElementById('overlay')!;
const finalEl = document.getElementById('final')!;
const againBtn = document.getElementById('again') as HTMLButtonElement;

const KEY = `arcade:best:${slug}`;
// v1'de skor tablosu yok; localStorage yeter. Global tablo gerekirse tek bir
// uç noktayla sonradan eklenir, mimari değişmez.
let best = Number(localStorage.getItem(KEY) || 0);
bestEl.textContent = String(best);

// Oyun sayfasında zemin nötr, figür oyunun rengi. Karttakinin tersi.
const palette: Palette = { bg: '#141416', fg: g.solid, dim: rgba(g.solid, 0.34) };

let handle: Handle | null = null;

const { default: mod } = await g.load();
canvas.style.aspectRatio = `${mod.field.w} / ${mod.field.h}`;

handle = mount(canvas, mod.Game, {
  mode: 'play',
  field: mod.field,
  palette,
  seed: (Date.now() % 100000) | 0,
  events: {
    score: (v) => (scoreEl.textContent = String(v)),
    gameOver: (v) => {
      if (v > best) {
        best = v;
        localStorage.setItem(KEY, String(best));
        bestEl.textContent = String(best);
      }
      finalEl.textContent = String(v);
      overlay.hidden = false;
      handle?.pause();
    },
  },
});

againBtn.addEventListener('click', () => {
  overlay.hidden = true;
  scoreEl.textContent = '0';
  handle?.resume();
  canvas.focus();
});

canvas.focus();
