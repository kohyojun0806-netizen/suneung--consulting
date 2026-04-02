const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");
const { spawn } = require("child_process");
require("dotenv").config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4.1-mini";
const YTDLP_SUB_LANGS = process.env.YTDLP_SUB_LANGS || "ko.*,ko";
const YTDLP_RETRIES = process.env.YTDLP_RETRIES || "5";
const YTDLP_SLEEP_REQUESTS = process.env.YTDLP_SLEEP_REQUESTS || "1";
const YTDLP_COOKIES_FILE = (process.env.YTDLP_COOKIES_FILE || "").trim();
const YTDLP_PLAYLIST_MAX = Number(process.env.YTDLP_PLAYLIST_MAX || 0);
const INGEST_USE_THUMBNAIL = (process.env.INGEST_USE_THUMBNAIL || "false").toLowerCase() === "true";
const WEB_MAX_IMAGES = Number(process.env.WEB_MAX_IMAGES || 3);
const WEB_TEXT_MAX_CHARS = Number(process.env.WEB_TEXT_MAX_CHARS || 30000);
const INGEST_USE_VIDEO_FRAMES =
  (process.env.INGEST_USE_VIDEO_FRAMES || "false").toLowerCase() === "true";
const VIDEO_FRAME_INTERVAL_SECONDS = Number(process.env.VIDEO_FRAME_INTERVAL_SECONDS || 60);
const VIDEO_FRAME_MAX_COUNT = Number(process.env.VIDEO_FRAME_MAX_COUNT || 6);
const YTDLP_VIDEO_FORMAT = process.env.YTDLP_VIDEO_FORMAT || "best[height<=480]/best";
const INGEST_SUMMARY_MODE = (process.env.INGEST_SUMMARY_MODE || "local").toLowerCase(); // local | hybrid | model

const DATA_DIR = path.join(process.cwd(), "data");
const KNOWLEDGE_DIR = path.join(DATA_DIR, "knowledge");
const JOBS_DIR = path.join(DATA_DIR, "jobs");
const SOURCES_FILE =
  process.env.KNOWLEDGE_SOURCES_FILE || path.join(KNOWLEDGE_DIR, "sources.json");
const KNOWLEDGE_FILE =
  process.env.KNOWLEDGE_FILE || path.join(KNOWLEDGE_DIR, "knowledge_base.json");

fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
fs.mkdirSync(JOBS_DIR, { recursive: true });

let DISABLE_MODEL_CALLS = INGEST_SUMMARY_MODE === "local";

