import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";
import { forwardRef } from "react";

type LinkHref = Parameters<typeof Link>[0]["href"];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ActionButtonVariant = "primary" | "outline" | "accent";
type ActionButtonSize = "sm" | "md";

type ActionButtonBaseProps = {
  children: ReactNode;
  className?: string;
  href?: LinkHref;
  prefetch?: boolean;
  size?: ActionButtonSize;
  variant?: ActionButtonVariant;
};

type ActionButtonProps = ActionButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function ActionButton({
  children,
  className,
  href,
  prefetch = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...buttonProps
}: ActionButtonProps) {
  const classes = cx(
    "ph-action-pill",
    `ph-action-pill-${variant}`,
    `ph-action-pill-${size}`,
    className,
  );

  if (href) {
    return (
      <Link href={href} prefetch={prefetch} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}

type SectionBlockProps = {
  bordered?: boolean;
  children: ReactNode;
  className?: string;
  last?: boolean;
  tone?: "paper" | "elev";
};

export function SectionBlock({
  bordered = false,
  children,
  className,
  last = false,
  tone = "paper",
}: SectionBlockProps) {
  return (
    <section
      className={cx(
        "ph-section-block",
        "hub-section",
        `hub-section-${tone}`,
        bordered && "hub-section-bordered",
        last && "hub-section-last",
        className,
      )}
    >
      {children}
    </section>
  );
}

type IntroAction = {
  href: LinkHref;
  label: ReactNode;
  prefetch?: boolean;
};

type IntroClassNames = {
  action?: string;
  description?: string;
  eyebrow?: string;
  title?: string;
};

type IntroProps = {
  action?: IntroAction;
  children?: ReactNode;
  className?: string;
  classNames?: IntroClassNames;
  description?: ReactNode;
  eyebrow?: ReactNode;
  level?: 1 | 2;
  spacious?: boolean;
  title: ReactNode;
  variant?: "page" | "section";
};

export function Intro({
  action,
  children,
  className,
  classNames,
  description,
  eyebrow,
  level = 2,
  spacious = false,
  title,
  variant = "section",
}: IntroProps) {
  const isPage = variant === "page";
  const titleClassName = cx(
    isPage ? "ph-page-intro-title" : "ph-section-intro-title",
    !isPage && "hub-h2",
    classNames?.title,
  );
  const descriptionNode = description ?? children;

  return (
    <div
      className={cx(
        "ph-intro",
        isPage ? "ph-page-intro" : "ph-section-intro hub-section-head",
        spacious && "is-spacious",
        className,
      )}
    >
      <div>
        {eyebrow && (
          <div className={cx("ph-intro-eyebrow hub-eyebrow", classNames?.eyebrow)}>
            {eyebrow}
          </div>
        )}
        {level === 1 ? (
          <h1 className={titleClassName}>{title}</h1>
        ) : (
          <h2 className={titleClassName}>{title}</h2>
        )}
        {descriptionNode && (
          <p
            className={cx(
              isPage ? "ph-page-intro-description" : "ph-section-intro-description hub-section-body",
              classNames?.description,
            )}
          >
            {descriptionNode}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cx("ph-intro-action hub-link-more", classNames?.action)}
          prefetch={action.prefetch ?? false}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

type StickyControlBarProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
} & Pick<HTMLAttributes<HTMLDivElement>, "aria-label" | "role">;

export function StickyControlBar({
  children,
  className,
  containerClassName = "container",
  ...props
}: StickyControlBarProps) {
  return (
    <div className={cx("ph-sticky-bar", className)} {...props}>
      <div className={containerClassName}>{children}</div>
    </div>
  );
}

type SegmentVariant = "accent" | "neutral";

type SegmentButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: SegmentVariant;
};

export function SegmentButton({
  active = false,
  children,
  className,
  type = "button",
  variant = "accent",
  ...buttonProps
}: SegmentButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "ph-filter-pill",
        variant === "neutral" && "ph-filter-pill-neutral",
        active && "is-active",
        className,
      )}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

type SegmentLinkProps = {
  active?: boolean;
  children: ReactNode;
  className?: string;
  href: LinkHref;
  variant?: SegmentVariant;
};

export const SegmentLink = forwardRef<HTMLAnchorElement, SegmentLinkProps>(
  function SegmentLink(
    {
      active = false,
      children,
      className,
      href,
      variant = "accent",
    },
    ref,
  ) {
    return (
      <Link
        ref={ref}
        href={href}
        className={cx(
          "ph-filter-pill",
          variant === "neutral" && "ph-filter-pill-neutral",
          active && "is-active",
          className,
        )}
        prefetch={false}
      >
        {children}
      </Link>
    );
  },
);

type StatusPillProps = {
  className?: string;
  dotClassName?: string;
  label: ReactNode;
  labelClassName?: string;
  style?: CSSProperties;
};

export function StatusPill({
  className,
  dotClassName,
  label,
  labelClassName,
  style,
}: StatusPillProps) {
  return (
    <div className={cx("ph-status-pill", className)} style={style}>
      <span className={cx("ph-status-dot", dotClassName)} />
      <span className={cx("ph-status-label", labelClassName)}>{label}</span>
    </div>
  );
}
