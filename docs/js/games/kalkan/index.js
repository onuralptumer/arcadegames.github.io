import { Kalkan } from './game.js?v=51ac2eb329';
import { KalkanBot } from './bot.js?v=51ac2eb329';
const mod = {
    Game: Kalkan,
    makeBot: (rng) => new KalkanBot(rng),
    field: { w: 200, h: 160 },
    demoField: { w: 200, h: 88 },
};
export default mod;
//# sourceMappingURL=index.js.map