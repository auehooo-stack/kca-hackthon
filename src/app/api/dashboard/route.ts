import { NextResponse } from "next/server";
import { getDb, CATEGORY_KEYS, CATEGORY_MAP } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 복합 리스크 점수 계산
 * - 기사 밀도 (일평균 기사 수 대비 최근 7일)
 * - 고관련 기사 비율 (relevance_score >= 10)
 * - 평균 relevance_score
 */
function computeRiskScore(db: ReturnType<typeof getDb>, category: string, latest: string, periodDays: number, offsetDays = 0) {
  const startDate = offsetDays > 0
    ? `DATE('${latest}', '-${offsetDays + periodDays} days')`
    : `DATE('${latest}', '-${periodDays} days')`;
  const endDate = offsetDays > 0
    ? `DATE('${latest}', '-${offsetDays} days')`
    : `'${latest}'`;

  const stats = db.prepare(`
    SELECT
      COUNT(*) as cnt,
      AVG(relevance_score) as avg_score,
      SUM(CASE WHEN relevance_score >= 10 THEN 1 ELSE 0 END) as high_cnt,
      MAX(relevance_score) as max_score
    FROM articles
    WHERE category = ? AND DATE(published_at) >= ${startDate} AND DATE(published_at) <= ${endDate}
  `).get(category) as { cnt: number; avg_score: number; high_cnt: number; max_score: number };

  // 연간 일평균 기사 수 (기준선)
  const { daily_avg } = db.prepare(`
    SELECT CAST(COUNT(*) AS REAL) / 365 as daily_avg FROM articles WHERE category = ?
  `).get(category) as { daily_avg: number };

  const dailyCnt = stats.cnt / periodDays;
  const densityRatio = daily_avg > 0 ? dailyCnt / daily_avg : 1;

  // 복합 점수 (0~100)
  const densityScore = Math.min(40, densityRatio * 30);                          // 기사 밀도 (0~40)
  const relevanceScore = Math.min(35, (stats.avg_score || 0) * 4);              // 평균 관련도 (0~35)
  const highRatioScore = stats.cnt > 0                                           // 고위험 비율 (0~25)
    ? Math.min(25, (stats.high_cnt / stats.cnt) * 100)
    : 0;

  return Math.round(Math.min(100, densityScore + relevanceScore + highRatioScore));
}

export function GET() {
  const db = getDb();

  const { latest } = db.prepare("SELECT MAX(DATE(published_at)) as latest FROM articles").get() as { latest: string };

  // ===== 카테고리별 리스크 점수 =====
  const categories = CATEGORY_KEYS.map((key) => {
    const label = CATEGORY_MAP[key];
    const score = computeRiskScore(db, key, latest, 7);
    const prevScore = computeRiskScore(db, key, latest, 7, 7);
    const diff = score - prevScore;
    const trend = diff > 3 ? "up" as const : diff < -3 ? "down" as const : "stable" as const;

    const { cnt } = db.prepare(`
      SELECT COUNT(*) as cnt FROM articles WHERE category = ? AND DATE(published_at) >= DATE(?, '-7 days')
    `).get(key, latest) as { cnt: number };

    return { name: label, score, trend, articleCount: cnt };
  });

  // 종합 점수
  const weights: Record<string, number> = { 물가: 0.25, 고용: 0.2, 자영업: 0.2, 금융: 0.2, 부동산: 0.15 };
  const overallScore = Math.round(
    categories.reduce((sum, c) => sum + c.score * (weights[c.name] || 0.2), 0)
  );

  // ===== 과거 비교 =====
  function getOverallAt(offsetDays: number) {
    const scores = CATEGORY_KEYS.map((key) => {
      const s = computeRiskScore(db, key, latest, 7, offsetDays);
      return s * (weights[CATEGORY_MAP[key]] || 0.2);
    });
    return Math.round(scores.reduce((a, b) => a + b, 0));
  }

  const comparisons = [
    { label: "어제", score: getOverallAt(1) },
    { label: "1주 전", score: getOverallAt(7) },
    { label: "1개월 전", score: getOverallAt(30) },
    { label: "1년 전", score: getOverallAt(365) },
  ];

  // ===== 카테고리별 일별 추이 (최근 90일) =====
  const trendByCategory: Record<string, { date: string; score: number }[]> = {};
  for (const key of CATEGORY_KEYS) {
    const label = CATEGORY_MAP[key];
    const rows = db.prepare(`
      SELECT DATE(published_at) as date,
        COUNT(*) as cnt,
        AVG(relevance_score) as avg_score,
        SUM(CASE WHEN relevance_score >= 10 THEN 1 ELSE 0 END) as high_cnt
      FROM articles
      WHERE category = ? AND DATE(published_at) >= DATE(?, '-90 days')
      GROUP BY DATE(published_at)
      ORDER BY date
    `).all(key, latest) as { date: string; cnt: number; avg_score: number; high_cnt: number }[];

    const { daily_avg } = db.prepare(
      "SELECT CAST(COUNT(*) AS REAL) / 365 as daily_avg FROM articles WHERE category = ?"
    ).get(key) as { daily_avg: number };

    trendByCategory[label] = rows.map((r) => {
      const densityRatio = daily_avg > 0 ? r.cnt / daily_avg : 1;
      const densityScore = Math.min(40, densityRatio * 30);
      const relevanceScore = Math.min(35, (r.avg_score || 0) * 4);
      const highRatioScore = r.cnt > 0 ? Math.min(25, (r.high_cnt / r.cnt) * 100) : 0;
      return {
        date: r.date.slice(5),
        score: Math.round(Math.min(100, densityScore + relevanceScore + highRatioScore)),
      };
    });
  }

  // 종합 일별 추이
  const overallDailyMap = new Map<string, number[]>();
  for (const [, arr] of Object.entries(trendByCategory)) {
    for (const d of arr) {
      if (!overallDailyMap.has(d.date)) overallDailyMap.set(d.date, []);
      overallDailyMap.get(d.date)!.push(d.score);
    }
  }
  const overallDaily = Array.from(overallDailyMap.entries())
    .map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    latestDate: latest,
    overallScore,
    comparisons,
    categories,
    trendByCategory,
    overallDaily,
  });
}
