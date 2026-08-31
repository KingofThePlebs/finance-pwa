import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (diff === 0) return;

    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + diff * eased);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        prev.current = target;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
