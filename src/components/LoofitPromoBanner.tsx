"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { LOOFIT_APP_STORE_URL, LOOFIT_PROMOTION_ID } from "@/lib/site";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { TrackedExternalLink } from "@/components/TrackedExternalLink";

type LoofitPromoElement = "aside" | "section" | "div";
type LoofitPromoVariant = "inline" | "side" | "mobile" | "showcase";

interface LoofitPromoBannerProps {
  className?: string;
  as?: LoofitPromoElement;
  source: string;
  variant: LoofitPromoVariant;
}

const viewedSlots = new Set<string>();

const LOOFIT_MONTH_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const LOOFIT_MONTH_PREVIEW = [
  { day: "14", level: 0 },
  { day: "15", level: 1 },
  { day: "16", level: 0 },
  { day: "17", level: 2 },
  { day: "18", level: 0 },
  { day: "19", level: 3 },
  { day: "20", level: 0 },
  { day: "21", level: 1 },
  { day: "22", level: 0 },
  { day: "23", level: 4 },
  { day: "24", level: 0 },
  { day: "25", level: 2 },
  { day: "26", level: 0 },
  { day: "27", level: 1 },
  { day: "28", level: 0 },
  { day: "29", level: 3 },
  { day: "30", level: 0 },
  { day: "1", level: 2 },
  { day: "2", level: 0 },
  { day: "3", level: 4 },
  { day: "4", level: 0 },
  { day: "5", level: 1 },
  { day: "6", level: 0 },
  { day: "7", level: 3 },
  { day: "8", level: 0 },
  { day: "9", level: 2 },
  { day: "10", level: 0 },
  { day: "11", level: 4 },
  { day: "12", level: 0 },
  { day: "13", level: 0 },
  { day: "", level: 0, isPlaceholder: true },
  { day: "", level: 0, isPlaceholder: true },
  { day: "", level: 0, isPlaceholder: true },
  { day: "", level: 0, isPlaceholder: true },
  { day: "", level: 0, isPlaceholder: true },
] as const;

export function LoofitPromoBanner({
  className,
  as: Component = "aside",
  source,
  variant,
}: LoofitPromoBannerProps) {
  const promoRef = useRef<HTMLElement | null>(null);
  const isShowcase = variant === "showcase";

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
        className={`loofit-promo-link is-${variant}`}
        eventName="owned_promo_click"
        analyticsProperties={{
          source,
          promotionId: LOOFIT_PROMOTION_ID,
          variant,
        }}
        aria-label="루핏을 App Store에서 보기"
      >
        <Image
          className="loofit-promo-icon"
          src="/loofit-app-icon.png"
          alt="루핏 앱 아이콘"
          width={80}
          height={80}
        />
        <span className="loofit-promo-copy">
          <span className="loofit-promo-kicker">피지크허브가 만든 iPhone 앱</span>
          <strong className="loofit-promo-title">
            {isShowcase
              ? "대회 일정은 피지크허브에서, 오늘 운동은 루핏에서."
              : "내 루틴대로, 운동을 가볍게."}
          </strong>
          <span className="loofit-promo-description">
            {isShowcase
              ? "내 루틴의 다음 운동을 확인하고 시작·종료만 하세요. 운동 시간과 부위가 기록되고, 다음 운동은 위젯에서도 바로 확인할 수 있어요."
              : "세트와 중량을 일일이 입력하지 않아도 돼요. 시작하고 끝내면 운동 시간과 부위가 기록되고, 다음 운동은 위젯에서도 확인할 수 있어요."}
          </span>
        </span>
        {isShowcase && (
          <span className="loofit-showcase-widget-scene" aria-hidden="true">
            <span className="loofit-showcase-widget-stack">
              <span className="loofit-showcase-heatmap-widget">
                <span className="loofit-showcase-heatmap-weekdays">
                  {LOOFIT_MONTH_WEEKDAYS.map((weekday, index) => (
                    <span
                      className={index === 0 || index === 6 ? "is-weekend" : undefined}
                      key={weekday}
                    >
                      {weekday}
                    </span>
                  ))}
                </span>
                <span className="loofit-showcase-heatmap-grid">
                  {LOOFIT_MONTH_PREVIEW.map((cell, index) => (
                    <span
                      className={`is-level-${cell.level}${"isPlaceholder" in cell ? " is-placeholder" : ""}`}
                      key={`${cell.day}-${index}`}
                    >
                      {cell.day}
                    </span>
                  ))}
                </span>
                <span className="loofit-showcase-heatmap-summary">14회 · 총 12시간 40분</span>
              </span>
              <span className="loofit-showcase-widget">
                <span className="loofit-showcase-widget-label">다음 운동</span>
                <span className="loofit-showcase-widget-content">
                  <strong>Pull</strong>
                  <span>등 · 이두</span>
                </span>
                <span className="loofit-showcase-widget-action">운동 시작</span>
              </span>
            </span>
          </span>
        )}
        <span className="loofit-promo-action">App Store에서 보기</span>
      </TrackedExternalLink>
    </Component>
  );
}
