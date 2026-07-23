import { Katla } from './game.js?v=4fc8ef5321';
import { KatlaBot } from './bot.js?v=4fc8ef5321';
const mod = {
    Game: Katla,
    makeBot: (rng) => new KatlaBot(rng),
    field: { w: 200, h: 200 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map