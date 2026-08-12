"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { LOOFIT_APP_STORE_URL, LOOFIT_PROMOTION_ID } from "@/lib/site";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { TrackedExternalLink } from "@/components/TrackedExternalLink";

type LoofitPromoElement = "aside" | "section" | "div";
type LoofitPromoVariant = "inline" | "side" | "mobile" | "showcase";
type LoofitPromoMediaOrientation = "horizontal" | "vertical";

interface LoofitPromoBannerProps {
  className?: string;
  as?: LoofitPromoElement;
  mediaOrientation?: LoofitPromoMediaOrientation;
  source: string;
  variant: LoofitPromoVariant;
}

const viewedSlots = new Set<string>();

export function LoofitPromoBanner({
  className,
  as: Component = "aside",
  mediaOrientation = "horizontal",
  source,
  variant,
}: LoofitPromoBannerProps) {
  const promoRef = useRef<HTMLElement | null>(null);
  const isShowcase = variant === "showcase";
  const isSide = variant === "side";
  const isVerticalMedia = mediaOrientation === "vertical";

  useEffect(() => {
    const element = promoRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const slotKey = `${window.location.pathname}${window.location.search}:${source}`;
    if (viewedSlots.has(slotKey)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
          return;
        }

        viewedSlots.add(slotKey);
        trackAnalyticsEvent("owned_promo_impression", {
          properties: {
            source,
            promotionId: LOOFIT_PROMOTION_ID,
            variant,
          },
        });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [source, variant]);

  return (
    <Component
      ref={(element) => {
        promoRef.current = element;
      }}
      className={className}
      aria-label="루핏 앱 소개"
    >
      <TrackedExternalLink
        href={LOOFIT_APP_STORE_URL}
        target="_blank"
        rel="noreferrer noopener"
        className={`loofit-promo-link is-${variant}${isVerticalMedia ? " has-vertical-media" : ""}`}
        eventName="owned_promo_click"
        analyticsProperties={{
          source,
          promotionId: LOOFIT_PROMOTION_ID,
          variant,
        }}
        aria-label="루핏을 App Store에서 보기"
      >
        <span className="loofit-promo-media" aria-hidden="true">
          <Image
            src={isVerticalMedia ? "/loofit-promo-vertical.jpg" : "/loofit-promo-horizontal.jpg"}
            alt=""
            fill
            sizes={isVerticalMedia ? "160px" : isShowcase ? "(max-width: 640px) 100vw, 1200px" : isSide ? "344px" : "(max-width: 899px) 100vw, 900px"}
          />
        </span>
        <span className="loofit-promo-copy">
          <strong className="loofit-promo-title">
            <span>운동은 꾸준하게,</span>
            <span>기록은 가볍게</span>
          </strong>
          <span className="loofit-promo-description">
            운동 시간과 부위를 간편하게 기록하고 확인하세요.
          </span>
        </span>
        <span className="loofit-promo-action">가볍게 시작하기</span>
      </TrackedExternalLink>
    </Component>
  );
}
