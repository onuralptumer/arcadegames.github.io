import { Kivrim } from './game.js';
import { KivrimBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Kivrim,
  makeBot: (rng) => new KivrimBot(rng, 0.93),
  field: { w: 200, h: 200 },
  demoField: { w: 200, h: 88 },
};
export default mod;
