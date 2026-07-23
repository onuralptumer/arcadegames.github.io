import { Nobet } from './game.js';
import { NobetBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Nobet,
  makeBot: (rng) => new NobetBot(rng, 0.85),
  field: { w: 200, h: 260 },
  demoField: { w: 200, h: 88 },
};
export default mod;
