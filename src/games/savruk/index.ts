import { Savruk } from './game.js';
import { SavrukBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Savruk,
  makeBot: (rng) => new SavrukBot(rng),
  field: { w: 200, h: 200 },
  demoField: { w: 200, h: 88 },
};
export default mod;