async function main() {
  if (INGEST_SUMMARY_MODE === "model" && !OPENAI_API_KEY) {
    throw new Error(".env? OPENAI_API_KEY? ?? ??????.");
  }
  if (!OPENAI_API_KEY && INGEST_SUMMARY_MODE !== "model") {
    DISABLE_MODEL_CALLS = true;
    console.warn("[ingest] OPENAI_API_KEY ??: ?? ?? ?? ??? ?????.");
  }
  const sources = await loadSources();
  if (!sources.length) {
    throw new Error(
      "sources.json이 비어 있어요. data/knowledge/sources.example.json을 참고해 소스를 추가해주세요."
    );
  }
  const expandedSources = await expandPlaylistSources(sources);
  if (!expandedSources.length) {
    throw new Error("플레이리스트 확장 결과 학습할 소스가 없습니다.");
  }

  const items = [];
  const failed = [];
  for (let i = 0; i < expandedSources.length; i += 1) {
    const src = expandedSources[i];
    console.log(
      `[${i + 1}/${expandedSources.length}] ingest start: ${
        src.title || src.youtubeUrl || src.playlistUrl || src.webUrl || src.subtitlePath
      }`
    );
    try {
      const item = await buildKnowledgeItem(src, i);
      items.push(item);
      console.log(`  -> saved item: ${item.id}`);
    } catch (error) {
      failed.push({
        id: src.id || "",
        source: src.youtubeUrl || src.playlistUrl || src.webUrl || src.subtitlePath || "unknown",
        error: error.message,
      });
      console.warn(`  -> skipped due to error: ${error.message}`);
    }
    if (i < expandedSources.length - 1) {
      await sleep(1500);
    }
  }

  if (!items.length) {
    throw new Error("모든 소스 학습에 실패했어요. 네트워크/권한/소스 유효성을 확인해주세요.");
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    model: AI_MODEL,
    items,
  };
  await fsp.writeFile(KNOWLEDGE_FILE, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Knowledge base updated: ${path.relative(process.cwd(), KNOWLEDGE_FILE)}`);
  if (failed.length) {
    console.warn(`[ingest] skipped ${failed.length} source(s).`);
  }
}

main().catch((error) => {
  console.error("[ingest] failed:", error.message);
  process.exit(1);
});

async function loadSources() {
  if (!fs.existsSync(SOURCES_FILE)) return [];
  const raw = await fsp.readFile(SOURCES_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function expandPlaylistSources(sources) {
  const expanded = [];
  for (const raw of sources) {
    const source = normalizeSource(raw);
    const playlistUrl = source.playlistUrl || (source.expandPlaylist ? inferPlaylistUrl(source.youtubeUrl) : "");
    if (!playlistUrl) {
      expanded.push(raw);
      continue;
    }

    const videos = await listPlaylistVideos(playlistUrl);
    if (!videos.length) {
      console.warn(`[ingest] playlist has no videos: ${playlistUrl}`);
      continue;
    }

    const prefix = source.id || hashString(playlistUrl).slice(0, 8);
    for (let i = 0; i < videos.length; i += 1) {
      const video = videos[i];
      expanded.push({
        id: `${prefix}-${video.id}`,
        title: source.title
          ? `${source.title} - ${video.title || `video ${i + 1}`}`
          : video.title || `playlist video ${i + 1}`,
        youtubeUrl: toYoutubeWatchUrl(video.id),
        includeVideoFrames: source.includeVideoFrames,
      });
    }

    console.log(
      `[ingest] expanded playlist: ${playlistUrl} -> ${videos.length} video(s)${
        YTDLP_PLAYLIST_MAX > 0 ? ` (max ${YTDLP_PLAYLIST_MAX})` : ""
      }`
    );
  }
  return expanded;
}

async function buildKnowledgeItem(source, index) {
  const normalized = normalizeSource(source);
  const workDir = path.join(JOBS_DIR, `ingest-${Date.now()}-${index}`);
  await fsp.mkdir(workDir, { recursive: true });

  let transcript = "";
  let visualSummary = "";
  let sourceLabel = normalized.title || "untitled source";

  if (normalized.youtubeUrl) {
    const subtitleInfo = await extractSubtitleFromYoutube(normalized.youtubeUrl, workDir);
    transcript = subtitleInfo.cleanedText;
    sourceLabel = normalized.title || normalized.youtubeUrl;
    if (subtitleInfo.thumbnailPath && !DISABLE_MODEL_CALLS) {
      try {
        visualSummary = await summarizeVisualCue(subtitleInfo.thumbnailPath);
      } catch (error) {
        console.warn(`[ingest] visual summary skipped: ${error.message}`);
      }
    }
    if (normalized.includeVideoFrames && INGEST_USE_VIDEO_FRAMES && !DISABLE_MODEL_CALLS) {
      try {
        const frameSummary = await extractVideoFrameSummary(normalized.youtubeUrl, workDir);
        if (frameSummary) {
          visualSummary = [visualSummary, frameSummary].filter(Boolean).join("\n");
        }
      } catch (error) {
        console.warn(`[ingest] video frame summary skipped: ${error.message}`);
      }
    }
  } else if (normalized.webUrl) {
    const webData = await extractKnowledgeFromWeb(normalized.webUrl, normalized.includeImages);
    transcript = webData.transcript;
    visualSummary = webData.visualSummary || visualSummary;
    sourceLabel = normalized.title || normalized.webUrl;
  } else if (normalized.subtitlePath) {
    const fullPath = path.resolve(process.cwd(), normalized.subtitlePath);
    const raw = await fsp.readFile(fullPath, "utf8");
    transcript = cleanSrt(raw);
    sourceLabel = normalized.title || normalized.subtitlePath;
  } else if (normalized.transcript) {
    transcript = normalized.transcript.trim();
    sourceLabel = normalized.title || "manual transcript";
  } else {
    throw new Error("source는 youtubeUrl, subtitlePath, transcript 중 하나가 필요합니다.");
  }

  const clippedTranscript = clipTranscript(transcript, 24000);
  let summary;
  if (INGEST_SUMMARY_MODE === "model") {
    summary = await createKnowledgeSummary({
      title: normalized.title || sourceLabel,
      transcript: clippedTranscript,
      visualSummary,
    });
  } else if (INGEST_SUMMARY_MODE === "hybrid" && !DISABLE_MODEL_CALLS) {
    try {
      summary = await createKnowledgeSummary({
        title: normalized.title || sourceLabel,
        transcript: clippedTranscript,
        visualSummary,
      });
    } catch (error) {
      if (isQuotaError(error.message)) {
        DISABLE_MODEL_CALLS = true;
      }
      console.warn(`[ingest] OpenAI ?? ?? -> ?? ?? ?? ??: ${error.message}`);
      summary = createExtractiveKnowledgeSummary({
        title: normalized.title || sourceLabel,
        transcript: clippedTranscript,
      });
    }
  } else {
    summary = createExtractiveKnowledgeSummary({
      title: normalized.title || sourceLabel,
      transcript: clippedTranscript,
    });
  }

  const idBase = normalized.id || sourceLabel;
  const id = `kb-${hashString(idBase).slice(0, 10)}`;
  const bucket = normalizeBucket(
    summary.bucket || normalized.bucket || inferBucketFromSource(normalized)
  );
  return {
    id,
    bucket,
    title: summary.title || normalized.title || sourceLabel,
    source: sourceLabel,
    applies_to: normalizeAppliesTo(summary.applies_to),
    core: summary.core || "개념을 출력 중심으로 바꾸고 기출 적용까지 연결합니다.",
    steps: normalizeSteps(summary.steps),
    cautions: normalizeTextList(summary.cautions, 5),
    keywords: normalizeTextList(summary.keywords, 8),
    meta: {
      sourceType: normalized.type || inferSourceType(normalized),
      platform: normalized.platform || "",
      tags: normalizeTextList(normalized.tags, 8),
      youtubeUrl: normalized.youtubeUrl || "",
      playlistUrl: normalized.playlistUrl || "",
      webUrl: normalized.webUrl || "",
    },
  };
}

function normalizeSource(source) {
  return {
    id: typeof source?.id === "string" ? source.id.trim() : "",
    title: typeof source?.title === "string" ? source.title.trim() : "",
    youtubeUrl: typeof source?.youtubeUrl === "string" ? source.youtubeUrl.trim() : "",
    playlistUrl: typeof source?.playlistUrl === "string" ? source.playlistUrl.trim() : "",
    expandPlaylist: source?.expandPlaylist !== false,
    includeVideoFrames: source?.includeVideoFrames !== false,
    webUrl: typeof source?.webUrl === "string" ? source.webUrl.trim() : "",
    includeImages: source?.includeImages !== false,
    subtitlePath: typeof source?.subtitlePath === "string" ? source.subtitlePath.trim() : "",
    transcript: typeof source?.transcript === "string" ? source.transcript : "",
    type: typeof source?.type === "string" ? source.type.trim().toLowerCase() : "",
    platform: typeof source?.platform === "string" ? source.platform.trim() : "",
    bucket: typeof source?.bucket === "string" ? source.bucket.trim() : "",
    tags: Array.isArray(source?.tags) ? source.tags : [],
  };
}

function inferPlaylistUrl(youtubeUrl) {
  if (!youtubeUrl) return "";
  try {
    const url = new URL(youtubeUrl);
    const list = url.searchParams.get("list");
    if (!list) return "";
    return `https://www.youtube.com/playlist?list=${list}`;
  } catch {
    return "";
  }
}

