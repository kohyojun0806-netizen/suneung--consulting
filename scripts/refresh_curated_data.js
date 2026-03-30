const fs = require("fs");
const path = require("path");

const root = process.cwd();
const now = new Date().toISOString().slice(0, 10);

function writeJson(relPath, data) {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`updated: ${relPath}`);
}

function readJson(relPath, fallback) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) return fallback;
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

const kb = readJson("data/knowledge/knowledge_base.json", { updatedAt: now, items: [] });
const kbMap = new Map((Array.isArray(kb.items) ? kb.items : []).map((x) => [x.id, x]));

const refreshedKnowledge = [
  {
    id: "kb-success-cases-evidence-01",
    bucket: "study_methods",
    title: "Success-case driven study strategy",
    source: "Orbi success posts and discussion threads",
    core: "Large score jumps are usually explained by fixed routines: concept output, past-exam application, and fast mistake review.",
    steps: [
      { title: "Build a case matrix", detail: "Compare 3-5 success posts by start level, duration, and repeated actions." },
      { title: "Turn advice into tasks", detail: "Convert each insight into daily and weekly actions with time blocks." },
      { title: "Track process metrics", detail: "Track repeated mistakes and timeout count, not only mock score." }
    ],
    cautions: [
      "Copying only teacher or book names rarely works without copying the review routine.",
      "Adjust high-intensity plans to your available weekly hours."
    ],
    keywords: ["success-case", "routine", "review", "past-exam", "score-jump"],
    applies_to: ["9-7", "7-5", "5-3", "3-1"]
  },
  {
    id: "kb-youtube-comment-trend-01",
    bucket: "learning_routines",
    title: "FAQ pattern from comment/questions",
    source: "YouTube and community question clusters",
    core: "Most learner questions collapse into four axes: order, timing, selection, and review. Plans should answer those first.",
    steps: [
      { title: "4-axis check", detail: "For every weekly plan, write one sentence for order, timing, selection, and review." },
      { title: "Question log", detail: "Store repeated blockers as questions and map them to next-week actions." },
      { title: "FAQ-first correction", detail: "Before adding new resources, fix the missing routine item behind each repeated question." }
    ],
    cautions: ["Too many questions often means too many resources and too little review."],
    keywords: ["comment-trend", "faq", "youtube", "question-pattern"],
    applies_to: ["all"]
  },
  {
    id: "kb-elite-academy-roadmap-01",
    bucket: "lecture_books",
    title: "Elite academy seasonal roadmap",
    source: "Sidaeinjae timetable, Dugak class pages, community reviews",
    core: "For top students, class selection should follow season goals: weakness closure (3-6), killer handling (6-9), and final stability (after 9).",
    steps: [
      { title: "3-6", detail: "Use one regular class plus weak-unit repair track." },
      { title: "6-9", detail: "Pair N-set with weekly mock and fixed recovery rules." },
      { title: "9-final", detail: "Reduce expansion and run final mock plus compressed review notes." }
    ],
    cautions: ["More classes without protected review time increases score volatility."],
    keywords: ["elite", "seasonal-plan", "academy", "final"],
    applies_to: ["5-3", "3-1"]
  },
  {
    id: "kb-claude-import-normalized-01",
    bucket: "study_methods",
    title: "Claude import normalization rule",
    source: "data/imports/files_1/suneung-sprint003-r1.jsx",
    core: "Imported replacement-style UI content was not applied directly. Only reusable learning knowledge was extracted into current API schema.",
    steps: [
      { title: "Preserve architecture", detail: "Keep existing API-backed app flow and avoid full file replacement." },
      { title: "Extract reusable knowledge", detail: "Move only grade-band methods, curriculum sequencing, and review rules." },
      { title: "Verify before merge", detail: "Apply only data that passes build and E2E checks." }
    ],
    cautions: ["Directly pasting external app code can break deployment and security expectations."],
    keywords: ["import", "normalization", "schema", "quality-check"],
    applies_to: ["all"]
  }
];

for (const item of refreshedKnowledge) kbMap.set(item.id, item);
writeJson("data/knowledge/knowledge_base.json", { updatedAt: now, items: Array.from(kbMap.values()) });

