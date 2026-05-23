import { Icons } from "./Icons";

interface FilterOptionProps {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  className?: string;
}

export function FilterOption({
  on,
  onClick,
  children,
  count,
  className,
}: FilterOptionProps) {
  return (
    <button
      className={["filter-opt", on ? "on" : "", className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      <span className="check">{Icons.check}</span>
      <span>{children}</span>
      {count !== undefined && <span className="cnt">{count}</span>}
    </button>
  );
}
