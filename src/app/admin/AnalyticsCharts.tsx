"use client";

import { useSyncExternalStore } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

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

type SparkPoint = { index: number; value: number; day?: string };

// "2026-06-24" → "6월 24일". 알 수 없으면 원본을 그대로 보여준다.
function formatSparkDay(day?: string): string {
  if (!day) return "";
  const parts = day.split("-");
  if (parts.length !== 3) return day;
  return `${Number(parts[1])}월 ${Number(parts[2])}일`;
}

function SparkTooltip({
  active,
  payload,
  valueLabel,
  tone,
}: {
  active?: boolean;
  payload?: { payload: SparkPoint }[];
  valueLabel: string;
  tone: SparkTone;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="ac-spark-tip" role="presentation">
      {point.day && <span className="ac-spark-tip-day">{formatSparkDay(point.day)}</span>}
      <span className="ac-spark-tip-val">
        <span className="ac-spark-tip-dot" style={{ background: TONE_COLOR[tone] }} aria-hidden="true" />
        {valueLabel} {point.value.toLocaleString("ko-KR")}
      </span>
    </div>
  );
}

export function Sparkline({
  data,
  days,
  tone = "accent",
  ariaLabel,
  valueLabel,
}: {
  data: number[];
  days?: string[];
  tone?: SparkTone;
  ariaLabel: string;
  valueLabel?: string;
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
  const points: SparkPoint[] = data.map((value, index) => ({ index, value, day: days?.[index] }));

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
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
            wrapperStyle={{ outline: "none", zIndex: 20 }}
            allowEscapeViewBox={{ x: false, y: true }}
            content={<SparkTooltip valueLabel={valueLabel ?? ""} tone={tone} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 2.5, stroke: color, fill: color }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
