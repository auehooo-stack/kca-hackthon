// ===== 타입 정의 =====

export type Severity = "urgent" | "warning" | "watch";
export type UserType = "직장인" | "소상공인" | "자영업자" | "대학생" | "주부" | "은퇴자" | "프리랜서" | "취준생";
export type CategoryName = "물가" | "고용" | "자영업" | "금융" | "부동산";

export interface CategoryScore {
  name: CategoryName;
  score: number;
  trend: "up" | "down" | "stable";
  change: number;
  description: string;
}

export interface KeywordRank {
  rank: number;
  keyword: string;
  count: number;
  change: number;
  isNew: boolean;
}

export interface TimelineEvent {
  date: string;
  headline: string;
}

export interface CrisisSignal {
  id: number;
  title: string;
  description: string;
  severity: Severity;
  category: CategoryName;
  region: string;
  articleCount: number;
  date: string;
  timeline?: TimelineEvent[];
  pastCase?: string;
  actionGuide?: string[];
}

export interface NewsItem {
  id: number;
  title: string;
  source: string;
  category: CategoryName;
  keywords: string[];
  severity: Severity;
  date: string;
  summary: string;
}

export interface RegionData {
  name: string;
  score: number;
  trend: "up" | "down" | "stable";
  topIssue: string;
}

// ===== 목업 데이터 =====

export const riskScore = {
  total: 67,
  date: "2026년 3월 7일 금요일",
  dateShort: "3월 7일",
  prevTotal: 64,
  greeting: "오늘 민생 체감 온도는 67도예요",
  greetingSub: "어제보다 3도 올라갔어요. 자영업과 물가 쪽을 좀 더 신경 쓰면 좋겠어요.",
  comparisons: [
    { label: "어제", score: 64, period: "3월 6일" },
    { label: "1주 전", score: 62, period: "2월 28일" },
    { label: "1개월 전", score: 55, period: "2월 7일" },
    { label: "1년 전", score: 45, period: "2025년 3월" },
  ],
  categories: [
    { name: "물가" as CategoryName, score: 72, trend: "up" as const, change: 3, description: "장바구니 부담이 커지고 있어요" },
    { name: "고용" as CategoryName, score: 58, trend: "down" as const, change: -2, description: "취업 시장이 조금 나아지는 중이에요" },
    { name: "자영업" as CategoryName, score: 81, trend: "up" as const, change: 5, description: "소상공인 부담이 많이 늘고 있어요" },
    { name: "금융" as CategoryName, score: 54, trend: "stable" as const, change: 0, description: "대출·카드 연체에 주의가 필요해요" },
    { name: "부동산" as CategoryName, score: 63, trend: "up" as const, change: 2, description: "전세 가격이 다시 오르는 조짐이에요" },
  ] as CategoryScore[],
  history: [
    { date: "3/1", score: 63 },
    { date: "3/2", score: 65 },
    { date: "3/3", score: 68 },
    { date: "3/4", score: 64 },
    { date: "3/5", score: 67 },
    { date: "3/6", score: 64 },
    { date: "3/7", score: 67 },
  ],
  yearHistory: (() => {
    // 2025년 1월~12월 (CNN 스타일 angular 데이터)
    const anchors = [
      { month: 1, avg: 38 }, { month: 2, avg: 40 }, { month: 3, avg: 45 },
      { month: 4, avg: 43 }, { month: 5, avg: 42 }, { month: 6, avg: 46 },
      { month: 7, avg: 51 }, { month: 8, avg: 56 }, { month: 9, avg: 54 },
      { month: 10, avg: 52 }, { month: 11, avg: 57 }, { month: 12, avg: 63 },
    ];
    // 각 월의 일수
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const result: { date: string; score: number; fullDate: string }[] = [];
    let seed = 42;
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };
    let prev = 38;
    let momentum = 0;
    for (let s = 0; s < anchors.length - 1; s++) {
      const from = anchors[s].avg;
      const to = anchors[s + 1].avg;
      const days = daysInMonth[s];
      for (let d = 0; d < days; d++) {
        const t = d / days;
        const trend = from + (to - from) * t;
        const drift = (trend - prev) * 0.1;
        const impulse = (rand() - 0.5) * 5;
        momentum = momentum * 0.6 + impulse * 0.4;
        prev = prev + drift + momentum;
        const score = Math.round(Math.max(0, Math.min(100, prev)));
        prev = score;
        const m = anchors[s].month;
        const day = d + 1;
        result.push({ date: `${m}/${day}`, score, fullDate: `2025년 ${m}월 ${day}일` });
      }
    }
    // 12월 데이터
    for (let d = 0; d < daysInMonth[11]; d++) {
      const trend = 63;
      const drift = (trend - prev) * 0.1;
      const impulse = (rand() - 0.5) * 5;
      momentum = momentum * 0.6 + impulse * 0.4;
      prev = prev + drift + momentum;
      const score = Math.round(Math.max(0, Math.min(100, prev)));
      prev = score;
      result.push({ date: `12/${d + 1}`, score, fullDate: `2025년 12월 ${d + 1}일` });
    }
    return result;
  })(),
};