async function listPlaylistVideos(playlistUrl) {
  const { command, shell } = resolveYtDlp();
  const args = ["--ignore-config", "--encoding", "utf-8", "--flat-playlist", "--print", "%(id)s\t%(title)s"];

  if (YTDLP_PLAYLIST_MAX > 0) {
    args.push("--playlist-end", String(YTDLP_PLAYLIST_MAX));
  }
  if (YTDLP_COOKIES_FILE && fs.existsSync(YTDLP_COOKIES_FILE)) {
    args.push("--cookies", YTDLP_COOKIES_FILE);
  }
  args.push(playlistUrl);

  const result = await runCommand(command, args, { cwd: process.cwd(), shell, timeoutMs: 240000 });
  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const videos = [];
  const seen = new Set();
  for (const line of lines) {
    const parts = line.split("\t");
    const id = (parts[0] || "").trim();
    const title = parts.slice(1).join("\t").trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    videos.push({ id, title: title || id });
  }
  return videos;
}

function toYoutubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
}

function normalizeAppliesTo(value) {
  const allowed = new Set(["9-7", "7-5", "5-3", "3-1", "all"]);
  const arr = Array.isArray(value) ? value : [];
  const normalized = arr.map((v) => String(v).trim()).filter((v) => allowed.has(v));
  return normalized.length ? Array.from(new Set(normalized)) : ["all"];
}

function normalizeBucket(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["study_methods", "math_study_methods", "수학 공부법"].includes(text)) {
    return "study_methods";
  }
  if (["lecture_books", "lecture_and_books", "강의·교재 추천"].includes(text)) {
    return "lecture_books";
  }
  if (["learning_routines", "학습 루틴"].includes(text)) {
    return "learning_routines";
  }
  return "study_methods";
}

function inferSourceType(source) {
  if (source?.youtubeUrl) return "youtube";
  if (source?.playlistUrl) return "youtube_playlist";
  if (source?.webUrl) return "web";
  if (source?.subtitlePath) return "subtitle_file";
  if (source?.transcript) return "manual_text";
  return "unknown";
}

function inferBucketFromSource(source) {
  const hay = [
    source?.type,
    source?.title,
    source?.platform,
    ...(Array.isArray(source?.tags) ? source.tags : []),
  ]
    .map((x) => String(x || "").toLowerCase())
    .join(" ");

  if (/(book|lecture|curriculum|ot|review|teacher|course|class|material|교재|강의|커리큘럼|수강후기|인강)/.test(hay)) {
    return "lecture_books";
  }
  if (/(routine|review|mistake|time|streak|retry|schedule|habit|오답|복습|루틴|시간관리)/.test(hay)) {
    return "learning_routines";
  }
  return "study_methods";
}

function normalizeSteps(value) {
  const arr = Array.isArray(value) ? value : [];
  const steps = arr
    .map((step) => ({
      title: typeof step?.title === "string" ? step.title.trim() : "",
      detail: typeof step?.detail === "string" ? step.detail.trim() : "",
    }))
    .filter((step) => step.title && step.detail)
    .slice(0, 8);

  if (steps.length) return steps;

  return [
    {
      title: "Concept Output",
      detail: "Explain key concepts from memory and restate definitions in your own words.",
    },
    {
      title: "Past-Exam Link",
      detail: "Apply each concept immediately to easy past-exam items before harder sets.",
    },
    {
      title: "Flow Design",
      detail: "Before calculations, map condition -> target -> solve route.",
    },
    {
      title: "Error Ledger",
      detail: "Track mistakes by cause and retry with the corrected method.",
    },
    {
      title: "Time Stability",
      detail: "Use fixed per-question limits and a skip rule to stabilize score.",
    },
  ];
}

function normalizeTextList(value, limit) {
  const arr = Array.isArray(value) ? value : [];
  return arr
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .slice(0, limit);
}

