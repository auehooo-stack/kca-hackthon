"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { type Severity, type CategoryName } from "@/lib/data";
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

interface Signal {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  score: number;
  date: string;
  url: string | null;
}

export default function CrisisSignalsPage() {
  const [selectedCategory, setSelectedCategory] = useState<"전체" | CategoryName>("전체");
  const [selectedSeverity, setSelectedSeverity] = useState<"all" | Severity>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allSignals, setAllSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState({ urgent: 0, warning: 0, watch: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/signals").then(r => r.json()).then(data => {
      setAllSignals(data.signals);
      setStats(data.stats);
      setLoading(false);
    });
  }, []);

  const filtered = allSignals.filter((s) => {
    const catMatch = selectedCategory === "전체" || s.category === selectedCategory;
    const sevMatch = selectedSeverity === "all" || s.severity === selectedSeverity;
    return catMatch && sevMatch;
  });

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-[#1A1A1A] mb-1">위기 신호</h1>
        <p className="text-sm text-[#888]">지금 주의해야 할 민생 이슈들을 모아봤어요</p>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 animate-fade-in delay-1">
        <div className="card p-4 md:p-5 text-center">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 mx-auto mb-2.5 animate-pulse-glow" />
          <p className="text-3xl md:text-4xl font-black text-red-500 tabular-nums">{stats.urgent}</p>
          <p className="text-xs text-[#999] mt-1 font-medium">긴급</p>
        </div>
        <div className="card p-4 md:p-5 text-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] mx-auto mb-2.5" />
          <p className="text-3xl md:text-4xl font-black text-[#FF6B00] tabular-nums">{stats.warning}</p>
          <p className="text-xs text-[#999] mt-1 font-medium">주의</p>
        </div>
        <div className="card p-4 md:p-5 text-center">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mx-auto mb-2.5" />
          <p className="text-3xl md:text-4xl font-black text-blue-500 tabular-nums">{stats.watch}</p>
          <p className="text-xs text-[#999] mt-1 font-medium">관찰</p>
        </div>
      </div>

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
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  selectedCategory === cat ? "bg-[#FF6B00] text-white shadow-sm" : "bg-[#F5F3F0] text-[#777] hover:bg-[#EBE8E4]"
                )}
              >{cat}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {severities.map((sev) => (
              <button
                key={sev.value}
                onClick={() => setSelectedSeverity(sev.value)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  selectedSeverity === sev.value ? "bg-[#333] text-white" : "bg-[#F5F3F0] text-[#777] hover:bg-[#EBE8E4]"
                )}
              >{sev.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="card p-10 text-center">
            <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-[#BBB]">불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-[#AAA]">해당 조건의 위기 신호가 없어요</p>
          </div>
        ) : (
          filtered.map((signal) => {
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
                        <span className="text-xs text-[#AAA]">{signal.category}</span>
                        <span className="text-xs font-mono text-[#CCC]">{signal.score}pt</span>
                      </div>
                      <h3 className="text-base font-bold text-[#1A1A1A] mb-1.5 leading-snug">{signal.title}</h3>
                      {signal.description && (
                        <p className="text-sm text-[#888] leading-relaxed line-clamp-2">{signal.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0 pt-1">
                      <span className="text-[11px] text-[#BBB]">{signal.date}</span>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-[#CCC] mt-1" /> : <ChevronDown className="w-5 h-5 text-[#CCC] mt-1" />}
                    </div>
                  </div>
                </div>

                {isOpen && signal.description && (
                  <div className="px-5 md:px-6 pb-6 border-t border-[#F0EDE8] pt-5 animate-scale-in">
                    <p className="text-sm text-[#555] leading-[1.8]">{signal.description}</p>
                    {signal.url && (
                      <a href={signal.url} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-3 text-xs text-[#FF6B00] hover:underline">
                        원문 보기 →
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