export const keywordRanks: KeywordRank[] = [
  { rank: 1, keyword: "배달앱 수수료", count: 47, change: 3, isNew: false },
  { rank: 2, keyword: "농축산물 가격", count: 35, change: 1, isNew: false },
  { rank: 3, keyword: "신용카드 연체율", count: 28, change: 0, isNew: false },
  { rank: 4, keyword: "전세가격", count: 22, change: -1, isNew: false },
  { rank: 5, keyword: "소상공인 폐업", count: 19, change: 2, isNew: false },
  { rank: 6, keyword: "재료비 인상", count: 17, change: 0, isNew: true },
  { rank: 7, keyword: "청년 실업", count: 15, change: -2, isNew: false },
  { rank: 8, keyword: "가계부채", count: 14, change: 1, isNew: false },
  { rank: 9, keyword: "최저임금", count: 12, change: 0, isNew: true },
  { rank: 10, keyword: "전통시장", count: 10, change: -1, isNew: false },
];

export const briefing = {
  summary:
    "이번 주는 자영업 하시는 분들이 특히 힘든 한 주예요. 배달앱 수수료가 오르고, 재료비도 같이 뛰면서 이중고를 겪고 계세요. 장보실 때도 채소·고기 값이 눈에 띄게 올랐을 거예요. 카드 연체율도 계속 오르고 있어서, 이번 달 카드값 한번 확인해보시는 게 좋겠어요.",
  byUserType: {
    직장인:
      "카드 연체율이 5개월째 오르고 있어요. 리볼빙 쓰고 계시면 이번 달 안에 정리하시는 게 좋아요. 전세 만기 다가오시는 분은 갱신 조건 미리 확인해두세요.",
    소상공인:
      "배달앱 수수료 인상이 4월부터 적용될 수 있어요. 네이버 스마트스토어 같은 자체 주문 채널을 지금부터 준비해보세요. 소상공인진흥공단(1357)에서 긴급경영자금도 확인해보세요.",
    자영업자:
      "이번 달 폐업률이 작년보다 12% 늘었어요. 매출이 줄고 있다면, 소상공인진흥공단 무료 업종전환 컨설팅을 먼저 받아보세요. 혼자 고민하지 마세요.",
    대학생:
      "청년 실업률은 조금 나아지고 있지만 아직 불안정해요. 청년내일채움공제 같은 정부 프로그램이 확대되고 있으니, 자격 요건 한번 확인해보세요.",
  } as Record<UserType, string>,
};

