import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface UseLongPressOptions<T = any> {
  /** Duration in milliseconds before triggering the long press (default: 1500ms) */
  delay?: number;
  /** Max movement allowed in pixels (Euclidean distance) before cancelling to preserve scrolling (default: 10px) */
  moveThreshold?: number;
  /** Callback fired when long press duration is reached */
  onLongPress: (item: T, event: React.PointerEvent<HTMLElement> | PointerEvent) => void;
  /** Callback fired immediately when user touches down or clicks down */
  onPressStart?: (item: T) => void;
  /** Callback fired when press is released, cancelled, or finished */
  onPressEnd?: (item: T) => void;
  /** Optional handler for standard tap / click events */
  onClick?: (item: T, event: React.MouseEvent<HTMLElement>) => void;
  /** Enable haptic vibration on supported devices (default: true) */
  haptic?: boolean;
}

export interface LongPressBindProps {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
  onClickCapture: (e: React.MouseEvent<HTMLElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  style: React.CSSProperties;
}

/**
 * Unified Long-Press Hook
 * Provides accurate 1.5s (or configurable) press detection across touchscreens, styluses, and mouse pointers
 * while preserving native scroll responsiveness (pan-y) and standard tap/click handlers.
 */
export function useLongPress<T = any>({
  delay = 1500,
  moveThreshold = 10,
  onLongPress,
  onPressStart,
  onPressEnd,
  onClick,
  haptic = true,
}: UseLongPressOptions<T>) {
  const [pressingItemId, setPressingItemId] = useState<string | number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const activeItemRef = useRef<T | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelPress = useCallback(() => {
    clearTimer();
    if (activeItemRef.current && onPressEnd) {
      onPressEnd(activeItemRef.current);
    }
    startPosRef.current = null;
    setPressingItemId(null);
  }, [clearTimer, onPressEnd]);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const handlePointerDown = useCallback(
    (item: T, itemId: string | number, e: React.PointerEvent<HTMLElement>) => {
      // Ignore non-primary mouse buttons (e.g. right click, middle click)
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      // Ignore if user tapped directly on interactive controls (like delete button, input, anchor)
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button:not([data-allow-longpress]), input, textarea, select, a')) {
        return;
      }

      clearTimer();
      isLongPressTriggeredRef.current = false;
      activeItemRef.current = item;
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        pointerId: e.pointerId,
      };

      setPressingItemId(itemId);
      if (onPressStart) {
        onPressStart(item);
      }

      timerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        setPressingItemId(null);

        // Haptic feedback
        if (haptic && typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(50);
          } catch (_) {
            // Ignore vibration errors
          }
        }

        onLongPress(item, e);

        if (onPressEnd) {
          onPressEnd(item);
        }
      }, delay);
    },
    [clearTimer, delay, haptic, onLongPress, onPressStart, onPressEnd]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!startPosRef.current || !timerRef.current) return;

      // Calculate Euclidean distance moved
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      const distance = Math.hypot(dx, dy);

      // If moved beyond threshold (e.g. scrolling the conversation list), cancel immediately
      if (distance > moveThreshold) {
        cancelPress();
      }
    },
    [moveThreshold, cancelPress]
  );

  const handlePointerUp = useCallback(
    (item: T) => {
      clearTimer();
      startPosRef.current = null;
      setPressingItemId(null);

      if (onPressEnd && !isLongPressTriggeredRef.current) {
        onPressEnd(item);
      }

      // Reset triggered flag after short duration to allow subsequent taps
      if (isLongPressTriggeredRef.current) {
        setTimeout(() => {
          isLongPressTriggeredRef.current = false;
        }, 350);
      }
    },
    [clearTimer, onPressEnd]
  );

  const handlePointerCancel = useCallback(() => {
    cancelPress();
  }, [cancelPress]);

  const handleContextMenu = useCallback(
    (item: T, e: React.MouseEvent<HTMLElement>) => {
      // Prevent browser native context menu on long-press or right-click
      e.preventDefault();
      e.stopPropagation();
      clearTimer();
      setPressingItemId(null);
      isLongPressTriggeredRef.current = true;
      onLongPress(item, e as any);
      setTimeout(() => {
        isLongPressTriggeredRef.current = false;
      }, 350);
    },
    [clearTimer, onLongPress]
  );

  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // If long-press was just triggered, suppress the follow-up synthetic click event
    if (isLongPressTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const handleClick = useCallback(
    (item: T, e: React.MouseEvent<HTMLElement>) => {
      if (isLongPressTriggeredRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (onClick) {
        onClick(item, e);
      }
    },
    [onClick]
  );

  const getHandlers = useCallback(
    (item: T, itemId: string | number): LongPressBindProps => {
      return {
        onPointerDown: (e: React.PointerEvent<HTMLElement>) => handlePointerDown(item, itemId, e),
        onPointerMove: handlePointerMove,
        onPointerUp: () => handlePointerUp(item),
        onPointerCancel: handlePointerCancel,
        onContextMenu: (e: React.MouseEvent<HTMLElement>) => handleContextMenu(item, e),
        onClickCapture: handleClickCapture,
        onClick: onClick ? (e: React.MouseEvent<HTMLElement>) => handleClick(item, e) : undefined,
        style: {
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'pan-y',
        },
      };
    },
    [
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handlePointerCancel,
      handleContextMenu,
      handleClickCapture,
      handleClick,
      onClick,
    ]
  );

  return {
    pressingItemId,
    isPressing: (id: string | number) => pressingItemId === id,
    getHandlers,
    cancelPress,
    isTriggeredRef: isLongPressTriggeredRef,
  };
}

export default useLongPress;
