const fs = require("fs");
const path = require("path");

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);

const paths = {
  kb: "data/knowledge/knowledge_base.json",
  catalog: "data/knowledge/recommendation_catalog.json",
  success: "data/knowledge/student_success_cases.json",
  signals: "data/knowledge/youtube_question_signals.json",
  registry: "data/knowledge/source_registry.json",
  sources: "data/knowledge/sources.json",
};

function readJson(rel, fallback) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return fallback;
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function writeJson(rel, data) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`updated: ${rel}`);
}

function mergeByKey(existing, incoming, key) {
  const map = new Map();
  for (const item of existing || []) {
    const k = String(item?.[key] || "").trim().toLowerCase();
    if (!k) continue;
    map.set(k, item);
  }
  for (const item of incoming || []) {
    const k = String(item?.[key] || "").trim().toLowerCase();
    if (!k) continue;
    map.set(k, item);
  }
  return [...map.values()];
}

const knowledgeItems = [
  {
    id: "kb-ui-first-loop-2026",
    bucket: "study_methods",
    title: "UI first sprint loop",
    source: "Internal sprint process",
    core: "UI 품질은 최소 5회 반복 피드백 루프를 통해 개선된다. 디자인과 독창성을 기능보다 먼저 점검한다.",
    steps: [
      { title: "콘셉트 2안", detail: "매 스프린트 시작 전에 콘셉트 2안을 제시하고 채택안을 기록한다." },
      { title: "평가 루프", detail: "디자인/독창성/완성도/기능성 점수로 evaluator가 평가한다." },
      { title: "즉시 반영", detail: "평가 피드백을 다음 반복에서 즉시 반영한다." }
    ],
    cautions: ["기능만 먼저 붙이면 UI 완성도가 급격히 떨어진다."],
    keywords: ["UI", "디자인", "독창성", "반복", "피드백"],
    applies_to: ["all"]
  },
  {
    id: "kb-akoreum-comment-trend-2026",
    bucket: "learning_routines",
    title: "Akoreum comment trend",
    source: "YouTube search/comment theme grouping",
    core: "댓글 질문은 순서/오답/시간관리/실모 운영 축으로 반복된다. 주간 계획은 이 질문 축부터 해결해야 한다.",
    steps: [
      { title: "질문 분류", detail: "질문을 순서/오답/시간관리/실모로 분류한다." },
      { title: "루틴 연결", detail: "각 질문에 실행 루틴 1개를 연결한다." },
      { title: "주간 반영", detail: "반복 질문은 다음 주 계획 우선순위로 올린다." }
    ],
    cautions: ["질문 과다 상태는 자료 부족보다 루틴 부재일 때가 많다."],
    keywords: ["유튜브", "댓글", "질문", "오답", "실모"],
    applies_to: ["9-7", "7-5", "5-3", "3-1"]
  },
  {
    id: "kb-elite-seasonal-plan-2026",
    bucket: "lecture_books",
    title: "Elite seasonal class plan",
    source: "Official academy pages + community reviews",
    core: "상위권은 시기별 수강 전략이 중요하다. 3~6모 약점교정, 6~9모 킬러+실모, 9모 이후 파이널 압축으로 분리한다.",
    steps: [
      { title: "3~6모", detail: "정규 단과 + 약점단원 보강 중심" },
      { title: "6~9모", detail: "킬러 N제 + 주간 실모 + 오답 회의" },
      { title: "9모~수능", detail: "파이널 실모 + 압축 오답노트" }
    ],
    cautions: ["수강 수만 늘리고 복기 시간이 줄면 실전 변동폭이 커진다."],
    keywords: ["시대인재", "두각", "단과", "시기별", "파이널"],
    applies_to: ["5-3", "3-1"]
  }
];

