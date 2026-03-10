"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, Eye } from "lucide-react";
import clsx from "clsx";
import {
  userTypes,
  userTypePresets,
  userTypeBriefings,
  CATEGORY_LABEL_TO_KEY,
  type UserType,
  type CategoryName,
} from "@/lib/data";

const categoryLabels: CategoryName[] = ["물가", "고용", "자영업", "금융", "부동산"];

interface CategoryScore {
  name: CategoryName;
  score: number;
  trend: "up" | "down" | "stable";
  articleCount: number;
}

interface SignalItem {
  id: string;
  title: string;
  description: string;
  severity: "urgent" | "warning" | "watch";
  category: string;
  score: number;
  date: string;
  url: string | null;
}

interface ArticleItem {
  id: string;
  title: string;
  summary: string | null;
  category_label: string;
  keywords: string[];
  published_at: string;
  relevance_score: number;
  severity: "urgent" | "warning" | "watch";
}

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

export default function PersonalizedPage() {
  const [selectedType, setSelectedType] = useState<UserType>("직장인");
  const [selectedCategories, setSelectedCategories] = useState<CategoryName[]>(userTypePresets["직장인"]);
  const [categories, setCategories] = useState<CategoryScore[]>([]);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 대시보드에서 카테고리 점수 가져오기
  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      setCategories(d.categories);
    });
  }, []);

  // 선택 카테고리 변경 시 신호 + 기사 가져오기
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setSignals([]);
      setArticles([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 각 선택된 카테고리의 신호와 기사를 가져오기
    const catKeys = selectedCategories.map(c => CATEGORY_LABEL_TO_KEY[c]);
    Promise.all([
      // 신호
      fetch("/api/signals").then(r => r.json()),
      // 기사 (각 카테고리별 5개씩)
      Promise.all(catKeys.map(key =>
        fetch(`/api/articles?category=${key}&limit=5&minScore=3`).then(r => r.json())
      )),
    ]).then(([signalData, articleResults]) => {
      // 선택된 카테고리 신호만 필터
      const filteredSignals = signalData.signals.filter(
        (s: SignalItem) => selectedCategories.includes(s.category as CategoryName)
      );
      setSignals(filteredSignals);

      // 기사 합치기 + 날짜순 정렬
      const allArticles = articleResults.flatMap((r: { articles: ArticleItem[] }) => r.articles);
      allArticles.sort((a: ArticleItem, b: ArticleItem) => b.published_at.localeCompare(a.published_at));
      setArticles(allArticles.slice(0, 12));
      setLoading(false);
    });
  }, [selectedCategories]);

  const handleTypeSelect = (type: UserType) => {
    setSelectedType(type);
    setSelectedCategories(userTypePresets[type]);
  };

  const toggleCategory = (cat: CategoryName) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredCategoryScores = categories.filter((c) => selectedCategories.includes(c.name));

  return (
    <div className="space-y-0">

      {/* 헤더 */}
      <section className="py-10 lg:py-16 animate-fade-in">
        <h1 className="text-[28px] lg:text-[32px] font-extrabold text-[#1A1A1A] mb-2">개인 맞춤형 분석</h1>
        <p className="text-base text-[#1A1A1A]">나의 상황에 맞는 위기 신호와 대응 방법을 확인해보세요.</p>

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
              >{type}</button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-bold text-[#555] mb-3">관심 분야</p>
          <div className="flex flex-wrap gap-2">
            {categoryLabels.map((cat) => {
              const active = selectedCategories.includes(cat);
              const catScore = categories.find((c) => c.name === cat);
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
                  {active && cg && <span className={clsx("ml-1.5 text-xs", cg.color)}>{catScore!.score}</span>}
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
            <p className="text-[15px] text-[#444] leading-[1.9]">{userTypeBriefings[selectedType]}</p>
          </div>
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
        <p className="text-sm text-[#999] mb-6">관련도가 높은 최신 기사들이에요.</p>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-[#BBB]">불러오는 중...</p>
          </div>
        ) : signals.length === 0 ? (
          <p className="text-sm text-[#BBB] text-center py-8">선택한 분야에 해당하는 신호가 없어요.</p>
        ) : (
          <div className="space-y-3">
            {signals.slice(0, 8).map((signal) => {
              const sev = severityConfig[signal.severity];
              const Icon = sev.icon;
              return (
                <div key={signal.id} className={clsx("rounded-xl border p-5", sev.bg, sev.border)}>
                  <div className="flex items-start gap-3">
                    <Icon className={clsx("w-4 h-4 mt-0.5 shrink-0", sev.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full text-white", sev.badge)}>{sev.label}</span>
                        <span className="text-[11px] text-[#AAA]">{signal.category}</span>
                        <span className="text-[11px] font-mono text-[#CCC]">{signal.score}pt</span>
                        <span className="text-[11px] text-[#BBB] ml-auto">{signal.date}</span>
                      </div>
                      <p className="text-sm font-bold text-[#1A1A1A] leading-relaxed">{signal.title}</p>
                      {signal.description && (
                        <p className="text-xs text-[#888] mt-1 leading-relaxed line-clamp-2">{signal.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 관련 뉴스 */}
      <section className="py-10 lg:py-12 border-t border-[#EEECEA] animate-fade-in">
        <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-2">관련 뉴스</h2>
        <p className="text-sm text-[#999] mb-6">선택한 분야의 최신 뉴스예요.</p>

        {articles.length === 0 ? (
          <p className="text-sm text-[#BBB] text-center py-8">선택한 분야에 해당하는 뉴스가 없어요.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((news) => {
              const sev = severityConfig[news.severity];
              return (
                <div key={news.id} className="rounded-xl border border-[#EEECEA] p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full text-white", sev.badge)}>{sev.label}</span>
                    <span className="text-[11px] text-[#AAA]">{news.category_label}</span>
                    <span className="text-[11px] text-[#BBB] ml-auto">{news.published_at.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] leading-relaxed mb-2">{news.title}</p>
                  {news.summary && (
                    <p className="text-xs text-[#888] leading-relaxed mb-3 line-clamp-2">{news.summary}</p>
                  )}
                  {news.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {news.keywords.map((kw) => (
                        <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F4F2] text-[#888]">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
