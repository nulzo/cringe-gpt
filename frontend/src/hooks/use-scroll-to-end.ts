import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

interface UseScrollToEndOptions {
  /**
   * Distance from bottom (in pixels) to show/hide the scroll button
   * @default 80
   */
  buttonThreshold?: number;
  /**
   * Whether to use smooth scrolling behavior
   * @default true
   */
  smooth?: boolean;
  /**
   * Whether to enable the scroll to bottom functionality
   * @default true
   */
  enabled?: boolean;
}

interface UseScrollToEndReturn {
  scrollRef: RefObject<HTMLDivElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  forceScrollToBottom: () => void;
}

/**
 * Simple scroll to end hook that provides basic "scroll to bottom" functionality
 * with a button that appears when user scrolls up
 */
const useScrollToEnd = (
  options: UseScrollToEndOptions = {}
): UseScrollToEndReturn => {
  const {
    buttonThreshold = 80,
    smooth = true,
    enabled = true,
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check scroll position and update button visibility
  const checkScrollPosition = useCallback(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Show/hide scroll button based on button threshold
    setShowScrollButton(distanceFromBottom > buttonThreshold);
  }, [buttonThreshold]);

  // Function to scroll to bottom (with option for instant scroll)
  const scrollToBottomInternal = useCallback((instant = false) => {
    if (!enabled) return;

    const messagesEnd = messagesEndRef.current;
    const scrollArea = scrollRef.current;

    if (!messagesEnd || !scrollArea) return;

    // Mark as programmatic scrolling
    userScrollingRef.current = true;

    // Use scrollIntoView for reliable positioning
    messagesEnd.scrollIntoView({
      behavior: instant ? 'instant' : (smooth ? 'smooth' : 'instant'),
      block: 'end',
      inline: 'nearest'
    });

    // Hide button immediately
    setShowScrollButton(false);

    // Clear programmatic scrolling flag after scroll completes
    const delay = instant ? 50 : (smooth ? 500 : 100);
    setTimeout(() => {
      userScrollingRef.current = false;
    }, delay);
  }, [enabled, smooth]);

  // Public scroll to bottom function (triggered by user)
  const scrollToBottom = useCallback(() => {
    scrollToBottomInternal(false);
  }, [scrollToBottomInternal]);

  // Force scroll to bottom (for conversation changes)
  const forceScrollToBottom = useCallback(() => {
    scrollToBottomInternal(true);
  }, [scrollToBottomInternal]);

  // Set up scroll listener
  useEffect(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      // Only process if not programmatically scrolling
      if (userScrollingRef.current) return;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce scroll position checking
      scrollTimeoutRef.current = setTimeout(() => {
        checkScrollPosition();
      }, 50);
    };

    scrollArea.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    checkScrollPosition();

    return () => {
      scrollArea.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [checkScrollPosition]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    scrollRef: scrollRef as RefObject<HTMLDivElement>,
    messagesEndRef: messagesEndRef as RefObject<HTMLDivElement>,
    showScrollButton,
    scrollToBottom,
    forceScrollToBottom,
  };
};

export default useScrollToEnd;