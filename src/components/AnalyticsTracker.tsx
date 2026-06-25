"use client";

import { useEffect, useRef } from "react";
import {
  flushAnalyticsEvents,
  startAnalyticsSession,
  trackAnalyticsEvent,
  trackPageView,
} from "@/lib/analytics-client";

interface AnalyticsTrackerProps {
  pathname: string | null;
}

export function AnalyticsTracker({ pathname }: AnalyticsTrackerProps) {
  const activeSecondsRef = useRef(0);
  const maxScrollDepthRef = useRef(0);
  const lastPingAtRef = useRef(0);
  const pageViewReadyRef = useRef(false);

  useEffect(() => {
    startAnalyticsSession(getRouteType(pathname));
  }, [pathname]);

  useEffect(() => {
    const updateScrollDepth = () => {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const depth = scrollable <= 0 ? 100 : Math.round((scrollTop / scrollable) * 100);
      maxScrollDepthRef.current = Math.max(maxScrollDepthRef.current, Math.min(100, depth));
    };

    const ping = () => {
      if (document.visibilityState !== "visible") return;

      activeSecondsRef.current += 30;
      lastPingAtRef.current = Date.now();
      trackAnalyticsEvent("engagement_ping", {
        properties: {
          activeSeconds: activeSecondsRef.current,
          maxScrollDepth: maxScrollDepthRef.current,
        },
      });
    };

    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    const interval = window.setInterval(ping, 30_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushAnalyticsEvents(true);
      }
    };
    const handlePageHide = () => {
      void flushAnalyticsEvents(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("scroll", updateScrollDepth);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      void flushAnalyticsEvents(true);
    };
  }, []);

  useEffect(() => {
    if (!pageViewReadyRef.current) {
      pageViewReadyRef.current = true;
      return;
    }

    // activeSeconds는 세션 전체에 걸쳐 누적한다(라우트 변경 시 리셋하지 않음).
    // MAX(activeSeconds) 집계가 '세션 총 활성 시간'이 되도록. scrollDepth는
    // 페이지 단위 지표이므로 페이지 전환 시 리셋한다.
    maxScrollDepthRef.current = 0;
    lastPingAtRef.current = 0;
    trackPageView(getRouteType(pathname));
  }, [pathname]);

  return null;
}

function getRouteType(pathname: string | null) {
  if (!pathname) return "unknown";
  if (pathname === "/") return "home";
  if (pathname === "/competitions") return "competition_list";
  if (pathname.startsWith("/competitions/")) return "competition_detail_or_landing";
  if (pathname.startsWith("/guide")) return "guide";
  if (pathname.startsWith("/articles")) return "article";
  if (pathname === "/saved") return "saved";
  return "static";
}
