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

function mergeById(existing, incoming) {
  const map = new Map();
  for (const item of existing || []) {
    const id = String(item?.id || "").trim();
    if (!id) continue;
    map.set(id, item);
  }
  for (const item of incoming || []) {
    const id = String(item?.id || "").trim();
    if (!id) continue;
    map.set(id, item);
  }
  return [...map.values()];
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

const newSources = [
  {
    id: "sdij-hall-of-fame-review-616",
    type: "official+community",
    platform: "Sidaeinjae",
    bucket: "study_methods",
    tags: ["official", "success-case", "2026-03-30-phase2"],
    title: "시대인재 명예의 전당 수학 실수관리 후기",
    webUrl: "https://m.sdij.com/sdn/hall_of_fame/review.asp?group_cd=46&std_cd=616",
    includeImages: false,
  },
  {
    id: "kangnams2-teacher-curriculum",
    type: "official",
    platform: "Gangnam Daesung SII",
    bucket: "lecture_books",
    tags: ["official", "curriculum", "2026-03-30-phase2"],
    title: "강남대성 SII 정규시즌 커리큘럼",
    webUrl: "https://kangnams2.dshw.co.kr/recruitment/teachercurriculumr.do",
    includeImages: true,
  },
  {
    id: "orbi-russell-sdij-dugak-season-question-2026",
    type: "community",
    platform: "Orbi",
    bucket: "learning_routines",
    tags: ["community", "season", "waiting-list", "2026-03-30-phase2"],
    title: "시대/두각 단과 시즌 운영 질문",
    webUrl: "https://orbi.kr/00077104031/%EB%9F%AC%EC%85%80-%EC%8B%9C%EB%8C%80-%EB%91%90%EA%B0%81-%EB%8B%A8%EA%B3%BC-%EC%A7%88%EB%AC%B8",
    includeImages: false,
  },
  {
    id: "orbi-math-7to3-question-2026",
    type: "community",
    platform: "Orbi",
    bucket: "learning_routines",
    tags: ["community", "grade-7-3", "instructor-choice", "2026-03-30-phase2"],
    title: "수학 7등급에서 3등급 목표 질문",
    webUrl: "https://orbi.kr/00077355145/%EC%88%98%ED%95%99-7%EB%93%B1%EA%B8%89-%EC%9D%B8%EA%B0%95-%EC%B6%94%EC%B2%9C",
    includeImages: false,
  },
  {
    id: "orbi-akoreum-consult-review-2026",
    type: "community",
    platform: "Orbi",
    bucket: "learning_routines",
    tags: ["community", "akoreum", "consult", "2026-03-30-phase2"],
    title: "악어오름 상담 후기",
    webUrl: "https://orbi.kr/00077711927/%EC%95%85%EC%96%B4%EC%98%A4%EB%A6%84-%EC%83%81%EB%8B%B4-%ED%9B%84%EA%B8%B0",
    includeImages: false,
  },
  {
    id: "orbi-success-percentile40-to-grade1",
    type: "community",
    platform: "Orbi",
    bucket: "study_methods",
    tags: ["community", "success-case", "2026-03-30-phase2"],
    title: "수능 수학 백분위 40 -> 1등급 후기",
    webUrl: "https://orbi.kr/00041714232",
    includeImages: false,
  },
  {
    id: "orbi-gradewall-2to3-strategy-2026",
    type: "community",
    platform: "Orbi",
    bucket: "study_methods",
    tags: ["community", "grade-wall", "2026-03-30-phase2"],
    title: "수학 2,3등급 벽 구간 공부법",
    webUrl: "https://orbi.kr/00077656644",
    includeImages: false,
  },
  {
    id: "orbi-onescore-bottleneck-2026",
    type: "community",
    platform: "Orbi",
    bucket: "study_methods",
    tags: ["community", "1-grade", "bottleneck", "2026-03-30-phase2"],
    title: "1등급에서 만점으로 가는 병목 질문",
    webUrl: "https://orbi.kr/00077803980",
    includeImages: false,
  },
  {
    id: "akoreum-channel-ruclips",
    type: "youtube_comment",
    platform: "Akoreum Channel",
    bucket: "learning_routines",
    tags: ["youtube_comment", "akoreum", "2026-03-30-phase2"],
    title: "악어오름 채널 피드",
    webUrl: "https://lacodileclimbing.ruclips.net/",
    includeImages: false,
  },
  {
    id: "orbi-akoreum-mijuk-controversy-2026",
    type: "community",
    platform: "Orbi",
    bucket: "learning_routines",
    tags: ["community", "akoreum", "elective-choice", "2026-03-30-phase2"],
    title: "수학 노베 미적 선택 논쟁",
    webUrl: "https://orbi.kr/00070773982",
    includeImages: false,
  },
];

const newRegistrySources = [
  {
    id: "sdij-hall-of-fame-review-616",
    type: "official+community",
    provider: "Sidaeinjae",
    url: "https://m.sdij.com/sdn/hall_of_fame/review.asp?group_cd=46&std_cd=616",
    capturedAt: today,
    keyPoints: ["명예의 전당 합격생", "실수 관리 루틴", "수학/과탐 운영 팁"],
  },
  {
    id: "kangnams2-teacher-curriculum",
    type: "official",
    provider: "Gangnam Daesung SII",
    url: "https://kangnams2.dshw.co.kr/recruitment/teachercurriculumr.do",
    capturedAt: today,
    keyPoints: ["정규시즌 커리큘럼", "수학 트랙", "시간표 확인 동선"],
  },
  {
    id: "orbi-russell-sdij-dugak-season-question-2026",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00077104031/%EB%9F%AC%EC%85%80-%EC%8B%9C%EB%8C%80-%EB%91%90%EA%B0%81-%EB%8B%A8%EA%B3%BC-%EC%A7%88%EB%AC%B8",
    capturedAt: today,
    keyPoints: ["시즌별 대기 순번", "단과 진입 타이밍", "운영 방식 질문"],
  },
  {
    id: "orbi-math-7to3-question-2026",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00077355145/%EC%88%98%ED%95%99-7%EB%93%B1%EA%B8%89-%EC%9D%B8%EA%B0%95-%EC%B6%94%EC%B2%9C",
    capturedAt: today,
    keyPoints: ["7->3 목표", "개념 인강 선택", "실전개념 병행 고민"],
  },
  {
    id: "orbi-akoreum-consult-review-2026",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00077711927/%EC%95%85%EC%96%B4%EC%98%A4%EB%A6%84-%EC%83%81%EB%8B%B4-%ED%9B%84%EA%B8%B0",
    capturedAt: today,
    keyPoints: ["플래너 체크 기반 코칭", "컨텐츠 선택 상담", "과목별 코칭 적합도"],
  },
  {
    id: "orbi-success-percentile40-to-grade1",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00041714232",
    capturedAt: today,
    keyPoints: ["백분위 40 -> 1등급", "현강+N제+모의 조합", "기간별 루틴 변화"],
  },
  {
    id: "orbi-gradewall-2to3-strategy-2026",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00077656644",
    capturedAt: today,
    keyPoints: ["2~3등급 벽", "일반4점 안정화", "기출 일관성 강조"],
  },
  {
    id: "orbi-onescore-bottleneck-2026",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00077803980",
    capturedAt: today,
    keyPoints: ["1등급에서 만점 병목", "기출 분석 vs N제량", "실모 점수 흔들림"],
  },
  {
    id: "akoreum-channel-ruclips",
    type: "youtube_comment",
    provider: "Akoreum Channel",
    url: "https://lacodileclimbing.ruclips.net/",
    capturedAt: today,
    keyPoints: ["수능 수학 채널", "시청자 질문 흐름 파악", "댓글 기반 질문 시그널 수집용"],
  },
  {
    id: "orbi-akoreum-mijuk-controversy-2026",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00070773982",
    capturedAt: today,
    keyPoints: ["노베 미적 선택 논쟁", "선택과목 불안", "커뮤니티 질문 빈도 높음"],
  },
];

const newKnowledgeItems = [
  {
    id: "kb-elite-season-detail-phase2-2026",
    bucket: "lecture_books",
    title: "상위권 단과 시즌 운용 상세",
    source: "Sidaeinjae + Dugak official/community references",
    applies_to: ["5-3", "3-1"],
    core: "상위권은 단과를 연중 고정으로 듣기보다 시즌 목표에 맞게 컨텐츠를 분리해야 점수 변동을 줄일 수 있다.",
    steps: [
      { title: "3~6모", detail: "약점 단원 보강과 정규 수업 기반의 개념-기출 연결을 고정한다." },
      { title: "6~9모", detail: "N제와 주간 모의를 묶어 운영하고 오답 회수 규칙을 주간 단위로 적용한다." },
      { title: "9모~수능", detail: "파이널 모의와 압축 복기 노트 중심으로 새 교재 확장을 멈춘다." },
    ],
    cautions: ["대기/등록 일정에 밀려 루틴이 끊기면 모의 점수 변동이 커질 수 있다."],
    keywords: ["season-plan", "elite", "academy", "final", "waiting-list"],
    meta: {
      sourceType: "curated",
      platform: "internal",
      tags: ["phase2", "elite-season", "official+community"],
    },
  },
  {
    id: "kb-success-p40to1-phase2-2026",
    bucket: "study_methods",
    title: "백분위 40에서 1등급 전환 사례 요약",
    source: "Orbi success thread",
    applies_to: ["7-5", "5-3", "3-1"],
    core: "점수 전환 사례는 강사/교재 이름보다 기간별 루틴(개념-기출-N제-실모) 전환 타이밍이 명확했다.",
    steps: [
      { title: "초기", detail: "개념 공백을 빠르게 메우고 쉬운 기출 적용으로 풀이 체계를 만든다." },
      { title: "중기", detail: "핵심 강의와 기출 교재를 병행해 일반4점 안정화를 우선한다." },
      { title: "후기", detail: "실모 주기와 오답 복기 주기를 분리해 실전 변동성을 줄인다." },
    ],
    cautions: ["N제 양만 늘리고 복기 주기를 고정하지 않으면 상위 점수대 진입이 지연된다."],
    keywords: ["success-case", "grade-jump", "routine", "review", "mock"],
    meta: {
      sourceType: "curated",
      platform: "internal",
      tags: ["phase2", "success-case"],
    },
  },
  {
    id: "kb-akoreum-question-pattern-phase2-2026",
    bucket: "learning_routines",
    title: "악어오름 관련 질문 패턴",
    source: "Akoreum channel + Orbi discussion",
    applies_to: ["9-7", "7-5", "5-3", "3-1"],
    core: "질문은 주로 컨텐츠 선택 시기, 플래너 체크 루틴, 선택과목 결정 불안으로 반복된다.",
    steps: [
      { title: "질문 분류", detail: "컨텐츠 순서/시기/선택과목/복기 루틴으로 질문을 먼저 분류한다." },
      { title: "행동 변환", detail: "각 질문을 이번 주 실행 항목 1개로 변환해 계획표에 반영한다." },
      { title: "재질문 방지", detail: "반복 질문은 루틴 미고정 신호로 보고 2주 고정 체크를 수행한다." },
    ],
    cautions: ["커뮤니티 의견만 따라 선택과목이나 교재를 급변경하면 성과가 흔들릴 수 있다."],
    keywords: ["question-signal", "youtube", "akoreum", "planner", "elective"],
    meta: {
      sourceType: "curated",
      platform: "internal",
      tags: ["phase2", "question-trend"],
    },
  },
];

const newInstructors = [
  {
    name: "문서연",
    platform: "Sidaeinjae/Russell",
    fitKeys: ["5-3", "3-1"],
    subjectTags: ["공통", "미적분", "기하"],
    strengths: [
      "상위권 실전세트 운영과 주간 과제 피드백에 강점이 있다는 커뮤니티 리뷰가 반복된다.",
      "시즌별 수업 구조가 비교적 분명해 파이널 전환이 수월하다는 평가가 있다.",
    ],
    styleTags: ["seasonal", "practical", "high-intensity"],
    curriculumPath: [
      { stage: "3~6모", course: "정규 단과 + 약점 클리닉", material: "정규 교재 + 보강 자료" },
      { stage: "6~9모", course: "N제 + 주간 모의", material: "N제 + 실전 모의" },
      { stage: "9모~수능", course: "파이널 모의 + 압축 복기", material: "파이널 세트 + 복기노트" },
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "regular+clinic", content: "개념 빈틈 보강 + 기출 연결", goal: "일반4점 안정화" },
      { period: "6~9모", classType: "N-set+mock", content: "난도 확장 + 시간운영 훈련", goal: "준킬러/킬러 대응" },
      { period: "9모~수능", classType: "final", content: "파이널 모의 + 오답 압축", goal: "변동성 최소화" },
    ],
    reviewSummary: ["대기/등록 타이밍 관리가 중요하다는 후기 빈도가 높음"],
    bestFor: "상위권 실전 운영 최적화가 필요한 학생",
    usage: "시즌 전환 지점에서 과제량과 복기량을 재조정하며 운용",
    sourceLevel: "official+community",
    confidence: 0.84,
    sourceRefs: ["orbi-russell-sdij-dugak-season-question-2026", "orbi-sdij-track-thread-2026"],
  },
  {
    name: "신성규",
    platform: "Russell/Daechi",
    fitKeys: ["7-5", "5-3", "3-1"],
    subjectTags: ["공통", "미적분"],
    strengths: [
      "실전개념과 기출 해석 연결이 빠르다는 후기 비중이 높다.",
      "중하위권에서 상위권으로 전환한 사례에서 반복적으로 언급된다.",
    ],
    styleTags: ["concept-to-practical", "tempo", "feedback"],
    curriculumPath: [
      { stage: "2~4월", course: "실전개념", material: "개념+유형" },
      { stage: "5~7월", course: "기출/N제 병행", material: "기출 + N제" },
      { stage: "8~수능", course: "실모/파이널", material: "실전 모의" },
    ],
    seasonalPlan: [
      { period: "2~4월", classType: "concept", content: "핵심 개념 + 쉬운 기출 연결", goal: "개념 공백 해소" },
      { period: "5~7월", classType: "past+N-set", content: "기출 구조화 + N제 확장", goal: "일반4점 안정화" },
      { period: "8~수능", classType: "mock", content: "실모 세트 + 회수 루틴", goal: "실전 대응력 강화" },
    ],
    reviewSummary: ["백분위 40->1등급 전환 후기에서 핵심 강의로 언급됨"],
    bestFor: "중위권 이상에서 실전전환이 필요한 학생",
    usage: "기출 회전과 실모 회수 루틴을 묶어 운영",
    sourceLevel: "community",
    confidence: 0.8,
    sourceRefs: ["orbi-success-percentile40-to-grade1", "orbi-russell-sdij-dugak-season-question-2026"],
  },
  {
    name: "강남대성 SII 수학 단과팀",
    platform: "Gangnam Daesung SII",
    fitKeys: ["7-5", "5-3", "3-1"],
    subjectTags: ["공통", "확률과통계", "미적분", "기하"],
    strengths: [
      "정규시즌 커리큘럼 기준으로 과목/시기별 운영이 명확하다.",
      "모집요강-시간표-커리큘럼 동선이 분리되어 있어 계획 수립에 유리하다.",
    ],
    styleTags: ["curriculum-driven", "seasonal", "structured"],
    curriculumPath: [
      { stage: "정규시즌", course: "과목별 커리큘럼", material: "학원 교재" },
      { stage: "중반", course: "심화/실전 모듈", material: "심화 자료" },
      { stage: "파이널", course: "최종 정리", material: "파이널 모의" },
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "regular", content: "정규시즌 커리큘럼 기반 진도", goal: "개념+유형 정착" },
      { period: "6~9모", classType: "advanced", content: "심화 모듈 + 실전 세트", goal: "고난도 대응" },
      { period: "9모~수능", classType: "final", content: "파이널 정리 + 모의", goal: "실전 안정화" },
    ],
    reviewSummary: ["정규시즌 운영 정보 기반으로 일정 설계가 가능함"],
    bestFor: "시기별 커리큘럼 통제가 필요한 학생",
    usage: "시즌 시작 전 시간표/커리큘럼을 먼저 고정하고 진입",
    sourceLevel: "official",
    confidence: 0.82,
    sourceRefs: ["kangnams2-teacher-curriculum"],
  },
  {
    name: "악어오름",
    platform: "YouTube/Consult",
    fitKeys: ["9-7", "7-5"],
    subjectTags: ["공통", "미적분"],
    strengths: [
      "플래너 체크형 루틴 코칭 니즈가 있는 학생층에서 언급 빈도가 높다.",
      "컨텐츠 선택 시기와 학습 루틴 관련 질문이 반복적으로 모인다.",
    ],
    styleTags: ["planner-check", "routine-coaching", "content-selection"],
    curriculumPath: [
      { stage: "초기", course: "주간 플래너 점검", material: "개인 계획표" },
      { stage: "중기", course: "컨텐츠 선택 조정", material: "기출/N제 리스트" },
      { stage: "후기", course: "실모/복기 루틴", material: "실모 기록지" },
    ],
    seasonalPlan: [
      { period: "3~6모", classType: "planner", content: "습관 고정 + 일일 체크", goal: "학습량 안정화" },
      { period: "6~9모", classType: "content-adjust", content: "컨텐츠 우선순위 조정", goal: "시간 효율 개선" },
      { period: "9모~수능", classType: "final-routine", content: "실모/복기 루틴 유지", goal: "불안 요인 최소화" },
    ],
    reviewSummary: ["학습 습관이 약한 학생에게는 코칭 체감이 있었다는 후기 존재"],
    bestFor: "플래너 기반 통제가 필요한 학생",
    usage: "질문 로그와 체크리스트를 연동해 주간 실행률 관리",
    sourceLevel: "community+youtube_comment",
    confidence: 0.69,
    sourceRefs: ["orbi-akoreum-consult-review-2026", "akoreum-channel-ruclips"],
  },
];