const instructors = [
  {
    name: "현우진",
    platform: "Megastudy",
    fitKeys: ["5-3", "3-1"],
    subjectTags: ["공통", "미적분", "기하"],
    strengths: ["중상위권에서 상위권으로 가는 실전 전환 밀도가 높다.", "개념-기출-N제-파이널 흐름이 명확하다."],
    styleTags: ["fast", "structure", "practical"],
    curriculumPath: [
      { stage: "base", course: "시발점", material: "개념서" },
      { stage: "concept", course: "뉴런", material: "실전개념" },
      { stage: "past", course: "수분감", material: "기출" },
      { stage: "N-set", course: "드릴", material: "N제" },
      { stage: "final", course: "킬링캠프", material: "실모" }
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "concept+past", content: "뉴런+수분감", goal: "준킬러 안정화" },
      { period: "6~9모", classType: "N-set+mock", content: "드릴+주간 실모", goal: "시간관리 고정" },
      { period: "9모~수능", classType: "final", content: "파이널 실모", goal: "변동폭 최소화" }
    ],
    reviewSummary: ["복기 루틴을 지키는 학생에게 효과가 높다는 후기 다수"],
    bestFor: "준킬러 이상 실전 전환이 필요한 학생",
    usage: "개념-기출 병행 후 N제와 파이널로 이동",
    sourceLevel: "official+community",
    confidence: 0.93,
    sourceRefs: ["official-megastudy-woojin-ot", "orbi-neuron-sugam-order-2026"]
  },
  {
    name: "정승제",
    platform: "Etoos/EBS",
    fitKeys: ["9-7", "7-5"],
    subjectTags: ["공통", "확률과통계"],
    strengths: ["개념 공백이 큰 학생의 출발점으로 안정적이다.", "반복 복습 루틴을 붙이기 쉽다."],
    styleTags: ["clear", "foundation"],
    curriculumPath: [
      { stage: "concept", course: "개념 강의", material: "개념서" },
      { stage: "type", course: "유형 강의", material: "유형서" },
      { stage: "past", course: "기출 강의", material: "기출서" }
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "concept", content: "개념 공백 메우기", goal: "기초 정확도 확보" },
      { period: "6~9모", classType: "type+past", content: "유형+기출", goal: "중난도 진입" },
      { period: "9모~수능", classType: "review", content: "오답 압축", goal: "실수 감소" }
    ],
    reviewSummary: ["개념 직후 기출 적용을 붙였을 때 체감이 좋다는 피드백"],
    bestFor: "개념 공백이 큰 학생",
    usage: "개념 수강 직후 쉬운 기출 병행",
    sourceLevel: "official+community",
    confidence: 0.88,
    sourceRefs: ["official-etoos-jeongseungje-ot", "orbi-math-band-column"]
  },
  {
    name: "김기현",
    platform: "Megastudy",
    fitKeys: ["7-5", "5-3", "3-1"],
    subjectTags: ["공통", "미적분"],
    strengths: ["풀이 논리 점검에 유리한 밀도 높은 설명", "기출 해석과 실전 연결이 안정적"],
    styleTags: ["logic", "dense"],
    curriculumPath: [
      { stage: "concept", course: "개념 강의", material: "개념서" },
      { stage: "past", course: "기출 강의", material: "기출서" },
      { stage: "N-set", course: "N제", material: "N제" }
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "concept+past", content: "개념+기출 골격", goal: "공통 안정화" },
      { period: "6~9모", classType: "N-set", content: "중고난도 N제", goal: "준킬러 대응" },
      { period: "9모~수능", classType: "final", content: "실모+오답정리", goal: "점수 유지" }
    ],
    reviewSummary: ["풀이 재현 노트와 함께 쓰면 효과가 좋다는 후기"],
    bestFor: "풀이 논리를 강화하려는 중상위권",
    usage: "기출 재현 노트와 결합",
    sourceLevel: "community",
    confidence: 0.76,
    sourceRefs: ["orbi-math-attitude-column", "orbi-past-rotation-thread-2026"]
  },
  {
    name: "양승진",
    platform: "Daesung",
    fitKeys: ["7-5", "5-3", "3-1"],
    subjectTags: ["공통", "미적분", "기하"],
    strengths: ["기출 구조화와 시간관리 고정에 유리", "실모 운영 피드백이 실전적"],
    styleTags: ["time-control", "practical"],
    curriculumPath: [
      { stage: "past", course: "기출 구조화", material: "기출서" },
      { stage: "N-set", course: "N제", material: "N제" },
      { stage: "final", course: "실모", material: "모의고사" }
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "past baseline", content: "기출 구조화", goal: "풀이 골격 정착" },
      { period: "6~9모", classType: "N-set+mock", content: "N제+실모", goal: "시간관리 고정" },
      { period: "9모~수능", classType: "final", content: "파이널 실모", goal: "변동폭 축소" }
    ],
    reviewSummary: ["회수 규칙을 같이 쓰면 안정적이라는 커뮤니티 반응"],
    bestFor: "실모 시간배분이 약한 중상위권",
    usage: "세트훈련 후 오답 분류표 작성",
    sourceLevel: "community",
    confidence: 0.73,
    sourceRefs: ["orbi-time-management-thread-2026", "orbi-simul-tips-thread-2026"]
  },
  {
    name: "시대인재 수학 단과(상위권 트랙)",
    platform: "Sidaeinjae Daechi",
    fitKeys: ["5-3", "3-1"],
    subjectTags: ["공통", "확률과통계", "미적분", "기하"],
    strengths: ["상위권 대상 과제 밀도와 실전 자료가 높다.", "시기별 트랙 분리가 뚜렷하다."],
    styleTags: ["academy", "top-tier", "seasonal"],
    curriculumPath: [
      { stage: "3~6모", course: "정규+클리닉", material: "정규교재/보강자료" },
      { stage: "6~9모", course: "킬러N제+주간실모", material: "N제/실모" },
      { stage: "9모~수능", course: "파이널+압축복기", material: "파이널 세트" }
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "regular+clinic", content: "정규 단과 + 약점 클리닉", goal: "약점 단원 완결" },
      { period: "6~9모", classType: "killer+mock", content: "킬러 N제 + 주간 실모", goal: "고난도 의사결정 고정" },
      { period: "9모~수능", classType: "final", content: "파이널 실모 + 압축 오답노트", goal: "실전 변동폭 최소화" }
    ],
    reviewSummary: ["복기 시간을 확보할수록 효과가 크다는 후기 반복"],
    bestFor: "상위권 실전 안정화를 목표로 하는 학생",
    usage: "시기별 콘텐츠 분리 수강",
    sourceLevel: "official+community",
    confidence: 0.87,
    sourceRefs: ["sdij-daechi-timetable", "orbi-sdij-review-2026", "orbi-sdij-track-thread-2026"]
  },
  {
    name: "대치 두각 수학 단과(실전 트랙)",
    platform: "Dugak",
    fitKeys: ["5-3", "3-1"],
    subjectTags: ["공통", "미적분", "기하"],
    strengths: ["과제-점검-복기 루프가 선명하다.", "실전 운영 피드백이 촘촘하다."],
    styleTags: ["academy", "managed", "practical"],
    curriculumPath: [
      { stage: "3~6모", course: "정규+약점보강", material: "정규교재/보강" },
      { stage: "6~9모", course: "심화모듈+실전세트", material: "심화/N제" },
      { stage: "9모~수능", course: "파이널", material: "파이널 실모" }
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "regular", content: "정규 + 약점 보강", goal: "약점 유형 교정" },
      { period: "6~9모", classType: "hard+practical", content: "고난도 모듈 + 실전 세트", goal: "준킬러/킬러 대응" },
      { period: "9모~수능", classType: "final", content: "파이널 실모 + 오답 압축", goal: "실전 안정화" }
    ],
    reviewSummary: ["과제 수행률과 복기율이 성과를 가른다는 피드백 다수"],
    bestFor: "관리형 실전 루틴이 필요한 상위권",
    usage: "과제량 상한과 복기 하한을 함께 관리",
    sourceLevel: "official+community",
    confidence: 0.85,
    sourceRefs: ["dugak-requestclass-2026", "dugak-teacher-board", "dugak-presentation-board-2026"]
  },
  {
    name: "두각 수학 단과(중상위 관리 트랙)",
    platform: "Dugak",
    fitKeys: ["7-5", "5-3"],
    subjectTags: ["공통", "미적분", "기하"],
    strengths: ["중상위권 과제 수행률 관리에 강점", "주차 단위 복기 루틴 정착에 유리"],
    styleTags: ["academy", "weekly"],
    curriculumPath: [
      { stage: "3~6모", course: "정규반", material: "정규교재" },
      { stage: "6~9모", course: "심화반", material: "심화자료" },
      { stage: "9모~수능", course: "파이널반", material: "파이널 실모" }
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "regular", content: "정규반 + 약점체크", goal: "기초 안정화" },
      { period: "6~9모", classType: "advanced", content: "심화반 + 실전세트", goal: "중난도 대응 강화" },
      { period: "9모~수능", classType: "final", content: "파이널반 + 압축복기", goal: "점수 유지력 강화" }
    ],
    reviewSummary: ["완료율 수치화를 병행할 때 성과가 좋아진다는 후기"],
    bestFor: "관리형 루틴이 필요한 중상위권",
    usage: "주간 완료율 점검과 함께 사용",
    sourceLevel: "official+community",
    confidence: 0.8,
    sourceRefs: ["dugak-requestclass-2026", "dugak-teacher-board"]
  }
];

