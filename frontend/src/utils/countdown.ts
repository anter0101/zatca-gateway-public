import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  autoStart?: boolean;
}

interface UseCountdownReturn {
  countdown: number;
  isActive: boolean;
  startCountdown: (seconds: number) => void;
  stopCountdown: () => void;
  resetCountdown: () => void;
}

export const useCountdown = (
  options: UseCountdownOptions = {},
): UseCountdownReturn => {
  const { autoStart = false } = options;
  const [countdown, setCountdown] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = useCallback(
    (seconds: number) => {
      // Don't start if already active
      if (isActive) {
        return;
      }

      // Clear any existing timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      setCountdown(seconds);
      setIsActive(true);

      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Clear timer when countdown reaches 0
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [isActive],
  );

  const stopCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  }, []);

  const resetCountdown = useCallback(() => {
    stopCountdown();
    setCountdown(0);
  }, [stopCountdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && countdown > 0 && !isActive) {
      startCountdown(countdown);
    }
  }, [autoStart, countdown, isActive, startCountdown]);

  return {
    countdown,
    isActive,
    startCountdown,
    stopCountdown,
    resetCountdown,
  };
};