function createExtractiveKnowledgeSummary({ title, transcript }) {
  const body = String(transcript || "").trim();
  const sentences = splitIntoSentences(body);
  const tokenFreq = buildTokenFrequency(tokenizeForSummary(body));
  const ranked = rankSentences(sentences, tokenFreq);
  const rankedTexts = ranked.map((entry) => entry.text).filter(Boolean);

  const coreSentences = ranked.slice(0, 2).map((entry) => entry.text).filter(Boolean);
  const actionSentences = sentences.filter((s) => isActionSentence(s));
  const cautionSentences = sentences.filter((s) => isCautionSentence(s));

  return {
    title,
    bucket: "",
    applies_to: ["all"],
    core: coreSentences.join(" ") || fallbackCoreFromTitle(title),
    steps: buildExtractiveSteps(actionSentences.length ? actionSentences : rankedTexts.slice(0, 8)),
    cautions: buildExtractiveCautions(cautionSentences, coreSentences, rankedTexts),
    keywords: extractTopKeywordsFromFreq(tokenFreq, 8),
  };
}

const EXTRACTIVE_STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "your", "you", "are", "have", "will",
  "what", "when", "into", "then", "just", "very", "more", "less", "about", "because", "should",
  "math", "study", "studying", "video", "today", "college", "exam", "csat", "grade",
  "they", "them", "their", "there", "here", "also", "only", "such", "than", "been", "being",
  "수학", "공부", "영상", "학생", "문제", "등급", "그리고", "하지만", "정말", "그냥", "있다", "없다",
]);

function splitIntoSentences(text) {
  const normalized = String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const parts = normalized
    .split(/(?<=[.!?])\s+|\n+|(?<=\s{2,})/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const out = [];
  for (const sentence of parts) {
    if (sentence.length < 12 || sentence.length > 260) continue;
    if (/^[0-9\s,.:;-]+$/.test(sentence)) continue;
    if (!out.includes(sentence)) out.push(sentence);
    if (out.length >= 180) break;
  }
  return out;
}

function tokenizeForSummary(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token.length >= 2)
    .filter((token) => !/^\d+$/.test(token))
    .filter((token) => !EXTRACTIVE_STOPWORDS.has(token));
}

function buildTokenFrequency(tokens) {
  const freq = new Map();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}

function rankSentences(sentences, freq) {
  const total = Math.max(sentences.length, 1);
  return sentences
    .map((sentence, idx) => {
      const tokens = tokenizeForSummary(sentence);
      const tokenScore = tokens.reduce((sum, t) => sum + (freq.get(t) || 0), 0);
      const density = tokenScore / Math.max(tokens.length, 1);
      const positionBoost = 1 - idx / (total * 1.4);
      const actionBoost = isActionSentence(sentence) ? 0.2 : 0;
      const cautionBoost = isCautionSentence(sentence) ? 0.2 : 0;
      return { text: sentence, score: density + positionBoost + actionBoost + cautionBoost };
    })
    .sort((a, b) => b.score - a.score);
}

function isActionSentence(sentence) {
  return /(review|solve|apply|plan|design|analy|write|explain|record|repeat|복습|풀이|적용|분석|설계|정리|기록)/i.test(
    sentence
  );
}

