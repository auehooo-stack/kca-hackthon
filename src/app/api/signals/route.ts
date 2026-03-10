import { NextRequest, NextResponse } from "next/server";
import { getDb, CATEGORY_MAP, CATEGORY_KEYS } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const db = getDb();
  const params = req.nextUrl.searchParams;
  const category = params.get("category");

  // 최신 날짜
  const { latest } = db.prepare("SELECT MAX(DATE(published_at)) as latest FROM articles").get() as { latest: string };

  // 최근 14일간 relevance_score가 높은 기사를 위기 신호로 변환
  let catFilter = "";
  const binds: string[] = [latest];
  if (category) {
    const key = Object.entries(CATEGORY_MAP).find(([k, v]) => v === category || k === category);
    if (key) {
      catFilter = "AND category = ?";
      binds.push(key[0]);
    }
  }

  const rows = db.prepare(`
    SELECT id, title, summary, category, category_label, published_at, relevance_score, url
    FROM articles
    WHERE DATE(published_at) >= DATE(?, '-14 days') ${catFilter}
      AND relevance_score >= 5
    ORDER BY relevance_score DESC, published_at DESC
    LIMIT 30
  `).all(...binds) as {
    id: string; title: string; summary: string | null;
    category: string; category_label: string;
    published_at: string; relevance_score: number; url: string | null;
  }[];

  const signals = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.summary || "",
    category: r.category_label,
    severity: r.relevance_score >= 30 ? "urgent" as const : r.relevance_score >= 15 ? "warning" as const : "watch" as const,
    score: r.relevance_score,
    date: r.published_at.slice(0, 10),
    url: r.url,
  }));

  // 카테고리별 키워드 (최근 30일 기사 제목에서 추출)
  const keywordsByCategory: Record<string, { word: string; count: number }[]> = {};
  for (const key of CATEGORY_KEYS) {
    const label = CATEGORY_MAP[key];
    const titles = db.prepare(`
      SELECT title FROM articles
      WHERE category = ? AND DATE(published_at) >= DATE(?, '-30 days')
      ORDER BY relevance_score DESC
      LIMIT 200
    `).all(key, latest) as { title: string }[];

    // 2글자 이상 단어 빈도 추출 (간단한 형태소 분석 대체)
    const freq = new Map<string, number>();
    const stopwords = new Set(["기자", "특파원", "오늘", "내일", "관련", "이후", "대해", "위해", "통해", "것으로", "지난", "올해", "내년", "지난해", "따르면", "전문", "이번", "현재", "최근", "이상", "이하", "매경", "한겨레", "속보"]);
    for (const { title } of titles) {
      // 한글 단어 추출 (2~6글자)
      const words = title.match(/[가-힣]{2,6}/g) || [];
      for (const w of words) {
        if (!stopwords.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
      }
    }
    keywordsByCategory[label] = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  // 신호 통계
  const stats = {
    urgent: signals.filter((s) => s.severity === "urgent").length,
    warning: signals.filter((s) => s.severity === "warning").length,
    watch: signals.filter((s) => s.severity === "watch").length,
  };

  // 카테고리별 주요 기사 (전체 기간, relevance 높은 순)
  const topArticlesByCategory: Record<string, { id: string; title: string; date: string; score: number; severity: string; url: string | null }[]> = {};
  for (const key of CATEGORY_KEYS) {
    const label = CATEGORY_MAP[key];
    const topRows = db.prepare(`
      SELECT id, title, published_at, relevance_score, url
      FROM articles
      WHERE category = ?
        AND relevance_score >= 5
      ORDER BY relevance_score DESC, published_at DESC
      LIMIT 8
    `).all(key) as { id: string; title: string; published_at: string; relevance_score: number; url: string | null }[];
    topArticlesByCategory[label] = topRows.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.published_at.slice(0, 10),
      score: r.relevance_score,
      severity: r.relevance_score >= 30 ? "urgent" : r.relevance_score >= 15 ? "warning" : "watch",
      url: r.url,
    }));
  }

  // 카테고리별 대응 사례 (이슈 요약 + 대응 요약 + 출처 기사 1건)
  // 대응 키워드 그룹별로 이슈-대응 쌍을 생성
  const responseGroups: { keywords: string[]; label: string }[] = [
    { keywords: ["지원", "보조", "긴급"], label: "지원" },
    { keywords: ["대책", "방안"], label: "대책" },
    { keywords: ["규제", "조치"], label: "규제" },
    { keywords: ["완화", "대응"], label: "완화" },
    { keywords: ["정책"], label: "정책" },
  ];

  // 카테고리별 이슈 컨텍스트
  const categoryIssueContext: Record<string, { issues: string[]; responseTemplates: Record<string, string> }> = {
    prices: {
      issues: ["장바구니 물가 상승으로 생활비 부담 증가", "농산물·에너지 가격 급등", "수입물가 상승에 따른 소비자 부담"],
      responseTemplates: {
        지원: "취약계층 생활비 지원 및 물가안정 보조금 지급",
        대책: "물가안정 종합대책 마련 및 유통구조 개선",
        규제: "가격 담합 단속 및 유통 마진 규제 강화",
        완화: "관세 인하·수입 확대를 통한 공급 안정",
        정책: "물가안정 목표제 강화 및 재정정책 조율",
      },
    },
    employment: {
      issues: ["채용 시장 위축과 청년 실업률 상승", "대량 감원·구조조정 확대", "비정규직 고용 불안 심화"],
      responseTemplates: {
        지원: "청년·취약계층 취업 지원 프로그램 확대",
        대책: "일자리 창출 종합대책 및 직업훈련 강화",
        규제: "부당해고 규제 및 고용안정 의무 강화",
        완화: "고용 규제 완화로 기업 채용 여건 개선",
        정책: "고용정책 로드맵 수립 및 AI 교육 확대",
      },
    },
    selfEmployed: {
      issues: ["소상공인 매출 감소 및 폐업 증가", "임대료·수수료 이중고 심화", "원재료비 상승에 따른 경영난"],
      responseTemplates: {
        지원: "소상공인 경영안정자금 및 재기 지원",
        대책: "자영업자 종합대책 마련 및 세제 혜택",
        규제: "카드수수료·배달앱 수수료 규제 강화",
        완화: "소상공인 세금·보험료 부담 완화",
        정책: "자영업 구조개선 및 디지털 전환 지원",
      },
    },
    finance: {
      issues: ["금리 인상에 따른 가계 이자 부담 급증", "가계부채 증가 및 연체율 상승", "서민금융 접근성 악화"],
      responseTemplates: {
        지원: "취약차주 이자부담 경감 및 서민금융 지원 확대",
        대책: "가계부채 관리 종합대책 및 금융안정 방안",
        규제: "대출 총량 규제 및 과잉대출 관리 강화",
        완화: "대출 규제 일부 완화로 실수요자 부담 경감",
        정책: "금융소비자 보호 강화 및 금리체계 개선",
      },
    },
    realEstate: {
      issues: ["집값·전세 가격 급등으로 주거비 부담 심화", "전세사기 및 역전세 불안 확대", "청년·신혼부부 내집마련 어려움"],
      responseTemplates: {
        지원: "청년·신혼부부 주거자금 지원 및 공공임대 확대",
        대책: "부동산 시장 안정 종합대책 발표",
        규제: "투기과열지구 지정 및 대출·세제 규제 강화",
        완화: "비수도권 규제 완화 및 금융·세제 지원",
        정책: "주거안정 로드맵 수립 및 공급 확대 계획",
      },
    },
  };

  const responsesByCategory: Record<string, {
    issue: string;
    response: string;
    responseType: string;
    article: { title: string; date: string; url: string | null };
  }[]> = {};

  for (const key of CATEGORY_KEYS) {
    const label = CATEGORY_MAP[key];
    const ctx = categoryIssueContext[key];
    const cases: typeof responsesByCategory[string] = [];
    let issueIdx = 0;

    for (const group of responseGroups) {
      if (cases.length >= 3) break;
      const likeConditions = group.keywords.map(() => "title LIKE ?").join(" OR ");
      const likeBinds = group.keywords.map((kw) => `%${kw}%`);

      const row = db.prepare(`
        SELECT title, published_at, url
        FROM articles
        WHERE category = ? AND (${likeConditions})
          AND DATE(published_at) <= '2025-06-30'
        ORDER BY relevance_score DESC, published_at DESC
        LIMIT 1
      `).get(key, ...likeBinds) as { title: string; published_at: string; url: string | null } | undefined;

      if (row) {
        cases.push({
          issue: ctx.issues[issueIdx % ctx.issues.length],
          response: ctx.responseTemplates[group.label] || "",
          responseType: group.label,
          article: {
            title: row.title,
            date: row.published_at.slice(0, 10),
            url: row.url,
          },
        });
        issueIdx++;
      }
    }
    responsesByCategory[label] = cases;
  }

  return NextResponse.json({ signals, keywordsByCategory, stats, topArticlesByCategory, responsesByCategory });
}
