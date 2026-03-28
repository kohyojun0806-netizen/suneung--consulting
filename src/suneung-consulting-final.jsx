import { useState } from "react";
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8787";

// ════════════════════════════════════════════════════════
// 📊 등급별 학습법 데이터 (grade_study_methods.json 기반)
// ════════════════════════════════════════════════════════
const GRADE_STUDY_METHODS = {
  "9-7": {
    targetUser: "노베이스~하위권",
    focus: "개념 출력 습관 + 쉬운 기출 연결",
    core: "강의를 많이 듣는 것보다 개념을 말과 글로 꺼내는 연습이 먼저다. 출력이 안 되면 문제 적용이 불안정해진다.",
    nowActions: [
      "수업 직후 15~20분 백지복습 고정 — 책을 덮고 핵심 정의·공식을 직접 작성",
      "개념 강의 직후 쉬운 기출 10~20문항으로 즉시 적용 훈련",
      "오답을 개념 오류 / 해석 실수 / 계산 실수로 분류해 당일 재풀이",
    ],
    dailyPlan: "하루 2시간: 개념 출력 40% + 문제 적용 40% + 오답 복기 20%",
    caution: "강의 시청만으로 공부를 끝내지 마세요. 출력이 없으면 실력이 쌓이지 않아요.",
    periodPlan: {
      "3_6": {
        label: "3~6월 (6모 전)",
        goal: "개념 공백 제거 + 출력 루틴 정착",
        actions: [
          "연산·함수·방정식 공백 단원 집중 정리",
          "개념 노트 압축 — 단원별 핵심 정의·공식 1페이지",
          "쉬운 기출 위주 반복 — 틀린 문제 당일 재풀이 고정",
        ],
        checkpoints: ["개념 노트 없이 핵심 공식 설명 가능", "기초 기출 정답률 60%+"],
        caution: "이 시기에 어려운 문제에 매달리면 개념 시간이 날아가요.",
      },
      "6_9": {
        label: "6~9월 (9모 전)",
        goal: "수I·수II 기본 유형 완성 + 시간 관리 도입",
        actions: [
          "수I·수II 기본 유형 회독 — 단원별 대표 유형 3개 이상",
          "시간 제한 풀이 도입 — 문항당 2~3분 제한",
          "오답 재풀이 루틴 고정 — 틀린 문제 3일 안에 재풀이",
        ],
        checkpoints: ["기본 유형 정답률 70%+", "시간 초과 문항 수 감소"],
        caution: "유형서만 풀고 개념 복기를 안 하면 금방 무너져요.",
      },
      "9_csat": {
        label: "9모~수능",
        goal: "실전 적응 + 반복 실수 제거",
        actions: [
          "기출 기본 문항 정확도 안정화",
          "실전 모의고사 입문 — 주 1~2회",
          "자주 틀리는 실수 패턴 3개 이하로 축소",
        ],
        checkpoints: ["모의고사 40점대 안정", "실수 패턴 3개 이하"],
        caution: "새 내용보다 아는 것을 완벽히 하는 게 더 중요해요.",
      },
    },
  },
  "7-5": {
    targetUser: "중하위권",
    focus: "개념 완성 이후 기출 적용량 확보",
    core: "개념을 끝없이 돌리는 방식보다 일정 기간 내 개념을 정리하고, 유형·기출 적용 비중을 늘리는 것이 등급 상승에 유리하다.",
    nowActions: [
      "개념 기간을 4~8주로 제한하고 적용 단계로 넘어가기",
      "강의 자료 2~3회 복습 후 해설 의존 없이 기출 재현 훈련",
      "기출 풀이를 풀이 암기가 아닌 사고 흐름 재현으로 복습",
    ],
    dailyPlan: "하루 2.5시간: 개념·기출 50% + 유형 풀이 30% + 오답 복기 20%",
    caution: "개념을 완벽히 하려다 기출 시작이 늦어지면 N제·실모 시간이 부족해져요.",
    periodPlan: {
      "3_6": {
        label: "3~6월 (6모 전)",
        goal: "공통 개념 마무리 + 기출 사고 흐름 형성",
        actions: [
          "공통 개념(수I·수II) 1차 정리 — 4~8주 기간 제한",
          "쉬운 기출 유형 분류 — 단원별 대표 기출 3개 이상",
          "선택과목 취약 유형 집중 — 확통/미적/기하 중 약점 단원",
        ],
        checkpoints: ["공통 개념 1차 정리 완료", "기출 기본형 정답률 65%+"],
        caution: "개념이 완벽하지 않아도 기출로 넘어가야 해요. 개념은 기출하며 보완해요.",
      },
      "6_9": {
        label: "6~9월 (9모 전)",
        goal: "중난도 기출 확장 + 실전 세트 도입",
        actions: [
          "중난도 기출 비중 확대 — 준킬러 이하 문항 반복",
          "주 2~3회 실전 세트 — 시간 배분 규칙 고정",
          "오답 복기 루틴 — 틀린 이유를 유형별로 정리",
        ],
        checkpoints: ["중난도 기출 정답률 70%+", "실전 세트 시간 초과 감소"],
        caution: "한 문제에 10분 이상 쓰면 실전에서 시간이 무너져요.",
      },
      "9_csat": {
        label: "9모~수능",
        goal: "실모 누적 + 반복 실수 제거",
        actions: [
          "실전 모의고사 누적 — 주 2~3회",
          "반복 실수 패턴 제거 — 오답 노트 기반 집중 보완",
          "파이널 복습 노트 압축 — 핵심 공식·유형 1페이지 정리",
        ],
        checkpoints: ["모의고사 60점대 안정", "반복 실수 2개 이하"],
        caution: "새 교재보다 기존 오답 완전 제거가 더 효과적이에요.",
      },
    },
  },
  "5-3": {
    targetUser: "중위권",
    focus: "준킬러 접근 구조화 + 시나리오 매핑",
    core: "준킬러 구간에서는 계산을 먼저 시작하지 말고, 조건을 구조화한 뒤 풀이 경로를 선택해야 안정적으로 점수가 오른다.",
    nowActions: [
      "문제 조건·목표·제약을 먼저 쓰고 계산은 뒤로 미루기 (시나리오 매핑)",
      "풀이 루트 2~3개 비교 후 계산 시작 — 가장 짧은 경로 선택",
      "준킬러 오답 3회 반복 — 풀이 선택 이유를 말로 설명할 수 있을 때까지",
    ],
    dailyPlan: "하루 3시간: 기출·유형 40% + N제 풀이 40% + 오답 복기 20%",
    caution: "준킬러를 계산 먼저 시작하면 오히려 시간이 더 걸려요. 조건 해석이 먼저예요.",
    periodPlan: {
      "3_6": {
        label: "3~6월 (6모 전)",
        goal: "준킬러 기본형 정리 + 선택과목 빈출 유형 완성",
        actions: [
          "준킬러 기본형 정리 — 단원별 준킬러 유형 3개 이상",
          "선택과목 빈출 유형 완성 — 확통/미적/기하 중 선택한 과목",
          "복기 템플릿 고정 — 오답마다 조건 해석·풀이 경로 기록",
        ],
        checkpoints: ["준킬러 기본형 자력 풀이 가능", "선택과목 빈출 유형 정답률 75%+"],
        caution: "킬러 문제는 아직 건드리지 말고 준킬러 완성에 집중하세요.",
      },
      "6_9": {
        label: "6~9월 (9모 전)",
        goal: "중난도 N제 병행 + 실모 문항 회수 훈련",
        actions: [
          "중난도 N제 병행 — 하루 15~20문항",
          "실전 모의고사에서 문항 회수 규칙 훈련 — 막히면 넘기고 돌아오기",
          "검산 루틴 도입 — 남은 시간 5분은 검산 전용",
        ],
        checkpoints: ["중난도 N제 정답률 75%+", "실모 시간 관리 안정"],
        caution: "N제는 기출 사고 흐름을 연결하며 풀어야 해요. 무지성 풀이는 효과 없어요.",
      },
      "9_csat": {
        label: "9모~수능",
        goal: "실모 안정화 + 킬러 접근 실패 패턴 교정",
        actions: [
          "실전 모의고사 안정화 — 주 3~4회, 점수 변동폭 최소화",
          "킬러 접근 실패 패턴 교정 — 틀린 킬러 재분석",
          "시험장 풀이 순서 전략 고정 — 번호 순서 vs 쉬운 것 먼저",
        ],
        checkpoints: ["모의고사 70점대 안정", "킬러 접근 시도율 상승"],
        caution: "수능 전 새 교재 확장보다 기존 오답 완전 소화가 더 중요해요.",
      },
    },
  },
  "3-1": {
    targetUser: "상위권",
    focus: "킬러 독립 접근 + 실모 원인 분류로 안정화",
    core: "상위권의 점수 차이는 새로운 문제량보다 실전 루틴 고정과 반복 실수 제거에서 결정된다.",
    nowActions: [
      "킬러 문항은 최소 40분 독립 접근 — 해설 보기 전 스스로 끝까지 고민",
      "실전 루틴 고정 — 시험장에서 사용할 문항 접근 순서를 모의고사에서 동일하게 반복",
      "실모 오답을 개념·해석·계산·시간 실수로 분류해 재발 방지 규칙 수립",
    ],
    dailyPlan: "하루 4시간: 킬러 접근 40% + 실모 풀이 30% + 오답 정밀 복기 30%",
    caution: "킬러를 못 풀었다고 해설 바로 보면 안 돼요. 최소 40분은 스스로 고민해야 실력이 늘어요.",
    periodPlan: {
      "3_6": {
        label: "3~6월 (6모 전)",
        goal: "준킬러·킬러 접근법 표준화",
        actions: [
          "준킬러·킬러 접근법 표준화 — 단원별 킬러 유형 분류",
          "기출 고난도 문항 풀이 논리 중심으로 재정리",
          "계산 정확도 훈련 — 매일 30분 루틴화",
        ],
        checkpoints: ["킬러 문항 독립 접근 40분 유지", "준킬러 정답률 85%+"],
        caution: "개념 보완이 필요하면 지금 해야 해요. 9월 이후는 새 개념 학습 시간이 없어요.",
      },
      "6_9": {
        label: "6~9월 (9모 전)",
        goal: "실전 세트 최적화 + 킬러 기댓값 전략",
        actions: [
          "실전 세트 주 3~4회 — 시간 운영 최적화",
          "킬러 문항은 완주보다 점수 기댓값 중심 접근 — 1등급 목표면 킬러 2~3개 맞추기 전략",
          "자주 틀리는 계산 패턴 집중 보정",
        ],
        checkpoints: ["실전 세트 95점+ 안정", "킬러 정답률 40%+"],
        caution: "N제를 너무 많이 늘리면 복기 시간이 부족해져요. 양보다 질로 가세요.",
      },
      "9_csat": {
        label: "9모~수능",
        goal: "실수 제로화 + EBS 연계 최종 확인",
        actions: [
          "새 교재 확장 중단 — 기존 자료 완성도 극대화",
          "EBS·기출 연계 포인트 최종 점검",
          "시험 당일 루틴 확정 — 풀이 순서·검산 타이밍",
        ],
        checkpoints: ["모의고사 95점+ 안정", "반복 실수 제로"],
        caution: "수능 직전 새 문제 욕심내지 마세요. 아는 것을 실수 없이 푸는 게 핵심이에요.",
      },
    },
  },
};

