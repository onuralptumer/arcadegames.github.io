import { Dolambac } from './game.js?v=51ac2eb329';
import { DolambacBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Dolambac,
    makeBot: (rng) => new DolambacBot(rng),
    field: { w: 200, h: 158 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map