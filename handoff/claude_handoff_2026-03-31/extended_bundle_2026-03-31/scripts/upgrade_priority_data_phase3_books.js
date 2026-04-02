const fs = require("fs");
const path = require("path");

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);

const paths = {
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
    id: "orbi-nje-recommend-thread-00063590966",
    type: "community",
    platform: "Orbi",
    bucket: "lecture_books",
    tags: ["community", "nje-recommendation", "phase3-books", today],
    title: "Math NJE recommendation thread",
    webUrl: "https://orbi.kr/00063590966",
    includeImages: false,
  },
  {
    id: "orbi-survival-types-00057634187",
    type: "community",
    platform: "Orbi",
    bucket: "lecture_books",
    tags: ["community", "sidae-survival", "phase3-books", today],
    title: "Sidaeinjae survival type question",
    webUrl: "https://orbi.kr/00057634187",
    includeImages: false,
  },
  {
    id: "orbi-nje-rank-thread-00072600911",
    type: "community",
    platform: "Orbi",
    bucket: "lecture_books",
    tags: ["community", "nje-rank", "phase3-books", today],
    title: "High-tier NJE ordering recommendation",
    webUrl: "https://orbi.kr/00072600911",
    includeImages: false,
  },
  {
    id: "orbi-books-review-thread-00074808610",
    type: "community",
    platform: "Orbi",
    bucket: "lecture_books",
    tags: ["community", "book-review", "phase3-books", today],
    title: "Math books and mock review thread",
    webUrl: "https://orbi.kr/00074808610",
    includeImages: false,
  },
  {
    id: "orbi-books-question-thread-00060558051",
    type: "community",
    platform: "Orbi",
    bucket: "lecture_books",
    tags: ["community", "book-selection", "phase3-books", today],
    title: "Math academy books and instructor content question",
    webUrl: "https://orbi.kr/00060558051",
    includeImages: false,
  },
  {
    id: "orbi-nje-usage-column-00065785267",
    type: "community",
    platform: "Orbi",
    bucket: "study_methods",
    tags: ["community", "nje-method", "phase3-books", today],
    title: "How to use NJE effectively",
    webUrl: "https://orbi.kr/00065785267",
    includeImages: false,
  },
  {
    id: "yes24-sidaebooks-g2-5year-2026",
    type: "official",
    platform: "YES24",
    bucket: "lecture_books",
    tags: ["official", "sidaebooks", "phase3-books", today],
    title: "SidaeBooks 5-year mock high2 math (2026)",
    webUrl: "https://www.yes24.com/product/goods/176219987",
    includeImages: true,
  },
  {
    id: "yes24-sidaebooks-prehigh2-6year-2026",
    type: "official",
    platform: "YES24",
    bucket: "lecture_books",
    tags: ["official", "sidaebooks", "phase3-books", today],
    title: "SidaeBooks pre-high2 6-year mock math (2026)",
    webUrl: "https://www.yes24.com/product/goods/162333789",
    includeImages: true,
  },
  {
    id: "bunjang-ihaewon-season4-2025",
    type: "community-index",
    platform: "Bunjang Global",
    bucket: "lecture_books",
    tags: ["community-index", "ihaewon", "phase3-books", today],
    title: "Ihaewon mock season4 listing signal",
    webUrl: "https://globalbunjang.com/product/310196513",
    includeImages: false,
  },
  {
    id: "tistory-sdij-content-guide",
    type: "community-index",
    platform: "Tistory",
    bucket: "lecture_books",
    tags: ["community-index", "sidae-content", "phase3-books", today],
    title: "Sidaeinjae math content recommendation summary",
    webUrl: "https://mathai-iope-factory.tistory.com/33",
    includeImages: false,
  },
];

