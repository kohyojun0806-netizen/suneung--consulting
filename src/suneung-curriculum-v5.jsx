import { useState } from "react";

// ══════════════════════════════════════════════════
// 강사·교재 카탈로그 (recommendation_catalog.json 정제)
// ══════════════════════════════════════════════════
const INSTRUCTOR_CATALOG = [
  { name: "현우진", platform: "메가스터디", fitKeys: ["5-3", "3-1"], subjectTags: ["공통", "미적분"], bestFor: "3~5등급 → 1~2등급", strengths: ["수능 필요 도구 전체 커버", "최고 퀄리티 기출 분석"], usage: "뉴런→수분감→드릴→킬링캠프 순서로 수강" },
  { name: "정승제", platform: "메가스터디", fitKeys: ["9-7", "7-5"], subjectTags: ["공통"], bestFor: "노베이스~7등급", strengths: ["강의력 최상", "기초부터 수능까지 탄탄한 커리"], usage: "개대잡→노비스 순서로 수강" },
  { name: "이미지", platform: "대성마이맥", fitKeys: ["9-7", "7-5", "5-3"], subjectTags: ["공통"], bestFor: "노베이스~5등급", strengths: ["초보자 이해 최적화", "N제·실모 커리 완비"], usage: "미친개념→기출→N제 일관 커리 추천" },
  { name: "김범준", platform: "대성마이맥", fitKeys: ["3-1"], subjectTags: ["공통", "미적분"], bestFor: "1~2등급 목표", strengths: ["킬러 사고 프레임", "고난도 일관 스킬"], usage: "스타팅블록→페이스메이커/고난도 실모 수강" },
  { name: "김기헌", platform: "메가스터디", fitKeys: ["5-3", "3-1"], subjectTags: ["공통"], bestFor: "3~4등급", strengths: ["개념~실전 균형잡힌 육각형 강사"], usage: "아이디어 강의 수강. 현우진보다 부담 덜함" },
  { name: "EBSi 수학 강사진", platform: "EBSi", fitKeys: ["9-7", "7-5", "5-3", "3-1"], subjectTags: ["공통", "확률과통계", "미적분", "기하"], bestFor: "전 등급 EBS 연계 대비", strengths: ["연계율 70% 직접 대비", "무료"], usage: "수능특강→수능완성 순서로 수강" },
];