const books = [
  { title: "개념원리 수학I/II", type: "concept", fitKeys: ["9-7", "7-5"], purpose: "개념 구조화", when: "3~6모", difficulty: "medium", subjectTags: ["공통"], sourceRefs: ["orbi-math-band-column"] },
  { title: "RPM 수학I/II", type: "type", fitKeys: ["9-7", "7-5"], purpose: "개념 직후 적용", when: "개념 직후", difficulty: "medium", subjectTags: ["공통"], sourceRefs: ["orbi-math-band-column"] },
  { title: "쎈 수학I/II", type: "type", fitKeys: ["9-7", "7-5", "5-3"], purpose: "유형 반복", when: "3~6모", difficulty: "medium", subjectTags: ["공통"], sourceRefs: ["sumanhwi-math-review-search-2026"] },
  { title: "일품 수학I/II", type: "type", fitKeys: ["7-5", "5-3"], purpose: "중난도 확장", when: "5~9모", difficulty: "medium-high", subjectTags: ["공통"], sourceRefs: ["orbi-past-rotation-thread-2026"] },
  { title: "자이스토리 수학I/II", type: "past", fitKeys: ["7-5", "5-3", "3-1"], purpose: "기출 유형 압축", when: "5~9모", difficulty: "medium-high", subjectTags: ["공통"], sourceRefs: ["orbi-success-9to1"] },
  { title: "마더텅 수능기출 수학", type: "past", fitKeys: ["7-5", "5-3", "3-1"], purpose: "연도 회전 기출", when: "연중", difficulty: "medium-high", subjectTags: ["공통"], sourceRefs: ["orbi-past-rotation-thread-2026"] },
  { title: "수능특강 수학", type: "EBS", fitKeys: ["9-7", "7-5", "5-3", "3-1"], purpose: "연계 기본 라인 확보", when: "연중", difficulty: "medium", subjectTags: ["공통", "확률과통계", "미적분", "기하"], sourceRefs: ["book-ebs-special-2026"] },
  { title: "수능완성 수학", type: "EBS", fitKeys: ["7-5", "5-3", "3-1"], purpose: "연계 최종 정리", when: "6모 이후", difficulty: "medium-high", subjectTags: ["공통", "확률과통계", "미적분", "기하"], sourceRefs: ["book-ebs-complete-2026"] },
  { title: "뉴런", type: "practical-concept", fitKeys: ["5-3", "3-1"], purpose: "실전개념 강화", when: "4~7모", difficulty: "high", subjectTags: ["공통", "미적분"], sourceRefs: ["official-megastudy-woojin-ot"] },
  { title: "수분감", type: "past", fitKeys: ["5-3", "3-1"], purpose: "고난도 기출 구조화", when: "5~8모", difficulty: "high", subjectTags: ["공통", "미적분"], sourceRefs: ["official-megastudy-woojin-ot", "orbi-neuron-sugam-order-2026"] },
  { title: "드릴", type: "N-set", fitKeys: ["5-3", "3-1"], purpose: "준킬러/킬러 대응력", when: "6~9모", difficulty: "high", subjectTags: ["공통", "미적분", "기하"], sourceRefs: ["official-megastudy-woojin-ot"] },
  { title: "킬링캠프", type: "mock", fitKeys: ["3-1"], purpose: "파이널 실전 운영", when: "9모~수능", difficulty: "high", subjectTags: ["공통", "미적분", "기하"], sourceRefs: ["official-megastudy-woojin-ot"] },
  { title: "시대인재 수학 정규 교재", type: "academy", fitKeys: ["5-3", "3-1"], purpose: "상위권 정규 실전 루프", when: "3~6모", difficulty: "high", subjectTags: ["공통", "확률과통계", "미적분", "기하"], sourceRefs: ["sdij-daechi-timetable"] },
  { title: "시대인재 수학 킬러 N제", type: "academy", fitKeys: ["5-3", "3-1"], purpose: "고난도 의사결정 강화", when: "6~9모", difficulty: "high", subjectTags: ["공통", "미적분", "기하"], sourceRefs: ["sdij-daechi-timetable", "orbi-sdij-track-thread-2026"] },
  { title: "시대인재 파이널 실모", type: "academy-mock", fitKeys: ["3-1"], purpose: "파이널 변동폭 축소", when: "9모~수능", difficulty: "high", subjectTags: ["공통", "확률과통계", "미적분", "기하"], sourceRefs: ["sdij-daechi-timetable"] },
  { title: "두각 수학 정규 교재", type: "academy", fitKeys: ["5-3", "3-1"], purpose: "관리형 정규 학습", when: "3~6모", difficulty: "high", subjectTags: ["공통", "미적분", "기하"], sourceRefs: ["dugak-requestclass-2026"] },
  { title: "두각 수학 심화 모듈", type: "academy", fitKeys: ["5-3", "3-1"], purpose: "고난도 유형 확장", when: "6~9모", difficulty: "high", subjectTags: ["공통", "미적분", "기하"], sourceRefs: ["dugak-requestclass-2026"] },
  { title: "두각 파이널 실모", type: "academy-mock", fitKeys: ["3-1"], purpose: "실전 운영 고정", when: "9모~수능", difficulty: "high", subjectTags: ["공통", "미적분", "기하"], sourceRefs: ["dugak-presentation-board-2026"] },
  { title: "확통 기출+N제 패키지", type: "elective", fitKeys: ["7-5", "5-3", "3-1"], purpose: "확통 빈출 구조 정복", when: "5~수능", difficulty: "medium-high", subjectTags: ["확률과통계"], sourceRefs: ["orbi-math-band-column"] },
  { title: "미적분 기출+N제 패키지", type: "elective", fitKeys: ["7-5", "5-3", "3-1"], purpose: "미적분 준킬러/킬러 대응", when: "5~수능", difficulty: "high", subjectTags: ["미적분"], sourceRefs: ["orbi-neuron-sugam-order-2026"] },
  { title: "기하 기출+N제 패키지", type: "elective", fitKeys: ["7-5", "5-3", "3-1"], purpose: "기하 고난도 적응", when: "5~수능", difficulty: "high", subjectTags: ["기하"], sourceRefs: ["orbi-math-band-column"] },
  { title: "오답 압축 노트 템플릿", type: "review", fitKeys: ["9-7", "7-5", "5-3", "3-1"], purpose: "오답 복기 체계화", when: "연중", difficulty: "low", subjectTags: ["공통", "확률과통계", "미적분", "기하"], sourceRefs: ["orbi-ahha-errnote-docs"] }
];

