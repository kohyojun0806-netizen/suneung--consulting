const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CATALOG_FILE =
  process.env.RECOMMENDATION_CATALOG_FILE ||
  path.join(ROOT, "data", "knowledge", "recommendation_catalog.json");
const REGISTRY_FILE =
  process.env.SOURCE_REGISTRY_FILE ||
  path.join(ROOT, "data", "knowledge", "source_registry.json");
const REPORT_FILE =
  process.env.RECOMMENDATION_REPORT_FILE ||
  path.join(ROOT, "data", "knowledge", "recommendation_quality_report.json");

const STRICT_MODE = process.argv.includes("--strict");
const MIN_BOOKS = Number(process.env.MIN_BOOKS || 55);
const MIN_NJE_OR_MOCK_BOOKS = Number(process.env.MIN_NJE_OR_MOCK_BOOKS || 18);
const MIN_SDIJ_STYLE_BOOKS = Number(process.env.MIN_SDIJ_STYLE_BOOKS || 8);

main();

function main() {
  if (!fs.existsSync(CATALOG_FILE)) {
    console.error(`[verify:catalog] catalog file not found: ${CATALOG_FILE}`);
    process.exit(1);
  }
  if (!fs.existsSync(REGISTRY_FILE)) {
    console.error(`[verify:catalog] source registry file not found: ${REGISTRY_FILE}`);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
  const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
  const books = Array.isArray(catalog?.books) ? catalog.books : [];
  const sources = Array.isArray(registry?.sources) ? registry.sources : [];
  const sourceIdSet = new Set(
    sources
      .map((x) => (typeof x?.id === "string" ? x.id.trim() : ""))
      .filter(Boolean)
  );

  const issues = [];
  const titleSeen = new Map();

  for (const book of books) {
    const title = text(book?.title);
    const type = text(book?.type);
    const purpose = text(book?.purpose);
    const fitKeys = Array.isArray(book?.fitKeys) ? book.fitKeys.map((x) => text(x)).filter(Boolean) : [];
    const sourceRefs = Array.isArray(book?.sourceRefs) ? book.sourceRefs.map((x) => text(x)).filter(Boolean) : [];

    if (!title) {
      issues.push(issue("critical", "books[].title", "book title is missing"));
      continue;
    }
    if (!type) issues.push(issue("warning", `book:${title}:type`, "book type is missing"));
    if (!purpose || purpose.length < 6) {
      issues.push(issue("warning", `book:${title}:purpose`, "book purpose is too short"));
    }
    if (fitKeys.length === 0) {
      issues.push(issue("warning", `book:${title}:fitKeys`, "fitKeys is empty"));
    }
    if (sourceRefs.length === 0) {
      issues.push(issue("warning", `book:${title}:sourceRefs`, "sourceRefs is empty"));
    }
    for (const ref of sourceRefs) {
      if (!sourceIdSet.has(ref)) {
        issues.push(issue("warning", `book:${title}:sourceRefs`, `unknown sourceRef: ${ref}`));
      }
    }

    const key = title.toLowerCase();
    const prev = titleSeen.get(key);
    if (prev) {
      issues.push(issue("warning", `book:${title}`, `duplicate title also seen in: ${prev}`));
    } else {
      titleSeen.set(key, title);
    }
  }

  if (books.length < MIN_BOOKS) {
    issues.push(issue("warning", "coverage:books", `book count ${books.length} is below minimum ${MIN_BOOKS}`));
  }

  const njeOrMockCount = books.filter((book) => {
    const blob = [book?.title, book?.type, book?.purpose]
      .map((x) => text(x).toLowerCase())
      .join(" ");
    return /(n제|nje|n-set|실모|mock|모의|서바|survival|킬캠|강k)/i.test(blob);
  }).length;
  if (njeOrMockCount < MIN_NJE_OR_MOCK_BOOKS) {
    issues.push(
      issue(
        "warning",
        "coverage:nje-mock",
        `NJE/mock-like entries ${njeOrMockCount} are below minimum ${MIN_NJE_OR_MOCK_BOOKS}`
      )
    );
  }

  const sdijLikeCount = books.filter((book) => {
    const blob = [book?.title, book?.type, book?.purpose, ...(book?.sourceRefs || [])]
      .map((x) => text(x).toLowerCase())
      .join(" ");
    return /(시대|sdij|sidae|서바|survival|두각|dugak|시대인재)/i.test(blob);
  }).length;
  if (sdijLikeCount < MIN_SDIJ_STYLE_BOOKS) {
    issues.push(
      issue(
        "warning",
        "coverage:sdij-style",
        `Sidaeinjae/Dugak-style entries ${sdijLikeCount} are below minimum ${MIN_SDIJ_STYLE_BOOKS}`
      )
    );
  }

  const criticalCount = issues.filter((x) => x.severity === "critical").length;
  const warningCount = issues.filter((x) => x.severity !== "critical").length;
  const report = {
    generatedAt: new Date().toISOString(),
    strictMode: STRICT_MODE,
    sourceFile: path.relative(ROOT, CATALOG_FILE),
    sourceRegistryFile: path.relative(ROOT, REGISTRY_FILE),
    summary: {
      bookCount: books.length,
      njeOrMockCount,
      sdijLikeCount,
      criticalCount,
      warningCount,
      thresholds: {
        minBooks: MIN_BOOKS,
        minNjeOrMockBooks: MIN_NJE_OR_MOCK_BOOKS,
        minSdijStyleBooks: MIN_SDIJ_STYLE_BOOKS,
      },
    },
    issues: issues.slice(0, 300),
  };

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`[verify:catalog] books: ${books.length}`);
  console.log(
    `[verify:catalog] coverage -> nje/mock:${njeOrMockCount}, sdij-style:${sdijLikeCount}`
  );
  console.log(`[verify:catalog] issues -> critical:${criticalCount}, warning:${warningCount}`);
  console.log(`[verify:catalog] report: ${path.relative(ROOT, REPORT_FILE)}`);

  if (criticalCount > 0 || (STRICT_MODE && warningCount > 0)) {
    process.exit(1);
  }
}

function issue(severity, field, message) {
  return { severity, field, message };
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}