function isCautionSentence(sentence) {
  return /(don't|do not|avoid|never|wrong|mistake|error|주의|하지 마|금지|실수)/i.test(sentence);
}

function buildExtractiveSteps(candidates) {
  const picked = [];
  for (const sentence of candidates) {
    const compact = String(sentence || "").replace(/\s+/g, " ").trim();
    if (!compact || picked.includes(compact)) continue;
    picked.push(compact);
    if (picked.length >= 5) break;
  }

  const steps = picked.map((sentence, idx) => ({
    title: inferStepTitle(sentence, idx),
    detail: sentence,
  }));

  if (steps.length >= 4) return steps;

  const defaults = [
    "Close your notes and explain one unit from memory before solving.",
    "Apply each concept to easy past-exam items immediately.",
    "Classify wrong answers by cause and retry the same type.",
    "Use fixed time limits per question to stabilize score.",
  ];

  for (const line of defaults) {
    if (steps.length >= 4) break;
    steps.push({ title: inferStepTitle(line, steps.length), detail: line });
  }
  return steps;
}

function inferStepTitle(sentence, idx) {
  const s = String(sentence || "").toLowerCase();
  if (/(review|복습|recap|repeat)/i.test(s)) return "Review Loop";
  if (/(past|mock|기출|모의)/i.test(s)) return "Past-Exam Link";
  if (/(scenario|flow|strategy|설계)/i.test(s)) return "Solve Flow Design";
  if (/(mistake|error|실수|오답)/i.test(s)) return "Error Correction";
  if (/(time|timer|minutes|시간)/i.test(s)) return "Time Control";
  if (/(concept|definition|개념|정의)/i.test(s)) return "Concept Output";
  return "Action Step " + String(idx + 1);
}

function buildExtractiveCautions(cautions, coreSentences, rankedTexts) {
  const picked = [];
  for (const sentence of cautions) {
    const compact = String(sentence || "").replace(/\s+/g, " ").trim();
    if (!compact || picked.includes(compact)) continue;
    picked.push(compact);
    if (picked.length >= 4) break;
  }

  if (!picked.length) {
    for (const sentence of rankedTexts || []) {
      const compact = String(sentence || "").replace(/\s+/g, " ").trim();
      if (!compact) continue;
      picked.push("Review this risk signal: " + compact);
      if (picked.length >= 2) break;
    }
  }

  if (!picked.length) {
    for (const sentence of coreSentences) {
      const compact = String(sentence || "").replace(/\s+/g, " ").trim();
      if (!compact) continue;
      picked.push("Do not skip this principle: " + compact);
      if (picked.length >= 2) break;
    }
  }

  if (!picked.length) {
    picked.push("Do not solve many questions without reviewing repeated mistakes.");
    picked.push("Do not read concepts passively; force recall and explanation.");
  }
  return picked.slice(0, 5);
}

function extractTopKeywordsFromFreq(freq, limit) {
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

function fallbackCoreFromTitle(title) {
  const t = String(title || "").trim();
  if (!t) {
    return "Build a concept-to-application loop and stabilize performance with review and timing.";
  }
  return (
    "Key focus from source: " +
    t +
    ". Convert concepts into output and connect them to timed problem solving."
  );
}

function createFallbackKnowledgeSummary({ title, transcript }) {
  const raw = String(transcript || "");
  const compact = raw.replace(/\s+/g, " ").trim();
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const themes = detectThemes(compact);
  const keywords = extractTopKeywords(compact, 10);
  const evidence = extractEvidenceLines(lines, themes, 3);

  return {
    title,
    applies_to: ["all"],
    core: buildFallbackCore(themes, keywords, evidence),
    steps: buildFallbackSteps(themes, evidence),
    cautions: extractCautions(lines, themes),
    keywords: keywords.length ? keywords : themes.slice(0, 6),
  };
}

const FALLBACK_THEME_RULES = [
  { theme: "concept", patterns: [/concept/gi, /definition/gi, /principle/gi, /theorem/gi] },
  { theme: "review", patterns: [/review/gi, /repeat/gi, /recap/gi, /retry/gi] },
  { theme: "past_exam", patterns: [/past exam/gi, /mock/gi, /previous year/gi, /csat/gi] },
  { theme: "scenario", patterns: [/scenario/gi, /flow/gi, /strategy/gi, /route/gi] },
  { theme: "time", patterns: [/time/gi, /minutes?/gi, /speed/gi, /timer/gi] },
  { theme: "volume", patterns: [/volume/gi, /many problems/gi, /quantity/gi, /sets?/gi] },
  { theme: "mistake", patterns: [/mistake/gi, /error/gi, /wrong answer/gi, /trap/gi] },
  { theme: "mindset", patterns: [/mindset/gi, /confidence/gi, /anxiety/gi, /focus/gi] },
];

const FALLBACK_STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "your", "you", "are", "have", "will",
  "what", "when", "into", "then", "just", "very", "more", "less", "about", "because", "should",
  "math", "study", "studying", "video", "today", "college", "exam", "csat", "grade",
  "they", "them", "their", "there", "here", "also", "only", "such", "than", "been", "being"
]);

