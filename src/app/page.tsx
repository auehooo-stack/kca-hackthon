"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  History,
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
import { type CategoryName } from "@/lib/data";
import clsx from "clsx";

// ===== API 응답 타입 =====

interface DashboardData {
  latestDate: string;
  overallScore: number;
  comparisons: { label: string; score: number }[];
  categories: { name: CategoryName; score: number; trend: "up" | "down" | "stable"; articleCount: number }[];
  trendByCategory: Record<string, { date: string; score: number }[]>;
  overallDaily: { date: string; score: number }[];
}

interface SignalsData {
  signals: { id: string; title: string; description: string; category: string; severity: string; score: number; date: string; url?: string | null }[];
  keywordsByCategory: Record<string, { word: string; count: number }[]>;
  stats: { urgent: number; warning: number; watch: number };
  topArticlesByCategory: Record<string, { id: string; title: string; date: string; score: number; severity: string; url: string | null }[]>;
  responsesByCategory: Record<string, { issue: string; response: string; responseType: string; article: { title: string; date: string; url: string | null } }[]>;
}

// ===== 유틸 =====

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${weekdays[d.getDay()]}`;
}

/** 카테고리 점수 기반 브리핑 자동 생성 */
function generateBriefing(categories: DashboardData["categories"]) {
  const sorted = [...categories].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const second = sorted[1];

  const descByScore: Record<string, string[]> = {
    물가: [
      "장바구니 물가가 많이 불안해요. 농산물·식료품 가격이 크게 오르면서 생활비 부담이 커지고 있어요.",
      "물가가 조금씩 오르고 있어요. 장보실 때 가격 비교를 꼼꼼히 하시는 게 좋겠어요.",
      "물가는 비교적 안정적이에요.",
    ],
    고용: [
      "고용 시장이 많이 불안해요. 채용 축소 소식이 잇따르고 있어서 주의가 필요해요.",
      "고용 시장에 주의가 필요해요. 업종별로 채용 분위기가 엇갈리고 있어요.",
      "고용 시장은 비교적 안정적이에요.",
    ],
    자영업: [
      "소상공인·자영업자 부담이 크게 늘고 있어요. 수수료와 재료비 이중고가 심각해요.",
      "자영업 환경에 주의가 필요해요. 매출 관리에 좀 더 신경 쓰시면 좋겠어요.",
      "자영업 환경은 비교적 안정적이에요.",
    ],
    금융: [
      "금융 리스크가 높아요. 대출 금리와 연체율이 동시에 오르고 있어서 가계 부담이 커요.",
      "금융 쪽 주의가 필요해요. 카드 사용과 대출 이자를 한번 점검해보세요.",
      "금융 환경은 비교적 안정적이에요.",
    ],
    부동산: [
      "부동산 부담이 크게 늘고 있어요. 전세·매매 가격 변동이 심해서 주의가 필요해요.",
      "부동산 시장에 주의가 필요해요. 전세 만기가 다가오시면 시세를 미리 확인해두세요.",
      "부동산 시장은 비교적 안정적이에요.",
    ],
  };

  function getDesc(name: string, score: number) {
    const descs = descByScore[name] || ["", "", ""];
    if (score >= 65) return descs[0];
    if (score >= 45) return descs[1];
    return descs[2];
  }

  return `${getDesc(top.name, top.score)} ${getDesc(second.name, second.score)}`;
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
      {[30, 50, 70].map((s) => {
        const a = toRad(scoreToAngle(s));
        const ix = cx + (innerR - 2) * Math.cos(a);
        const iy = cy - (innerR - 2) * Math.sin(a);
        const ox = cx + (outerR + 2) * Math.cos(a);
        const oy = cy - (outerR + 2) * Math.sin(a);
        return <line key={s} x1={ix} y1={iy} x2={ox} y2={oy} stroke="white" strokeWidth="4" />;
      })}
      {labels.map((l, i) => {
        const midScore = (l.fromScore + l.toScore) / 2;
        const midAngleDeg = scoreToAngle(midScore);
        const a = toRad(midAngleDeg);
        const midR = (outerR + innerR) / 2;
        const lx = cx + midR * Math.cos(a);
        const ly = cy - midR * Math.sin(a);
        const rotation = -midAngleDeg + 90;
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fontWeight={i === activeZone ? "800" : "600"}
            fill={i === activeZone ? "#333" : "#BBB"}
            transform={`rotate(${rotation}, ${lx}, ${ly})`} letterSpacing="2"
          >
            {l.text}
          </text>
        );
      })}
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
            <text x={numX} y={numY} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#BBB">{t.value}</text>
          </g>
        );
      })}
      <polygon points={`${tipX},${tipY} ${bx1},${by1} ${bx2},${by2}`} fill="#1A1A1A" />
      <circle cx={cx} cy={cy} r="6" fill="#1A1A1A" />
      <text x={cx} y={cy + 50} textAnchor="middle" fontSize="52" fontWeight="900" fill={getGaugeColor(score)}>{score}</text>
    </svg>
  );
}


export default function Home() {
  const [gaugeTab, setGaugeTab] = useState<"overview" | "timeline">("overview");
  const [openCategory, setOpenCategory] = useState<CategoryName | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [signals, setSignals] = useState<SignalsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/signals").then((r) => r.json()),
    ]).then(([d, s]) => {
      setDashboard(d);
      setSignals(s);
      setLoading(false);
    });
  }, []);

  if (loading || !dashboard || !signals) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#999]">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const briefingText = generateBriefing(dashboard.categories);
  const formattedDate = formatDate(dashboard.latestDate);

  // 카테고리 설명 생성
  const catDescriptions: Record<string, string> = {};
  for (const cat of dashboard.categories) {
    const score = cat.score;
    const nameMap: Record<string, string[]> = {
      물가: ["장바구니 부담이 커지고 있어요", "장바구니 물가가 불안해요", "물가가 안정되고 있어요", "물가 걱정 없는 수준이에요"],
      고용: ["취업 시장이 많이 어려워요", "고용 시장에 주의가 필요해요", "취업 시장이 조금 나아지는 중이에요", "고용 시장이 안정적이에요"],
      자영업: ["소상공인 부담이 많이 늘고 있어요", "자영업 환경에 주의가 필요해요", "자영업 환경이 조금 나아지고 있어요", "자영업 환경이 안정적이에요"],
      금융: ["금융 리스크가 높아지고 있어요", "대출·카드 연체에 주의가 필요해요", "금융 지표가 안정되는 중이에요", "금융 환경이 안정적이에요"],
      부동산: ["부동산 부담이 크게 늘고 있어요", "전세 가격이 다시 오르는 조짐이에요", "부동산 시장이 안정되는 중이에요", "부동산 걱정 없는 수준이에요"],
    };
    const descs = nameMap[cat.name] || ["", "", "", ""];
    catDescriptions[cat.name] = score >= 70 ? descs[0] : score >= 50 ? descs[1] : score >= 30 ? descs[2] : descs[3];
  }

  return (
    <div className="space-y-0">

      {/* ========== 1. 체감 온도 ========== */}
      <section className="py-10 lg:py-16 animate-fade-in">
        <h1 className="text-[28px] lg:text-[32px] font-extrabold text-[#1A1A1A] mb-2">민생 체감 온도</h1>
        <p className="text-base text-[#1A1A1A] mb-8">매경 뉴스 데이터를 AI가 분석해, 국민이 체감하는 경제 위기 수준을 0~100으로 나타낸 지표예요.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-center">
          <div className="lg:col-span-3">
            <div className="flex justify-end mb-4">
              <div className="inline-flex border border-[#D5D3CE] rounded overflow-hidden">
                <button
                  onClick={() => setGaugeTab("overview")}
                  className={clsx(
                    "px-4 py-1.5 text-[13px] font-medium transition-all cursor-pointer",
                    gaugeTab === "overview" ? "bg-[#1A1A1A] text-white" : "bg-white text-[#C5C3BE] hover:text-[#999]"
                  )}
                >Overview</button>
                <button
                  onClick={() => setGaugeTab("timeline")}
                  className={clsx(
                    "px-4 py-1.5 text-[13px] font-medium transition-all border-l border-[#D5D3CE] cursor-pointer",
                    gaugeTab === "timeline" ? "bg-[#1A1A1A] text-white" : "bg-white text-[#C5C3BE] hover:text-[#999]"
                  )}
                >Timeline</button>
              </div>
            </div>

            {gaugeTab === "overview" ? (
              <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-center">
                <div className="md:col-span-7 flex flex-col items-center">
                  <RiskGauge score={dashboard.overallScore} />
                  <p className="text-xs text-[#BBB] mt-1">Last updated {formattedDate}</p>
                </div>
                <div className="md:col-span-3 space-y-0 divide-y divide-[#F0EDE8]">
                  {dashboard.comparisons.map((comp) => {
                    const hasData = comp.score > 0;
                    const cg = getGrade(comp.score);
                    return (
                      <div key={comp.label} className="flex items-center gap-4 py-4 first:pt-0">
                        <div className="min-w-0">
                          <p className="text-xs text-[#AAA]">{comp.label}</p>
                          <p className="text-sm font-bold text-[#333]">{hasData ? getGradeLabel(comp.score) : "—"}</p>
                        </div>
                        <div className="flex-1 border-b border-dotted border-[#E0DDD8]" />
                        {hasData ? (
                          <div className={clsx(
                            "w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold ring-4 tabular-nums shrink-0",
                            cg.color, cg.ring
                          )}>{comp.score}</div>
                        ) : (
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs text-[#CCC] ring-4 ring-[#F5F4F2] shrink-0">N/A</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="-mx-8">
                {(() => {
                  const data = dashboard.overallDaily.map((d) => ({
                    ...d,
                    fullDate: `2025년 ${d.date.replace("-", "월 ")}일`,
                  }));
                  const quarterTicks = data
                    .filter((d) => {
                      const parts = d.date.split("-");
                      return parts[1] === "01" && ["01", "04", "07", "10"].includes(parts[0]);
                    })
                    .map((d) => d.date);
                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data} margin={{ left: 45, right: 36, top: 5 }}>
                        <CartesianGrid vertical={false} horizontal stroke="#E8E6E1" strokeDasharray="4 4" />
                        <ReferenceLine y={100} stroke="#E8E6E1" strokeDasharray="0" />
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
                            const m = Number(v.split("-")[0]);
                            const names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            return m === 1 ? `${names[m]} 2025` : names[m];
                          }}
                        />
                        <YAxis orientation="right" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
                          tick={{ fontSize: 12, fill: "#999" }} axisLine={false} tickLine={false} width={32} />
                        <ReferenceLine y={75} stroke="#E8E6E1" strokeDasharray="4 4"
                          label={{ value: "∧  위험", position: "insideTopLeft", fontSize: 11, fill: "#777", fontWeight: 600, offset: 8 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload as { fullDate: string; score: number };
                            const gradeColor = d.score >= 70 ? "#EF4444" : d.score >= 50 ? "#FF6B00" : d.score >= 30 ? "#EAB308" : "#10B981";
                            return (
                              <div className="bg-white rounded-xl border border-[#ECEAE5] px-4 py-3 shadow-lg">
                                <p className="text-xs text-[#999] mb-1">{d.fullDate}</p>
                                <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">{d.score}점</p>
                                <p className="text-xs font-bold" style={{ color: gradeColor }}>{getGradeLabel(d.score)}</p>
                              </div>
                            );
                          }}
                        />
                        <Line type="linear" dataKey="score" stroke="#FF6B00" strokeWidth={1.5} dot={false}
                          activeDot={{ r: 4, stroke: "#FF6B00", strokeWidth: 2, fill: "#fff" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()}
                <p className="text-xs text-[#BBB] mt-3 ml-12">Last updated {formattedDate}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <p className="text-[15px] text-[#444] leading-[1.9]">{briefingText}</p>
          </div>
        </div>
      </section>

      {/* ========== 2. 분야별 상세 분석 ========== */}
      <section className="py-12 lg:py-16 border-t border-[#EEECEA] animate-fade-in">
        <h2 className="text-xl lg:text-2xl font-extrabold text-[#1A1A1A] mb-2">분야별로 보면</h2>
        <p className="text-sm text-[#999] mb-8">궁금한 분야를 눌러보세요. 배경과 흐름을 한눈에 볼 수 있어요.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-2">
          {dashboard.categories.map((cat, i) => {
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
                  <span className={clsx("text-[11px] font-bold px-3 py-1 rounded-full text-white inline-block", cg.bg)}>{cg.label}</span>
                </div>
                <p className="text-xs text-[#999] leading-relaxed">{catDescriptions[cat.name]}</p>
              </button>
            );
          })}
        </div>

        {/* 펼쳐지는 상세 영역 */}
        {openCategory && (() => {
          const cat = dashboard.categories.find(c => c.name === openCategory)!;
          const cg = getGrade(cat.score);
          const dailyTrend = dashboard.trendByCategory[openCategory] || [];
          const keywords = signals.keywordsByCategory[openCategory] || [];
          const catArticles = signals.topArticlesByCategory[openCategory] || [];
          const responseData = signals.responsesByCategory[openCategory] || { summary: "", articles: [] };

          return (
            <div className="mt-6 rounded-2xl border border-[#EEECEA] bg-white overflow-hidden animate-scale-in">
              <div className="px-6 lg:px-8 pt-6 pb-4 border-b border-[#F0EDE8]">
                <div className="flex items-center gap-3">
                  <span className={clsx("text-2xl font-black tabular-nums", cg.color)}>{cat.score}</span>
                  <span className={clsx("text-xs font-bold px-2.5 py-0.5 rounded-full text-white", cg.bg)}>{cg.label}</span>
                  <h3 className="text-lg font-extrabold text-[#1A1A1A]">{openCategory}</h3>
                  <span className="text-xs text-[#BBB] ml-auto">최근 7일 기사 {cat.articleCount}건</span>
                </div>
              </div>

              <div className="space-y-0 divide-y divide-[#F0EDE8]">
                {/* 1단: 90일 추이 + 핵심 키워드 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#F0EDE8]">
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                      <span className="text-sm font-bold text-[#333]">90일 추이</span>
                    </div>
                    {(() => {
                      const monthTicks = dailyTrend
                        .filter(d => d.date.endsWith("-01"))
                        .map(d => d.date);
                      return (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={dailyTrend} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                            <CartesianGrid stroke="#F0EDE8" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                              dataKey="date"
                              ticks={monthTicks}
                              tick={{ fontSize: 11, fill: "#BBB" }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v: string) => `${Number(v.split("-")[0])}월`}
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
                            <Line type="monotone" dataKey="score" stroke="#FF6B00" strokeWidth={1.5} dot={false}
                              activeDot={{ r: 4, fill: "#fff", stroke: "#FF6B00", strokeWidth: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>

                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                      <span className="text-sm font-bold text-[#333]">핵심 키워드</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw, i) => {
                        const maxCount = keywords[0]?.count || 1;
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

                {/* 2단: 대응 사례 */}
                {responseData.length > 0 && (
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <History className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-[#333]">이렇게 대응했어요</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {responseData.map((rd, i) => (
                        <div key={i} className="rounded-xl border border-[#EEECEA] bg-[#FAFAF8] p-5 space-y-3">
                          <div>
                            <p className="text-[11px] font-bold text-red-400 mb-1">주요 이슈</p>
                            <p className="text-[13px] text-[#333] leading-relaxed">{rd.issue}</p>
                          </div>
                          <div className="border-t border-dashed border-[#E5E3DE] pt-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{rd.responseType}</span>
                              <p className="text-[11px] font-bold text-emerald-700">대응</p>
                            </div>
                            <p className="text-[13px] text-[#444] leading-relaxed">{rd.response}</p>
                          </div>
                          <div className="border-t border-[#EEECEA] pt-3">
                            <p className="text-[10px] text-[#BBB] mb-1">관련 기사</p>
                            {rd.article.url ? (
                              <a href={rd.article.url} target="_blank" rel="noopener noreferrer"
                                className="text-[12px] text-[#666] leading-relaxed hover:text-[#FF6B00] transition-colors line-clamp-2">
                                {rd.article.title}
                              </a>
                            ) : (
                              <p className="text-[12px] text-[#666] leading-relaxed line-clamp-2">{rd.article.title}</p>
                            )}
                            <p className="text-[10px] text-[#BBB] mt-1">{rd.article.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3단: 주요 기사 */}
                {catArticles.length > 0 && (
                  <div className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <Newspaper className="w-4 h-4 text-[#FF6B00]" />
                      <span className="text-sm font-bold text-[#333]">주요 기사</span>
                      <span className="text-[11px] text-[#BBB]">관련도 높은 기사</span>
                    </div>
                    <div className="relative ml-3">
                      <div className="absolute left-0 top-1 bottom-1 w-px bg-[#E5E3DE]" />
                      <div className="space-y-0">
                        {catArticles.map((s, i) => (
                          <div key={s.id} className="relative flex gap-4 py-3 pl-6">
                            <div className={clsx(
                              "absolute left-0 top-[18px] -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2",
                              i === 0 ? "bg-[#FF6B00] border-[#FF6B00]" : "bg-white border-[#D5D3CE]"
                            )} />
                            <span className="text-[11px] text-[#BBB] font-mono shrink-0 pt-0.5 w-16">{s.date.slice(5)}</span>
                            <div className="flex-1 min-w-0">
                              {s.url ? (
                                <a href={s.url} target="_blank" rel="noopener noreferrer"
                                  className="text-sm text-[#444] leading-relaxed hover:text-[#FF6B00] transition-colors">
                                  {s.title}
                                </a>
                              ) : (
                                <p className="text-sm text-[#444] leading-relaxed">{s.title}</p>
                              )}
                            </div>
                            <span className={clsx(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0 mt-0.5",
                              s.severity === "urgent" ? "bg-red-500" : s.severity === "warning" ? "bg-orange-500" : "bg-blue-500"
                            )}>{s.score}pt</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </section>
    </div>
  );
}
