const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");
require("dotenv").config();
const {
  getReportSystemPrompt,
  getReportUserPrompt,
  getFallbackReport,
} = require("./report-prompt-patch");

const app = express();
const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 8787);
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4.1-mini";
const AI_FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || "gpt-4.1-mini";
const ANALYZE_MAX_TOKENS = Number(process.env.ANALYZE_MAX_TOKENS || 900);
const TRACKER_REPORT_MAX_TOKENS = Number(process.env.TRACKER_REPORT_MAX_TOKENS || 380);
const TRACKER_CONSULT_MAX_TOKENS = Number(process.env.TRACKER_CONSULT_MAX_TOKENS || 320);
const TRACKER_REPORT_LOG_WEEKS = Number(process.env.TRACKER_REPORT_LOG_WEEKS || 3);
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || "2mb";
const ELECTIVE_SUBJECTS = ["확률과통계", "미적분", "기하"];
const MIN_INSTRUCTOR_COUNT = 4;
const MIN_BOOK_COUNT = 6;
const ENABLE_SECURITY_HEADERS = parseBooleanEnv(process.env.ENABLE_SECURITY_HEADERS, true);
const ENABLE_RATE_LIMIT = parseBooleanEnv(process.env.ENABLE_RATE_LIMIT, true);
const RATE_LIMIT_WINDOW_MS = clampNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000, 10_000, 600_000);
const RATE_LIMIT_MAX_REQUESTS = clampNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 120, 20, 2000);
const RATE_LIMIT_ANALYZE_MAX = clampNumber(process.env.RATE_LIMIT_ANALYZE_MAX, 40, 5, 400);
const RATE_LIMIT_REPORT_MAX = clampNumber(process.env.RATE_LIMIT_REPORT_MAX, 80, 5, 400);
const RATE_LIMIT_CONSULT_MAX = clampNumber(process.env.RATE_LIMIT_CONSULT_MAX, 80, 5, 400);
const ENFORCE_API_SHARED_SECRET = parseBooleanEnv(process.env.ENFORCE_API_SHARED_SECRET, false);
const API_SHARED_SECRET = toText(process.env.API_SHARED_SECRET);

const DEFAULT_INSTRUCTOR_SEED = [
  {
    name: "현우진",
    platform: "메가스터디",
    fitKeys: ["5-3", "3-1"],
    subjectTags: ["공통", "미적분", "기하"],
    strengths: ["중상위권~상위권 실전 전환", "기출-심화-N제-실전 흐름이 분명함"],
    styleTags: ["빠른 전개", "문항 구조 분석"],
    curriculumPath: [
      { stage: "기초", course: "시발점", material: "개념 교재" },
      { stage: "실전개념", course: "뉴런", material: "실전개념 교재" },
      { stage: "기출", course: "수분감", material: "기출 교재" },
      { stage: "N제", course: "드릴", material: "N제 교재" },
      { stage: "모의", course: "킬링캠프", material: "실전 모의고사" },
    ],
    reviewSummary: ["속도감 있는 전개로 실전 감각 형성에 유리", "복습 루틴 없이 따라가면 누적이 어려움"],
    bestFor: "준킬러 이상 구간에서 점수 상승이 필요한 학생",
    usage: "뉴런-수분감 병행 후 드릴/모의로 실전 적응",
    sourceLevel: "seed",
    confidence: 0.8,
    sourceRefs: [],
  },
  {
    name: "정승제",
    platform: "EBS/이투스",
    fitKeys: ["9-7", "7-5"],
    subjectTags: ["공통", "확률과통계"],
    strengths: ["개념 체계화", "하위권~중위권 접근성"],
    styleTags: ["친절한 설명", "반복 복습 강조"],
    curriculumPath: [
      { stage: "개념", course: "개념 강의", material: "개념 교재" },
      { stage: "유형", course: "유형 강의", material: "유형 교재" },
      { stage: "기출", course: "기출 강의", material: "기출 교재" },
    ],
    reviewSummary: ["개념 공백 보완에 강점", "실전 단계 전환 시 기출/세트 병행 필요"],
    bestFor: "개념 공백이 큰 학생",
    usage: "개념 강의 후 쉬운 기출 즉시 적용",
    sourceLevel: "seed",
    confidence: 0.78,
    sourceRefs: [],
  },
  {
    name: "이미지",
    platform: "대성마이맥",
    fitKeys: ["7-5", "5-3"],
    subjectTags: ["공통", "확률과통계", "미적분"],
    strengths: ["개념-유형 연결", "중위권 실전 전환"],
    styleTags: ["개념 정리", "문제 적용"],
    curriculumPath: [
      { stage: "기초", course: "개념 강의", material: "개념 교재" },
      { stage: "심화", course: "유형/심화 강의", material: "심화 교재" },
      { stage: "N제", course: "N제 강의", material: "N제 교재" },
    ],
    reviewSummary: ["개념 설명이 명확해 중위권 체감도가 높다는 평가"],
    bestFor: "개념은 알지만 적용이 약한 학생",
    usage: "강의 직후 기출/유형 10~20문항 고정",
    sourceLevel: "seed",
    confidence: 0.74,
    sourceRefs: [],
  },
  {
    name: "시대인재 수학 단과",
    platform: "시대인재",
    fitKeys: ["7-5", "5-3", "3-1"],
    subjectTags: ["공통", "확률과통계", "미적분", "기하"],
    strengths: ["실전 세트 중심", "고난도 문항 감각 강화"],
    styleTags: ["실전 중심", "주간 과제"],
    curriculumPath: [
      { stage: "정규", course: "정규 단과", material: "학원 교재" },
      { stage: "보강", course: "취약 보강", material: "보강 자료" },
      { stage: "파이널", course: "실전 모의", material: "모의 자료" },
    ],
    reviewSummary: ["실전 운영 훈련에 효과적이라는 후기가 많음"],
    bestFor: "실전 운영 최적화가 필요한 학생",
    usage: "정규+모의 연계, 오답 복기 루틴 필수",
    sourceLevel: "seed",
    confidence: 0.72,
    sourceRefs: [],
  },
];

const DEFAULT_BOOK_SEED = [
  {
    title: "개념원리 수학I·II",
    type: "개념서",
    fitKeys: ["9-7", "7-5"],
    purpose: "공통 개념 구조화",
    when: "3~6모 전",
    difficulty: "중",
    subjectTags: ["공통"],
    sourceLevel: "seed",
    confidence: 0.8,
    sourceRefs: [],
  },
  {
    title: "RPM 수학I·II",
    type: "유형서",
    fitKeys: ["9-7", "7-5"],
    purpose: "개념 직후 유형 적응",
    when: "개념 직후",
    difficulty: "중",
    subjectTags: ["공통"],
    sourceLevel: "seed",
    confidence: 0.78,
    sourceRefs: [],
  },
  {
    title: "자이스토리 수학I·II",
    type: "기출서",
    fitKeys: ["7-5", "5-3", "3-1"],
    purpose: "기출 기반 유형 정리",
    when: "5~9모",
    difficulty: "중상",
    subjectTags: ["공통"],
    sourceLevel: "seed",
    confidence: 0.82,
    sourceRefs: [],
  },
  {
    title: "수능특강 수학",
    type: "EBS",
    fitKeys: ["9-7", "7-5", "5-3", "3-1"],
    purpose: "연계 대비 + 기본 실전감",
    when: "연중 병행",
    difficulty: "중",
    subjectTags: ["공통", "확률과통계", "미적분", "기하"],
    sourceLevel: "seed",
    confidence: 0.8,
    sourceRefs: [],
  },
  {
    title: "수능완성 수학",
    type: "EBS",
    fitKeys: ["7-5", "5-3", "3-1"],
    purpose: "실전 연계 최종 정리",
    when: "6~수능 전",
    difficulty: "중상",
    subjectTags: ["공통", "확률과통계", "미적분", "기하"],
    sourceLevel: "seed",
    confidence: 0.8,
    sourceRefs: [],
  },
  {
    title: "드릴",
    type: "N제",
    fitKeys: ["3-1", "5-3"],
    purpose: "준킬러/킬러 풀이력 강화",
    when: "6~9모",
    difficulty: "상",
    subjectTags: ["공통", "미적분", "기하"],
    sourceLevel: "seed",
    confidence: 0.72,
    sourceRefs: [],
  },
];

const DATA_DIR = path.join(process.cwd(), "data");
const GENERATED_DIR = path.join(DATA_DIR, "generated");
const KNOWLEDGE_DIR = path.join(DATA_DIR, "knowledge");
const KNOWLEDGE_FILE =
  process.env.KNOWLEDGE_FILE || path.join(KNOWLEDGE_DIR, "knowledge_base.json");
const RECOMMENDATION_FILE =
  process.env.RECOMMENDATION_FILE ||
  path.join(KNOWLEDGE_DIR, "recommendation_catalog.json");
const STUDENT_SUCCESS_FILE =
  process.env.STUDENT_SUCCESS_FILE ||
  path.join(KNOWLEDGE_DIR, "student_success_cases.json");
const QUESTION_SIGNALS_FILE =
  process.env.QUESTION_SIGNALS_FILE ||
  path.join(KNOWLEDGE_DIR, "youtube_question_signals.json");
const SOURCE_REGISTRY_FILE =
  process.env.SOURCE_REGISTRY_FILE ||
  path.join(KNOWLEDGE_DIR, "source_registry.json");
const GSD_DIR = path.join(process.cwd(), "gsd");
const GSD_STATE_FILE = path.join(GSD_DIR, "state.json");
const GSD_DEFAULT_POLICY = {
  process: "GSD + 3agent",
  roles: {
    planer: "what to build only",
    generator: "how to build with emphasis on design quality and originality",
    evaluator: "score + feedback + re-evaluate loop with Playwright when available",
  },
  scoreWeights: {
    designQuality: 35,
    originality: 30,
    completeness: 20,
    functionality: 15,
  },
  sprintDefaults: {
    minIterations: 5,
    maxIterations: 12,
    targetScore: 92,
    nearOptimalDelta: 1.5,
    stablePassStreak: 2,
    withE2E: false,
  },
};

fs.mkdirSync(GENERATED_DIR, { recursive: true });
fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });

app.disable("x-powered-by");
app.set("trust proxy", 1);

if (ENABLE_SECURITY_HEADERS) {
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    if (req.secure || String(req.headers["x-forwarded-proto"]).includes("https")) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    next();
  });
}

