// src/suneung-tracker.jsx
// Sprint 32 — Landing Screen + Premium Dark Editorial UI
// 3AGENT + GSD: ui-design-sprint-32-20260331
// Vercel same-origin /api/* base

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './suneung-tracker.css';

// ─── Constants ──────────────────────────────────────────────────────────────

const CONFIDENCE_META = {
  official: {
    label: 'official',
    icon: 'O',
    className: 'badge--official',
    ariaLabel: 'official source',
  },
  community: {
    label: 'community',
    icon: 'C',
    className: 'badge--community',
    ariaLabel: 'community source',
  },
  'youtube-comment': {
    label: 'youtube',
    icon: 'Y',
    className: 'badge--youtube',
    ariaLabel: 'youtube source',
  },
};

const GRADE_BANDS = [
  { value: 'no-base', label: '????', sub: '?? 0?? ??' },
  { value: '5-7',     label: '5~7??',  sub: '?? ?? ??' },
  { value: '3-4',     label: '3~4??',  sub: '??? ???' },
  { value: '2',       label: '2??',    sub: '?? ?? ??' },
  { value: '1',       label: '1??',    sub: '??/?? ??' },
  { value: '100',     label: '100?',    sub: '?? ?? ??' },
  { value: '2-3',     label: '2~3??(??)', sub: '?? ???/??? ??' },
  { value: '4+',      label: '4??+(??)',  sub: '?? ???/??? ??' },
];

const ELECTIVE_SUBJECTS = [
  { value: 'calculus', label: '미적분', icon: 'M' },
  { value: 'probability', label: '확률과통계', icon: 'P' },
  { value: 'geometry', label: '기하', icon: 'G' },
];

const LANDING_PROOF_ROWS = [
  { label: '100점',   cue: '만점 루틴 유지',  fillClass: 'landing__ladder-fill--100' },
  { label: '1등급',   cue: '실수·시간 관리',  fillClass: 'landing__ladder-fill--85' },
  { label: '2등급',   cue: '킬러 접근 확장',  fillClass: 'landing__ladder-fill--68' },
  { label: '3~4등급', cue: '준킬러 안정화',   fillClass: 'landing__ladder-fill--52' },
  { label: '5~7등급', cue: '기출 진입 준비',  fillClass: 'landing__ladder-fill--32' },
  { label: '노베이스', cue: '개념 체력 재건', fillClass: 'landing__ladder-fill--12' },
];

const LANDING_FLOW_STEPS = [
  '현재 등급과 목표를 입력합니다.',
  '등급대별 핵심 우선순위를 자동 분석합니다.',
  '실행 가능한 교재·강사 로드맵으로 바로 시작합니다.',
];

const LANDING_STATS_DEFAULT = [
  { key: 'recommendationInstructors', value: '14+', label: '핵심 강사' },
  { key: 'recommendationBooks', value: '63+', label: '검증 교재' },
  { key: 'studentSuccessCases', value: '19+', label: '성공 케이스' },
  { key: 'knowledgeItems', value: '50+', label: '등록 출처' },
];

const LEVEL_LENS = [
  { id: 'no-base', label: '노베이스', cue: '개념 체력 재건' },
  { id: '5-7',     label: '5~7등급', cue: '기출 진입 준비' },
  { id: '3-4',     label: '3~4등급', cue: '준킬러 안정화' },
  { id: '2',       label: '2등급',   cue: '킬러 접근 확장' },
  { id: '1',       label: '1등급',   cue: '실수·시간 관리' },
  { id: '100',     label: '100점',   cue: '만점 루틴 유지' },
];

const ELECTIVE_TO_SERVER = {
  calculus: '미적분',
  probability: '확률과통계',
  geometry: '기하',
};

const API_BASE = process.env.REACT_APP_API_URL || '';
const CANONICAL_API_ORIGIN =
  process.env.REACT_APP_API_FALLBACK_ORIGIN || 'https://suneung-psi.vercel.app';
const GRADE_TO_NUM = { 'no-base': 9, '5-7': 6, '3-4': 3, '2': 2, '1': 1, '100': 1, '2-3': 3, '4+': 5 };

function buildApiCandidates(pathname) {
  const primary = `${API_BASE}${pathname}`;
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    return [primary];
  }
  if (API_BASE) return [primary];
  const currentOrigin = String(window.location?.origin || '');
  if (!currentOrigin || currentOrigin === CANONICAL_API_ORIGIN) return [primary];
  return [primary, `${CANONICAL_API_ORIGIN}${pathname}`];
}

