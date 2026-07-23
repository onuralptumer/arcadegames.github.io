import { Nobet } from './game.js?v=51ac2eb329';
import { NobetBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Nobet,
    makeBot: (rng) => new NobetBot(rng, 0.85),
    field: { w: 200, h: 260 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map