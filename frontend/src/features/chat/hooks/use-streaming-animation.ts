import { useCallback, useRef, useEffect } from 'react';

interface StreamingAnimationOptions {
  charDelay?: number; // Delay between characters in ms
  wordDelay?: number; // Extra delay for word boundaries
  sentenceDelay?: number; // Extra delay for sentence endings
  onProgress?: (currentText: string, progress: number) => void;
  onComplete?: (fullText: string) => void;
  onCancel?: () => void;
}

export function useStreamingAnimation(options: StreamingAnimationOptions = {}) {
  const {
    charDelay = 15,
    wordDelay = 10,
    sentenceDelay = 50,
    onProgress,
    onComplete,
    onCancel,
  } = options;

  const animationRef = useRef<number>();
  const textRef = useRef<string>('');
  const startTimeRef = useRef<number>();

  const calculateDelay = useCallback((char: string, nextChar?: string): number => {
    let delay = charDelay;

    // Word boundaries (space followed by non-space)
    if (char === ' ' && nextChar && nextChar !== ' ') {
      delay += wordDelay;
    }

    // Sentence endings
    if (char === '.' || char === '!' || char === '?') {
      delay += sentenceDelay;
    }

    // Commas and semicolons
    if (char === ',' || char === ';') {
      delay += sentenceDelay / 2;
    }

    return delay;
  }, [charDelay, wordDelay, sentenceDelay]);

  const animate = useCallback((targetText: string) => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    let currentIndex = 0;
    textRef.current = '';

    const step = () => {
      const elapsed = Date.now() - startTimeRef.current!;
      let targetIndex = 0;

      // Calculate target index based on elapsed time and character delays
      for (let i = 0; i < targetText.length; i++) {
        const char = targetText[i];
        const nextChar = targetText[i + 1];
        const delay = calculateDelay(char, nextChar);

        if (elapsed >= targetIndex * charDelay) {
          targetIndex = i + 1;
        } else {
          break;
        }
      }

      // Ensure we don't exceed text length
      targetIndex = Math.min(targetIndex, targetText.length);

      if (targetIndex > currentIndex) {
        const newChars = targetText.slice(currentIndex, targetIndex);
        textRef.current += newChars;
        currentIndex = targetIndex;

        const progress = currentIndex / targetText.length;
        onProgress?.(textRef.current, progress);

        if (currentIndex >= targetText.length) {
          onComplete?.(textRef.current);
          return;
        }
      }

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
  }, [calculateDelay, charDelay, onProgress, onComplete]);

  const start = useCallback((text: string) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    textRef.current = '';
    startTimeRef.current = undefined;
    animate(text);
  }, [animate]);

  const cancel = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    onCancel?.();
  }, [onCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    start,
    cancel,
    currentText: textRef.current,
  };
}

// Hook for smooth text reveals with easing
export function useSmoothTextReveal() {
  const reveal = useCallback((element: HTMLElement, text: string, duration = 1000) => {
    let startTime: number;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      const charsToShow = Math.floor(text.length * eased);
      element.textContent = text.slice(0, charsToShow);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return { reveal };
}
