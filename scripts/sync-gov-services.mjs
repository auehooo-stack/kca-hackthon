/**
 * 공공서비스(혜택) 정보를 API에서 가져와 DB에 적재하는 스크립트
 *
 * 사용법: node scripts/sync-gov-services.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

// .env.local 파싱
const envContent = readFileSync(resolve(PROJECT_ROOT, ".env.local"), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const API_KEY = env.GOV24_API_KEY;
if (!API_KEY || API_KEY.startsWith("여기에")) {
  console.error("❌ .env.local에 GOV24_API_KEY를 설정해주세요.");
  process.exit(1);
}

const DB_PATH = resolve(PROJECT_ROOT, "../docs/db/irmi.db");
const BASE_URL = "https://api.odcloud.kr/api";
const PER_PAGE = 1000;

// ===== DB 설정 =====

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO gov_services (
    service_id, service_name, service_purpose, support_type,
    target_audience, selection_criteria, support_content,
    apply_method, apply_deadline, detail_url,
    org_name, dept_name, contact, service_field,
    org_type, reception_org, view_count,
    registered_at, modified_at, synced_at
  ) VALUES (
    @service_id, @service_name, @service_purpose, @support_type,
    @target_audience, @selection_criteria, @support_content,
    @apply_method, @apply_deadline, @detail_url,
    @org_name, @dept_name, @contact, @service_field,
    @org_type, @reception_org, @view_count,
    @registered_at, @modified_at, @synced_at
  )
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) insertStmt.run(row);
});

// ===== API 호출 =====

async function fetchPage(page) {
  const params = new URLSearchParams({ page: String(page), perPage: String(PER_PAGE) });
  const url = `${BASE_URL}/gov24/v3/serviceList?serviceKey=${API_KEY}&${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ===== 데이터 매핑 =====

function mapRow(item) {
  const now = new Date().toISOString();
  return {
    service_id: item["서비스ID"] || null,
    service_name: item["서비스명"] || "",
    service_purpose: item["서비스목적요약"] || null,
    support_type: item["지원유형"] || null,
    target_audience: item["지원대상"] || null,
    selection_criteria: item["선정기준"] || null,
    support_content: item["지원내용"] || null,
    apply_method: item["신청방법"] || null,
    apply_deadline: item["신청기한"] || null,
    detail_url: item["상세조회URL"] || null,
    org_name: item["소관기관명"] || null,
    dept_name: item["부서명"] || null,
    contact: item["전화문의"] || null,
    service_field: item["서비스분야"] || null,
    org_type: item["소관기관유형"] || null,
    reception_org: item["접수기관"] || null,
    view_count: item["조회수"] || 0,
    registered_at: item["등록일시"] || null,
    modified_at: item["수정일시"] || null,
    synced_at: now,
  };
}

// ===== 메인 =====

async function main() {
  console.log("🚀 공공서비스 데이터 적재 시작");
  console.log(`   DB: ${DB_PATH}`);

  // 첫 페이지로 총 건수 확인
  const firstPage = await fetchPage(1);
  const totalCount = firstPage.totalCount;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  console.log(`   총 ${totalCount}건, ${totalPages}페이지 (${PER_PAGE}건/페이지)`);

  let inserted = 0;

  // 첫 페이지 적재
  const rows1 = firstPage.data.map(mapRow);
  insertMany(rows1);
  inserted += rows1.length;
  console.log(`   ✅ 페이지 1/${totalPages} — ${inserted}건 적재`);

  // 나머지 페이지
  for (let page = 2; page <= totalPages; page++) {
    const data = await fetchPage(page);
    const rows = data.data.map(mapRow);
    insertMany(rows);
    inserted += rows.length;
    console.log(`   ✅ 페이지 ${page}/${totalPages} — ${inserted}건 적재`);
  }

  // 결과 확인
  const { count } = db.prepare("SELECT COUNT(*) as count FROM gov_services").get();
  console.log(`\n🏁 완료! DB에 총 ${count}건 저장됨`);

  db.close();
}

main().catch((err) => {
  console.error("❌ 실패:", err.message);
  db.close();
  process.exit(1);
});
