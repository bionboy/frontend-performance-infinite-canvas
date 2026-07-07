import { useEditorStore } from "../store";
import { useRenderCount } from "../hooks/rendering/useRenderCount";
import React from "react";

export interface ShapeProps {
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
      data-node-id={props.nodeId}
      onPointerDown={(e) => props.onPointerDown(e, props.nodeId)}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        background: node.fill,
        outline: props.isSelected ? "2px dashed #e6a23a" : "1px solid rgba(29, 28, 24, 0.22)",
        outlineOffset: props.isSelected ? 2 : 0,
        borderRadius: 2,
        userSelect: "none",
        touchAction: "none",
      }}
      title={node.name}
    />
  );
});
