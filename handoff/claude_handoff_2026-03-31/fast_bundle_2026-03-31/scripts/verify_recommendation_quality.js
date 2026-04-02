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
const MIN_MEGA_INSTRUCTORS = Number(process.env.MIN_MEGA_INSTRUCTORS || 3);
const MIN_DAESUNG_INSTRUCTORS = Number(process.env.MIN_DAESUNG_INSTRUCTORS || 3);
const MIN_INTRO_NJE_BOOKS = Number(process.env.MIN_INTRO_NJE_BOOKS || 3);
const MIN_MID_NJE_BOOKS = Number(process.env.MIN_MID_NJE_BOOKS || 5);
const MIN_HIGH_NJE_BOOKS = Number(process.env.MIN_HIGH_NJE_BOOKS || 8);

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
  const instructors = Array.isArray(catalog?.instructors) ? catalog.instructors : [];
  const books = Array.isArray(catalog?.books) ? catalog.books : [];
  const sources = Array.isArray(registry?.sources) ? registry.sources : [];
  const sourceIdSet = new Set(
    sources
      .map((x) => (typeof x?.id === "string" ? x.id.trim() : ""))
      .filter(Boolean)
  );
  const sourceTypeMap = new Map(
    sources
      .filter((x) => typeof x?.id === "string")
      .map((x) => [x.id.trim(), text(x.type).toLowerCase()])
  );

  const issues = [];
  const titleSeen = new Map();
  const instructorSeen = new Map();
  const njeBandCounter = { intro_nje: 0, mid_nje: 0, high_nje: 0 };

  for (const inst of instructors) {
    const name = text(inst?.name);
    if (!name) {
      issues.push(issue("critical", "instructors[].name", "instructor name is missing"));
      continue;
    }
    const key = name.toLowerCase();
    const prev = instructorSeen.get(key);
    if (prev) {
      issues.push(issue("warning", `instructor:${name}`, `duplicate instructor also seen in: ${prev}`));
    } else {
      instructorSeen.set(key, name);
    }

    const passAvailability = Array.isArray(inst?.passAvailability)
      ? inst.passAvailability.map((x) => text(x).toLowerCase()).filter(Boolean)
      : [];
    const curriculumPath = Array.isArray(inst?.curriculumPath) ? inst.curriculumPath : [];
    const seasonalPlan = Array.isArray(inst?.seasonalPlan) ? inst.seasonalPlan : [];
    const sourceRefs = Array.isArray(inst?.sourceRefs) ? inst.sourceRefs.map((x) => text(x)).filter(Boolean) : [];

    if (passAvailability.length === 0) {
      issues.push(issue("warning", `instructor:${name}:passAvailability`, "passAvailability is empty"));
    }
    if (curriculumPath.length < 3) {
      issues.push(issue("warning", `instructor:${name}:curriculumPath`, "curriculumPath should have >= 3 stages"));
    }
    if (seasonalPlan.length < 2) {
      issues.push(issue("warning", `instructor:${name}:seasonalPlan`, "seasonalPlan should have >= 2 periods"));
    }
    if (sourceRefs.length === 0) {
      issues.push(issue("warning", `instructor:${name}:sourceRefs`, "sourceRefs is empty"));
    }

    let hasOfficial = false;
    let hasCommunity = false;
    let hasYoutube = false;
    for (const ref of sourceRefs) {
      if (!sourceIdSet.has(ref)) {
        issues.push(issue("warning", `instructor:${name}:sourceRefs`, `unknown sourceRef: ${ref}`));
        continue;
      }
      const type = sourceTypeMap.get(ref) || "";
      if (type.includes("official")) hasOfficial = true;
      if (type.includes("youtube")) {
        hasOfficial = true;
        hasYoutube = true;
      }
      if (type.includes("community")) hasCommunity = true;
    }
    if (!hasOfficial || !hasCommunity) {
      issues.push(
        issue(
          "warning",
          `instructor:${name}:validation`,
          "instructor should include both official and community validation refs"
        )
      );
    }
    if (isOnsiteAcademyInstructor(inst, sourceRefs) && !hasYoutube) {
      issues.push(
        issue(
          "warning",
          `instructor:${name}:youtube`,
          "onsite academy instructor should include at least one youtube-based reference"
        )
      );
    }
  }

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
    const levelBand = text(book?.levelBand).toLowerCase();
    if (isNjeLikeBook(book)) {
      if (!["intro_nje", "mid_nje", "high_nje"].includes(levelBand)) {
        issues.push(issue("warning", `book:${title}:levelBand`, "NJE-like book should include levelBand"));
      } else {
        njeBandCounter[levelBand] = (njeBandCounter[levelBand] || 0) + 1;
      }
    }
    if (isEbsLikeBook(book) && fitKeys.includes("3-1")) {
      issues.push(
        issue(
          "warning",
          `book:${title}:fitKeys`,
          "EBS-like entries should not target 3-1 top-tier band as a primary recommendation"
        )
      );
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

  const megaInstructorCount = instructors.filter((inst) => /mega|메가/i.test(text(inst?.platform))).length;
  const daesungInstructorCount = instructors.filter((inst) => /daesung|mimac|대성/i.test(text(inst?.platform))).length;
  if (megaInstructorCount < MIN_MEGA_INSTRUCTORS) {
    issues.push(
      issue(
        "warning",
        "coverage:mega-instructors",
        `Megastudy instructors ${megaInstructorCount} are below minimum ${MIN_MEGA_INSTRUCTORS}`
      )
    );
  }
  if (daesungInstructorCount < MIN_DAESUNG_INSTRUCTORS) {
    issues.push(
      issue(
        "warning",
        "coverage:daesung-instructors",
        `Daesung/Mimac instructors ${daesungInstructorCount} are below minimum ${MIN_DAESUNG_INSTRUCTORS}`
      )
    );
  }
  if (njeBandCounter.intro_nje < MIN_INTRO_NJE_BOOKS) {
    issues.push(
      issue(
        "warning",
        "coverage:intro-nje",
        `intro NJE books ${njeBandCounter.intro_nje} are below minimum ${MIN_INTRO_NJE_BOOKS}`
      )
    );
  }
  if (njeBandCounter.mid_nje < MIN_MID_NJE_BOOKS) {
    issues.push(
      issue(
        "warning",
        "coverage:mid-nje",
        `mid NJE books ${njeBandCounter.mid_nje} are below minimum ${MIN_MID_NJE_BOOKS}`
      )
    );
  }
  if (njeBandCounter.high_nje < MIN_HIGH_NJE_BOOKS) {
    issues.push(
      issue(
        "warning",
        "coverage:high-nje",
        `high NJE books ${njeBandCounter.high_nje} are below minimum ${MIN_HIGH_NJE_BOOKS}`
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
      instructorCount: instructors.length,
      njeOrMockCount,
      sdijLikeCount,
      megaInstructorCount,
      daesungInstructorCount,
      njeBandCounter,
      criticalCount,
      warningCount,
      thresholds: {
        minBooks: MIN_BOOKS,
        minNjeOrMockBooks: MIN_NJE_OR_MOCK_BOOKS,
        minSdijStyleBooks: MIN_SDIJ_STYLE_BOOKS,
        minMegaInstructors: MIN_MEGA_INSTRUCTORS,
        minDaesungInstructors: MIN_DAESUNG_INSTRUCTORS,
        minIntroNjeBooks: MIN_INTRO_NJE_BOOKS,
        minMidNjeBooks: MIN_MID_NJE_BOOKS,
        minHighNjeBooks: MIN_HIGH_NJE_BOOKS,
      },
    },
    issues: issues.slice(0, 300),
  };

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`[verify:catalog] books: ${books.length}`);
  console.log(`[verify:catalog] instructors: ${instructors.length}`);
  console.log(
    `[verify:catalog] coverage -> nje/mock:${njeOrMockCount}, sdij-style:${sdijLikeCount}, mega:${megaInstructorCount}, daesung:${daesungInstructorCount}, intro_nje:${njeBandCounter.intro_nje}, mid_nje:${njeBandCounter.mid_nje}, high_nje:${njeBandCounter.high_nje}`
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

function isOnsiteAcademyInstructor(inst, sourceRefs) {
  const blob = [
    inst?.name,
    inst?.platform,
    ...(Array.isArray(inst?.styleTags) ? inst.styleTags : []),
    ...(Array.isArray(sourceRefs) ? sourceRefs : []),
  ]
    .map((x) => text(x).toLowerCase())
    .join(" ");
  return /(sidae|sdij|dugak|sii|onsite|academy|gangnam daesung)/i.test(blob);
}

function isEbsLikeBook(book) {
  const blob = [book?.title, book?.type, book?.purpose]
    .map((x) => text(x).toLowerCase())
    .join(" ");
  return /(ebs|ebsi|suneungteukgang|suneungwanseong)/i.test(blob);
}

function isNjeLikeBook(book) {
  const blob = [book?.title, book?.type, book?.purpose]
    .map((x) => text(x).toLowerCase())
    .join(" ");
  return /(n제|n-set|nset|nje|drill|survival|4의 규칙|규토)/i.test(blob);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}
