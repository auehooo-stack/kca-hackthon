"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Lightbulb,
  Filter,
} from "lucide-react";
import { crisisSignals, type Severity, type CategoryName } from "@/lib/data";
import clsx from "clsx";

const categories: ("전체" | CategoryName)[] = ["전체", "물가", "고용", "자영업", "금융", "부동산"];
const severities: { value: "all" | Severity; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "urgent", label: "긴급" },
  { value: "warning", label: "주의" },
  { value: "watch", label: "관찰" },
];

const severityMap = {
  urgent: { label: "긴급", color: "text-red-600", dot: "bg-red-500", bgCard: "card-urgent" },
  warning: { label: "주의", color: "text-[#FF6B00]", dot: "bg-[#FF6B00]", bgCard: "card" },
  watch: { label: "관찰", color: "text-blue-600", dot: "bg-blue-500", bgCard: "card" },
};

export default function CrisisSignalsPage() {
  const [selectedCategory, setSelectedCategory] = useState<"전체" | CategoryName>("전체");
  const [selectedSeverity, setSelectedSeverity] = useState<"all" | Severity>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = crisisSignals.filter((s) => {
    const catMatch = selectedCategory === "전체" || s.category === selectedCategory;
    const sevMatch = selectedSeverity === "all" || s.severity === selectedSeverity;
    return catMatch && sevMatch;
  });

  const urgentCount = crisisSignals.filter((s) => s.severity === "urgent").length;
  const warningCount = crisisSignals.filter((s) => s.severity === "warning").length;
  const watchCount = crisisSignals.filter((s) => s.severity === "watch").length;

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-[#1A1A1A] mb-1">위기 신호</h1>
        <p className="text-sm text-[#888]">지금 주의해야 할 민생 이슈들을 모아봤어요</p>
      </div>

      {/* 신호 통계 */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 animate-fade-in delay-1">
        <div className="card p-4 md:p-5 text-center">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 mx-auto mb-2.5 animate-pulse-glow" />
          <p className="text-3xl md:text-4xl font-black text-red-500 tabular-nums">{urgentCount}</p>
          <p className="text-xs text-[#999] mt-1 font-medium">긴급</p>
        </div>
        <div className="card p-4 md:p-5 text-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] mx-auto mb-2.5" />
          <p className="text-3xl md:text-4xl font-black text-[#FF6B00] tabular-nums">{warningCount}</p>
          <p className="text-xs text-[#999] mt-1 font-medium">주의</p>
        </div>
        <div className="card p-4 md:p-5 text-center">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mx-auto mb-2.5" />
          <p className="text-3xl md:text-4xl font-black text-blue-500 tabular-nums">{watchCount}</p>
          <p className="text-xs text-[#999] mt-1 font-medium">관찰</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="card p-5 animate-fade-in delay-2">
        <div className="flex items-center gap-1.5 mb-3">
          <Filter className="w-3.5 h-3.5 text-[#AAA]" />
          <span className="text-xs font-semibold text-[#AAA]">필터</span>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-[#FF6B00] text-white shadow-sm"
                    : "bg-[#F5F3F0] text-[#777] hover:bg-[#EBE8E4]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {severities.map((sev) => (
              <button
                key={sev.value}
                onClick={() => setSelectedSeverity(sev.value)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedSeverity === sev.value
                    ? "bg-[#333] text-white"
                    : "bg-[#F5F3F0] text-[#777] hover:bg-[#EBE8E4]"
                )}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 신호 목록 */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-sm text-[#AAA]">해당 조건의 위기 신호가 없어요</p>
          </div>
        )}
        {filtered.map((signal) => {
          const sev = severityMap[signal.severity];
          const isOpen = expandedId === signal.id;

          return (
            <div key={signal.id} className={clsx(sev.bgCard, "overflow-hidden transition-all rounded-2xl animate-fade-in", isOpen && "shadow-md")}>
              <div className="p-5 md:p-6 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : signal.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={clsx("w-2 h-2 rounded-full shrink-0", sev.dot, signal.severity === "urgent" && "animate-pulse-glow")} />
                      <span className={clsx("text-xs font-bold", sev.color)}>{sev.label}</span>
                      <span className="text-xs text-[#CCC]">|</span>
                      <span className="text-xs text-[#AAA]">{signal.category} · {signal.region}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#1A1A1A] mb-1.5 leading-snug">{signal.title}</h3>
                    <p className="text-sm text-[#888] leading-relaxed">{signal.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 pt-1">
                    <span className="text-[11px] text-[#BBB]">{signal.date}</span>
                    <span className="text-[11px] text-[#BBB]">기사 {signal.articleCount}건</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-[#CCC] mt-1" /> : <ChevronDown className="w-5 h-5 text-[#CCC] mt-1" />}
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="px-5 md:px-6 pb-6 space-y-6 border-t border-[#F0EDE8] pt-5 animate-scale-in">
                  {signal.timeline && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                        </div>
                        <span className="text-sm font-bold text-[#333]">어떻게 여기까지 왔을까?</span>
                      </div>
                      <div className="pl-6 border-l-2 border-[#FFD9B8] space-y-4">
                        {signal.timeline.map((ev, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[1.75rem] top-1.5 w-3 h-3 rounded-full bg-[#FF6B00] ring-3 ring-[#FFF0E5]" />
                            <p className="text-[11px] text-[#BBB] font-mono mb-0.5">{ev.date}</p>
                            <p className="text-sm text-[#444] leading-relaxed">{ev.headline}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {signal.pastCase && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                          <History className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <span className="text-sm font-bold text-[#333]">과거엔 이랬어요</span>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-2xl p-5 border border-blue-100">
                        <p className="text-sm text-blue-800 leading-[1.8]">{signal.pastCase}</p>
                      </div>
                    </div>
                  )}

                  {signal.actionGuide && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-bold text-[#333]">지금 할 수 있는 것</span>
                      </div>
                      <div className="space-y-2.5">
                        {signal.actionGuide.map((action, i) => (
                          <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-emerald-50 to-emerald-50/50 rounded-xl px-5 py-3.5 border border-emerald-100">
                            <span className="text-sm font-extrabold text-emerald-500 shrink-0 mt-px">{i + 1}</span>
                            <p className="text-sm text-emerald-800 leading-relaxed">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
