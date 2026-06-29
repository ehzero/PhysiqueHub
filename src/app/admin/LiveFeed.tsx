"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// 실시간 활동 피드(어드민 전용). 폴링 기반 near-real-time.
// - 4초마다 /admin/live-events를 친다(인덱스 꼬리 조회라 가벼움).
// - 탭이 숨겨지면 폴링·시계를 멈춰 불필요한 호출을 막는다(가시성 API).
// - 켜짐/꺼짐 토글을 localStorage에 기억(useSyncExternalStore로 SSR 안전).
// - after 커서로 신규 행만 받아 dedupe 후 위에 prepend, 최대 MAX_ROWS 유지.
// - 새 행은 CSS로 페이드인. 진짜 SSE/WebSocket이 아니라 폴링이라 서버리스에 안전.

const POLL_MS = 4000;
const CLOCK_MS = 1000;
const MAX_ROWS = 14;
const STORAGE_KEY = "ph-admin-livefeed-enabled";
const TOGGLE_EVENT = "ph-admin-livefeed-toggle";

type FeedEvent = {
  id: string;
  name: string;
  label: string;
  at: string;
  target: string;
  device: string | null;
};

// localStorage를 외부 스토어로 사용: 토글 상태를 탭/리로드 간 유지하면서 하이드레이션
// 미스매치 없이 읽는다(서버 스냅샷은 기본 켜짐).
function subscribeEnabled(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(TOGGLE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TOGGLE_EVENT, callback);
  };
}
function getEnabledSnapshot() {
  return localStorage.getItem(STORAGE_KEY) !== "0"; // 기본값 켜짐
}
function getServerEnabledSnapshot() {
  return true;
}
function setEnabledStored(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // 저장 불가(프라이빗 모드 등)는 무시 — 세션 내 동작은 유지.
  }
  window.dispatchEvent(new Event(TOGGLE_EVENT));
}

function relativeTime(at: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(at).getTime()) / 1000));
  if (seconds < 5) return "방금";
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export function LiveFeed() {
  const enabled = useSyncExternalStore(
    subscribeEnabled,
    getEnabledSnapshot,
    getServerEnabledSnapshot,
  );
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [now, setNow] = useState(0);
  const eventsRef = useRef<FeedEvent[]>([]);

  // 렌더 중이 아니라 커밋 후 effect에서 ref를 동기화한다(poll 커서 조회용).
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function poll() {
      if (document.hidden) return;
      const cursor = eventsRef.current[0]?.at;
      try {
        const res = await fetch(
          `/admin/live-events${cursor ? `?after=${encodeURIComponent(cursor)}` : ""}`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { events?: FeedEvent[] };
        const incoming = data.events;
        if (cancelled || !Array.isArray(incoming) || incoming.length === 0) return;
        setEvents((prev) => {
          const seen = new Set(prev.map((event) => event.id));
          const fresh = incoming.filter((event) => !seen.has(event.id));
          if (fresh.length === 0) return prev;
          return [...fresh, ...prev].slice(0, MAX_ROWS);
        });
      } catch {
        // 네트워크 일시 오류는 무시하고 다음 틱에 재시도.
      }
    }

    void poll();
    const pollTimer = setInterval(poll, POLL_MS);
    const clockTimer = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, CLOCK_MS);
    const onVisibility = () => {
      if (!document.hidden) {
        setNow(Date.now());
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      clearInterval(clockTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  return (
    <div className="ac-feed-wrap">
      <div className="ac-feed-head">
        <span className="ac-feed-title">실시간 활동</span>
        <button
          aria-checked={enabled}
          className="ac-feed-toggle"
          onClick={() => setEnabledStored(!enabled)}
          role="switch"
          type="button"
        >
          <span aria-hidden="true" className="ac-feed-switch" />
          {enabled ? "켜짐" : "꺼짐"}
        </button>
      </div>
      {!enabled ? (
        <div className="ac-feed ac-feed-empty">실시간 피드가 꺼져 있습니다.</div>
      ) : events.length === 0 ? (
        <div className="ac-feed ac-feed-empty">실시간 활동 대기 중…</div>
      ) : (
        <ol aria-label="실시간 활동" className="ac-feed" role="log">
          {events.map((event) => (
            <li className="ac-feed-row" key={event.id}>
              <span className="ac-feed-time">{relativeTime(event.at, now)}</span>
              <span className="ac-feed-label">{event.label}</span>
              <span className="ac-feed-target" title={event.target}>
                {event.target}
              </span>
              {event.device && <span className="ac-feed-device">{event.device}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
