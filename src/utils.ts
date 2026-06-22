import type { NodeRect } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomColor(seed: number): string {
  const r = (seed * 97) % 255;
  const g = (seed * 57) % 255;
  const b = (seed * 17) % 255;
  return `rgb(${r}, ${g}, ${b})`;
}

export function createNodes(count: number): NodeRect[] {
  const nodes: NodeRect[] = [];
  const cols = Math.max(1, Math.floor(Math.sqrt(count)));
  const gap = 6;
  const baseW = 18;
  const baseH = 18;

  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodes.push({
      id: `node_${i}`,
      name: `Rect ${i}`,
      x: col * (baseW + gap),
      y: row * (baseH + gap),
      w: baseW,
      h: baseH,
      fill: randomColor(i + 1),
    });
  }

  return nodes;
}

export function expensiveDerivedWork(nodes: NodeRect[]): number {
  let acc = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i];
    acc += Math.sin(n.x * 0.001) * Math.cos(n.y * 0.001) + (n.w + n.h) * 0.00001;
  }
  return acc;
}