export const crisisSignals: CrisisSignal[] = [
  {
    id: 1,
    title: "배달앱 수수료 인상으로 소상공인 부담 급증",
    description:
      "배달앱 수수료가 또 오른다는 소식에, 자영업자분들의 걱정이 커지고 있어요. 소상공인협회에서도 공동 대응에 나섰어요.",
    severity: "urgent",
    category: "자영업",
    region: "전국",
    articleCount: 47,
    date: "3월 7일",
    timeline: [
      { date: "2/20", headline: "배달앱 B사, 4월부터 중개수수료 2%p 인상 검토" },
      { date: "2/25", headline: "자영업자 커뮤니티에서 수수료 인상 반발 확산" },
      { date: "2/28", headline: "소상공인협회 '수수료 인상 철회' 공동 성명" },
      { date: "3/3", headline: "매경 사설: 배달앱 수수료, 자영업 생존 위협하나" },
      { date: "3/5", headline: "국회 산자위 긴급 현안 질의 예정" },
    ],
    pastCase:
      "작년 8월에도 비슷한 일이 있었어요. 그때는 공정거래위원회가 중재해서 2주 만에 인상폭이 절반으로 줄었어요.",
    actionGuide: [
      "소상공인진흥공단 긴급경영안정자금 신청 가능 여부 확인 (전화 1357)",
      "배달앱 외에 네이버 스마트스토어 등 자체 주문 채널 만들어보기",
      "소상공인협회 공동 대응에 참여할 수 있는지 알아보기",
    ],
  },
  {
    id: 2,
    title: "채소·고기 값이 한 달 새 20% 올랐어요",
    description:
      "한파 영향으로 채소 출하량이 크게 줄었고, 사료비까지 올라 고기 값도 같이 뛰고 있어요.",
    severity: "urgent",
    category: "물가",
    region: "전국",
    articleCount: 35,
    date: "3월 6일",
    timeline: [
      { date: "2/15", headline: "한파 영향으로 겨울 채소 출하량 30% 감소" },
      { date: "2/22", headline: "배추·무 도매가격 2주 연속 상승" },
      { date: "2/28", headline: "사료비 인상으로 육류 가격도 동반 상승" },
      { date: "3/4", headline: "농축산물 종합 도매가격 전월비 20% 급등" },
    ],
    pastCase:
      "작년 여름 폭우 때도 채소값이 급등했었는데, 그때는 정부 비축물량을 풀어서 3주 만에 안정됐어요.",
    actionGuide: [
      "농산물 직거래 장터나 꾸러미 서비스로 중간 유통비 줄이기",
      "한국농수산식품유통공사 앱에서 오늘 저렴한 품목 확인하기",
      "배추 대신 양배추처럼, 가격 낮은 대체 식재료 활용해보기",
    ],
  },
  {
    id: 3,
    title: "카드 연체율이 5개월째 오르고 있어요",
    description:
      "신용카드 연체율이 계속 오르면서, 가계부채 걱정이 커지고 있어요. 금융당국도 주시하고 있어요.",
    severity: "warning",
    category: "금융",
    region: "전국",
    articleCount: 28,
    date: "3월 6일",
    timeline: [
      { date: "1/10", headline: "신용카드 연체율 전월비 0.2%p 상승" },
      { date: "2/5", headline: "2금융권 대출 연체율도 같이 오르는 중" },
      { date: "2/20", headline: "금감원, 카드사에 리스크 관리 강화 권고" },
      { date: "3/4", headline: "5개월 연속 상승... 가계부채 경고등" },
    ],
    pastCase:
      "2024년 하반기에도 4개월 연속 올랐었는데, 그때 금융당국이 카드론 한도를 줄이는 조치를 했어요.",
    actionGuide: [
      "카드 리볼빙 쓰고 계시면 이번 달 안에 갚는 걸 검토해보세요",
      "서민금융진흥원 채무조정 상담 받아보기 (전화 1397)",
      "연체 나기 전에 이번 달 최소 결제금액부터 확인해두세요",
    ],
  },
  {
    id: 4,
    title: "서울·경기 전세가격 3주 연속 상승",
    description:
      "봄 이사철을 앞두고 서울과 경기 지역 전세가격이 다시 오르기 시작했어요.",
    severity: "warning",
    category: "부동산",
    region: "서울·경기",
    articleCount: 18,
    date: "3월 5일",
    timeline: [
      { date: "2/14", headline: "서울 아파트 전세가격 소폭 반등 시작" },
      { date: "2/21", headline: "강남·송파 전세 매물 감소세 뚜렷" },
      { date: "2/28", headline: "경기도 주요 신도시도 전세가 상승 전환" },
      { date: "3/5", headline: "수도권 전세가격 3주 연속 상승 확인" },
    ],
    pastCase:
      "작년 같은 시기에도 봄 이사철 전세가가 올랐고, 4월 중순부터 안정세로 돌아왔어요.",
    actionGuide: [
      "전세 만기가 다가오면 2개월 전에 갱신 의사를 집주인에게 알리세요",
      "전세보증보험(HUG) 가입 여부 꼭 확인해두세요",
      "국토부 실거래가 공개시스템에서 주변 시세 미리 확인하기",
    ],
  },
  {
    id: 5,
    title: "대기업 채용 축소, 중소기업은 구인난",
    description:
      "대기업은 채용을 줄이고 있지만, 중소기업은 오히려 사람을 구하지 못하는 미스매치가 심해지고 있어요.",
    severity: "watch",
    category: "고용",
    region: "전국",
    articleCount: 12,
    date: "3월 4일",
    timeline: [
      { date: "2/10", headline: "주요 대기업 상반기 채용 규모 15% 축소 발표" },
      { date: "2/20", headline: "중소기업 10곳 중 6곳 '인력 부족' 호소" },
      { date: "3/1", headline: "고용부, 채용 미스매치 해소 대책 발표" },
    ],
    pastCase:
      "2024년에도 비슷한 미스매치가 있었고, 정부 매칭 프로그램으로 일부 개선된 사례가 있어요.",
    actionGuide: [
      "고용부 '일자리매칭' 플랫폼에서 중소기업 우수 일자리 확인하기",
      "내일배움카드로 직무 역량 강화 교육 받아보기",
      "고용센터 취업상담 무료 이용하기 (전화 1350)",
    ],
  },
];

