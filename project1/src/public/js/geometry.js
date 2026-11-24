// Pure geometry helpers (no DOM) used to draw arrows between containers.
// A rect is { x, y, width, height }; a point is { x, y }.

export function rectCenter(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Point where the segment from the rect's center toward `target` crosses
 * the rect's border, pushed out by `padding` pixels.
 */
export function edgePoint(rect, target, padding = 0) {
  const c = rectCenter(rect);
  const dx = target.x - c.x;
  const dy = target.y - c.y;
  if (dx === 0 && dy === 0) return c;

  const halfW = rect.width / 2;
  const halfH = rect.height / 2;
  const scaleX = dx === 0 ? Infinity : halfW / Math.abs(dx);
  const scaleY = dy === 0 ? Infinity : halfH / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);

  const len = Math.hypot(dx, dy);
  const extra = padding / len;
  return { x: c.x + dx * (scale + extra), y: c.y + dy * (scale + extra) };
}

/** Segment connecting the borders of two rects. */
export function connectRects(fromRect, toRect, padding = 0) {
  const start = edgePoint(fromRect, rectCenter(toRect), padding);
  const end = edgePoint(toRect, rectCenter(fromRect), padding);
  return { start, end };
}

export function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Shift a segment sideways (perpendicular) by `offset` pixels. */
export function offsetSegment({ start, end }, offset) {
  const len = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  const nx = -(end.y - start.y) / len;
  const ny = (end.x - start.x) / len;
  return {
    start: { x: start.x + nx * offset, y: start.y + ny * offset },
    end: { x: end.x + nx * offset, y: end.y + ny * offset },
  };
}

/** The two base corners of an arrow head whose tip is at `end`. */
export function arrowHead(start, end, size = 10, spread = Math.PI / 7) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  return [
    { x: end.x - size * Math.cos(angle - spread), y: end.y - size * Math.sin(angle - spread) },
    { x: end.x - size * Math.cos(angle + spread), y: end.y - size * Math.sin(angle + spread) },
  ];
}

/** Ease-in-out for smooth packet motion; t in [0, 1]. */
export function easeInOut(t) {
  const c = Math.min(Math.max(t, 0), 1);
  return c < 0.5 ? 2 * c * c : 1 - (-2 * c + 2) ** 2 / 2;
}
