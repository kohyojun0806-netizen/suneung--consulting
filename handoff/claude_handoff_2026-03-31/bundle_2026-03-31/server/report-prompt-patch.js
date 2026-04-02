"use strict";

const TARGET_GRADE_LABEL = {
  "1": "1등급",
  "2-3": "2~3등급",
  "4+": "4등급 이하",
};

const BAND_META = {
  nobase: {
    label: "노베이스",
    styleGuide: [
      "불안 완화보다 실행 루틴을 먼저 제시한다.",
      "기초, 개념, 반복 단어를 포함해 학습 우선순위를 명확히 쓴다.",
      "한 번에 2개 이하 행동만 제안한다.",
    ],
    fallback: {
      evaluation:
        "이번 주 기록이 짧아도 충분히 의미 있습니다. 노베이스 구간은 기초 개념을 반복해서 문제로 꺼내는 연습을 만드는 것이 가장 중요합니다.",
      improvements: [
        "기초 개념 2개만 선정해 말로 설명하고 문제 3개에 바로 적용하기",
        "틀린 문제는 정답 암기가 아니라 개념 근거를 다시 쓰는 방식으로 반복하기",
        "하루 학습시간을 짧게라도 고정해 학습 리듬을 먼저 안정화하기",
      ],
      nextPlan:
        "다음 주는 개념서 2단원 + 쉬운 기출 15문항만 완료하세요. 매일 마지막 15분은 오답 2문항 재풀이에 반복 투자하세요.",
      materials:
        "개념서 1권과 쉬운 기출 1권만 유지하고, 자료를 늘리기보다 기초 루틴 반복률을 우선 관리하세요.",
    },
  },
  grade_5_7: {
    label: "5~7등급",
    styleGuide: [
      "기초-개념-적용의 순서를 무조건 지키게 안내한다.",
      "모호한 격려 대신 주간 반복 루틴을 숫자로 제시한다.",
      "실수 패턴을 1~2개만 압축해 교정한다.",
    ],
    fallback: {
      evaluation:
        "5~7등급 구간은 기초가 흔들리면 점수가 쉽게 흔들립니다. 개념 이해를 문제 적용까지 연결하는 반복 루틴이 핵심입니다.",
      improvements: [
        "단원별 핵심 개념 1페이지 요약 후 같은 날 문제 10문항 적용",
        "오답을 개념/해석/계산으로 분류해서 같은 유형 2문항 반복",
        "학습시간보다 학습 순서(개념->적용->복기) 고정을 우선",
      ],
      nextPlan:
        "다음 주는 공통 단원 2개를 선정해 개념 40분 + 적용 50분 + 복기 20분 루틴을 주 5회 반복하세요.",
      materials:
        "기초 개념서 + 쉬운 기출 조합을 유지하고, 새로운 N제 추가는 보류하세요.",
    },
  },
  grade_3_4: {
    label: "3~4등급",
    styleGuide: [
      "준킬러 진입에 필요한 선택 기준과 시간 사용법을 함께 제시한다.",
      "반복 가능한 복기 규칙을 문장 1개로 고정시킨다.",
      "다음 주 계획은 과목별이 아니라 유형별로 제시한다.",
    ],
    fallback: {
      evaluation:
        "3~4등급에서는 개념 자체보다 문제에서 개념을 언제 꺼내는지가 점수 차이를 만듭니다. 반복 복기로 준킬러 대응력을 끌어올리는 구간입니다.",
      improvements: [
        "자주 틀리는 유형 2개를 지정하고 풀이 시작 기준 문장을 미리 작성하기",
        "모의/기출 풀이 후 24시간 이내 재풀이로 풀이 선택을 반복 점검하기",
        "시간 초과 문항은 완주보다 중단 기준을 정해 실전 운영력 보강하기",
      ],
      nextPlan:
        "다음 주는 준킬러 유형 2세트를 주 3회 반복하고, 매회 종료 후 30분 복기 로그를 남기세요.",
      materials:
        "중난도 기출 + 준킬러 N제 1권을 병행하고 자료를 분산하지 마세요.",
    },
  },
  grade_2: {
    label: "2등급",
    styleGuide: [
      "1등급 경계에서 필요한 변별 문항 전략을 반드시 포함한다.",
      "실전 운영(회수/포기/검산) 문장을 넣는다.",
      "액션 아이템은 최대 3개로 제한한다.",
    ],
    fallback: {
      evaluation:
        "2등급에서 1등급으로 가려면 변별 문항에서의 선택 정확도가 중요합니다. 킬러 완주보다 실수 제어와 회수 전략이 더 큰 점수 차이를 만듭니다.",
      improvements: [
        "변별 문항 풀이 전 조건 구조를 20초 안에 정리하는 습관 만들기",
        "킬러 문항은 1차 시도 시간 상한을 정해 회수 타이밍 고정하기",
        "실전 세트마다 계산 실수 패턴 1개를 지정해 즉시 교정하기",
      ],
      nextPlan:
        "다음 주는 실전 세트 3회를 운영하고, 각 세트마다 변별 문항 2개만 깊게 복기하세요.",
      materials:
        "실전 모의 + 상위권 N제 조합을 유지하고 신규 교재 추가는 최소화하세요.",
    },
  },
  grade_1: {
    label: "1등급",
    styleGuide: [
      "변별, 킬러, 실수 패턴 키워드를 포함해 상위권 문체로 작성한다.",
      "만점권 도약을 위해 점수 손실 구간을 수치화해서 제시한다.",
      "학습량이 아니라 정확도 관리 규칙 중심으로 쓴다.",
    ],
    fallback: {
      evaluation:
        "1등급 유지/도약 구간에서는 변별 문항 처리와 킬러 선택 정확도가 승부를 가릅니다. 이번 기록은 실전 안정화를 위한 좋은 기반입니다.",
      improvements: [
        "킬러 문항의 첫 접근 시나리오를 2가지로 고정해 의사결정 속도 높이기",
        "변별 문항에서 발생한 계산 실수 패턴을 하루 1회 재현 훈련하기",
        "실전 세트 종료 후 15분 내 회수 실패 문항을 우선 복기하기",
      ],
      nextPlan:
        "다음 주는 상위권 세트 3회 + 킬러 리빌드 2회 루틴을 운영하고, 매회 실수 원인 1개만 집중 교정하세요.",
      materials:
        "상위권 N제와 실전 모의를 유지하되, 같은 자료의 반복 완성도를 높이세요.",
    },
  },
  perfect_100: {
    label: "만점권/100점 근접",
    styleGuide: [
      "만점권 기준으로 미세 실수와 시간 최적화만 다룬다.",
      "새 개념 학습보다 운영 안정화에 집중시키는 문체를 사용한다.",
      "변별, 킬러, 검산 루틴 키워드를 함께 포함한다.",
    ],
    fallback: {
      evaluation:
        "만점권에서는 변별 문항 정답률보다 실수 1개를 없애는 운영 정밀도가 더 중요합니다. 현재 학습 패턴은 100점 근접 전략으로 전환 가능한 상태입니다.",
      improvements: [
        "킬러 문항 1차/2차 접근 시간을 고정해 시험 중 판단 지연 제거하기",
        "검산 루틴을 유형별로 분리해 변별 문항 실수 0건 목표로 반복하기",
        "실전 세트 후 오답보다 맞았지만 불안했던 문항을 우선 복기하기",
      ],
      nextPlan:
        "다음 주는 고난도 세트 2회와 실전 세트 2회를 운영하고, 회차마다 검산 체크리스트를 동일하게 적용하세요.",
      materials:
        "기존 최상위권 자료를 반복하고 신규 자료 실험은 최소화하세요.",
    },
  },
};

