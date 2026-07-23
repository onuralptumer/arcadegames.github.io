import { Kivrim } from './game.js';
import { KivrimBot } from './bot.js';
const mod = {
    Game: Kivrim,
    makeBot: (rng) => new KivrimBot(rng, 0.93),
    field: { w: 200, h: 200 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map