import { Kume } from './game.js';
import { KumeBot } from './bot.js';
import type { GameModule } from '../../engine/types.js';

const mod: GameModule = {
  Game: Kume,
  makeBot: (rng) => new KumeBot(rng),
  field: { w: 200, h: 260 },
  demoField: { w: 200, h: 88 },
};
export default mod;
