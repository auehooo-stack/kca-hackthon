import { NextRequest, NextResponse } from "next/server";
import { getDb, CATEGORY_MAP, type CategoryKey } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const db = getDb();
  const params = req.nextUrl.searchParams;

  const category = params.get("category"); // CategoryKey or CategoryLabel
  const search = params.get("q");
  const limit = Math.min(Number(params.get("limit") || 20), 100);
  const offset = Number(params.get("offset") || 0);
  const minScore = Number(params.get("minScore") || 0);

  let where = "WHERE 1=1";
  const binds: (string | number)[] = [];

  if (category) {
    // 한글 라벨이면 영어 키로 변환
    const key = Object.entries(CATEGORY_MAP).find(
      ([k, v]) => v === category || k === category
    );
    if (key) {
      where += " AND category = ?";
      binds.push(key[0]);
    }
  }

  if (search) {
    where += " AND (title LIKE ? OR summary LIKE ?)";
    binds.push(`%${search}%`, `%${search}%`);
  }

  if (minScore > 0) {
    where += " AND relevance_score >= ?";
    binds.push(minScore);
  }

  // 전체 건수
  const { total } = db.prepare(`SELECT COUNT(*) as total FROM articles ${where}`).get(...binds) as { total: number };

  // 기사 목록
  const rows = db.prepare(`
    SELECT id, title, summary, category, category_label, keywords, published_at, region, url, relevance_score
    FROM articles ${where}
    ORDER BY published_at DESC
    LIMIT ? OFFSET ?
  `).all(...binds, limit, offset) as {
    id: string; title: string; summary: string | null;
    category: string; category_label: string; keywords: string;
    published_at: string; region: string | null; url: string | null;
    relevance_score: number;
  }[];

  const articles = rows.map((r) => ({
    ...r,
    keywords: safeParseJSON(r.keywords),
    severity: scoreToSeverity(r.relevance_score),
  }));

  return NextResponse.json({ total, articles });
}

function safeParseJSON(str: string | null): string[] {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return []; }
}

function scoreToSeverity(score: number): "urgent" | "warning" | "watch" {
  if (score >= 30) return "urgent";
  if (score >= 15) return "warning";
  return "watch";
}
