import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Oyun sayfaları elde yazılmaz — manifest tek doğruluk kaynağı.
 * Yeni oyun eklemek: manifest'e bir satır + `npm run pages`.
 */
const src = await readFile(resolve(root, 'src/manifest.ts'), 'utf8');

// Derlenmiş manifest'i okumak yerine kaynağı ayrıştırmak, `tsc`'den önce de
// çalışabilmesi için. Alan sırası manifest'teki ile aynı varsayılır.
const games = [];
const re =
  /slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*kind:\s*'([^']+)',\s*blurb:\s*'([^']+)',\s*controls:\s*'([^']+)',\s*solid:\s*'([^']+)',\s*tint:\s*'([^']+)',\s*ready:\s*(true|false)/g;
let m;
while ((m = re.exec(src))) {
  games.push({
    slug: m[1],
    name: m[2],
    kind: m[3],
    blurb: m[4],
    controls: m[5],
    solid: m[6],
    ready: m[8] === 'true',
  });
}

// Proje sayfasinda site kok dizinde degil (kullanici.github.io/<repo>/).
// Adres package.json'daki "homepage" alanindan okunur — npm'in standart yeri,
// bir kez yazilir. SITE_URL ortam degiskeni onu ezer.
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const SITE_URL = (process.env.SITE_URL || pkg.homepage || '').replace(/\/+$/, '');

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const page = (g) => `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(g.name)} — tarayıcıda ücretsiz oyna</title>
<meta name="description" content="${esc(g.blurb)} Kurulum yok, kayıt yok.">
<meta name="theme-color" content="${g.solid}">
${SITE_URL ? `<link rel="canonical" href="${SITE_URL}/oyun/${g.slug}.html">` : ''}
<link rel="stylesheet" href="../style.css">
<style>:root{--accent:${g.solid}}</style>
</head>
<body data-game="${g.slug}">
<div class="wrap">
  <nav class="top">
    <a class="top__logo" href="../index.html">arcade</a>
    <span class="top__note">${esc(g.kind)}</span>
  </nav>

  <div class="lede">
    <h1>${esc(g.name)}</h1>
    <p>${esc(g.blurb)}</p>
  </div>

  <main class="play">
    <div class="stage-wrap">
      <canvas id="stage" tabindex="0" aria-label="${esc(g.name)} oyun alanı"></canvas>
      <div class="overlay" id="overlay" hidden>
        <p>Skorun</p>
        <span class="num" id="final">0</span>
        <button class="btn" id="again">Yeniden oyna</button>
      </div>
      <div class="hud">
        <div><span class="hud__label">skor</span><span class="num" id="score">0</span></div>
        <div><span class="hud__label">en iyi</span><span class="num" id="best">0</span></div>
      </div>
    </div>

    <section class="tips">
      <h2>Kontroller</h2>
      <p>${esc(g.controls)}</p>
    </section>
  </main>

  <a class="back" href="../index.html">← tüm oyunlar</a>
</div>
<script type="module" src="../js/pages/game.js"></script>
</body>
</html>
`;

await mkdir(resolve(root, 'docs/oyun'), { recursive: true });

let n = 0;
for (const g of games) {
  if (!g.ready) continue;
  await writeFile(resolve(root, `docs/oyun/${g.slug}.html`), page(g), 'utf8');
  n++;
}

// Sitemap de manifestten üretilir; elle güncellenen bir liste daha olmasın.
const urls = ['/index.html', ...games.filter((g) => g.ready).map((g) => `/oyun/${g.slug}.html`)]
  .map((u) => SITE_URL + u);
await writeFile(
  resolve(root, 'docs/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`,
  'utf8'
);

console.log(`${n} oyun sayfası + sitemap üretildi (${games.length} kayıt).`);
