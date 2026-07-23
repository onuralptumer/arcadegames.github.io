import { Kume } from './game.js?v=51ac2eb329';
import { KumeBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Kume,
    makeBot: (rng) => new KumeBot(rng),
    field: { w: 200, h: 260 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map