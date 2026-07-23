import type { GameModule } from './engine/types.js';

export interface Entry {
  slug: string;
  name: string;
  kind: string;
  /** Oyun sayfası ve meta description için tek cümle. */
  blurb: string;
  /** Kontrol ipucu. */
  controls: string;
  solid: string;
  tint: string;
  /** Hazır değilse kart pasif görünür, önizleme çalışmaz. */
  ready: boolean;
  load?: () => Promise<{ default: GameModule }>;
}

/**
 * Yeni oyun eklemek: klasörü aç, buraya bir satır ekle, `npm run pages` çalıştır.
 * Başka hiçbir dosyaya dokunulmaz.
 */
export const GAMES: Entry[] = [
  {
    slug: 'deflekt',
    name: 'Deflekt',
    kind: 'Tuğla kırma',
    blurb: 'Topu paletle sektir, tüm tuğlaları kır. Her seviyede hızlanır.',
    controls: 'Fare, dokunma veya ok tuşları. Boşluk fırlatır.',
    solid: '#D85A30',
    tint: '#F7D3C6',
    ready: true,
    load: () => import('./games/deflekt/index.js'),
  },
  {
    slug: 'kivrim',
    name: 'Kıvrım',
    kind: 'Yılan',
    blurb: 'Yemi topla, uzadıkça kendine çarpmadan yol bul.',
    controls: 'Ok tuşları veya kaydırma.',
    solid: '#1D9E75',
    tint: '#B4E7D6',
    ready: true,
    load: () => import('./games/kivrim/index.js'),
  },
  {
    slug: 'suzul',
    name: 'Süzül',
    kind: 'Tek tuş',
    blurb: 'Tek tuşla yüksekliğini koru, boşluklardan geç. Sonu yok.',
    controls: 'Boşluk, tıklama veya dokunma.',
    solid: '#EF9F27',
    tint: '#FBDCA9',
    ready: true,
    load: () => import('./games/suzul/index.js'),
  },
  {
    slug: 'yigin',
    name: 'Yığın',
    kind: 'Blok dizme',
    blurb: 'Düşen blokları döndür, sıraları tamamla. Her on satırda hızlanır.',
    controls: 'Sol/sağ taşır. Yukarı ok, boşluk veya dokunma döndürür. Aşağı ok sert düşürür.',
    solid: '#7F77DD',
    tint: '#D6D3F8',
    ready: true,
    load: () => import('./games/yigin/index.js'),
  },
  {
    slug: 'nobet',
    name: 'Nöbet',
    kind: 'Uzay atışı',
    blurb: 'Dalgalar hâlinde gelenleri durdur. Her dalga daha hızlı.',
    controls: 'Sol/sağ ok veya parmağını sürükle. Boşluk ateş eder.',
    solid: '#378ADD',
    tint: '#C4DDF6',
    ready: true,
    load: () => import('./games/nobet/index.js'),
  },
  {
    slug: 'katla',
    name: 'Katla',
    kind: 'Sayı birleştirme',
    blurb: 'Aynı sayıları birleştir, tahta dolmadan en büyüğe ulaş.',
    controls: 'Ok tuşları veya kaydırma.',
    solid: '#D4537E',
    tint: '#F6CDDB',
    ready: true,
    load: () => import('./games/katla/index.js'),
  },
  {
    slug: 'savruk',
    name: 'Savruk',
    kind: 'Uzay avı',
    blurb: 'Ataleti olan bir gemiyle kayaları parçala. Kenardan çıkan öbür kenardan girer.',
    controls: 'Sol/sağ döndürür, yukarı iter, boşluk ateş eder. Dokunmatikte gemi parmağına döner.',
    solid: '#5E5E6B',
    tint: '#D2D2DA',
    ready: true,
    load: () => import('./games/savruk/index.js'),
  },
  {
    slug: 'dolambac',
    name: 'Dolambaç',
    kind: 'Labirent',
    blurb: 'Yemleri topla, kovalayanlardan kaç. Güç yemi onları geçici olarak zayıflatır.',
    controls: 'Ok tuşları veya kaydırma.',
    solid: '#C4A02C',
    tint: '#F2E1AE',
    ready: true,
    load: () => import('./games/dolambac/index.js'),
  },
  {
    slug: 'kume',
    name: 'Küme',
    kind: 'Kabarcık atma',
    blurb: 'Aynı tondan üç tanesini birleştir. Bağlantısı kopan küme aşağı düşer.',
    controls: 'Nişan almak için sürükle, atmak için bırak. Ok tuşları da çalışır.',
    solid: '#2B8C8C',
    tint: '#B7E2E2',
    ready: true,
    load: () => import('./games/kume/index.js'),
  },
  {
    slug: 'gecit',
    name: 'Geçit',
    kind: 'Şerit geçme',
    blurb: 'Trafiğin arasından karşıya geç. Her geçişte şeritler hızlanır.',
    controls: 'Ok tuşları veya kaydırma.',
    solid: '#8C5A3C',
    tint: '#E4C9B4',
    ready: true,
    load: () => import('./games/gecit/index.js'),
  },
  {
    slug: 'kalkan',
    name: 'Kalkan',
    kind: 'Savunma',
    blurb: 'Gelenleri havada patlat, üsleri koru. Patlamalar zincirleme tetiklenir.',
    controls: 'Patlatmak istediğin yere tıkla veya dokun.',
    solid: '#A63D5A',
    tint: '#EFC0CE',
    ready: true,
    load: () => import('./games/kalkan/index.js'),
  },
  {
    slug: 'sekme',
    name: 'Sekme',
    kind: 'Tırmanış',
    blurb: 'Platformdan platforma sek, düşmeden yüksel. Sonu yok.',
    controls: 'Sol/sağ ok veya parmağını sürükle. Zıplama kendiliğinden.',
    solid: '#4C8C3A',
    tint: '#CBE5C0',
    ready: true,
    load: () => import('./games/sekme/index.js'),
  },
];

export const bySlug = (s: string) => GAMES.find((g) => g.slug === s);