const catalog = {
  updatedAt: now,
  notes: "Expanded recommendation catalog with seasonal academy guidance",
  instructors: [
    {
      name: "\uD604\uC6B0\uC9C4",
      platform: "Megastudy",
      fitKeys: ["5-3", "3-1"],
      subjectTags: ["\uACF5\uD1B5", "\uBBF8\uC801\uBD84", "\uAE30\uD558"],
      strengths: ["Strong for upper-mid to top transition", "Clear concept-to-killer progression"],
      styleTags: ["fast", "structure", "practical"],
      curriculumPath: [
        { stage: "base", course: "Sibaljeom", material: "concept" },
        { stage: "practical-concept", course: "Newrun", material: "core text" },
        { stage: "past-exam", course: "Sugam", material: "past exam" },
        { stage: "N-set", course: "Drill", material: "N-set" },
        { stage: "final", course: "Killing Camp", material: "mock" }
      ],
      seasonalPlan: [
        { period: "3~6\uBAA8", classType: "concept+past", content: "Newrun + Sugam", goal: "stabilize mid-hard items" },
        { period: "6~9\uBAA8", classType: "N-set+mock", content: "Drill + weekly mock", goal: "time/recovery rule" },
        { period: "9\uBAA8~\uC218\uB2A5", classType: "final", content: "final mock + error compression", goal: "minimize variance" }
      ],
      reviewSummary: ["Sequence questions are common and useful", "Review routine is mandatory"],
      bestFor: "Students needing practical score lift in hard section",
      usage: "Run concept and past exam in parallel, then move to N-set",
      sourceLevel: "official+community",
      confidence: 0.93,
      sourceRefs: ["official-megastudy-woojin-ot", "orbi-neuron-sugam-order-2026"]
    },
    {
      name: "\uC815\uC2B9\uC81C",
      platform: "Etoos/EBS",
      fitKeys: ["9-7", "7-5"],
      subjectTags: ["\uACF5\uD1B5", "\uD655\uB960\uACFC\uD1B5\uACC4"],
      strengths: ["Great for concept gaps", "Accessible for low-mid level"],
      styleTags: ["clear", "repeat", "foundation"],
      curriculumPath: [
        { stage: "concept", course: "Concept track", material: "concept text" },
        { stage: "type", course: "Type track", material: "type text" },
        { stage: "past-exam", course: "Past exam track", material: "past set" }
      ],
      seasonalPlan: [
        { period: "3~6\uBAA8", classType: "concept", content: "fix definition/logic", goal: "close gaps" },
        { period: "6~9\uBAA8", classType: "type+past", content: "easy-mid sets", goal: "practical transition" },
        { period: "9\uBAA8~\uC218\uB2A5", classType: "final review", content: "mistake compression", goal: "basic stability" }
      ],
      reviewSummary: ["High concept clarity", "Needs practical set pairing later"],
      bestFor: "Students with broad concept gaps",
      usage: "Concept lecture then same-day easy past-exam practice",
      sourceLevel: "official+community",
      confidence: 0.88,
      sourceRefs: ["official-etoos-jeongseungje-ot", "orbi-math-band-column"]
    },
    {
      name: "\uC774\uBBF8\uC9C0",
      platform: "Daesung Mimac",
      fitKeys: ["7-5", "5-3"],
      subjectTags: ["\uACF5\uD1B5", "\uD655\uB960\uACFC\uD1B5\uACC4", "\uBBF8\uC801\uBD84"],
      strengths: ["Fast concept-application bridge", "Good for mid band"],
      styleTags: ["organized", "applied"],
      curriculumPath: [
        { stage: "concept", course: "Michin Concept", material: "concept" },
        { stage: "past-exam", course: "Michin Past", material: "past" },
        { stage: "practical", course: "N-set", material: "practical" }
      ],
      seasonalPlan: [
        { period: "3~6\uBAA8", classType: "concept", content: "concept + easy past", goal: "remove blind spots" },
        { period: "6~9\uBAA8", classType: "past expansion", content: "mid-hard past", goal: "faster interpretation" },
        { period: "9\uBAA8~\uC218\uB2A5", classType: "practical", content: "mock + compression", goal: "stable outcome" }
      ],
      reviewSummary: ["Good perceived clarity for mid-level students"],
      bestFor: "Students who know concept but cannot apply fast",
      usage: "Apply same-unit problems right after lecture",
      sourceLevel: "official+community",
      confidence: 0.84,
      sourceRefs: ["official-mimac-math", "map-image-curriculum"]
    },
    {
      name: "\uC2DC\uB300\uC778\uC7AC \uC218\uD559 \uB2E8\uACFC",
      platform: "Sidaeinjae Daechi",
      fitKeys: ["5-3", "3-1"],
      subjectTags: ["\uACF5\uD1B5", "\uD655\uB960\uACFC\uD1B5\uACC4", "\uBBF8\uC801\uBD84", "\uAE30\uD558"],
      strengths: ["Dense practical sets for top students", "Weekly assignment/test loop"],
      styleTags: ["academy", "practical", "high-tier"],
      curriculumPath: [
        { stage: "regular", course: "regular class", material: "academy text" },
        { stage: "hard", course: "hard set + N-set", material: "supplement" },
        { stage: "final", course: "final mock", material: "final material" }
      ],
      seasonalPlan: [
        { period: "3~6\uBAA8", classType: "regular", content: "weak-unit closure", goal: "close weak chapters" },
        { period: "6~9\uBAA8", classType: "hard+mock", content: "killer set + weekly mock", goal: "hard-item control" },
        { period: "9\uBAA8~\uC218\uB2A5", classType: "final", content: "final mock + compressed review", goal: "stable practical score" }
      ],
      reviewSummary: ["High practical value for top tier with strong review"],
      bestFor: "Top-tier students needing final operating stability",
      usage: "Split class usage by season instead of taking everything at once",
      sourceLevel: "official+community",
      confidence: 0.86,
      sourceRefs: ["sdij-daechi-timetable", "orbi-sdij-review-2026"]
    },
    {
      name: "\uB450\uAC01\uD559\uC6D0 \uC218\uD559 \uB2E8\uACFC",
      platform: "Daechi/Bundang Dugak",
      fitKeys: ["5-3", "3-1"],
      subjectTags: ["\uACF5\uD1B5", "\uBBF8\uC801\uBD84", "\uAE30\uD558"],
      strengths: ["Assignment-driven management", "Past-to-mock bridge"],
      styleTags: ["academy", "managed", "practical"],
      curriculumPath: [
        { stage: "regular", course: "regular class", material: "academy material" },
        { stage: "hard", course: "hard module", material: "supplement" },
        { stage: "final", course: "final mock", material: "final set" }
      ],
      seasonalPlan: [
        { period: "3~6\uBAA8", classType: "regular", content: "regular + assignment", goal: "fix weak units" },
        { period: "6~9\uBAA8", classType: "hard", content: "hard set + practical", goal: "killer adaptation" },
        { period: "9\uBAA8~\uC218\uB2A5", classType: "final", content: "final mock rotation", goal: "low variance" }
      ],
      reviewSummary: ["Clear assignment-review loop in many community notes"],
      bestFor: "Students who need managed weekly rhythm",
      usage: "Protect review hours before adding extra classes",
      sourceLevel: "official+community",
      confidence: 0.83,
      sourceRefs: ["dugak-requestclass-2026", "dugak-teacher-board"]
    }
  ],
  books: [
    { title: "Gaenyeomwolli Math I/II", type: "concept", fitKeys: ["9-7", "7-5"], purpose: "build concept structure", when: "before 6 mock", difficulty: "medium", subjectTags: ["\uACF5\uD1B5"], sourceLevel: "community", confidence: 0.9, sourceRefs: ["orbi-math-band-column"] },
    { title: "RPM Math I/II", type: "type", fitKeys: ["9-7", "7-5"], purpose: "right-after-concept application", when: "immediately after concept", difficulty: "medium", subjectTags: ["\uACF5\uD1B5"], sourceLevel: "community", confidence: 0.86, sourceRefs: ["orbi-math-band-column"] },
    { title: "Xistory Math I/II", type: "past", fitKeys: ["7-5", "5-3", "3-1"], purpose: "past-exam type compression", when: "5~9 mock", difficulty: "medium-high", subjectTags: ["\uACF5\uD1B5"], sourceLevel: "community", confidence: 0.89, sourceRefs: ["orbi-success-9to1"] },
    { title: "Madutong Past Math", type: "past", fitKeys: ["7-5", "5-3", "3-1"], purpose: "year rotation", when: "year-round", difficulty: "medium-high", subjectTags: ["\uACF5\uD1B5"], sourceLevel: "community", confidence: 0.84, sourceRefs: ["orbi-success-9to1"] },
    { title: "EBS Suneungteukgang Math", type: "EBS", fitKeys: ["9-7", "7-5", "5-3", "3-1"], purpose: "linked-material baseline", when: "year-round", difficulty: "medium", subjectTags: ["\uACF5\uD1B5", "\uD655\uB960\uACFC\uD1B5\uACC4", "\uBBF8\uC801\uBD84", "\uAE30\uD558"], sourceLevel: "official", confidence: 0.92, sourceRefs: ["book-ebs-special-2026"] },
    { title: "EBS Suneungwanseong Math", type: "EBS", fitKeys: ["7-5", "5-3", "3-1"], purpose: "final linked review", when: "after 6 mock", difficulty: "medium-high", subjectTags: ["\uACF5\uD1B5", "\uD655\uB960\uACFC\uD1B5\uACC4", "\uBBF8\uC801\uBD84", "\uAE30\uD558"], sourceLevel: "official", confidence: 0.92, sourceRefs: ["book-ebs-complete-2026"] },
    { title: "Drill", type: "N-set", fitKeys: ["5-3", "3-1"], purpose: "hard-item solving power", when: "6~9 mock", difficulty: "high", subjectTags: ["\uACF5\uD1B5", "\uBBF8\uC801\uBD84", "\uAE30\uD558"], sourceLevel: "official+community", confidence: 0.84, sourceRefs: ["official-megastudy-woojin-ot"] },
    { title: "Sidaeinjae Math Material", type: "academy", fitKeys: ["5-3", "3-1"], purpose: "high-tier practical loop", when: "6~final", difficulty: "high", subjectTags: ["\uACF5\uD1B5", "\uD655\uB960\uACFC\uD1B5\uACC4", "\uBBF8\uC801\uBD84", "\uAE30\uD558"], sourceLevel: "official+community", confidence: 0.78, sourceRefs: ["sdij-daechi-timetable"] },
    { title: "Dugak Math Material", type: "academy", fitKeys: ["5-3", "3-1"], purpose: "assignment-review practical cycle", when: "6~final", difficulty: "high", subjectTags: ["\uACF5\uD1B5", "\uBBF8\uC801\uBD84", "\uAE30\uD558"], sourceLevel: "official+community", confidence: 0.76, sourceRefs: ["dugak-requestclass-2026"] },
    { title: "Elective: Prob/Stats Past+N", type: "elective", fitKeys: ["7-5", "5-3", "3-1"], purpose: "prob-stat frequent pattern control", when: "5~final", difficulty: "medium-high", subjectTags: ["\uD655\uB960\uACFC\uD1B5\uACC4"], sourceLevel: "community", confidence: 0.77, sourceRefs: ["orbi-math-band-column"] },
    { title: "Elective: Calculus Past+N", type: "elective", fitKeys: ["7-5", "5-3", "3-1"], purpose: "calculus hard section response", when: "5~final", difficulty: "high", subjectTags: ["\uBBF8\uC801\uBD84"], sourceLevel: "community", confidence: 0.8, sourceRefs: ["orbi-neuron-sugam-order-2026"] },
    { title: "Elective: Geometry Past+N", type: "elective", fitKeys: ["7-5", "5-3", "3-1"], purpose: "geometry hard adaptation", when: "5~final", difficulty: "high", subjectTags: ["\uAE30\uD558"], sourceLevel: "community", confidence: 0.79, sourceRefs: ["orbi-math-band-column"] }
  ]
};

