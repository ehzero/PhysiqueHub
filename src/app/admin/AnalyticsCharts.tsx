"use client";

import { useSyncExternalStore } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

// 클라이언트 마운트 감지: 서버 스냅샷 false, 클라이언트 true. 이펙트/setState 없이
// 하이드레이션 안전하게 "마운트됨"을 얻는다(차트는 마운트 후에만 렌더).
const noopSubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// 어드민 전용 차트 섬. recharts를 import하는 유일한 파일이라 공개 번들에 섞이지
// 않는다. 서버 컴포넌트는 직렬화 가능한 원시 데이터(number[])만 넘긴다.

type SparkTone = "accent" | "pos" | "warn" | "neg";

const TONE_COLOR: Record<SparkTone, string> = {
  accent: "var(--ac-accent)",
  pos: "var(--ac-pos)",
  warn: "var(--ac-warn)",
  neg: "var(--ac-neg)",
};

const SPARK_HEIGHT = 36;

export function Sparkline({
  data,
  tone = "accent",
  ariaLabel,
}: {
  data: number[];
  tone?: SparkTone;
  ariaLabel: string;
}) {
  // ResponsiveContainer는 DOM 측정을 쓰므로 SSR에서 -1 치수 경고/CLS가 난다.
  // mount 후에만 렌더해 하이드레이션 미스매치를 피한다(어드민이라 SSR 불필요).
  const mounted = useIsMounted();

  if (data.length < 2) {
    return <div className="ac-spark is-flat" style={{ height: SPARK_HEIGHT }} aria-hidden="true" />;
  }
  if (!mounted) {
    return (
      <div className="ac-spark" style={{ height: SPARK_HEIGHT }} role="img" aria-label={ariaLabel} />
    );
  }

  const color = TONE_COLOR[tone];
  const gradientId = `ac-spark-${tone}`;
  const points = data.map((value, index) => ({ index, value }));

  return (
    <div className="ac-spark" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={SPARK_HEIGHT}>
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