function detectThemes(text) {
  const normalized = String(text || "");
  const scored = FALLBACK_THEME_RULES.map(({ theme, patterns }) => {
    let score = 0;
    for (const pattern of patterns) {
      const matches = normalized.match(pattern);
      if (matches) score += matches.length;
    }
    return { theme, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.theme);

  return scored.length ? scored : ["concept", "review", "past_exam", "mistake"];
}

function buildFallbackCore(themes, keywords, evidence) {
  const a = themes[0] || "concept";
  const b = themes[1] || "review";
  const map = {
    concept: "Convert input into output through active recall of concepts.",
    review: "Use short-cycle review so methods remain reusable under pressure.",
    past_exam: "Bridge every unit to past-exam style items early.",
    scenario: "Design the solve-flow first, then run calculations.",
    time: "Stabilize score with strict time-control and skip rules.",
    volume: "Scale volume only after method quality is stable.",
    mistake: "Track recurring mistakes and remove them by targeted retries.",
    mindset: "Protect performance by keeping confidence and focus stable.",
  };

  const topKeywords = keywords.slice(0, 4).join(", ");
  const oneEvidence = evidence[0] ? (" Evidence: " + evidence[0]) : "";
  return map[a] + " Then combine it with " + map[b].toLowerCase() + " Key terms: " + (topKeywords || "core concepts") + "." + oneEvidence;
}

function buildFallbackSteps(themes, evidence) {
  const templates = {
    concept: {
      title: "Concept Output Drill",
      detail: "Close notes and explain definitions, conditions, and representative examples aloud.",
    },
    review: {
      title: "Two-Stage Review",
      detail: "Run same-day recap and next-day recap to lock retrieval strength.",
    },
    past_exam: {
      title: "Past-Exam Connection",
      detail: "Apply one fresh concept to easy past-exam questions before raising difficulty.",
    },
    scenario: {
      title: "Scenario Mapping",
      detail: "Before solving, map condition links and choose a route to the target.",
    },
    time: {
      title: "Timed Execution",
      detail: "Use fixed limits per item, and skip after threshold to protect total score.",
    },
    volume: {
      title: "Structured Volume",
      detail: "Increase daily quantity only after error rate and solve-flow quality improve.",
    },
    mistake: {
      title: "Error Classification",
      detail: "Label misses as concept/interpretation/calculation and retry each category.",
    },
    mindset: {
      title: "Performance Mindset",
      detail: "Set objective daily checkpoints to reduce anxiety and maintain momentum.",
    },
  };

  const steps = [];
  for (const theme of themes) {
    const candidate = templates[theme];
    if (!candidate) continue;
    if (!steps.find((s) => s.title === candidate.title)) steps.push({ ...candidate });
    if (steps.length >= 5) break;
  }

  for (const fallbackTheme of ["concept", "past_exam", "mistake", "time", "review"]) {
    const candidate = templates[fallbackTheme];
    if (!steps.find((s) => s.title === candidate.title)) steps.push({ ...candidate });
    if (steps.length >= 5) break;
  }

  if (evidence[1] && steps[0]) {
    steps[0].detail = steps[0].detail + " Transcript cue: " + evidence[1];
  }

  return steps;
}

function extractEvidenceLines(lines, themes, maxCount) {
  const themedWords = {
    concept: ["concept", "definition", "principle", "theorem"],
    review: ["review", "repeat", "recap", "retry"],
    past_exam: ["past", "mock", "csat", "previous"],
    scenario: ["scenario", "flow", "route", "strategy"],
    time: ["time", "minutes", "timer", "speed"],
    volume: ["many", "volume", "quantity", "sets"],
    mistake: ["mistake", "error", "wrong", "trap"],
    mindset: ["mindset", "confidence", "anxiety", "focus"],
  };

  const picks = [];
  for (const line of lines) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (normalized.length < 25 || normalized.length > 160) continue;

    const lower = normalized.toLowerCase();
    const matched = themes.some((theme) =>
      (themedWords[theme] || []).some((w) => lower.includes(String(w).toLowerCase()))
    );

    if (matched) picks.push(normalized);
    if (picks.length >= maxCount) break;
  }

  return picks;
}

function extractCautions(lines, themes) {
  const patterns = [/\bdon'?t\b/i, /\bdo not\b/i, /\bavoid\b/i, /\bnever\b/i, /\bwrong\b/i, /\berror\b/i];
  const cautions = [];

  for (const line of lines) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (normalized.length < 18 || normalized.length > 160) continue;
    if (patterns.some((p) => p.test(normalized))) cautions.push(normalized);
    if (cautions.length >= 3) break;
  }

  if (themes.includes("time")) cautions.push("Avoid spending too long on one hard problem; secure easy points first.");
  if (themes.includes("volume")) cautions.push("Do not increase volume without checking repeated mistake patterns.");
  if (themes.includes("concept")) cautions.push("Reading concepts is not enough; force recall without notes.");
  if (themes.includes("mistake")) cautions.push("A mistake is not fixed until you can reproduce the correct reasoning.");
  if (themes.includes("mindset")) cautions.push("Avoid all-or-nothing thinking after one bad mock result.");

  return Array.from(new Set(cautions)).slice(0, 5);
}

function extractTopKeywords(text, limit = 10) {
  const tokens = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token.length >= 2)
    .filter((token) => !FALLBACK_STOPWORDS.has(token));

  const freq = new Map();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

async function createKnowledgeSummary({ title, transcript, visualSummary }) {
  const systemPrompt = [
    "너는 수능 수학 학습 전략 지식 편집자다.",
    "입력 텍스트를 운영자 지식 베이스용으로 구조화해 JSON 객체만 반환한다.",
    "스키마:",
    "{",
    '  "title":"string",',
    '  "bucket":"study_methods"|"lecture_books"|"learning_routines",',
    '  "applies_to":["9-7"|"7-5"|"5-3"|"3-1"|"all"],',
    '  "core":"string",',
    '  "steps":[{"title":"string","detail":"string"}],',
    '  "cautions":["string"],',
    '  "keywords":["string"]',
    "}",
  ].join("\n");

  const userPrompt = [
    `제목: ${title}`,
    visualSummary ? `시각 요약:\n${visualSummary}` : "시각 요약 없음",
    `자막 요약 원문:\n${transcript}`,
    "조건: 광고성 문구 제거, 실천 가능한 학습 전략 중심, 한국어 작성",
  ].join("\n\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.1,
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
  if (!content) throw new Error("모델 응답이 비어 있어요.");
  return parseJsonSafely(content);
}

async function extractKnowledgeFromWeb(webUrl, includeImages) {
  const response = await fetch(webUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`webUrl 로딩 실패 (${response.status}): ${webUrl}`);
  }

  const html = await response.text();
  const pageTitle = extractTagText(html, "title") || "web page";
  const cleanedText = extractReadableText(html);
  const transcript = `${pageTitle}\n${clipTranscript(cleanedText, WEB_TEXT_MAX_CHARS)}`.trim();

  let visualSummary = "";
  if (includeImages) {
    const images = extractImageCandidates(html, webUrl).slice(0, Math.max(0, WEB_MAX_IMAGES));
    if (images.length) {
      const summaries = [];
      for (const image of images) {
        try {
          const summary = await summarizeVisualFromImageUrl(image.url, image.alt, pageTitle);
          if (summary) summaries.push(`- ${summary}`);
        } catch (error) {
          if (image.alt) summaries.push(`- 이미지 단서(alt): ${image.alt}`);
          console.warn(`[ingest] image summary skipped: ${error.message}`);
        }
      }
      visualSummary = summaries.join("\n");
    }
  }

  return { transcript, visualSummary };
}

function extractTagText(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(re);
  if (!match) return "";
  return decodeHtmlEntities(stripTags(match[1])).trim();
}

function extractReadableText(html) {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  const withBreaks = withoutNoise
    .replace(/<(br|\/p|\/div|\/li|\/h1|\/h2|\/h3|\/h4|\/h5|\/h6)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ");

  const text = decodeHtmlEntities(stripTags(withBreaks))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

function stripTags(input) {
  return input.replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(input) {
  const named = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
  };
  let out = input;
  for (const [k, v] of Object.entries(named)) {
    out = out.split(k).join(v);
  }
  out = out.replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));
  return out;
}

function extractImageCandidates(html, baseUrl) {
  const imgTagRegex = /<img\b[^>]*>/gi;
  const srcRegex = /\bsrc\s*=\s*["']([^"']+)["']/i;
  const altRegex = /\balt\s*=\s*["']([^"']*)["']/i;

  const matches = html.match(imgTagRegex) || [];
  const out = [];
  const seen = new Set();

  for (const tag of matches) {
    const srcMatch = tag.match(srcRegex);
    if (!srcMatch) continue;
    const rawSrc = srcMatch[1].trim();
    if (!rawSrc || rawSrc.startsWith("data:")) continue;
    if (rawSrc.startsWith("javascript:")) continue;

    let absUrl;
    try {
      absUrl = new URL(rawSrc, baseUrl).href;
    } catch {
      continue;
    }
    if (seen.has(absUrl)) continue;
    seen.add(absUrl);

    const altMatch = tag.match(altRegex);
    const alt = altMatch ? decodeHtmlEntities(altMatch[1].trim()) : "";
    out.push({ url: absUrl, alt });
  }
  return out;
}

async function summarizeVisualFromImageUrl(imageUrl, altText, pageTitle) {
  if (DISABLE_MODEL_CALLS) return altText ? `이미지 단서(alt): ${altText}` : "";
  const promptText = [
    `페이지 제목: ${pageTitle}`,
    altText ? `이미지 alt: ${altText}` : "",
    "수능 수학 학습 전략에 관련된 시각 단서만 2문장 이내로 요약해줘.",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "너는 학습 전략 요약 도우미다. 광고성/장식 설명을 제외하고 학습법 단서만 간단히 말한다.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `image VLM 호출 실패 (${response.status})`);
  }
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

async function extractVideoFrameSummary(youtubeUrl, workDir) {
  const ffmpegCmd = await resolveFfmpeg();
  if (!ffmpegCmd) {
    throw new Error("ffmpeg를 찾지 못해 프레임 분석을 건너뜁니다.");
  }

  const videoPath = await downloadVideoForFrames(youtubeUrl, workDir);
  const frameDir = path.join(workDir, "frames");
  await fsp.mkdir(frameDir, { recursive: true });

  const fpsExpr = `1/${Math.max(5, VIDEO_FRAME_INTERVAL_SECONDS)}`;
  const framePattern = path.join(frameDir, "frame-%03d.jpg");
  const ffmpegArgs = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    videoPath,
    "-vf",
    `fps=${fpsExpr}`,
    "-frames:v",
    String(Math.max(1, VIDEO_FRAME_MAX_COUNT)),
    framePattern,
  ];
  await runCommand(ffmpegCmd, ffmpegArgs, { cwd: workDir, shell: false, timeoutMs: 240000 });

  const frameFiles = (await fsp.readdir(frameDir))
    .filter((file) => file.toLowerCase().endsWith(".jpg"))
    .sort()
    .slice(0, Math.max(1, VIDEO_FRAME_MAX_COUNT))
    .map((file) => path.join(frameDir, file));

  if (!frameFiles.length) return "";

  const summaries = [];
  for (let i = 0; i < frameFiles.length; i += 1) {
    try {
      const one = await summarizeVisualCue(frameFiles[i]);
      if (one) summaries.push(`프레임${i + 1}: ${one}`);
    } catch (error) {
      console.warn(`[ingest] frame ${i + 1} summary failed: ${error.message}`);
    }
  }

  if (!summaries.length) return "";
  return `영상 프레임 요약:\n${summaries.join("\n")}`;
}

async function downloadVideoForFrames(youtubeUrl, workDir) {
  const { command, shell } = resolveYtDlp();
  const outputPattern = "video.%(ext)s";
  const args = [
    "--ignore-config",
    "--no-playlist",
    "-f",
    YTDLP_VIDEO_FORMAT,
    "--force-ipv4",
    "--socket-timeout",
    "30",
    "--retries",
    YTDLP_RETRIES,
    "--retry-sleep",
    "2",
    "--sleep-requests",
    YTDLP_SLEEP_REQUESTS,
    "-o",
    outputPattern,
    youtubeUrl,
  ];

  if (YTDLP_COOKIES_FILE && fs.existsSync(YTDLP_COOKIES_FILE)) {
    args.unshift(YTDLP_COOKIES_FILE);
    args.unshift("--cookies");
  }

  await runCommand(command, args, { cwd: workDir, shell, timeoutMs: 420000 });

  const candidates = (await fsp.readdir(workDir))
    .filter((file) => /\.(mp4|mkv|webm|mov)$/i.test(file))
    .map((file) => path.join(workDir, file));
  if (!candidates.length) {
    throw new Error("프레임 분석용 영상 파일 다운로드에 실패했습니다.");
  }
  return candidates[0];
}

async function resolveFfmpeg() {
  const envPath = (process.env.FFMPEG_PATH || "").trim();
  if (envPath && fs.existsSync(envPath)) return envPath;

  const wingetFfmpeg = path.join(
    process.env.LOCALAPPDATA || "",
    "Microsoft",
    "WinGet",
    "Links",
    "ffmpeg.exe"
  );
  if (fs.existsSync(wingetFfmpeg)) return wingetFfmpeg;

  try {
    await runCommand("ffmpeg", ["-version"], {
      cwd: process.cwd(),
      shell: true,
      timeoutMs: 15000,
    });
    return "ffmpeg";
  } catch {
    return "";
  }
}

function resolveYtDlp() {
  const wingetPath = path.join(
    process.env.LOCALAPPDATA || "",
    "Microsoft",
    "WinGet",
    "Links",
    "yt-dlp.exe"
  );
  if (wingetPath && fs.existsSync(wingetPath)) {
    return { command: wingetPath, shell: false };
  }
  return { command: "yt-dlp", shell: true };
}

async function extractSubtitleFromYoutube(youtubeUrl, workDir) {
  const { command, shell } = resolveYtDlp();
  const args = [
    "--ignore-config",
    "--skip-download",
    "--write-auto-sub",
    "--sleep-requests",
    YTDLP_SLEEP_REQUESTS,
    "--sub-langs",
    YTDLP_SUB_LANGS,
    "--convert-subs",
    "srt",
    "--force-ipv4",
    "--socket-timeout",
    "30",
    "--retries",
    YTDLP_RETRIES,
    "--retry-sleep",
    "2",
    "-o",
    "%(title)s.%(ext)s",
    youtubeUrl,
  ];

  if (INGEST_USE_THUMBNAIL) {
    args.splice(3, 0, "--write-thumbnail");
  }

  if (YTDLP_COOKIES_FILE && fs.existsSync(YTDLP_COOKIES_FILE)) {
    args.unshift(YTDLP_COOKIES_FILE);
    args.unshift("--cookies");
  }

  await runCommand(command, args, { cwd: workDir, shell, timeoutMs: 240000 });

  const files = (await fsp.readdir(workDir)).filter((file) => file.toLowerCase().endsWith(".srt"));
  if (!files.length) throw new Error("자막 파일(.srt)을 찾지 못했어요.");
  const fileName = chooseBestSubtitle(files);
  const raw = await fsp.readFile(path.join(workDir, fileName), "utf8");
  const cleanedText = cleanSrt(raw);
  const thumbnailPath = INGEST_USE_THUMBNAIL ? await findThumbnail(workDir) : null;
  return { fileName, cleanedText, thumbnailPath };
}

function chooseBestSubtitle(files) {
  const ranked = [...files].sort((a, b) => subtitleScore(a) - subtitleScore(b));
  return ranked[0];
}

function subtitleScore(name) {
  const lower = name.toLowerCase();
  if (lower.includes(".ko-orig.srt")) return 0;
  if (lower.includes(".ko.srt")) return 1;
  if (lower.includes(".en.srt")) return 2;
  return 3;
}

function cleanSrt(srtText) {
  const timePattern = /^\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}$/;
  const lines = srtText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\d+$/.test(line))
    .filter((line) => !timePattern.test(line))
    .map((line) => line.replace(/\s+/g, " "));

  const merged = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (!prev) {
      merged.push(line);
      continue;
    }
    if (line === prev) continue;
    if (line.startsWith(prev)) {
      merged[merged.length - 1] = line;
      continue;
    }
    if (prev.startsWith(line)) continue;
    merged.push(line);
  }
  return merged.join("\n");
}