writeJson("data/knowledge/recommendation_catalog.json", catalog);

writeJson("data/knowledge/student_success_cases.json", {
  updatedAt: now,
  notes: "Student success cases, de-identified",
  cases: [
    {
      id: "success-9to1-orbi-2020",
      bandShift: "9->1",
      duration: "about 1 year",
      summary: "A base-level learner reached grade 1 with strict concept-output, past-exam replay, and review loop.",
      coreActions: ["same-day application", "24-hour first review", "weekly practical set"],
      fitKeys: ["9-7", "7-5", "5-3"],
      sourceRefs: ["orbi-success-9to1"],
      reliability: 0.74
    },
    {
      id: "success-nobase-thread-2023",
      bandShift: "8->2/3",
      duration: "about 1 year",
      summary: "Long thread discussion reports multiple base-level improvement cases with stable routines.",
      coreActions: ["fixed weekly rhythm", "basic past rotation", "mistake pattern tracking"],
      fitKeys: ["9-7", "7-5"],
      sourceRefs: ["orbi-nobase-oneyear-thread"],
      reliability: 0.64
    },
    {
      id: "success-elite-seasonal",
      bandShift: "top-band stabilization",
      duration: "3 to final",
      summary: "Top-band gains depend on seasonal class-content decisions and compressed final review.",
      coreActions: ["3-6 weakness closure", "6-9 hard set + mock", "9-final variance control"],
      fitKeys: ["5-3", "3-1"],
      sourceRefs: ["sdij-daechi-timetable", "dugak-requestclass-2026"],
      reliability: 0.78
    }
  ]
});

