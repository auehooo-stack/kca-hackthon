/**
 * 대한민국 공공서비스(혜택) 정보 API 테스트 스크립트
 *
 * 사용법: node scripts/test-gov24-api.mjs
 * 사전 준비: .env.local에 GOV24_API_KEY 설정
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// .env.local 파싱
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const API_KEY = env.GOV24_API_KEY;
if (!API_KEY || API_KEY === "여기에_공공데이터포털_인증키_입력") {
  console.error("❌ .env.local에 GOV24_API_KEY를 설정해주세요.");
  process.exit(1);
}

const BASE_URL = "https://api.odcloud.kr/api";

// ===== 유틸 =====

async function callApi(endpoint, params = {}) {
  // serviceKey는 이미 인코딩된 상태이므로 직접 붙이고, 나머지만 URLSearchParams 사용
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, String(v));
  }
  const paramStr = qs.toString();
  const url = new URL(`${BASE_URL}${endpoint}?serviceKey=${API_KEY}${paramStr ? "&" + paramStr : ""}`);


  console.log(`\n📡 GET ${url.pathname}${url.search.slice(0, 80)}...`);
  const start = Date.now();

  const res = await fetch(url.toString());
  const elapsed = Date.now() - start;

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ HTTP ${res.status} (${elapsed}ms)`);
    console.error(text.slice(0, 500));
    return null;
  }

  const data = await res.json();
  console.log(`✅ ${res.status} (${elapsed}ms)`);
  return data;
}

function printSummary(data) {
  if (!data) return;
  console.log(`   총 건수: ${data.totalCount}, 현재 페이지: ${data.page}, 반환: ${data.currentCount}건`);
}

function printRow(row, fields) {
  for (const f of fields) {
    const val = row[f];
    if (val !== undefined && val !== null && val !== "") {
      const display = String(val).length > 80 ? String(val).slice(0, 80) + "..." : val;
      console.log(`   ${f}: ${display}`);
    }
  }
}

// ===== 테스트 =====

async function testServiceList() {
  console.log("\n" + "=".repeat(60));
  console.log("📋 TEST 1: 공공서비스 목록 조회 (serviceList)");
  console.log("=".repeat(60));

  const data = await callApi("/gov24/v3/serviceList", {
    page: 1,
    perPage: 3,
  });
  if (!data) return null;

  printSummary(data);

  if (data.data && data.data.length > 0) {
    console.log("\n   --- 첫 번째 서비스 ---");
    printRow(data.data[0], ["서비스ID", "서비스명", "지원유형", "서비스목적요약", "소관기관명", "서비스분야", "사용자구분"]);

    if (data.data.length > 1) {
      console.log("\n   --- 두 번째 서비스 ---");
      printRow(data.data[1], ["서비스ID", "서비스명", "지원유형", "소관기관명"]);
    }
  }

  return data.data?.[0]?.["서비스ID"] || null;
}

async function testServiceListSearch() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 TEST 2: 공공서비스 검색 (서비스명 LIKE '출산')");
  console.log("=".repeat(60));

  const data = await callApi("/gov24/v3/serviceList", {
    page: 1,
    perPage: 5,
    "cond[서비스명::LIKE]": "출산",
  });
  if (!data) return;

  printSummary(data);
  if (data.data) {
    for (const row of data.data.slice(0, 3)) {
      console.log(`   • [${row["서비스ID"]}] ${row["서비스명"]} — ${row["소관기관명"] || ""}`);
    }
  }
}

async function testServiceDetail(serviceId) {
  console.log("\n" + "=".repeat(60));
  console.log(`📄 TEST 3: 공공서비스 상세 조회 (serviceDetail) — ID: ${serviceId}`);
  console.log("=".repeat(60));

  const data = await callApi("/gov24/v3/serviceDetail", {
    page: 1,
    perPage: 1,
    "cond[서비스ID::EQ]": serviceId,
  });
  if (!data) return;

  printSummary(data);
  if (data.data && data.data.length > 0) {
    printRow(data.data[0], [
      "서비스ID", "서비스명", "서비스목적", "지원대상",
      "선정기준", "지원내용", "신청방법", "신청기한",
      "구비서류", "접수기관명", "문의처", "온라인신청사이트URL",
    ]);
  }
}

async function testSupportConditions(serviceId) {
  console.log("\n" + "=".repeat(60));
  console.log(`📊 TEST 4: 지원조건 조회 (supportConditions) — ID: ${serviceId}`);
  console.log("=".repeat(60));

  const data = await callApi("/gov24/v3/supportConditions", {
    page: 1,
    perPage: 5,
    "cond[서비스ID::EQ]": serviceId,
  });
  if (!data) return;

  printSummary(data);
  if (data.data && data.data.length > 0) {
    const row = data.data[0];
    console.log("\n   --- 지원조건 ---");
    // 모든 필드 출력
    for (const [k, v] of Object.entries(row)) {
      if (v !== undefined && v !== null && v !== "") {
        const display = String(v).length > 80 ? String(v).slice(0, 80) + "..." : v;
        console.log(`   ${k}: ${display}`);
      }
    }
  }
}

async function testPagination() {
  console.log("\n" + "=".repeat(60));
  console.log("📑 TEST 5: 페이지네이션 테스트 (page 1 vs page 2)");
  console.log("=".repeat(60));

  const page1 = await callApi("/gov24/v3/serviceList", { page: 1, perPage: 2 });
  const page2 = await callApi("/gov24/v3/serviceList", { page: 2, perPage: 2 });

  if (page1 && page2) {
    const id1 = page1.data?.[0]?.["서비스ID"];
    const id2 = page2.data?.[0]?.["서비스ID"];
    const different = id1 !== id2;
    console.log(`   Page 1 첫번째: ${page1.data?.[0]?.["서비스명"]}`);
    console.log(`   Page 2 첫번째: ${page2.data?.[0]?.["서비스명"]}`);
    console.log(`   ${different ? "✅ 페이지네이션 정상 (서로 다른 데이터)" : "⚠️ 동일한 데이터 반환됨"}`);
  }
}

// ===== 실행 =====

async function main() {
  console.log("🚀 대한민국 공공서비스 API 테스트 시작");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   API Key: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-5)}`);

  // 1. 목록 조회
  const firstServiceId = await testServiceList();

  // 2. 검색 테스트
  await testServiceListSearch();

  // 3. 상세 조회 (1번에서 얻은 서비스ID 사용)
  if (firstServiceId) {
    await testServiceDetail(firstServiceId);
    await testSupportConditions(firstServiceId);
  } else {
    console.log("\n⚠️ 서비스ID를 얻지 못해 상세/지원조건 테스트를 건너뜁니다.");
  }

  // 4. 페이지네이션
  await testPagination();

  console.log("\n" + "=".repeat(60));
  console.log("🏁 테스트 완료!");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("❌ 테스트 실패:", err.message);
  process.exit(1);
});
