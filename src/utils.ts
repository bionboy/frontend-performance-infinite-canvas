import type { NodeRect } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomColor(seed: number): string {
  const palette = [
    "#f7a13d",
    "#f05f42",
    "#e9d96b",
    "#78c1a3",
    "#83a8d9",
    "#ef8fb1",
    "#c9b98f",
    "#f3ede1",
  ];

  return palette[seed % palette.length];
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