const corsOptions = {
  origin(origin, callback) {
    // allow non-browser clients or same-origin server-to-server calls
    if (!origin) return callback(null, true);
    if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error("CORS blocked: origin not allowed"));
  },
};
app.use(cors(corsOptions));

if (ENABLE_RATE_LIMIT) {
  app.use(
    "/api",
    createIpRateLimiter({
      scope: "api",
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
    })
  );
  app.use(
    "/api/analyze",
    createIpRateLimiter({
      scope: "analyze",
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_ANALYZE_MAX,
    })
  );
  app.use(
    "/api/tracker/report",
    createIpRateLimiter({
      scope: "tracker-report",
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_REPORT_MAX,
    })
  );
  app.use(
    "/api/tracker/consult",
    createIpRateLimiter({
      scope: "tracker-consult",
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxRequests: RATE_LIMIT_CONSULT_MAX,
    })
  );
}

if (ENFORCE_API_SHARED_SECRET && API_SHARED_SECRET) {
  app.use("/api", createSharedSecretMiddleware(API_SHARED_SECRET));
}

app.use(express.json({ limit: REQUEST_BODY_LIMIT }));

app.get("/api/health", async (_req, res) => {
  const knowledge = await loadKnowledgeBase();
  const catalog = await loadRecommendationCatalog();
  const successCases = await loadStudentSuccessCases();
  const questionSignals = await loadQuestionSignals();
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
    studentSuccessCases: successCases.cases.length,
    questionSignals: questionSignals.signals.length,
    recommendationUpdatedAt: catalog.updatedAt || null,
  });
});

app.get("/api/knowledge/summary", async (_req, res) => {
  try {
    const knowledge = await loadKnowledgeBase();
    const catalog = await loadRecommendationCatalog();
    const successCases = await loadStudentSuccessCases();
    const questionSignals = await loadQuestionSignals();
    const summary = buildKnowledgeSummary(knowledge, catalog, successCases, questionSignals);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message || "학습 데이터 요약 생성에 실패했습니다." });
  }
});

app.get("/api/workflow", async (_req, res) => {
  try {
    const workflow = await loadWorkflowState();
    res.json({
      ok: true,
      process: workflow.policy.process,
      currentProject: workflow.currentProject,
      hasProject: workflow.hasProject,
      policy: workflow.policy,
      commands: {
        newProject: "npm run gsd:new-project",
        discuss: "npm run gsd:discuss-phase",
        plan: "npm run gsd:plan-phase",
        execute: "npm run gsd:execute-phase",
        verify: "npm run gsd:verify-work",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "워크플로우 상태를 불러오지 못했습니다." });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const from = Number(req.body?.currentGrade);
    const to = Number(req.body?.targetGrade);
    const electiveSubject = normalizeElectiveSubject(req.body?.electiveSubject);
    const passProvider = normalizePassProvider(req.body?.passProvider);

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
    const successCases = await loadStudentSuccessCases();
    const questionSignals = await loadQuestionSignals();
    const sourceRegistry = await loadSourceRegistry();
    const selectedKnowledge = selectKnowledgeItems(knowledge.items, curriculumKey);
    const knowledgeBlend = blendKnowledgeItems(selectedKnowledge);
    const recommendationSeed = buildRecommendationSeed({
      catalog,
      successCases,
      questionSignals,
      curriculumKey,
      currentGrade: from,
      targetGrade: to,
      electiveSubject,
      passProvider,
    });

    const userPrompt = buildAnalyzePrompt({
      currentGrade: from,
      targetGrade: to,
      curriculumKey,
      knowledgeBlend,
      recommendationSeed,
      electiveSubject,
      passProvider,
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
            passProvider,
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
          passProvider,
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
        passProvider,
        mathStructure,
      });
    }

    const evidenceTrace = buildEvidenceTrace({
      selectedKnowledge,
      recommendationSeed,
      sourceRegistry,
    });
    const pastExamGuide = buildPastExamGuide({
      selectedKnowledge,
      knowledgeBlend,
    });
    if (asArray(pastExamGuide?.source_refs).length === 0) {
      pastExamGuide.source_refs = dedupeTextList([
        ...asArray(evidenceTrace?.category_refs?.knowledge_base),
        ...asArray(evidenceTrace?.category_refs?.question_signals),
        ...asArray(evidenceTrace?.category_refs?.success_cases),
      ]).slice(0, 12);
    }
    plan = {
      ...(plan && typeof plan === "object" ? plan : {}),
      past_exam_guide: pastExamGuide,
      evidence_trace: evidenceTrace,
    };

    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const outPath = path.join(GENERATED_DIR, `${jobId}.json`);
    const payload = {
      createdAt: new Date().toISOString(),
      input: { currentGrade: from, targetGrade: to, curriculumKey, electiveSubject, passProvider },
      knowledgeMeta: {
        updatedAt: knowledge.updatedAt || null,
        selectedIds: selectedKnowledge.map((item) => item.id),
        selectedSourceRefs: asArray(evidenceTrace?.category_refs?.knowledge_base).slice(0, 20),
      },
      recommendationMeta: {
        updatedAt: catalog.updatedAt || null,
        sourceRegistryUpdatedAt: sourceRegistry.updatedAt || null,
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
        sourceRegistryUpdatedAt: sourceRegistry.updatedAt || null,
        evidenceSourceCount: Number(evidenceTrace?.total_unique_source_ids || 0),
      },
    });
  } catch (error) {
    console.error("[analyze] error:", error);
    res.status(500).json({ error: error.message || "분석 중 오류가 발생했습니다." });
  }
});

app.post("/api/tracker/report", async (req, res) => {
  try {
    const profile = req.body?.profile || {};
    const weekInput = req.body?.weekInput && typeof req.body.weekInput === "object"
      ? req.body.weekInput
      : null;

    if (weekInput) {
      const normalizedTargetGrade = (() => {
        const raw = toText(profile?.targetGrade);
        if (raw === "1") return "1";
        if (raw === "2-3" || raw === "2" || raw === "3") return "2-3";
        return "4+";
      })();

      const safeProfile = { ...profile, targetGrade: normalizedTargetGrade };
      const safeWeekInput = {
        completedTopics: truncateText(toText(weekInput?.completedTopics), 320),
        difficulties: truncateText(toText(weekInput?.difficulties), 240),
        mockScore: truncateText(toText(weekInput?.mockScore), 24),
      };

      let report = getFallbackReport(safeProfile, safeWeekInput);
      let usedModel = false;
      let usedModelName = null;

      if (OPENAI_API_KEY) {
        const combinedPrompt = [
          getReportSystemPrompt(normalizedTargetGrade),
          "",
          getReportUserPrompt(safeProfile, safeWeekInput),
        ].join("\n");

        for (const modelName of getModelCandidates()) {
          try {
            const text = await requestTextResponse(combinedPrompt, modelName, TRACKER_REPORT_MAX_TOKENS);
            if (toText(text)) {
              report = toText(text);
              usedModel = true;
              usedModelName = modelName;
              break;
            }
          } catch (error) {
            console.warn(`[tracker/report] grade-band model failed (${modelName}): ${error.message}`);
          }
        }
      }

      return res.json({
        report,
        meta: { usedModel, model: usedModelName, mode: "grade-band-text" },
      });
    }

    const logs = asArray(req.body?.logs).slice(0, TRACKER_REPORT_LOG_WEEKS);
    const method = req.body?.method || {};
    const metrics = {
      ...req.body?.metrics,
      allWeakPoints: truncateText(toText(req.body?.metrics?.allWeakPoints), 160),
      allMemos: truncateText(toText(req.body?.metrics?.allMemos), 220),
    };

    const fallback = createTrackerReportFallback(profile, logs, method, metrics);
    let report = fallback;
    let usedModel = false;
    let usedModelName = null;

    if (OPENAI_API_KEY) {
      const prompt = buildTrackerReportPrompt(profile, logs, method, metrics);
      for (const modelName of getModelCandidates()) {
        try {
          const raw = await requestJsonObject(prompt, modelName, TRACKER_REPORT_MAX_TOKENS);
          report = normalizeTrackerReport(raw, fallback);
          usedModel = true;
          usedModelName = modelName;
          break;
        } catch (error) {
          console.warn(`[tracker/report] model failed (${modelName}): ${error.message}`);
        }
      }
    }

    return res.json({
      report,
      meta: { usedModel, model: usedModelName },
    });
  } catch (error) {
    console.error("[tracker/report] error:", error);
    return res.status(500).json({ error: error.message || "주간 리포트 생성 실패" });
  }
});

app.post("/api/tracker/consult", async (req, res) => {
  try {
    const profile = req.body?.profile || {};
    const question = truncateText(toText(req.body?.question), 140);
    const summary = truncateText(toText(req.body?.summary), 260);
    const methodCore = truncateText(toText(req.body?.methodCore), 120);

    if (!question) {
      return res.status(400).json({ error: "question을 입력해주세요." });
    }

    let answer = createTrackerConsultFallback(profile, question, summary, methodCore);
    let usedModel = false;
    let usedModelName = null;

    if (OPENAI_API_KEY) {
      const prompt = buildTrackerConsultPrompt(profile, question, summary, methodCore);
      for (const modelName of getModelCandidates()) {
        try {
          const text = await requestTextResponse(prompt, modelName, TRACKER_CONSULT_MAX_TOKENS);
          if (toText(text)) {
            answer = toText(text);
            usedModel = true;
            usedModelName = modelName;
            break;
          }
        } catch (error) {
          console.warn(`[tracker/consult] model failed (${modelName}): ${error.message}`);
        }
      }
    }

    return res.json({
      answer,
      meta: { usedModel, model: usedModelName },
    });
  } catch (error) {
    console.error("[tracker/consult] error:", error);
    return res.status(500).json({ error: error.message || "AI 컨설팅 생성 실패" });
  }
});

app.use("/api", (_req, res) => {
  return res.status(404).json({ error: "지원하지 않는 API 경로입니다." });
});

app.use((error, _req, res, _next) => {
  console.error("[api] unhandled middleware error:", error);
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const message =
    status >= 500
      ? "서버 내부 오류가 발생했습니다."
      : toText(error?.message, "요청 처리 중 오류가 발생했습니다.");
  return res.status(status).json({ error: message });
});

