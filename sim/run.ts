import { makeRng } from '../src/engine/rng.js';
import { Deflekt } from '../src/games/deflekt/game.js';
import { DeflektBot } from '../src/games/deflekt/bot.js';
import { Kivrim } from '../src/games/kivrim/game.js';
import { KivrimBot } from '../src/games/kivrim/bot.js';
import { Suzul } from '../src/games/suzul/game.js';
import { SuzulBot } from '../src/games/suzul/bot.js';
import type { Game, GameClass, InputSource, Mode } from '../src/engine/types.js';

const stub = (): any => ({
  fillStyle: '',
  fillRect() {},
  beginPath() {},
  arc() {},
  fill() {},
});

interface Case {
  label: string;
  Ctor: GameClass;
  bot: (rng: () => number) => InputSource;
  field: { w: number; h: number };
  mode: Mode;
  tickRate: number;
}

function run(c: Case, seconds: number) {
  const g: Game = new c.Ctor();
  let over = 0;
  let score = 0;
  let maxScore = 0;
  g.init({
    ctx: stub(),
    field: c.field,
    mode: c.mode,
    palette: { bg: '#000', fg: '#fff', dim: '#888' },
    rng: makeRng(7),
    input: c.bot(makeRng(99)),
    events: {
      score: (v) => {
        score = v;
        maxScore = Math.max(maxScore, v);
      },
      gameOver: () => {
        over++;
        score = 0;
      },
      levelUp: () => {},
    },
  });

  const ticks = seconds * c.tickRate;
  const dt = 1 / c.tickRate;
  for (let i = 0; i < ticks; i++) {
    g.update(dt);
    g.render(0);
    const s = g.snapshot();
    for (const [k, v] of Object.entries(s)) {
      if (!Number.isFinite(v)) {
        console.log(`  ✗ ${c.label}: ${k} = ${v} (tick ${i})`);
        return;
      }
    }
  }
  const per = over / (seconds / 60);
  console.log(
    `  ${c.label.padEnd(22)} ölüm ${String(over).padStart(3)} (${per.toFixed(1)}/dk)  en yüksek skor ${maxScore}`
  );
}

const D = { w: 200, h: 88 };
console.log('\nÖNİZLEME (demo, 20 tick, 200×88, 5 dakika)');
run({ label: 'Deflekt', Ctor: Deflekt, bot: (r) => new DeflektBot(r, 0.8), field: D, mode: 'demo', tickRate: 20 }, 300);
run({ label: 'Kıvrım', Ctor: Kivrim, bot: (r) => new KivrimBot(r, 0.93), field: D, mode: 'demo', tickRate: 20 }, 300);
run({ label: 'Süzül', Ctor: Suzul, bot: (r) => new SuzulBot(r, 0.87), field: D, mode: 'demo', tickRate: 20 }, 300);

console.log('\nOYUN (play, 60 tick, 5 dakika)');
run({ label: 'Deflekt 200×280', Ctor: Deflekt, bot: (r) => new DeflektBot(r, 0.85), field: { w: 200, h: 280 }, mode: 'play', tickRate: 60 }, 300);
run({ label: 'Kıvrım 200×200', Ctor: Kivrim, bot: (r) => new KivrimBot(r, 0.95), field: { w: 200, h: 200 }, mode: 'play', tickRate: 60 }, 300);
run({ label: 'Süzül 200×260', Ctor: Suzul, bot: (r) => new SuzulBot(r, 0.9), field: { w: 200, h: 260 }, mode: 'play', tickRate: 60 }, 300);
console.log('');
