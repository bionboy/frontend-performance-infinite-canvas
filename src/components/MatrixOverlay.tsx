import { useMemo } from "react";

export function MatrixOverlay(props: { seed: number }) {
  const size = 140;
  const cells = useMemo(() => {
    const out: string[] = [];
    const base = props.seed % 100000;
    for (let i = 0; i < size * size; i += 1) {
      const v = (base * 1103515245 + i * 12345) >>> 0;
      const ch = String.fromCharCode(33 + (v % 90));
      out.push(ch);
    }
    return out;
  }, [props.seed]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.06,
        fontSize: 10,
        lineHeight: "10px",
        padding: 12,
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        userSelect: "none",
      }}
    >
      {cells.join("")}
    </div>
  );
}
