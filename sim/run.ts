import { makeRng } from '../src/engine/rng.js';
import { Deflekt } from '../src/games/deflekt/game.js';
import { DeflektBot } from '../src/games/deflekt/bot.js';
import { Kivrim } from '../src/games/kivrim/game.js';
import { KivrimBot } from '../src/games/kivrim/bot.js';
import { Suzul } from '../src/games/suzul/game.js';
import { SuzulBot } from '../src/games/suzul/bot.js';
import { Yigin } from '../src/games/yigin/game.js';
import { YiginBot } from '../src/games/yigin/bot.js';
import { Nobet } from '../src/games/nobet/game.js';
import { NobetBot } from '../src/games/nobet/bot.js';
import { Katla } from '../src/games/katla/game.js';
import { KatlaBot } from '../src/games/katla/bot.js';
import { Gecit } from '../src/games/gecit/game.js';
import { GecitBot } from '../src/games/gecit/bot.js';
import { Sekme } from '../src/games/sekme/game.js';
import { SekmeBot } from '../src/games/sekme/bot.js';
import { Kalkan } from '../src/games/kalkan/game.js';
import { KalkanBot } from '../src/games/kalkan/bot.js';
import { Savruk } from '../src/games/savruk/game.js';
import { SavrukBot } from '../src/games/savruk/bot.js';
import { Kume } from '../src/games/kume/game.js';
import { KumeBot } from '../src/games/kume/bot.js';
import { Dolambac } from '../src/games/dolambac/game.js';
import { DolambacBot } from '../src/games/dolambac/bot.js';
import type { Game, GameClass, InputSource, Mode } from '../src/engine/types.js';

const stub = (): any => ({
  fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1,
  font: '', textAlign: '', textBaseline: '',
  fillRect() {}, strokeRect() {}, beginPath() {}, arc() {}, arcTo() {},
  moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
  fillText() {}, save() {}, restore() {}, translate() {}, rotate() {},
});

interface Case {
  label: string; Ctor: GameClass; bot: (r: () => number) => InputSource;
  field: { w: number; h: number }; mode: Mode; tickRate: number;
}

function run(c: Case, seconds: number) {
  const g: Game = new c.Ctor();
  let over = 0, maxScore = 0;
  g.init({
    ctx: stub(), field: c.field, mode: c.mode,
    palette: { bg: '#000', fg: '#fff', dim: '#888' },
    rng: makeRng(7), input: c.bot(makeRng(99)),
    events: {
      score: (v) => { maxScore = Math.max(maxScore, v); },
      gameOver: () => { over++; },
      levelUp: () => {},
    },
  });
  const ticks = seconds * c.tickRate, dt = 1 / c.tickRate;
  const t0 = Date.now();
  for (let i = 0; i < ticks; i++) {
    g.update(dt);
    g.render(0);
    for (const [k, v] of Object.entries(g.snapshot())) {
      if (!Number.isFinite(v)) { console.log(`  ✗ ${c.label}: ${k}=${v} @${i}`); return; }
    }
  }
  const ms = Date.now() - t0;
  console.log(
    `  ${c.label.padEnd(18)} ölüm ${String(over).padStart(3)} (${(over / (seconds / 60)).toFixed(1)}/dk)` +
    `  skor ${String(maxScore).padStart(6)}  ${(ms / ticks * 1000).toFixed(1)}µs/tick`
  );
}

const D = { w: 200, h: 88 };
const cases: [string, GameClass, (r: () => number) => InputSource, { w: number; h: number }][] = [
  ['Deflekt', Deflekt, (r) => new DeflektBot(r, 0.85), { w: 200, h: 280 }],
  ['Kıvrım', Kivrim, (r) => new KivrimBot(r, 0.95), { w: 200, h: 200 }],
  ['Süzül', Suzul, (r) => new SuzulBot(r, 0.9), { w: 200, h: 260 }],
  ['Yığın', Yigin, (r) => new YiginBot(r, 0.85), { w: 200, h: 400 }],
  ['Nöbet', Nobet, (r) => new NobetBot(r, 0.85), { w: 200, h: 260 }],
  ['Katla', Katla, (r) => new KatlaBot(r), { w: 200, h: 200 }],
  ['Savruk', Savruk, (r) => new SavrukBot(r), { w: 200, h: 200 }],
  ['Dolambaç', Dolambac, (r) => new DolambacBot(r), { w: 200, h: 158 }],
  ['Küme', Kume, (r) => new KumeBot(r), { w: 200, h: 260 }],
  ['Geçit', Gecit, (r) => new GecitBot(r), { w: 200, h: 200 }],
  ['Kalkan', Kalkan, (r) => new KalkanBot(r), { w: 200, h: 160 }],
  ['Sekme', Sekme, (r) => new SekmeBot(r), { w: 200, h: 300 }],
];

console.log('\nOYUN (60 tick, 5 dakika)');
for (const [label, Ctor, bot, field] of cases) run({ label, Ctor, bot, field, mode: 'play', tickRate: 60 }, 300);
console.log('\nÖNİZLEME (20 tick, 200×88, 5 dakika)');
for (const [label, Ctor, bot] of cases) run({ label, Ctor, bot, field: D, mode: 'demo', tickRate: 20 }, 300);
console.log('');