const newBooks = [
  {
    title: "마더텅 수학I/II/미적분 기출",
    type: "기출서",
    fitKeys: ["7-5", "5-3", "3-1"],
    purpose: "기출 회전 기반 풀이 일관성 강화",
    when: "3~수능",
    difficulty: "medium-high",
    subjectTags: ["공통", "미적분"],
    sourceLevel: "community",
    confidence: 0.78,
    sourceRefs: ["orbi-success-percentile40-to-grade1", "orbi-gradewall-2to3-strategy-2026"],
  },
  {
    title: "쎈 수학I/II",
    type: "유형서",
    fitKeys: ["9-7", "7-5"],
    purpose: "개념 직후 기본~중난도 유형 정착",
    when: "개념 직후",
    difficulty: "medium",
    subjectTags: ["공통"],
    sourceLevel: "community",
    confidence: 0.74,
    sourceRefs: ["orbi-success-percentile40-to-grade1"],
  },
  {
    title: "일품 수학I/II",
    type: "유형/심화",
    fitKeys: ["7-5", "5-3"],
    purpose: "중난도 구간 해석 정확도 향상",
    when: "5~9모",
    difficulty: "medium-high",
    subjectTags: ["공통"],
    sourceLevel: "community",
    confidence: 0.72,
    sourceRefs: ["orbi-math-band-column", "orbi-gradewall-2to3-strategy-2026"],
  },
  {
    title: "블랙라벨 수학I/II",
    type: "심화서",
    fitKeys: ["5-3", "3-1"],
    purpose: "상위권 대비 고난도 유형 보강",
    when: "6~9모",
    difficulty: "high",
    subjectTags: ["공통"],
    sourceLevel: "community",
    confidence: 0.68,
    sourceRefs: ["orbi-onescore-bottleneck-2026"],
  },
  {
    title: "4의 규칙",
    type: "N제",
    fitKeys: ["5-3", "3-1"],
    purpose: "실전 난도 확장과 풀이 속도 보강",
    when: "6~9모",
    difficulty: "high",
    subjectTags: ["미적분"],
    sourceLevel: "community",
    confidence: 0.77,
    sourceRefs: ["orbi-success-percentile40-to-grade1"],
  },
  {
    title: "규토 라이트 N제",
    type: "N제",
    fitKeys: ["7-5", "5-3"],
    purpose: "중위권에서 상위권으로의 문항 처리력 확장",
    when: "연중 병행",
    difficulty: "medium-high",
    subjectTags: ["공통"],
    sourceLevel: "community",
    confidence: 0.71,
    sourceRefs: ["orbi-00061876865-light-nje"],
  },
  {
    title: "시대인재 서바이벌 모의",
    type: "academy-mock",
    fitKeys: ["3-1"],
    purpose: "파이널 실전 감각 고정",
    when: "9모~수능",
    difficulty: "high",
    subjectTags: ["공통", "미적분", "기하"],
    sourceLevel: "official+community",
    confidence: 0.84,
    sourceRefs: ["sdij-daechi-timetable", "orbi-russell-sdij-dugak-season-question-2026"],
  },
  {
    title: "원솔멀텍 파이널",
    type: "final-set",
    fitKeys: ["5-3", "3-1"],
    purpose: "파이널 시기 문항 감각 유지",
    when: "9모~수능",
    difficulty: "high",
    subjectTags: ["공통", "미적분"],
    sourceLevel: "community",
    confidence: 0.66,
    sourceRefs: ["orbi-00074822227-final-plan"],
  },
  {
    title: "설맞이 시즌 모의",
    type: "mock",
    fitKeys: ["5-3", "3-1"],
    purpose: "실모 운영 루틴 구축",
    when: "파이널",
    difficulty: "high",
    subjectTags: ["공통", "미적분"],
    sourceLevel: "community",
    confidence: 0.64,
    sourceRefs: ["orbi-00074822227-final-plan"],
  },
  {
    title: "두각 파이널 모의 세트",
    type: "academy-mock",
    fitKeys: ["3-1"],
    purpose: "상위권 파이널 실전 세트 운영",
    when: "9모~수능",
    difficulty: "high",
    subjectTags: ["공통", "미적분", "기하"],
    sourceLevel: "official+community",
    confidence: 0.8,
    sourceRefs: ["dugak-presentation-board-2026", "orbi-russell-sdij-dugak-season-question-2026"],
  },
  {
    title: "뉴런+수분감 병행 세트",
    type: "lecture+past",
    fitKeys: ["7-5", "5-3", "3-1"],
    purpose: "실전개념과 기출 연결",
    when: "3~7월",
    difficulty: "medium-high",
    subjectTags: ["공통", "미적분"],
    sourceLevel: "community",
    confidence: 0.79,
    sourceRefs: ["orbi-success-percentile40-to-grade1", "orbi-onescore-bottleneck-2026"],
  },
];

