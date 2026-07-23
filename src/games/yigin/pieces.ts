/** Parçalar kendi kutusunda tanımlı; döndürme (x,y) → (size-1-y, x) ile hesaplanır. */
export interface Piece {
  size: number;
  cells: [number, number][];
}

export const PIECES: Piece[] = [
  { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] }, // I
  { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] }, // J
  { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] }, // L
  { size: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] }, // O
  { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] }, // S
  { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] }, // T
  { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] }, // Z
];

/** Bir parçanın verilen dönüş durumundaki hücreleri. */
export function rotated(p: Piece, r: number): [number, number][] {
  let cells = p.cells;
  for (let i = 0; i < ((r % 4) + 4) % 4; i++) {
    cells = cells.map(([x, y]) => [p.size - 1 - y, x] as [number, number]);
  }
  return cells;
}

/** Duvara sıkışan dönüşü kurtarmak için denenecek kaydırmalar, sırayla. */
export const KICKS: [number, number][] = [
  [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1],
];
