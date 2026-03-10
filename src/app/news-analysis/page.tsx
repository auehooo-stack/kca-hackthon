"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Hash } from "lucide-react";
import { type CategoryName, CATEGORY_LABEL_TO_KEY } from "@/lib/data";
import clsx from "clsx";

const categories: ("전체" | CategoryName)[] = ["전체", "물가", "고용", "자영업", "금융", "부동산"];

const severityStyle = {
  urgent: { label: "긴급", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
  warning: { label: "주의", color: "text-[#FF6B00]", bg: "bg-orange-50", border: "border-orange-100" },
  watch: { label: "관찰", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
};

interface Article {
  id: string;
  title: string;
  summary: string | null;
  category_label: string;
  keywords: string[];
  published_at: string;
  relevance_score: number;
  severity: "urgent" | "warning" | "watch";
}

export default function NewsAnalysisPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"전체" | CategoryName>("전체");
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [topKeywords, setTopKeywords] = useState<{ word: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // 키워드 목록 가져오기
  useEffect(() => {
    fetch("/api/signals").then(r => r.json()).then(data => {
      // 모든 카테고리 키워드 합치기
      const all: { word: string; count: number }[] = [];
      for (const kws of Object.values(data.keywordsByCategory) as { word: string; count: number }[][]) {
        all.push(...kws);
      }
      // 중복 합산
      const merged = new Map<string, number>();
      for (const k of all) merged.set(k.word, (merged.get(k.word) || 0) + k.count);
      setTopKeywords(
        Array.from(merged.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }))
      );
    });
  }, []);

  // 기사 검색
  const fetchArticles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("minScore", "1");

    if (selectedCategory !== "전체") {
      params.set("category", CATEGORY_LABEL_TO_KEY[selectedCategory]);
    }

    const searchTerm = selectedKeyword || search;
    if (searchTerm) {
      params.set("q", searchTerm);
    }

    fetch(`/api/articles?${params}`).then(r => r.json()).then(data => {
      setArticles(data.articles);
      setTotal(data.total);
      setLoading(false);
    });
  }, [selectedCategory, selectedKeyword, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-[#1A1A1A] mb-1">뉴스 분석</h1>
        <p className="text-sm text-[#888]">매경 뉴스를 AI가 분석한 결과예요 · 총 {total.toLocaleString()}건</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">
        <div className="lg:col-span-3 card p-5 space-y-4 animate-fade-in delay-1">
          <div className="relative">
            <Search className="w-4 h-4 text-[#CCC] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="키워드로 검색해보세요"
              value={selectedKeyword || search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedKeyword(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && fetchArticles()}
              className="w-full pl-11 pr-4 py-3 bg-[#F8F6F3] rounded-xl text-sm text-[#333] placeholder:text-[#CCC] outline-none focus:ring-2 focus:ring-[#FF6B00]/20 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  selectedCategory === cat
                    ? "bg-[#FF6B00] text-white shadow-sm"
                    : "bg-[#F5F3F0] text-[#777] hover:bg-[#EBE8E4]"
                )}
              >{cat}</button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card p-5 animate-fade-in delay-2">
          <div className="flex items-center gap-1.5 mb-3">
            <Hash className="w-3.5 h-3.5 text-[#AAA]" />
            <span className="text-xs font-semibold text-[#AAA]">자주 등장하는 키워드</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map((kw) => (
              <button
                key={kw.word}
                onClick={() => setSelectedKeyword(selectedKeyword === kw.word ? null : kw.word)}
                className={clsx(
                  "px-3 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                  selectedKeyword === kw.word
                    ? "bg-[#FF6B00] text-white shadow-sm"
                    : "bg-[#F8F6F3] border border-[#ECEAE5] text-[#666] hover:border-[#FF6B00]/30 hover:text-[#FF6B00]"
                )}
              >
                {kw.word}
                <span className={clsx("ml-1.5 text-[11px]", selectedKeyword === kw.word ? "text-white/70" : "text-[#CCC]")}>{kw.count}</span>
              </button>
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
        ) : articles.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-[#AAA]">검색 결과가 없어요</p>
          </div>
        ) : (
          articles.map((item, idx) => {
            const sev = severityStyle[item.severity];
            return (
              <div key={item.id} className={clsx("card p-5 md:p-6 animate-fade-in", `delay-${Math.min(idx + 1, 8)}`)}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={clsx("text-[11px] font-bold px-2.5 py-0.5 rounded-full border", sev.color, sev.bg, sev.border)}>
                    {sev.label}
                  </span>
                  <span className="text-xs text-[#AAA]">{item.category_label}</span>
                  <span className="text-xs text-[#DDD]">·</span>
                  <span className="text-xs text-[#AAA]">매일경제</span>
                  {item.relevance_score > 0 && (
                    <>
                      <span className="text-xs text-[#DDD]">·</span>
                      <span className="text-xs font-mono text-[#CCC]">{item.relevance_score}pt</span>
                    </>
                  )}
                </div>
                <h3 className="text-base font-bold text-[#1A1A1A] mb-2 leading-snug">{item.title}</h3>
                {item.summary && (
                  <p className="text-sm text-[#888] leading-relaxed mb-3 line-clamp-2">{item.summary}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {item.keywords.map((kw) => (
                      <span
                        key={kw}
                        onClick={() => setSelectedKeyword(selectedKeyword === kw ? null : kw)}
                        className="text-[11px] text-[#FF6B00] bg-[#FFF4EB] px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-[#FFE8D5] transition-colors font-medium"
                      >#{kw}</span>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#CCC] shrink-0 ml-3">{item.published_at.slice(0, 10)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
