import { useEffect, useState } from "react";

const VIEWPORT_OVERSCAN = 200;

export type ViewportBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

function getViewportBounds(viewport: HTMLElement): ViewportBounds {
  return {
    left: viewport.scrollLeft - VIEWPORT_OVERSCAN,
    top: viewport.scrollTop - VIEWPORT_OVERSCAN,
    right: viewport.scrollLeft + viewport.clientWidth + VIEWPORT_OVERSCAN,
    bottom: viewport.scrollTop + viewport.clientHeight + VIEWPORT_OVERSCAN,
  };
}

export function intersectsViewport(
  node: { x: number; y: number; w: number; h: number },
  viewport: ViewportBounds,
): boolean {
  return (
    node.x + node.w >= viewport.left &&
    node.x <= viewport.right &&
    node.y + node.h >= viewport.top &&
    node.y <= viewport.bottom
  );
}

export function useViewportBounds(
  viewportRef: React.RefObject<HTMLElement>,
): ViewportBounds | null {
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const currentViewport = viewport;

    let frame: number | null = null;

    function scheduleBoundsUpdate(): void {
      if (frame !== null) return;

      frame = requestAnimationFrame(() => {
        frame = null;
        setViewportBounds(getViewportBounds(currentViewport));
      });
    }

    scheduleBoundsUpdate();
    currentViewport.addEventListener("scroll", scheduleBoundsUpdate, { passive: true });

    const resizeObserver = new ResizeObserver(scheduleBoundsUpdate);
    resizeObserver.observe(currentViewport);

    return () => {
      currentViewport.removeEventListener("scroll", scheduleBoundsUpdate);
      resizeObserver.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [viewportRef]);

  return viewportBounds;
}
