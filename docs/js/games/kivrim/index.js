import { Kivrim } from './game.js?v=4fc8ef5321';
import { KivrimBot } from './bot.js?v=4fc8ef5321';
const mod = {
    Game: Kivrim,
    makeBot: (rng) => new KivrimBot(rng, 0.93),
    field: { w: 200, h: 200 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map