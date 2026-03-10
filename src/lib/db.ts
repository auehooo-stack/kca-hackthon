import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "../docs/db/irmi.db");

let _db: Database.Database | null = null;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
    _db.pragma("journal_mode = WAL");
  }
  return _db;
}

// ===== 타입 =====

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  category_label: string;
  keywords: string;
  published_at: string;
  region: string | null;
  url: string | null;
  relevance_score: number;
}

export type CategoryKey = "prices" | "employment" | "selfEmployed" | "finance" | "realEstate";
export type CategoryLabel = "물가" | "고용" | "자영업" | "금융" | "부동산";

export const CATEGORY_MAP: Record<CategoryKey, CategoryLabel> = {
  prices: "물가",
  employment: "고용",
  selfEmployed: "자영업",
  finance: "금융",
  realEstate: "부동산",
};

export const CATEGORY_KEYS: CategoryKey[] = ["prices", "employment", "selfEmployed", "finance", "realEstate"];
