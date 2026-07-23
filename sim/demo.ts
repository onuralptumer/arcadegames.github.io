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
import type { InputSource } from '../src/engine/types.js';

const stub = (): any => ({ fillStyle:'', strokeStyle:'', lineWidth:1, globalAlpha:1,
  font:'', textAlign:'', textBaseline:'',
  fillRect(){}, strokeRect(){}, beginPath(){}, arc(){}, arcTo(){}, moveTo(){}, lineTo(){},
  closePath(){}, fill(){}, stroke(){}, fillText(){}, save(){}, restore(){}, translate(){}, rotate(){} });

/** Demo modunda gameOver yayınlanmaz; sıfırlanmayı durumdan yakalamak gerekir. */
function demo(label: string, Ctor: any, bot: InputSource, watch: (g: any) => number, secs = 300) {
  const g: any = new Ctor();
  g.init({ ctx: stub(), field: { w: 200, h: 88 }, mode: 'demo',
    palette: { bg: '#000', fg: '#fff', dim: '#888' },
    rng: makeRng(7), input: bot, events: { score(){}, gameOver(){}, levelUp(){} } });
  let prev = watch(g), resets = 0;
  for (let i = 0; i < secs * 20; i++) {
    g.update(1 / 20); g.render(0);
    const v = watch(g);
    if (v < prev - 0.5) resets++;
    prev = v;
  }
  console.log(`  ${label.padEnd(10)} sıfırlanma ${String(resets).padStart(3)}  (${(resets / (secs / 60)).toFixed(1)}/dk)`);
}

console.log('\nÖNİZLEME sıfırlanma sıklığı — 15 sn bakan biri hareket görmeli');
demo('Deflekt', Deflekt, new DeflektBot(makeRng(99), 0.8), (g) => g.bricks.length ? 1e6 - g.bricks.length : 0);
demo('Kıvrım',  Kivrim,  new KivrimBot(makeRng(99), 0.93), (g) => g.body.length);
demo('Süzül',   Suzul,   new SuzulBot(makeRng(99), 0.87), (g) => g.score);
demo('Yığın',   Yigin,   new YiginBot(makeRng(99), 0.85), (g) => g.lines * 100 + g.pieceId);
demo('Nöbet',   Nobet,   new NobetBot(makeRng(99), 0.85), (g) => g.wave * 1000 + g.score);
demo('Katla',   Katla,   new KatlaBot(makeRng(99)), (g) => g.score);
demo('Savruk',  Savruk,  new SavrukBot(makeRng(99)), (g) => g.wave * 1000 + g.score);
demo('Dolambaç',Dolambac,new DolambacBot(makeRng(99)), (g) => g.score);
demo('Küme',    Kume,    new KumeBot(makeRng(99)), (g) => g.score);
demo('Geçit',   Gecit,   new GecitBot(makeRng(99)), (g) => g.score * 100 + (g.rows - g.py));
demo('Kalkan',  Kalkan,  new KalkanBot(makeRng(99)), (g) => g.wave * 1000 + g.score);
demo('Sekme',   Sekme,   new SekmeBot(makeRng(99)), (g) => g.climbed);
console.log('');
