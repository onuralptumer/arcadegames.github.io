# arcade

Tarayıcıda çalışan kısa oyunlar. Bundler yok, framework yok, runtime bağımlılığı yok.
Tek geliştirme aracı `tsc`; çıktısı doğrudan tarayıcıya giden ESM modülleri.

## Çalıştır

```bash
npm install      # tek bağımlılık: typescript
npm run build    # src/*.ts → docs/js/*.js  +  manifest → docs/oyun/*.html
npm run serve    # http://localhost:8080
```

Geliştirirken `npm run dev` (tsc --watch) yeterli. Sayfayı yenile, o kadar.

## Yayınla

Yayınlanan klasör `docs/`. GitHub Pages'in *branch* modu yalnızca kök dizinden
veya `/docs`'tan yayın yapabildiği için klasör adı bu — keyfi bir isim seçilemiyor.

### Bir kez ayarla

1. `package.json` → `homepage` alanına gerçek adresi yaz
   (`https://kullanici.github.io/arcade`). Bu adres yalnızca `canonical` ve
   `sitemap.xml` için kullanılır; sayfa bağlantılarının tamamı göreli, o yüzden
   site hangi alt dizinde durursa dursun çalışır.
2. Settings → Pages → Source: **Deploy from a branch** → `main` / `/docs`

### Her değişiklikten sonra

```bash
npm run build     # tsc + sayfa üretimi, ikisi tek komutta
git add docs && git commit -m "..." && git push
```

**`docs/` klasörü commit edilmek zorunda.** GitHub Pages kendiliğinden derleme
yapmaz; `docs/js` depoda yoksa site açılır ama oyunlar görünmez — kartlar
JavaScript tarafından üretiliyor.

### Derlemeyi unutmaya karşı

Bu yaklaşımın tek gerçek riski, kaynağı değiştirip `npm run build` çalıştırmadan
commit etmek. İki koruma var:

- `npm run check` — yeniden derler, `docs/` kaynakla uyumsuzsa hata verir
- `.github/workflows/check.yml` — aynı kontrolü her it ve PR'da koşar
  (Pages ayarına dokunmaz, yalnızca uyarır)

### Cloudflare Pages / Netlify

Build komutu `npm run build`, çıktı dizini `docs`.

## Yapı

```
src/
  engine/
    types.ts       Game / InputSource / Intent sözleşmesi
    rng.ts         mulberry32 — tohumlanmış, Math.random yok
    scheduler.ts   TÜM sayfa için tek requestAnimationFrame
    input.ts       klavye + işaretçi + kaydırma
    mount.ts       DPR, IntersectionObserver, ResizeObserver, reduced-motion
  games/<slug>/
    game.ts        oyun mantığı — alan boyutundan bağımsız
    bot.ts         önizleme sürücüsü
    index.ts       GameModule dışa aktarımı
  manifest.ts      katalog — tek doğruluk kaynağı
  pages/           ana sayfa + oyun sayfası bağlayıcıları
docs/              yayınlanan statik çıktı — COMMIT EDİLİR
sim/               tarayıcısız denge testleri
tools/pages.mjs    manifest → HTML sayfaları + sitemap
```

## Yeni oyun eklemek

1. `src/games/<slug>/` aç: `game.ts` (`Game` arayüzü), `bot.ts` (`InputSource`),
   `index.ts` (`GameModule` default export)
2. `src/manifest.ts`'e bir satır ekle
3. `npm run build`

Oyun sayfası, kart, önizleme, sitemap ve meta etiketleri kendiliğinden oluşur.
`engine/` klasörüne dokunman gerekiyorsa arayüz eksik demektir — oyuna özel kod
engine'e sızmamalı.

## Tasarım kuralları

- **İki ton.** Her oyunun tek aksan rengi var. Kartta zemin o renk, figür açık tonu;
  oyun sayfasında tam tersi. Üçüncü renk yok.
- **Kabuk nötr.** Renk yalnızca oyuna ait.
- **Önizleme minyatür değil.** Kartlar oyunun renkli küçük hâli değil, iki tonlu
  silueti — altı renkli minyatür aynı anda oynarsa ana sayfa gürültü olur.

## Teknik notlar

- Sabit adımlı döngü (`Runner`). Değişken delta cihazdan cihaza farklı fizik üretir;
  ayrıca determinizm ileride replay tabanlı skor doğrulamayı mümkün kılar.
- Sayfadaki tüm canvas'lar tek `requestAnimationFrame` üzerinden sürülür.
- Önizlemeler 20 tick/sn ve DPR 1; oyun 60 tick/sn ve DPR ≤ 2.
- Ekranda olmayan kart çalışmaz; sekme arkaplana düşünce her şey durur.
- `prefers-reduced-motion` açıksa önizleme tek kare çizip durur.
- Skorlar `localStorage`'da. Global tablo gerekirse tek uç nokta eklenir,
  mimari değişmez.
