"use client";

import { useSiteShell } from "@/components/SiteShell";
import { Icons } from "./Icons";

type AdInquiryBannerElement = "aside" | "section" | "div";

interface AdInquiryBannerProps {
  className?: string;
  as?: AdInquiryBannerElement;
  source: string;
  title?: string;
  description?: string;
}

export function AdInquiryBanner({
  className,
  as: Component = "aside",
  source,
  title = "피지크허브 광고 문의",
  description = "헬스·웨이트 트레이닝과 피트니스 대회에 관심 있는 사람들에게 브랜드를 소개하세요.",
}: AdInquiryBannerProps) {
  const { openContact } = useSiteShell();

  return (
    <Component className={className} aria-label="광고 문의">
      <button
        className="ad-inquiry-banner"
        type="button"
        onClick={() => openContact({ category: "광고 문의", source })}
      >
        <span className="ad-inquiry-kicker">AD PARTNER</span>
        <span className="ad-inquiry-title">{title}</span>
        <span className="ad-inquiry-desc">{description}</span>
        <span className="ad-inquiry-action">
          문의하기
          {Icons.arrow}
        </span>
      </button>
    </Component>
  );
}
