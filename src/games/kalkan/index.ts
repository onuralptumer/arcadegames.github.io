import { Kalkan } from './game.js';
import { KalkanBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Kalkan,
  makeBot: (rng) => new KalkanBot(rng),
  field: { w: 200, h: 160 },
  demoField: { w: 200, h: 88 },
};
export default mod;
