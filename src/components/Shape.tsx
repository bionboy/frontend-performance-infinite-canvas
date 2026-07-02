import type { NodeRect } from "../types";
import { useEditorStore } from "../store";
import { useRenderCount } from "../useRenderCount";
import React from "react";

export interface ShapeProps {
  // node: NodeRect;
  nodeId: string;
  isSelected: boolean;
  isRenderLoggingEnabled: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => void;
}

export const Shape = React.memo(function Shape(props: ShapeProps) {
  const node = useEditorStore((s) => s.doc.nodeById[props.nodeId]);
  useRenderCount(`Shape:${props.nodeId}`, props.isRenderLoggingEnabled);

  return (
    <div
      onPointerDown={(e) => props.onPointerDown(e, props.nodeId)}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        background: node.fill,
        outline: props.isSelected ? "2px solid #111" : "1px solid rgba(0,0,0,0.12)",
        borderRadius: 2,
        userSelect: "none",
        touchAction: "none",
      }}
      title={node.name}
    />
  );
});