const newRegistrySources = [
  {
    id: "orbi-nje-recommend-thread-00063590966",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00063590966",
    capturedAt: today,
    keyPoints: ["NJE candidates listed: Ihaewon, Hwayong, Seolmaji, Drill"],
  },
  {
    id: "orbi-survival-types-00057634187",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00057634187",
    capturedAt: today,
    keyPoints: ["Sidaeinjae survival variants: regular, alpha, N-survival"],
  },
  {
    id: "orbi-nje-rank-thread-00072600911",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00072600911",
    capturedAt: today,
    keyPoints: ["Top-tier recommendation mentions 4 rules, physical NJE, NJE game, clear NJE healer"],
  },
  {
    id: "orbi-books-review-thread-00074808610",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00074808610",
    capturedAt: today,
    keyPoints: ["Mentions Ihaewon, Drill, Jiinseon, KilCam, KangK, Sidae survival"],
  },
  {
    id: "orbi-books-question-thread-00060558051",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00060558051",
    capturedAt: today,
    keyPoints: ["Frequent questions about academy books and order by level"],
  },
  {
    id: "orbi-nje-usage-column-00065785267",
    type: "community",
    provider: "Orbi",
    url: "https://orbi.kr/00065785267",
    capturedAt: today,
    keyPoints: ["NJE usage method emphasizes timing, error review, and strategy consistency"],
  },
  {
    id: "yes24-sidaebooks-g2-5year-2026",
    type: "official",
    provider: "YES24",
    url: "https://www.yes24.com/product/goods/176219987",
    capturedAt: today,
    keyPoints: ["SidaeBooks mock volume details and publication metadata"],
  },
  {
    id: "yes24-sidaebooks-prehigh2-6year-2026",
    type: "official",
    provider: "YES24",
    url: "https://www.yes24.com/product/goods/162333789",
    capturedAt: today,
    keyPoints: ["SidaeBooks publication metadata for 2026 cycle"],
  },
  {
    id: "bunjang-ihaewon-season4-2025",
    type: "community-index",
    provider: "Bunjang Global",
    url: "https://globalbunjang.com/product/310196513",
    capturedAt: today,
    keyPoints: ["Ihaewon mock season listing signal"],
  },
  {
    id: "tistory-sdij-content-guide",
    type: "community-index",
    provider: "Tistory",
    url: "https://mathai-iope-factory.tistory.com/33",
    capturedAt: today,
    keyPoints: ["Sidaeinjae content names often discussed in community contexts"],
  },
];

