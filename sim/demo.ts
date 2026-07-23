import { makeRng } from '../src/engine/rng.js';
import { Deflekt } from '../src/games/deflekt/game.js';
import { DeflektBot } from '../src/games/deflekt/bot.js';
import { Kivrim } from '../src/games/kivrim/game.js';
import { KivrimBot } from '../src/games/kivrim/bot.js';
import { Suzul } from '../src/games/suzul/game.js';
import { SuzulBot } from '../src/games/suzul/bot.js';

const stub = (): any => ({ fillStyle:'', fillRect(){}, beginPath(){}, arc(){}, fill(){} });

/** Demo modunda gameOver yayınlanmaz — sıfırlanmayı durumdan yakalamak gerekir. */
function demo(label:string, Ctor:any, bot:any, watch:(g:any)=>number, secs=300){
  const g:any = new Ctor();
  g.init({ ctx: stub(), field:{w:200,h:88}, mode:'demo', palette:{bg:'#000',fg:'#fff',dim:'#888'},
    rng: makeRng(7), input: bot, events:{score(){},gameOver(){},levelUp(){}} });
  let prev = watch(g); let resets = 0;
  for(let i=0;i<secs*20;i++){
    g.update(1/20); g.render(0);
    const v = watch(g);
    if (v < prev - 0.5) resets++;
    prev = v;
  }
  console.log(`  ${label.padEnd(10)} sıfırlanma ${String(resets).padStart(3)}  (${(resets/(secs/60)).toFixed(1)}/dk)`);
}
console.log('\nÖNİZLEME sıfırlanma sıklığı — 15 sn bakan biri hareketli bir şey görmeli');
demo('Deflekt', Deflekt, new DeflektBot(makeRng(99), 0.80), g => g.bricks.length ? 1e6 - g.bricks.length : 0);
demo('Kıvrım',  Kivrim,  new KivrimBot(makeRng(99), 0.93),  g => g.body.length);
demo('Süzül',   Suzul,   new SuzulBot(makeRng(99), 0.87),   g => g.score);
console.log('');