async function summarizeVisualCue(imagePath) {
  if (DISABLE_MODEL_CALLS) return "";
  const ext = path.extname(imagePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const imageBuffer = await fsp.readFile(imagePath);
  const imageBase64 = imageBuffer.toString("base64");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "수능 수학 학습 관련 시각 단서만 5줄 이내 한국어로 요약해라. 장식/홍보 문구는 제외한다.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "이 이미지의 학습 전략 관련 단서를 요약해줘." },
            { type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `VLM 호출 실패 (${response.status})`);
  }
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

function isQuotaError(message) {
  const text = String(message || "").toLowerCase();
  return text.includes("quota") || text.includes("insufficient") || text.includes("billing");
}

function clipTranscript(text, maxChars) {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  const head = text.slice(0, Math.floor(maxChars * 0.7));
  const tail = text.slice(-Math.floor(maxChars * 0.3));
  return `${head}\n...\n${tail}`;
}

function parseJsonSafely(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("JSON 파싱에 실패했어요.");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function hashString(value) {
  return crypto.createHash("sha1").update(value).digest("hex");
}

async function findThumbnail(workDir) {
  const files = await fsp.readdir(workDir);
  const image = files.find((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));
  return image ? path.join(workDir, image) : null;
}

function runCommand(command, args, options = {}) {
  const timeoutMs = options.timeoutMs || 120000;
  const cwd = options.cwd || process.cwd();
  const shell = Boolean(options.shell);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell, windowsHide: true });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`명령 실행 시간 초과: ${command}`));
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`${command} 실행 실패: ${error.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} 실패 (code ${code})\n${stderr || stdout}`));
      }
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
