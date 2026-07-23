import { Deflekt } from './game.js';
import { DeflektBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Deflekt,
  makeBot: (rng) => new DeflektBot(rng, 0.8),
  field: { w: 200, h: 280 },
  demoField: { w: 200, h: 88 },
};
export default mod;