const successCases = [
  { id: "success-9to1-orbi-2020", bandShift: "9->1", duration: "약 1년", summary: "개념 출력-기출 적용-오답 복기 루틴을 고정해 1등급까지 도달한 사례.", coreActions: ["개념 출력 20분", "기출 적용 당일 1회", "오답 복기 24시간 내"], fitKeys: ["9-7", "7-5", "5-3"], sourceRefs: ["orbi-success-9to1"], reliability: 0.76 },
  { id: "success-8to2-thread-2023", bandShift: "8->2", duration: "10~12개월", summary: "기출 회독 순서와 오답 복기 루틴으로 2등급대 진입 사례.", coreActions: ["기출 회독 3회전", "오답 복기 주 3회", "주간 실모 2회"], fitKeys: ["9-7", "7-5"], sourceRefs: ["orbi-past-rotation-thread-2026", "orbi-nobase-oneyear-thread"], reliability: 0.7 },
  { id: "success-7to3-community-01", bandShift: "7->3", duration: "6~8개월", summary: "개념 과몰입을 줄이고 쉬운 기출부터 전환해 3등급권으로 상승한 사례.", coreActions: ["개념 4주 제한", "쉬운 기출 적용", "오답 유형 분류"], fitKeys: ["7-5", "5-3"], sourceRefs: ["orbi-math-band-column"], reliability: 0.66 },
  { id: "success-6to2-community-01", bandShift: "6->2", duration: "7~9개월", summary: "시간관리 규칙을 고정해 실모 점수 변동폭을 줄인 사례.", coreActions: ["문항 회수 규칙", "실모 주 3회", "오답 원인 4분류"], fitKeys: ["7-5", "5-3", "3-1"], sourceRefs: ["orbi-time-management-thread-2026"], reliability: 0.71 },
  { id: "success-5to2-orbi-01", bandShift: "5->2", duration: "5~7개월", summary: "조건 해석 우선 루틴으로 준킬러 처리력을 끌어올린 사례.", coreActions: ["조건 해석 먼저", "준킬러 오답 3회전", "주간 체크리스트"], fitKeys: ["5-3", "3-1"], sourceRefs: ["orbi-5to2-review-2026"], reliability: 0.72 },
  { id: "success-4to1-practical-01", bandShift: "4->1", duration: "약 9개월", summary: "N제/실모를 시기별로 분리해 사용하고 9모 이후 확장을 멈춰 1등급을 확보한 사례.", coreActions: ["3~6모 약점단원 집중", "6~9모 N제+실모", "9모 이후 압축복기"], fitKeys: ["5-3", "3-1"], sourceRefs: ["orbi-simul-tips-thread-2026"], reliability: 0.74 },
  { id: "success-elite-stable-sdij-01", bandShift: "상위권 안정화", duration: "3월~수능", summary: "시대인재 단과를 시기별로 분할 수강해 실전 변동폭을 줄인 사례.", coreActions: ["3~6모 정규+클리닉", "6~9모 킬러N제+실모", "9모~수능 파이널+압축복기"], fitKeys: ["5-3", "3-1"], sourceRefs: ["sdij-daechi-timetable", "orbi-sdij-review-2026"], reliability: 0.8 },
  { id: "success-elite-stable-dugak-01", bandShift: "상위권 안정화", duration: "3월~수능", summary: "두각 단과에서 과제-점검-복기 루프를 유지하며 실모 점수를 안정화한 사례.", coreActions: ["정규 과제 수행률", "주간 오답 복기", "파이널 회수 규칙"], fitKeys: ["5-3", "3-1"], sourceRefs: ["dugak-requestclass-2026", "dugak-teacher-board"], reliability: 0.78 },
  { id: "success-7to4-comment-trend-01", bandShift: "7->4", duration: "4~6개월", summary: "유튜브 질문 패턴 기반 루틴을 적용해 4등급권 진입 사례.", coreActions: ["질문 로그 작성", "오답 복기 고정", "실모 시간관리 점검"], fitKeys: ["7-5", "5-3"], sourceRefs: ["youtube-comment-akoreum-manual"], reliability: 0.63 },
  { id: "success-6to3-community-02", bandShift: "6->3", duration: "6개월", summary: "기출 회독 계획과 오답 노트 템플릿으로 중난도 정확도를 개선한 사례.", coreActions: ["기출 회독 계획표", "오답 노트 템플릿", "주간 실모 2회"], fitKeys: ["7-5", "5-3"], sourceRefs: ["orbi-ahha-errnote-docs"], reliability: 0.68 }
];

