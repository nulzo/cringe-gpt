import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Message } from "../types";

interface Options {
  /** px from bottom that still counts as “at bottom” (default 120 px) */
  nearBottomPx?: number;
  /** px from bottom before the down-arrow shows (default 80 px) */
  buttonPx?: number;
  /** smooth-scroll on user action (default true) */
  smooth?: boolean;
  /** turn behaviour on/off (default true) */
  enabled?: boolean;
}

interface Return {
  scrollRef: RefObject<HTMLDivElement>;
  endRef: RefObject<HTMLDivElement>;
  showButton: boolean;
  scrollToBottom: () => void;
}

/**
 * Chat-grade scroll behaviour:
 * 1. Stays at bottom while `autoScroll` is true
 * 2. Any user scroll up disables `autoScroll`
 * 3. IntersectionObserver re-enables it when bottom sentinel becomes visible
 */
export function useIntelligentScroll(
  messages: Message[],
  streamedChunk: string | undefined,
  conversationId: string | null,
  opts: Options = {},
): Return {
  const {
    nearBottomPx = 120,
    buttonPx = 80,
    smooth = true,
    enabled = true,
  } = opts;

  // ——————————————————— refs / state
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const [showButton, setShowButton] = useState(false);

  const lastChunk = useRef(streamedChunk); // detect new streamed chunks
  const prevLen = useRef(0); // detect first real message batch
  const isScrollingToBottom = useRef(false); // track programmatic scrolling

  // ——————————————————— helpers
  const distanceFromBottom = () => {
    const area = scrollRef.current;
    return !area ? 0 : area.scrollHeight - area.scrollTop - area.clientHeight;
  };

  const scrollToBottom = useCallback(
    (instant = false) => {
      if (!enabled) return;
      const node = endRef.current;
      if (!node) return;

      // Mark that we're programmatically scrolling
      isScrollingToBottom.current = true;

      node.scrollIntoView({
        behavior: instant ? "instant" : smooth ? "smooth" : "auto",
        block: "end",
      });
    },
    [enabled, smooth],
  );

  // ——————————————————— user scroll handler (toggles auto-scroll / button)
  useEffect(() => {
    if (!enabled) return;
    const area = scrollRef.current;
    if (!area) return;

    let lastScrollTop = area.scrollTop;

    const onScroll = () => {
      const currentScrollTop = area.scrollTop;
      const dist = distanceFromBottom();

      // Detect if user scrolled up (disable auto-scroll) - but not during programmatic scrolling
      if (currentScrollTop < lastScrollTop && !isScrollingToBottom.current) {
        setAutoScroll(false);
      }

      // Only show/hide button based on distance, don't change auto-scroll state here
      setShowButton(dist > buttonPx);

      lastScrollTop = currentScrollTop;

      // Reset scrolling flag after scroll completes
      if (isScrollingToBottom.current) {
        setTimeout(() => {
          isScrollingToBottom.current = false;
        }, 100);
      }
    };

    area.addEventListener("scroll", onScroll, { passive: true });
    return () => area.removeEventListener("scroll", onScroll);
  }, [enabled, nearBottomPx, buttonPx]);

  // ——————————————————— IO sentinel to resume auto-scroll when bottom visible
  useEffect(() => {
    if (!enabled) return;
    const sentinel = endRef.current;
    const rootNode = scrollRef.current;
    if (!sentinel || !rootNode) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        // Only re-enable auto-scroll if the sentinel is fully visible
        // and the user hasn't manually scrolled up recently
        if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
          setAutoScroll(true);
          setShowButton(false);
        }
      },
      {
        root: rootNode,
        threshold: [0, 0.5, 0.9, 1.0], // Multiple thresholds for finer control
      },
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [enabled]);

  // ——————————————————— new messages (non-streaming)
  useEffect(() => {
    // Always stay at bottom while autoscroll is active
    if (enabled && autoScroll) scrollToBottom();
  }, [messages.length, enabled, autoScroll, scrollToBottom]);

  // ——————————————————— streaming chunks
  useEffect(() => {
    if (!enabled) return;

    const newChunkArrived = streamedChunk !== lastChunk.current;
    lastChunk.current = streamedChunk;

    // Only auto-scroll for streaming if we have new content and auto-scroll is enabled
    // Add a small delay to prevent overly aggressive scrolling
    if (newChunkArrived && autoScroll && streamedChunk) {
      // Use a timeout to debounce rapid streaming updates
      const timeoutId = setTimeout(() => {
        scrollToBottom(true);
      }, 50); // Small delay to batch rapid updates

      return () => clearTimeout(timeoutId);
    }
  }, [streamedChunk, enabled, autoScroll, scrollToBottom]);

  // ——————————————————— initial load of real data (after skeleton)
  useLayoutEffect(() => {
    if (!enabled) return;

    const firstLoad = prevLen.current === 0 && messages.length > 0;
    prevLen.current = messages.length;

    // Scroll instantly either on the first real render or whenever autoscroll is on
    if (firstLoad || autoScroll) {
      // Double-tick to avoid timing issues with newly measured content
      scrollToBottom(true);
      requestAnimationFrame(() => scrollToBottom(true));
    }
  }, [messages.length, enabled, autoScroll, scrollToBottom]);

  // ——————————————————— conversation switch → hard reset BEFORE paint
  useLayoutEffect(() => {
    if (!enabled) return;

    const area = scrollRef.current;
    if (area) {
      // wipe any leftover offset from previous thread
      area.scrollTop = area.scrollHeight;
    }

    // reset state so the rest of the hook behaves fresh
    setAutoScroll(true);
    setShowButton(false);
    prevLen.current = 0;

    // Ensure we start at the bottom on conversation change
    requestAnimationFrame(() => scrollToBottom(true));
  }, [conversationId, enabled]);

  return {
    scrollRef: scrollRef as RefObject<HTMLDivElement>,
    endRef: endRef as RefObject<HTMLDivElement>,
    showButton,
    scrollToBottom: () => scrollToBottom(false),
  };
}
