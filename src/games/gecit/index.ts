import { Gecit } from './game.js';
import { GecitBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Gecit,
  makeBot: (rng) => new GecitBot(rng),
  field: { w: 200, h: 200 },
  demoField: { w: 200, h: 88 },
};
export default mod;
