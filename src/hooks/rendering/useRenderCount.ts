import { useEffect, useRef } from "react";

export function useRenderCount(name: string, isEnabled: boolean): void {
  const countRef = useRef(0);
  countRef.current += 1;

  useEffect(() => {
    if (!isEnabled) return;
    console.log(`[render] ${name}:`, countRef.current);
  });
}
