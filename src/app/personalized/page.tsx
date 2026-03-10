"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, Eye, ChevronDown, ChevronUp, Newspaper } from "lucide-react";
import clsx from "clsx";
import {
  riskScore,
  crisisSignals,
  newsItems,
  userTypes,
  userTypePresets,
  userTypeBriefings,
  type UserType,
  type CategoryName,
  type CrisisSignal,
} from "@/lib/data";

const categoryLabels: CategoryName[] = ["물가", "고용", "자영업", "금융", "부동산"];

function getGrade(score: number) {
  if (score >= 70) return { label: "위험", color: "text-red-500", bg: "bg-red-500" };
  if (score >= 50) return { label: "주의", color: "text-[#FF6B00]", bg: "bg-[#FF6B00]" };
  if (score >= 30) return { label: "관심", color: "text-yellow-600", bg: "bg-yellow-500" };
  return { label: "안전", color: "text-emerald-500", bg: "bg-emerald-500" };
}

const severityConfig = {
  urgent: { label: "긴급", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-500" },
  warning: { label: "주의", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-500" },
  watch: { label: "관찰", icon: Eye, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-500" },
};

function SignalItem({ signal }: { signal: CrisisSignal }) {
  const [open, setOpen] = useState(false);
  const sev = severityConfig[signal.severity];
  const Icon = sev.icon;

  return (
    <div className={clsx("rounded-xl border p-5 transition-all", sev.bg, sev.border)}>
      <button onClick={() => setOpen(!open)} className="w-full text-left cursor-pointer">
        <div className="flex items-start gap-3">
          <Icon className={clsx("w-4 h-4 mt-0.5 shrink-0", sev.color)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full text-white", sev.badge)}>{sev.label}</span>
              <span className="text-[11px] text-[#AAA]">{signal.category} · {signal.region}</span>
              <span className="text-[11px] text-[#BBB] ml-auto">{signal.date}</span>
            </div>
            <p className="text-sm font-bold text-[#1A1A1A] leading-relaxed">{signal.title}</p>
            <p className="text-xs text-[#888] mt-1 leading-relaxed">{signal.description}</p>
          </div>
          <div className="shrink-0 mt-1">
            {open ? <ChevronUp className="w-4 h-4 text-[#BBB]" /> : <ChevronDown className="w-4 h-4 text-[#BBB]" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-dashed border-[#E0DDD8] space-y-4 ml-7">
          {/* 타임라인 */}
          {signal.timeline && signal.timeline.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#666] mb-2">흐름</p>
              <div className="relative ml-2">
                <div className="absolute left-0 top-1 bottom-1 w-px bg-[#DDD]" />
                {signal.timeline.map((t, i) => (
                  <div key={i} className="relative pl-5 py-1.5">
                    <div className={clsx(
                      "absolute left-0 top-[10px] -translate-x-1/2 w-2 h-2 rounded-full border-2",
                      i === signal.timeline!.length - 1 ? "bg-[#FF6B00] border-[#FF6B00]" : "bg-white border-[#CCC]"
                    )} />
                    <span className="text-[11px] text-[#AAA] font-mono mr-2">{t.date}</span>
                    <span className="text-xs text-[#555]">{t.headline}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 과거 사례 */}
          {signal.pastCase && (
            <div>
              <p className="text-xs font-bold text-[#666] mb-1">과거엔 이랬어요</p>
              <p className="text-xs text-[#777] leading-relaxed">{signal.pastCase}</p>
            </div>
          )}

          {/* 대응 가이드 */}
          {signal.actionGuide && signal.actionGuide.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#666] mb-2">이렇게 대응해보세요</p>
              <ul className="space-y-1.5">
                {signal.actionGuide.map((guide, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#555] leading-relaxed">
                    <span className="text-[#FF6B00] font-bold shrink-0">{i + 1}.</span>
                    {guide}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PersonalizedPage() {
  const [selectedType, setSelectedType] = useState<UserType>("직장인");
  const [selectedCategories, setSelectedCategories] = useState<CategoryName[]>(userTypePresets["직장인"]);

  const handleTypeSelect = (type: UserType) => {
    setSelectedType(type);
    setSelectedCategories(userTypePresets[type]);
  };

  const toggleCategory = (cat: CategoryName) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // 필터된 데이터
  const filteredSignals = crisisSignals.filter((s) => selectedCategories.includes(s.category));
  const filteredNews = newsItems.filter((n) => selectedCategories.includes(n.category));
  const filteredCategoryScores = riskScore.categories.filter((c) => selectedCategories.includes(c.name));

  return (
    <div className="space-y-0">

      {/* 헤더 */}
      <section className="py-10 lg:py-16 animate-fade-in">
        <h1 className="text-[28px] lg:text-[32px] font-extrabold text-[#1A1A1A] mb-2">개인 맞춤형 분석</h1>
        <p className="text-base text-[#1A1A1A]">나의 상황에 맞는 위기 신호와 대응 방법을 확인해보세요.</p>

        {/* 유형 선택 */}
        <div className="mt-8">
          <p className="text-sm font-bold text-[#555] mb-3">나는</p>
          <div className="flex flex-wrap gap-2">
            {userTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
                  selectedType === type
                    ? "bg-[#1A1A1A] text-white"
                    : "bg-[#F5F4F2] text-[#888] hover:bg-[#EEEDEB] hover:text-[#555]"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 관심 분야 토글 */}
        <div className="mt-6">
          <p className="text-sm font-bold text-[#555] mb-3">관심 분야</p>
          <div className="flex flex-wrap gap-2">
            {categoryLabels.map((cat) => {
              const active = selectedCategories.includes(cat);
              const catScore = riskScore.categories.find((c) => c.name === cat);
              const cg = catScore ? getGrade(catScore.score) : null;
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={clsx(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border",
                    active
                      ? "bg-[#FFF8F3] text-[#FF6B00] border-[#FFD9B3] font-bold"
                      : "bg-white text-[#BBB] border-[#EEECEA] hover:border-[#DDD]"
                  )}
                >
                  {cat}
                  {active && cg && (
                    <span className={clsx("ml-1.5 text-xs", cg.color)}>{catScore!.score}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 맞춤 브리핑 */}
      <section className="py-10 lg:py-12 border-t border-[#EEECEA] animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
          <div className="lg:col-span-6">
            <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-4">
              <span className="text-[#FF6B00]">{selectedType}</span>에게 드리는 브리핑
            </h2>
            <p className="text-[15px] text-[#444] leading-[1.9]">
              {userTypeBriefings[selectedType]}
            </p>
          </div>

          {/* 관련 카테고리 점수 */}
          <div className="lg:col-span-4">
            <div className="space-y-3">
              {filteredCategoryScores.map((cat) => {
                const cg = getGrade(cat.score);
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#555] w-14 shrink-0">{cat.name}</span>
                    <div className="flex-1 h-2 bg-[#F0EDE8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.score}%`,
                          backgroundColor: cat.score >= 70 ? "#EF4444" : cat.score >= 50 ? "#FF6B00" : cat.score >= 30 ? "#EAB308" : "#10B981",
                        }}
                      />
                    </div>
                    <span className={clsx("text-sm font-bold tabular-nums w-8 text-right", cg.color)}>{cat.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 나에게 영향 있는 신호 */}
      <section className="py-10 lg:py-12 border-t border-[#EEECEA] animate-fade-in">
        <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-2">나에게 영향 있는 신호</h2>
        <p className="text-sm text-[#999] mb-6">클릭하면 흐름과 대응 방법을 볼 수 있어요.</p>

        {filteredSignals.length === 0 ? (
          <p className="text-sm text-[#BBB] text-center py-8">선택한 분야에 해당하는 신호가 없어요.</p>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal) => (
              <SignalItem key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </section>

      {/* 관련 뉴스 */}
      <section className="py-10 lg:py-12 border-t border-[#EEECEA] animate-fade-in">
        <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-2">관련 뉴스</h2>
        <p className="text-sm text-[#999] mb-6">선택한 분야의 최신 뉴스예요.</p>

        {filteredNews.length === 0 ? (
          <p className="text-sm text-[#BBB] text-center py-8">선택한 분야에 해당하는 뉴스가 없어요.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNews.map((news) => {
              const sev = severityConfig[news.severity];
              return (
                <div key={news.id} className="rounded-xl border border-[#EEECEA] p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full text-white", sev.badge)}>{sev.label}</span>
                    <span className="text-[11px] text-[#AAA]">{news.category}</span>
                    <span className="text-[11px] text-[#BBB] ml-auto">{news.date}</span>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] leading-relaxed mb-2">{news.title}</p>
                  <p className="text-xs text-[#888] leading-relaxed mb-3">{news.summary}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {news.keywords.map((kw) => (
                      <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F4F2] text-[#888]">{kw}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
