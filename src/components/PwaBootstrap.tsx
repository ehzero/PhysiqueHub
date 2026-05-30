"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icons } from "./Icons";

const DISMISS_KEY = "ph-pwa-dismissed";
export const PWA_INSTALL_REQUEST_EVENT = "physiquehub:pwa-install-request";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneMode() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isDismissed() {
  if (typeof localStorage === "undefined") return false;

  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}

function persistDismiss() {
  if (typeof localStorage === "undefined") return;

  try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* noop */ }
}

function isIOSDevice() {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(max-width: 720px)").matches;
}

export function PwaBootstrap() {
  // Register service worker
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost")
    ) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(isIOSDevice);
  const [shown, setShown] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [hintIn, setHintIn] = useState(false);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const showBanner = useCallback(() => {
    if (!isMobileViewport() || isStandaloneMode() || isDismissed()) return;
    setShown(true);
    document.body.classList.add("pwa-pad-body");
    requestAnimationFrame(() => setAnimIn(true));
  }, []);

  const showHint = useCallback(() => {
    setHintShown(true);
    requestAnimationFrame(() => setHintIn(true));
  }, []);

  const hideHint = useCallback(() => {
    setHintIn(false);
    setTimeout(() => setHintShown(false), 280);
  }, []);

  const hideBanner = useCallback(() => {
    setAnimIn(false);
    document.body.classList.remove("pwa-pad-body");
    setTimeout(() => setShown(false), 280);
    hideHint();
  }, [hideHint]);

  // Show banner after 700ms delay
  useEffect(() => {
    bannerTimer.current = setTimeout(showBanner, 700);
    return () => { if (bannerTimer.current) clearTimeout(bannerTimer.current); };
  }, [showBanner]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") persistDismiss();
      setDeferredPrompt(null);
      hideBanner();
    } else {
      // iOS or unsupported: show manual steps
      if (hintShown) hideHint();
      else showHint();
    }
  }, [deferredPrompt, hideBanner, hideHint, hintShown, showHint]);

  const handleDismiss = useCallback(() => {
    persistDismiss();
    hideBanner();
  }, [hideBanner]);

  const handleInstallRequest = useCallback(() => {
    if (isStandaloneMode()) return;
    try { localStorage.removeItem(DISMISS_KEY); } catch { /* noop */ }
    showBanner();
  }, [showBanner]);

  useEffect(() => {
    window.addEventListener(PWA_INSTALL_REQUEST_EVENT, handleInstallRequest);
    return () => window.removeEventListener(PWA_INSTALL_REQUEST_EVENT, handleInstallRequest);
  }, [handleInstallRequest]);

  const shareGlyph = isIOS ? (
    <svg className="pwa-inline-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13"/><path d="m8 7 4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>
    </svg>
  ) : (
    <svg className="pwa-inline-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>
    </svg>
  );

  return (
    <>
      {/* Install banner */}
      {shown && (
        <div
          className={`pwa-banner is-shown${animIn ? " is-in" : ""}`}
          role="region"
          aria-label="앱 설치 안내"
        >
          <div className="pwa-ico" aria-hidden="true">P</div>
          <div className="pwa-text">
            <div className="pwa-banner-title">PhysiqueHub 바로 열기</div>
            <div className="pwa-banner-sub">
              {isIOS
                ? "Safari 공유 메뉴 > 더보기 > 홈 화면에 추가"
                : "홈 화면에 추가해 모바일 앱처럼 사용할 수 있습니다."}
            </div>
          </div>
          <button className="pwa-install-btn" type="button" onClick={handleInstall}>
            {isIOS ? "방법 보기" : "추가"}
          </button>
          <button className="pwa-dismiss-btn" type="button" onClick={handleDismiss} aria-label="닫기">
            {Icons.close}
          </button>
        </div>
      )}

      {/* Instruction hint sheet */}
      {hintShown && (
        <div
          className={`pwa-hint-sheet is-shown${hintIn ? " is-in" : ""}`}
          role="dialog"
          aria-label="홈 화면에 추가하는 방법"
        >
          <div className="pwa-hint-head">
            <span className="pwa-hint-title">홈 화면에 추가하기</span>
            <button className="pwa-hint-close" type="button" onClick={hideHint} aria-label="닫기">
              {Icons.close}
            </button>
          </div>
          {isIOS ? (
            <>
              <div className="pwa-step">
                <span className="pwa-step-n">1</span>
                <span>Safari 하단 메뉴의 <b>공유</b>{shareGlyph}버튼을 누르세요.</span>
              </div>
              <div className="pwa-step">
                <span className="pwa-step-n">2</span>
                <span>목록에서 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 선택하세요.</span>
              </div>
              <div className="pwa-step">
                <span className="pwa-step-n">3</span>
                <span>오른쪽 위 <b>추가</b>를 누르면 완료됩니다.</span>
              </div>
            </>
          ) : (
            <>
              <div className="pwa-step">
                <span className="pwa-step-n">1</span>
                <span>브라우저 오른쪽 위 <b>더보기</b>{shareGlyph}메뉴를 누르세요.</span>
              </div>
              <div className="pwa-step">
                <span className="pwa-step-n">2</span>
                <span><b>&lsquo;앱 설치&rsquo;</b> 또는 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 선택하세요.</span>
              </div>
              <div className="pwa-step">
                <span className="pwa-step-n">3</span>
                <span>안내에 따라 <b>설치</b>를 누르면 완료됩니다.</span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
