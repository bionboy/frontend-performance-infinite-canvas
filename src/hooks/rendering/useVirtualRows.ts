import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useVirtualRows<T>(options: {
  rows: T[];
  rowHeight: number;
  overscan: number;
  resetKey?: unknown;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const currentViewport = viewport;

    function updateHeight(): void {
      setViewportHeight(currentViewport.clientHeight);
    }

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(currentViewport);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollTop = 0;
    setScrollTop(0);
  }, [options.resetKey]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>): void => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / options.rowHeight) - options.overscan,
  );
  const endIndex = Math.min(
    options.rows.length,
    Math.ceil((scrollTop + viewportHeight) / options.rowHeight) + options.overscan,
  );

  const virtualRows = useMemo(
    () =>
      options.rows.slice(startIndex, endIndex).map((row, index) => ({
        row,
        index: startIndex + index,
        offsetY: (startIndex + index) * options.rowHeight,
      })),
    [endIndex, options.rowHeight, options.rows, startIndex],
  );

  return {
    handleScroll,
    totalHeight: options.rows.length * options.rowHeight,
    virtualRows,
    viewportRef,
  };
}