const newBooks = [
  {
    title: "Sidaeinjae Survival Math Regular",
    type: "academy-mock",
    fitKeys: ["5-3", "3-1"],
    purpose: "Top-band practical mock adaptation with dense weekly review loop",
    when: "6~11 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus", "geometry"],
    sourceLevel: "community",
    confidence: 0.78,
    sourceRefs: ["orbi-survival-types-00057634187", "orbi-books-review-thread-00074808610"],
  },
  {
    title: "Sidaeinjae Survival Alpha Math",
    type: "academy-mock",
    fitKeys: ["5-3", "3-1"],
    purpose: "Hard variation set for upper-band timing and miss-type reduction",
    when: "7~10 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus", "geometry"],
    sourceLevel: "community",
    confidence: 0.75,
    sourceRefs: ["orbi-survival-types-00057634187"],
  },
  {
    title: "Sidaeinjae N Survival Math",
    type: "academy-nje",
    fitKeys: ["5-3", "3-1"],
    purpose: "N-set style high-intensity training before final mocks",
    when: "6~9 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.72,
    sourceRefs: ["orbi-survival-types-00057634187"],
  },
  {
    title: "KangK Math Mock",
    type: "mock",
    fitKeys: ["5-3", "3-1"],
    purpose: "Practical pacing and score stability in high-pressure sets",
    when: "8~11 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.76,
    sourceRefs: ["orbi-books-review-thread-00074808610"],
  },
  {
    title: "Killing Camp Math Mock (KilCam)",
    type: "mock",
    fitKeys: ["5-3", "3-1"],
    purpose: "Final practical test simulation and mistake-control drilling",
    when: "9~11 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.77,
    sourceRefs: ["orbi-books-review-thread-00074808610"],
  },
  {
    title: "Ihaewon NJE",
    type: "NJE",
    fitKeys: ["5-3", "3-1"],
    purpose: "Idea-rich upper-band NJE for interpretation and path decision",
    when: "5~9 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.79,
    sourceRefs: ["orbi-nje-recommend-thread-00063590966", "bunjang-ihaewon-season4-2025"],
  },
  {
    title: "Hwayong NJE",
    type: "NJE",
    fitKeys: ["5-3", "3-1"],
    purpose: "Balanced NJE with strong per-item quality for upper-mid to top transition",
    when: "5~9 month cycle",
    difficulty: "medium-high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.73,
    sourceRefs: ["orbi-nje-recommend-thread-00063590966"],
  },
  {
    title: "Seolmaji NJE",
    type: "NJE",
    fitKeys: ["5-3", "3-1"],
    purpose: "Balanced NJE for stable high-level practice without over-fragmenting routine",
    when: "5~9 month cycle",
    difficulty: "medium-high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.72,
    sourceRefs: ["orbi-nje-recommend-thread-00063590966"],
  },
  {
    title: "Drill Math Set",
    type: "NJE",
    fitKeys: ["5-3", "3-1"],
    purpose: "Dense hard-problem exposure with repeated condition interpretation",
    when: "5~9 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.74,
    sourceRefs: ["orbi-nje-recommend-thread-00063590966", "orbi-books-review-thread-00074808610"],
  },
  {
    title: "4 Rules S1",
    type: "NJE",
    fitKeys: ["5-3", "3-1"],
    purpose: "Top-band hard-item routine with strict review tags",
    when: "6~10 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.71,
    sourceRefs: ["orbi-nje-rank-thread-00072600911"],
  },
  {
    title: "Physical NJE",
    type: "NJE",
    fitKeys: ["5-3", "3-1"],
    purpose: "High-volume NJE exposure for persistence and speed calibration",
    when: "6~10 month cycle",
    difficulty: "high",
    subjectTags: ["common"],
    sourceLevel: "community",
    confidence: 0.68,
    sourceRefs: ["orbi-nje-rank-thread-00072600911"],
  },
  {
    title: "NJE Game",
    type: "NJE",
    fitKeys: ["5-3", "3-1"],
    purpose: "Pattern variation and decision-speed adaptation",
    when: "6~10 month cycle",
    difficulty: "high",
    subjectTags: ["common"],
    sourceLevel: "community",
    confidence: 0.67,
    sourceRefs: ["orbi-nje-rank-thread-00072600911"],
  },
  {
    title: "Clear NJE Healer Edition",
    type: "NJE",
    fitKeys: ["7-5", "5-3"],
    purpose: "Bridge NJE for students moving from stable 3~4 to high 2~1",
    when: "5~8 month cycle",
    difficulty: "medium-high",
    subjectTags: ["common"],
    sourceLevel: "community",
    confidence: 0.64,
    sourceRefs: ["orbi-nje-rank-thread-00072600911"],
  },
  {
    title: "Jiinseon NJE",
    type: "NJE",
    fitKeys: ["5-3", "3-1"],
    purpose: "Top-band idea and miss-type compression training",
    when: "6~10 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community",
    confidence: 0.7,
    sourceRefs: ["orbi-books-review-thread-00074808610"],
  },
  {
    title: "SidaeBooks 5-year National Mock High2 Math 20",
    type: "mock-archive",
    fitKeys: ["7-5", "5-3"],
    purpose: "Archive-style mock set for pacing and variance control",
    when: "3~9 month cycle",
    difficulty: "medium",
    subjectTags: ["common"],
    sourceLevel: "official",
    confidence: 0.86,
    sourceRefs: ["yes24-sidaebooks-g2-5year-2026"],
  },
  {
    title: "SidaeBooks Pre-High2 6-year National Mock Math",
    type: "mock-archive",
    fitKeys: ["9-7", "7-5"],
    purpose: "Early-stage archive mock adaptation with score trend tracking",
    when: "1~6 month cycle",
    difficulty: "medium",
    subjectTags: ["common"],
    sourceLevel: "official",
    confidence: 0.82,
    sourceRefs: ["yes24-sidaebooks-prehigh2-6year-2026"],
  },
  {
    title: "Sidaeinjae Bridge Math",
    type: "academy-content",
    fitKeys: ["7-5", "5-3"],
    purpose: "Bridge phase content for moving from concept closure to practical solving",
    when: "3~6 month cycle",
    difficulty: "medium-high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community-index",
    confidence: 0.58,
    sourceRefs: ["tistory-sdij-content-guide"],
  },
  {
    title: "Sidaeinjae Excel Math",
    type: "academy-content",
    fitKeys: ["5-3", "3-1"],
    purpose: "Higher-intensity content layer for upper-band transition",
    when: "5~9 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community-index",
    confidence: 0.55,
    sourceRefs: ["tistory-sdij-content-guide"],
  },
  {
    title: "Sidaeinjae The27 Math",
    type: "academy-content",
    fitKeys: ["3-1"],
    purpose: "Top-band compression set for final practical control",
    when: "8~11 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus", "geometry"],
    sourceLevel: "community-index",
    confidence: 0.54,
    sourceRefs: ["tistory-sdij-content-guide"],
  },
  {
    title: "Sidaeinjae Shortcut Math",
    type: "academy-content",
    fitKeys: ["5-3", "3-1"],
    purpose: "Late-stage compact routine to reduce unstable variance",
    when: "9~11 month cycle",
    difficulty: "high",
    subjectTags: ["common", "calculus"],
    sourceLevel: "community-index",
    confidence: 0.53,
    sourceRefs: ["tistory-sdij-content-guide"],
  },
];

