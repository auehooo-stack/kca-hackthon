"use client";

import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Newspaper,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import {
  riskScore,
  briefing,
  categoryDetails,
  type CategoryName,
} from "@/lib/data";
import clsx from "clsx";

function getGrade(score: number) {
  if (score >= 70) return { label: "위험", color: "text-red-500", bg: "bg-red-500", ring: "ring-red-100" };
  if (score >= 50) return { label: "주의", color: "text-[#FF6B00]", bg: "bg-[#FF6B00]", ring: "ring-orange-100" };
  if (score >= 30) return { label: "관심", color: "text-yellow-600", bg: "bg-yellow-500", ring: "ring-yellow-100" };
  return { label: "안전", color: "text-emerald-500", bg: "bg-emerald-500", ring: "ring-emerald-100" };
}

function getGaugeColor(score: number) {
  if (score >= 70) return "#EF4444";
  if (score >= 50) return "#FF6B00";
  if (score >= 30) return "#EAB308";
  return "#10B981";
}

function getGradeLabel(score: number) {
  if (score >= 70) return "위험";
  if (score >= 50) return "주의";
  if (score >= 30) return "관심";
  return "안전";
}

/** CNN Fear & Greed 스타일 반원 게이지 */
function RiskGauge({ score }: { score: number }) {
  const cx = 220;
  const cy = 200;
  const outerR = 185;
  const innerR = 125;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const scoreToAngle = (s: number) => 180 - (s / 100) * 180;

  const zones = [
    { from: 0, to: 30, fill: "#E8F5E9", stroke: "#81C784" },
    { from: 30, to: 50, fill: "#FFF8E1", stroke: "#FFD54F" },
    { from: 50, to: 70, fill: "#FFF3E0", stroke: "#FFB74D" },
    { from: 70, to: 100, fill: "#FFEBEE", stroke: "#EF9A9A" },
  ];

  const activeZone = score >= 70 ? 3 : score >= 50 ? 2 : score >= 30 ? 1 : 0;

  function sectorPath(fromScore: number, toScore: number) {
    const a1 = toRad(scoreToAngle(fromScore));
    const a2 = toRad(scoreToAngle(toScore));
    const sweep = toScore - fromScore > 50 ? 1 : 0;
    const ox1 = cx + outerR * Math.cos(a1);
    const oy1 = cy - outerR * Math.sin(a1);
    const ox2 = cx + outerR * Math.cos(a2);
    const oy2 = cy - outerR * Math.sin(a2);
    const ix1 = cx + innerR * Math.cos(a1);
    const iy1 = cy - innerR * Math.sin(a1);
    const ix2 = cx + innerR * Math.cos(a2);
    const iy2 = cy - innerR * Math.sin(a2);
    return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${sweep} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${sweep} 0 ${ix1} ${iy1} Z`;
  }

  // 바늘 (가늘고 긴 테이퍼)
  const needleAngle = toRad(scoreToAngle(score));
  const needleLen = innerR - 6;
  const tipX = cx + needleLen * Math.cos(needleAngle);
  const tipY = cy - needleLen * Math.sin(needleAngle);
  const baseHalf = 3.5;
  const perpAngle = needleAngle + Math.PI / 2;
  const bx1 = cx + baseHalf * Math.cos(perpAngle);
  const by1 = cy - baseHalf * Math.sin(perpAngle);
  const bx2 = cx - baseHalf * Math.cos(perpAngle);
  const by2 = cy + baseHalf * Math.sin(perpAngle);

  const labels = [
    { text: "안전", fromScore: 0, toScore: 30 },
    { text: "관심", fromScore: 30, toScore: 50 },
    { text: "주의", fromScore: 50, toScore: 70 },
    { text: "위험", fromScore: 70, toScore: 100 },
  ];

  const ticks = [
    { value: 0, angle: 180 },
    { value: 25, angle: 135 },
    { value: 50, angle: 90 },
    { value: 75, angle: 45 },
    { value: 100, angle: 0 },
  ];

  return (
    <svg viewBox="0 0 440 260" className="w-full max-w-[520px]">
      {/* 구간 호 */}
      {zones.map((z, i) => (
        <path
          key={i}
          d={sectorPath(z.from, z.to)}
          fill={z.fill}
          stroke={i === activeZone ? z.stroke : "transparent"}
          strokeWidth={i === activeZone ? 3 : 0}
          opacity={i === activeZone ? 1 : 0.5}
        />
      ))}

      {/* 구간 경계선 */}
      {[30, 50, 70].map((s) => {
        const a = toRad(scoreToAngle(s));
        const ix = cx + (innerR - 2) * Math.cos(a);
        const iy = cy - (innerR - 2) * Math.sin(a);
        const ox = cx + (outerR + 2) * Math.cos(a);
        const oy = cy - (outerR + 2) * Math.sin(a);
        return <line key={s} x1={ix} y1={iy} x2={ox} y2={oy} stroke="white" strokeWidth="4" />;
      })}

      {/* 구간 라벨 (호 위에, 곡선 따라 회전) */}
      {labels.map((l, i) => {
        const midScore = (l.fromScore + l.toScore) / 2;
        const midAngleDeg = scoreToAngle(midScore);
        const a = toRad(midAngleDeg);
        const midR = (outerR + innerR) / 2;
        const lx = cx + midR * Math.cos(a);
        const ly = cy - midR * Math.sin(a);
        const rotation = -midAngleDeg + 90;
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fontWeight={i === activeZone ? "800" : "600"}
            fill={i === activeZone ? "#333" : "#BBB"}
            transform={`rotate(${rotation}, ${lx}, ${ly})`}
            letterSpacing="2"
          >
            {l.text}
          </text>
        );
      })}

      {/* 눈금 점 + 숫자 */}
      {ticks.map((t) => {
        const a = toRad(t.angle);
        const dotR = innerR - 10;
        const dx = cx + dotR * Math.cos(a);
        const dy = cy - dotR * Math.sin(a);
        const numR = innerR - 26;
        const numX = cx + numR * Math.cos(a);
        const numY = cy - numR * Math.sin(a);
        return (
          <g key={t.value}>
            <circle cx={dx} cy={dy} r="2.5" fill="#CCC" />
            <text x={numX} y={numY} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#BBB">
              {t.value}
            </text>
          </g>
        );
      })}

      {/* 바늘 (삼각형 테이퍼) */}
      <polygon
        points={`${tipX},${tipY} ${bx1},${by1} ${bx2},${by2}`}
        fill="#1A1A1A"
      />
      <circle cx={cx} cy={cy} r="6" fill="#1A1A1A" />

      {/* 중앙 점수 (반원 안쪽 하단) */}
      <text x={cx} y={cy + 50} textAnchor="middle" fontSize="52" fontWeight="900" fill={getGaugeColor(score)}>
        {score}
      </text>
    </svg>
  );
}


export default function Home() {
  const [gaugeTab, setGaugeTab] = useState<"overview" | "timeline">("overview");
  const [openCategory, setOpenCategory] = useState<CategoryName | null>(null);

  return (
    <div className="space-y-0">

      {/* ========== 1. 체감 온도 (CNN Fear & Greed 스타일) ========== */}
      <section className="py-10 lg:py-16 animate-fade-in">
        <h1 className="text-[28px] lg:text-[32px] font-extrabold text-[#1A1A1A] mb-2">민생 체감 온도</h1>
        <p className="text-base text-[#1A1A1A] mb-8">매경 뉴스 데이터를 AI가 분석해, 국민이 체감하는 경제 위기 수준을 0~100으로 나타낸 지표예요.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-center">
          {/* 좌 (3/5 = 6): 게이지+비교 OR 꺾은선그래프 */}
          <div className="lg:col-span-3">
            {/* 탭 버튼 (CNN 스타일) */}
            <div className="flex justify-end mb-4">
              <div className="inline-flex border border-[#D5D3CE] rounded overflow-hidden">
                <button
                  onClick={() => setGaugeTab("overview")}
                  className={clsx(
                    "px-4 py-1.5 text-[13px] font-medium transition-all",
                    gaugeTab === "overview"
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-white text-[#C5C3BE] hover:text-[#999]"
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setGaugeTab("timeline")}
                  className={clsx(
                    "px-4 py-1.5 text-[13px] font-medium transition-all border-l border-[#D5D3CE]",
                    gaugeTab === "timeline"
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-white text-[#C5C3BE] hover:text-[#999]"
                  )}
                >
                  Timeline
                </button>
              </div>
            </div>

            {gaugeTab === "overview" ? (
              /* Overview: 게이지 + 과거 4단계 비교 */
              <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-center">
                <div className="md:col-span-7 flex flex-col items-center">
                  <RiskGauge score={riskScore.total} />
                  <p className="text-xs text-[#BBB] mt-1">Last updated {riskScore.date}</p>
                </div>
                <div className="md:col-span-3 space-y-0 divide-y divide-[#F0EDE8]">
                  {riskScore.comparisons.map((comp) => {
                    const cg = getGrade(comp.score);
                    return (
                      <div key={comp.label} className="flex items-center gap-4 py-4 first:pt-0">
                        <div className="min-w-0">
                          <p className="text-xs text-[#AAA]">{comp.label}</p>
                          <p className="text-sm font-bold text-[#333]">{getGradeLabel(comp.score)}</p>
                        </div>
                        <div className="flex-1 border-b border-dotted border-[#E0DDD8]" />
                        <div className={clsx(
                          "w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold ring-4 tabular-nums shrink-0",
                          cg.color, cg.ring
                        )}>
                          {comp.score}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Timeline: 1년 일별 꺾은선그래프 (CNN 스타일) */
              <div className="-mx-8">
                {(() => {
                  // X축: 4, 7, 10, 1월만 표시
                  const quarterTicks = riskScore.yearHistory
                    .filter((d) => {
                      const [m, day] = d.date.split("/").map(Number);
                      return day === 1 && [1, 4, 7, 10].includes(m);
                    })
                    .map((d) => d.date);
                  return (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={riskScore.yearHistory} margin={{ left: 45, right: 36, top: 5 }}>
                    {/* 가로 점선 그리드 */}
                    <CartesianGrid
                      vertical={false}
                      horizontal={true}
                      stroke="#E8E6E1"
                      strokeDasharray="4 4"
                    />
                    {/* 맨 위 가로선: 실선 */}
                    <ReferenceLine y={100} stroke="#E8E6E1" strokeDasharray="0" />
                    {/* 세로 실선 그리드 (분기 경계) */}
                    {quarterTicks.map((tick) => (
                      <ReferenceLine key={tick} x={tick} stroke="#E8E6E1" strokeDasharray="0" />
                    ))}
                    <XAxis
                      dataKey="date"
                      ticks={quarterTicks}
                      tick={{ fontSize: 12, fill: "#999" }}
                      axisLine={{ stroke: "#E8E6E1", strokeWidth: 1.5 }}
                      tickLine={false}
                      tickFormatter={(v: string) => {
                        const m = Number(v.split("/")[0]);
                        const names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        return m === 1 ? `${names[m]} 2025` : names[m];
                      }}
                    />
                    <YAxis
                      orientation="right"
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fontSize: 12, fill: "#999" }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    {/* 75 위험 라인: 차트 안쪽 왼쪽 위에 ∧ 위험 표시 */}
                    <ReferenceLine
                      y={75}
                      stroke="#E8E6E1"
                      strokeDasharray="4 4"
                      label={{
                        value: "∧  위험",
                        position: "insideTopLeft",
                        fontSize: 11,
                        fill: "#777",
                        fontWeight: 600,
                        offset: 8,
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload as { fullDate: string; score: number };
                        const grade = data.score >= 70 ? "위험" : data.score >= 50 ? "주의" : data.score >= 30 ? "관심" : "안전";
                        const gradeColor = data.score >= 70 ? "#EF4444" : data.score >= 50 ? "#FF6B00" : data.score >= 30 ? "#EAB308" : "#10B981";
                        return (
                          <div className="bg-white rounded-xl border border-[#ECEAE5] px-4 py-3 shadow-lg">
                            <p className="text-xs text-[#999] mb-1">{data.fullDate}</p>
                            <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">{data.score}점</p>
                            <p className="text-xs font-bold" style={{ color: gradeColor }}>{grade}</p>
                          </div>
                        );
                      }}
                    />
                    <Line type="linear" dataKey="score" stroke="#FF6B00" strokeWidth={1.5} dot={false} activeDot={{ r: 4, stroke: "#FF6B00", strokeWidth: 2, fill: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
                  );
                })()}
                <p className="text-xs text-[#BBB] mt-3 ml-12">Last updated {riskScore.date}</p>
              </div>
            )}
          </div>

          {/* 우 (2/5 = 4): 브리핑 설명 */}
          <div className="lg:col-span-2">
            <p className="text-[15px] text-[#444] leading-[1.9]">
              {briefing.summary}
            </p>
          </div>
        </div>
      </section>

      {/* ========== 2. 분야별 상세 분석 ========== */}
      <section className="py-12 lg:py-16 border-t border-[#EEECEA] animate-fade-in">
        <h2 className="text-xl lg:text-2xl font-extrabold text-[#1A1A1A] mb-2">분야별로 보면</h2>
        <p className="text-sm text-[#999] mb-8">궁금한 분야를 눌러보세요. 배경과 흐름을 한눈에 볼 수 있어요.</p>

        {/* 5개 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-2">
          {riskScore.categories.map((cat, i) => {
            const cg = getGrade(cat.score);
            const isOpen = openCategory === cat.name;
            const TrendIcon = cat.trend === "up" ? TrendingUp : cat.trend === "down" ? TrendingDown : Minus;
            return (
              <button
                key={cat.name}
                onClick={() => setOpenCategory(isOpen ? null : cat.name)}
                className={clsx(
                  "rounded-2xl border p-5 text-center transition-all duration-200 cursor-pointer animate-fade-in",
                  isOpen
                    ? "border-[#FF6B00] bg-[#FFF8F3] shadow-md -translate-y-1"
                    : "border-[#EEECEA] bg-white hover:-translate-y-1 hover:shadow-lg",
                  `delay-${i + 1}`
                )}
              >
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <p className="text-sm font-bold text-[#333]">{cat.name}</p>
                  <TrendIcon className={clsx("w-3.5 h-3.5", cat.trend === "up" ? "text-red-400" : cat.trend === "down" ? "text-blue-400" : "text-[#BBB]")} />
                </div>
                <div className="w-full aspect-[4/3] rounded-xl bg-[#F3F3F3] mb-4 flex items-center justify-center">
                  <span className="text-xs text-[#CCC]">이미지</span>
                </div>
                <span className={clsx("text-4xl font-black tabular-nums", cg.color)}>{cat.score}</span>
                <div className="mt-2 mb-2">
                  <span className={clsx("text-[11px] font-bold px-3 py-1 rounded-full text-white inline-block", cg.bg)}>
                    {cg.label}
                  </span>
                </div>
                <p className="text-xs text-[#999] leading-relaxed">{cat.description}</p>
              </button>
            );
          })}
        </div>

        {/* 펼쳐지는 상세 영역 */}
        {openCategory && (() => {
          const detail = categoryDetails[openCategory];
          const cat = riskScore.categories.find(c => c.name === openCategory)!;
          const cg = getGrade(cat.score);
          return (
            <div className="mt-6 rounded-2xl border border-[#EEECEA] bg-white overflow-hidden animate-scale-in">
              {/* 헤더 */}
              <div className="px-6 lg:px-8 pt-6 pb-4 border-b border-[#F0EDE8]">
                <div className="flex items-center gap-3">
                  <span className={clsx("text-2xl font-black tabular-nums", cg.color)}>{cat.score}</span>
                  <span className={clsx("text-xs font-bold px-2.5 py-0.5 rounded-full text-white", cg.bg)}>{cg.label}</span>
                  <h3 className="text-lg font-extrabold text-[#1A1A1A]">{openCategory}</h3>
                </div>
              </div>

              {/* 2단 구조 콘텐츠 */}
              <div className="space-y-0 divide-y divide-[#F0EDE8]">

                {/* 1단: 3개월 추이 + 핵심 키워드 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#F0EDE8]">
                  {/* 추이 차트 (최근 3개월) */}
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                      <span className="text-sm font-bold text-[#333]">3개월 추이</span>
                    </div>
                    {(() => {
                      const monthTicks = detail.dailyTrend
                        .filter(d => d.date.endsWith("/1"))
                        .map(d => d.date);
                      return (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={detail.dailyTrend} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                            <CartesianGrid stroke="#F0EDE8" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                              dataKey="date"
                              ticks={monthTicks}
                              tick={{ fontSize: 11, fill: "#BBB" }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v: string) => {
                                const m = Number(v.split("/")[0]);
                                return `${m}월`;
                              }}
                            />
                            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 10, fill: "#BBB" }} axisLine={false} tickLine={false} width={28} />
                            <ReferenceLine y={75} stroke="#FEE2E2" strokeDasharray="3 3" />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload as { date: string; score: number };
                                return (
                                  <div className="bg-white rounded-lg border border-[#EEE] px-3 py-2 shadow-md">
                                    <p className="text-xs text-[#999]">{d.date}</p>
                                    <p className="text-sm font-bold">{d.score}점</p>
                                  </div>
                                );
                              }}
                            />
                            <Line type="monotone" dataKey="score" stroke="#FF6B00" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: "#fff", stroke: "#FF6B00", strokeWidth: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>

                  {/* 핵심 키워드 */}
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                      <span className="text-sm font-bold text-[#333]">핵심 키워드</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detail.keywords.map((kw, i) => {
                        const maxCount = detail.keywords[0].count;
                        const ratio = kw.count / maxCount;
                        const isTop = i < 3;
                        return (
                          <span
                            key={kw.word}
                            className={clsx(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                              isTop
                                ? "bg-[#FFF3E8] text-[#CC5500] font-bold border border-[#FFE0C2]"
                                : "bg-[#F5F4F2] text-[#777] font-medium"
                            )}
                            style={{ fontSize: `${Math.max(12, 11 + ratio * 3)}px` }}
                          >
                            {kw.word}
                            <span className={clsx("text-[10px]", isTop ? "text-[#FF8C3A]" : "text-[#BBB]")}>{kw.count}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2단: 이슈 흐름 + 과거 대처 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#F0EDE8]">
                  {/* 이슈 흐름 (세로 타임라인) */}
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <Newspaper className="w-4 h-4 text-[#FF6B00]" />
                      <span className="text-sm font-bold text-[#333]">이슈 흐름</span>
                    </div>
                    <div className="relative ml-3">
                      {/* 세로선 */}
                      <div className="absolute left-0 top-1 bottom-1 w-px bg-[#E5E3DE]" />
                      <div className="space-y-0">
                        {detail.newsFlow.map((news, i) => (
                          <div key={i} className="relative flex gap-4 py-3 pl-6">
                            {/* 타임라인 점 */}
                            <div className={clsx(
                              "absolute left-0 top-[18px] -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2",
                              i === detail.newsFlow.length - 1
                                ? "bg-[#FF6B00] border-[#FF6B00]"
                                : "bg-white border-[#D5D3CE]"
                            )} />
                            <span className="text-[11px] text-[#BBB] font-mono shrink-0 pt-0.5 w-10">{news.date}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#444] leading-relaxed">{news.headline}</p>
                            </div>
                            {news.impact === "up" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            ) : news.impact === "down" ? (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-[#CCC] shrink-0 mt-0.5" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 과거 대처 */}
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <History className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-[#333]">과거엔 이랬어요</span>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                      <p className="text-xs font-bold text-blue-600 mb-2">{detail.pastCase.period}</p>
                      <p className="text-sm text-blue-800 leading-[1.8] mb-3">{detail.pastCase.summary}</p>
                      <div className="flex items-start gap-2 pt-3 border-t border-blue-100">
                        <span className="text-xs font-bold text-blue-500 shrink-0">결과</span>
                        <p className="text-xs text-blue-700 leading-relaxed">{detail.pastCase.result}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>
    </div>
  );
}