function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`API server ready: http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

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
  const sanitizedItems = sanitizeKnowledgeItems(asArray(parsed.items));
  return {
    updatedAt: parsed.updatedAt || null,
    items: sanitizedItems,
  };
}

async function loadRecommendationCatalog() {
  if (!fs.existsSync(RECOMMENDATION_FILE)) {
    return { updatedAt: null, instructors: [], books: [] };
  }
  const raw = await fsp.readFile(RECOMMENDATION_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const rawInstructors = asArray(parsed.instructors);
  const rawBooks = asArray(parsed.books);
  const instructors = sanitizeCatalogInstructors(rawInstructors);
  const books = sanitizeCatalogBooks(rawBooks);
  return {
    updatedAt: parsed.updatedAt || null,
    instructors:
      instructors.length >= MIN_INSTRUCTOR_COUNT
        ? instructors
        : mergeUniqueByKey([...instructors, ...DEFAULT_INSTRUCTOR_SEED], "name"),
    books:
      books.length >= MIN_BOOK_COUNT
        ? books
        : mergeUniqueByKey([...books, ...DEFAULT_BOOK_SEED], "title"),
  };
}

async function loadStudentSuccessCases() {
  if (!fs.existsSync(STUDENT_SUCCESS_FILE)) {
    return { updatedAt: null, cases: [] };
  }
  const raw = await fsp.readFile(STUDENT_SUCCESS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const cases = sanitizeStudentSuccessCases(parsed?.cases);
  return {
    updatedAt: parsed?.updatedAt || null,
    cases,
  };
}

async function loadQuestionSignals() {
  if (!fs.existsSync(QUESTION_SIGNALS_FILE)) {
    return { updatedAt: null, signals: [] };
  }
  const raw = await fsp.readFile(QUESTION_SIGNALS_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const signals = sanitizeQuestionSignals(parsed?.signals);
  return {
    updatedAt: parsed?.updatedAt || null,
    signals,
  };
}

async function loadSourceRegistry() {
  if (!fs.existsSync(SOURCE_REGISTRY_FILE)) {
    return { updatedAt: null, sources: [] };
  }
  const raw = await fsp.readFile(SOURCE_REGISTRY_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return {
    updatedAt: parsed?.updatedAt || null,
    sources: sanitizeSourceRegistrySources(parsed?.sources),
  };
}

function sanitizeKnowledgeItems(items) {
  const out = [];
  const seen = new Set();
  for (const item of asArray(items)) {
    const id = toText(item?.id) || hashObject(item).slice(0, 12);
    if (seen.has(id)) continue;
    seen.add(id);

    const core = sanitizeKnowledgeText(item?.core);
    const steps = asArray(item?.steps)
      .map((step) => ({
        title: sanitizeKnowledgeText(step?.title),
        detail: sanitizeKnowledgeText(step?.detail),
      }))
      .filter((step) => isUsefulTitle(step.title) && isUsefulStudyText(step.detail))
      .slice(0, 8);
    const cautions = asArray(item?.cautions)
      .map((text) => sanitizeKnowledgeText(text))
      .filter((text) => isUsefulStudyText(text))
      .slice(0, 5);
    const keywords = asArray(item?.keywords)
      .map((text) => sanitizeKnowledgeText(text))
      .filter((text) => text.length >= 2 && !looksLikeGibberish(text))
      .slice(0, 10);

    if (!isUsefulStudyText(core) && steps.length === 0 && cautions.length === 0) continue;

    out.push({
      ...item,
      id,
      bucket: normalizeBucketName(item?.bucket),
      title: sanitizeKnowledgeText(item?.title),
      source: sanitizeKnowledgeText(item?.source),
      core: isUsefulStudyText(core) ? core : "",
      steps,
      cautions,
      keywords,
      applies_to: normalizeAppliesTo(item?.applies_to),
    });
  }
  return out;
}

function sanitizeSourceRegistrySources(items) {
  const out = [];
  const seen = new Set();
  for (const item of asArray(items)) {
    const id = toText(item?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      type: sanitizeKnowledgeText(item?.type),
      title: sanitizeKnowledgeText(item?.title),
      publisher: sanitizeKnowledgeText(item?.publisher),
      url: toText(item?.url),
      checkedAt: sanitizeKnowledgeText(item?.checkedAt),
    });
  }
  return out;
}

function normalizeAppliesTo(value) {
  const allowed = new Set(["9-7", "7-5", "5-3", "3-1", "all"]);
  const list = asArray(value).map((x) => toText(x)).filter((x) => allowed.has(x));
  return list.length ? list : ["all"];
}

function sanitizeCatalogInstructors(items) {
  return asArray(items)
    .map((item) => ({
      ...item,
      name: sanitizeKnowledgeText(item?.name),
      platform: sanitizeKnowledgeText(item?.platform),
      bestFor: sanitizeKnowledgeText(item?.bestFor),
      usage: sanitizeKnowledgeText(item?.usage),
      strengths: asArray(item?.strengths).map((x) => sanitizeKnowledgeText(x)).filter((x) => isUsefulStudyText(x)).slice(0, 6),
      styleTags: asArray(item?.styleTags).map((x) => sanitizeKnowledgeText(x)).filter((x) => !looksLikeGibberish(x)).slice(0, 8),
      reviewSummary: asArray(item?.reviewSummary).map((x) => sanitizeKnowledgeText(x)).filter((x) => isUsefulStudyText(x)).slice(0, 4),
      subjectTags: asArray(item?.subjectTags).map((x) => sanitizeKnowledgeText(x)).filter(Boolean).slice(0, 6),
      fitKeys: normalizeFitKeys(item?.fitKeys),
      passAvailability: normalizePassAvailability(item?.passAvailability, item?.platform),
      curriculumPath: asArray(item?.curriculumPath)
        .map((step) => ({
          stage: sanitizeKnowledgeText(step?.stage),
          course: sanitizeKnowledgeText(step?.course),
          material: sanitizeKnowledgeText(step?.material),
        }))
        .filter((x) => x.course && !looksLikeGibberish(x.course))
        .slice(0, 8),
      seasonalPlan: asArray(item?.seasonalPlan)
        .map((step) => ({
          period: sanitizeKnowledgeText(step?.period),
          classType: sanitizeKnowledgeText(step?.classType),
          content: sanitizeKnowledgeText(step?.content),
          goal: sanitizeKnowledgeText(step?.goal),
        }))
        .filter((x) => x.period && x.content)
        .slice(0, 6),
      sourceRefs: asArray(item?.sourceRefs).map((x) => toText(x)).filter(Boolean).slice(0, 8),
    }))
    .filter((item) => item.name && !looksLikeGibberish(item.name));
}

function sanitizeCatalogBooks(items) {
  return asArray(items)
    .map((item) => ({
      ...item,
      title: sanitizeKnowledgeText(item?.title),
      type: sanitizeKnowledgeText(item?.type),
      purpose: sanitizeKnowledgeText(item?.purpose),
      when: sanitizeKnowledgeText(item?.when),
      difficulty: sanitizeKnowledgeText(item?.difficulty),
      fitKeys: normalizeFitKeys(item?.fitKeys),
      subjectTags: asArray(item?.subjectTags).map((x) => sanitizeKnowledgeText(x)).filter(Boolean).slice(0, 8),
      providerTags: normalizePassAvailability(item?.providerTags || item?.passAvailability, item?.platform),
      sourceRefs: asArray(item?.sourceRefs).map((x) => toText(x)).filter(Boolean).slice(0, 8),
    }))
    .filter((item) => item.title && !looksLikeGibberish(item.title));
}

function sanitizeStudentSuccessCases(items) {
  return asArray(items)
    .map((item) => ({
      id: toText(item?.id) || hashObject(item).slice(0, 12),
      bandShift: sanitizeKnowledgeText(item?.bandShift),
      duration: sanitizeKnowledgeText(item?.duration),
      summary: sanitizeKnowledgeText(item?.summary),
      coreActions: asArray(item?.coreActions)
        .map((x) => sanitizeKnowledgeText(x))
        .filter((x) => isUsefulStudyText(x))
        .slice(0, 6),
      fitKeys: normalizeFitKeys(item?.fitKeys),
      sourceRefs: asArray(item?.sourceRefs).map((x) => toText(x)).filter(Boolean).slice(0, 6),
      reliability: Number.isFinite(Number(item?.reliability))
        ? Math.max(0, Math.min(1, Number(item.reliability)))
        : 0.6,
    }))
    .filter((item) => item.summary && !looksLikeGibberish(item.summary));
}

function sanitizeQuestionSignals(items) {
  return asArray(items)
    .map((item) => ({
      id: toText(item?.id) || hashObject(item).slice(0, 12),
      channel: sanitizeKnowledgeText(item?.channel),
      focus: sanitizeKnowledgeText(item?.focus),
      learnerQuestion: sanitizeKnowledgeText(item?.learnerQuestion),
      coachingHint: sanitizeKnowledgeText(item?.coachingHint),
      fitKeys: normalizeFitKeys(item?.fitKeys),
      channelHint: sanitizeKnowledgeText(item?.channelHint),
      sourceRefs: asArray(item?.sourceRefs).map((x) => toText(x)).filter(Boolean).slice(0, 6),
      reliability: Number.isFinite(Number(item?.reliability))
        ? Math.max(0, Math.min(1, Number(item.reliability)))
        : 0.6,
    }))
    .filter((item) => item.learnerQuestion && item.coachingHint);
}

function normalizeFitKeys(value) {
  const allowed = new Set(["9-7", "7-5", "5-3", "3-1", "all"]);
  const list = asArray(value).map((x) => toText(x)).filter((x) => allowed.has(x));
  return list.length ? list : ["all"];
}

function normalizePassProvider(value) {
  const text = toText(value).toLowerCase();
  if (text === "megapass") return "megapass";
  if (text === "daesungpass") return "daesungpass";
  if (text === "both") return "both";
  if (text === "none") return "none";
  return "both";
}

function inferPassAvailabilityFromPlatform(platform) {
  const value = toText(platform).toLowerCase();
  if (value.includes("mega")) return ["megapass", "both"];
  if (value.includes("mimac") || value.includes("daesung") || value.includes("대성")) {
    return ["daesungpass", "both"];
  }
  return ["both"];
}

function normalizePassAvailability(value, platform) {
  const allowed = new Set(["megapass", "daesungpass", "both", "none"]);
  const list = asArray(value)
    .map((x) => normalizePassProvider(x))
    .filter((x) => allowed.has(x));
  if (list.length) return dedupeTextList(list);
  return inferPassAvailabilityFromPlatform(platform);
}

function normalizeBucketName(value) {
  const text = toText(value).toLowerCase();
  if (["study_methods", "math_study_methods"].includes(text)) return "study_methods";
  if (["lecture_books", "lecture_and_books"].includes(text)) return "lecture_books";
  if (["learning_routines"].includes(text)) return "learning_routines";
  return "study_methods";
}

function mergeUniqueByKey(items, key) {
  const out = [];
  const seen = new Set();
  for (const item of asArray(items)) {
    const value = toText(item?.[key]).toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(item);
  }
  return out;
}

function hashObject(value) {
  return crypto.createHash("sha1").update(JSON.stringify(value || {})).digest("hex");
}

function selectKnowledgeItems(items, curriculumKey) {
  const primary = items.filter((item) => appliesTo(item, curriculumKey));
  const fallback = items.filter((item) => appliesTo(item, "all"));
  const pool = [...primary, ...fallback];
  if (!pool.length) return items.slice(0, 10);

  const limits = [
    { bucket: "study_methods", max: 5 },
    { bucket: "lecture_books", max: 4 },
    { bucket: "learning_routines", max: 3 },
  ];

  const seen = new Set();
  const selected = [];
  for (const { bucket, max } of limits) {
    const picked = pool
      .filter((item) => isBucket(item?.bucket, bucket))
      .slice(0, max);
    for (const item of picked) {
      const key = toText(item?.id) || JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(item);
    }
  }

  for (const item of pool) {
    if (selected.length >= 12) break;
    const key = toText(item?.id) || JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(item);
  }

  return selected.length ? selected.slice(0, 12) : items.slice(0, 10);
}

function buildKnowledgeSummary(knowledge, catalog, successCases, questionSignals) {
  const allItems = asArray(knowledge?.items);
  const studyMethods = dedupeTextList(
    allItems
      .filter((item) => isBucket(item?.bucket, "study_methods"))
      .map((item) => sanitizeKnowledgeText(item?.core))
      .filter((text) => isUsefulStudyText(text))
  ).slice(0, 8);

  const learningRoutines = dedupeTextList(
    allItems
      .filter((item) => isBucket(item?.bucket, "learning_routines"))
      .flatMap((item) =>
        asArray(item?.steps).map((step) => sanitizeKnowledgeText(`${toText(step?.title)}: ${toText(step?.detail)}`))
      )
      .filter((text) => isUsefulStudyText(text))
  ).slice(0, 10);

  const lectureKnowledgeNotes = dedupeTextList(
    allItems
      .filter((item) => isBucket(item?.bucket, "lecture_books"))
      .flatMap((item) => {
        const core = sanitizeKnowledgeText(item?.core);
        const steps = asArray(item?.steps).map((step) =>
          sanitizeKnowledgeText(`${toText(step?.title)}: ${toText(step?.detail)}`)
        );
        return [core, ...steps];
      })
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

  const successCaseItems = asArray(successCases?.cases)
    .slice(0, 10)
    .map((item) => ({
      bandShift: toText(item?.bandShift),
      summary: toText(item?.summary),
      coreActions: asArray(item?.coreActions).map((x) => toText(x)).filter(Boolean).slice(0, 3),
    }))
    .filter((item) => item.summary);

  const questionSignalsItems = asArray(questionSignals?.signals)
    .slice(0, 10)
    .map((item) => ({
      focus: toText(item?.focus),
      learnerQuestion: toText(item?.learnerQuestion),
      coachingHint: toText(item?.coachingHint),
      channel: toText(item?.channel),
    }))
    .filter((item) => item.learnerQuestion && item.coachingHint);

  return {
    updatedAt:
      knowledge?.updatedAt ||
      catalog?.updatedAt ||
      successCases?.updatedAt ||
      questionSignals?.updatedAt ||
      null,
    categories: {
      study_methods: studyMethods,
      lecture_and_books: {
        instructors,
        books,
        notes: lectureKnowledgeNotes,
      },
      learning_routines: learningRoutines,
      student_success_cases: successCaseItems,
      question_signals: questionSignalsItems,
    },
  };
}

function appliesTo(item, key) {
  if (!Array.isArray(item?.applies_to)) return false;
  return item.applies_to.includes(key);
}

function isBucket(value, canonical) {
  const text = toText(value).toLowerCase();
  const aliases = {
    study_methods: ["study_methods", "math_study_methods", "수학 공부법"],
    lecture_books: ["lecture_books", "lecture_and_books", "강의·교재 추천"],
    learning_routines: ["learning_routines", "학습 루틴"],
  };
  const allowed = aliases[canonical] || [canonical];
  return allowed.map((x) => String(x).toLowerCase()).includes(text);
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
    .filter((item) => isBucket(item?.bucket, "study_methods"))
    .map((item) => sanitizeKnowledgeText(item?.core))
    .filter((text) => isUsefulStudyText(text))
    .slice(0, 8);

  const lectureBooks = sourceItems
    .filter((item) => isBucket(item?.bucket, "lecture_books"))
    .flatMap((item) => {
      const core = sanitizeKnowledgeText(item?.core);
      const stepLines = asArray(item?.steps)
        .map((step) => sanitizeKnowledgeText(`${toText(step?.title)}: ${toText(step?.detail)}`));
      return [core, ...stepLines];
    })
    .filter((text) => isUsefulStudyText(text))
    .slice(0, 16);

  const learningRoutines = sourceItems
    .filter((item) => isBucket(item?.bucket, "learning_routines"))
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
      lecture_books:
        lectureBooks.length > 0
          ? dedupeTextList(lectureBooks).slice(0, 12)
          : [
              "강사 선택은 대상 등급/수업 속도/복습 체계를 기준으로 결정하세요.",
              "교재 선택은 현재 실력보다 반 단계 높은 난이도로 맞추세요.",
            ],
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

function hasPastExamKeyword(text) {
  const value = toText(text);
  if (!value) return false;
  return ["기출", "오답", "재풀이", "복기", "회독", "실모", "모의고사", "문항", "풀이"].some((keyword) =>
    value.includes(keyword)
  );
}

function buildPastExamGuide({ selectedKnowledge, knowledgeBlend }) {
  const pastKnowledgeItems = asArray(selectedKnowledge).filter((item) => {
    if (hasPastExamKeyword(item?.core)) return true;
    if (asArray(item?.keywords).some((k) => hasPastExamKeyword(k))) return true;
    if (asArray(item?.steps).some((step) => hasPastExamKeyword(step?.title) || hasPastExamKeyword(step?.detail))) {
      return true;
    }
    if (asArray(item?.cautions).some((line) => hasPastExamKeyword(line))) return true;
    return false;
  });

  const principleCandidates = dedupeTextList(
    pastKnowledgeItems
      .map((item) => sanitizeKnowledgeText(item?.core))
      .filter((line) => isUsefulStudyText(line))
  );

  const actionCandidates = dedupeTextList(
    pastKnowledgeItems.flatMap((item) =>
      asArray(item?.steps).map((step) => sanitizeKnowledgeText(`${toText(step?.title)}: ${toText(step?.detail)}`))
    )
  ).filter((line) => isUsefulStudyText(line));

  const cautionCandidates = dedupeTextList(
    pastKnowledgeItems
      .flatMap((item) => asArray(item?.cautions))
      .map((line) => sanitizeKnowledgeText(line))
      .filter((line) => isUsefulStudyText(line))
  );

  const fallbackActions = asArray(knowledgeBlend?.steps)
    .map((step) => sanitizeKnowledgeText(`${toText(step?.title)}: ${toText(step?.detail)}`))
    .filter((line) => isUsefulStudyText(line) && hasPastExamKeyword(line))
    .slice(0, 5);
  const fallbackCautions = asArray(knowledgeBlend?.cautions)
    .map((line) => sanitizeKnowledgeText(line))
    .filter((line) => isUsefulStudyText(line) && hasPastExamKeyword(line))
    .slice(0, 4);

  const sourceRefs = dedupeTextList([
    ...pastKnowledgeItems.flatMap((item) => asArray(item?.sourceRefs).map((x) => toText(x)).filter(Boolean)),
    ...asArray(selectedKnowledge).flatMap((item) => asArray(item?.sourceRefs).map((x) => toText(x)).filter(Boolean)),
  ]).slice(0, 12);

  return {
    headline: "기출 학습은 문제 수가 아니라 재현 가능한 풀이 루틴과 복기 구조가 핵심입니다.",
    core_principles:
      principleCandidates.length > 0
        ? principleCandidates.slice(0, 5)
        : [
            "기출은 단원별 정답률보다 문항 해석-풀이 선택-검산 루틴의 안정화에 초점을 둡니다.",
            "오답은 즉시 재풀이보다 판단 근거를 기록하고 24~72시간 간격 재현으로 고정합니다.",
          ],
    action_steps:
      actionCandidates.length > 0
        ? actionCandidates.slice(0, 6)
        : fallbackActions.length > 0
          ? fallbackActions
          : [
              "기출 1세트 풀이 후 틀린 문항을 개념/조건해석/계산실수로 분류합니다.",
              "오답 24시간 내 1차, 72시간 내 2차 재풀이로 같은 실수를 끊습니다.",
              "주 1회 실전 시간 제한 세트로 풀이 순서와 포기 기준을 고정합니다.",
            ],
    common_failures:
      cautionCandidates.length > 0
        ? cautionCandidates.slice(0, 5)
        : fallbackCautions.length > 0
          ? fallbackCautions
          : [
              "문항 수만 늘리고 오답 근거 기록을 생략하면 점수 변동이 커집니다.",
              "새 교재를 계속 바꾸면 기출 재현 루틴이 누적되지 않습니다.",
            ],
    source_refs: sourceRefs,
  };
}

function collectSourceRefs(items, fieldName, maxCount = 12) {
  return dedupeTextList(
    asArray(items).flatMap((item) => asArray(item?.[fieldName]).map((x) => toText(x)).filter(Boolean))
  ).slice(0, maxCount);
}

function buildEvidenceTrace({ selectedKnowledge, recommendationSeed, sourceRegistry }) {
  const categoryRefs = {
    knowledge_base: collectSourceRefs(selectedKnowledge, "sourceRefs", 20),
    instructor_recommendations: collectSourceRefs(recommendationSeed?.instructors, "source_refs", 20),
    book_recommendations: collectSourceRefs(recommendationSeed?.books, "source_refs", 20),
    success_cases: collectSourceRefs(recommendationSeed?.student_success_cases, "source_refs", 20),
    question_signals: collectSourceRefs(recommendationSeed?.question_signals, "source_refs", 20),
  };

  const registryMap = new Map(
    asArray(sourceRegistry?.sources)
      .map((src) => [toText(src?.id), src])
      .filter((entry) => entry[0])
  );

  const sourceToCategories = new Map();
  for (const [category, refs] of Object.entries(categoryRefs)) {
    for (const refId of asArray(refs)) {
      const prev = sourceToCategories.get(refId) || new Set();
      prev.add(category);
      sourceToCategories.set(refId, prev);
    }
  }

  const resolvedSources = [];
  const unresolvedSourceIds = [];
  for (const [id, categorySet] of sourceToCategories.entries()) {
    const info = registryMap.get(id);
    if (!info) {
      unresolvedSourceIds.push(id);
      continue;
    }
    resolvedSources.push({
      id,
      type: toText(info?.type),
      title: toText(info?.title),
      publisher: toText(info?.publisher),
      url: toText(info?.url),
      checked_at: toText(info?.checkedAt) || null,
      categories: [...categorySet],
    });
  }

  return {
    category_refs: categoryRefs,
    total_unique_source_ids: sourceToCategories.size,
    resolved_sources: resolvedSources.slice(0, 40),
    unresolved_source_ids: unresolvedSourceIds.slice(0, 20),
  };
}

function buildRecommendationSeed({
  catalog,
  successCases,
  questionSignals,
  curriculumKey,
  currentGrade,
  targetGrade,
  electiveSubject,
  passProvider,
}) {
  const allInstructors = asArray(catalog.instructors);
  const allBooks = asArray(catalog.books);
  const allSuccessCases = asArray(successCases?.cases);
  const allQuestionSignals = asArray(questionSignals?.signals);
  const normalizedPassProvider = normalizePassProvider(passProvider);

  const validatedInstructorPool = allInstructors.filter((item) => hasValidatedCommunityEvidence(item));
  const sourceInstructorPool = validatedInstructorPool.length >= 4 ? validatedInstructorPool : allInstructors;
  const instructorBasePool = sourceInstructorPool
    .filter((item) => matchInstructorSubject(item, electiveSubject))
    .filter((item) => matchInstructorPassProvider(item, normalizedPassProvider));
  const profiledInstructorBasePool = filterInstructorsForProfile(instructorBasePool, {
    currentGrade,
    targetGrade,
  });

  const instructorPool = profiledInstructorBasePool
    .filter((item) => fitMatch(item.fitKeys, curriculumKey))
    .sort(
      (a, b) =>
        scoreInstructor(b, electiveSubject, normalizedPassProvider, currentGrade) -
        scoreInstructor(a, electiveSubject, normalizedPassProvider, currentGrade)
    )
    .slice(0, 12);
  const fallbackInstructorPool = profiledInstructorBasePool
    .filter((item) => fitMatch(item.fitKeys, "all"))
    .sort(
      (a, b) =>
        scoreInstructor(b, electiveSubject, normalizedPassProvider, currentGrade) -
        scoreInstructor(a, electiveSubject, normalizedPassProvider, currentGrade)
    )
    .slice(0, 4);
  const finalFallbackInstructorPool =
    instructorPool.length + fallbackInstructorPool.length >= 4
      ? []
      : filterInstructorsForProfile(
          allInstructors
            .filter((item) => fitMatch(item.fitKeys, curriculumKey) || fitMatch(item.fitKeys, "all"))
            .filter((item) => matchInstructorSubject(item, electiveSubject))
            .filter((item) => matchInstructorPassProvider(item, normalizedPassProvider)),
          { currentGrade, targetGrade }
        )
          .sort(
            (a, b) =>
              scoreInstructor(b, electiveSubject, normalizedPassProvider, currentGrade) -
              scoreInstructor(a, electiveSubject, normalizedPassProvider, currentGrade)
          )
          .slice(0, 6);

  const instructors = dedupeByName([
    ...instructorPool,
    ...fallbackInstructorPool,
    ...finalFallbackInstructorPool,
  ]).slice(0, 4).map((x) => ({
    name: toText(x.name),
    platform: toText(x.platform),
    pass_availability: asArray(x.passAvailability).map((v) => normalizePassProvider(v)).filter(Boolean),
    best_for: toText(x.bestFor),
    reason: buildRecommendationReason({
      lines: [...asArray(x.strengths), ...asArray(x.reviewSummary)],
      fallback: asArray(x.strengths).map((s) => toText(s)).filter(Boolean).slice(0, 2).join(", "),
      maxCount: 2,
    }),
    usage: toText(x.usage),
    style_summary: asArray(x.styleTags).map((s) => toText(s)).filter(Boolean).join(", "),
    curriculum_path: asArray(x.curriculumPath)
      .slice(0, 6)
      .map((step) => `${toText(step?.stage)}: ${toText(step?.course)} (${toText(step?.material)})`),
    seasonal_plan: asArray(x.seasonalPlan)
      .slice(0, 5)
      .map(
        (step) =>
          `${toText(step?.period)} | ${toText(step?.classType)} | ${toText(step?.content)} | 목표: ${toText(step?.goal)}`
      ),
    review_points: asArray(x.reviewSummary).map((s) => toText(s)).filter(Boolean).slice(0, 3),
    source_refs: asArray(x.sourceRefs).map((s) => toText(s)).filter(Boolean).slice(0, 6),
  }));

  const bookBasePool = allBooks
    .filter((item) => fitMatch(item.fitKeys, curriculumKey))
    .filter((item) => matchBookSubject(item, electiveSubject))
    .filter((item) => matchBookPassProvider(item, normalizedPassProvider));
  const profiledBookPool = filterBooksForProfile(bookBasePool, { currentGrade, targetGrade });

  const books = profiledBookPool
    .sort((a, b) => {
      const byProfileScore = scoreBookForProfile(b, currentGrade, targetGrade) - scoreBookForProfile(a, currentGrade, targetGrade);
      if (byProfileScore !== 0) return byProfileScore;
      return scoreSourceReliability(b) - scoreSourceReliability(a);
    })
    .slice(0, 12)
    .map((x) => ({
      title: toText(x.title),
      type: toText(x.type),
      level_band: toText(x.levelBand),
      purpose: toText(x.purpose),
      when_to_use: toText(x.when),
      difficulty: toText(x.difficulty),
      provider_tags: asArray(x.providerTags).map((v) => normalizePassProvider(v)).filter(Boolean),
      source_refs: asArray(x.sourceRefs).map((s) => toText(s)).filter(Boolean).slice(0, 6),
      reason: buildRecommendationReason({
        lines: [
          `${toText(x.levelBand)} level`,
          `${toText(x.purpose)} 중심`,
          `${toText(x.when)} 시기에 활용`,
          `${toText(x.type)} ${toText(x.difficulty)} 난이도 대응`,
        ],
        fallback: `${toText(x.purpose)} 중심으로 ${toText(x.when)}에 사용`,
        maxCount: 2,
      }),
    }));

  const subject_curriculum = buildSubjectCurriculumSeed({
    instructors,
    electiveSubject,
    currentGrade,
  });

  const student_success_cases = allSuccessCases
    .filter((item) => fitMatch(item.fitKeys, curriculumKey))
    .sort((a, b) => Number(b?.reliability || 0) - Number(a?.reliability || 0))
    .slice(0, 5)
    .map((item) => ({
      band_shift: toText(item?.bandShift),
      duration: toText(item?.duration),
      summary: toText(item?.summary),
      core_actions: asArray(item?.coreActions).map((x) => toText(x)).filter(Boolean).slice(0, 3),
      source_refs: asArray(item?.sourceRefs).map((x) => toText(x)).filter(Boolean).slice(0, 4),
      reliability: Number.isFinite(Number(item?.reliability))
        ? Math.max(0, Math.min(1, Number(item.reliability)))
        : 0.6,
    }));

  const question_signals = allQuestionSignals
    .filter((item) => fitMatch(item.fitKeys, curriculumKey))
    .sort((a, b) => Number(b?.reliability || 0) - Number(a?.reliability || 0))
    .slice(0, 6)
    .map((item) => ({
      channel: toText(item?.channel),
      focus: toText(item?.focus),
      learner_question: toText(item?.learnerQuestion),
      coaching_hint: toText(item?.coachingHint),
      channel_hint: toText(item?.channelHint),
      source_refs: asArray(item?.sourceRefs).map((x) => toText(x)).filter(Boolean).slice(0, 4),
      reliability: Number.isFinite(Number(item?.reliability))
        ? Math.max(0, Math.min(1, Number(item.reliability)))
        : 0.6,
    }));

  return { instructors, books, subject_curriculum, student_success_cases, question_signals };
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
  const difficulty = toText(book?.difficulty).toLowerCase();
  const isHigh = difficulty.includes("상") || difficulty.includes("high");
  const isMedium = difficulty.includes("중") || difficulty.includes("medium");
  const isLow = difficulty.includes("하") || difficulty.includes("low");

  if (grade >= 7) {
    if (isLow) return 3;
    if (isMedium) return 2;
    if (isHigh) return 0;
    return 1;
  }
  if (grade >= 4) {
    if (isMedium) return 3;
    if (isLow) return 2;
    if (isHigh) return 2;
    return 1;
  }
  if (isHigh) return 3;
  if (isMedium) return 2;
  if (isLow) return 0;
  return 1;
}

function scoreBookForProfile(book, currentGrade, targetGrade) {
  let score = scoreBookByGrade(book, currentGrade);
  if (isTopTierProfile(currentGrade, targetGrade)) {
    if (isEbsLikeBook(book)) score -= 8;
    if (isHighTierPracticalBook(book)) score += 3;
  } else if (Number.isFinite(Number(currentGrade)) && Number(currentGrade) >= 6) {
    if (isEbsLikeBook(book)) score += 1;
  }
  return score;
}

function isTopTierProfile(currentGrade, targetGrade) {
  const current = Number(currentGrade);
  const target = Number(targetGrade);
  return (Number.isFinite(current) && current <= 2) || (Number.isFinite(target) && target <= 1);
}

function isEbsLikeBook(book) {
  const blob = [book?.title, book?.type, book?.purpose, book?.when, book?.when_to_use]
    .map((x) => toText(x).toLowerCase())
    .join(" ");
  return /(ebs|ebsi|suneungteukgang|suneungwanseong|수능특강|수능완성|수특|수완)/i.test(blob);
}

function isHighTierPracticalBook(book) {
  const blob = [book?.title, book?.type, book?.purpose, book?.when, book?.when_to_use]
    .map((x) => toText(x).toLowerCase())
    .join(" ");
  return /(n제|n-set|nset|실모|모의|mock|survival|서바|킬러|파이널|academy|단과|두각|시대인재)/i.test(blob);
}

function isEbsLikeInstructor(instructor) {
  const blob = [
    instructor?.name,
    instructor?.platform,
    instructor?.best_for,
    instructor?.reason,
    ...(asArray(instructor?.styleTags)),
  ]
    .map((x) => toText(x).toLowerCase())
    .join(" ");
  return /(ebs|ebsi|e-toos|etoos)/i.test(blob);
}

function filterBooksForProfile(books, { currentGrade, targetGrade }) {
  const list = asArray(books);
  if (!isTopTierProfile(currentGrade, targetGrade)) return list;
  const filtered = list.filter((book) => !isEbsLikeBook(book));
  return filtered.length >= 4 ? filtered : list;
}

function filterLectureBookHintsForProfile(lines, { currentGrade, targetGrade }) {
  const list = asArray(lines).map((x) => toText(x)).filter(Boolean);
  if (!isTopTierProfile(currentGrade, targetGrade)) return list;
  const filtered = list.filter((line) => !isEbsLikeBook({ title: line, type: line, purpose: line }));
  return filtered.length >= 4 ? filtered : list;
}

function filterInstructorsForProfile(instructors, { currentGrade, targetGrade }) {
  const list = asArray(instructors);
  if (!isTopTierProfile(currentGrade, targetGrade)) return list;
  const filtered = list.filter((inst) => !isEbsLikeInstructor(inst));
  return filtered.length >= 2 ? filtered : list;
}

function buildRecommendationPolicyNote(currentGrade, targetGrade) {
  if (isTopTierProfile(currentGrade, targetGrade)) {
    return "상위권 정책: EBS 연계 교재/강의는 보조 점검용으로만 사용하고, 주교재·주강의는 실전형(N제/실모/검증된 단과) 중심으로 제안";
  }
  if (Number.isFinite(Number(currentGrade)) && Number(currentGrade) >= 6) {
    return "기초권 정책: 개념/유형 안정화 후 기출-실전으로 단계 전환";
  }
  return "중위권 정책: 기출 구조화 + 준킬러 대응 + 실전 시간관리 균형";
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

function matchBookPassProvider(book, passProvider) {
  const normalized = normalizePassProvider(passProvider);
  if (normalized === "both" || normalized === "none") return true;
  const tags = normalizePassAvailability(book?.providerTags, book?.platform);
  if (!tags.length) return true;
  return tags.includes("both") || tags.includes(normalized);
}

function matchInstructorSubject(instructor, electiveSubject) {
  const tags = asArray(instructor?.subjectTags).map((x) => toText(x));
  if (!tags.length) return true;
  return tags.includes("공통") || tags.includes(electiveSubject);
}

function matchInstructorPassProvider(instructor, passProvider) {
  const normalized = normalizePassProvider(passProvider);
  if (normalized === "both" || normalized === "none") return true;
  const availability = normalizePassAvailability(instructor?.passAvailability, instructor?.platform);
  if (!availability.length) return true;
  return availability.includes("both") || availability.includes(normalized);
}

function hasValidatedCommunityEvidence(instructor) {
  const refs = asArray(instructor?.sourceRefs).map((x) => toText(x).toLowerCase()).filter(Boolean);
  const sourceLevel = toText(instructor?.sourceLevel).toLowerCase();
  const hasOfficialRef = refs.some((ref) => ref.startsWith("official-") || ref.includes("official"));
  const hasCommunityRef = refs.some(
    (ref) => ref.startsWith("orbi-") || ref.includes("community") || ref.includes("review")
  );
  if (sourceLevel.includes("official") && sourceLevel.includes("community")) return true;
  return hasOfficialRef && hasCommunityRef;
}

function scoreInstructor(instructor, electiveSubject, passProvider = "both", currentGrade = null) {
  let score = 0;
  const tags = asArray(instructor?.subjectTags).map((x) => toText(x));
  const sourceLevel = toText(instructor?.sourceLevel).toLowerCase();
  const confidence = Number.isFinite(Number(instructor?.confidence))
    ? Number(instructor.confidence)
    : 0.6;
  const normalizedPass = normalizePassProvider(passProvider);
  const passAvailability = normalizePassAvailability(instructor?.passAvailability, instructor?.platform);

  if (tags.includes(electiveSubject)) score += 4;
  if (tags.includes("공통")) score += 2;
  if (normalizedPass !== "both" && normalizedPass !== "none") {
    if (passAvailability.includes(normalizedPass)) score += 2;
    if (passAvailability.includes("both")) score += 1;
  }
  if (sourceLevel.includes("official")) score += 3;
  if (sourceLevel.includes("community")) score += 1;
  if (sourceLevel.includes("youtube")) score += 1;
  if (Number.isFinite(Number(currentGrade)) && Number(currentGrade) <= 3 && isOnsiteAcademyInstructor(instructor)) {
    score += 2;
  }
  score += Math.max(0, Math.min(1, confidence)) * 2;

  return score;
}

function isOnsiteAcademyInstructor(instructor) {
  const blob = [
    instructor?.name,
    instructor?.platform,
    ...(asArray(instructor?.styleTags)),
    ...(asArray(instructor?.sourceRefs)),
  ]
    .map((x) => toText(x).toLowerCase())
    .join(" ");
  return /(sidae|sdij|dugak|sii|onsite|academy|gangnam daesung)/i.test(blob);
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

function buildRecommendationReason({ lines, fallback = "", maxCount = 2 }) {
  const candidates = [];
  const seen = new Set();
  for (const line of asArray(lines)) {
    for (const sentence of splitReasonSentences(line)) {
      const text = sanitizeKnowledgeText(sentence);
      if (!text) continue;
      const key = normalizeReasonKey(text);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const score = scoreReasonSentence(text);
      if (score < 1) continue;
      candidates.push({ text, score });
    }
  }

  const picked = candidates
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.text.length - a.text.length;
    })
    .slice(0, Math.max(1, maxCount))
    .map((item) => item.text);

  if (picked.length) return picked.join(" / ");
  return toText(fallback);
}

function splitReasonSentences(value) {
  const text = toText(value);
  if (!text) return [];
  return text
    .split(/\r?\n|[|/;]+/g)
    .map((part) => sanitizeKnowledgeText(part))
    .filter(Boolean);
}

function normalizeReasonKey(text) {
  return toText(text)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");
}

function scoreReasonSentence(text) {
  const value = sanitizeKnowledgeText(text);
  if (!value) return 0;
  if (looksLikeGibberish(value)) return 0;

  const compactLength = value.replace(/\s+/g, "").length;
  if (compactLength < 8) return 0;

  let score = 0;
  if (compactLength >= 12) score += 2;
  if (compactLength >= 18) score += 1;
  if (compactLength > 90) score -= 1;

  if (hasReasonKeyword(value)) score += 2;
  if (hasStudyKeyword(value)) score += 1;
  if (/(좋다|최고|무조건|강추|대박|인생강의)/.test(value) && !hasReasonKeyword(value)) score -= 2;

  return score;
}

function hasReasonKeyword(text) {
  const value = toText(text);
  if (!value) return false;
  const keywords = [
    "개념",
    "기출",
    "적용",
    "복습",
    "오답",
    "실전",
    "루틴",
    "커리큘럼",
    "강의",
    "교재",
    "난이도",
    "등급",
    "문항",
    "학습",
    "시간",
  ];
  return keywords.some((k) => value.includes(k));
}

function buildAnalyzePrompt({
  currentGrade,
  targetGrade,
  curriculumKey,
  knowledgeBlend,
  recommendationSeed,
  electiveSubject,
  passProvider,
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
  const lectureBookText = asArray(knowledgeBlend?.buckets?.lecture_books)
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
      const seasonal = asArray(x.seasonal_plan).slice(0, 2).join(" | ");
      const reviews = asArray(x.review_points).slice(0, 2).join(" | ");
      const pass = asArray(x.pass_availability).map((v) => normalizePassProvider(v)).filter(Boolean).join(",");
      return `- ${toText(x.name)} (${toText(x.platform)}): ${toText(x.reason)} / ${toText(
        x.best_for
      )} / 패스:${pass || "both"} / 커리:${curriculum} / 시기별:${seasonal} / 후기:${reviews}`;
    })
    .join("\n");

  const bookSeed = asArray(recommendationSeed.books)
    .slice(0, 8)
    .map(
      (x) =>
        `- ${toText(x.title)} | ${toText(x.type)} | ${toText(x.level_band)} | ${toText(
          x.when_to_use
        )} | ${toText(x.purpose)} | refs:${asArray(x.source_refs).slice(0, 2).join(", ")}`
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

  const successCaseSeed = asArray(recommendationSeed.student_success_cases)
    .slice(0, 5)
    .map((x) => {
      const actions = asArray(x.core_actions).slice(0, 2).join(" / ");
      return `- ${toText(x.band_shift)} (${toText(x.duration)}): ${toText(x.summary)} | 행동:${actions}`;
    })
    .join("\n");

  const questionSignalSeed = asArray(recommendationSeed.question_signals)
    .slice(0, 6)
    .map(
      (x) =>
        `- [${toText(x.channel)}] ${toText(x.learner_question)} -> 코칭힌트: ${toText(
          x.coaching_hint
        )}`
    )
    .join("\n");
  const recommendationPolicy = buildRecommendationPolicyNote(currentGrade, targetGrade);

  return [
    `현재등급: ${currentGrade}`,
    `목표등급: ${targetGrade}`,
    `구간: ${curriculumKey}`,
    `선택과목: ${electiveSubject}`,
    `인강패스: ${normalizePassProvider(passProvider)}`,
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
    `강의·교재 축:\n${lectureBookText || "- 없음"}`,
    `학습 루틴 축:\n${learningRoutineText || "- 없음"}`,
    `키워드: ${asArray(knowledgeBlend.keywords).join(", ")}`,
    "",
    "아래는 추천 리소스 후보입니다. 학생 수준에 맞게 선별해서 제안하세요.",
    `추천 정책: ${recommendationPolicy}`,
    `강사 후보:\n${instructorSeed || "- 없음"}`,
    `교재 후보:\n${bookSeed || "- 없음"}`,
    `강사별 과목 커리큘럼 후보:\n${subjectCurriculumSeed || "- 없음"}`,
    `실제 성과 사례 요약:\n${successCaseSeed || "- 없음"}`,
    `학생 질문/댓글 패턴:\n${questionSignalSeed || "- 없음"}`,
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
    '      "pass_availability": ["megapass|daesungpass|both"],',
      '      "curriculum_path": ["string"],',
      '      "seasonal_plan": ["string"],',
      '      "review_points": ["string"],',
      '      "source_refs": ["string"]',
    "    }",
  "  ],",
  '  "recommended_books": [',
    "    {",
      '      "title": "string",',
      '      "type": "string",',
      '      "level_band": "intro_nje|mid_nje|high_nje|general",',
      '      "purpose": "string",',
      '      "when_to_use": "string",',
      '      "difficulty": "string",',
      '      "provider_tags": ["megapass|daesungpass|both"],',
      '      "reason": "string"',
    "    }",
    "  ],",
    '  "success_case_insights": ["string"],',
    '  "question_trend_insights": ["string"],',
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
      max_tokens: ANALYZE_MAX_TOKENS,
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

async function requestJsonObject(userPrompt, modelName, maxTokens = TRACKER_REPORT_MAX_TOKENS) {
  const systemPrompt = [
    "너는 수능 수학 학습 코치다.",
    "반드시 JSON 객체만 반환한다.",
    "마크다운 코드블록 없이 순수 JSON만 반환한다.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
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

async function requestTextResponse(userPrompt, modelName, maxTokens = TRACKER_CONSULT_MAX_TOKENS) {
  const systemPrompt = "너는 수능 수학 학습 코치다. 한국어로 간결하고 실천적으로 답한다.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.35,
      max_tokens: maxTokens,
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
  return toText(data?.choices?.[0]?.message?.content);
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

async function loadWorkflowState() {
  let state = null;
  try {
    const raw = await fsp.readFile(GSD_STATE_FILE, "utf8");
    state = parseJsonSafely(raw);
  } catch {
    state = null;
  }

  const currentProject = toText(state?.currentProject);
  let policy = GSD_DEFAULT_POLICY;

  if (currentProject) {
    const policyFile = path.join(GSD_DIR, currentProject, "06_process_policy.json");
    try {
      const raw = await fsp.readFile(policyFile, "utf8");
      const parsed = parseJsonSafely(raw);
      policy = mergeWorkflowPolicy(parsed);
    } catch {
      policy = GSD_DEFAULT_POLICY;
    }
  }

  return {
    currentProject: currentProject || null,
    hasProject: Boolean(currentProject),
    policy,
  };
}

function mergeWorkflowPolicy(raw) {
  if (!raw || typeof raw !== "object") return GSD_DEFAULT_POLICY;
  return {
    ...GSD_DEFAULT_POLICY,
    ...raw,
    roles: {
      ...GSD_DEFAULT_POLICY.roles,
      ...(raw.roles || {}),
    },
    scoreWeights: {
      ...GSD_DEFAULT_POLICY.scoreWeights,
      ...(raw.scoreWeights || {}),
    },
    sprintDefaults: {
      ...GSD_DEFAULT_POLICY.sprintDefaults,
      ...(raw.sprintDefaults || {}),
    },
  };
}

function normalizePlan(raw, {
  knowledgeBlend,
  recommendationSeed,
  currentGrade,
  targetGrade,
  electiveSubject,
  passProvider,
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
      reason: buildRecommendationReason({
        lines: [x?.reason, x?.best_for],
        fallback: toText(x?.reason),
        maxCount: 2,
      }),
      pass_availability: asArray(x?.pass_availability).map((v) => normalizePassProvider(v)).filter(Boolean),
      usage: toText(x?.usage),
      style_summary: toText(x?.style_summary),
      curriculum_path: asArray(x?.curriculum_path).map((t) => toText(t)).filter(Boolean).slice(0, 6),
      seasonal_plan: asArray(x?.seasonal_plan).map((t) => toText(t)).filter(Boolean).slice(0, 5),
      review_points: asArray(x?.review_points).map((t) => toText(t)).filter(Boolean).slice(0, 3),
      source_refs: asArray(x?.source_refs).map((t) => toText(t)).filter(Boolean).slice(0, 6),
    }))
    .filter((x) => x.name)
    .slice(0, 4);
  const profileNormalizedInstructors = filterInstructorsForProfile(normalizedInstructors, {
    currentGrade,
    targetGrade,
  });

  const normalizedBooks = asArray(raw?.recommended_books)
    .map((x) => ({
      title: toText(x?.title),
      type: toText(x?.type),
      level_band: toText(x?.level_band),
      purpose: toText(x?.purpose),
      when_to_use: toText(x?.when_to_use),
      difficulty: toText(x?.difficulty),
      provider_tags: asArray(x?.provider_tags).map((v) => normalizePassProvider(v)).filter(Boolean),
      source_refs: asArray(x?.source_refs).map((t) => toText(t)).filter(Boolean).slice(0, 6),
      reason: buildRecommendationReason({
        lines: [x?.reason, x?.purpose, x?.when_to_use, x?.level_band],
        fallback: toText(x?.reason),
        maxCount: 2,
      }),
    }))
    .filter((x) => x.title)
    .slice(0, 8);
  const profileNormalizedBooks = filterBooksForProfile(normalizedBooks, {
    currentGrade,
    targetGrade,
  });

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
  const profileLectureAndBooks = filterLectureBookHintsForProfile(
    normalizedKnowledgeBuckets.lecture_and_books,
    { currentGrade, targetGrade }
  );
  const fallbackLectureAndBooks = filterLectureBookHintsForProfile(
    fallback.knowledge_buckets.lecture_and_books,
    { currentGrade, targetGrade }
  );

  const normalizedSuccessCaseInsights = asArray(raw?.success_case_insights)
    .map((x) => toText(x))
    .filter(Boolean)
    .slice(0, 6);

  const normalizedQuestionTrendInsights = asArray(raw?.question_trend_insights)
    .map((x) => toText(x))
    .filter(Boolean)
    .slice(0, 6);

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
        profileLectureAndBooks.length > 0
          ? profileLectureAndBooks
          : fallbackLectureAndBooks,
      learning_routines:
        normalizedKnowledgeBuckets.learning_routines.length > 0
          ? normalizedKnowledgeBuckets.learning_routines
          : fallback.knowledge_buckets.learning_routines,
    },
    math_structure: raw?.math_structure && typeof raw.math_structure === "object"
      ? raw.math_structure
      : mathStructure,
    selected_elective: electiveSubject,
    selected_pass_provider: normalizePassProvider(passProvider),
    subject_curriculum:
      normalizedSubjectCurriculum.length > 0
        ? normalizedSubjectCurriculum
        : fallback.subject_curriculum,
    recommended_instructors:
      profileNormalizedInstructors.length > 0
        ? profileNormalizedInstructors.slice(0, 4)
        : fallback.recommended_instructors,
    recommended_books:
      profileNormalizedBooks.length > 0
        ? profileNormalizedBooks.slice(0, 8)
        : fallback.recommended_books,
    success_case_insights:
      normalizedSuccessCaseInsights.length > 0
        ? normalizedSuccessCaseInsights
        : fallback.success_case_insights,
    question_trend_insights:
      normalizedQuestionTrendInsights.length > 0
        ? normalizedQuestionTrendInsights
        : fallback.question_trend_insights,
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
  passProvider,
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
      pass_availability: asArray(x.pass_availability).map((v) => normalizePassProvider(v)).filter(Boolean),
      usage: toText(x.usage),
      style_summary: toText(x.style_summary),
      curriculum_path: asArray(x.curriculum_path).map((t) => toText(t)).filter(Boolean).slice(0, 6),
      seasonal_plan: asArray(x.seasonal_plan).map((t) => toText(t)).filter(Boolean).slice(0, 5),
      review_points: asArray(x.review_points).map((t) => toText(t)).filter(Boolean).slice(0, 3),
      source_refs: asArray(x.source_refs).map((t) => toText(t)).filter(Boolean).slice(0, 6),
    }));

  const books = asArray(recommendationSeed.books)
    .slice(0, 8)
    .map((x) => ({
      title: toText(x.title),
      type: toText(x.type),
      level_band: toText(x.level_band),
      purpose: toText(x.purpose),
      when_to_use: toText(x.when_to_use),
      difficulty: toText(x.difficulty),
      provider_tags: asArray(x.provider_tags).map((v) => normalizePassProvider(v)).filter(Boolean),
      source_refs: asArray(x.source_refs).map((t) => toText(t)).filter(Boolean).slice(0, 6),
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

  const lectureHints = asArray(knowledgeBlend?.buckets?.lecture_books)
    .map((line) => toText(line))
    .filter(Boolean)
    .slice(0, 5);

  const lectureAndBooks = [
    ...lectureHints,
    ...instructors.slice(0, 4).flatMap((inst) => {
      const base = `${inst.name} (${inst.platform}) - ${inst.best_for}`;
      const curriculum = asArray(inst.curriculum_path).slice(0, 2).map((line) => `${inst.name} 커리: ${line}`);
      const seasonal = asArray(inst.seasonal_plan)
        .slice(0, 1)
        .map((line) => `${inst.name} 시기별: ${line}`);
      return [base, ...curriculum, ...seasonal];
    }),
    ...books
      .slice(0, 6)
      .map((book) => `${book.title} [${book.level_band || "general"} | ${book.type}] - ${book.purpose}`),
  ].slice(0, 10);
  const profileLectureAndBooks = filterLectureBookHintsForProfile(lectureAndBooks, {
    currentGrade,
    targetGrade,
  });

  const successCaseInsights = asArray(recommendationSeed.student_success_cases)
    .slice(0, 4)
    .map((item) => {
      const actions = asArray(item?.core_actions).slice(0, 2).join(" / ");
      return `${toText(item?.band_shift)} 사례: ${toText(item?.summary)}${actions ? ` | 행동: ${actions}` : ""}`;
    });

  const questionTrendInsights = asArray(recommendationSeed.question_signals)
    .slice(0, 5)
    .map(
      (item) =>
        `[${toText(item?.channel)}] ${toText(item?.learner_question)} -> ${toText(item?.coaching_hint)}`
    );

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
      lecture_and_books: profileLectureAndBooks.length > 0 ? profileLectureAndBooks : lectureAndBooks,
      learning_routines: asArray(knowledgeBlend?.buckets?.learning_routines).slice(0, 10),
    },
    math_structure: mathStructure,
    selected_elective: electiveSubject,
    selected_pass_provider: normalizePassProvider(passProvider),
    subject_curriculum: subjectCurriculum,
    recommended_instructors: instructors,
    recommended_books: books,
    success_case_insights: successCaseInsights,
    question_trend_insights: questionTrendInsights,
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
          "기출/실모 회수 포인트 최종 점검",
          "시험 당일 루틴(선택 순서/검산 타이밍) 확정",
        ],
      },
  };
}

function buildTrackerReportPrompt(profile, logs, method, metrics) {
  return [
    "학생 주간 학습 리포트를 JSON으로 생성하세요.",
    `학생: ${toText(profile?.currentGrade)}→${toText(profile?.targetGrade)} / ${toText(profile?.elective, "미적분")}`,
    `핵심: ${truncateText(toText(method?.core), 100)}`,
    `최근기록: ${asArray(logs).map((x) => `${toText(x?.week)}:${toText(String(x?.hours || 0))}h`).join(", ") || "없음"}`,
    `총시간:${toText(String(metrics?.totalHours || 0))} / 평균점수:${Number.isFinite(metrics?.avgScore) ? `${Math.round(metrics.avgScore)}점` : "미측정"}`,
    `취약:${toText(metrics?.allWeakPoints, "없음")}`,
    `메모:${toText(metrics?.allMemos, "없음")}`,
    "아래 키만 포함해서 짧고 실천적으로 작성:",
    "{",
    '  "overall": "string",',
    '  "strengths": ["string"],',
    '  "improvements": ["string"],',
    '  "next_week_plan": ["string"],',
    '  "caution": "string",',
    '  "encouragement": "string"',
    "}",
  ].join("\n");
}

function createTrackerReportFallback(profile, logs, method, metrics) {
  const avg = Number.isFinite(metrics?.avgScore) ? `${Math.round(metrics.avgScore)}점` : "미측정";
  const thisWeekHours = Number(logs?.[0]?.hours || 0);
  const prevWeekHours = Number(logs?.[1]?.hours || 0);
  const delta = thisWeekHours - prevWeekHours;
  const trend = delta > 0 ? `지난주보다 +${delta}시간 증가` : delta < 0 ? `지난주보다 ${delta}시간 감소` : "주간 학습시간 유지";

  return {
    overall: `최근 4주 총 ${Number(metrics?.totalHours || 0)}시간 학습했고 평균 모의 점수는 ${avg}입니다. ${trend} 흐름이며, ${toText(method?.focus, "핵심 루틴 유지")}를 지키면 목표 등급에 더 빠르게 접근할 수 있습니다.`,
    strengths: [
      asArray(logs).length >= 3 ? "학습 기록을 꾸준히 남기며 루틴을 만들고 있어요." : "학습 루틴 구축을 시작한 점이 좋아요.",
      Number(metrics?.totalHours || 0) >= 8 ? "주간 학습량이 상승 구간 진입 기준에 근접해요." : "무리하지 않는 범위에서 지속 학습 흐름을 만들고 있어요.",
    ],
    improvements: [
      "취약 단원을 1~2개로 압축해 집중 보완하세요.",
      "오답 복기를 주 3회 고정해 같은 실수 재발을 줄이세요.",
    ],
    next_week_plan: [
      "월/수/금: 개념 출력 + 쉬운 기출 적용 루틴(90분)",
      "화/목: 취약 단원 보완 + 오답 재풀이",
      "주말: 실전 세트 1회 + 40분 복기 노트 작성",
    ],
    caution: "강의 시청만 늘리고 문제 적용을 미루면 점수 정체가 길어집니다.",
    encouragement: `${toText(profile?.name, "학생")}님은 루틴을 만들 수 있는 힘이 있어요. 다음 주는 '취약 단원 축소 + 오답 복기 고정'만 지켜도 체감이 올 거예요.`,
    generatedAt: new Date().toISOString().slice(0, 10),
  };
}

function normalizeTrackerReport(raw, fallback) {
  if (!raw || typeof raw !== "object") return fallback;
  const strengths = asArray(raw?.strengths).map((x) => toText(x)).filter(Boolean).slice(0, 4);
  const improvements = asArray(raw?.improvements).map((x) => toText(x)).filter(Boolean).slice(0, 4);
  const nextWeekPlan = asArray(raw?.next_week_plan).map((x) => toText(x)).filter(Boolean).slice(0, 5);
  return {
    overall: toText(raw?.overall, fallback.overall),
    strengths: strengths.length ? strengths : fallback.strengths,
    improvements: improvements.length ? improvements : fallback.improvements,
    next_week_plan: nextWeekPlan.length ? nextWeekPlan : fallback.next_week_plan,
    caution: toText(raw?.caution, fallback.caution),
    encouragement: toText(raw?.encouragement, fallback.encouragement),
    generatedAt: new Date().toISOString().slice(0, 10),
  };
}

function buildTrackerConsultPrompt(profile, question, summary, methodCore) {
  return [
    "수능 수학 코치로 답하세요.",
    `학생:${toText(profile?.currentGrade)}→${toText(profile?.targetGrade)} / ${toText(profile?.elective, "미적분")}`,
    `핵심:${truncateText(toText(methodCore), 100)}`,
    `요약:${truncateText(toText(summary), 220)}`,
    `질문:${truncateText(toText(question), 140)}`,
    "원칙: 2~3문단, 실행 행동 3개 이내, 한국어.",
  ].join("\n");
}

function createTrackerConsultFallback(profile, question, summary, methodCore) {
  return [
    `${toText(profile?.currentGrade)}등급에서 ${toText(profile?.targetGrade)}등급으로 가려면 핵심은 "${toText(methodCore, "개념-적용-복기 루틴 고정")}"입니다.`,
    `현재 요약: ${toText(summary, "학습 요약 데이터가 부족합니다.")}`,
    `질문 "${toText(question)}"에 대한 실행 제안: 오늘부터 개념 출력 20분 → 기출 적용 40분 → 오답 복기 20분 루틴을 7일 연속 유지해보세요.`,
    "다음 점검 기준: 이번 주에 같은 유형 오답 재발 횟수가 줄었는지 확인하세요.",
  ].join("\n\n");
}

function createIpRateLimiter({ scope = "api", windowMs = 60_000, maxRequests = 120 }) {
  const bucket = new Map();
  const cleanupInterval = Math.max(windowMs, 60_000);
  let lastCleanupAt = Date.now();

  return (req, res, next) => {
    if (req.method === "OPTIONS") return next();

    const key = `${scope}:${resolveClientIp(req)}`;
    const now = Date.now();
    const current = bucket.get(key);

    let entry = current;
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    entry.count += 1;
    bucket.set(key, entry);

    if (now - lastCleanupAt >= cleanupInterval) {
      for (const [itemKey, itemValue] of bucket.entries()) {
        if (now >= itemValue.resetAt) bucket.delete(itemKey);
      }
      lastCleanupAt = now;
    }

    if (entry.count > maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
        retryAfterSec,
      });
    }

    return next();
  };
}

function createSharedSecretMiddleware(secret) {
  const normalizedSecret = toText(secret);
  return (req, res, next) => {
    if (req.method === "GET") return next();
    const headerValue = toText(req.headers["x-api-shared-secret"]);
    if (!headerValue) {
      return res.status(401).json({ error: "인증 헤더가 필요합니다." });
    }
    if (!secureCompare(headerValue, normalizedSecret)) {
      return res.status(403).json({ error: "인증 값이 유효하지 않습니다." });
    }
    return next();
  };
}

function resolveClientIp(req) {
  const forwarded = toText(req.headers["x-forwarded-for"]);
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return toText(req.ip || req.socket?.remoteAddress || "unknown");
}

function secureCompare(input, secret) {
  const left = Buffer.from(toText(input));
  const right = Buffer.from(toText(secret));
  if (!left.length || !right.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function sanitizeKnowledgeText(value) {
  const text = toText(value)
    .replace(/&middot;/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function truncateText(value, maxLen = 200) {
  const text = toText(value);
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

function looksLikeGibberish(text) {
  if (!text) return true;
  const value = toText(text);
  if (!value) return true;
  const replacementCharCount = (value.match(/[�]/g) || []).length;
  if (replacementCharCount > Math.max(1, value.length * 0.08)) return true;

  // Common mojibake signature: '?' inserted before random Hangul letters.
  const mojibakePatternCount = (value.match(/\?[가-힣a-zA-Z0-9]/g) || []).length;
  if (mojibakePatternCount >= 2) return true;

  const hangulCount = (value.match(/[가-힣]/g) || []).length;
  const latinCount = (value.match(/[a-zA-Z]/g) || []).length;
  const symbolCount = (value.match(/[^가-힣a-zA-Z0-9\s]/g) || []).length;
  if (hangulCount + latinCount < 3 && symbolCount > 2) return true;

  if (/ms\s*\d{4}|&middot;|beta/i.test(value)) return true;
  return false;
}

function isUsefulTitle(text) {
  const value = toText(text);
  if (!value) return false;
  if (looksLikeGibberish(value)) return false;
  if (/^action step\s*\d+/i.test(value)) return false;
  if (/time control/i.test(value)) return false;
  if (/past-exam link/i.test(value)) return false;
  if (value.length < 2) return false;
  return true;
}

function isUsefulStudyText(text) {
  const value = toText(text);
  if (!value || value.length < 8) return false;
  if (looksLikeGibberish(value)) return false;
  if (/action step|review this risk signal|close your notes/i.test(value)) return false;
  if (/&middot;|ms\s*\d{4}|\b\d{2}\/\d{2}\b/i.test(value)) return false;

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
  const latinCount = (value.match(/[a-zA-Z]/g) || []).length;
  return hangulCount >= Math.max(6, Math.floor(value.length * 0.3)) || latinCount >= Math.max(20, Math.floor(value.length * 0.5));
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

function parseBooleanEnv(value, fallback = false) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function clampNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function toText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return trimmed || fallback;
}

module.exports = app;
module.exports.startServer = startServer;
