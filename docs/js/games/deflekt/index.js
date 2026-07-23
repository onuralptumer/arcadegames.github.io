import { Deflekt } from './game.js?v=51ac2eb329';
import { DeflektBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Deflekt,
    makeBot: (rng) => new DeflektBot(rng, 0.8),
    field: { w: 200, h: 280 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map