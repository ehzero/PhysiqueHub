interface PageMainProps {
  children: React.ReactNode;
  className?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  actions?: React.ReactNode;
  titleClassName?: string;
}

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  muted?: boolean;
  style?: React.CSSProperties;
}

interface EmptyStateProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  spacious?: boolean;
}

export function PageMain({ children, className }: PageMainProps) {
  return <main className={className}>{children}</main>;
}

export function PageHeader({
  title,
  subtitle,
  count,
  actions,
  titleClassName,
}: PageHeaderProps) {
  return (
    <section className="page-head">
      <div className="container">
        <div className="page-head-row">
          <div>
            <h1 className={["page-title", titleClassName].filter(Boolean).join(" ")}>
              {title}
              {count !== undefined && (
                <span className="page-title-count">
                  {count}
                </span>
              )}
            </h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}

export function PageSection({
  children,
  className,
  containerClassName,
  muted = false,
  style,
}: PageSectionProps) {
  const classes = ["section", className, muted ? "section-muted" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} style={style}>
      <div className={containerClassName ?? "container"}>{children}</div>
    </section>
  );
}

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  spacious = false,
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${spacious ? "spacious" : ""}`}>
      <div className="eyebrow empty-state-eyebrow">
        {eyebrow}
      </div>
      <p className="empty-state-title">
        {title}
      </p>
      {description && (
        <p className="empty-state-description">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
