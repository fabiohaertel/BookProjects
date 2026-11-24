// Draws arrows between DOM containers on an overlaid canvas and animates packets.
import { connectRects, offsetSegment, arrowHead, lerp, easeInOut } from './geometry.js';

const LANE_OFFSET = 8; // px between the request and the response lane of a connection
const EDGE_PADDING = 6; // px gap between arrow ends and the container border

export class Diagram {
  /**
   * @param {HTMLElement} root     element the canvas covers (positioned)
   * @param {HTMLCanvasElement} canvas
   * @param {Record<string, HTMLElement>} nodes   node id -> container element
   * @param {Array<[string, string]>} connections pairs of node ids
   */
  constructor(root, canvas, nodes, connections) {
    this.root = root;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = nodes;
    this.connections = connections;
    this.rects = {};
    this.state = { activeStep: null, packet: null };

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(root);
    for (const el of Object.values(nodes)) this.resizeObserver.observe(el);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.draw());
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const origin = this.root.getBoundingClientRect();
    this.canvas.width = Math.round(origin.width * dpr);
    this.canvas.height = Math.round(origin.height * dpr);
    this.canvas.style.width = `${origin.width}px`;
    this.canvas.style.height = `${origin.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const [id, el] of Object.entries(this.nodes)) {
      const r = el.getBoundingClientRect();
      this.rects[id] = { x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height };
    }
    this.draw();
  }

  /** Directed lane from one node to another (request and response use opposite sides). */
  lane(from, to) {
    return offsetSegment(connectRects(this.rects[from], this.rects[to], EDGE_PADDING), LANE_OFFSET);
  }

  colors() {
    const s = getComputedStyle(this.root);
    const v = (name) => s.getPropertyValue(name).trim();
    return {
      line: v('--arrow'),
      active: v('--accent'),
      packet: v('--accent'),
      packetText: v('--accent-contrast'),
    };
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const colors = this.colors();
    const active = this.state.activeStep;

    for (const [a, b] of this.connections) {
      for (const [from, to] of [[a, b], [b, a]]) {
        const isActive = Boolean(active && active.from === from && active.to === to);
        this.drawArrow(this.lane(from, to), isActive ? colors.active : colors.line, isActive ? 2.5 : 1.5);
      }
    }

    if (this.state.packet) this.drawPacket(this.state.packet, colors);
  }

  drawArrow({ start, end }, color, lineWidth) {
    const { ctx } = this;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    const [left, right] = arrowHead(start, end, 10);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fill();
  }

  drawPacket({ from, to, t, label, stepId }, colors) {
    const { ctx } = this;
    const { start, end } = this.lane(from, to);
    const p = lerp(start, end, easeInOut(t));

    ctx.font = '600 12px system-ui, sans-serif';
    const text = `${stepId}. ${label}`;
    const w = ctx.measureText(text).width + 16;
    const h = 22;

    ctx.fillStyle = colors.packet;
    ctx.beginPath();
    ctx.roundRect(p.x - w / 2, p.y - h / 2, w, h, 11);
    ctx.fill();

    ctx.fillStyle = colors.packetText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, p.x, p.y + 0.5);
  }

  /** Animate a packet along the step's lane. Resolves when it arrives. */
  animateStep(step, label, duration = 1400) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.state.activeStep = step;

    return new Promise((resolve) => {
      const startTime = performance.now();
      const frame = (now) => {
        const t = reduceMotion ? 1 : Math.min((now - startTime) / duration, 1);
        this.state.packet = { from: step.from, to: step.to, t, label, stepId: step.id };
        this.draw();
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  clear() {
    this.state = { activeStep: null, packet: null };
    this.draw();
  }
}
