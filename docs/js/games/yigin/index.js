import { Yigin } from './game.js?v=4fc8ef5321';
import { YiginBot } from './bot.js?v=4fc8ef5321';
const mod = {
    Game: Yigin,
    makeBot: (rng) => new YiginBot(rng, 0.85),
    field: { w: 200, h: 400 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map