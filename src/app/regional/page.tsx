"use client";

import { ArrowUp, ArrowDown, Minus, Trophy } from "lucide-react";
import { regionData } from "@/lib/data";
import clsx from "clsx";

function getGrade(score: number) {
  if (score >= 70) return { label: "위험", color: "text-red-500", bg: "bg-red-500" };
  if (score >= 50) return { label: "주의", color: "text-[#FF6B00]", bg: "bg-[#FF6B00]" };
  if (score >= 30) return { label: "관심", color: "text-yellow-600", bg: "bg-yellow-500" };
  return { label: "안전", color: "text-emerald-500", bg: "bg-emerald-500" };
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <ArrowUp className="w-3.5 h-3.5 text-red-400" />;
  if (trend === "down") return <ArrowDown className="w-3.5 h-3.5 text-blue-400" />;
  return <Minus className="w-3.5 h-3.5 text-[#CCC]" />;
}

export default function RegionalPage() {
  const sorted = [...regionData]
    .filter((r) => r.name !== "전국 평균")
    .sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const national = regionData.find((r) => r.name === "전국 평균")!;

  const rankColors = [
    { border: "border-l-red-400", num: "text-red-400", bg: "bg-gradient-to-r from-red-50/60 to-white" },
    { border: "border-l-[#FF6B00]", num: "text-[#FF6B00]", bg: "bg-gradient-to-r from-orange-50/60 to-white" },
    { border: "border-l-yellow-400", num: "text-yellow-500", bg: "bg-gradient-to-r from-yellow-50/60 to-white" },
  ];

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-[#1A1A1A] mb-1">우리 동네는 어떨까?</h1>
        <p className="text-sm text-[#888]">지역별 민생 위험도를 한눈에 살펴보세요</p>
      </div>

      {/* 전국 평균 + TOP 3 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* 전국 평균 */}
        <div className="card p-6 lg:p-8 animate-fade-in delay-1">
          <p className="text-xs text-[#B0A898] mb-2">전국 평균</p>
          <div className="flex items-baseline gap-2.5 mb-1">
            <span className={clsx("text-5xl font-black tabular-nums", getGrade(national.score).color)}>{national.score}</span>
            <span className={clsx("text-xs font-bold px-2.5 py-0.5 rounded-full text-white", getGrade(national.score).bg)}>
              {getGrade(national.score).label}
            </span>
            <TrendIcon trend={national.trend} />
          </div>
          <p className="text-sm text-[#888] mt-2">{national.topIssue}</p>
        </div>

        {/* TOP 3 */}
        <div className="lg:col-span-2 animate-fade-in delay-2">
          <div className="flex items-center gap-1.5 mb-3">
            <Trophy className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-sm font-bold text-[#555]">위험도 높은 지역 TOP 3</span>
          </div>
          <div className="space-y-2.5">
            {top3.map((region, i) => {
              const g = getGrade(region.score);
              const rc = rankColors[i];
              return (
                <div
                  key={region.name}
                  className={clsx("card border-l-4 p-4 md:p-5", rc.border, rc.bg)}
                >
                  <div className="flex items-center gap-4">
                    <span className={clsx("text-2xl font-black w-8 text-center tabular-nums", rc.num)}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base font-bold text-[#1A1A1A]">{region.name}</span>
                        <TrendIcon trend={region.trend} />
                      </div>
                      <p className="text-xs text-[#999]">{region.topIssue}</p>
                      <div className="mt-2 h-2.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                        <div
                          className={clsx("h-full rounded-full animate-grow", g.bg)}
                          style={{ width: `${region.score}%`, animationDelay: `${0.3 + i * 0.15}s` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={clsx("text-2xl font-black tabular-nums", g.color)}>{region.score}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 전체 지역 */}
      <div className="animate-fade-in delay-3">
        <p className="text-sm font-bold text-[#555] mb-3">전체 지역</p>
        <div className="card divide-y divide-[#F5F3F0] overflow-hidden">
          {rest.map((region) => {
            const g = getGrade(region.score);
            return (
              <div key={region.name} className="flex items-center gap-3 px-5 py-4 hover:bg-[#FAFAF8] transition-colors">
                <span className="text-sm font-semibold text-[#555] w-10 shrink-0">{region.name}</span>
                <div className="flex-1 h-2.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                  <div
                    className={clsx("h-full rounded-full transition-all duration-500", g.bg)}
                    style={{ width: `${region.score}%` }}
                  />
                </div>
                <span className={clsx("text-sm font-extrabold w-8 text-right tabular-nums", g.color)}>{region.score}</span>
                <TrendIcon trend={region.trend} />
                <span className="text-xs text-[#999] w-28 text-right hidden sm:block truncate">{region.topIssue}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