const newSuccessCases = [
  {
    id: "success-p40-to-grade1-orbi-2026",
    bandShift: "percentile40->grade1",
    duration: "about 1 year",
    summary: "Community post reports conversion from percentile 40 to grade 1 using lecture+past+N-set+mock sequence.",
    coreActions: ["뉴런/수분감 병행", "신성규 현강", "실모 주기 + 오답 회수"],
    fitKeys: ["7-5", "5-3", "3-1"],
    sourceRefs: ["orbi-success-percentile40-to-grade1"],
    reliability: 0.81,
  },
  {
    id: "success-sdij-hof-mistake-control-2026",
    bandShift: "top-band stabilization",
    duration: "in-season",
    summary: "Sidaeinjae hall-of-fame review emphasizes sleep and repeated mistake-control for stable math output.",
    coreActions: ["실수 유형 분류", "수면/컨디션 관리", "모의 후 즉시 복기"],
    fitKeys: ["5-3", "3-1"],
    sourceRefs: ["sdij-hall-of-fame-review-616"],
    reliability: 0.84,
  },
  {
    id: "success-4to1-lightnje-community-2026",
    bandShift: "4->1",
    duration: "1 academic year",
    summary: "Community recommendation reports sustained grade 1 with N-set routine and review consistency.",
    coreActions: ["N제 반복", "모의고사 루틴", "오답회수 고정"],
    fitKeys: ["7-5", "5-3"],
    sourceRefs: ["orbi-00061876865-light-nje"],
    reliability: 0.7,
  },
  {
    id: "success-5to1-column-2026",
    bandShift: "5->1-late",
    duration: "3~5 months",
    summary: "Grade-band column claims fast uplift when review cycle and grade-specific strategy are fixed.",
    coreActions: ["등급대별 전략", "복습 우선 루틴", "단계별 교재 운용"],
    fitKeys: ["7-5", "5-3", "3-1"],
    sourceRefs: ["orbi-math-band-column"],
    reliability: 0.67,
  },
  {
    id: "success-60score-to-grade1-2026",
    bandShift: "60-point-band->grade1",
    duration: "mid-term",
    summary: "Score-band recovery case highlights error-note quality and repeated concept application.",
    coreActions: ["오답노트 체계화", "개념 재출력", "문항별 풀이 일관화"],
    fitKeys: ["7-5", "5-3"],
    sourceRefs: ["orbi-00032151027-studymethod"],
    reliability: 0.69,
  },
];

