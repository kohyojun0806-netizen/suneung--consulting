const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 8787);
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4.1-mini";
const AI_FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || "gpt-4.1-mini";
const ELECTIVE_SUBJECTS = ["확률과통계", "미적분", "기하"];

const DATA_DIR = path.join(process.cwd(), "data");
const GENERATED_DIR = path.join(DATA_DIR, "generated");
const KNOWLEDGE_DIR = path.join(DATA_DIR, "knowledge");
const KNOWLEDGE_FILE =
  process.env.KNOWLEDGE_FILE || path.join(KNOWLEDGE_DIR, "knowledge_base.json");
const RECOMMENDATION_FILE =
  process.env.RECOMMENDATION_FILE ||
  path.join(KNOWLEDGE_DIR, "recommendation_catalog.json");

fs.mkdirSync(GENERATED_DIR, { recursive: true });
fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });

app.use(
  cors({
    origin(origin, callback) {
      // allow non-browser clients or same-origin server-to-server calls
      if (!origin) return callback(null, true);
      if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked: origin not allowed"));
    },
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  const knowledge = await loadKnowledgeBase();
  const catalog = await loadRecommendationCatalog();
  const modelCandidates = getModelCandidates();
  res.json({
    ok: true,
    model: modelCandidates[0],
    modelCandidates,
    electives: ELECTIVE_SUBJECTS,
    knowledgeItems: knowledge.items.length,
    knowledgeUpdatedAt: knowledge.updatedAt || null,
    recommendationInstructors: catalog.instructors.length,
    recommendationBooks: catalog.books.length,
    recommendationUpdatedAt: catalog.updatedAt || null,
  });
});

app.get("/api/knowledge/summary", async (_req, res) => {
  try {
    const knowledge = await loadKnowledgeBase();
    const catalog = await loadRecommendationCatalog();
    const summary = buildKnowledgeSummary(knowledge, catalog);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message || "학습 데이터 요약 생성에 실패했습니다." });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const from = Number(req.body?.currentGrade);
    const to = Number(req.body?.targetGrade);
    const electiveSubject = normalizeElectiveSubject(req.body?.electiveSubject);

    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      return res
        .status(400)
        .json({ error: "currentGrade와 targetGrade를 입력해주세요." });
    }
    if (from < 1 || from > 9 || to < 1 || to > 9) {
      return res.status(400).json({ error: "등급은 1~9 범위로 입력해주세요." });
    }
    if (to >= from) {
      return res
        .status(400)
        .json({ error: "목표 등급은 현재 등급보다 높아야 합니다." });
    }

    const curriculumKey = getCurriculumKey(from, to);
    const mathStructure = getMathStructureGuide();

    const knowledge = await loadKnowledgeBase();
    if (!knowledge.items.length) {
      return res.status(503).json({
        error: "학습 데이터가 비어 있습니다. 먼저 ingest를 실행해주세요.",
      });
    }

    const catalog = await loadRecommendationCatalog();
    const selectedKnowledge = selectKnowledgeItems(knowledge.items, curriculumKey);
    const knowledgeBlend = blendKnowledgeItems(selectedKnowledge);
    const recommendationSeed = buildRecommendationSeed({
      catalog,
      curriculumKey,
      currentGrade: from,
      targetGrade: to,
      electiveSubject,
    });

    const userPrompt = buildAnalyzePrompt({
      currentGrade: from,
      targetGrade: to,
      curriculumKey,
      knowledgeBlend,
      recommendationSeed,
      electiveSubject,
      mathStructure,
    });

    let plan;
    let usedModel = false;
    let usedModelName = null;

    if (OPENAI_API_KEY) {
      const modelCandidates = getModelCandidates();
      let lastModelError = null;

      for (const modelName of modelCandidates) {
        try {
          const rawJson = await requestPlanJson(userPrompt, modelName);
          plan = normalizePlan(rawJson, {
            knowledgeBlend,
            recommendationSeed,
            currentGrade: from,
            targetGrade: to,
            electiveSubject,
            mathStructure,
          });
          usedModel = true;
          usedModelName = modelName;
          break;
        } catch (error) {
          lastModelError = error;
          console.warn(`[analyze] model failed (${modelName}) -> retry: ${error.message}`);
        }
      }

      if (!plan) {
        if (lastModelError) {
          console.warn(`[analyze] all model attempts failed -> fallback plan: ${lastModelError.message}`);
        }
        plan = createFallbackPlan({
          currentGrade: from,
          targetGrade: to,
          knowledgeBlend,
          recommendationSeed,
          electiveSubject,
          mathStructure,
        });
      }
    } else {
      plan = createFallbackPlan({
        currentGrade: from,
        targetGrade: to,
        knowledgeBlend,
        recommendationSeed,
        electiveSubject,
        mathStructure,
      });
    }

    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const outPath = path.join(GENERATED_DIR, `${jobId}.json`);
    const payload = {
      createdAt: new Date().toISOString(),
      input: { currentGrade: from, targetGrade: to, curriculumKey, electiveSubject },
      knowledgeMeta: {
        updatedAt: knowledge.updatedAt || null,
        selectedIds: selectedKnowledge.map((item) => item.id),
      },
      recommendationMeta: {
        updatedAt: catalog.updatedAt || null,
      },
      plan,
    };
    await fsp.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");

    res.json({
      plan,
      meta: {
        id: jobId,
        file: path.relative(process.cwd(), outPath),
        usedModel,
        model: usedModelName,
        knowledgeUpdatedAt: knowledge.updatedAt || null,
      },
    });
  } catch (error) {
    console.error("[analyze] error:", error);
    res.status(500).json({ error: error.message || "분석 중 오류가 발생했습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`API server ready: http://localhost:${PORT}`);
});

function getCurriculumKey(current, target) {
  if (current >= 8 && target >= 6) return "9-7";
  if (current >= 6 && target >= 4) return "7-5";
  if (current >= 4 && target >= 2) return "5-3";
  if (current >= 2 && target >= 1) return "3-1";
  return "custom";
}

async function loadKnowledgeBase() {
  if (!fs.existsSync(KNOWLEDGE_FILE)) {
    return { updatedAt: null, items: [] };
  }
  const raw = await fsp.readFile(KNOWLEDGE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return {
    updatedAt: parsed.updatedAt || null,
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

async function loadRecommendationCatalog() {
  if (!fs.existsSync(RECOMMENDATION_FILE)) {
    return { updatedAt: null, instructors: [], books: [] };
  }
  const raw = await fsp.readFile(RECOMMENDATION_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return {
    updatedAt: parsed.updatedAt || null,
    instructors: asArray(parsed.instructors),
    books: asArray(parsed.books),
  };
}

function selectKnowledgeItems(items, curriculumKey) {
  const primary = items.filter((item) => appliesTo(item, curriculumKey));
  const fallback = items.filter((item) => appliesTo(item, "all"));
  const merged = [...primary, ...fallback].slice(0, 12);
  return merged.length ? merged : items.slice(0, 10);
}

function buildKnowledgeSummary(knowledge, catalog) {
  const allItems = asArray(knowledge?.items);
  const studyMethods = dedupeTextList(
    allItems
      .filter((item) => toText(item?.bucket) === "수학 공부법")
      .map((item) => sanitizeKnowledgeText(item?.core))
      .filter((text) => isUsefulStudyText(text))
  ).slice(0, 8);

  const learningRoutines = dedupeTextList(
    allItems
      .filter((item) => toText(item?.bucket) === "학습 루틴")
      .flatMap((item) =>
        asArray(item?.steps).map((step) => sanitizeKnowledgeText(`${toText(step?.title)}: ${toText(step?.detail)}`))
      )
      .filter((text) => isUsefulStudyText(text))
  ).slice(0, 10);

  const instructors = asArray(catalog?.instructors)
    .slice(0, 8)
    .map((item) => ({
      name: toText(item?.name),
      platform: toText(item?.platform),
      bestFor: toText(item?.bestFor),
      styleSummary: asArray(item?.styleTags).map((x) => toText(x)).filter(Boolean).join(", "),
      curriculum: asArray(item?.curriculumPath)
        .slice(0, 4)
        .map((x) => `${toText(x?.stage)}: ${toText(x?.course)} (${toText(x?.material)})`),
      reviewSummary: asArray(item?.reviewSummary).map((x) => toText(x)).filter(Boolean).slice(0, 2),
    }))
    .filter((item) => item.name);

  const books = asArray(catalog?.books)
    .slice(0, 10)
    .map((item) => ({
      title: toText(item?.title),
      type: toText(item?.type),
      purpose: toText(item?.purpose),
    }))
    .filter((item) => item.title);

  return {
    updatedAt: knowledge?.updatedAt || catalog?.updatedAt || null,
    categories: {
      study_methods: studyMethods,
      lecture_and_books: {
        instructors,
        books,
      },
      learning_routines: learningRoutines,
    },
  };
}

function appliesTo(item, key) {
  if (!Array.isArray(item?.applies_to)) return false;
  return item.applies_to.includes(key);
}

function blendKnowledgeItems(items) {
  const sourceItems = asArray(items).slice(0, 12);

  const coreParts = sourceItems
    .map((item) => sanitizeKnowledgeText(item.core))
    .filter((text) => isUsefulStudyText(text))
    .slice(0, 4);

  const stepSeen = new Set();
  const steps = [];
  for (const item of sourceItems) {
    for (const step of asArray(item.steps)) {
      const title = sanitizeKnowledgeText(step?.title);
      const detail = sanitizeKnowledgeText(step?.detail);
      if (!title || !detail) continue;
      if (!isUsefulStudyText(detail)) continue;
      if (!isUsefulTitle(title)) continue;
      if (looksLikeGibberish(title) || looksLikeGibberish(detail)) continue;
      const key = `${title}::${detail}`.toLowerCase();
      if (stepSeen.has(key)) continue;
      stepSeen.add(key);
      steps.push({ title, detail });
      if (steps.length >= 12) break;
    }
    if (steps.length >= 12) break;
  }

  const cautionSeen = new Set();
  const cautions = [];
  for (const item of sourceItems) {
    for (const caution of asArray(item.cautions)) {
      const text = sanitizeKnowledgeText(caution);
      if (!text || looksLikeGibberish(text)) continue;
      if (!isUsefulStudyText(text)) continue;
      const key = text.toLowerCase();
      if (cautionSeen.has(key)) continue;
      cautionSeen.add(key);
      cautions.push(text);
      if (cautions.length >= 10) break;
    }
    if (cautions.length >= 10) break;
  }

  const keywordFreq = new Map();
  for (const item of sourceItems) {
    for (const keyword of asArray(item.keywords)) {
      const key = sanitizeKnowledgeText(keyword).toLowerCase();
      if (!key || looksLikeGibberish(key)) continue;
      keywordFreq.set(key, (keywordFreq.get(key) || 0) + 1);
    }
  }

  const keywords = [...keywordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([key]) => key);

  const studyMethods = sourceItems
    .filter((item) => toText(item?.bucket) === "수학 공부법")
    .map((item) => sanitizeKnowledgeText(item?.core))
    .filter((text) => isUsefulStudyText(text))
    .slice(0, 8);

  const learningRoutines = sourceItems
    .filter((item) => toText(item?.bucket) === "학습 루틴")
    .flatMap((item) =>
      asArray(item?.steps).map((step) => sanitizeKnowledgeText(`${toText(step?.title)}: ${toText(step?.detail)}`))
    )
    .filter((text) => isUsefulStudyText(text))
    .slice(0, 20);

  return {
    core:
      coreParts.join(" / ") ||
      "개념을 출력형으로 바꾸고, 기출 적용과 오답 복기를 연결하는 루틴이 필요합니다.",
    steps:
      steps.length > 0
        ? steps
        : [
            { title: "개념 출력", detail: "개념을 읽고 끝내지 말고, 직접 설명/정리로 출력하세요." },
            { title: "기출 연결", detail: "쉬운 기출부터 적용해 개념-문제 연결을 고정하세요." },
            { title: "오답 구조화", detail: "오답을 유형별로 분류하고 같은 실수를 끊어내세요." },
            { title: "시간 관리", detail: "문항당 제한 시간을 정하고 넘기기 규칙을 고정하세요." },
          ],
    cautions:
      cautions.length > 0
        ? cautions
        : [
            "문제 수만 늘리고 복기를 생략하면 점수가 고정됩니다.",
            "개념을 아는 느낌만으로 넘어가면 실전에서 무너집니다.",
          ],
    keywords,
    buckets: {
      study_methods:
        studyMethods.length > 0
          ? dedupeTextList(studyMethods).slice(0, 8)
          : ["개념을 읽는 단계에서 끝내지 말고, 말/글 출력으로 연결하세요."],
      learning_routines:
        learningRoutines.length > 0
          ? dedupeTextList(learningRoutines).slice(0, 12)
          : [
              "백지 복습 20분을 매일 고정하세요.",
              "오답은 24시간 내 1차 복기, 72시간 내 2차 복기를 유지하세요.",
            ],
    },
  };
}

function buildRecommendationSeed({ catalog, curriculumKey, currentGrade, electiveSubject }) {
  const allInstructors = asArray(catalog.instructors);
  const allBooks = asArray(catalog.books);

  const instructorPool = allInstructors
    .filter((item) => fitMatch(item.fitKeys, curriculumKey))
    .filter((item) => matchInstructorSubject(item, electiveSubject))
    .sort((a, b) => scoreInstructor(b, electiveSubject) - scoreInstructor(a, electiveSubject))
    .slice(0, 12);
  const fallbackInstructorPool = allInstructors
    .filter((item) => fitMatch(item.fitKeys, "all"))
    .filter((item) => matchInstructorSubject(item, electiveSubject))
    .sort((a, b) => scoreInstructor(b, electiveSubject) - scoreInstructor(a, electiveSubject))
    .slice(0, 4);

  const instructors = dedupeByName([...instructorPool, ...fallbackInstructorPool]).slice(0, 4).map((x) => ({
    name: toText(x.name),
    platform: toText(x.platform),
    best_for: toText(x.bestFor),
    reason: asArray(x.strengths).map((s) => toText(s)).filter(Boolean).slice(0, 3).join(", "),
    usage: toText(x.usage),
    style_summary: asArray(x.styleTags).map((s) => toText(s)).filter(Boolean).join(", "),
    curriculum_path: asArray(x.curriculumPath)
      .slice(0, 6)
      .map((step) => `${toText(step?.stage)}: ${toText(step?.course)} (${toText(step?.material)})`),
    review_points: asArray(x.reviewSummary).map((s) => toText(s)).filter(Boolean).slice(0, 3),
  }));

  const books = allBooks
    .filter((item) => fitMatch(item.fitKeys, curriculumKey))
    .filter((item) => matchBookSubject(item, electiveSubject))
    .sort((a, b) => {
      const byDifficulty = scoreBookByGrade(a, currentGrade) - scoreBookByGrade(b, currentGrade);
      if (byDifficulty !== 0) return byDifficulty;
      return scoreSourceReliability(b) - scoreSourceReliability(a);
    })
    .slice(0, 12)
    .map((x) => ({
      title: toText(x.title),
      type: toText(x.type),
      purpose: toText(x.purpose),
      when_to_use: toText(x.when),
      difficulty: toText(x.difficulty),
      reason: `${toText(x.purpose)} 중심으로 ${toText(x.when)}에 사용`,
    }));

  const subject_curriculum = buildSubjectCurriculumSeed({
    instructors,
    electiveSubject,
    currentGrade,
  });

  return { instructors, books, subject_curriculum };
}

function fitMatch(fitKeys, curriculumKey) {
  const arr = asArray(fitKeys).map((x) => String(x));
  return arr.includes("all") || arr.includes(curriculumKey);
}

function dedupeByName(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = toText(item.name).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function scoreBookByGrade(book, grade) {
  const difficulty = toText(book?.difficulty);
  if (grade >= 7) {
    if (difficulty.includes("상")) return 3;
    if (difficulty.includes("중")) return 2;
    return 1;
  }
  if (grade >= 4) {
    if (difficulty.includes("상")) return 2;
    return 1;
  }
  return difficulty.includes("하") ? 3 : 1;
}

function normalizeElectiveSubject(value) {
  const text = toText(value);
  if (ELECTIVE_SUBJECTS.includes(text)) return text;
  return "미적분";
}

function getMathStructureGuide() {
  return {
    as_of: "2026-03-28",
    current_csat: {
      type: "공통+선택",
      common: ["수학I", "수학II"],
      elective_options: [...ELECTIVE_SUBJECTS],
      rule: "선택과목 1개를 응시",
    },
    note_2028: {
      effective_exam_year: "2028학년도",
      summary: "현재 중2가 치르는 2028학년도부터 수학 선택과목 체계가 개편됩니다.",
    },
  };
}

function buildSubjectCurriculumSeed({ instructors, electiveSubject, currentGrade }) {
  return asArray(instructors)
    .slice(0, 4)
    .map((inst) => {
      const template = getInstructorCurriculumTemplate(inst.name, electiveSubject, currentGrade);
      return {
        name: inst.name,
        platform: inst.platform,
        common_subjects: template.common_subjects,
        elective_subject: {
          subject: electiveSubject,
          strategy: template.elective_strategy,
          checkpoints: template.elective_checkpoints,
        },
      };
    });
}

function getInstructorCurriculumTemplate(name, electiveSubject, currentGrade) {
  const baseCommon = {
    "수학I": [
      "지수/로그/삼각함수/수열 핵심 개념을 백지 복습으로 출력",
      "개념 직후 쉬운 기출로 적용 루틴 고정",
      "오답을 계산/개념/해석으로 분류해 재풀이",
    ],
    "수학II": [
      "극한/연속/미분 핵심 정의를 문제 조건과 연결",
      "접선/증감/그래프 해석을 시간 제한 훈련으로 반복",
      "중난도 문항에서 풀이 순서(조건 정리→전략 선택) 고정",
    ],
  };

  const electiveTemplates = {
    확률과통계: {
      strategy: [
        "조건부확률/이항분포/통계 추정 파트를 유형별로 정리",
        "경우의 수는 식 세우기 전에 분기 시나리오를 먼저 작성",
        "실수 잦은 계산은 포맷(사건 정의→경우 계산→검산)으로 고정",
      ],
      checkpoints: [
        "확통 대표 유형을 풀이 흐름으로 설명 가능",
        "경우의 수 누락 실수가 눈에 띄게 감소",
        "모의고사 확통 파트 시간 초과 빈도 감소",
      ],
    },
    미적분: {
      strategy: [
        "수열의 극한/급수/미분법을 개념-유형-기출 순으로 연결",
        "준킬러는 계산보다 조건 해석 우선 전략으로 접근",
        "고난도 문항은 1차 접근 실패 시 회수 규칙까지 포함해 훈련",
      ],
      checkpoints: [
        "미적분 준킬러 문항 정답률 상승",
        "풀이 시작 전 시나리오 설계 습관 정착",
        "30번대 문항에서 시간 관리 안정화",
      ],
    },
    기하: {
      strategy: [
        "벡터/공간도형/이차곡선 공식을 그림-식으로 연결 암기",
        "도형 조건을 좌표화하는 기준 절차를 반복 훈련",
        "문항당 핵심 단서 2개를 먼저 찾고 계산을 시작",
      ],
      checkpoints: [
        "기하 필수 공식 회상 속도 향상",
        "좌표화/벡터화 접근 실패율 감소",
        "실전에서 도형 해석 시간이 단축",
      ],
    },
  };

  const selected = electiveTemplates[electiveSubject] || electiveTemplates["미적분"];

  if (name.includes("현우진")) {
    return {
      common_subjects: {
        ...baseCommon,
        "수학II": [
          "미분 주요 유형을 기출 구조 중심으로 정리",
          "중난도 이상 문항에서 풀이 선택 이유를 기록",
          "실전 세트로 풀이 속도와 정확도를 동시에 관리",
        ],
      },
      elective_strategy: selected.strategy,
      elective_checkpoints: selected.checkpoints,
    };
  }

  if (name.includes("정승제")) {
    return {
      common_subjects: {
        ...baseCommon,
        "수학I": [
          "노베이스 기준 핵심 정의/성질을 짧게 반복",
          "개념 직후 기본 유형 문제로 즉시 적용",
          "틀린 문제는 해설 암기 대신 원리 설명으로 복기",
        ],
      },
      elective_strategy: selected.strategy,
      elective_checkpoints: selected.checkpoints,
    };
  }

  return {
    common_subjects: baseCommon,
    elective_strategy: selected.strategy,
    elective_checkpoints: selected.checkpoints,
  };
}

function matchBookSubject(book, electiveSubject) {
  const tags = asArray(book?.subjectTags).map((x) => toText(x));
  if (!tags.length) return true;
  return tags.includes("공통") || tags.includes(electiveSubject);
}

function matchInstructorSubject(instructor, electiveSubject) {
  const tags = asArray(instructor?.subjectTags).map((x) => toText(x));
  if (!tags.length) return true;
  return tags.includes("공통") || tags.includes(electiveSubject);
}

function scoreInstructor(instructor, electiveSubject) {
  let score = 0;
  const tags = asArray(instructor?.subjectTags).map((x) => toText(x));
  const sourceLevel = toText(instructor?.sourceLevel).toLowerCase();
  const confidence = Number.isFinite(Number(instructor?.confidence))
    ? Number(instructor.confidence)
    : 0.6;

  if (tags.includes(electiveSubject)) score += 4;
  if (tags.includes("공통")) score += 2;
  if (sourceLevel.includes("official")) score += 3;
  if (sourceLevel.includes("community")) score += 1;
  score += Math.max(0, Math.min(1, confidence)) * 2;

  return score;
}

function scoreSourceReliability(item) {
  const sourceLevel = toText(item?.sourceLevel).toLowerCase();
  const confidence = Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : 0.6;

  let score = 0;
  if (sourceLevel.includes("official")) score += 3;
  if (sourceLevel.includes("community")) score += 1;
  score += Math.max(0, Math.min(1, confidence)) * 2;
  return score;
}

function buildAnalyzePrompt({
  currentGrade,
  targetGrade,
  curriculumKey,
  knowledgeBlend,
  recommendationSeed,
  electiveSubject,
  mathStructure,
}) {
  const stepText = asArray(knowledgeBlend.steps)
    .slice(0, 8)
    .map((s) => `- ${toText(s.title)}: ${toText(s.detail)}`)
    .join("\n");
  const cautionText = asArray(knowledgeBlend.cautions)
    .slice(0, 6)
    .map((c) => `- ${toText(c)}`)
    .join("\n");
  const studyMethodText = asArray(knowledgeBlend?.buckets?.study_methods)
    .slice(0, 6)
    .map((item) => `- ${toText(item)}`)
    .join("\n");
  const learningRoutineText = asArray(knowledgeBlend?.buckets?.learning_routines)
    .slice(0, 6)
    .map((item) => `- ${toText(item)}`)
    .join("\n");

  const instructorSeed = asArray(recommendationSeed.instructors)
    .slice(0, 4)
    .map((x) => {
      const curriculum = asArray(x.curriculum_path).slice(0, 2).join(" | ");
      const reviews = asArray(x.review_points).slice(0, 2).join(" | ");
      return `- ${toText(x.name)} (${toText(x.platform)}): ${toText(x.reason)} / ${toText(x.best_for)} / 커리:${curriculum} / 후기:${reviews}`;
    })
    .join("\n");

  const bookSeed = asArray(recommendationSeed.books)
    .slice(0, 8)
    .map(
      (x) =>
        `- ${toText(x.title)} | ${toText(x.type)} | ${toText(x.when_to_use)} | ${toText(x.purpose)}`
    )
    .join("\n");

  const subjectCurriculumSeed = asArray(recommendationSeed.subject_curriculum)
    .slice(0, 4)
    .map((x) => {
      const s1 = asArray(x?.common_subjects?.["수학I"]).slice(0, 2).join(" / ");
      const s2 = asArray(x?.common_subjects?.["수학II"]).slice(0, 2).join(" / ");
      const es = asArray(x?.elective_subject?.strategy).slice(0, 2).join(" / ");
      return `- ${toText(x.name)}: 수학I(${s1}) | 수학II(${s2}) | ${toText(x?.elective_subject?.subject)}(${es})`;
    })
    .join("\n");

  return [
    `현재등급: ${currentGrade}`,
    `목표등급: ${targetGrade}`,
    `구간: ${curriculumKey}`,
    `선택과목: ${electiveSubject}`,
    "",
    "현재 수능 수학 체계:",
    `- 공통: ${asArray(mathStructure?.current_csat?.common).join(", ")}`,
    `- 선택: ${asArray(mathStructure?.current_csat?.elective_options).join(", ")}`,
    `- 응시 규칙: ${toText(mathStructure?.current_csat?.rule)}`,
    "",
    "아래는 우리가 학습한 지식 요약입니다. 이 근거를 우선으로 추론하세요.",
    `핵심: ${toText(knowledgeBlend.core)}`,
    `실행 단계:\n${stepText || "- 없음"}`,
    `주의점:\n${cautionText || "- 없음"}`,
    `수학 공부법 축:\n${studyMethodText || "- 없음"}`,
    `학습 루틴 축:\n${learningRoutineText || "- 없음"}`,
    `키워드: ${asArray(knowledgeBlend.keywords).join(", ")}`,
    "",
    "아래는 추천 리소스 후보입니다. 학생 수준에 맞게 선별해서 제안하세요.",
    `강사 후보:\n${instructorSeed || "- 없음"}`,
    `교재 후보:\n${bookSeed || "- 없음"}`,
    `강사별 과목 커리큘럼 후보:\n${subjectCurriculumSeed || "- 없음"}`,
    "",
    "반드시 JSON 객체만 반환하세요.",
    `중요: selected_elective는 반드시 "${electiveSubject}"로 고정하세요.`,
    "스키마:",
    "{",
    '  "student_feedback": "string",',
    '  "current_focus": {',
    '    "headline": "string",',
    '    "why_now": "string",',
    '    "actions": ["string"],',
    '    "daily_plan": "string",',
    '    "caution": "string"',
    "  },",
    '  "period_plan": [',
    "    {",
    '      "period": "3~6모 전",',
    '      "goal": "string",',
    '      "actions": ["string"],',
    '      "checkpoints": ["string"],',
    '      "caution": "string"',
    "    },",
    "    {",
    '      "period": "6~9모",',
    '      "goal": "string",',
    '      "actions": ["string"],',
    '      "checkpoints": ["string"],',
    '      "caution": "string"',
    "    },",
    "    {",
    '      "period": "9모~수능 전",',
    '      "goal": "string",',
    '      "actions": ["string"],',
    '      "checkpoints": ["string"],',
    '      "caution": "string"',
    "    }",
    "  ],",
    '  "knowledge_buckets": {',
    '    "math_study_methods": ["string"],',
    '    "lecture_and_books": ["string"],',
    '    "learning_routines": ["string"]',
    "  },",
    '  "math_structure": {',
    '    "as_of": "string",',
    '    "current_csat": {',
    '      "type": "string",',
    '      "common": ["string"],',
    '      "elective_options": ["string"],',
    '      "rule": "string"',
    "    },",
    '    "note_2028": {',
    '      "effective_exam_year": "string",',
    '      "summary": "string"',
    "    }",
    "  },",
    '  "selected_elective": "string",',
    '  "subject_curriculum": [',
    "    {",
    '      "name": "string",',
    '      "platform": "string",',
    '      "common_subjects": {',
    '        "수학I": ["string"],',
    '        "수학II": ["string"]',
    "      },",
    '      "elective_subject": {',
    '        "subject": "string",',
    '        "strategy": ["string"],',
    '        "checkpoints": ["string"]',
    "      }",
    "    }",
    "  ],",
    '  "recommended_instructors": [',
    "    {",
    '      "name": "string",',
    '      "platform": "string",',
    '      "best_for": "string",',
    '      "reason": "string",',
    '      "usage": "string",',
    '      "style_summary": "string",',
    '      "curriculum_path": ["string"],',
    '      "review_points": ["string"]',
    "    }",
    "  ],",
    '  "recommended_books": [',
    "    {",
    '      "title": "string",',
    '      "type": "string",',
    '      "purpose": "string",',
    '      "when_to_use": "string",',
    '      "difficulty": "string",',
    '      "reason": "string"',
    "    }",
    "  ],",
    '  "final_tip": "string"',
    "}",
    "",
    "중요: 영상 제목/출처 링크는 절대 쓰지 마세요.",
  ].join("\n");
}

function getModelCandidates() {
  const candidates = [AI_MODEL, AI_FALLBACK_MODEL]
    .map((x) => toText(x))
    .filter(Boolean);
  return [...new Set(candidates)];
}

async function requestPlanJson(userPrompt, modelName) {
  const systemPrompt = [
    "너는 수능 수학 학습 코치다.",
    "학생의 현재등급/목표등급과 학습된 지식 요약을 바탕으로 실천 가능한 학습 계획을 만든다.",
    "출처 링크/영상 제목은 노출하지 않는다.",
    "반드시 JSON 객체만 반환한다.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI API 오류 (${response.status})`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("모델 응답이 비어 있습니다.");
  return parseJsonSafely(content);
}

function parseJsonSafely(text) {
  const cleaned = String(text || "").replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("JSON 파싱에 실패했습니다.");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function normalizePlan(raw, {
  knowledgeBlend,
  recommendationSeed,
  currentGrade,
  targetGrade,
  electiveSubject,
  mathStructure,
}) {
  const periodDefaults = ["3~6모 전", "6~9모", "9모~수능 전"];

  const periodPlan = asArray(raw?.period_plan)
    .slice(0, 3)
    .map((item, idx) => ({
      period: toText(item?.period, periodDefaults[idx] || `구간 ${idx + 1}`),
      goal: toText(item?.goal, `${periodDefaults[idx] || `구간 ${idx + 1}`} 핵심 목표 설정`),
      actions: asArray(item?.actions).map((x) => toText(x)).filter(Boolean).slice(0, 6),
      checkpoints: asArray(item?.checkpoints)
        .map((x) => toText(x))
        .filter(Boolean)
        .slice(0, 5),
      caution: toText(item?.caution, "오답 복기와 시간 관리 루틴을 반드시 유지하세요."),
    }));

  const fallback = createFallbackPlan({
    currentGrade,
    targetGrade,
    knowledgeBlend,
    recommendationSeed,
    electiveSubject,
    mathStructure,
  });

  const normalizedInstructors = asArray(raw?.recommended_instructors)
    .map((x) => ({
      name: toText(x?.name),
      platform: toText(x?.platform),
      best_for: toText(x?.best_for),
      reason: toText(x?.reason),
      usage: toText(x?.usage),
      style_summary: toText(x?.style_summary),
      curriculum_path: asArray(x?.curriculum_path).map((t) => toText(t)).filter(Boolean).slice(0, 6),
      review_points: asArray(x?.review_points).map((t) => toText(t)).filter(Boolean).slice(0, 3),
    }))
    .filter((x) => x.name)
    .slice(0, 4);

  const normalizedBooks = asArray(raw?.recommended_books)
    .map((x) => ({
      title: toText(x?.title),
      type: toText(x?.type),
      purpose: toText(x?.purpose),
      when_to_use: toText(x?.when_to_use),
      difficulty: toText(x?.difficulty),
      reason: toText(x?.reason),
    }))
    .filter((x) => x.title)
    .slice(0, 8);

  const normalizedSubjectCurriculum = asArray(raw?.subject_curriculum)
    .map((x) => ({
      name: toText(x?.name),
      platform: toText(x?.platform),
      common_subjects: {
        "수학I": asArray(x?.common_subjects?.["수학I"]).map((t) => toText(t)).filter(Boolean).slice(0, 5),
        "수학II": asArray(x?.common_subjects?.["수학II"]).map((t) => toText(t)).filter(Boolean).slice(0, 5),
      },
      elective_subject: {
        subject: electiveSubject,
        strategy: asArray(x?.elective_subject?.strategy).map((t) => toText(t)).filter(Boolean).slice(0, 5),
        checkpoints: asArray(x?.elective_subject?.checkpoints)
          .map((t) => toText(t))
          .filter(Boolean)
          .slice(0, 5),
      },
    }))
    .filter((x) => x.name)
    .slice(0, 4);

  const normalizedKnowledgeBuckets = {
    math_study_methods: asArray(raw?.knowledge_buckets?.math_study_methods)
      .map((item) => toText(item))
      .filter(Boolean)
      .slice(0, 8),
    lecture_and_books: asArray(raw?.knowledge_buckets?.lecture_and_books)
      .map((item) => toText(item))
      .filter(Boolean)
      .slice(0, 10),
    learning_routines: asArray(raw?.knowledge_buckets?.learning_routines)
      .map((item) => toText(item))
      .filter(Boolean)
      .slice(0, 10),
  };

  return {
    student_feedback: toText(
      raw?.student_feedback,
      `${currentGrade}등급에서 ${targetGrade}등급으로 가기 위해서는 학습량보다 학습 구조를 먼저 고정해야 합니다.`
    ),
    current_focus: {
      headline: toText(raw?.current_focus?.headline, "지금 시기: 개념 출력 + 쉬운 기출 즉시 적용"),
      why_now: toText(
        raw?.current_focus?.why_now,
        "기초 개념을 출력형으로 바꾸지 않으면 이후 고난도 구간에서 점수가 정체되기 쉽습니다."
      ),
      actions: asArray(raw?.current_focus?.actions)
        .map((x) => toText(x))
        .filter(Boolean)
        .slice(0, 6),
      daily_plan: toText(
        raw?.current_focus?.daily_plan,
        "하루 2~3시간: 개념 출력 40% + 문제 적용 40% + 오답 복기 20%"
      ),
      caution: toText(
        raw?.current_focus?.caution,
        "강의만 듣고 넘어가지 말고 반드시 말하기/쓰기로 출력하세요."
      ),
    },
    period_plan: periodPlan.length ? periodPlan : fallback.period_plan,
    knowledge_buckets: {
      math_study_methods:
        normalizedKnowledgeBuckets.math_study_methods.length > 0
          ? normalizedKnowledgeBuckets.math_study_methods
          : fallback.knowledge_buckets.math_study_methods,
      lecture_and_books:
        normalizedKnowledgeBuckets.lecture_and_books.length > 0
          ? normalizedKnowledgeBuckets.lecture_and_books
          : fallback.knowledge_buckets.lecture_and_books,
      learning_routines:
        normalizedKnowledgeBuckets.learning_routines.length > 0
          ? normalizedKnowledgeBuckets.learning_routines
          : fallback.knowledge_buckets.learning_routines,
    },
    math_structure: raw?.math_structure && typeof raw.math_structure === "object"
      ? raw.math_structure
      : mathStructure,
    selected_elective: electiveSubject,
    subject_curriculum:
      normalizedSubjectCurriculum.length > 0
        ? normalizedSubjectCurriculum
        : fallback.subject_curriculum,
    recommended_instructors:
      normalizedInstructors.length > 0
        ? normalizedInstructors
        : fallback.recommended_instructors,
    recommended_books: normalizedBooks.length > 0 ? normalizedBooks : fallback.recommended_books,
    final_tip: toText(
      raw?.final_tip,
      "꾸준함은 기본이고, 핵심은 같은 실수를 줄이는 구조화된 복기입니다."
    ),
  };
}

function createFallbackPlan({
  currentGrade,
  targetGrade,
  knowledgeBlend,
  recommendationSeed,
  electiveSubject,
  mathStructure,
}) {
  const cautions = asArray(knowledgeBlend?.cautions).map((c) => toText(c)).filter(Boolean);
  const usefulCautions = cautions.filter((c) => hasStudyKeyword(c) && c.length >= 12);
  const template = buildFallbackTemplateByGrade(currentGrade);

  const instructors = asArray(recommendationSeed.instructors)
    .slice(0, 4)
    .map((x) => ({
      name: toText(x.name),
      platform: toText(x.platform),
      best_for: toText(x.best_for),
      reason: toText(x.reason),
      usage: toText(x.usage),
      style_summary: toText(x.style_summary),
      curriculum_path: asArray(x.curriculum_path).map((t) => toText(t)).filter(Boolean).slice(0, 6),
      review_points: asArray(x.review_points).map((t) => toText(t)).filter(Boolean).slice(0, 3),
    }));

  const books = asArray(recommendationSeed.books)
    .slice(0, 8)
    .map((x) => ({
      title: toText(x.title),
      type: toText(x.type),
      purpose: toText(x.purpose),
      when_to_use: toText(x.when_to_use),
      difficulty: toText(x.difficulty),
      reason: toText(x.reason),
    }));

  const subjectCurriculum = asArray(recommendationSeed.subject_curriculum)
    .slice(0, 4)
    .map((x) => ({
      name: toText(x.name),
      platform: toText(x.platform),
      common_subjects: {
        "수학I": asArray(x?.common_subjects?.["수학I"]).map((t) => toText(t)).filter(Boolean).slice(0, 5),
        "수학II": asArray(x?.common_subjects?.["수학II"]).map((t) => toText(t)).filter(Boolean).slice(0, 5),
      },
      elective_subject: {
        subject: toText(x?.elective_subject?.subject, electiveSubject),
        strategy: asArray(x?.elective_subject?.strategy).map((t) => toText(t)).filter(Boolean).slice(0, 5),
        checkpoints: asArray(x?.elective_subject?.checkpoints)
          .map((t) => toText(t))
          .filter(Boolean)
          .slice(0, 5),
      },
    }));

  const lectureAndBooks = [
    ...instructors.slice(0, 4).flatMap((inst) => {
      const base = `${inst.name} (${inst.platform}) - ${inst.best_for}`;
      const curriculum = asArray(inst.curriculum_path).slice(0, 2).map((line) => `${inst.name} 커리: ${line}`);
      return [base, ...curriculum];
    }),
    ...books.slice(0, 6).map((book) => `${book.title} [${book.type}] - ${book.purpose}`),
  ].slice(0, 10);

  return {
    student_feedback:
      `${currentGrade}등급에서 ${targetGrade}등급으로 올리려면 "많이 푸는 것"보다 ` +
      "개념-적용-복기 순서를 고정하는 것이 먼저입니다.",
    current_focus: {
      headline: template.currentFocus.headline,
      why_now: template.currentFocus.whyNow,
      actions: template.currentFocus.actions,
      daily_plan: "하루 2~3시간: 개념 출력 40% + 문제 적용 40% + 오답 복기 20%",
      caution: usefulCautions[0] || "문제 수만 늘리고 복기를 빼면 성적이 고정됩니다.",
    },
    period_plan: [
      {
        period: "3~6모 전",
        goal: "개념 출력 루틴 정착 + 쉬운 기출 연결",
        actions: template.period_3_6.actions,
        checkpoints: [
          "개념을 노트 없이 설명 가능",
          "쉬운 기출 정답률 70% 이상",
          "오답 노트 주 3회 이상 업데이트",
        ],
        caution: usefulCautions[1] || "강의 시청만으로 공부를 끝내지 마세요.",
      },
      {
        period: "6~9모",
        goal: "유형 확장 + 시간 관리 고정",
        actions: template.period_6_9.actions,
        checkpoints: [
          "중난도 정답률 상승 추세 확보",
          "시간 초과 문항 수 감소",
          "실수 유형 3개 이하로 축소",
        ],
        caution: usefulCautions[2] || "한 문제에 과도하게 매달리지 마세요.",
      },
      {
        period: "9모~수능 전",
        goal: "실전 안정화 + 실수 최소화",
        actions: template.period_9_suneung.actions,
        checkpoints: [
          "실전 점수 변동폭 감소",
          "반복 실수 항목 제거",
          "시험 당일 루틴 확정",
        ],
        caution: usefulCautions[3] || "새로운 교재/새로운 방법을 과하게 늘리지 마세요.",
      },
    ],
    knowledge_buckets: {
      math_study_methods: asArray(knowledgeBlend?.buckets?.study_methods).slice(0, 8),
      lecture_and_books: lectureAndBooks,
      learning_routines: asArray(knowledgeBlend?.buckets?.learning_routines).slice(0, 10),
    },
    math_structure: mathStructure,
    selected_elective: electiveSubject,
    subject_curriculum: subjectCurriculum,
    recommended_instructors: instructors,
    recommended_books: books,
    final_tip:
      "목표 등급은 하루치 완벽함보다, 같은 실수를 줄여가는 누적 루틴에서 나옵니다.",
  };
}

function buildFallbackTemplateByGrade(currentGrade) {
  if (currentGrade >= 6) {
    return {
      currentFocus: {
        headline: "지금 시기: 개념 공백 메우기 + 쉬운 기출 연결",
        whyNow:
          "중위권 이상으로 올라가려면 개념을 아는 상태가 아니라, 문제에서 꺼내 쓸 수 있는 상태로 바꿔야 합니다.",
        actions: [
          "단원별 핵심 정의와 공식을 백지에 쓰고 말로 설명하기",
          "쉬운 기출 10~20문항으로 개념 적용 루틴 만들기",
          "오답을 개념/해석/계산으로 나눠 같은 날 재풀이하기",
          "문항당 제한 시간을 정해 막히면 넘기는 연습하기",
        ],
      },
      period_3_6: {
        actions: [
          "개념서 1회독 + 유형서 병행으로 빈 단원 최소화",
          "쉬운 기출 위주로 공통 과목 정확도 우선",
          "매일 30분 오답 복기 시간 고정",
        ],
      },
      period_6_9: {
        actions: [
          "중난도 기출 비중을 늘려 해석 속도 끌어올리기",
          "주 2~3회 실전 세트로 시간 배분 훈련",
          "실수 유형 3개를 정해 집중 교정하기",
        ],
      },
      period_9_suneung: {
        actions: [
          "실전 모드로 풀이 순서 고정 후 반복",
          "자주 틀리는 단원만 압축 복습",
          "새 교재 확장보다 기존 오답 완전 제거에 집중",
        ],
      },
    };
  }

  if (currentGrade >= 4) {
    return {
      currentFocus: {
        headline: "지금 시기: 기출 구조화 + 준킬러 대비",
        whyNow:
          "3등급 진입의 핵심은 기출을 유형별로 구조화하고, 준킬러 문항에서 풀이 선택 기준을 세우는 것입니다.",
        actions: [
          "최근 기출을 단원/유형별로 분류해 재풀이 루틴 구축",
          "준킬러 문항은 풀이 시작 전 접근 시나리오를 먼저 작성",
          "오답 노트에 실수 원인과 재발 방지 규칙을 함께 기록",
          "주 3회 제한 시간 세트로 실전 집중력 훈련",
        ],
      },
      period_3_6: {
        actions: [
          "공통 과목 개념 빈틈 점검 후 기출 유형별 1차 정리",
          "선택 과목은 자주 출제되는 유형부터 우선 정복",
          "정답률보다 해석 과정의 일관성을 우선 점검",
        ],
      },
      period_6_9: {
        actions: [
          "준킬러 중심 N제/기출 혼합 훈련",
          "시간 부족 구간을 분석해 풀이 순서 최적화",
          "실전 세트 후 24시간 내 복기 완료",
        ],
      },
      period_9_suneung: {
        actions: [
          "실전 모의고사로 점수 변동폭 최소화",
          "틀리는 유형만 압축 반복해 정확도 고정",
          "당일 컨디션/멘탈 루틴까지 시험 모드로 맞추기",
        ],
      },
    };
  }

  return {
    currentFocus: {
      headline: "지금 시기: 킬러 접근력보다 실수 제로화 우선",
      whyNow:
        "상위권은 새 개념보다 실전 정확도와 선택/집중 전략이 점수 차이를 만듭니다.",
      actions: [
        "킬러 문항은 풀이 전에 조건 구조와 시나리오를 먼저 설계",
        "실전 세트에서 계산 실수/판단 실수를 분리해 복기",
        "고난도 문항은 풀이 시간 상한선을 정하고 회수 전략 연습",
        "매일 핵심 개념 압축 노트로 유지 관리",
      ],
    },
    period_3_6: {
      actions: [
        "준킬러/킬러 접근법 표준화",
        "기출 고난도 문항을 풀이 논리 중심으로 재정리",
        "계산 정확도 훈련을 매일 루틴화",
      ],
    },
    period_6_9: {
      actions: [
        "실전 세트 주 3~4회로 시간 운영 최적화",
        "킬러 문항은 완주보다 점수 기대값 중심으로 접근",
        "자주 틀리는 계산 패턴 집중 보정",
      ],
    },
    period_9_suneung: {
      actions: [
        "새 교재 확장 중단, 기존 자료 완성도 극대화",
        "EBS/기출 연계 포인트 최종 점검",
        "시험 당일 루틴(선택 순서/검산 타이밍) 확정",
      ],
    },
  };
}

function sanitizeKnowledgeText(value) {
  const text = toText(value);
  return text.replace(/\s+/g, " ").trim();
}

function looksLikeGibberish(text) {
  if (!text) return true;
  const weird = (text.match(/[�?]/g) || []).length;
  return weird > Math.max(3, text.length * 0.25);
}

function isUsefulTitle(text) {
  const value = toText(text);
  if (!value) return false;
  if (/^action step\s*\d+/i.test(value)) return false;
  if (/time control/i.test(value)) return false;
  if (/past-exam link/i.test(value)) return false;
  return true;
}

function isUsefulStudyText(text) {
  const value = toText(text);
  if (!value || value.length < 8) return false;
  if (looksLikeGibberish(value)) return false;
  if (/action step|review this risk signal|close your notes/i.test(value)) return false;

  const keywords = [
    "개념",
    "기출",
    "오답",
    "시간",
    "풀이",
    "모의",
    "수능",
    "문항",
    "복습",
    "등급",
    "문제",
    "학습",
    "루틴",
    "적용",
  ];
  if (keywords.some((k) => value.includes(k))) return true;

  const hangulCount = (value.match(/[가-힣]/g) || []).length;
  return hangulCount >= Math.max(6, Math.floor(value.length * 0.35));
}

function hasStudyKeyword(text) {
  const value = toText(text);
  if (!value) return false;
  const keywords = ["개념", "기출", "오답", "시간", "풀이", "모의", "수능", "문항", "복습", "문제", "학습"];
  return keywords.some((k) => value.includes(k));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function dedupeTextList(items) {
  const seen = new Set();
  const out = [];
  for (const item of asArray(items)) {
    const text = toText(item);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function toText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}