export const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "배달앱 수수료 인상안 확정...자영업자 반발 거세",
    source: "매일경제",
    category: "자영업",
    keywords: ["배달앱 수수료", "소상공인", "자영업자"],
    severity: "urgent",
    date: "2026-03-07",
    summary: "주요 배달앱이 4월부터 중개수수료를 2%p 올리기로 확정하면서 자영업자들의 반발이 거세지고 있다.",
  },
  {
    id: 2,
    title: "배추값 한 달 새 40% 급등...밥상 물가 비상",
    source: "매일경제",
    category: "물가",
    keywords: ["농축산물 가격", "배추", "물가"],
    severity: "urgent",
    date: "2026-03-07",
    summary: "한파 여파로 배추 출하량이 급감하면서 배추값이 한 달 새 40% 넘게 올랐다.",
  },
  {
    id: 3,
    title: "신용카드 연체율 또 올라...5개월 연속 상승",
    source: "매일경제",
    category: "금융",
    keywords: ["신용카드 연체율", "가계부채", "금융"],
    severity: "warning",
    date: "2026-03-06",
    summary: "신용카드 연체율이 5개월 연속 상승하며 가계부채 리스크가 커지고 있다.",
  },
  {
    id: 4,
    title: "서울 전세가 3주 연속 상승...봄 이사철 불안",
    source: "매일경제",
    category: "부동산",
    keywords: ["전세가격", "서울", "부동산"],
    severity: "warning",
    date: "2026-03-05",
    summary: "봄 이사철을 앞두고 서울 아파트 전세가격이 3주 연속 상승세를 이어가고 있다.",
  },
  {
    id: 5,
    title: "소상공인 폐업률 전년비 12% 증가",
    source: "매일경제",
    category: "자영업",
    keywords: ["소상공인 폐업", "자영업자", "폐업"],
    severity: "warning",
    date: "2026-03-05",
    summary: "올해 들어 소상공인 폐업률이 전년 동기 대비 12% 증가하며 자영업 위기가 심화되고 있다.",
  },
  {
    id: 6,
    title: "청년 취업자 수 소폭 증가...고용 회복 신호?",
    source: "매일경제",
    category: "고용",
    keywords: ["청년 실업", "고용", "취업"],
    severity: "watch",
    date: "2026-03-04",
    summary: "2월 청년 취업자 수가 전월 대비 소폭 증가하며 고용 시장에 회복 신호가 감지되고 있다.",
  },
  {
    id: 7,
    title: "최저임금 인상 논의 본격화...노사 입장차 팽팽",
    source: "매일경제",
    category: "고용",
    keywords: ["최저임금", "노사", "임금"],
    severity: "watch",
    date: "2026-03-04",
    summary: "내년도 최저임금 인상을 둘러싼 노사 간 논의가 본격화되면서 입장 차이가 뚜렷하게 드러나고 있다.",
  },
  {
    id: 8,
    title: "전통시장 매출 회복세...정부 지원 효과",
    source: "매일경제",
    category: "자영업",
    keywords: ["전통시장", "소상공인", "매출"],
    severity: "watch",
    date: "2026-03-03",
    summary: "정부의 전통시장 활성화 지원사업 효과로 주요 전통시장의 매출이 전년 대비 회복세를 보이고 있다.",
  },
];

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