const questionSignals = [
  { id: "q-sequence-neuron-sugam", channel: "community+youtube", focus: "커리 순서", learnerQuestion: "뉴런과 수분감 순서를 어떻게 잡아야 하나요?", coachingHint: "개념 안정화 이후 병행하고 기출 적용 루틴을 먼저 고정한다.", fitKeys: ["7-5", "5-3", "3-1"], sourceRefs: ["orbi-neuron-sugam-order-2026"], reliability: 0.83 },
  { id: "q-akoreum-time-control-01", channel: "youtube-comment", focus: "시간관리", learnerQuestion: "실모에서 시간 배분이 무너질 때 기준이 있나요?", coachingHint: "막힘 2분 회수 규칙과 마지막 10분 검산 구간을 고정한다.", channelHint: "악어오름 댓글 질문 클러스터", fitKeys: ["7-5", "5-3", "3-1"], sourceRefs: ["youtube-comment-akoreum-manual"], reliability: 0.78 },
  { id: "q-akoreum-review-load-01", channel: "youtube-comment", focus: "오답 복기", learnerQuestion: "오답 복기 시간이 너무 길어 진도가 밀립니다.", coachingHint: "오답을 개념/해석/계산/시간으로 분류하고 분류별 제한 시간을 둔다.", channelHint: "악어오름 댓글 질문 클러스터", fitKeys: ["9-7", "7-5", "5-3"], sourceRefs: ["youtube-comment-akoreum-manual", "orbi-ahha-errnote-docs"], reliability: 0.77 },
  { id: "q-akoreum-resource-overload-01", channel: "youtube-comment", focus: "자료 과부하", learnerQuestion: "자료를 많이 보는데 점수가 안 오릅니다.", coachingHint: "자료 추가를 멈추고 루틴 완료율 80%를 먼저 만든다.", channelHint: "악어오름 댓글 질문 클러스터", fitKeys: ["9-7", "7-5", "5-3"], sourceRefs: ["youtube-comment-akoreum-manual"], reliability: 0.75 },
  { id: "q-nobase-feasibility-01", channel: "community", focus: "노베이스 가능성", learnerQuestion: "노베이스에서 1년 안에 1등급이 가능한가요?", coachingHint: "가능성 논쟁보다 루틴 완수율과 오답 재발률을 지표로 관리한다.", fitKeys: ["9-7", "7-5"], sourceRefs: ["orbi-nobase-oneyear-thread"], reliability: 0.8 },
  { id: "q-past-rotation-01", channel: "community", focus: "기출 회독", learnerQuestion: "기출은 몇 회독이 적절한가요?", coachingHint: "1회독 구조 파악, 2회독 오답 축소, 3회독 시간 단축으로 분리한다.", fitKeys: ["9-7", "7-5", "5-3"], sourceRefs: ["orbi-past-rotation-thread-2026"], reliability: 0.79 },
  { id: "q-errnote-template-01", channel: "community", focus: "오답 노트", learnerQuestion: "오답노트를 어떻게 써야 점수에 반영되나요?", coachingHint: "실수 원인과 재발 방지 규칙만 짧게 기록한다.", fitKeys: ["9-7", "7-5", "5-3", "3-1"], sourceRefs: ["orbi-ahha-errnote-docs"], reliability: 0.82 },
  { id: "q-sdij-season-01", channel: "community+official", focus: "시대인재 시기별 수강", learnerQuestion: "시대인재 단과는 시기별로 어떻게 듣는 게 효율적일까요?", coachingHint: "3~6모 정규+클리닉, 6~9모 킬러N제+실모, 9모 이후 파이널+압축복기.", fitKeys: ["5-3", "3-1"], sourceRefs: ["sdij-daechi-timetable", "orbi-sdij-track-thread-2026"], reliability: 0.84 },
  { id: "q-dugak-season-01", channel: "community+official", focus: "두각 시기별 수강", learnerQuestion: "두각 단과는 언제 어떤 반을 듣는 게 맞나요?", coachingHint: "3~6모 정규, 6~9모 심화+실전세트, 9모 이후 파이널반으로 분리한다.", fitKeys: ["5-3", "3-1"], sourceRefs: ["dugak-requestclass-2026", "dugak-teacher-board"], reliability: 0.82 },
  { id: "q-simul-frequency-01", channel: "community", focus: "실모 빈도", learnerQuestion: "실모는 주 몇 회가 적절한가요?", coachingHint: "중위권 주 1~2회, 상위권 주 3회 이상에서 시작하고 복기 시간으로 조정한다.", fitKeys: ["7-5", "5-3", "3-1"], sourceRefs: ["orbi-simul-tips-thread-2026"], reliability: 0.78 },
  { id: "q-final-expansion-stop-01", channel: "community", focus: "파이널 확장 제한", learnerQuestion: "9모 이후 새 교재를 계속 추가해도 될까요?", coachingHint: "9모 이후는 신규 확장보다 압축 복기와 실전 안정화가 우선이다.", fitKeys: ["5-3", "3-1"], sourceRefs: ["orbi-math-attitude-column"], reliability: 0.81 },
  { id: "q-review-vs-volume-01", channel: "community+youtube", focus: "양 vs 복기", learnerQuestion: "문제 수를 늘리는 것과 복기 시간을 늘리는 것 중 무엇이 우선인가요?", coachingHint: "복기 루틴 없는 문제량 증가는 재발률을 높인다. 복기를 먼저 고정한다.", fitKeys: ["9-7", "7-5", "5-3", "3-1"], sourceRefs: ["orbi-ahha-errnote-docs", "youtube-comment-akoreum-manual"], reliability: 0.8 }
];