writeJson("data/knowledge/youtube_question_signals.json", {
  updatedAt: now,
  notes: "Question/comment trend signals",
  signals: [
    {
      id: "q-sequence",
      channel: "community+youtube",
      focus: "sequence",
      learnerQuestion: "How should I sequence Newrun and Sugam?",
      coachingHint: "Parallelize after concept completion crosses stable threshold.",
      fitKeys: ["7-5", "5-3", "3-1"],
      sourceRefs: ["orbi-neuron-sugam-order-2026"],
      reliability: 0.82
    },
    {
      id: "q-nobase",
      channel: "community+youtube",
      focus: "feasibility",
      learnerQuestion: "Can a base learner reach grade 1 in one year?",
      coachingHint: "Track routine completion rate instead of possibility debates.",
      fitKeys: ["9-7", "7-5"],
      sourceRefs: ["orbi-nobase-oneyear-thread"],
      reliability: 0.79
    },
    {
      id: "q-elite-season",
      channel: "community",
      focus: "academy timing",
      learnerQuestion: "When should I use Sidaeinjae or Dugak classes?",
      coachingHint: "Split by season: closure (3-6), hard handling (6-9), final stability (9-final).",
      fitKeys: ["5-3", "3-1"],
      sourceRefs: ["sdij-daechi-timetable", "dugak-requestclass-2026"],
      reliability: 0.84,
      channelHint: "Includes manual grouping for Akoreum-recommended comment themes"
    }
  ]
});

