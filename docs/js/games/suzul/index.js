import { Suzul } from './game.js?v=51ac2eb329';
import { SuzulBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Suzul,
    makeBot: (rng) => new SuzulBot(rng, 0.87),
    field: { w: 200, h: 260 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map