const sourceRegistry = [
  { id: "sdij-daechi-timetable", type: "official", provider: "Sidaeinjae", url: "https://www.sdij.com/aca/schd/schd_view.asp?pc_view=Y", capturedAt: today, keyPoints: ["대치 시간표", "수학 트랙"] },
  { id: "dugak-requestclass-2026", type: "official", provider: "Dugak", url: "https://bundangdugak.dshw.co.kr/onlineapplication/requestclass_view.htm?currentPage=1&id=435&subject=0", capturedAt: today, keyPoints: ["단과 신청", "과정 구분"] },
  { id: "dugak-teacher-board", type: "official", provider: "Dugak", url: "https://bundangdugak.dshw.co.kr/teacher/teacher.htm?subject=2", capturedAt: today, keyPoints: ["수학 강사진 보드"] },
  { id: "dugak-presentation-board-2026", type: "official", provider: "Dugak", url: "https://bundangdugak.dshw.co.kr/exam/presentation.htm?currentPage=2&mode=", capturedAt: today, keyPoints: ["공지/운영 보드"] },
  { id: "official-megastudy-woojin-ot", type: "official", provider: "Megastudy", url: "https://www.megastudy.net/teacher_v2/chr/lecture_detailview.asp?CHR_CD=56645&MAKE_FLG=2&tec_cd=woojinmath", capturedAt: today, keyPoints: ["OT/커리"] },
  { id: "official-etoos-jeongseungje-ot", type: "official", provider: "Etoos", url: "https://www11.etoos.com/teacher/sub02.asp?CHOICE_LEVEL_ID=100001&GRD_CD=go3&LECTURE_GB_CD=0001&TAB_CD=0002&TEACHER_ID=200180&TEACHER_MAIN_TYPE=TYPE25", capturedAt: today, keyPoints: ["커리 안내"] },
  { id: "official-mimac-math", type: "official", provider: "Mimac", url: "https://www.mimacstudy.com/", capturedAt: today, keyPoints: ["수학 강사 메인"] },
  { id: "book-ebs-special-2026", type: "official", provider: "EBSi", url: "https://cloud-www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005073", capturedAt: today, keyPoints: ["수능특강"] },
  { id: "book-ebs-complete-2026", type: "official", provider: "EBSi", url: "https://www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005094", capturedAt: today, keyPoints: ["수능완성"] },
  { id: "orbi-success-9to1", type: "community", provider: "Orbi", url: "https://orbi.kr/00033742614/9%EB%93%B1%EA%B8%89-%3E-%EA%B0%80%ED%98%95-1%EB%93%B1%EA%B8%89-%EC%88%98%ED%95%99-%EA%B3%B5%EB%B6%80%EB%B2%95", capturedAt: today, keyPoints: ["9->1 사례"] },
  { id: "orbi-nobase-oneyear-thread", type: "community", provider: "Orbi", url: "https://orbi.kr/00062991478/%EB%85%B8%EB%B2%A0-%EC%88%98%ED%95%99-1%EB%85%84%EB%A7%8C%EC%97%90-1%EB%93%B1%EA%B8%89-%EA%B0%80%EB%8A%A5-%EB%B6%88%EA%B0%80%EB%8A%A5", capturedAt: today, keyPoints: ["노베이스 논의"] },
  { id: "orbi-neuron-sugam-order-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/00076785107", capturedAt: today, keyPoints: ["뉴런 수분감 순서"] },
  { id: "orbi-sdij-review-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/search?q=%EC%8B%9C%EB%8C%80%EC%9D%B8%EC%9E%AC+%EC%88%98%ED%95%99+%EB%8B%A8%EA%B3%BC+%ED%9B%84%EA%B8%B0", capturedAt: today, keyPoints: ["시대인재 후기 검색"] },
  { id: "orbi-sdij-track-thread-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/00076883299", capturedAt: today, keyPoints: ["시대인재 트랙 질문"] },
  { id: "orbi-math-band-column", type: "community", provider: "Orbi", url: "https://orbi.kr/00073261962", capturedAt: today, keyPoints: ["등급대별 학습"] },
  { id: "orbi-math-attitude-column", type: "community", provider: "Orbi", url: "https://orbi.kr/00077975282/%5B%EC%B9%BC%EB%9F%BC%5D-%EC%88%98%ED%95%99-%EB%AC%B8%EC%A0%9C%EB%A5%BC-%EB%8C%80%ED%95%98%EB%8A%94-%ED%83%9C%EB%8F%84", capturedAt: today, keyPoints: ["수학 태도 칼럼"] },
  { id: "orbi-ahha-errnote-docs", type: "community", provider: "Orbi", url: "https://docs.orbi.kr/docs/13861-%EC%88%98%2B1%2B%EC%95%84%ED%95%98%2B%EC%98%A4%EB%8B%B5%EB%85%B8%ED%8A%B8/", capturedAt: today, keyPoints: ["오답노트 예시"] },
  { id: "orbi-past-rotation-thread-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/00075396689", capturedAt: today, keyPoints: ["기출 회독 질문"] },
  { id: "orbi-simul-tips-thread-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/00061701275", capturedAt: today, keyPoints: ["실모 운영 팁"] },
  { id: "orbi-time-management-thread-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/00077230632", capturedAt: today, keyPoints: ["시간관리 질문"] },
  { id: "orbi-5to2-review-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/00066335052", capturedAt: today, keyPoints: ["5->2 후기"] },
  { id: "youtube-comment-akoreum-manual", type: "youtube_comment", provider: "YouTube", url: "https://www.youtube.com/results?search_query=%EC%95%85%EC%96%B4%EC%98%A4%EB%A6%84+%EC%88%98%ED%95%99", capturedAt: today, keyPoints: ["악어오름 댓글 질문군"] },
  { id: "youtube-comment-math-general-search-2026", type: "youtube_comment", provider: "YouTube", url: "https://www.youtube.com/results?search_query=%EC%88%98%EB%8A%A5+%EC%88%98%ED%95%99+%EA%B3%B5%EB%B6%80%EB%B2%95+%EB%8C%93%EA%B8%80", capturedAt: today, keyPoints: ["수능수학 댓글 질문군"] },
  { id: "sumanhwi-math-review-search-2026", type: "community-index", provider: "Naver Search", url: "https://search.naver.com/search.naver?query=%EC%88%98%EB%A7%8C%ED%9C%98+%EC%88%98%ED%95%99+%ED%9B%84%EA%B8%B0", capturedAt: today, keyPoints: ["수만휘 검색 인덱스"] },
  { id: "fomanhan-math-review-search-2026", type: "community-index", provider: "Naver Search", url: "https://search.naver.com/search.naver?query=%ED%8F%AC%EB%A7%8C%ED%95%9C+%EC%88%98%ED%95%99+%ED%9B%84%EA%B8%B0", capturedAt: today, keyPoints: ["포만한 검색 인덱스"] },
  { id: "map-image-curriculum", type: "curated", provider: "local-map", url: "data/knowledge/instructor_curriculum_map.json", capturedAt: today, keyPoints: ["내부 커리큘럼 매핑"] }
];

