import { ArticleTheme, articleFigStroke } from "@/lib/articles-data";

interface ArticleFigureProps {
  theme: ArticleTheme;
  fig: number;
  className?: string;
}

export function ArticleFigure({ theme, fig, className }: ArticleFigureProps) {
  const stroke = articleFigStroke(theme);
  const v = fig % 6;

  const paths = (() => {
    if (v === 0) return (
      <>
        <path d="M50 18 L 38 38 L 22 36 L 18 50 L 28 60 L 38 58 L 42 75 L 38 92 M50 18 L 62 38 L 78 36 L 82 50 L 72 60 L 62 58 L 58 75 L 62 92" />
        <circle cx="50" cy="12" r="6" />
      </>
    );
    if (v === 1) return (
      <>
        <path d="M20 80 L 50 20 L 80 80" />
        <path d="M30 65 L 70 65 M 35 50 L 65 50 M 40 35 L 60 35" />
        <circle cx="50" cy="14" r="5" />
      </>
    );
    if (v === 2) return (
      <>
        <path d="M16 70 Q 40 40 50 50 Q 60 60 84 34" />
        <circle cx="16" cy="70" r="4" />
        <circle cx="84" cy="34" r="4" />
        <path d="M50 50 L 50 88 M 38 88 L 62 88" />
      </>
    );
    if (v === 3) return (
      <>
        <path d="M20 30 L 50 70 L 80 30" />
        <path d="M50 70 L 50 92" />
        <path d="M25 40 L 75 40 M 30 50 L 70 50 M 35 60 L 65 60" opacity="0.6" />
        <circle cx="50" cy="20" r="7" />
      </>
    );
    if (v === 4) return (
      <>
        <path d="M50 18 Q 35 35 32 50 Q 28 70 38 90" />
        <path d="M50 18 Q 65 35 68 50 Q 72 70 62 90" />
        <circle cx="50" cy="12" r="5" />
      </>
    );
    return (
      <>
        <rect x="22" y="44" width="56" height="12" rx="3" />
        <circle cx="20" cy="50" r="9" />
        <circle cx="80" cy="50" r="9" />
        <path d="M50 30 L 50 44 M 50 56 L 50 70" />
      </>
    );
  })();

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <g stroke={stroke} strokeWidth="2.4" fill="none">
        {paths}
      </g>
    </svg>
  );
}
