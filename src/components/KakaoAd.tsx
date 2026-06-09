"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

type KakaoAdElement = "aside" | "section" | "div";

interface KakaoAdProps {
  unit: string;
  width: number;
  height: number;
  className?: string;
  minWidth?: number;
  maxWidth?: number;
  as?: KakaoAdElement;
  ariaLabel?: string;
}

interface KakaoAdFit {
  (): void;
  render?: (element: HTMLElement) => void;
  destroy?: (element: HTMLElement) => void;
}

declare global {
  interface Window {
    adfit?: KakaoAdFit;
  }
}

function getMediaQuery(minWidth?: number, maxWidth?: number) {
  const conditions: string[] = [];
  if (typeof minWidth === "number") conditions.push(`(min-width: ${minWidth}px)`);
  if (typeof maxWidth === "number") conditions.push(`(max-width: ${maxWidth}px)`);
  return conditions.length > 0 ? conditions.join(" and ") : null;
}

function useMediaQuery(query: string | null) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!query || typeof window === "undefined") return () => {};

      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onStoreChange);
      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (!query) return true;
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => !query, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function KakaoAd({
  unit,
  width,
  height,
  className,
  minWidth,
  maxWidth,
  as: Component = "aside",
  ariaLabel = "광고",
}: KakaoAdProps) {
  const mediaQuery = useMemo(
    () => getMediaQuery(minWidth, maxWidth),
    [minWidth, maxWidth],
  );
  const shouldRender = useMediaQuery(mediaQuery);
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!shouldRender) return;

    const adElement = adRef.current;
    if (!adElement) return;

    let retryCount = 0;
    let timeoutId: number | null = null;

    const renderAd = () => {
      const adfit = window.adfit;

      if (typeof adfit?.render === "function") {
        if (adElement.childElementCount === 0) {
          try {
            adfit.render(adElement);
          } catch (error) {
            console.warn("[KakaoAd] Failed to render AdFit slot.", error);
          }
        }
        return;
      }

      if (typeof adfit === "function") {
        try {
          adfit();
        } catch (error) {
          console.warn("[KakaoAd] Failed to scan AdFit slots.", error);
        }
        return;
      }

      if (retryCount < 20) {
        retryCount += 1;
        timeoutId = window.setTimeout(renderAd, 150);
      }
    };

    timeoutId = window.setTimeout(renderAd, 0);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.adfit?.destroy?.(adElement);
    };
  }, [shouldRender, unit, width, height]);

  if (!shouldRender) return null;

  return (
    <Component className={className} aria-label={ariaLabel}>
      <ins
        ref={adRef}
        className="kakao_ad_area"
        style={{ display: "none" }}
        data-ad-unit={unit}
        data-ad-width={width}
        data-ad-height={height}
      />
    </Component>
  );
}