function applyUpgrade() {
  const kb = readJson(paths.kb, { updatedAt: today, items: [] });
  writeJson(paths.kb, {
    ...kb,
    updatedAt: today,
    items: mergeByKey(kb.items || [], knowledgeItems, "id"),
  });

  const catalog = readJson(paths.catalog, { instructors: [], books: [] });
  writeJson(paths.catalog, {
    updatedAt: today,
    notes: "UI-first priority update with expanded evidence datasets.",
    instructors: mergeByKey(catalog.instructors || [], instructors, "name"),
    books: mergeByKey(catalog.books || [], books, "title"),
  });

  const success = readJson(paths.success, { cases: [] });
  writeJson(paths.success, {
    updatedAt: today,
    notes: "Expanded student success data (de-identified community evidence).",
    cases: mergeByKey(success.cases || [], successCases, "id"),
  });

  const signalData = readJson(paths.signals, { signals: [] });
  writeJson(paths.signals, {
    updatedAt: today,
    notes: "Expanded question signals from community + YouTube comment themes.",
    signals: mergeByKey(signalData.signals || [], questionSignals, "id"),
  });

  const registry = readJson(paths.registry, { sources: [] });
  const mergedSources = mergeByKey(registry.sources || [], sourceRegistry, "id");
  writeJson(paths.registry, {
    updatedAt: today,
    policy: {
      priority: ["official", "official+community", "community", "youtube_comment", "community-index"],
      notes: "UI-first development, evidence-first recommendation updates."
    },
    sources: mergedSources,
  });

  const sourceEntries = mergedSources.map((src) => ({
    id: src.id,
    type: src.type,
    platform: src.provider,
    bucket: src.type === "official" ? "lecture_books" : src.type.startsWith("youtube") ? "learning_routines" : "study_methods",
    tags: [src.type, "priority-ui-data", today],
    title: (src.keyPoints && src.keyPoints[0]) || src.id,
    webUrl: src.url,
    includeImages: src.type === "official",
  }));
  writeJson(paths.sources, sourceEntries);

  const c = readJson(paths.catalog, { instructors: [], books: [] });
  const s = readJson(paths.success, { cases: [] });
  const q = readJson(paths.signals, { signals: [] });
  const r = readJson(paths.registry, { sources: [] });
  console.log("");
  console.log("[upgrade-priority-data] counts");
  console.log(`- instructors: ${c.instructors.length}`);
  console.log(`- books: ${c.books.length}`);
  console.log(`- success cases: ${s.cases.length}`);
  console.log(`- question signals: ${q.signals.length}`);
  console.log(`- source registry: ${r.sources.length}`);
}

applyUpgrade();
