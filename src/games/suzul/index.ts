import { Suzul } from './game.js';
import { SuzulBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Suzul,
  makeBot: (rng) => new SuzulBot(rng, 0.87),
  field: { w: 200, h: 260 },
  demoField: { w: 200, h: 88 },
};
export default mod;