// ════════════════════════════════════════════════════════
// 👨‍🏫 강사·강의 카탈로그 (recommendation_catalog.json + instructor_curriculum_map.json 통합)
// ════════════════════════════════════════════════════════
const INSTRUCTOR_CATALOG = [
  {
    name: "현우진", platform: "메가스터디 (인강)", type: "인강",
    fitKeys: ["5-3", "3-1"],
    subjectTags: ["공통", "미적분", "기하"],
    strengths: ["고난도 문제 접근 훈련", "실전 세트 기반 복기 루틴", "준킬러~킬러 구간 대응"],
    styleTags: ["빠른 전개", "고난도 사고 강조", "실전형"],
    curriculumPath: [
      { stage: "기초개념", course: "시발점", material: "시발점 교재", when: "3~6월" },
      { stage: "실전개념", course: "뉴런", material: "뉴런 교재", when: "3~6월" },
      { stage: "기출", course: "수분감", material: "수분감 교재", when: "4~7월" },
      { stage: "N제", course: "드릴", material: "드릴 교재", when: "6~9월" },
      { stage: "파이널", course: "킬링캠프", material: "킬링캠프 모의고사", when: "9월~수능" },
    ],
    reviewSummary: [
      "개념을 문제로 연결하는 과정이 빠르고 밀도 높다는 후기가 많음",
      "중상위권 이상에서 실전 감각 상승 체감 후기가 자주 언급됨",
      "기초가 약한 학생은 진도 속도를 조절해야 한다는 의견이 반복됨",
    ],
    bestFor: "중상위권에서 준킬러/킬러 전환이 필요한 학생",
    usage: "뉴런+수분감 병행 후 드릴로 심화, 9모 이후 킬링캠프로 실전 안정화",
  },
  {
    name: "정승제", platform: "이투스 (인강)", type: "인강",
    fitKeys: ["9-7", "7-5"],
    subjectTags: ["공통", "확률과통계"],
    strengths: ["기초 개념 설명 중심", "노베이스 친화 루틴", "개념-기출 연결"],
    styleTags: ["기초친화", "반복설명", "정리형"],
    curriculumPath: [
      { stage: "개념완성", course: "개념때려잡기(개때잡)", material: "개때잡 교재", when: "3~5월" },
      { stage: "개념확장", course: "담금질", material: "담금질 교재", when: "4~6월" },
      { stage: "기출", course: "기출끝", material: "기출끝 교재", when: "5~7월" },
      { stage: "실전", course: "N제/모의 파트", material: "시즌 교재", when: "7월~수능" },
    ],
    reviewSummary: [
      "노베이스~중하위권에서 개념 공백 해소에 도움이 된다는 평가가 많음",
      "반복 복습 루틴을 같이 운영할 때 체감이 크다는 의견이 다수",
      "상위권은 개념 이후 기출·실전 전환을 빠르게 해야 한다는 후기 존재",
    ],
    bestFor: "기초가 약하고 개념 정리가 먼저 필요한 학생",
    usage: "개때잡으로 개념 틀을 만든 뒤 기출끝/실전 교재로 빠르게 전환",
  },
  {
    name: "이미지", platform: "대성마이맥 (인강)", type: "인강",
    fitKeys: ["7-5", "5-3"],
    subjectTags: ["공통", "확률과통계", "미적분"],
    strengths: ["개념 전달 압축도", "유형 전개 속도", "중위권 실전 전환"],
    styleTags: ["압축개념", "유형전개", "중위권친화"],
    curriculumPath: [
      { stage: "기초개념", course: "세젤쉬", material: "세젤쉬 교재", when: "3~4월" },
      { stage: "실전개념", course: "미친개념", material: "미친개념 교재", when: "3~6월" },
      { stage: "심화", course: "미친기분", material: "미친기분 교재", when: "5~8월" },
      { stage: "N제", course: "N티켓", material: "N티켓 교재", when: "7~9월" },
    ],
    reviewSummary: [
      "개념을 빠르게 잡고 문제로 넘기기 좋다는 후기가 반복됨",
      "강의 속도가 빠르게 느껴져 예복습이 필요하다는 의견 존재",
      "중위권에서 실전 전환용으로 선택하는 사례가 많음",
    ],
    bestFor: "개념은 알지만 문제 적용 속도가 느린 학생",
    usage: "개념 파트 수강 후 같은 주차에 기출·유형 세트를 바로 적용",
  },
  {
    name: "김도혁", platform: "두각 분당 (현강)", type: "현강",
    fitKeys: ["7-5", "5-3", "3-1"],
    subjectTags: ["공통", "미적분"],
    strengths: ["단과 기반 관리", "중상위권 실전 전환", "주간 과제-복기 구조"],
    styleTags: ["관리형", "주간피드백", "실전형"],
    curriculumPath: [
      { stage: "정규", course: "단과 정규반", material: "학원 자체 교재", when: "연간" },
      { stage: "심화", course: "심화 문제반", material: "주간 과제 자료", when: "6~9월" },
      { stage: "파이널", course: "파이널 특강", material: "파이널 자료", when: "9월~수능" },
    ],
    reviewSummary: [
      "주간 과제와 복기 구조가 체계적이라는 후기가 많음",
      "현강 특성상 질문·피드백이 빠르다는 평가",
      "중상위권에서 실전 감각 상승에 효과적이라는 의견",
    ],
    bestFor: "관리형 학습과 주간 피드백이 필요한 중상위권 학생",
    usage: "정규반 수강 후 심화 문제반 연계, 9월 이후 파이널 특강",
  },
  {
    name: "손승연", platform: "두각 분당 (현강)", type: "현강",
    fitKeys: ["7-5", "5-3", "3-1"],
    subjectTags: ["공통", "미적분", "기하"],
    strengths: ["기출 분석 구조화", "기하 전문", "실전 피드백"],
    styleTags: ["분석형", "기하특화", "실전형"],
    curriculumPath: [
      { stage: "정규", course: "단과 정규반", material: "학원 자체 교재", when: "연간" },
      { stage: "기출", course: "기출 분석반", material: "기출 분석 자료", when: "4~8월" },
      { stage: "파이널", course: "파이널 특강", material: "파이널 자료", when: "9월~수능" },
    ],
    reviewSummary: [
      "기하 선택 학생에게 특히 추천되는 강사",
      "기출 분석 방식이 구조적이라는 후기",
      "실전에서 시간 관리에 도움이 된다는 평가",
    ],
    bestFor: "기하 선택 학생 또는 기출 분석 구조화가 필요한 학생",
    usage: "정규반 + 기출 분석반 연계 수강",
  },
  {
    name: "시대인재 수학스쿨", platform: "시대인재 대치 (현강)", type: "현강",
    fitKeys: ["7-5", "5-3", "3-1"],
    subjectTags: ["공통", "확률과통계", "미적분", "기하"],
    strengths: ["체계적 커리큘럼", "관리 시스템", "파이널 자료 퀄리티"],
    styleTags: ["관리형", "체계적", "파이널특화"],
    curriculumPath: [
      { stage: "정규", course: "정규 단과반", material: "자체 교재", when: "연간" },
      { stage: "특강", course: "취약 단원 특강", material: "특강 자료", when: "필요시" },
      { stage: "파이널", course: "서바이벌/파이널", material: "모의·파이널 자료", when: "9월~수능" },
    ],
    reviewSummary: [
      "자체 모의고사와 파이널 자료 퀄리티가 높다는 후기",
      "관리 시스템이 체계적이라는 평가",
      "대치 현강 특성상 경쟁 환경이 조성된다는 의견",
    ],
    bestFor: "체계적 관리와 파이널 자료가 필요한 학생",
    usage: "정규 단과반 수강 후 파이널 서바이벌 연계",
  },
];

