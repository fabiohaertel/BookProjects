import { describe, it, expect } from 'vitest';
import {
  rectCenter,
  edgePoint,
  connectRects,
  lerp,
  offsetSegment,
  arrowHead,
  easeInOut,
} from '../src/public/js/geometry.js';

const box = { x: 0, y: 0, width: 100, height: 50 }; // center (50, 25)

describe('rectCenter', () => {
  it('returns the middle of the rect', () => {
    expect(rectCenter(box)).toEqual({ x: 50, y: 25 });
  });
});

describe('edgePoint', () => {
  it('hits the right edge when target is to the right', () => {
    expect(edgePoint(box, { x: 500, y: 25 })).toEqual({ x: 100, y: 25 });
  });

  it('hits the bottom edge when target is below', () => {
    expect(edgePoint(box, { x: 50, y: 500 })).toEqual({ x: 50, y: 50 });
  });

  it('hits the corner on a matching diagonal', () => {
    const p = edgePoint(box, { x: 150, y: 75 });
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(50);
  });

  it('pushes the point outward by padding', () => {
    expect(edgePoint(box, { x: 500, y: 25 }, 10)).toEqual({ x: 110, y: 25 });
  });

  it('returns the center when target equals center', () => {
    expect(edgePoint(box, { x: 50, y: 25 })).toEqual({ x: 50, y: 25 });
  });
});

describe('connectRects', () => {
  it('connects facing edges of two side-by-side rects', () => {
    const right = { x: 200, y: 0, width: 100, height: 50 };
    expect(connectRects(box, right)).toEqual({ start: { x: 100, y: 25 }, end: { x: 200, y: 25 } });
  });
});

describe('lerp', () => {
  it('interpolates between points', () => {
    expect(lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 });
  });
});

describe('offsetSegment', () => {
  it('shifts a horizontal segment perpendicular to its direction', () => {
    const seg = { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } };
    expect(offsetSegment(seg, 5)).toEqual({ start: { x: 0, y: 5 }, end: { x: 10, y: 5 } });
  });

  it('puts the reverse direction on the opposite side', () => {
    const fwd = offsetSegment({ start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }, 5);
    const back = offsetSegment({ start: { x: 10, y: 0 }, end: { x: 0, y: 0 } }, 5);
    expect(fwd.start.y).toBe(5);
    expect(back.start.y).toBe(-5);
  });
});

describe('arrowHead', () => {
  it('places both corners behind the tip, symmetric around the line', () => {
    const [l, r] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);
    expect(l.x).toBeLessThan(100);
    expect(r.x).toBeLessThan(100);
    expect(l.y).toBeCloseTo(-r.y);
  });
});

describe('easeInOut', () => {
  it('maps endpoints and midpoint', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
  });

  it('clamps out-of-range input', () => {
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });
});
