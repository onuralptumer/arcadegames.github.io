import { Nobet } from './game.js?v=4fc8ef5321';
import { NobetBot } from './bot.js?v=4fc8ef5321';
const mod = {
    Game: Nobet,
    makeBot: (rng) => new NobetBot(rng, 0.85),
    field: { w: 200, h: 260 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map