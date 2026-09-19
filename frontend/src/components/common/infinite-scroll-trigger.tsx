"use client";
import { useEffect, useRef } from "react";

type Props = {
  onIntersect: () => void;
  enabled?: boolean;
};

export default function InfiniteScrollTrigger({
  onIntersect,
  enabled = true,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.01 },
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [enabled, onIntersect]);

  return <div ref={ref} />;
}