const BOOK_CATALOG = [
  { title: "개념원리 수학I·수학II", type: "개념서", fitKeys: ["9-7", "7-5"], difficulty: "하~중", purpose: "개념 기초 완성", when: "개념 학습 초반" },
  { title: "RPM 수학I·수학II", type: "유형서", fitKeys: ["9-7", "7-5"], difficulty: "하~중", purpose: "유형 반복 훈련", when: "개념 이후 유형 연습" },
  { title: "쎈 수학I·수학II", type: "유형서", fitKeys: ["9-7", "7-5", "5-3"], difficulty: "중", purpose: "중난도 유형 완성", when: "기출 전 유형 정리" },
  { title: "자이스토리 수학I·수학II", type: "기출서", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중", purpose: "기출 유형 분석", when: "기출 학습 단계" },
  { title: "마더텅 수능기출문제집", type: "기출서", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중", purpose: "연도별 기출 풀이", when: "기출 학습 단계" },
  { title: "EBS 수능특강 수학영역", type: "연계교재", fitKeys: ["9-7", "7-5", "5-3", "3-1"], difficulty: "중", purpose: "연계율 70% 직접 대비", when: "3월 이후 연간 병행" },
  { title: "EBS 수능완성 수학영역", type: "연계교재", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중상", purpose: "실전 연계 완성", when: "6월 이후" },
  { title: "뉴런 수학I·수학II", type: "심화 개념", fitKeys: ["5-3", "3-1"], difficulty: "중상", purpose: "개념 심화 완성", when: "개념 완성 후 심화" },
  { title: "드릴 수학", type: "심화 N제", fitKeys: ["3-1"], difficulty: "상", purpose: "킬러 수준 반복 훈련", when: "고난도 양치기 단계" },
  { title: "시대인재 서바이벌 모의고사", type: "실전 모의", fitKeys: ["5-3", "3-1"], difficulty: "중상", purpose: "실전 안정화", when: "8월 이후" },
  { title: "히든카이스 모의고사", type: "실전 모의", fitKeys: ["5-3", "3-1"], difficulty: "중상", purpose: "실전 감각 유지", when: "8월 이후" },
  { title: "확률과통계 기출 문제집", type: "선택과목 기출", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중", purpose: "확통 기출 완성", when: "선택과목 학습 단계", subjectTags: ["확률과통계"] },
  { title: "미적분 기출/N제 세트", type: "선택과목 심화", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중상", purpose: "미적분 심화 완성", when: "선택과목 학습 단계", subjectTags: ["미적분"] },
  { title: "기하 기출/N제 세트", type: "선택과목 심화", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중상", purpose: "기하 심화 완성", when: "선택과목 학습 단계", subjectTags: ["기하"] },
];

// ══════════════════════════════════════════════════
// 검증된 커리큘럼 데이터
// ══════════════════════════════════════════════════
const CURRICULUM = {
  "9-7": {
    duration: "8주", nje_level: "입문",
    summary: "수학 기초가 흔들리는 상태예요. 정승제·이미지 선생님 커리큘럼을 처음부터 따라가는 게 가장 효율적이에요. 개념을 안다는 건 스스로 설명할 수 있는 것—백지에 써보는 연습부터 시작하세요.",
    current_focus: { headline: "지금 시기: 개념 공백 메우기 + 쉬운 기출 연결", why_now: "중위권으로 올라가려면 개념을 아는 상태가 아니라, 문제에서 꺼내 쓸 수 있는 상태로 바꿔야 해요.", daily_plan: "하루 1.5시간: 개념 40% + 문제 40% + 오답 복기 20%", caution: "공식만 암기하면 기출 단계에서 무너져요. 이해 위주로 하세요." },
    period_plan: [
      { period: "3~6모 전", goal: "개념 출력 루틴 정착", actions: ["단원별 핵심 공식 백지에 직접 쓰기", "개념 직후 쉬운 기출 10문항으로 즉시 적용", "오답을 개념/계산으로 분류해 당일 재풀이"], checkpoints: ["개념 노트 없이 설명 가능", "기초 기출 정답률 60%+"], caution: "강의만 듣고 넘어가지 말고 반드시 백지 복습하세요." },
      { period: "6~9모", goal: "수I 전범위 완성", actions: ["지수·로그·삼각함수·수열 핵심 개념 완성", "EBS 수능특강 병행 시작", "기본 유형 문제 정답률 70%+ 목표"], checkpoints: ["수I 기본 문제 자력 풀이", "EBS 수능특강 1회독"], caution: "한 번에 너무 많은 단원을 잡으려 하지 마세요." },
      { period: "9모~수능 전", goal: "수II 입문 + 실전 적응", actions: ["수II 극한·미분 기초 완성", "실전 시간 배분 훈련 시작", "취약 단원 압축 복습"], checkpoints: ["수II 기본 문제 풀이 가능", "80분 시간 관리 시작"], caution: "새 내용보다 아는 것을 완벽히 하는 게 더 중요해요." },
    ],
    phases: [
      { phase: 1, title: "수학 기초 회복", duration: "4주", goal: "연산·방정식·함수 기초 완성", topics: ["자연수/정수/유리수 연산", "방정식·부등식 기초", "함수 개념 입문", "좌표평면 이해"], lectures: ["정승제 - 개대잡 / 노비스", "이미지 - 미친개념 (기초편)"], daily_plan: "하루 1.5시간 — 개념 강의 40분 + 백지복습 30분 + 문제 20분", checkpoints: ["기초 문제집 1회독 완료", "백지 재연 가능"], caution: "공식만 암기하면 기출 단계에서 무너져요. 이해 위주로 하세요." },
      { phase: 2, title: "수I 개념 입문", duration: "4주", goal: "지수·로그·수열 기초 완성", topics: ["지수법칙과 지수함수", "로그 정의와 성질", "등차·등비수열 기초"], lectures: ["정승제 - 개대잡 수I", "이미지 - 미친개념 (수I)"], daily_plan: "하루 1.5시간 — 개념 50분 + 백지복습 30분 + 문제 30분", checkpoints: ["수I 기본 문제 풀이 가능", "개념 백지복습 완성"], caution: "로그 밑 조건을 자주 빠뜨려요. 체크 습관을 만드세요." },
    ],
    books: ["개념원리 수학(상)(하)", "RPM 수학I", "EBS 수능특강 수학영역"],
    final_tip: "기초가 탄탄해야 나중에 빠르게 올라갈 수 있어요.",
  },

  "7-5": {
    duration: "10주", nje_level: "입문",
    summary: "개념→기출→N제 순서가 핵심이에요. '시나리오 매핑'—조건 해석 후 흐름을 머릿속에서 먼저 설계한 뒤 샤프를 잡는 습관을 이 단계에서 만드세요.",
    current_focus: { headline: "지금 시기: 개념 완성 + 기출 사고 흐름 훈련", why_now: "기출을 풀이 암기로 보면 응용이 안 돼요. 풀기 전에 흐름을 설계하는 습관을 지금 만들어야 해요.", daily_plan: "하루 2시간: 개념 40% + 기출 40% + 오답 복기 20%", caution: "기출 강의는 풀이 암기가 목적이 아니에요. 강사의 사고 과정을 배우세요." },
    period_plan: [
      { period: "3~6모 전", goal: "개념 완성 + 기출 사고 흐름 형성", actions: ["수I·수II 핵심 개념 백지복습으로 완성", "쉬운 기출 위주로 개념-문제 연결 고정", "오답을 개념/해석/계산으로 분류해 재풀이"], checkpoints: ["개념 백지 재연 가능", "기출 기본 문제 정답률 70%+"], caution: "강의 시청만으로 공부를 끝내지 마세요." },
      { period: "6~9모", goal: "N제 입문 + 시간 관리 훈련", actions: ["입문 N제 하루 20문항 시작", "자이스토리 4점 문제 병행", "주 2~3회 실전 세트로 시간 배분 훈련"], checkpoints: ["입문 N제 정답률 80%+", "60분 안에 공통 완료"], caution: "N제는 기출 사고 흐름을 연결하며 풀어야 해요. 무지성 풀이 금지." },
      { period: "9모~수능 전", goal: "실전 안정화", actions: ["중난도 N제로 상향", "실전 모의고사 주 2회", "취약 단원 집중 보완"], checkpoints: ["모의고사 40점대 안정", "시간 초과 빈도 감소"], caution: "새 내용보다 오답 완전 제거에 집중하세요." },
    ],
    phases: [
      { phase: 1, title: "개념 완성", duration: "4주", goal: "수I·수II 핵심 개념 완성", topics: ["지수·로그 함수 그래프", "삼각함수 기초", "등차·등비수열+Σ", "다항함수 미분 기초"], lectures: ["이미지 - 미친개념", "김기헌 - 아이디어 (개념편)"], daily_plan: "하루 2시간 — 개념 강의 1시간 + 백지복습 + 기초 문제", checkpoints: ["개념 백지 재연 가능", "개념 문제 정답률 70%+"], caution: "반드시 백지에 직접 써보고 말로 설명해보세요." },
      { phase: 2, title: "기출 학습", duration: "3주", goal: "시나리오 매핑 사고 습관 형성", topics: ["평가원·수능 기출 풀이", "조건 해석→풀이 흐름 설계", "사고 흐름 위주 복습"], lectures: ["이미지 - 미친기출", "정승제 기출 강의"], daily_plan: "하루 2시간 — 기출 풀이 1시간 + 사고 흐름 복습 1시간", checkpoints: ["풀기 전 흐름 설계 습관 형성", "기출 논리적 접근 가능"], caution: "기출 강의는 풀이 암기가 아니에요. 강사의 사고 과정을 배우세요." },
      { phase: 3, title: "N제 입문 양치기", duration: "3주", goal: "방향 잡힌 양치기로 실력 폭발", topics: ["입문~중난이도 N제", "하루 20~30문항", "기출 사고 흐름 연결"], lectures: ["자이스토리 4점 문제 (20문항) + 입문 N제 (10문항) 혼합"], daily_plan: "하루 2시간 — N제 20~30문항 + 오답 복기", checkpoints: ["하루 20문항 이상 꾸준히", "입문 N제 정답률 80%+"], caution: "기출 사고 흐름 없이 무지성으로 풀면 의미 없어요." },
    ],
    books: ["자이스토리 수학I·수학II", "쎈 수학I·수학II", "EBS 수능특강 수학영역"],
    final_tip: "N제 양치기에서 성적이 실질적으로 오릅니다.",
  },

  "5-3": {
    duration: "14주", nje_level: "중난이도",
    summary: "개념→기출→N제→실모 4단계를 모두 밟아야 해요. 현우진 또는 김기헌 선생님 커리큘럼을 처음부터 끝까지 일관되게 따라가세요. 준킬러를 자력으로 풀기 시작하면 3등급은 현실이 돼요.",
    current_focus: { headline: "지금 시기: 기출 구조화 + 준킬러 대비", why_now: "3등급 진입의 핵심은 기출을 유형별로 구조화하고, 준킬러 문항에서 풀이 선택 기준을 세우는 것이에요.", daily_plan: "하루 3시간: 개념/기출 40% + 유형 풀이 40% + 오답 복기 20%", caution: "개념 강사와 기출 강사를 바꾸는 건 비추예요. 동일한 사고 체계를 유지하세요." },
    period_plan: [
      { period: "3~6모 전", goal: "개념 완성 + 기출 사고 흐름 형성", actions: ["수I·수II 취약 단원 집중 보완", "선택과목 개념 완성", "평가원 기출 시나리오 매핑 훈련", "오답 노트에 실수 원인과 재발 방지 규칙 기록"], checkpoints: ["개념 문제 정답률 85%+", "기출 준킬러 접근 가능"], caution: "개념 완성 전에 기출 많이 풀면 개념이 흔들려요." },
      { period: "6~9모", goal: "준킬러→킬러 N제 양치기", actions: ["중난도 N제 하루 25~30문항", "주 3회 실전 세트로 시간 배분 훈련", "오답 유형 3개 이하로 축소"], checkpoints: ["중난도 N제 정답률 80%+", "준킬러 자력 풀이 가능"], caution: "오답을 3번 이상 반복 복습하세요." },
      { period: "9모~수능 전", goal: "실전 안정화 + 실수 최소화", actions: ["실전 모의고사 주 3회", "시간 배분 최적화", "EBS 연계 최종 확인"], checkpoints: ["모의고사 70점대 안정", "30번 이전 실수 0"], caution: "오답 복기 없는 실모는 역효과예요." },
    ],
    phases: [
      { phase: 1, title: "개념 완성", duration: "3주", goal: "수I·수II + 선택과목 개념 완성", topics: ["수I·수II 취약 단원 집중", "선택과목(확통/미적/기하) 전범위", "백지복습 체화"], lectures: ["현우진 - 뉴런 (수I·수II)", "김기헌 - 아이디어"], daily_plan: "하루 3시간 — 개념 강의 1.5시간 + 백지복습 + 기초 문제", checkpoints: ["개념 문제 정답률 85%+", "선택과목 개념 노트 완성"], caution: "개념 완성 전에 기출 많이 풀면 개념이 흔들려요." },
      { phase: 2, title: "기출 학습", duration: "4주", goal: "시나리오 매핑 + 평가원 사고법", topics: ["평가원·수능 기출 전범위", "시나리오 매핑 훈련", "강사 사고 과정 분석"], lectures: ["현우진 - 수분감", "김기헌 기출 강의"], daily_plan: "하루 3시간 — 기출 1.5시간 + 사고 흐름 복습 1.5시간", checkpoints: ["준킬러 기출 자력 접근", "풀이 과정 논리적 서술"], caution: "개념 강사와 기출 강사를 바꾸는 건 비추예요." },
      { phase: 3, title: "N제 양치기", duration: "5주", goal: "준킬러→킬러 실력 폭발", topics: ["중난도 N제→고난도 N제", "하루 20~30문항", "기출 사고 흐름 연결"], lectures: ["현우진 - 드릴 시리즈", "문회전·4위규칙 시즌1"], daily_plan: "하루 3시간 — N제 25~30문항 + 오답 분석", checkpoints: ["중난도 N제 정답률 80%+", "준킬러 자력 풀이"], caution: "오답을 3번 이상 반복 복습하세요." },
      { phase: 4, title: "실전 모의고사", duration: "2주", goal: "점수 하방 높이기", topics: ["주 2~3회 실모", "시간 배분 전략", "실수 패턴 관리"], lectures: ["현우진 - 킬링캠프", "시대인재 서바이벌 모의고사"], daily_plan: "주 3회 실모(100분) + 매일 오답·복기", checkpoints: ["모의고사 70점대 안정", "30번 이전 실수 0"], caution: "오답 복기 없는 실모는 역효과예요." },
    ],
    books: ["뉴런 수학I·수학II", "자이스토리 수학I·수학II", "EBS 수능특강 수학영역", "EBS 수능완성 수학영역"],
    final_tip: "3등급과 4등급의 차이는 준킬러 2~3문제예요.",
  },

  "3-1": {
    duration: "16주", nje_level: "고난이도",
    summary: "김범준 선생님의 킬러 사고 프레임이 핵심이에요. 점수 상방보다 하방 안정화—망할 확률을 줄이는 데 집중하세요.",
    current_focus: { headline: "지금 시기: 킬러 접근력보다 실수 제로화 우선", why_now: "상위권은 새 개념보다 실전 정확도와 선택·집중 전략이 점수 차이를 만들어요.", daily_plan: "하루 4시간: 고난도 개념 30% + 킬러 풀이 40% + 복기 30%", caution: "킬러 못 풀었을 때 해설 바로 보지 마세요. 최소 40분은 스스로 고민하세요." },
    period_plan: [
      { period: "3~6모 전", goal: "킬러 개념 심화 + 준킬러 완성", actions: ["합성함수·역함수·수열의 극한 심화 개념 완성", "준킬러 접근법 표준화", "기출 고난도 문항 풀이 논리 중심으로 재정리"], checkpoints: ["킬러 관련 개념 완벽 이해", "준킬러 자력 풀이 가능"], caution: "개념을 얕게 넓게 보면 킬러에서 무너져요." },
      { period: "6~9모", goal: "킬러 공략 + 고난도 N제 반복", actions: ["30번 유형 분류·분석", "고난도 N제 하루 25문항", "실전 세트 주 3~4회"], checkpoints: ["킬러 정답률 40%+", "고난도 N제 정답률 80%+"], caution: "항상 '왜 이 전략인가'를 생각하세요." },
      { period: "9모~수능 전", goal: "실수 제로화 + 안정적 1등급", actions: ["실전 모의고사 매일 1회", "EBS 연계 최종 확인", "당일 컨디션·루틴 확정"], checkpoints: ["모의 95점+ 안정", "30번 정답률 50%+"], caution: "새 교재 확장 중단. 기존 자료 완성도 극대화." },
    ],
    phases: [
      { phase: 1, title: "고난도 개념 심화", duration: "4주", goal: "킬러에 필요한 개념 완성", topics: ["합성함수·역함수 미분", "수열의 극한·급수", "급수 테크닉"], lectures: ["김범준 - 스타팅블록 (심화)", "현우진 - 뉴런 (킬러 개념)"], daily_plan: "하루 4시간 — 개념 심화 2시간 + 고난도 문제 2시간", checkpoints: ["킬러 개념 완벽 이해", "준킬러 자력 풀이"], caution: "하나를 깊게 파는 게 훨씬 효과적이에요." },
      { phase: 2, title: "킬러 문항 공략", duration: "6주", goal: "28~30번 자력 풀이", topics: ["30번 유형 분류·분석", "조건 해석→그래프 추론", "도형+미적분 융합"], lectures: ["김범준 - 스타팅블록/페이스메이커", "현우진 - 드릴 시리즈 (고난이도)"], daily_plan: "하루 4시간 — 킬러 풀이 2.5시간 + 복기 1.5시간", checkpoints: ["킬러 정답률 40%+", "풀이 논리 정연히 서술"], caution: "최소 40분은 스스로 고민해야 실력이 늘어요." },
      { phase: 3, title: "N제 고난이도", duration: "3주", goal: "킬러 수준 반복으로 실력 폭발", topics: ["고난이도·최고난이도 N제", "하루 20~30문항"], lectures: ["현우진 - 드릴 시리즈", "4위 규칙 시즌2", "드릴 수학"], daily_plan: "하루 4시간 — 고난도 N제 25문항 + 오답 분석", checkpoints: ["고난이도 N제 정답률 80%+", "킬러 접근 30분 이내"], caution: "항상 '왜 이 전략인가'를 생각하세요." },
      { phase: 4, title: "실전 모의고사", duration: "3주", goal: "속도+안정성+실수 제로", topics: ["매일 실모", "시간 배분 최적화", "EBS 연계 확인"], lectures: ["현우진 - 킬링캠프", "시대인재 서바이벌 모의고사", "히든카이스 모의고사"], daily_plan: "하루 실모 1회(100분) + 오답·복기 2시간", checkpoints: ["모의 95점+ 안정", "30번 정답률 50%+"], caution: "아는 것을 실수 없이 푸는 연습이 더 중요해요." },
    ],
    books: ["뉴런 수학I·수학II", "드릴 수학", "EBS 수능완성 수학영역", "역대 수능 기출 (최근 7개년)"],
    final_tip: "1등급의 차이는 킬러 1~2문제예요. 40분 고민하는 습관이 만점을 만들어요.",
  },
};

const ELECTIVES = ["확률과통계", "미적분", "기하"];

const ELECTIVE_STRATEGY = {
  확률과통계: {
    strategy: ["조건부확률·이항분포·통계 추정 파트를 유형별로 정리", "경우의 수는 식 세우기 전에 분기 시나리오를 먼저 작성", "실수 잦은 계산은 포맷(사건 정의→경우 계산→검산)으로 고정"],
    checkpoints: ["확통 대표 유형을 풀이 흐름으로 설명 가능", "경우의 수 누락 실수가 눈에 띄게 감소"],
  },
  미적분: {
    strategy: ["수열의 극한·급수·미분법을 개념-유형-기출 순으로 연결", "준킬러는 계산보다 조건 해석 우선 전략으로 접근", "고난도 문항은 1차 접근 실패 시 회수 규칙까지 포함해 훈련"],
    checkpoints: ["미적분 준킬러 문항 정답률 상승", "풀이 시작 전 시나리오 설계 습관 정착"],
  },
  기하: {
    strategy: ["벡터·공간도형·이차곡선 공식을 그림-식으로 연결 암기", "도형 조건을 좌표화하는 기준 절차를 반복 훈련", "문항당 핵심 단서 2개를 먼저 찾고 계산을 시작"],
    checkpoints: ["기하 필수 공식 회상 속도 향상", "좌표화·벡터화 접근 실패율 감소"],
  },
};

const NJE_LIST = [
  { level: "입문", range: "9~12번 수준", color: "#7BED9F", textColor: "#1a5c35", items: ["엔티켓", "불꽃 N제 시즌1", "싱글 커넥션"], target: "80% 이상 → 중난이도로" },
  { level: "중난이도", range: "13~14번 수준", color: "#ECCC68", textColor: "#5c4a00", items: ["문회전 시즌1", "예언 N제", "불꽃 N제 시즌2", "4위 규칙 시즌1", "브리지 투 킬러"], target: "80% 이상 → 고난이도로" },
  { level: "고난이도", range: "15~22번 수준", color: "#FF6B35", textColor: "#fff", items: ["드릴 시리즈", "4위 규칙 시즌2", "부스터 N제", "예언 N제 시리즈"], target: "80% 이상 → 최고난이도로" },
  { level: "최고난이도", range: "30번 이상", color: "#FF4757", textColor: "#fff", items: ["이미지 하루 4점 10개", "문회전 시즌2", "샤인미 N제"], target: "시간 여유 있는 1~2등급만" },
];

const GRADE_INFO = {
  1:{label:"1등급",color:"#ff5d5d",range:"96~100점"},2:{label:"2등급",color:"#ff7b39",range:"89~95점"},
  3:{label:"3등급",color:"#ffad33",range:"77~88점"},4:{label:"4등급",color:"#f0cc5f",range:"60~76점"},
  5:{label:"5등급",color:"#87d88b",range:"40~59점"},6:{label:"6등급",color:"#6aa7ff",range:"23~39점"},
  7:{label:"7등급",color:"#9b8cff",range:"12~22점"},8:{label:"8등급",color:"#a2adb5",range:"4~11점"},
  9:{label:"9등급",color:"#6f7a82",range:"3점 이하"},
};

function getCurriculumKey(c, t) {
  if (c >= 8 && t >= 6) return "9-7";
  if (c >= 6 && t >= 4) return "7-5";
  if (c >= 4 && t >= 2) return "5-3";
  if (c >= 2 && t >= 1) return "3-1";
  return null;
}

function getRecommendedInstructors(key, elective) {
  return INSTRUCTOR_CATALOG
    .filter(i => i.fitKeys.includes(key) || i.fitKeys.includes("all"))
    .filter(i => !i.subjectTags || i.subjectTags.includes("공통") || i.subjectTags.includes(elective))
    .slice(0, 3);
}

function getRecommendedBooks(key, elective) {
  return BOOK_CATALOG
    .filter(b => b.fitKeys.includes(key))
    .filter(b => !b.subjectTags || b.subjectTags.includes(elective))
    .slice(0, 6);
}

export default function App() {
  const [currentGrade, setCurrentGrade] = useState(null);
  const [targetGrade, setTargetGrade] = useState(null);
  const [electiveSubject, setElectiveSubject] = useState("미적분");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("curriculum");

  const canSubmit = !!currentGrade && !!targetGrade && targetGrade < currentGrade;

  async function handleAnalyze() {
    if (!canSubmit) { setError("현재 등급과 목표 등급을 확인해주세요."); return; }
    setError(""); setLoading(true); setActiveTab("curriculum");

    const key = getCurriculumKey(currentGrade, targetGrade);
    const curriculum = CURRICULUM[key];
    const instructors = getRecommendedInstructors(key, electiveSubject);
    const books = getRecommendedBooks(key, electiveSubject);
    const electiveInfo = ELECTIVE_STRATEGY[electiveSubject];

    if (curriculum) {
      setPlan({ ...curriculum, key, electiveSubject, instructors, books, electiveInfo, usedPreset: true });
      setLoading(false);
      return;
    }

    // AI fallback
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content:
            `수능 수학 ${currentGrade}등급→${targetGrade}등급, 선택과목: ${electiveSubject} 커리큘럼을 JSON만 반환. 마크다운 없이.\n{"summary":"...","duration":"...","current_focus":{"headline":"...","why_now":"...","daily_plan":"...","caution":"..."},"period_plan":[{"period":"3~6모 전","goal":"...","actions":["..."],"checkpoints":["..."],"caution":"..."},{"period":"6~9모","goal":"...","actions":["..."],"checkpoints":["..."],"caution":"..."},{"period":"9모~수능 전","goal":"...","actions":["..."],"checkpoints":["..."],"caution":"..."}],"phases":[{"phase":1,"title":"...","duration":"...","goal":"...","topics":["..."],"lectures":["..."],"daily_plan":"...","checkpoints":["..."],"caution":"..."}],"books":["..."],"final_tip":"...","nje_level":"입문"}`
          }],
        }),
      });
      const d = await res.json();
      const parsed = JSON.parse(d.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim());
      setPlan({ ...parsed, key, electiveSubject, instructors, books, electiveInfo, usedPreset: false });
    } catch { setError("생성 오류가 발생했어요. 다시 시도해주세요."); }
    finally { setLoading(false); }
  }

  function resetAll() { setCurrentGrade(null); setTargetGrade(null); setElectiveSubject("미적분"); setPlan(null); setError(""); }

  const phaseColors = ["#FF6B6B", "#FFA502", "#7BED9F", "#70A1FF"];
  const njeIdx = NJE_LIST.findIndex(n => n.level === plan?.nje_level);
  const relevantNje = NJE_LIST.slice(Math.max(0, njeIdx), njeIdx + 2);

  return (
    <div style={s.root}>
      <div style={s.bg} />
      <div style={s.wrap}>
        <header style={s.header}>
          <div style={s.badge}>수능 수학 로드맵</div>
          <h1 style={s.title}>과목 구조를 반영한<br /><span style={s.accent}>등급별 학습 설계</span></h1>
          <p style={s.sub}>공통(수학I/II) + 선택(확통/미적/기하) · 800명 컨설팅 데이터 기반</p>
        </header>

        {!plan && (
          <div style={s.card}>
            <Section title="현재 등급">
              <GradeGrid selected={currentGrade} onSelect={setCurrentGrade} disabledFrom={null} />
            </Section>
            <Section title="목표 등급">
              <GradeGrid selected={targetGrade} onSelect={setTargetGrade} disabledFrom={currentGrade} />
            </Section>
            <Section title="선택 과목">
              <div style={s.electiveRow}>
                {ELECTIVES.map(sub => (
                  <button key={sub} onClick={() => setElectiveSubject(sub)}
                    style={{ ...s.electiveBtn, ...(electiveSubject === sub ? s.electiveBtnOn : {}) }}>
                    {sub}
                  </button>
                ))}
              </div>
            </Section>
            {error && <div style={s.error}>{error}</div>}
            <button onClick={handleAnalyze} disabled={!canSubmit || loading}
              style={{ ...s.cta, opacity: canSubmit && !loading ? 1 : 0.45 }}>
              {loading ? "분석 중..." : canSubmit ? `${currentGrade}등급 → ${targetGrade}등급 분석 시작` : "등급을 선택해주세요"}
            </button>
          </div>
        )}

        {plan && (
          <div style={s.resultWrap}>
            {/* 헤더 배지 */}
            <div style={s.rowBadges}>
              <span style={{ ...s.gradePill, background: GRADE_INFO[currentGrade]?.color }}>{currentGrade}등급</span>
              <span style={s.arrow}>→</span>
              <span style={{ ...s.gradePill, background: GRADE_INFO[targetGrade]?.color }}>{targetGrade}등급</span>
              <span style={s.subjectPill}>선택: {plan.electiveSubject}</span>
              <span style={{ marginLeft: "auto", color: "#888", fontSize: 12 }}>⏱ {plan.duration}</span>
              {plan.usedPreset && <span style={s.verifiedBadge}>✅ 검증된 데이터</span>}
            </div>

            {/* 탭 */}
            <div style={s.tabBar}>
              {[["curriculum","📋 커리큘럼"],["period","📅 구간별 계획"],["instructor","👨‍🏫 추천 강사"],["book","📚 추천 교재"],["nje","📝 N제 추천"]].map(([id,label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{ ...s.tab, ...(activeTab === id ? s.tabActive : {}) }}>{label}</button>
              ))}
            </div>

            {/* 커리큘럼 탭 */}
            {activeTab === "curriculum" && <>
              <Panel title="요약">
                <p style={s.body}>{plan.summary}</p>
                <div style={s.focusBox}>
                  <div style={s.focusHeadline}>{plan.current_focus?.headline}</div>
                  <p style={s.body}>{plan.current_focus?.why_now}</p>
                  <p style={s.metaText}>📅 하루 루틴: {plan.current_focus?.daily_plan}</p>
                  <p style={s.warnText}>⚠️ {plan.current_focus?.caution}</p>
                </div>
              </Panel>
              {plan.phases?.map((ph, i) => (
                <div key={i} style={s.phaseCard}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ ...s.phaseTag, background: phaseColors[i % 4] }}>PHASE {ph.phase}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{ph.title}</div>
                      <div style={{ color: "#888", fontSize: 12 }}>{ph.duration} · {ph.goal}</div>
                    </div>
                  </div>
                  <div style={s.twoCol}>
                    <div>
                      <div style={s.colTitle}>📌 핵심 주제</div>
                      <List items={ph.topics} />
                    </div>
                    <div>
                      <div style={s.colTitle}>🎓 추천 강의</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {ph.lectures?.map((lec, j) => (
                          <a key={j} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(lec)}`}
                            target="_blank" rel="noreferrer" style={s.lecTag}>🎬 {lec}</a>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={s.twoCol}>
                    <div>
                      <div style={s.colTitle}>📅 하루 계획</div>
                      <p style={{ ...s.body, margin: 0 }}>{ph.daily_plan}</p>
                    </div>
                    <div>
                      <div style={s.colTitle}>✅ 완료 기준</div>
                      <List items={ph.checkpoints} />
                    </div>
                  </div>
                  {ph.caution && <div style={s.cautionBox}>⚠️ <strong>주의</strong> — {ph.caution}</div>}
                </div>
              ))}
              <Panel title={`선택과목: ${plan.electiveSubject} 전략`}>
                <div style={s.twoCol}>
                  <div>
                    <div style={s.colTitle}>📌 전략</div>
                    <List items={plan.electiveInfo?.strategy} />
                  </div>
                  <div>
                    <div style={s.colTitle}>✅ 체크포인트</div>
                    <List items={plan.electiveInfo?.checkpoints} />
                  </div>
                </div>
              </Panel>
              <Panel title="마무리 조언">
                <p style={s.body}>{plan.final_tip}</p>
              </Panel>
            </>}

            {/* 구간별 계획 탭 */}
            {activeTab === "period" && <Panel title="모평 구간별 계획">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {plan.period_plan?.map((period, idx) => (
                  <div key={idx} style={s.periodCard}>
                    <div style={s.periodTitle}>{period.period}</div>
                    <p style={s.metaText}>목표: {period.goal}</p>
                    <div style={s.colTitle}>실천 사항</div>
                    <List items={period.actions} />
                    <div style={s.colTitle}>체크포인트</div>
                    <List items={period.checkpoints} />
                    <p style={s.warnText}>⚠️ {period.caution}</p>
                  </div>
                ))}
              </div>
            </Panel>}

            {/* 강사 추천 탭 */}
            {activeTab === "instructor" && <Panel title="추천 강사">
              <div style={s.infoBox}>💡 OT·맛보기 강의로 직접 확인 후 본인에게 맞는 강사를 선택하세요.</div>
              <div style={s.itemList}>
                {plan.instructors?.map((inst, i) => (
                  <div key={i} style={s.itemCardLarge}>
                    <div style={s.itemHeader}>
                      <strong>{inst.name}</strong>
                      <span style={s.platform}>{inst.platform}</span>
                    </div>
                    <p style={s.itemText}>적합 학생: {inst.bestFor}</p>
                    <p style={s.itemText}>특징: {inst.strengths?.join(", ")}</p>
                    <p style={s.itemText}>활용법: {inst.usage}</p>
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(inst.name + " 수능수학")}`}
                        target="_blank" rel="noreferrer" style={s.lecTag}>🎬 유튜브 검색</a>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>}

            {/* 교재 추천 탭 */}
            {activeTab === "book" && <Panel title="추천 교재">
              <div style={s.itemList}>
                {plan.books?.map((title, i) => {
                  const book = BOOK_CATALOG.find(b => b.title === title) || { title, type: "", purpose: "", when: "", difficulty: "" };
                  return (
                    <div key={i} style={s.itemCard}>
                      <div style={s.itemHeader}>
                        <strong>{book.title}</strong>
                        <span style={s.platform}>{book.type}</span>
                      </div>
                      <p style={s.itemText}>목적: {book.purpose}</p>
                      <p style={s.itemText}>권장 시기: {book.when}</p>
                      <p style={s.itemText}>난이도: {book.difficulty}</p>
                    </div>
                  );
                })}
              </div>
            </Panel>}

            {/* N제 추천 탭 */}
            {activeTab === "nje" && <div>
              <div style={s.infoBox}>📌 <strong style={{ color: "#FF6B35" }}>"어떤 N제든 다 좋다. 방향 잡힌 양이 중요"</strong> — 정답률 80%+ 달성 시 다음 단계로 올라가세요.</div>
              {relevantNje.map((n, i) => (
                <div key={i} style={{ ...s.phaseCard, borderLeft: `3px solid ${n.color}`, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ background: n.color, color: n.textColor, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>{n.level}</span>
                    <span style={{ color: "#888", fontSize: 12 }}>{n.range}</span>
                    <span style={{ marginLeft: "auto", color: n.color, fontSize: 11, fontWeight: 700 }}>{n.target}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {n.items.map((item, j) => (
                      <a key={j} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item + " 수능수학 N제")}`}
                        target="_blank" rel="noreferrer"
                        style={{ border: `1px solid ${n.color}66`, color: n.color, padding: "4px 10px", borderRadius: 20, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                        📝 {item}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>}

            <button onClick={resetAll} style={s.resetBtn}>↩ 다시 설정하기</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return <section style={{ marginBottom: 22 }}><h2 style={s.sectionTitle}>{title}</h2>{children}</section>;
}

function Panel({ title, children }) {
  return <section style={s.panel}><h2 style={s.panelTitle}>{title}</h2>{children}</section>;
}

function List({ items }) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return null;
  return <ul style={s.ul}>{arr.map((item, i) => <li key={i} style={s.li}>{item}</li>)}</ul>;
}

function GradeGrid({ selected, onSelect, disabledFrom }) {
  return (
    <div style={s.grid}>
      {Object.entries(GRADE_INFO).map(([grade, info]) => {
        const n = Number(grade);
        const disabled = disabledFrom ? n >= disabledFrom : false;
        return (
          <button key={grade} onClick={() => !disabled && onSelect(n)} style={{
            ...s.gradeBtn,
            background: selected === n ? info.color : "rgba(255,255,255,0.05)",
            borderColor: selected === n ? info.color : "rgba(255,255,255,0.14)",
            color: selected === n ? "#fff" : disabled ? "#4f5663" : "#c4c4c4",
            opacity: disabled ? 0.35 : 1,
          }}>
            <span style={{ fontWeight: 700 }}>{info.label}</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>{info.range}</span>
          </button>
        );
      })}
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", color: "#f3f3f3", background: "#070b14", fontFamily: "'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif", position: "relative" },
  bg: { position: "fixed", inset: 0, background: "radial-gradient(circle at 20% 20%, rgba(255,109,109,0.14), transparent 36%), radial-gradient(circle at 80% 70%, rgba(87,155,255,0.14), transparent 36%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "auto, auto, 38px 38px, 38px 38px", pointerEvents: "none" },
  wrap: { width: "min(980px, 92vw)", margin: "0 auto", padding: "34px 0 72px", position: "relative", zIndex: 1 },
  header: { textAlign: "center", marginBottom: 26 },
  badge: { display: "inline-block", border: "1px solid rgba(255,127,127,0.45)", background: "rgba(255,127,127,0.15)", color: "#ff8b8b", padding: "5px 12px", borderRadius: 999, fontSize: 12, marginBottom: 12 },
  title: { margin: 0, fontSize: "clamp(26px, 4vw, 44px)", lineHeight: 1.25, letterSpacing: -0.5 },
  accent: { background: "linear-gradient(135deg,#ff8a6a,#6cb0ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  sub: { color: "#94a0b3", marginTop: 12, fontSize: 14 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 22, backdropFilter: "blur(8px)" },
  sectionTitle: { margin: "0 0 10px", fontSize: 14, color: "#9aa5b8" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 },
  gradeBtn: { border: "1px solid", borderRadius: 12, padding: "10px 6px", display: "flex", flexDirection: "column", gap: 4, alignItems: "center", transition: "all .16s", cursor: "pointer" },
  electiveRow: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 },
  electiveBtn: { border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, background: "rgba(255,255,255,0.04)", color: "#c8d1e2", padding: "10px 12px", cursor: "pointer", fontWeight: 600 },
  electiveBtnOn: { border: "1px solid rgba(108,176,255,0.7)", background: "rgba(108,176,255,0.16)", color: "#d7e7ff" },
  error: { marginBottom: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,100,100,0.4)", background: "rgba(255,100,100,0.12)", color: "#ff8e8e", fontSize: 13 },
  cta: { width: "100%", border: "none", borderRadius: 12, padding: "14px 16px", background: "linear-gradient(135deg,#ff7f66,#ff4f7a)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  resultWrap: { display: "grid", gap: 12 },
  rowBadges: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  gradePill: { borderRadius: 999, padding: "4px 12px", fontWeight: 700, fontSize: 13 },
  subjectPill: { borderRadius: 999, padding: "4px 12px", fontWeight: 700, fontSize: 13, background: "rgba(108,176,255,0.2)", border: "1px solid rgba(108,176,255,0.45)", color: "#d7e7ff" },
  verifiedBadge: { background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ECC71", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  arrow: { color: "#8f98aa" },
  tabBar: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 },
  tab: { padding: "7px 13px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#888", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  tabActive: { background: "rgba(255,127,100,0.15)", borderColor: "rgba(255,127,100,0.4)", color: "#ff8a6a" },
  panel: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 14, padding: 20 },
  panelTitle: { margin: "0 0 12px", fontSize: 15, color: "#ffba8b" },
  focusBox: { background: "rgba(255,100,80,0.06)", border: "1px solid rgba(255,100,80,0.2)", borderRadius: 12, padding: 16, marginTop: 12 },
  focusHeadline: { fontWeight: 800, fontSize: 16, marginBottom: 8 },
  body: { margin: "0 0 8px", lineHeight: 1.7, color: "#d9deea", fontSize: 14 },
  metaText: { margin: "0 0 8px", color: "#a9b4c6", fontSize: 13, lineHeight: 1.65 },
  warnText: { margin: 0, color: "#ffb47e", fontSize: 13, lineHeight: 1.65 },
  phaseCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 },
  phaseTag: { color: "#fff", padding: "5px 11px", borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: 1, whiteSpace: "nowrap", marginTop: 2 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 },
  colTitle: { fontSize: 11, fontWeight: 700, color: "#FF6B35", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" },
  cautionBox: { background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.2)", color: "#FFA502", padding: "10px 14px", borderRadius: 10, fontSize: 13, lineHeight: 1.6 },
  periodCard: { border: "1px solid rgba(255,255,255,0.11)", background: "rgba(11,17,30,0.45)", borderRadius: 12, padding: 14 },
  periodTitle: { fontWeight: 800, marginBottom: 7, color: "#83b5ff", fontSize: 14 },
  infoBox: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", marginBottom: 14, fontSize: 13, color: "#aaa", lineHeight: 1.7 },
  itemList: { display: "grid", gap: 10 },
  itemCardLarge: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 14 },
  itemCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12 },
  itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14 },
  platform: { fontSize: 11, color: "#8fb3ff", border: "1px solid rgba(125,165,255,0.35)", borderRadius: 999, padding: "2px 8px" },
  itemText: { margin: "0 0 4px", color: "#c8d3e6", fontSize: 13, lineHeight: 1.55 },
  lecTag: { background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.25)", color: "#FF6B35", padding: "3px 9px", borderRadius: 20, fontSize: 11, textDecoration: "none" },
  ul: { margin: "0 0 8px", paddingLeft: 18 },
  li: { marginBottom: 4, lineHeight: 1.6, color: "#d6deee", fontSize: 13 },
  resetBtn: { border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.03)", color: "#c2ccdf", borderRadius: 12, padding: "12px 14px", cursor: "pointer", fontSize: 14, width: "100%" },
};
