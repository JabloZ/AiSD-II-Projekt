export interface Point {
  x: number;
  y: number;
}

export interface House {
  id: string;
  x: number;
  y: number;
  dwarfCount: number;
}

export interface Mine {
  id: string;
  x: number;
  y: number;
  mineralType: string;
  capacity: number;
}

export type DragTarget =
  | { type: 'border-vertex'; index: number }
  | { type: 'house'; id: string }
  | { type: 'mine'; id: string }
  | null;