// ════════════════════════════════════════════════════════
// 📚 교재 카탈로그
// ════════════════════════════════════════════════════════
const BOOK_CATALOG = [
  { title: "개념원리 수학I·수학II", type: "개념서", fitKeys: ["9-7", "7-5"], difficulty: "하~중", purpose: "개념 기초 완성", when: "3~5월 개념 학습 초반", subjectTags: ["공통"] },
  { title: "RPM 수학I·수학II", type: "유형서", fitKeys: ["9-7", "7-5"], difficulty: "중", purpose: "유형 반복 훈련", when: "개념 이후 유형 연습", subjectTags: ["공통"] },
  { title: "쎈 수학I·수학II", type: "유형서", fitKeys: ["9-7", "7-5", "5-3"], difficulty: "중", purpose: "중난도 유형 완성", when: "기출 전 유형 정리", subjectTags: ["공통"] },
  { title: "자이스토리 수학I·수학II", type: "기출서", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중~상", purpose: "기출 유형 분석 + 반복", when: "5~8월 기출 학습 단계", subjectTags: ["공통"] },
  { title: "마더텅 수능기출문제집", type: "기출서", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중~상", purpose: "연도별 기출 풀이", when: "기출 학습 단계", subjectTags: ["공통"] },
  { title: "EBS 수능특강 수학영역", type: "연계교재", fitKeys: ["9-7", "7-5", "5-3", "3-1"], difficulty: "중", purpose: "연계율 70% 직접 대비 필수", when: "3월 이후 연간 병행", subjectTags: ["공통"] },
  { title: "EBS 수능완성 수학영역", type: "연계교재", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중~상", purpose: "실전 연계 완성", when: "6월 이후", subjectTags: ["공통"] },
  { title: "뉴런 수학I·수학II", type: "심화 개념", fitKeys: ["5-3", "3-1"], difficulty: "상", purpose: "개념 심화 + 실전 연결", when: "4~7월 개념 심화 단계", subjectTags: ["공통"] },
  { title: "수분감", type: "기출서", fitKeys: ["5-3", "3-1"], difficulty: "상", purpose: "고난도 기출 사고 흐름 분석", when: "5~8월 기출 심화 단계", subjectTags: ["공통"] },
  { title: "드릴", type: "N제", fitKeys: ["3-1"], difficulty: "상", purpose: "킬러 수준 반복 훈련", when: "7~9월 고난도 양치기 단계", subjectTags: ["공통"] },
  { title: "확률과통계 기출/N제 세트", type: "선택과목", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "중~상", purpose: "확통 기출 완성", when: "선택과목 학습 단계", subjectTags: ["확률과통계"] },
  { title: "미적분 기출/N제 세트", type: "선택과목", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "상", purpose: "미적분 심화 완성", when: "선택과목 학습 단계", subjectTags: ["미적분"] },
  { title: "기하 기출/N제 세트", type: "선택과목", fitKeys: ["7-5", "5-3", "3-1"], difficulty: "상", purpose: "기하 심화 완성", when: "선택과목 학습 단계", subjectTags: ["기하"] },
];

// ════════════════════════════════════════════════════════
// 선택과목 전략
// ════════════════════════════════════════════════════════
const ELECTIVE_STRATEGY = {
  확률과통계: {
    core: "확통은 개념 자체보다 경우의 수·조건부확률 문제에서 분기 시나리오를 먼저 잡는 훈련이 핵심이에요.",
    strategy: [
      "조건부확률·이항분포·통계 추정 파트를 유형별로 정리",
      "경우의 수는 식 세우기 전에 분기 시나리오를 먼저 작성",
      "실수 잦은 계산은 사건 정의→경우 계산→검산 포맷으로 고정",
    ],
    checkpoints: ["확통 대표 유형을 풀이 흐름으로 설명 가능", "경우의 수 누락 실수 눈에 띄게 감소"],
    recommendedInstructors: ["정승제", "이미지"],
  },
  미적분: {
    core: "미적분은 수열의 극한·급수·미분법을 개념-유형-기출 순서로 연결하는 훈련이 중요해요.",
    strategy: [
      "수열의 극한·급수·미분법을 개념-유형-기출 순으로 연결",
      "준킬러는 계산보다 조건 해석 우선 전략으로 접근",
      "고난도 문항은 1차 접근 실패 시 회수 규칙까지 포함해 훈련",
    ],
    checkpoints: ["미적분 준킬러 정답률 상승", "풀이 시작 전 시나리오 설계 습관 정착"],
    recommendedInstructors: ["현우진", "이미지", "김도혁"],
  },
  기하: {
    core: "기하는 벡터·공간도형·이차곡선 공식을 그림-식으로 연결하는 시각화 훈련이 핵심이에요.",
    strategy: [
      "벡터·공간도형·이차곡선 공식을 그림-식으로 연결 암기",
      "도형 조건을 좌표화하는 기준 절차를 반복 훈련",
      "문항당 핵심 단서 2개를 먼저 찾고 계산을 시작",
    ],
    checkpoints: ["기하 필수 공식 회상 속도 향상", "좌표화·벡터화 접근 실패율 감소"],
    recommendedInstructors: ["현우진", "손승연"],
  },
};

// ════════════════════════════════════════════════════════
// 수능 수학 체계 안내
// ════════════════════════════════════════════════════════
const MATH_STRUCTURE = {
  as_of: "2026년 기준",
  common: ["수학I (지수·로그·삼각함수·수열)", "수학II (극한·미분·적분)"],
  elective: ["확률과통계", "미적분", "기하"],
  rule: "공통 74점 + 선택과목 26점, 선택 1과목 응시",
  note2028: "현재 중2가 치르는 2028학년도부터 수학 선택과목 체계가 개편됩니다.",
};

// ════════════════════════════════════════════════════════
// 헬퍼 함수
// ════════════════════════════════════════════════════════
function getCurriculumKey(c, t) {
  if (c >= 8 && t >= 6) return "9-7";
  if (c >= 6 && t >= 4) return "7-5";
  if (c >= 4 && t >= 2) return "5-3";
  if (c >= 2 && t >= 1) return "3-1";
  return "5-3";
}

function getInstructors(key, elective) {
  return INSTRUCTOR_CATALOG.filter(i =>
    i.fitKeys.includes(key) &&
    (i.subjectTags.includes("공통") || i.subjectTags.includes(elective))
  );
}

function getBooks(key, elective) {
  return BOOK_CATALOG.filter(b =>
    b.fitKeys.includes(key) &&
    (!b.subjectTags || b.subjectTags.includes("공통") || b.subjectTags.includes(elective))
  );
}

function inferInstructorType(platform = "") {
  return /두각|시대인재|대치|분당|현강/.test(platform) ? "현강" : "인강";
}

function normalizeCurriculumPath(pathLike = []) {
  return (Array.isArray(pathLike) ? pathLike : []).slice(0, 6).map((line, idx) => {
    const text = String(line || "").trim();
    if (!text) {
      return {
        stage: `STEP ${idx + 1}`,
        course: "커리큘럼 정보 확인 필요",
        material: "교재 정보 확인 필요",
        when: "시기 정보 확인 필요",
      };
    }

    const [left, right] = text.split(":");
    if (!right) {
      return {
        stage: `STEP ${idx + 1}`,
        course: text,
        material: "교재 정보 확인 필요",
        when: "추천 시기 확인 필요",
      };
    }

    const detail = right.trim();
    const mat = detail.match(/^(.+?)\s*\((.+)\)$/);
    return {
      stage: left.trim(),
      course: mat ? mat[1].trim() : detail,
      material: mat ? mat[2].trim() : "교재 정보 확인 필요",
      when: "추천 시기 확인 필요",
    };
  });
}

function normalizeInstructorForUI(raw = {}) {
  const name = raw.name || "";
  return {
    ...raw,
    name,
    platform: raw.platform || "",
    type: raw.type || inferInstructorType(raw.platform || ""),
    bestFor: raw.bestFor || raw.best_for || "",
    usage: raw.usage || "",
    styleTags: raw.styleTags || (raw.style_summary ? String(raw.style_summary).split(",").map((x) => x.trim()).filter(Boolean) : []),
    curriculumPath: raw.curriculumPath || normalizeCurriculumPath(raw.curriculum_path),
    reviewSummary: raw.reviewSummary || raw.review_points || [],
  };
}

function normalizeBookForUI(raw = {}) {
  return {
    title: raw.title || "",
    type: raw.type || "교재",
    purpose: raw.purpose || "",
    when: raw.when || raw.when_to_use || "권장 시기 확인 필요",
    difficulty: raw.difficulty || "중",
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ════════════════════════════════════════════════════════
// UI 상수
// ════════════════════════════════════════════════════════
const GRADE_INFO = {
  1:{label:"1등급",range:"96~100점",color:"#ef4444"},2:{label:"2등급",range:"89~95점",color:"#f97316"},
  3:{label:"3등급",range:"77~88점",color:"#f59e0b"},4:{label:"4등급",range:"60~76점",color:"#eab308"},
  5:{label:"5등급",range:"40~59점",color:"#22c55e"},6:{label:"6등급",range:"23~39점",color:"#14b8a6"},
  7:{label:"7등급",range:"12~22점",color:"#3b82f6"},8:{label:"8등급",range:"4~11점",color:"#64748b"},
  9:{label:"9등급",range:"3점 이하",color:"#475569"},
};
const ELECTIVES = ["확률과통계", "미적분", "기하"];
const PERIOD_COLORS = { "3_6": "#6366f1", "6_9": "#f59e0b", "9_csat": "#ef4444" };

// ════════════════════════════════════════════════════════
// 메인 앱
// ════════════════════════════════════════════════════════
export default function App() {
  const [currentGrade, setCurrentGrade] = useState(null);
  const [targetGrade, setTargetGrade] = useState(null);
  const [electiveSubject, setElectiveSubject] = useState("미적분");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const canSubmit = Number.isFinite(currentGrade) && Number.isFinite(targetGrade) && targetGrade < currentGrade;

  async function handleAnalyze() {
    if (!canSubmit) { setError("현재 등급과 목표 등급을 확인해주세요."); return; }
    setError(""); setLoading(true); setActiveTab("overview");

    const key = getCurriculumKey(currentGrade, targetGrade);
    const studyMethod = GRADE_STUDY_METHODS[key];
    const instructors = getInstructors(key, electiveSubject);
    const books = getBooks(key, electiveSubject);
    const electiveInfo = ELECTIVE_STRATEGY[electiveSubject];

    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentGrade,
          targetGrade,
          electiveSubject,
        }),
      }, 12000);
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "분석 요청에 실패했습니다.");
      const usedModel = Boolean(d?.meta?.usedModel);
      const usedModelName = d?.meta?.model || "gpt-4.1";

      const serverPlan = d?.plan || {};
      const mappedInstructors = (serverPlan.recommended_instructors || []).map(normalizeInstructorForUI);
      const mappedBooks = (serverPlan.recommended_books || []).map(normalizeBookForUI);
      const fallbackInstructors = instructors.map(normalizeInstructorForUI);
      const fallbackBooks = books.map(normalizeBookForUI);

      const aiData = {
        student_feedback:
          serverPlan.student_feedback ||
          `현재 ${currentGrade}등급에서 ${targetGrade}등급으로 올리려면 ${studyMethod.focus}가 핵심이에요.`,
        key_insight: serverPlan.current_focus?.why_now || studyMethod.core,
        elective_tip:
          (serverPlan.subject_curriculum || [])
            .find((x) => x?.elective_subject?.subject === electiveSubject)
            ?.elective_subject?.strategy?.[0] || electiveInfo.core,
      };

      setPlan({
        key,
        studyMethod,
        instructors: mappedInstructors.length ? mappedInstructors : fallbackInstructors,
        books: mappedBooks.length ? mappedBooks : fallbackBooks,
        electiveInfo,
        electiveSubject,
        aiData,
        analysisSource: usedModel
          ? { type: "ai", label: `AI 분석 (${usedModelName})` }
          : { type: "data", label: "데이터 기반 분석" },
      });
    } catch (e) {
      if (e?.name === "AbortError") {
        setError("분석 서버 응답이 지연되고 있어요. 서버 실행 상태를 확인하고 다시 시도해주세요.");
      } else {
        setError("서버 연결이 불안정해 데이터 기반 추천으로 전환했어요.");
      }
      // AI 실패 시 데이터 기반 fallback
      setPlan({
        key,
        studyMethod,
        instructors: instructors.map(normalizeInstructorForUI),
        books: books.map(normalizeBookForUI),
        electiveInfo,
        electiveSubject,
        aiData: {
          student_feedback: `현재 ${currentGrade}등급에서 ${targetGrade}등급으로 올리려면 ${studyMethod.focus}가 핵심이에요. ${studyMethod.nowActions[0]}부터 시작해보세요.`,
          key_insight: studyMethod.core,
          elective_tip: electiveInfo.core,
        },
        analysisSource: { type: "data", label: "데이터 기반 분석 (로컬 fallback)" },
      });
    } finally {
      setLoading(false);
    }
  }

  function resetAll() { setCurrentGrade(null); setTargetGrade(null); setElectiveSubject("미적분"); setPlan(null); setError(""); }

  const TABS = [
    { id: "overview", label: "📋 종합 분석" },
    { id: "period", label: "📅 시기별 계획" },
    { id: "instructor", label: "👨‍🏫 추천 강의" },
    { id: "book", label: "📚 추천 교재" },
    { id: "elective", label: "🎯 선택과목" },
    { id: "structure", label: "ℹ️ 수능 체계" },
  ];

  return (
    <div style={s.root}>
      <div style={s.bg} />
      <div style={s.wrap}>

        {/* 헤더 */}
        <header style={s.header}>
          <div style={s.badge}>수능 정시 학습 컨설팅</div>
          <h1 style={s.title}>나에게 맞는<br /><span style={s.accent}>수학 학습 로드맵</span></h1>
          <p style={s.sub}>현재 등급 → 목표 등급 · 시기별 맞춤 계획 · 강사·교재 추천</p>
        </header>

        {/* 입력 카드 */}
        {!plan && (
          <div style={s.card}>
            <Section title="현재 내 등급">
              <GradeGrid selected={currentGrade} onSelect={setCurrentGrade} disabledFrom={null} />
            </Section>
            <Section title="목표 등급">
              <GradeGrid selected={targetGrade} onSelect={setTargetGrade} disabledFrom={currentGrade} />
            </Section>
            <Section title="선택과목">
              <div style={s.electiveRow}>
                {ELECTIVES.map(sub => (
                  <button key={sub} onClick={() => setElectiveSubject(sub)}
                    style={{ ...s.electiveBtn, ...(electiveSubject === sub ? s.electiveBtnOn : {}) }}>
                    {sub}
                  </button>
                ))}
              </div>
            </Section>
            {error && <div style={s.errorBox}>{error}</div>}
            <button onClick={handleAnalyze} disabled={!canSubmit || loading}
              style={{ ...s.cta, opacity: canSubmit && !loading ? 1 : 0.4 }}>
              {loading ? "🔍 분석 중..." : canSubmit
                ? `${currentGrade}등급 → ${targetGrade}등급 · ${electiveSubject} 컨설팅 시작`
                : "등급을 선택해주세요"}
            </button>
          </div>
        )}

        {/* 결과 */}
        {plan && (
          <div>
            {/* 배지 행 */}
            <div style={s.badgeRow}>
              <span style={{ ...s.gradePill, background: GRADE_INFO[currentGrade]?.color }}>{currentGrade}등급</span>
              <span style={s.arrow}>→</span>
              <span style={{ ...s.gradePill, background: GRADE_INFO[targetGrade]?.color }}>{targetGrade}등급</span>
              <span style={s.electivePill}>{electiveSubject}</span>
              <span style={s.targetUserPill}>{plan.studyMethod.targetUser}</span>
              <span style={{
                ...s.analysisSourceBadge,
                ...(plan.analysisSource?.type === "ai" ? s.analysisSourceAi : s.analysisSourceData),
              }}>
                {plan.analysisSource?.label || "분석 소스 미확인"}
              </span>
              <button onClick={resetAll} style={s.resetSmallBtn}>↩ 다시</button>
            </div>

            {/* 탭 */}
            <div style={s.tabBar}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── 탭: 종합 분석 ── */}
            {activeTab === "overview" && (
              <div style={s.grid2}>
                <Panel title="🎯 맞춤 피드백">
                  <p style={s.body}>{plan.aiData.student_feedback}</p>
                  <div style={s.insightBox}>
                    <span style={s.insightLabel}>핵심</span>
                    <p style={{ ...s.body, margin: 0, color: "#fde68a" }}>{plan.aiData.key_insight}</p>
                  </div>
                </Panel>

                <Panel title="⚡ 지금 당장 할 것">
                  <ul style={s.ul}>
                    {plan.studyMethod.nowActions.map((a, i) => <li key={i} style={s.li}>{a}</li>)}
                  </ul>
                  <div style={s.dailyBox}>
                    <span style={s.dailyLabel}>📅 하루 루틴</span>
                    <p style={{ ...s.body, margin: 0 }}>{plan.studyMethod.dailyPlan}</p>
                  </div>
                  <p style={s.warnText}>⚠️ {plan.studyMethod.caution}</p>
                </Panel>

                <Panel title={`🎯 ${electiveSubject} 선택과목 핵심`}>
                  <p style={s.body}>{plan.aiData.elective_tip}</p>
                  <ul style={s.ul}>
                    {plan.electiveInfo.strategy.map((s_, i) => <li key={i} style={s.li}>{s_}</li>)}
                  </ul>
                </Panel>
              </div>
            )}

            {/* ── 탭: 시기별 계획 ── */}
            {activeTab === "period" && (
              <div style={s.periodGrid}>
                {Object.entries(plan.studyMethod.periodPlan).map(([key, period]) => (
                  <div key={key} style={{ ...s.periodCard, borderTopColor: PERIOD_COLORS[key] }}>
                    <div style={{ ...s.periodTitle, color: PERIOD_COLORS[key] }}>{period.label}</div>
                    <p style={s.periodGoal}>목표: {period.goal}</p>
                    <div style={s.colTitle}>실천 사항</div>
                    <ul style={s.ul}>{period.actions.map((a, i) => <li key={i} style={s.li}>{a}</li>)}</ul>
                    <div style={s.colTitle}>체크포인트</div>
                    <ul style={s.ul}>{period.checkpoints.map((c, i) => <li key={i} style={{ ...s.li, color: "#86efac" }}>{c}</li>)}</ul>
                    <p style={s.warnText}>⚠️ {period.caution}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── 탭: 추천 강의 ── */}
            {activeTab === "instructor" && (
              <div>
                <div style={s.infoBox}>
                  💡 OT·맛보기 강의를 먼저 들어보고 본인 스타일에 맞는 강사를 선택하세요. 강사를 중간에 바꾸는 것은 비추예요.
                </div>
                {plan.instructors.length === 0 && (
                  <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>해당 등급·선택과목에 맞는 강사 정보를 준비 중이에요.</p>
                )}
                {plan.instructors.map((inst, i) => (
                  <div key={i} style={s.instructorCard}>
                    <div style={s.instHeader}>
                      <div>
                        <span style={s.instName}>{inst.name}</span>
                        <span style={{ ...s.typeBadge, background: inst.type === "인강" ? "rgba(99,102,241,0.2)" : "rgba(245,158,11,0.2)", color: inst.type === "인강" ? "#a5b4fc" : "#fcd34d", borderColor: inst.type === "인강" ? "rgba(99,102,241,0.4)" : "rgba(245,158,11,0.4)" }}>{inst.type}</span>
                        <span style={s.platformBadge}>{inst.platform}</span>
                      </div>
                    </div>
                    <p style={{ ...s.body, color: "#94a3b8", marginBottom: 12 }}>적합 학생: {inst.bestFor}</p>

                    <div style={s.colTitle}>커리큘럼 경로</div>
                    <div style={s.curriculumPath}>
                      {inst.curriculumPath.map((step, j) => (
                        <div key={j} style={s.curriculumStep}>
                          <div style={s.stepStage}>{step.stage}</div>
                          <div style={s.stepCourse}>{step.course}</div>
                          <div style={s.stepMaterial}>{step.material}</div>
                          <div style={s.stepWhen}>{step.when}</div>
                        </div>
                      ))}
                    </div>

                    <div style={s.colTitle}>실제 후기 요약</div>
                    <ul style={s.ul}>
                      {inst.reviewSummary.map((r, j) => <li key={j} style={{ ...s.li, color: "#94a3b8" }}>{r}</li>)}
                    </ul>
                    <p style={{ ...s.body, color: "#67e8f9", marginBottom: 8 }}>💡 활용법: {inst.usage}</p>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(inst.name + " 수학 OT")}`}
                        target="_blank" rel="noreferrer" style={s.linkBtn}>🎬 OT 영상 검색</a>
                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(inst.name + " 수학 커리큘럼")}`}
                        target="_blank" rel="noreferrer" style={s.linkBtn}>📋 커리큘럼 영상</a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 탭: 추천 교재 ── */}
            {activeTab === "book" && (
              <div>
                <div style={s.infoBox}>📚 교재는 강사 커리큘럼과 연계해서 선택하는 게 가장 효율적이에요. EBS 연계교재는 등급 무관 필수예요.</div>
                <div style={s.bookGrid}>
                  {plan.books.map((book, i) => (
                    <div key={i} style={{ ...s.bookCard, borderLeftColor: book.type === "연계교재" ? "#f59e0b" : book.type === "N제" ? "#ef4444" : book.type === "선택과목" ? "#8b5cf6" : "#3b82f6" }}>
                      <div style={s.bookHeader}>
                        <strong style={{ fontSize: 14 }}>{book.title}</strong>
                        <span style={s.bookTypeBadge}>{book.type}</span>
                      </div>
                      <p style={s.itemText}>목적: {book.purpose}</p>
                      <p style={s.itemText}>권장 시기: {book.when}</p>
                      <p style={s.itemText}>난이도: {book.difficulty}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 탭: 선택과목 ── */}
            {activeTab === "elective" && (
              <div>
                <Panel title={`🎯 ${electiveSubject} 학습 전략`}>
                  <p style={s.body}>{plan.electiveInfo.core}</p>
                  <div style={s.colTitle}>핵심 전략</div>
                  <ul style={s.ul}>{plan.electiveInfo.strategy.map((s_, i) => <li key={i} style={s.li}>{s_}</li>)}</ul>
                  <div style={s.colTitle}>체크포인트</div>
                  <ul style={s.ul}>{plan.electiveInfo.checkpoints.map((c, i) => <li key={i} style={{ ...s.li, color: "#86efac" }}>{c}</li>)}</ul>
                </Panel>
                <Panel title="추천 강사 (선택과목 기준)">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {plan.electiveInfo.recommendedInstructors.map((name, i) => {
                      const inst = INSTRUCTOR_CATALOG.find(x => x.name === name);
                      return inst ? (
                        <div key={i} style={s.miniInstCard}>
                          <strong>{inst.name}</strong>
                          <span style={{ color: "#94a3b8", fontSize: 12 }}> · {inst.platform}</span>
                          <p style={{ ...s.itemText, margin: "4px 0 0" }}>{inst.bestFor}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </Panel>
              </div>
            )}

            {/* ── 탭: 수능 체계 ── */}
            {activeTab === "structure" && (
              <Panel title="📐 수능 수학 체계 안내">
                <p style={s.metaText}>기준: {MATH_STRUCTURE.as_of}</p>
                <div style={s.colTitle}>공통과목 (74점)</div>
                <ul style={s.ul}>{MATH_STRUCTURE.common.map((c, i) => <li key={i} style={s.li}>{c}</li>)}</ul>
                <div style={s.colTitle}>선택과목 (26점, 1개 선택)</div>
                <ul style={s.ul}>{MATH_STRUCTURE.elective.map((e, i) => <li key={i} style={s.li}>{e}</li>)}</ul>
                <p style={s.metaText}>응시 규칙: {MATH_STRUCTURE.rule}</p>
                <div style={s.warnBox}>⚠️ {MATH_STRUCTURE.note2028}</div>
              </Panel>
            )}

            <button onClick={resetAll} style={s.resetBtn}>↩ 처음으로 돌아가기</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// 서브 컴포넌트
// ════════════════════════════════════════════════════════
function Section({ title, children }) {
  return <section style={{ marginBottom: 22 }}><h2 style={s.sectionTitle}>{title}</h2>{children}</section>;
}

function Panel({ title, children }) {
  return (
    <section style={s.panel}>
      <h2 style={s.panelTitle}>{title}</h2>{children}
    </section>
  );
}

function GradeGrid({ selected, onSelect, disabledFrom }) {
  return (
    <div style={s.gradeGrid}>
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
            <span style={{ fontWeight: 700, fontSize: 13 }}>{info.label}</span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>{info.range}</span>
          </button>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// 스타일
// ════════════════════════════════════════════════════════
const s = {
  root: { minHeight: "100vh", color: "#f1f5f9", background: "#07090f", fontFamily: "'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif", position: "relative" },
  bg: { position: "fixed", inset: 0, background: "radial-gradient(circle at 15% 15%, rgba(99,102,241,0.12), transparent 40%), radial-gradient(circle at 85% 80%, rgba(239,68,68,0.1), transparent 40%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "auto,auto,40px 40px,40px 40px", pointerEvents: "none" },
  wrap: { width: "min(1000px, 94vw)", margin: "0 auto", padding: "36px 0 80px", position: "relative", zIndex: 1 },
  header: { textAlign: "center", marginBottom: 28 },
  badge: { display: "inline-block", border: "1px solid rgba(99,102,241,0.5)", background: "rgba(99,102,241,0.12)", color: "#a5b4fc", padding: "5px 14px", borderRadius: 999, fontSize: 12, letterSpacing: 1, marginBottom: 14 },
  title: { margin: 0, fontSize: "clamp(28px,5vw,48px)", lineHeight: 1.2, letterSpacing: -0.5 },
  accent: { background: "linear-gradient(135deg,#818cf8,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  sub: { color: "#64748b", marginTop: 12, fontSize: 14 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, backdropFilter: "blur(10px)" },
  sectionTitle: { margin: "0 0 10px", fontSize: 13, color: "#94a3b8", fontWeight: 600 },
  gradeGrid: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 },
  gradeBtn: { border: "1px solid", borderRadius: 12, padding: "10px 6px", display: "flex", flexDirection: "column", gap: 3, alignItems: "center", cursor: "pointer", transition: "all .15s" },
  electiveRow: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 },
  electiveBtn: { border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, background: "rgba(255,255,255,0.04)", color: "#cbd5e1", padding: "11px 12px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  electiveBtnOn: { border: "1px solid rgba(99,102,241,0.6)", background: "rgba(99,102,241,0.15)", color: "#c7d2fe" },
  errorBox: { marginBottom: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: 13 },
  cta: { width: "100%", border: "none", borderRadius: 14, padding: "15px 16px", background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "opacity .2s" },
  badgeRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  gradePill: { borderRadius: 999, padding: "4px 12px", fontWeight: 700, fontSize: 13, color: "#fff" },
  electivePill: { borderRadius: 999, padding: "4px 12px", fontWeight: 700, fontSize: 13, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#c7d2fe" },
  targetUserPill: { borderRadius: 999, padding: "3px 10px", fontSize: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8" },
  analysisSourceBadge: { borderRadius: 999, padding: "3px 10px", fontSize: 12, border: "1px solid", fontWeight: 600 },
  analysisSourceAi: { background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.4)", color: "#86efac" },
  analysisSourceData: { background: "rgba(148,163,184,0.12)", borderColor: "rgba(148,163,184,0.35)", color: "#cbd5e1" },
  arrow: { color: "#475569", fontSize: 18 },
  resetSmallBtn: { marginLeft: "auto", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12 },
  tabBar: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 },
  tab: { padding: "7px 13px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s" },
  tabActive: { background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 12 },
  panel: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 12 },
  panelTitle: { margin: "0 0 12px", fontSize: 15, color: "#e2e8f0", fontWeight: 700 },
  insightBox: { background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, padding: 12, marginTop: 10 },
  insightLabel: { fontSize: 11, fontWeight: 700, color: "#818cf8", letterSpacing: 1, display: "block", marginBottom: 4 },
  dailyBox: { background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12, marginTop: 10, marginBottom: 8 },
  dailyLabel: { fontSize: 11, fontWeight: 700, color: "#67e8f9", display: "block", marginBottom: 4 },
  body: { margin: "0 0 8px", lineHeight: 1.75, color: "#cbd5e1", fontSize: 14 },
  metaText: { margin: "0 0 8px", color: "#94a3b8", fontSize: 13, lineHeight: 1.65 },
  warnText: { margin: 0, color: "#fb923c", fontSize: 13, lineHeight: 1.65 },
  warnBox: { background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 14px", color: "#fcd34d", fontSize: 13, marginTop: 10 },
  infoBox: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", marginBottom: 14, fontSize: 13, color: "#94a3b8", lineHeight: 1.7 },
  periodGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 12 },
  periodCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 18, borderTop: "3px solid" },
  periodTitle: { fontWeight: 800, fontSize: 15, marginBottom: 6 },
  periodGoal: { color: "#94a3b8", fontSize: 13, margin: "0 0 12px" },
  colTitle: { fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 0.5, marginBottom: 6, marginTop: 10, textTransform: "uppercase" },
  ul: { margin: "0 0 8px", paddingLeft: 18 },
  li: { marginBottom: 5, lineHeight: 1.65, color: "#cbd5e1", fontSize: 13 },
  instructorCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 20, marginBottom: 12 },
  instHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  instName: { fontSize: 18, fontWeight: 800, marginRight: 8 },
  typeBadge: { border: "1px solid", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 600, marginRight: 6 },
  platformBadge: { fontSize: 12, color: "#94a3b8", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 999, padding: "2px 8px" },
  curriculumPath: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 },
  curriculumStep: { background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "8px 12px", minWidth: 100 },
  stepStage: { fontSize: 10, color: "#818cf8", fontWeight: 700, marginBottom: 2 },
  stepCourse: { fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 2 },
  stepMaterial: { fontSize: 11, color: "#94a3b8", marginBottom: 2 },
  stepWhen: { fontSize: 10, color: "#64748b" },
  linkBtn: { background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", padding: "5px 12px", borderRadius: 20, fontSize: 12, textDecoration: "none", fontWeight: 600 },
  bookGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 10 },
  bookCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, borderLeft: "3px solid" },
  bookHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  bookTypeBadge: { fontSize: 11, color: "#94a3b8", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 999, padding: "2px 7px" },
  itemText: { margin: "0 0 4px", color: "#94a3b8", fontSize: 12.5, lineHeight: 1.55 },
  miniInstCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 16px", minWidth: 160 },
  resetBtn: { width: "100%", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)", color: "#94a3b8", borderRadius: 12, padding: "13px 14px", cursor: "pointer", fontSize: 14, marginTop: 16 },
};
