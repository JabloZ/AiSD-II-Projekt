import { Point } from './types';

export function generateRandomPolygon(
  width: number,
  height: number,
  numVertices: number = 10
): Point[] {
  const cx = width / 2;
  const cy = height / 2;
  const minR = Math.min(width, height) * 0.25;
  const maxR = Math.min(width, height) * 0.42;

  const points: Point[] = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = (2 * Math.PI * i) / numVertices - Math.PI / 2;
    const jitter = (Math.random() - 0.5) * ((2 * Math.PI) / numVertices) * 0.6;
    const r = minR + Math.random() * (maxR - minR);
    points.push({
      x: cx + r * Math.cos(angle + jitter),
      y: cy + r * Math.sin(angle + jitter),
    });
  }
  return points;
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const { x, y } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function randomPointInPolygon(
  polygon: Point[],
  width: number,
  height: number,
  maxTries = 500
): Point | null {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  for (let i = 0; i < maxTries; i++) {
    const pt: Point = {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    };
    if (isPointInPolygon(pt, polygon)) return pt;
  }
  return null;
}

export function polygonPerimeter(polygon: Point[]): number {
  let len = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    len += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return len;
}