export const userTypes: UserType[] = ["직장인", "소상공인", "자영업자", "대학생", "주부", "은퇴자", "프리랜서", "취준생"];

/** 유형별 관심 카테고리 프리셋 */
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

/** 유형별 맞춤 브리핑 */
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

// ===== 분야별 상세 데이터 =====

export interface CategoryDetail {
  name: CategoryName;
  dailyTrend: { date: string; score: number }[];
  keywords: { word: string; count: number }[];
  newsFlow: { date: string; headline: string; impact: "up" | "down" | "neutral" }[];
  pastCase: { period: string; summary: string; result: string };
}

/** 3개월 일별 데이터 생성 (10월~12월) */
function generateDailyTrend(startScore: number, endScore: number, seed: number) {
  const days = [31, 30, 31]; // 10월, 11월, 12월
  const months = [10, 11, 12];
  const result: { date: string; score: number }[] = [];
  let s = seed;
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  let prev = startScore;
  let momentum = 0;
  const totalDays = days.reduce((a, b) => a + b, 0);
  let dayIdx = 0;
  for (let m = 0; m < 3; m++) {
    for (let d = 1; d <= days[m]; d++) {
      const t = dayIdx / totalDays;
      const trend = startScore + (endScore - startScore) * t;
      const drift = (trend - prev) * 0.15;
      const impulse = (rand() - 0.5) * 4;
      momentum = momentum * 0.5 + impulse * 0.5;
      prev = prev + drift + momentum;
      prev = Math.max(0, Math.min(100, prev));
      result.push({ date: `${months[m]}/${d}`, score: Math.round(prev) });
      dayIdx++;
    }
  }
  return result;
}

