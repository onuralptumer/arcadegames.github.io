import { Kivrim } from './game.js?v=51ac2eb329';
import { KivrimBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Kivrim,
    makeBot: (rng) => new KivrimBot(rng, 0.93),
    field: { w: 200, h: 200 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map