const newSuccessCases = [
  {
    id: "success-nje-mock-sequence-topband-2026-phase3",
    bandShift: "5->1",
    duration: "about 5~8 months",
    summary: "Community patterns repeatedly mention that students stabilized upper-band scores after fixing NJE->mock->error-loop order.",
    coreActions: ["Single NJE lane per period", "Weekly mock and miss-type tags", "No late-stage random expansion"],
    fitKeys: ["5-3", "3-1"],
    sourceRefs: ["orbi-books-review-thread-00074808610", "orbi-nje-usage-column-00065785267"],
    reliability: 0.74,
  },
  {
    id: "success-survival-track-consistency-2026-phase3",
    bandShift: "top-band stabilization",
    duration: "in-season",
    summary: "Sidae survival-track discussions emphasize maintaining one stable content lane rather than broad, frequent switching.",
    coreActions: ["Keep one survival track", "Align weekly assignment with previous miss-types", "Compress in final period"],
    fitKeys: ["5-3", "3-1"],
    sourceRefs: ["orbi-survival-types-00057634187", "orbi-books-question-thread-00060558051"],
    reliability: 0.69,
  },
];

const newQuestionSignals = [
  {
    id: "q-too-many-nje-which-first-2026-phase3",
    channel: "community",
    focus: "NJE overload",
    learnerQuestion: "There are too many NJE choices. Which one should I start first for my band?",
    coachingHint: "Pick one NJE lane by fit band and lock 6-week cycle before switching.",
    fitKeys: ["7-5", "5-3", "3-1"],
    sourceRefs: ["orbi-nje-recommend-thread-00063590966", "orbi-nje-rank-thread-00072600911"],
    reliability: 0.81,
  },
  {
    id: "q-survival-regular-vs-alpha-2026-phase3",
    channel: "community",
    focus: "survival variant choice",
    learnerQuestion: "How should I choose between Sidae survival regular vs alpha?",
    coachingHint: "Decide by current mock stability and review capacity, not by naming prestige.",
    fitKeys: ["5-3", "3-1"],
    sourceRefs: ["orbi-survival-types-00057634187"],
    reliability: 0.76,
  },
  {
    id: "q-final-period-expand-or-compress-2026-phase3",
    channel: "community",
    focus: "final-period materials",
    learnerQuestion: "In final period, should I add more mocks or compress existing sets?",
    coachingHint: "Compress first and increase review depth unless score variance remains unexplained.",
    fitKeys: ["5-3", "3-1"],
    sourceRefs: ["orbi-books-review-thread-00074808610", "orbi-nje-usage-column-00065785267"],
    reliability: 0.78,
  },
];

function main() {
  const catalog = readJson(paths.catalog, { updatedAt: null, notes: "", instructors: [], books: [] });
  const success = readJson(paths.success, { updatedAt: null, notes: "", cases: [] });
  const signals = readJson(paths.signals, { updatedAt: null, notes: "", signals: [] });
  const registry = readJson(paths.registry, { updatedAt: null, policy: {}, sources: [] });
  const sources = readJson(paths.sources, []);

  const nextCatalog = {
    ...catalog,
    updatedAt: today,
    notes: "Phase3 update: stronger Sidaeinjae + NJE/mock evidence and stricter source mapping.",
    instructors: catalog.instructors || [],
    books: mergeByKey(catalog.books || [], newBooks, "title"),
  };

  const nextSuccess = {
    ...success,
    updatedAt: today,
    notes: "Phase3 update: added NJE/mock sequence and survival-track success patterns.",
    cases: mergeById(success.cases || [], newSuccessCases),
  };

  const nextSignals = {
    ...signals,
    updatedAt: today,
    notes: "Phase3 update: focused on NJE overload, survival variant choice, and final-period compression signals.",
    signals: mergeById(signals.signals || [], newQuestionSignals),
  };

  const mergedRegistry = mergeById(registry.sources || [], newRegistrySources);
  const nextRegistry = {
    ...registry,
    updatedAt: today,
    policy: {
      ...(registry.policy || {}),
      notes: "Phase3: prioritize direct sourceRef mapping for books and strict evaluator ingestion checks.",
    },
    sources: mergedRegistry,
  };

  const nextSources = mergeById(sources, newSources);

  writeJson(paths.catalog, nextCatalog);
  writeJson(paths.success, nextSuccess);
  writeJson(paths.signals, nextSignals);
  writeJson(paths.registry, nextRegistry);
  writeJson(paths.sources, nextSources);

  console.log("phase3 books/data upgrade complete");
}

main();
