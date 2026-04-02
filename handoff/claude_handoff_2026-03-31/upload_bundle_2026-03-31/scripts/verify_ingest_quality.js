const fs = require("fs");
const path = require("path");

const KNOWLEDGE_FILE =
  process.env.KNOWLEDGE_FILE || path.join(process.cwd(), "data", "knowledge", "knowledge_base.json");
const REPORT_FILE =
  process.env.INGEST_REPORT_FILE ||
  path.join(process.cwd(), "data", "knowledge", "ingest_quality_report.json");
const STRICT_MODE = process.argv.includes("--strict");

main();

function main() {
  if (!fs.existsSync(KNOWLEDGE_FILE)) {
    console.error(`[verify:ingest] knowledge file not found: ${KNOWLEDGE_FILE}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(KNOWLEDGE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  const report = auditKnowledgeItems(items, {
    sourceFile: path.relative(process.cwd(), KNOWLEDGE_FILE),
    knowledgeUpdatedAt: parsed?.updatedAt || null,
  });

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), "utf8");

  printSummary(report, REPORT_FILE);

  const hasCritical = report.summary.criticalCount > 0;
  const hasWarning = report.summary.warningCount > 0;
  if (hasCritical || (STRICT_MODE && hasWarning)) {
    process.exit(1);
  }
}

function auditKnowledgeItems(items, meta) {
  const issues = {
    gibberish: [],
    duplicates: [],
    lowQuality: [],
  };

  const idMap = new Map();
  const titleMap = new Map();
  const coreMap = new Map();

  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx] || {};
    const id = toText(item.id) || `item-${idx + 1}`;
    const title = sanitizeText(item.title);
    const core = sanitizeText(item.core);
    const source = sanitizeText(item.source);
    const steps = Array.isArray(item.steps) ? item.steps : [];
    const cautions = Array.isArray(item.cautions) ? item.cautions : [];
    const keywords = Array.isArray(item.keywords) ? item.keywords : [];

    trackMap(idMap, normalizeKey(id), id);
    trackMap(titleMap, normalizeKey(title), id);
    trackMap(coreMap, normalizeKey(core), id);

    const textFields = [
      { field: "title", value: title },
      { field: "source", value: source },
      { field: "core", value: core },
      ...steps.map((step, stepIdx) => ({
        field: `steps[${stepIdx}].title`,
        value: sanitizeText(step?.title),
      })),
      ...steps.map((step, stepIdx) => ({
        field: `steps[${stepIdx}].detail`,
        value: sanitizeText(step?.detail),
      })),
      ...cautions.map((line, cautionIdx) => ({
        field: `cautions[${cautionIdx}]`,
        value: sanitizeText(line),
      })),
    ];

    for (const entry of textFields) {
      if (!entry.value) continue;
      if (looksLikeGibberish(entry.value)) {
        issues.gibberish.push({
          severity: "critical",
          id,
          field: entry.field,
          message: "깨짐/무의미 텍스트로 추정됩니다.",
          sample: preview(entry.value),
        });
      }
    }

    const hasAnyContent = Boolean(core) || steps.length > 0 || cautions.length > 0;
    if (!hasAnyContent) {
      issues.lowQuality.push({
        severity: "critical",
        id,
        field: "item",
        message: "core/steps/cautions가 비어 있습니다.",
      });
    }

    if (core && core.length < 12) {
      issues.lowQuality.push({
        severity: "warning",
        id,
        field: "core",
        message: "core 문장이 너무 짧습니다.",
        sample: preview(core),
      });
    }

    const usefulSteps = steps.filter((step) => isUsefulSentence(step?.detail));
    if (steps.length > 0 && usefulSteps.length === 0) {
      issues.lowQuality.push({
        severity: "warning",
        id,
        field: "steps",
        message: "실행 가능한 step detail이 부족합니다.",
      });
    }

    const usefulCautions = cautions.filter((line) => isUsefulSentence(line));
    if (cautions.length > 0 && usefulCautions.length === 0) {
      issues.lowQuality.push({
        severity: "warning",
        id,
        field: "cautions",
        message: "주의점 문장이 너무 짧거나 품질이 낮습니다.",
      });
    }

    const usefulKeywords = keywords
      .map((x) => sanitizeText(x))
      .filter((x) => x.length >= 2 && !looksLikeGibberish(x));
    if (usefulKeywords.length < 2) {
      issues.lowQuality.push({
        severity: "warning",
        id,
        field: "keywords",
        message: "키워드가 2개 미만입니다.",
      });
    }

    const repeatedWithinItem = findRepeatedSentences([
      core,
      ...steps.map((step) => sanitizeText(step?.detail)),
      ...cautions.map((line) => sanitizeText(line)),
    ]);
    if (repeatedWithinItem.length > 0) {
      issues.duplicates.push({
        severity: "warning",
        id,
        field: "item",
        message: "동일 문장이 항목 내부에서 반복됩니다.",
        sample: repeatedWithinItem.slice(0, 2),
      });
    }
  }

  appendDuplicateMapIssues(idMap, issues.duplicates, {
    severity: "critical",
    field: "id",
    message: "중복 id가 감지되었습니다.",
  });
  appendDuplicateMapIssues(titleMap, issues.duplicates, {
    severity: "warning",
    field: "title",
    message: "중복 title이 감지되었습니다.",
  });
  appendDuplicateMapIssues(coreMap, issues.duplicates, {
    severity: "warning",
    field: "core",
    message: "중복 core가 감지되었습니다.",
    minKeyLength: 20,
  });

  const gibberishIssues = limitIssues(issues.gibberish);
  const duplicateIssues = limitIssues(issues.duplicates);
  const lowQualityIssues = limitIssues(issues.lowQuality);

  const allIssues = [...gibberishIssues, ...duplicateIssues, ...lowQualityIssues];
  const criticalCount = allIssues.filter((issue) => issue.severity === "critical").length;
  const warningCount = allIssues.filter((issue) => issue.severity !== "critical").length;

  return {
    generatedAt: new Date().toISOString(),
    sourceFile: meta.sourceFile,
    knowledgeUpdatedAt: meta.knowledgeUpdatedAt,
    itemCount: items.length,
    summary: {
      criticalCount,
      warningCount,
      gibberishCount: gibberishIssues.length,
      duplicateCount: duplicateIssues.length,
      lowQualityCount: lowQualityIssues.length,
      strictMode: STRICT_MODE,
    },
    issues: {
      gibberish: gibberishIssues,
      duplicates: duplicateIssues,
      lowQuality: lowQualityIssues,
    },
  };
}

function appendDuplicateMapIssues(map, out, options) {
  const minKeyLength = Number(options?.minKeyLength || 1);
  for (const [key, ids] of map.entries()) {
    if (!key || key.length < minKeyLength) continue;
    if (ids.length < 2) continue;
    out.push({
      severity: options.severity || "warning",
      field: options.field || "unknown",
      message: options.message || "중복 항목이 감지되었습니다.",
      ids: ids.slice(0, 12),
      duplicateCount: ids.length,
    });
  }
}

function trackMap(map, key, id) {
  if (!key) return;
  const current = map.get(key) || [];
  current.push(id);
  map.set(key, current);
}

function findRepeatedSentences(lines) {
  const seen = new Set();
  const repeated = [];
  for (const raw of lines) {
    const text = sanitizeText(raw);
    if (!text) continue;
    const key = normalizeKey(text);
    if (!key || key.length < 20) continue;
    if (seen.has(key)) {
      repeated.push(text);
      continue;
    }
    seen.add(key);
  }
  return repeated;
}

function isUsefulSentence(text) {
  const value = sanitizeText(text);
  if (!value) return false;
  if (value.length < 12) return false;
  if (looksLikeGibberish(value)) return false;
  return hasStudyKeyword(value) || value.length >= 20;
}

function hasStudyKeyword(text) {
  const value = toText(text);
  if (!value) return false;
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
    "문제",
    "학습",
    "루틴",
    "적용",
  ];
  return keywords.some((keyword) => value.includes(keyword));
}

function sanitizeText(value) {
  return toText(value)
    .replace(/&middot;/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(text) {
  return sanitizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");
}

function looksLikeGibberish(text) {
  const value = sanitizeText(text);
  if (!value) return true;

  const replacementCharCount = (value.match(/[�]/g) || []).length;
  if (replacementCharCount > Math.max(1, value.length * 0.08)) return true;

  const mojibakePatternCount = (value.match(/\?[가-힣a-zA-Z0-9]/g) || []).length;
  if (mojibakePatternCount >= 2) return true;

  const hangulCount = (value.match(/[가-힣]/g) || []).length;
  const latinCount = (value.match(/[a-zA-Z]/g) || []).length;
  const symbolCount = (value.match(/[^가-힣a-zA-Z0-9\s]/g) || []).length;
  if (hangulCount + latinCount < 3 && symbolCount > 2) return true;

  if (/ms\s*\d{4}|&middot;|beta/i.test(value)) return true;
  return false;
}

function limitIssues(items, maxItems = 200) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, maxItems);
}

function toText(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function preview(text, maxLen = 120) {
  const value = sanitizeText(text);
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen)}...`;
}

function printSummary(report, reportFile) {
  console.log(`[verify:ingest] items: ${report.itemCount}`);
  console.log(
    `[verify:ingest] issues -> critical:${report.summary.criticalCount}, warning:${report.summary.warningCount}`
  );
  console.log(
    `[verify:ingest] category -> 깨짐:${report.summary.gibberishCount}, 중복:${report.summary.duplicateCount}, 저품질:${report.summary.lowQualityCount}`
  );
  console.log(`[verify:ingest] report: ${path.relative(process.cwd(), reportFile)}`);
  if (report.summary.criticalCount > 0) {
    console.error("[verify:ingest] critical issues found. please review report.");
  }
}
