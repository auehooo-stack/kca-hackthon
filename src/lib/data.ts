// ===== 타입 정의 =====

export type Severity = "urgent" | "warning" | "watch";
export type UserType = "직장인" | "소상공인" | "자영업자" | "대학생" | "주부" | "은퇴자" | "프리랜서" | "취준생";
export type CategoryName = "물가" | "고용" | "자영업" | "금융" | "부동산";

export interface CategoryScore {
  name: CategoryName;
  score: number;
  trend: "up" | "down" | "stable";
  articleCount: number;
}

export interface SignalItem {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: CategoryName;
  score: number;
  date: string;
  url: string | null;
}

export interface ArticleItem {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  category_label: string;
  keywords: string[];
  published_at: string;
  relevance_score: number;
  severity: Severity;
  url: string | null;
}

// ===== 유형별 설정 (클라이언트에서 사용) =====

export const userTypes: UserType[] = ["직장인", "소상공인", "자영업자", "대학생", "주부", "은퇴자", "프리랜서", "취준생"];

export const userTypePresets: Record<UserType, CategoryName[]> = {
  직장인: ["금융", "고용", "부동산"],
  소상공인: ["자영업", "물가", "금융"],
  자영업자: ["자영업", "물가"],
  대학생: ["고용", "부동산"],
  주부: ["물가", "부동산"],
  은퇴자: ["금융", "물가", "부동산"],
  프리랜서: ["자영업", "금융", "고용"],
  취준생: ["고용"],
};

export const userTypeBriefings: Record<UserType, string> = {
  직장인: "카드 연체율이 5개월째 오르고 있어요. 리볼빙 쓰고 계시면 이번 달 안에 정리하시는 게 좋아요. 전세 만기 다가오시는 분은 갱신 조건 미리 확인해두세요.",
  소상공인: "배달앱 수수료 인상이 4월부터 적용될 수 있어요. 네이버 스마트스토어 같은 자체 주문 채널을 지금부터 준비해보세요. 소상공인진흥공단(1357)에서 긴급경영자금도 확인해보세요.",
  자영업자: "이번 달 폐업률이 작년보다 12% 늘었어요. 매출이 줄고 있다면, 소상공인진흥공단 무료 업종전환 컨설팅을 먼저 받아보세요. 혼자 고민하지 마세요.",
  대학생: "청년 실업률은 조금 나아지고 있지만 아직 불안정해요. 청년내일채움공제 같은 정부 프로그램이 확대되고 있으니, 자격 요건 한번 확인해보세요.",
  주부: "장보실 때 채소·고기 값이 눈에 띄게 올랐을 거예요. 농산물 직거래 장터나 꾸러미 서비스로 중간 유통비를 줄여보세요. 전세 만기 앞두고 계시면 시세 확인도 미리 해두세요.",
  은퇴자: "카드 연체율이 계속 오르고 있어요. 고정 지출 점검해보시고, 물가 상승분만큼 생활비 계획도 조정해보세요. 전세 재계약 시 보증보험 가입 여부도 꼭 확인하세요.",
  프리랜서: "자영업 쪽 리스크가 높아지고 있어요. 수입이 불규칙하신 만큼, 카드 사용 관리에 신경 쓰시고 긴급경영자금 지원 대상인지 확인해보세요.",
  취준생: "대기업 채용은 줄고 있지만 중소기업은 오히려 사람을 못 구하고 있어요. 고용부 일자리매칭 플랫폼에서 우수 중소기업 일자리를 확인해보세요.",
};

// ===== 카테고리 매핑 =====

export const CATEGORY_LABEL_TO_KEY: Record<CategoryName, string> = {
  물가: "prices",
  고용: "employment",
  자영업: "selfEmployed",
  금융: "finance",
  부동산: "realEstate",
};

// ===== 지역 데이터 (DB에 region 미구현 — 추후 교체) =====

export interface RegionData {
  name: string;
  score: number;
  trend: "up" | "down" | "stable";
  topIssue: string;
}

export const regionData: RegionData[] = [
  { name: "서울", score: 71, trend: "up", topIssue: "전세가격 상승" },
  { name: "경기", score: 68, trend: "up", topIssue: "전세가격 상승" },
  { name: "인천", score: 62, trend: "stable", topIssue: "소상공인 폐업 증가" },
  { name: "부산", score: 65, trend: "up", topIssue: "청년 고용 불안" },
  { name: "대구", score: 59, trend: "down", topIssue: "자영업 매출 감소" },
  { name: "광주", score: 55, trend: "stable", topIssue: "물가 상승" },
  { name: "대전", score: 53, trend: "down", topIssue: "소상공인 부담" },
  { name: "울산", score: 57, trend: "up", topIssue: "제조업 고용 감소" },
  { name: "세종", score: 48, trend: "stable", topIssue: "부동산 안정" },
  { name: "강원", score: 56, trend: "up", topIssue: "관광업 부진" },
  { name: "충북", score: 52, trend: "stable", topIssue: "농산물 가격" },
  { name: "충남", score: 54, trend: "down", topIssue: "제조업 고용" },
  { name: "전북", score: 60, trend: "up", topIssue: "농업 피해" },
  { name: "전남", score: 58, trend: "stable", topIssue: "어업 부진" },
  { name: "경북", score: 56, trend: "down", topIssue: "지역경제 침체" },
  { name: "경남", score: 61, trend: "up", topIssue: "조선업 구조조정" },
  { name: "제주", score: 64, trend: "up", topIssue: "관광객 감소" },
  { name: "전국 평균", score: 67, trend: "up", topIssue: "자영업·물가 복합 위기" },
];
