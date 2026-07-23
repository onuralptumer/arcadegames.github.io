import { Katla } from './game.js';
import { KatlaBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Katla,
  makeBot: (rng) => new KatlaBot(rng),
  field: { w: 200, h: 200 },
  demoField: { w: 200, h: 88 },
};
export default mod;
