import { Katla } from './game.js?v=51ac2eb329';
import { KatlaBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Katla,
    makeBot: (rng) => new KatlaBot(rng),
    field: { w: 200, h: 200 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map