export interface Point {
  x: number;
  y: number;
}

/**
 * 3차 베지에(Cubic Bezier) 곡선상의 특정 t(0 ~ 1) 위치의 2D 좌표를 구합니다.
 */
export function getBezierPoint(
  t: number,
  x0: number,
  y0: number,
  cp1x: number,
  cp1y: number,
  cp2x: number,
  cp2y: number,
  x1: number,
  y1: number
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const x = mt3 * x0 + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * x1;
  const y = mt3 * y0 + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * y1;

  return { x, y };
}

/**
 * 특정 마우스 좌표(px, py)와 베지에 곡선 간의 최소 거리(픽셀 단위)를 계산합니다.
 * 실시간성을 위해 30개의 점으로 곡선을 이산화하여 최단 거리를 탐색합니다.
 */
export function distanceToBezier(
  px: number,
  py: number,
  x0: number,
  y0: number,
  cp1x: number,
  cp1y: number,
  cp2x: number,
  cp2y: number,
  x1: number,
  y1: number,
  steps = 25
): number {
  let minDistanceSq = Infinity;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pt = getBezierPoint(t, x0, y0, cp1x, cp1y, cp2x, cp2y, x1, y1);
    const dx = px - pt.x;
    const dy = py - pt.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
    }
  }

  return Math.sqrt(minDistanceSq);
}

/**
 * 두 좌표 간의 거리에 기반해 Cubic Bezier 곡선의 제어점 Y좌표 솟구침 높이를 계산합니다.
 */
export function getBezierHeight(x0: number, x1: number): number {
  const dx = Math.abs(x1 - x0);
  return Math.max(50, Math.min(280, dx * 0.28));
}