function toText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function toGradeNumber(value, fallback = 4) {
  const raw = toText(value).toLowerCase();
  if (!raw) return fallback;
  if (raw === "1" || raw.includes("1등급")) return 1;
  if (raw === "2" || raw === "2-3" || raw.includes("2~3")) return 3;
  if (raw === "3") return 3;
  if (raw === "4+" || raw.includes("4")) return 5;
  if (raw.includes("5") || raw.includes("6") || raw.includes("7")) return 6;
  if (raw.includes("8") || raw.includes("9")) return 8;
  if (raw.includes("노베")) return 8;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function detectReportGradeBand(profile = {}, weekInput = {}) {
  const targetGrade = toText(profile?.targetGrade, "2-3");
  const currentGrade = toText(profile?.currentGrade, "4+");
  const currentNum = toGradeNumber(currentGrade, toGradeNumber(targetGrade, 4));
  const mockScore = Number(toText(weekInput?.mockScore));
  const combinedText = `${toText(weekInput?.completedTopics)} ${toText(weekInput?.difficulties)} ${currentGrade}`.toLowerCase();
  const hasNoBaseSignal = /(노베|베이스\s*없|기초\s*부족|개념\s*공백)/.test(combinedText);

  if (hasNoBaseSignal) return "nobase";

  if (targetGrade === "1") {
    if (Number.isFinite(mockScore) && mockScore >= 96) return "perfect_100";
    if (currentNum >= 5) return "grade_2";
    return "grade_1";
  }

  if (currentNum >= 5) return "grade_5_7";
  if (currentNum >= 3) return "grade_3_4";
  if (currentNum >= 2) return "grade_2";
  if (Number.isFinite(mockScore) && mockScore >= 96) return "perfect_100";
  return "grade_1";
}

function resolveBandFromInput(profileOrTargetGrade, weekInput = {}) {
  if (typeof profileOrTargetGrade === "string") {
    if (profileOrTargetGrade === "1") return "grade_1";
    if (profileOrTargetGrade === "4+") return "grade_5_7";
    return "grade_3_4";
  }
  if (!profileOrTargetGrade || typeof profileOrTargetGrade !== "object") return "grade_3_4";
  return detectReportGradeBand(profileOrTargetGrade, weekInput);
}

function getReportSystemPrompt(profileOrTargetGrade, weekInput = {}) {
  const bandId = resolveBandFromInput(profileOrTargetGrade, weekInput);
  const band = BAND_META[bandId] || BAND_META.grade_3_4;

  return [
    "당신은 수능 수학 주간 코치입니다.",
    "학생의 주간 기록을 근거로 짧고 실행 가능한 피드백을 작성하세요.",
    `현재 작성 밴드: ${band.label} (${bandId})`,
    "",
    "[출력 형식]",
    "1. **이번 주 학습 평가**",
    "2. **핵심 개선 포인트**",
    "3. **다음 주 학습 계획**",
    "4. **추천 학습 자료**",
    "",
    "[작성 규칙]",
    "- 각 섹션은 1~3문장으로 작성하세요.",
    "- 전체는 10문장 이내로 유지하세요.",
    "- 빈 칭찬보다 행동 지침을 우선하세요.",
    "- 학생 수준에 맞는 키워드를 반드시 포함하세요.",
    ...band.styleGuide.map((line) => `- ${line}`),
  ].join("\n");
}

function getReportUserPrompt(profile = {}, weekInput = {}) {
  const bandId = detectReportGradeBand(profile, weekInput);
  const band = BAND_META[bandId] || BAND_META.grade_3_4;
  const targetGradeLabel = TARGET_GRADE_LABEL[toText(profile?.targetGrade)] || "2~3등급";
  const electiveLabel =
    {
      calculus: "미적분",
      probability: "확률과통계",
      geometry: "기하",
    }[toText(profile?.elective)] || toText(profile?.elective, "미선택");

  return [
    "[학생 정보]",
    `- 현재 등급: ${toText(profile?.currentGrade, "미입력")}`,
    `- 목표 등급: ${targetGradeLabel}`,
    `- 선택 과목: ${electiveLabel}`,
    `- 주간 학습시간: ${toText(String(profile?.weeklyHours ?? ""), "미입력")}시간`,
    `- 판정 밴드: ${band.label} (${bandId})`,
    "",
    "[이번 주 학습 내용]",
    toText(weekInput?.completedTopics, "(미입력)"),
    "",
    "[어려웠던 점]",
    toText(weekInput?.difficulties, "(미입력)"),
    "",
    "[모의고사 점수]",
    toText(weekInput?.mockScore, "미입력"),
    "",
    "[밴드별 문체 가이드]",
    ...band.styleGuide.map((line) => `- ${line}`),
  ].join("\n");
}

function getFallbackReport(profile = {}, weekInput = {}) {
  const bandId = detectReportGradeBand(profile, weekInput);
  const band = BAND_META[bandId] || BAND_META.grade_3_4;
  const fallback = band.fallback;
  const topicSummary = toText(weekInput?.completedTopics, "입력된 학습 기록이 제한적입니다.");
  const difficultySummary = toText(weekInput?.difficulties, "어려움 항목이 비어 있습니다.");

  return [
    `[${band.label} 목표 주간 리포트]`,
    "",
    "1. **이번 주 학습 평가**",
    `${fallback.evaluation} 이번 주 기록: ${topicSummary}`,
    "",
    "2. **핵심 개선 포인트**",
    ...fallback.improvements.map((line) => `- ${line}`),
    "",
    "3. **다음 주 학습 계획**",
    `${fallback.nextPlan} 어려웠던 점 반영: ${difficultySummary}`,
    "",
    "4. **추천 학습 자료**",
    fallback.materials,
  ].join("\n");
}

module.exports = {
  getReportSystemPrompt,
  getReportUserPrompt,
  getFallbackReport,
};