export const categoryDetails: Record<CategoryName, CategoryDetail> = {
  물가: {
    name: "물가",
    dailyTrend: generateDailyTrend(60, 72, 101),
    keywords: [
      { word: "농축산물 가격", count: 35 },
      { word: "배추", count: 28 },
      { word: "한파", count: 22 },
      { word: "사료비", count: 18 },
      { word: "도매가격", count: 15 },
      { word: "비축물량", count: 12 },
      { word: "수입 확대", count: 9 },
      { word: "장바구니 물가", count: 8 },
    ],
    newsFlow: [
      { date: "2/15", headline: "한파 영향으로 겨울 채소 출하량 30% 감소", impact: "up" },
      { date: "2/22", headline: "배추·무 도매가격 2주 연속 상승", impact: "up" },
      { date: "2/28", headline: "사료비 인상으로 육류 가격 동반 상승", impact: "up" },
      { date: "3/4", headline: "농축산물 종합 도매가격 전월비 20% 급등", impact: "up" },
      { date: "3/7", headline: "정부, 농산물 비축물량 방출 검토", impact: "down" },
    ],
    pastCase: {
      period: "2024년 여름 폭우",
      summary: "폭우로 채소값이 급등했지만, 정부가 비축물량을 풀어 3주 만에 안정됐어요.",
      result: "비축물량 방출 + 수입 확대로 3주 내 가격 안정",
    },
  },
  고용: {
    name: "고용",
    dailyTrend: generateDailyTrend(59, 58, 202),
    keywords: [
      { word: "채용 축소", count: 24 },
      { word: "인력 부족", count: 20 },
      { word: "청년 취업", count: 18 },
      { word: "미스매치", count: 15 },
      { word: "중소기업", count: 13 },
      { word: "고용부 대책", count: 10 },
    ],
    newsFlow: [
      { date: "2/10", headline: "주요 대기업 상반기 채용 규모 15% 축소 발표", impact: "up" },
      { date: "2/20", headline: "중소기업 10곳 중 6곳 '인력 부족' 호소", impact: "neutral" },
      { date: "3/1", headline: "고용부, 채용 미스매치 해소 대책 발표", impact: "down" },
      { date: "3/4", headline: "2월 청년 취업자 수 소폭 증가", impact: "down" },
    ],
    pastCase: {
      period: "2024년 하반기 채용 한파",
      summary: "대기업 채용 축소가 이어졌지만, 정부 매칭 프로그램으로 중소기업 취업이 증가했어요.",
      result: "일자리 매칭 플랫폼 활용률 40% 증가, 미스매치 일부 해소",
    },
  },
  자영업: {
    name: "자영업",
    dailyTrend: generateDailyTrend(69, 81, 303),
    keywords: [
      { word: "배달앱 수수료", count: 47 },
      { word: "소상공인 폐업", count: 19 },
      { word: "재료비 인상", count: 17 },
      { word: "중개수수료", count: 14 },
      { word: "공정위", count: 11 },
      { word: "자영업 생존", count: 10 },
      { word: "소상공인협회", count: 9 },
      { word: "긴급경영자금", count: 7 },
    ],
    newsFlow: [
      { date: "2/20", headline: "배달앱 B사, 4월부터 중개수수료 2%p 인상 검토", impact: "up" },
      { date: "2/25", headline: "자영업자 커뮤니티에서 수수료 인상 반발 확산", impact: "up" },
      { date: "2/28", headline: "소상공인협회 '수수료 인상 철회' 공동 성명", impact: "neutral" },
      { date: "3/3", headline: "매경 사설: 배달앱 수수료, 자영업 생존 위협하나", impact: "up" },
      { date: "3/5", headline: "소상공인 폐업률 전년비 12% 증가", impact: "up" },
      { date: "3/7", headline: "국회 산자위 긴급 현안 질의 예정", impact: "down" },
    ],
    pastCase: {
      period: "2025년 8월 수수료 인상",
      summary: "작년에도 비슷한 일이 있었어요. 공정거래위원회가 중재해서 2주 만에 인상폭이 절반으로 줄었어요.",
      result: "공정위 중재로 수수료 인상폭 50% 축소",
    },
  },
  금융: {
    name: "금융",
    dailyTrend: generateDailyTrend(50, 54, 404),
    keywords: [
      { word: "신용카드 연체율", count: 28 },
      { word: "가계부채", count: 22 },
      { word: "카드론", count: 16 },
      { word: "금감원", count: 14 },
      { word: "2금융권", count: 11 },
      { word: "리스크 관리", count: 9 },
    ],
    newsFlow: [
      { date: "1/10", headline: "신용카드 연체율 전월비 0.2%p 상승", impact: "up" },
      { date: "2/5", headline: "2금융권 대출 연체율도 같이 오르는 중", impact: "up" },
      { date: "2/20", headline: "금감원, 카드사에 리스크 관리 강화 권고", impact: "down" },
      { date: "3/4", headline: "5개월 연속 상승... 가계부채 경고등", impact: "up" },
    ],
    pastCase: {
      period: "2024년 하반기 연체율 상승",
      summary: "4개월 연속 올랐을 때 금융당국이 카드론 한도를 줄이는 조치를 했어요.",
      result: "카드론 한도 축소 후 2개월 내 연체율 안정화",
    },
  },
  부동산: {
    name: "부동산",
    dailyTrend: generateDailyTrend(57, 63, 505),
    keywords: [
      { word: "전세가격", count: 22 },
      { word: "봄 이사철", count: 16 },
      { word: "매물 감소", count: 14 },
      { word: "서울 아파트", count: 12 },
      { word: "신도시", count: 10 },
      { word: "전세보증보험", count: 8 },
    ],
    newsFlow: [
      { date: "2/14", headline: "서울 아파트 전세가격 소폭 반등 시작", impact: "up" },
      { date: "2/21", headline: "강남·송파 전세 매물 감소세 뚜렷", impact: "up" },
      { date: "2/28", headline: "경기도 주요 신도시도 전세가 상승 전환", impact: "up" },
      { date: "3/5", headline: "수도권 전세가격 3주 연속 상승 확인", impact: "up" },
    ],
    pastCase: {
      period: "2025년 봄 이사철",
      summary: "작년 같은 시기에도 전세가가 올랐고, 4월 중순부터 안정세로 돌아왔어요.",
      result: "이사철 종료 후 자연 안정 + HUG 보증보험 가입 확대",
    },
  },
};
