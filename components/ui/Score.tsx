'use client';

import { useEffect, useRef, useState } from 'react';

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--score-good)';
  if (score >= 40) return 'var(--score-medium)';
  return 'var(--score-poor)';
}

interface ScoreProps {
  score: number;
}

export function Score({ score }: ScoreProps) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 800;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplayed(Math.round(eased * score));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  return (
    <span
      className="font-mono font-medium tabular-nums"
      style={{ fontSize: '96px', lineHeight: '1', color: scoreColor(score) }}
    >
      {displayed}
    </span>
  );
}
