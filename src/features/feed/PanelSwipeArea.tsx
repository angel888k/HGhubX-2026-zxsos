import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { FeedPanel } from "./useFeedViewport";

const TAB_SWIPE_DISTANCE = 56;
const CLOSE_SWIPE_DISTANCE = 72;
const AXIS_RATIO = 1.35;

type PanelTab = "detail" | "episodes";

/** Finds a horizontally scrollable ancestor so carousels keep their own swipe. */
function findHorizontalScroller(target: Element, boundary: HTMLElement): HTMLElement | null {
  let node: Element | null = target;
  while (node && node !== boundary.parentElement) {
    if (node instanceof HTMLElement) {
      const overflow = getComputedStyle(node).overflowX;
      if ((overflow === "auto" || overflow === "scroll") && node.scrollWidth > node.clientWidth + 1) return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Finds the nearest vertical scroller that owns the gesture. */
function findVerticalScroller(target: Element, boundary: HTMLElement): HTMLElement | null {
  let node: Element | null = target;
  while (node && node !== boundary.parentElement) {
    if (node instanceof HTMLElement) {
      const overflow = getComputedStyle(node).overflowY;
      if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight + 1) return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Swipe navigation for the mobile detail/episodes sheet.
 * Horizontal swipes switch tabs, while a downward pull closes the sheet only
 * when the current content is already at the top. Horizontal carousels and
 * vertical lists keep their native gestures.
 */
export function PanelSwipeArea({ panel, onChange, className = "", children }: {
  panel: PanelTab;
  onChange: (panel: FeedPanel) => void;
  className?: string;
  children: ReactNode;
}) {
  const start = useRef<{ x: number; y: number; pointerId: number; atTop: boolean } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    const target = e.target as Element;
    if (target.closest("input, textarea, select, [data-panel-swipe-ignore]")) return;
    if (findHorizontalScroller(target, e.currentTarget)) return;
    const scroller = findVerticalScroller(target, e.currentTarget);
    start.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      atTop: !scroller || scroller.scrollTop <= 1,
    };
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = start.current;
    start.current = null;
    if (!gesture || gesture.pointerId !== e.pointerId) return;
    const dx = e.clientX - gesture.x;
    const dy = e.clientY - gesture.y;
    const horizontal = Math.abs(dx) >= TAB_SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * AXIS_RATIO;
    if (horizontal) {
      const next: PanelTab = dx < 0 ? "episodes" : "detail";
      if (next !== panel) onChange(next);
      return;
    }
    if (gesture.atTop && dy >= CLOSE_SWIPE_DISTANCE && dy > Math.abs(dx) * AXIS_RATIO) onChange(null);
  };

  return <div
    className={`video-details-sheet-body flex-1 min-h-0 flex flex-col ${className}`}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
    onPointerCancel={() => { start.current = null; }}
  >{children}</div>;
}