const newQuestionSignals = [
  {
    id: "q-season-waitlist-reset-2026",
    channel: "community",
    focus: "season waiting policy",
    learnerQuestion: "Does waiting order reset every season for Sidaeinjae/Dugak single classes?",
    coachingHint: "Check registration policy before season switch and lock one backup track.",
    fitKeys: ["5-3", "3-1"],
    sourceRefs: ["orbi-russell-sdij-dugak-season-question-2026"],
    reliability: 0.83,
    channelHint: "frequent in academy-entry questions",
  },
  {
    id: "q-7to3-lecture-selection-2026",
    channel: "community",
    focus: "lecture selection",
    learnerQuestion: "What lecture should a grade-7 student pick for a grade-3 target?",
    coachingHint: "Start with concept closure then bind easy past-exam loop before heavy N-set.",
    fitKeys: ["9-7", "7-5"],
    sourceRefs: ["orbi-math-7to3-question-2026"],
    reliability: 0.78,
    channelHint: "beginner-to-mid transition",
  },
  {
    id: "q-grade23-wall-general4point-2026",
    channel: "community",
    focus: "2~3 grade wall",
    learnerQuestion: "How do I break the 2~3 grade wall in math?",
    coachingHint: "Stabilize general 4-point problems with one consistent technique before adding new N-set volume.",
    fitKeys: ["5-3", "3-1"],
    sourceRefs: ["orbi-gradewall-2to3-strategy-2026"],
    reliability: 0.82,
  },
  {
    id: "q-final-period-resource-choice-2026",
    channel: "community",
    focus: "final period strategy",
    learnerQuestion: "In final period, should I expand resources or compress review with fewer sets?",
    coachingHint: "Prioritize compressed review and fixed mock cadence over late-stage resource expansion.",
    fitKeys: ["5-3", "3-1"],
    sourceRefs: ["orbi-00074822227-final-plan"],
    reliability: 0.75,
  },
  {
    id: "q-1grade-to-perfectscore-2026",
    channel: "community",
    focus: "top-band bottleneck",
    learnerQuestion: "What blocks transition from stable grade 1 to perfect score?",
    coachingHint: "Separate concept gaps from time-control and increase review density on repeated miss-types.",
    fitKeys: ["3-1"],
    sourceRefs: ["orbi-onescore-bottleneck-2026"],
    reliability: 0.8,
  },
  {
    id: "q-akoreum-planner-check-2026",
    channel: "youtube-comment+community",
    focus: "planner accountability",
    learnerQuestion: "Does planner-check coaching really help if routine is unstable?",
    coachingHint: "Use daily planner feedback only if it maps to concrete weekly task completion.",
    fitKeys: ["9-7", "7-5"],
    sourceRefs: ["orbi-akoreum-consult-review-2026", "akoreum-channel-ruclips"],
    reliability: 0.73,
    channelHint: "Akoreum audience recurring topic",
  },
  {
    id: "q-akoreum-elective-choice-2026",
    channel: "youtube-comment+community",
    focus: "elective anxiety",
    learnerQuestion: "Should low-base students choose 미적분 unconditionally?",
    coachingHint: "Decide elective by current base and timeline, not by one-channel blanket rule.",
    fitKeys: ["9-7", "7-5", "5-3"],
    sourceRefs: ["orbi-akoreum-mijuk-controversy-2026", "orbi-00077627016-akoreum-hot"],
    reliability: 0.71,
  },
];

