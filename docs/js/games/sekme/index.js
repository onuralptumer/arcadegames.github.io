import { Sekme } from './game.js?v=51ac2eb329';
import { SekmeBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Sekme,
    makeBot: (rng) => new SekmeBot(rng),
    field: { w: 200, h: 300 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map