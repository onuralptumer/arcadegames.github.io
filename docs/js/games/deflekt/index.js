import { Deflekt } from './game.js?v=4fc8ef5321';
import { DeflektBot } from './bot.js?v=4fc8ef5321';
const mod = {
    Game: Deflekt,
    makeBot: (rng) => new DeflektBot(rng, 0.8),
    field: { w: 200, h: 280 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map