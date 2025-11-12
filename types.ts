
export type BrushDirection = 'up' | 'down';

export interface BrushSettings {
  size: number;
  strength: number;
  direction: BrushDirection;
}