const aliasSourceEntries = [
  { id: "orbi-00061876865-light-nje", url: "https://orbi.kr/00061876865" },
  { id: "orbi-00074822227-final-plan", url: "https://orbi.kr/00074822227" },
  { id: "orbi-00032151027-studymethod", url: "https://orbi.kr/00032151027" },
  { id: "orbi-00077627016-akoreum-hot", url: "https://orbi.kr/00077627016" },
];

function ensureAliasSources(existingRegistrySources, existingSources) {
  const registryAdds = [];
  const sourceAdds = [];
  for (const x of aliasSourceEntries) {
    registryAdds.push({
      id: x.id,
      type: "community",
      provider: "Orbi",
      url: x.url,
      capturedAt: today,
      keyPoints: ["phase2 alias source"],
    });
    sourceAdds.push({
      id: x.id,
      type: "community",
      platform: "Orbi",
      bucket: "study_methods",
      tags: ["community", "2026-03-30-phase2", "alias"],
      title: x.id,
      webUrl: x.url,
      includeImages: false,
    });
  }
  return {
    registry: mergeById(existingRegistrySources, registryAdds),
    sources: mergeById(existingSources, sourceAdds),
  };
}

function main() {
  const kb = readJson(paths.kb, { updatedAt: null, items: [] });
  const catalog = readJson(paths.catalog, { updatedAt: null, notes: "", instructors: [], books: [] });
  const success = readJson(paths.success, { updatedAt: null, notes: "", cases: [] });
  const signals = readJson(paths.signals, { updatedAt: null, notes: "", signals: [] });
  const registry = readJson(paths.registry, { updatedAt: null, policy: {}, sources: [] });
  const sources = readJson(paths.sources, []);

  const mergedSources = mergeById(sources, newSources);
  const mergedRegistrySources = mergeById(registry.sources || [], newRegistrySources);
  const aliasMerged = ensureAliasSources(mergedRegistrySources, mergedSources);

  const nextKb = {
    ...kb,
    updatedAt: today,
    items: mergeById(kb.items || [], newKnowledgeItems),
  };

  const nextCatalog = {
    ...catalog,
    updatedAt: today,
    notes: "Phase2 update: UI-first + evidence expansion from official/community/youtube-comment references.",
    instructors: mergeByKey(catalog.instructors || [], newInstructors, "name"),
    books: mergeByKey(catalog.books || [], newBooks, "title"),
  };

  const nextSuccess = {
    ...success,
    updatedAt: today,
    notes: "Phase2 update: expanded student success cases with explicit source references.",
    cases: mergeById(success.cases || [], newSuccessCases),
  };

  const nextSignals = {
    ...signals,
    updatedAt: today,
    notes: "Phase2 update: expanded learner question signals from community and Akoreum-related channels.",
    signals: mergeById(signals.signals || [], newQuestionSignals),
  };

  const nextRegistry = {
    ...registry,
    updatedAt: today,
    policy: {
      ...(registry.policy || {}),
      notes: "UI-first workflow with evidence-first source tracking (phase2).",
    },
    sources: aliasMerged.registry,
  };

  writeJson(paths.kb, nextKb);
  writeJson(paths.catalog, nextCatalog);
  writeJson(paths.success, nextSuccess);
  writeJson(paths.signals, nextSignals);
  writeJson(paths.registry, nextRegistry);
  writeJson(paths.sources, aliasMerged.sources);

  console.log("phase2 data upgrade complete");
}

main();
