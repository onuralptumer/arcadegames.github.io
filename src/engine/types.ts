export type Mode = 'play' | 'demo';

export interface Palette {
  bg: string;
  fg: string;
  dim: string;
}

export type Dir = 'up' | 'down' | 'left' | 'right';

/**
 * Oyunun girdi kaynağından okuduğu tek şey.
 * Klavye, dokunma ve bot aynı şeyi üretir; oyun kimin oynadığını bilmez.
 */
export interface Intent {
  /** -1..1 yatay. */
  ax: number;
  /** -1..1 dikey. */
  ay: number;
  /** Ateş / zıpla / başlat. Basılı tutma. */
  action: boolean;
  /** Bu tick'te yeni basıldı mı. Zıplama gibi tek atımlık girdiler için. */
  pressed: boolean;
  /** Alan içinde 0..1 normalize konum. Yoksa null. */
  pointer: { x: number; y: number } | null;
  /** Tek atımlık yön. Klavyede ok basımı, mobilde kaydırma. Grid oyunları bunu okur. */
  dir: Dir | null;
}

/** Oyunun dışa açtığı okunabilir durum. Bot bunu okur. */
export type Snapshot = Record<string, number>;

export interface InputSource {
  attach(canvas: HTMLCanvasElement): void;
  detach(): void;
  poll(s: Snapshot): Intent;
}

export interface GameEvents {
  score(total: number): void;
  gameOver(total: number): void;
  levelUp(level: number): void;
}

export interface GameInit {
  ctx: CanvasRenderingContext2D;
  /** Mantıksal alan, piksel değil. Oyun buna göre yerleşir. */
  field: { w: number; h: number };
  mode: Mode;
  palette: Palette;
  /** Tohumlanmış RNG. Aynı tohum aynı oyun. Math.random asla kullanılmaz. */
  rng: () => number;
  input: InputSource;
  events: GameEvents;
}

export interface Game {
  init(o: GameInit): void;
  /** Sabit dt (saniye). Değişken delta asla girmez. */
  update(dt: number): void;
  /** alpha = son tick'ten bu yana geçen oran 0..1. İnterpolasyon için. */
  render(alpha: number): void;
  snapshot(): Snapshot;
  destroy(): void;
}

export interface GameClass {
  new (): Game;
}

/** Her oyun modülünün dışa açtığı şey. Manifest bunu bekler. */
export interface GameModule {
  Game: GameClass;
  makeBot(rng: () => number): InputSource;
  /** Mantıksal alan oranı. Kart ve oyun sayfası bunu kullanır. */
  field: { w: number; h: number };
  /** Önizlemede alan farklıysa. Yoksa field kullanılır. */
  demoField?: { w: number; h: number };
}
