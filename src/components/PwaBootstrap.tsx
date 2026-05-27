"use client";

import { useCallback, useEffect, useState } from "react";
import { Icons } from "./Icons";

const DISMISS_STORAGE_KEY = "ph-pwa-install-dismissed-at";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isRecentlyDismissed() {
  try {
    const value = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || 0);
    return Number.isFinite(value) && Date.now() - value < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function isIOSDevice() {
  const navigatorWithUAData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    navigatorWithUAData.userAgentData?.platform || navigator.platform || "";
  const iOSPlatform = /iPad|iPhone|iPod/i.test(platform);
  const iPadDesktopMode =
    platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return iOSPlatform || iPadDesktopMode;
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;
}

export function PwaBootstrap() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost")
    ) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .catch(() => {
          // PWA support should enhance browsing without blocking the page.
        });
    }
  }, []);

  useEffect(() => {
    const syncDeviceState = () => {
      setIsIOS(isIOSDevice());
      setIsMobile(isMobileViewport());
      setIsStandalone(isStandaloneMode());
      setIsDismissed(isRecentlyDismissed());
    };

    syncDeviceState();
    window.addEventListener("resize", syncDeviceState);

    return () => window.removeEventListener("resize", syncDeviceState);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(isRecentlyDismissed());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // Storage can be unavailable in private browsing modes.
    }

    setIsDismissed(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      dismiss();
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setDeferredPrompt(null);

    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      dismiss();
    }
  }, [deferredPrompt, dismiss]);

  const shouldShow =
    isMobile && !isStandalone && !isDismissed && (isIOS || deferredPrompt);

  if (!shouldShow) {
    return null;
  }

  return (
    <aside className="pwa-install-banner" aria-label="앱 설치 안내">
      <div className="pwa-install-mark" aria-hidden="true">
        P
      </div>
      <div className="pwa-install-copy">
        <strong>PhysiqueHub 바로 열기</strong>
        <span>
          {isIOS
            ? "Safari 공유 메뉴에서 홈 화면에 추가하세요."
            : "홈 화면에 추가해 모바일 앱처럼 사용할 수 있습니다."}
        </span>
      </div>
      <div className="pwa-install-actions">
        <button
          className="pwa-install-primary"
          type="button"
          onClick={install}
        >
          {isIOS ? "확인" : "추가"}
        </button>
        <button
          className="pwa-install-close"
          type="button"
          aria-label="설치 안내 닫기"
          onClick={dismiss}
        >
          {Icons.close}
        </button>
      </div>
    </aside>
  );
}
