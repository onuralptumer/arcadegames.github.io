import { Gecit } from './game.js?v=51ac2eb329';
import { GecitBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Gecit,
    makeBot: (rng) => new GecitBot(rng),
    field: { w: 200, h: 200 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map