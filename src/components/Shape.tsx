import type { NodeRect } from "../types";
import { useRenderCount } from "../useRenderCount";

export interface ShapeProps {
  node: NodeRect;
  isSelected: boolean;
  isRenderLoggingEnabled: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export function Shape(props: ShapeProps) {
  useRenderCount(`Shape:${props.node.id}`, props.isRenderLoggingEnabled);

  return (
    <div
      onPointerDown={props.onPointerDown}
      style={{
        position: "absolute",
        left: props.node.x,
        top: props.node.y,
        width: props.node.w,
        height: props.node.h,
        background: props.node.fill,
        outline: props.isSelected ? "2px solid #111" : "1px solid rgba(0,0,0,0.12)",
        borderRadius: 2,
        userSelect: "none",
        touchAction: "none",
      }}
      title={props.node.id}
    />
  );
}
