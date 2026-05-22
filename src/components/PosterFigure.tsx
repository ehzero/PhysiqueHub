interface PosterFigureProps {
  variant?: number;
  color?: string;
}

export function PosterFigure({ variant = 0, color = "#0a0a0a" }: PosterFigureProps) {
  const v = variant % 6;

  if (v === 0) return (
    <svg viewBox="0 0 100 100" fill="none">
      <g stroke={color} strokeWidth="2" fill="none">
        <path d="M50 18 L 38 38 L 22 36 L 18 50 L 28 60 L 38 58 L 42 75 L 38 92 M50 18 L 62 38 L 78 36 L 82 50 L 72 60 L 62 58 L 58 75 L 62 92" />
        <circle cx="50" cy="12" r="6" />
        <path d="M50 18 L 50 92" strokeDasharray="2 3" opacity="0.4" />
      </g>
    </svg>
  );
  if (v === 1) return (
    <svg viewBox="0 0 100 100" fill="none">
      <g stroke={color} strokeWidth="2.5" fill="none">
        <path d="M20 80 L 50 20 L 80 80" />
        <path d="M30 65 L 70 65 M 35 50 L 65 50 M 40 35 L 60 35" />
        <circle cx="50" cy="14" r="5" />
      </g>
    </svg>
  );
  if (v === 2) return (
    <svg viewBox="0 0 100 100" fill="none">
      <g stroke={color} strokeWidth="2.5" fill="none">
        <circle cx="35" cy="50" r="22" />
        <circle cx="65" cy="50" r="22" />
        <circle cx="50" cy="20" r="8" />
      </g>
    </svg>
  );
  if (v === 3) return (
    <svg viewBox="0 0 100 100" fill="none">
      <g stroke={color} strokeWidth="2.5" fill="none">
        <path d="M20 30 L 50 70 L 80 30" />
        <path d="M50 70 L 50 92" />
        <path d="M25 40 L 75 40 M 30 50 L 70 50 M 35 60 L 65 60" opacity="0.6" />
        <circle cx="50" cy="20" r="7" />
      </g>
    </svg>
  );
  if (v === 4) return (
    <svg viewBox="0 0 100 100" fill="none">
      <g stroke={color} strokeWidth="2.5" fill="none">
        <path d="M50 18 Q 35 35 32 50 Q 28 70 38 90" />
        <path d="M50 18 Q 65 35 68 50 Q 72 70 62 90" />
        <circle cx="50" cy="12" r="5" />
      </g>
    </svg>
  );
  return (
    <svg viewBox="0 0 100 100" fill="none">
      <g stroke={color} strokeWidth="2.5" fill="none">
        <rect x="30" y="20" width="40" height="36" />
        <path d="M30 24 L 18 30 L 18 42 L 30 42 M70 24 L 82 30 L 82 42 L 70 42" />
        <path d="M40 56 L 40 70 L 60 70 L 60 56" />
        <path d="M30 78 L 70 78 L 70 84 L 30 84 Z" />
      </g>
    </svg>
  );
}

export function posterFigureColor(theme: string): string {
  if (theme === "deep" || theme === "navy" || theme === "rose") return "rgba(255,255,255,0.85)";
  return "rgba(0,0,0,0.85)";
}