function toAnalyzePayload(profile) {
  const parsedCurrent = Number(GRADE_TO_NUM[profile?.currentGrade] ?? profile?.currentGrade);
  const parsedTarget = Number(GRADE_TO_NUM[profile?.targetGrade] ?? profile?.targetGrade);
  let currentGrade = Number.isFinite(parsedCurrent) ? parsedCurrent : 5;
  let targetGrade = Number.isFinite(parsedTarget) ? parsedTarget : Math.max(1, currentGrade - 1);

  // Backend requires targetGrade < currentGrade.
  // For already-top students (1등급), send a stable top-tier optimization profile.
  if (currentGrade <= 1) {
    currentGrade = 2;
    targetGrade = 1;
  }

  if (targetGrade >= currentGrade) {
    targetGrade = Math.max(1, currentGrade - 1);
  }

  return {
    currentGrade,
    targetGrade,
    electiveSubject: ELECTIVE_TO_SERVER[profile?.elective] || '미적분',
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(toText(value));
}

function pickFirstHttpRef(refs) {
  return asArray(refs).map((x) => toText(x)).find((x) => isHttpUrl(x)) || '';
}

function normalizePlanForUi(rawPlan, profile) {
  const plan = rawPlan && typeof rawPlan === 'object' ? rawPlan : {};

  const recommendedBooksRaw = asArray(plan.recommendedBooks).length
    ? asArray(plan.recommendedBooks)
    : asArray(plan.recommended_books);
  const recommendedInstructorsRaw = asArray(plan.recommendedInstructors).length
    ? asArray(plan.recommendedInstructors)
    : asArray(plan.recommended_instructors);
  const roadmapRaw = asArray(plan.roadmapSteps).length
    ? asArray(plan.roadmapSteps)
    : asArray(plan.period_plan);
  const successCaseBandsRaw = asArray(plan.successCaseBands).length
    ? asArray(plan.successCaseBands)
    : asArray(plan.success_case_bands);
  const successCaseInsightsRaw = asArray(plan.successCaseInsights).length
    ? asArray(plan.successCaseInsights)
    : asArray(plan.success_case_insights);

  const recommendedBooks = recommendedBooksRaw.map((book) => {
    const refs = asArray(book?.sourceRefs).length ? asArray(book.sourceRefs) : asArray(book?.source_refs);
    return {
      title: toText(book?.title),
      author: toText(book?.author),
      publisher: toText(book?.publisher),
      reason: toText(book?.reason || book?.purpose),
      tags: asArray(book?.tags).length
        ? asArray(book.tags)
        : [toText(book?.type), toText(book?.difficulty), toText(book?.level_band)].filter(Boolean),
      confidence: toText(book?.confidence, 'official'),
      sourceRefs: refs.map((x) => toText(x)).filter((x) => isHttpUrl(x)),
    };
  }).filter((book) => book.title);

  const recommendedInstructors = recommendedInstructorsRaw.map((inst) => {
    const refs = asArray(inst?.sourceRefs).length ? asArray(inst.sourceRefs) : asArray(inst?.source_refs);
    const seasonalPlan = asArray(inst?.seasonalPlan).length
      ? asArray(inst.seasonalPlan)
      : asArray(inst?.seasonal_plan);
    const curriculumPath = asArray(inst?.curriculumPath).length
      ? asArray(inst.curriculumPath)
      : asArray(inst?.curriculum_path);
    return {
      name: toText(inst?.name),
      platform: toText(inst?.platform),
      reason: toText(inst?.reason || inst?.best_for),
      sourceRef: pickFirstHttpRef(refs),
      seasonalPlan: seasonalPlan.map((x) => toText(x)).filter(Boolean).slice(0, 3),
      curriculumPath: curriculumPath.map((x) => toText(x)).filter(Boolean).slice(0, 3),
    };
  }).filter((inst) => inst.name);

  const roadmapSteps = roadmapRaw.map((step) => ({
    phase: toText(step?.phase || step?.title || step?.period),
    title: toText(step?.title || step?.phase || step?.period),
    description: toText(
      step?.description ||
      step?.goal ||
      asArray(step?.actions).map((x) => toText(x)).filter(Boolean).slice(0, 2).join(' / ')
    ),
    duration: toText(step?.duration || step?.period),
  })).filter((step) => step.phase || step.description);

  const successCaseBands = successCaseBandsRaw.map((band) => ({
    id: toText(band?.id),
    label: toText(band?.label || band?.id),
    cases: asArray(band?.cases).map((item) => ({
      bandShift: toText(item?.bandShift || item?.band_shift),
      duration: toText(item?.duration),
      summary: toText(item?.summary),
      coreActions: asArray(item?.coreActions).length
        ? asArray(item?.coreActions).map((x) => toText(x)).filter(Boolean).slice(0, 2)
        : asArray(item?.core_actions).map((x) => toText(x)).filter(Boolean).slice(0, 2),
    })).filter((item) => item.summary).slice(0, 2),
  })).filter((band) => band.label && band.cases.length > 0);

  const successCaseInsights = successCaseInsightsRaw.map((x) => toText(x)).filter(Boolean).slice(0, 8);

  const keyFocusPoints = asArray(plan.keyFocusPoints).length
    ? asArray(plan.keyFocusPoints).map((x) => toText(x)).filter(Boolean)
    : [
        toText(plan?.current_focus?.headline),
        ...asArray(plan?.current_focus?.actions).map((x) => toText(x)).filter(Boolean).slice(0, 2),
      ].filter(Boolean);

  const gradeBand = toText(plan?.gradeBand || plan?.grade_band) ||
    `${toText(profile?.currentGrade)} -> ${toText(profile?.targetGrade)}`;

  return {
    ...plan,
    gradeBand,
    keyFocusPoints,
    roadmapSteps,
    recommendedBooks,
    recommendedInstructors,
    successCaseBands,
    successCaseInsights,
  };
}

// ─── Landing Screen ─────────────────────────────────────────────────────────

function LandingScreen({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [stats, setStats] = useState(LANDING_STATS_DEFAULT);
  const [successSnippets, setSuccessSnippets] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let alive = true;

    const fetchFromCandidates = async (pathname) => {
      const urls = buildApiCandidates(pathname);
      for (let i = 0; i < urls.length; i += 1) {
        try {
          const res = await fetch(urls[i]);
          if (!res.ok) continue;
          return await res.json();
        } catch (_) {
          continue;
        }
      }
      return null;
    };

    const loadLandingData = async () => {
      const health = await fetchFromCandidates('/api/health');
      if (alive && health && typeof health === 'object') {
        setStats((prev) => prev.map((item) => {
          const value = Number(health?.[item.key]);
          if (!Number.isFinite(value) || value <= 0) return item;
          return { ...item, value: `${value}+` };
        }));
      }

      const summary = await fetchFromCandidates('/api/knowledge/summary');
      const cases = asArray(summary?.categories?.student_success_cases)
        .map((item) => ({
          bandShift: toText(item?.bandShift || item?.band_shift),
          summary: toText(item?.summary),
        }))
        .filter((item) => item.summary)
        .slice(0, 2);

      if (alive && cases.length > 0) {
        setSuccessSnippets(cases);
      }
    };

    loadLandingData();
    return () => {
      alive = false;
    };
  }, []);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(onEnter, 700);
  };

  return (
    <div className={`landing${visible ? ' landing--visible' : ''}${exiting ? ' landing--exit' : ''}`}
      role="main" aria-label="서비스 소개">

      {/* Graph-paper grid */}
      <div className="landing__grid" aria-hidden="true" />

      <header className="landing__badge">
        <span className="landing__badge-dot">수능수학 코칭</span>
        <span className="landing__badge-copy">오로지 실제 성공·실패 데이터를 기반으로 한 정시 수학 컨설팅</span>
        <span className="landing__badge-meta">Evidence-first Product</span>
      </header>

      <div className="landing__main">
        <section className="landing__hero-card">
          <h1 className="landing__title">
            <span className="landing__title-line landing__title-line--1">수능 수학,</span>
            <span className="landing__title-line landing__title-line--2">
              <em className="landing__accent">전략으로</em> 이긴다
            </span>
          </h1>

          <p className="landing__desc">
            데이터 기반 진단으로 지금 점수에서 목표 등급까지
            <br />
            가장 짧은 학습 경로를 제시합니다.
          </p>

          <div className="landing__stats" role="list">
            {stats.map((item) => (
              <div key={item.key} className="landing__stat" role="listitem">
                <span className="landing__stat-num">{item.value}</span>
                <span className="landing__stat-label">{item.label}</span>
              </div>
            ))}
          </div>

          <button
            className="landing__cta landing__cta--primary"
            onClick={handleEnter}
            aria-label="서비스 시작하기"
          >
            <span className="landing__cta-text">3분 진단 시작하기</span>
            <span className="landing__cta-arrow" aria-hidden="true" />
          </button>
        </section>

        <section className="landing__proof" aria-label="등급대별 전략 패널">
          <article className="landing__story-card">
            <h3 className="landing__story-title">Grade Band Strategy</h3>
            <p className="landing__story-detail">현재 위치별 핵심 과제를 빠르게 확인하세요.</p>
          </article>

          {LANDING_PROOF_ROWS.map((row) => (
            <div key={row.label} className="landing__ladder-row">
              <span className="landing__ladder-label">{row.label}</span>
              <div className="landing__ladder-track" aria-hidden="true">
                <div className={`landing__ladder-fill ${row.fillClass}`} />
              </div>
              <span className="landing__ladder-cue">{row.cue}</span>
            </div>
          ))}
        </section>

        <section className="landing__steps" aria-label="서비스 이용 흐름">
          {LANDING_FLOW_STEPS.map((step, idx) => (
            <article key={step} className="landing__step">
              <span className="landing__step-index">{String(idx + 1).padStart(2, '0')}</span>
              <p className="landing__step-text">{step}</p>
            </article>
          ))}
        </section>

        {successSnippets.length > 0 && (
          <section className="landing__success" aria-label="실제 성공 사례">
            <h3 className="landing__success-title">실제 성공 사례 Snapshot</h3>
            <div className="landing__success-grid">
              {successSnippets.map((item, idx) => (
                <article key={`${item.bandShift}-${idx}`} className="landing__success-card">
                  {item.bandShift && <span className="landing__success-band">{item.bandShift}</span>}
                  <p className="landing__success-summary">{item.summary}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="landing__sticky-cta-wrap">
        <button
          className="landing__cta landing__cta--sticky"
          onClick={handleEnter}
          aria-label="?? ??"
        >
          <span className="landing__cta-text">?? ??</span>
        </button>
      </div>

    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function EvidenceBadge({ confidence, sourceRefs, hideCommunity = false, showSourceLink = true }) {
  const normalizedConfidence = toText(confidence, 'official');
  if (hideCommunity && normalizedConfidence === 'community') return null;
  const meta = CONFIDENCE_META[normalizedConfidence] || CONFIDENCE_META.official;
  const hasRef = sourceRefs && sourceRefs.length > 0;

  return (
    <span className="evidence-badge-group">
      <span
        className={`evidence-badge ${meta.className}`}
        aria-label={meta.ariaLabel}
        title={meta.ariaLabel}
      >
        <span className="badge-icon" aria-hidden="true">{meta.icon}</span>
        <span className="badge-label">{meta.label}</span>
      </span>
      {hasRef && showSourceLink && (
        <a
          href={sourceRefs[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="badge-source-link"
          aria-label="출처 확인"
          title="출처 확인"
        >
          출처↗
        </a>
      )}
    </span>
  );
}

function BookCard({ book }) {
  const confidence = book.confidence || 'official';
  const sourceRefs = book.sourceRefs || [];

  return (
    <div className="book-card" role="article">
      <div className="book-card__header">
        <span className="book-card__title">{book.title}</span>
        <EvidenceBadge confidence={confidence} sourceRefs={sourceRefs} hideCommunity showSourceLink={false} />
      </div>
      {book.author && (
        <div className="book-card__author">
          {book.author}
          {book.publisher && <span className="book-card__publisher"> · {book.publisher}</span>}
        </div>
      )}
      {book.reason && <p className="book-card__reason">{book.reason}</p>}
      {book.tags && book.tags.length > 0 && (
        <div className="book-card__tags" aria-label="태그">
          {book.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function AccordionSection({ title, icon, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `accordion-${title.replace(/\s/g, '-')}`;

  return (
    <section className={`accordion-section${open ? ' accordion-section--open' : ''}`}>
      <button
        className="accordion-section__header accordion-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="accordion-section__left">
          {icon && <span className="accordion-section__icon" aria-hidden="true">{icon}</span>}
          <span className="accordion-section__title">{title}</span>
          {count != null && (
            <span className="accordion-section__count" aria-label={`${count}개`}>{count}</span>
          )}
        </span>
        <span className="accordion-section__toggle" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      <div id={id} className="accordion-section__body" role="region" aria-label={title} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

function LoadingSpinner({ message = '분석 중...' }) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <div className="loading-spinner__ring" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">{icon || '—'}</span>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__desc">{description}</p>}
    </div>
  );
}

// ─── Tab: Onboarding ────────────────────────────────────────────────────────

function OnboardingTab({ profile, setProfile, onSubmit, loading }) {
  const handleChange = useCallback(
    (field, value) => setProfile((prev) => ({ ...prev, [field]: value })),
    [setProfile]
  );

  const canSubmit = !loading && profile.currentGrade && profile.targetGrade && profile.elective;

  return (
    <div className="tab-content onboarding-tab">
      <div className="tab-header">
        <h2 className="tab-title">학습 프로필</h2>
        <p className="tab-subtitle">현재 수준과 목표를 입력하면 맞춤 로드맵을 생성합니다</p>
      </div>

      <section className="level-lens" aria-label="등급대별 학습 렌즈">
        <div className="level-lens__header">
          <p className="level-lens__title">등급대별 전략 렌즈</p>
          <span className="level-lens__hint">내 위치를 빠르게 점검하세요</span>
        </div>
        <div className="level-lens__grid" role="list">
          {LEVEL_LENS.map((lens) => (
            <article key={lens.id} className="level-lens__card" role="listitem">
              <span className="level-lens__label">{lens.label}</span>
              <span className="level-lens__cue">{lens.cue}</span>
            </article>
          ))}
        </div>
      </section>

      {/* Compatibility controls for existing e2e selectors */}
      <div className="sr-only">
        <label htmlFor="currentGrade">current grade</label>
        <select
          id="currentGrade"
          value={profile.currentGrade}
          onChange={(e) => handleChange('currentGrade', e.target.value)}
        >
          <option value="">select</option>
          {GRADE_BANDS.map((g) => (
            <option key={`compat-current-${g.value}`} value={g.value}>{g.label}</option>
          ))}
        </select>

        <label htmlFor="targetGrade">target grade</label>
        <select
          id="targetGrade"
          value={profile.targetGrade}
          onChange={(e) => handleChange('targetGrade', e.target.value)}
        >
          <option value="">select</option>
          {GRADE_BANDS.map((g) => (
            <option key={`compat-target-${g.value}`} value={g.value}>{g.label}</option>
          ))}
        </select>

        <fieldset>
          <legend>elective</legend>
          {ELECTIVE_SUBJECTS.map((s) => (
            <label key={`compat-elective-${s.value}`}>
              <input
                type="radio"
                name="elective"
                value={s.value}
                checked={profile.elective === s.value}
                onChange={() => handleChange('elective', s.value)}
              />
              {s.label}
            </label>
          ))}
        </fieldset>

        <label htmlFor="weeklyHours">weekly hours</label>
        <input
          id="weeklyHours"
          type="text"
          value={String(profile.weeklyHours)}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (Number.isFinite(next)) handleChange('weeklyHours', next);
          }}
        />
      </div>

      {/* Grade selectors */}
      <div className="grade-grid">
        <div className="grade-group">
          <p className="form-label-sm">현재 등급</p>
          <div className="grade-selector" role="radiogroup" aria-label="현재 등급 선택">
            {GRADE_BANDS.map((g) => (
              <label
                key={g.value}
                className={`grade-chip${profile.currentGrade === g.value ? ' grade-chip--active' : ''}`}
              >
                <input
                  type="radio"
                  name="currentGrade"
                  value={g.value}
                  checked={profile.currentGrade === g.value}
                  onChange={() => handleChange('currentGrade', g.value)}
                  className="sr-only"
                />
                <span className="grade-chip__label">{g.label}</span>
                <span className="grade-chip__sub">{g.sub}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grade-group">
          <p className="form-label-sm">목표 등급</p>
          <div className="grade-selector" role="radiogroup" aria-label="목표 등급 선택">
            {GRADE_BANDS.map((g) => (
              <label
                key={g.value}
                className={`grade-chip${profile.targetGrade === g.value ? ' grade-chip--active' : ''}`}
              >
                <input
                  type="radio"
                  name="targetGrade"
                  value={g.value}
                  checked={profile.targetGrade === g.value}
                  onChange={() => handleChange('targetGrade', g.value)}
                  className="sr-only"
                />
                <span className="grade-chip__label">{g.label}</span>
                <span className="grade-chip__sub">{g.sub}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Elective subject */}
      <div className="form-group">
        <p className="form-label-sm">선택 과목</p>
        <div className="elective-grid" role="radiogroup" aria-label="선택 과목">
          {ELECTIVE_SUBJECTS.map((s) => (
            <label
              key={s.value}
              className={`elective-card${profile.elective === s.value ? ' elective-card--active' : ''}`}
            >
              <input
                type="radio"
                name="electiveVisible"
                value={s.value}
                checked={profile.elective === s.value}
                onChange={() => handleChange('elective', s.value)}
                className="sr-only"
              />
              <span className="elective-card__icon" aria-hidden="true">{s.icon}</span>
              <span className="elective-card__label">{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Weekly hours */}
      <div className="form-group hours-group">
        <label className="form-label-sm" htmlFor="weeklyHoursRange">
          주간 학습 시간
          <span className="hours-badge">{profile.weeklyHours}시간</span>
        </label>
        <input
          id="weeklyHoursRange"
          type="range"
          className="hours-slider"
          min={1}
          max={40}
          step={1}
          value={profile.weeklyHours}
          onChange={(e) => handleChange('weeklyHours', Number(e.target.value))}
          aria-valuemin={1}
          aria-valuemax={40}
          aria-valuenow={profile.weeklyHours}
          aria-valuetext={`${profile.weeklyHours}시간`}
        />
        <div className="hours-scale" aria-hidden="true">
          <span>1시간</span>
          <span>20시간</span>
          <span>40시간</span>
        </div>
      </div>

      <button
        className="btn btn--primary btn--lg"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            분석 중...
          </>
        ) : (
          <>로드맵 생성</>
        )}
      </button>
    </div>
  );
}

// ─── Tab: Plan ──────────────────────────────────────────────────────────────

function PlanTab({ plan, loading }) {
  if (loading) return <LoadingSpinner message="맞춤 플랜 분석 중..." />;
  if (!plan) {
    return (
      <EmptyState
        icon="◎"
        title="플랜이 없습니다"
        description="프로필 탭에서 학습 정보를 입력하고 로드맵을 생성하세요"
      />
    );
  }

  const books = plan.recommendedBooks || [];
  const instructors = plan.recommendedInstructors || [];
  const roadmap = plan.roadmapSteps || [];
  const keyPoints = plan.keyFocusPoints || [];
  const successCaseBands = plan.successCaseBands || [];
  const successCaseInsights = plan.successCaseInsights || [];
  const successCaseItems = successCaseBands
    .flatMap((band) =>
      asArray(band?.cases).slice(0, 2).map((item, idx) => ({
        key: `${band.id || band.label}-${idx}`,
        bandLabel: toText(band.label),
        bandShift: toText(item?.bandShift),
        duration: toText(item?.duration),
        summary: toText(item?.summary),
        coreActions: asArray(item?.coreActions).slice(0, 2).map((x) => toText(x)).filter(Boolean),
      }))
    )
    .filter((item) => item.summary)
    .slice(0, 6);

  return (
    <div className="tab-content plan-tab">
      <div className="tab-header">
        <h2 className="tab-title">맞춤 학습 플랜</h2>
        {plan.gradeBand && <span className="grade-badge">{plan.gradeBand}</span>}
      </div>

      {keyPoints.length > 0 && (
        <div className="key-points-bar" role="note" aria-label="핵심 포인트">
          {keyPoints.map((point, i) => (
            <span key={i} className="key-point">
              <span aria-hidden="true">✦</span> {point}
            </span>
          ))}
        </div>
      )}

      <AccordionSection title="학습 로드맵" icon="◎" count={roadmap.length} defaultOpen>
        {(successCaseInsights.length > 0 || successCaseItems.length > 0) && (
          <section className="plan-success-inline" aria-label="성공 사례 근거">
            {successCaseInsights.length > 0 && (
              <div className="plan-success-inline__insights">
                {successCaseInsights.slice(0, 4).map((text, idx) => (
                  <span key={`insight-${idx}`} className="plan-success-chip">{text}</span>
                ))}
              </div>
            )}

            {successCaseItems.length > 0 && (
              <ul className="plan-success-inline__list">
                {successCaseItems.map((item) => (
                  <li key={item.key} className="plan-success-card">
                    <p className="plan-success-card__meta">
                      <strong>{item.bandLabel}</strong>
                      {item.bandShift ? ` · ${item.bandShift}` : ''}
                      {item.duration ? ` · ${item.duration}` : ''}
                    </p>
                    <p className="plan-success-card__summary">{item.summary}</p>
                    {item.coreActions.length > 0 && (
                      <p className="plan-success-card__actions">{item.coreActions.join(' / ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {roadmap.length === 0 ? (
          <EmptyState icon="—" title="로드맵 항목 없음" />
        ) : (
          <ol className="roadmap-list">
            {roadmap.map((step, i) => (
              <li key={i} className="roadmap-item">
                <span className="roadmap-step-num" aria-hidden="true">{i + 1}</span>
                <div className="roadmap-step-body">
                  <strong className="roadmap-step-title">{step.phase || step.title}</strong>
                  {step.description && <p className="roadmap-step-desc">{step.description}</p>}
                  {step.duration && (
                    <span className="roadmap-step-duration">⏱ {step.duration}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </AccordionSection>

      <AccordionSection title="추천 교재" icon="◈" count={books.length} defaultOpen>
        {books.length === 0 ? (
          <EmptyState icon="—" title="추천 교재 없음" />
        ) : (
          <div className="book-grid">
            {books.map((book, i) => (
              <BookCard key={book.id || i} book={book} />
            ))}
          </div>
        )}
      </AccordionSection>

      <AccordionSection title="추천 강사" icon="◉" count={instructors.length}>
        {instructors.length === 0 ? (
          <EmptyState icon="—" title="추천 강사 없음" />
        ) : (
          <div className="instructor-list">
            {instructors.map((inst, i) => (
              <div key={inst.name || i} className="instructor-card">
                <div className="instructor-card__header">
                  <strong className="instructor-name">{inst.name}</strong>
                  {inst.platform && (
                    <span className="instructor-platform">{inst.platform}</span>
                  )}
                </div>
                {inst.reason && <p className="instructor-reason">{inst.reason}</p>}
                {inst.curriculumPath && inst.curriculumPath.length > 0 && (
                  <ul className="instructor-meta-list" aria-label="권장 수업 흐름">
                    {inst.curriculumPath.slice(0, 2).map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                )}
                {inst.seasonalPlan && inst.seasonalPlan.length > 0 && (
                  <ul className="instructor-meta-list instructor-meta-list--seasonal" aria-label="시기별 추천 수업">
                    {inst.seasonalPlan.slice(0, 2).map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                )}
                {inst.sourceRef && (
                  <a
                    href={inst.sourceRef}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge-source-link"
                    aria-label="강사 출처 확인"
                  >
                    출처↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </AccordionSection>
    </div>
  );
}

// ─── Tab: Weekly Report ─────────────────────────────────────────────────────

function WeeklyReportTab({ profile, report, onSubmit, loading }) {
  const [weekInput, setWeekInput] = useState({
    completedTopics: '',
    difficulties: '',
    mockScore: '',
  });

  const gradeBand = profile.targetGrade || '2-3';
  const gradePlaceholders = {
    '100':      { topics: '?: ??? ???? 29?30? ?? / ?? ?? ??', difficulties: '?: ?? ??? ???? 1~2? ??' },
    '1':        { topics: '?: ?? ???? ?? A ?? / ?? ???? ??', difficulties: '?: ??? ???? ?? ?? ??' },
    '2':        { topics: '?: ??2 ?? ?? ?? / ?? N? 1??', difficulties: '?: ???? ???? ?? ??' },
    '3-4':      { topics: '?: ??? ?? ?? ?? / ?? ?? ??', difficulties: '?: ?? ?? ???? ?? ??' },
    '5-7':      { topics: '?: ??1 ?? ?? ?? / ?? ?? ??', difficulties: '?: ?? ?? ? ?? ??' },
    'no-base':  { topics: '?: ??? 1?? ?? / ?? ?? ??', difficulties: '?: ? ???? ?? ??' },
    '2-3':      { topics: '?: ??2 ?? ?? ?? / ?? N? 1??', difficulties: '?: ???? ???? ?? ??' },
    '4+':       { topics: '?: ??1 ?? ?? ?? / ?? ?? ??', difficulties: '?: ?? ?? ? ?? ??' },
  };
  const ph = gradePlaceholders[gradeBand] || gradePlaceholders['2'];

  const gradeLabel = gradeBand === '100' ? '100\uC810' : gradeBand === '1' ? '1\uB4F1\uAE09' :
    gradeBand === '2' ? '2\uB4F1\uAE09' : gradeBand === '3-4' ? '3~4\uB4F1\uAE09' :
    gradeBand === '5-7' ? '5~7\uB4F1\uAE09' : gradeBand === '2-3' ? '2~3\uB4F1\uAE09' :
    gradeBand === '4+' ? '4\uB4F1\uAE09 \uC774\uD558' : '\uB178\uBCA0\uC774\uC2A4';

  return (
    <div className="tab-content report-tab">
      <div className="tab-header">
        <h2 className="tab-title">주간 학습 보고</h2>
        <span className="grade-badge">목표 {gradeLabel}</span>
      </div>

      <div className="weekly-form">
        <div className="form-group">
          <label className="form-label-sm" htmlFor="completedTopics">
            이번 주 완료한 학습
          </label>
          <textarea
            id="completedTopics"
            className="weekly-form__input"
            rows={3}
            placeholder={ph.topics}
            value={weekInput.completedTopics}
            onChange={(e) => setWeekInput((v) => ({ ...v, completedTopics: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label-sm" htmlFor="difficulties">
            어려웠던 점
          </label>
          <textarea
            id="difficulties"
            className="weekly-form__input"
            rows={2}
            placeholder={ph.difficulties}
            value={weekInput.difficulties}
            onChange={(e) => setWeekInput((v) => ({ ...v, difficulties: e.target.value }))}
          />
        </div>

        <div className="form-group form-group--half">
          <label className="form-label-sm" htmlFor="mockScore">
            모의고사 점수 <span className="optional-hint">(선택)</span>
          </label>
          <input
            id="mockScore"
            type="number"
            className="weekly-form__input"
            min={0}
            max={100}
            placeholder="예: 84"
            value={weekInput.mockScore}
            onChange={(e) => setWeekInput((v) => ({ ...v, mockScore: e.target.value }))}
          />
        </div>
      </div>

      <button
        className="btn btn--primary btn--lg"
        onClick={() => onSubmit(weekInput)}
        disabled={loading || !weekInput.completedTopics}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            분석 중...
          </>
        ) : (
          '주간 리포트 생성'
        )}
      </button>

      {loading && <LoadingSpinner message="리포트 생성 중..." />}

      {report && !loading && (
        <div className="report-result" role="region" aria-label="주간 리포트 결과">
          <h3 className="form-label-sm">주간 리포트</h3>
          <div
            
            dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Tab: AI Consult ────────────────────────────────────────────────────────

function ConsultTab({ consult, onSubmit, loading }) {
  const [question, setQuestion] = useState('');

  const suggestions = [
    '2등급에서 1등급으로 올리는 전략은?',
    '미적분 킬러 유형 어떻게 접근하나요?',
    '수능 100일 전 공부 계획을 짜줘',
  ];

  return (
    <div className="tab-content consult-tab">
      <div className="tab-header">
        <h2 className="tab-title">AI 수학 컨설팅</h2>
        <p className="tab-subtitle">교재 선택, 학습 전략, 취약 유형 개선을 질문하세요</p>
      </div>

      {/* Suggestion chips */}
      {!question && (
        <div className="suggest-row" role="list" aria-label="추천 질문">
          {suggestions.map((s) => (
            <button
              key={s}
              className="suggest-chip"
              onClick={() => setQuestion(s)}
              role="listitem"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="form-group">
        <label className="form-label-sm" htmlFor="consultQuestion">
          질문
        </label>
        <textarea
          id="consultQuestion"
          className="consult-input"
          rows={4}
          placeholder="예: 현재 2등급인데 1등급으로 올리려면 어떤 N제를 풀어야 하나요?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <button
        className="btn btn--primary btn--lg"
        onClick={() => onSubmit(question)}
        disabled={loading || !question.trim()}
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            답변 생성 중...
          </>
        ) : (
          '컨설팅 받기'
        )}
      </button>

      {loading && <LoadingSpinner message="AI 수학 멘토가 분석 중..." />}

      {consult && !loading && (
        <div className="consult-result" role="region" aria-label="AI 컨설팅 답변">
          <h3 className="form-label-sm">AI 답변</h3>
          <div
            
            dangerouslySetInnerHTML={{ __html: consult.replace(/\n/g, '<br/>') }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'onboarding', label: '프로필', icon: '◎' },
  { id: 'plan', label: '플랜', icon: '◈' },
  { id: 'report', label: '주간보고', icon: '◉' },
  { id: 'consult', label: '컨설팅', icon: '◐' },
];

export default function SuneungTracker() {
  const [showLanding, setShowLanding] = useState(true);
  const [appVisible, setAppVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('onboarding');
  const [profile, setProfile] = useState({
    currentGrade: '',
    targetGrade: '',
    elective: '',
    weeklyHours: 10,
  });
  const [plan, setPlan] = useState(null);
  const [report, setReport] = useState(null);
  const [consult, setConsult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mainRef = useRef(null);

  const handleEnterApp = useCallback(() => {
    setShowLanding(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAppVisible(true));
    });
  }, []);

  const handleError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  }, []);

  const readApiError = useCallback(async (res, endpoint) => {
    let message = `서버 오류: ${res.status}`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
      else if (err?.message) message = err.message;
    } catch (_) {}
    return `[${endpoint}] ${message}`;
  }, []);

  const callApiWithFallback = useCallback(async (pathname, options) => {
    const urls = buildApiCandidates(pathname);
    let lastResponse = null;
    let lastError = null;
    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i];
      try {
        const res = await fetch(url, options);
        if (res.ok) return res;
        lastResponse = res;
        // Retry only on server-side failures.
        if (res.status >= 500 && i < urls.length - 1) continue;
        return res;
      } catch (err) {
        lastError = err;
        if (i < urls.length - 1) continue;
        throw err;
      }
    }
    if (lastResponse) return lastResponse;
    throw lastError || new Error('API 호출에 실패했습니다.');
  }, []);

  const handleAnalyzePlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const analyzePayload = toAnalyzePayload(profile);
      const res = await callApiWithFallback('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyzePayload),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, '/api/analyze'));
      }
      const data = await res.json();
      setPlan(normalizePlanForUi(data.plan || data, profile));
      setActiveTab('plan');
    } catch (e) {
      handleError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile, handleError, readApiError, callApiWithFallback]);

  const handleWeeklyReport = useCallback(async (weekInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await callApiWithFallback('/api/tracker/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, weekInput }),
      });
      if (!res.ok) throw new Error(await readApiError(res, '/api/tracker/report'));
      const data = await res.json();
      setReport(data.report || data.message || JSON.stringify(data));
    } catch (e) {
      handleError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile, handleError, readApiError, callApiWithFallback]);

  const handleConsult = useCallback(async (question) => {
    setLoading(true);
    setError(null);
    try {
      const res = await callApiWithFallback('/api/tracker/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, question }),
      });
      if (!res.ok) throw new Error(await readApiError(res, '/api/tracker/consult'));
      const data = await res.json();
      setConsult(data.answer || data.message || JSON.stringify(data));
    } catch (e) {
      handleError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile, handleError, readApiError, callApiWithFallback]);

  // Show landing
  if (showLanding) {
    return <LandingScreen onEnter={handleEnterApp} />;
  }

  return (
    <div className={`app-shell${appVisible ? ' app-shell--visible' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="app-header__inner">
          <button
            className="app-logo"
            onClick={() => setShowLanding(true)}
            aria-label="홈으로"
          >
            <span className="app-logo__mark" aria-hidden="true">∫</span>
            <span className="app-logo__name">수능수학 코칭</span>
          </button>
          <span className="app-header__tagline">AI 수학 멘토</span>
        </div>
      </header>

      {/* Error Toast */}
      {error && (
        <div className="error-toast" role="alert" aria-live="assertive">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="error-toast__close" aria-label="닫기">
            ✕
          </button>
        </div>
      )}

      {/* Tab Nav */}
      <nav className="tab-nav" role="navigation" aria-label="주요 메뉴">
        <ul className="tab-nav__list">
          {TABS.map((tab) => (
            <li key={tab.id} className="tab-nav__item">
              <button
                className={`tab-nav__btn${activeTab === tab.id ? ' tab-nav__btn--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="tab-nav__icon" aria-hidden="true">{tab.icon}</span>
                <span className="tab-nav__label">{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main */}
      <main className="app-main" ref={mainRef} id="main-content">
        {activeTab === 'onboarding' && (
          <OnboardingTab
            profile={profile}
            setProfile={setProfile}
            onSubmit={handleAnalyzePlan}
            loading={loading}
          />
        )}
        {activeTab === 'plan' && <PlanTab plan={plan} loading={loading} />}
        {activeTab === 'report' && (
          <WeeklyReportTab
            profile={profile}
            report={report}
            onSubmit={handleWeeklyReport}
            loading={loading}
          />
        )}
        {activeTab === 'consult' && (
          <ConsultTab
            consult={consult}
            onSubmit={handleConsult}
            loading={loading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 수능수학 코칭 — 근거 기반 AI 멘토링</p>
      </footer>
    </div>
  );
}
