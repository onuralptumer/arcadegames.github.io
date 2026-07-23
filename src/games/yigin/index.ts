import { Yigin } from './game.js';
import { YiginBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Yigin,
  makeBot: (rng) => new YiginBot(rng, 0.85),
  field: { w: 200, h: 400 },
  demoField: { w: 200, h: 88 },
};
export default mod;
