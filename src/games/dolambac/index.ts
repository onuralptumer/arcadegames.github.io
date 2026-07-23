import { Dolambac } from './game.js';
import { DolambacBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Dolambac,
  makeBot: (rng) => new DolambacBot(rng),
  field: { w: 200, h: 158 },
  demoField: { w: 200, h: 88 },
};
export default mod;
