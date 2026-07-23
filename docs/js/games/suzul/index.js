import { Suzul } from './game.js';
import { SuzulBot } from './bot.js';
const mod = {
    Game: Suzul,
    makeBot: (rng) => new SuzulBot(rng, 0.87),
    field: { w: 200, h: 260 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map