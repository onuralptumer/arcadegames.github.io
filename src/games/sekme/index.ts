import { Sekme } from './game.js';
import { SekmeBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Sekme,
  makeBot: (rng) => new SekmeBot(rng),
  field: { w: 200, h: 300 },
  demoField: { w: 200, h: 88 },
};
export default mod;
