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
];

export const bySlug = (s: string) => GAMES.find((g) => g.slug === s);