const registry = {
  updatedAt: now,
  policy: {
    priority: ["official", "official+community", "community", "youtube_comment"],
    notes: "Official pages are primary for classes/books; community/question data is used for execution hints."
  },
  sources: [
    { id: "sdij-daechi-timetable", type: "official", provider: "Sidaeinjae", url: "https://www.sdij.com/aca/schd/schd_view.asp?pc_view=Y", capturedAt: now, keyPoints: ["Daechi timetable", "math-school channel"] },
    { id: "dugak-requestclass-2026", type: "official", provider: "Bundang Dugak", url: "https://bundangdugak.dshw.co.kr/onlineapplication/requestclass_view.htm?currentPage=1&id=435&subject=0", capturedAt: now, keyPoints: ["class request page", "contact info"] },
    { id: "dugak-teacher-board", type: "official", provider: "Dugak", url: "https://bundangdugak.dshw.co.kr/teacher/teacher.htm?subject=2", capturedAt: now, keyPoints: ["math teacher board"] },
    { id: "official-megastudy-woojin-ot", type: "official", provider: "Megastudy", url: "https://www.megastudy.net/teacher_v2/chr/lecture_detailview.asp?CHR_CD=56645&MAKE_FLG=2&tec_cd=woojinmath", capturedAt: now, keyPoints: ["course detail and OT"] },
    { id: "official-etoos-jeongseungje-ot", type: "official", provider: "Etoos", url: "https://www11.etoos.com/teacher/sub02.asp?CHOICE_LEVEL_ID=100001&GRD_CD=go3&LECTURE_GB_CD=0001&TAB_CD=0002&TEACHER_ID=200180&TEACHER_MAIN_TYPE=TYPE25", capturedAt: now, keyPoints: ["curriculum detail"] },
    { id: "official-mimac-math", type: "official", provider: "Mimac", url: "https://www.mimacstudy.com/", capturedAt: now, keyPoints: ["math teachers main"] },
    { id: "book-ebs-special-2026", type: "official", provider: "EBSi", url: "https://cloud-www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005073", capturedAt: now, keyPoints: ["special textbook metadata"] },
    { id: "book-ebs-complete-2026", type: "official", provider: "EBSi", url: "https://www.ebsi.co.kr/ebs/pot/potg/retrieveCourseDetailNw.ebs?bookId=LB00000005094", capturedAt: now, keyPoints: ["complete textbook metadata"] },
    { id: "orbi-success-9to1", type: "community", provider: "Orbi", url: "https://orbi.kr/00033742614/9%EB%93%B1%EA%B8%89-%3E-%EA%B0%80%ED%98%95-1%EB%93%B1%EA%B8%89-%EC%88%98%ED%95%99-%EA%B3%B5%EB%B6%80%EB%B2%95", capturedAt: now, keyPoints: ["9 to 1 success case"] },
    { id: "orbi-nobase-oneyear-thread", type: "community", provider: "Orbi", url: "https://orbi.kr/00062991478/%EB%85%B8%EB%B2%A0-%EC%88%98%ED%95%99-1%EB%85%84%EB%A7%8C%EC%97%90-1%EB%93%B1%EA%B8%89-%EA%B0%80%EB%8A%A5-%EB%B6%88%EA%B0%80%EB%8A%A5", capturedAt: now, keyPoints: ["base learner feasibility discussion"] },
    { id: "orbi-neuron-sugam-order-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/00076785107", capturedAt: now, keyPoints: ["Newrun Sugam sequence pattern"] },
    { id: "orbi-sdij-review-2026", type: "community", provider: "Orbi", url: "https://orbi.kr/search?q=%EC%8B%9C%EB%8C%80%EC%9D%B8%EC%9E%AC+%EC%88%98%ED%95%99+%EB%8B%A8%EA%B3%BC+%ED%9B%84%EA%B8%B0", capturedAt: now, keyPoints: ["Sidaeinjae review query"] },
    { id: "orbi-math-band-column", type: "community", provider: "Orbi", url: "https://orbi.kr/00073261962", capturedAt: now, keyPoints: ["band-based method"] },
    { id: "orbi-math-attitude-column", type: "community", provider: "Orbi", url: "https://orbi.kr/00077975282/%5B%EC%B9%BC%EB%9F%BC%5D-%EC%88%98%ED%95%99-%EB%AC%B8%EC%A0%9C%EB%A5%BC-%EB%8C%80%ED%95%98%EB%8A%94-%ED%83%9C%EB%8F%84", capturedAt: now, keyPoints: ["problem attitude"] },
    { id: "map-image-curriculum", type: "curated", provider: "local-map", url: "data/knowledge/instructor_curriculum_map.json", capturedAt: now, keyPoints: ["image map"] },
    { id: "youtube-comment-akoreum-manual", type: "youtube_comment", provider: "YouTube-manual", url: "https://www.youtube.com/results?search_query=%EC%95%85%EC%96%B4%EC%98%A4%EB%A6%84+%EC%88%98%ED%95%99", capturedAt: now, keyPoints: ["manual Akoreum question-theme grouping"] }
  ]
};

writeJson("data/knowledge/source_registry.json", registry);
writeJson("data/knowledge/sources.json", registry.sources.map((src) => ({
  id: src.id,
  type: src.type,
  platform: src.provider,
  bucket: src.type === "community" ? "study_methods" : "lecture_books",
  tags: [src.type, "2026-refresh"],
  title: src.keyPoints[0] || src.id,
  webUrl: src.url,
  includeImages: src.type === "official"
})));

writeJson("data/knowledge/claude_import_adaptation.json", {
  updatedAt: now,
  source: "data/imports/files_1/suneung-sprint003-r1.jsx",
  decisions: [
    { item: "Grade-band method blocks", action: "merged", target: "knowledge_base.json" },
    { item: "Instructor/book suggestions", action: "merged+expanded", target: "recommendation_catalog.json" },
    { item: "Question trend signals", action: "new-dataset", target: "youtube_question_signals.json" }
  ],
  excluded: ["full UI replacement", "direct external model call snippets"]
});

console.log("refresh complete");
