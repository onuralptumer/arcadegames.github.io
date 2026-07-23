import { Suzul } from './game.js?v=4fc8ef5321';
import { SuzulBot } from './bot.js?v=4fc8ef5321';
const mod = {
    Game: Suzul,
    makeBot: (rng) => new SuzulBot(rng, 0.87),
    field: { w: 200, h: 260 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map