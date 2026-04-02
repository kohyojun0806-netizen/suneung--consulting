// src/suneung-tracker.jsx
// Sprint 32 — Landing Screen + Premium Dark Editorial UI
// 3AGENT + GSD: ui-design-sprint-32-20260331
// Vercel same-origin /api/* base

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './suneung-tracker.css';

// ─── Constants ──────────────────────────────────────────────────────────────

const CONFIDENCE_META = {
  official: {
    label: '공식',
    icon: '◈',
    className: 'badge--official',
    ariaLabel: '공식 검증 출처',
  },
  community: {
    label: '커뮤니티',
    icon: '◉',
    className: 'badge--community',
    ariaLabel: '커뮤니티 검증 출처',
  },
  'youtube-comment': {
    label: '유튜브',
    icon: '▶',
    className: 'badge--youtube',
    ariaLabel: '유튜브 커뮤니티 출처',
  },
};

const GRADE_BANDS = [
  { value: '1', label: '1등급', sub: '상위 4%' },
  { value: '2-3', label: '2~3등급', sub: '상위 5~23%' },
  { value: '4+', label: '4등급 이하', sub: '기초~중급' },
];

const ELECTIVE_SUBJECTS = [
  { value: 'calculus', label: '미적분', icon: '∫' },
  { value: 'probability', label: '확률과 통계', icon: 'P' },
  { value: 'geometry', label: '기하', icon: '△' },
];

const LANDING_STORYLINES = [
  {
    headline: '오로지 실제 성공/실패 데이터 기반',
    detail: '후기, 커뮤니티, 강사 보드, 영상 질문 패턴을 교차 검증해 계획을 구성합니다.',
  },
  {
    headline: '수능 수학 전문가 인사이트',
    detail: '등급대별 병목 구간과 시기별 우선순위를 반영한 실전형 학습 루트를 제안합니다.',
  },
  {
    headline: '학생 수준별 맞춤 로드맵',
    detail: '노베이스부터 100점권까지 같은 UI 안에서 분기되는 전략을 명확하게 제공합니다.',
  },
];

const LEVEL_LENS = [
  { id: 'no-base', label: '노베이스', cue: '개념 체력 재건' },
  { id: '5-7', label: '5~7등급', cue: '기출 진입 준비' },
  { id: '3-4', label: '3~4등급', cue: '준킬러 안정화' },
  { id: '2', label: '2등급', cue: '킬러 사고력 확장' },
  { id: '1', label: '1등급', cue: '실수/시간 최적화' },
  { id: '100', label: '100점권', cue: '만점 유지 루틴' },
];

// Vercel same-origin /api/* — no cross-origin needed
const API_BASE = process.env.REACT_APP_API_URL || '';
const CANONICAL_API_ORIGIN =
  process.env.REACT_APP_API_FALLBACK_ORIGIN || 'https://suneung-psi.vercel.app';
const GRADE_TO_NUM = { '1': 1, '2-3': 3, '4+': 5 };
const ELECTIVE_TO_SERVER = {
  calculus: '미적분',
  probability: '확률과통계',
  geometry: '기하',
};

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
      confidence: toText(book?.confidence, 'community'),
      sourceRefs: refs.map((x) => toText(x)).filter((x) => isHttpUrl(x)),
    };
  }).filter((book) => book.title);

  const recommendedInstructors = recommendedInstructorsRaw.map((inst) => {
    const refs = asArray(inst?.sourceRefs).length ? asArray(inst.sourceRefs) : asArray(inst?.source_refs);
    return {
      name: toText(inst?.name),
      platform: toText(inst?.platform),
      reason: toText(inst?.reason || inst?.best_for),
      sourceRef: pickFirstHttpRef(refs),
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
  };
}

// ─── Landing Screen ─────────────────────────────────────────────────────────

function LandingScreen({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
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

      {/* Top nav bar — repurposes landing__badge */}
      <div className="landing__badge">
        <span className="landing__badge-dot">수능수학 코칭</span>
        <span>수학강사 출신 · 근거 기반 전략</span>
        <span style={{ opacity: 0.45, fontSize: '10px', letterSpacing: '.1em' }}>SPRINT 34</span>
      </div>

      {/* Two-column hero grid */}
      <div className="landing__hero">

        {/* LEFT COLUMN — title, desc, stats, CTA */}
        <div className="landing__eyebrow">

          <div>
            <h1 className="landing__title">
              <span className="landing__title-line landing__title-line--1">수능수학,</span>
              <span className="landing__title-line landing__title-line--2">
                <em className="landing__accent">제대로</em> 푸는 법
              </span>
            </h1>

            <p className="landing__desc">
              현직 강사 경험과 수만 건의 학습 데이터로 설계된<br />
              나만의 맞춤 수학 로드맵을 지금 시작하세요
            </p>
          </div>

          <div>
            {/* Stats row */}
            <div className="landing__stats" role="list">
              <div className="landing__stat" role="listitem">
                <span className="landing__stat-num">14+</span>
                <span className="landing__stat-label">추천 강사</span>
              </div>
              <div className="landing__stat" role="listitem">
                <span className="landing__stat-num">63+</span>
                <span className="landing__stat-label">검증 교재</span>
              </div>
              <div className="landing__stat" role="listitem">
                <span className="landing__stat-num">19+</span>
                <span className="landing__stat-label">성공 사례</span>
              </div>
              <div className="landing__stat" role="listitem">
                <span className="landing__stat-num">50+</span>
                <span className="landing__stat-label">등록 출처</span>
              </div>
            </div>

            {/* CTA */}
            <button className="landing__cta" onClick={handleEnter} aria-label="서비스 시작하기">
              <span className="landing__cta-text">→ 로드맵 시작하기</span>
              <span className="landing__cta-arrow" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN — grade ladder + feature panel */}
        <section className="landing__story" aria-label="등급대별 전략 렌즈">
          <article className="landing__story-card">
            <h3 className="landing__story-title">등급대별 전략 렌즈</h3>
            <p className="landing__story-detail">내 위치를 빠르게 점검하세요</p>
          </article>

          {/* Grade ladder rows */}
          {[
            { label: '100점권', pct: 100, cue: '만점 유지 루틴' },
            { label: '1등급',   pct: 85,  cue: '상위 4% · 실수 최소화' },
            { label: '2등급',   pct: 68,  cue: '상위 11% · 킬러 사고력' },
            { label: '3등급',   pct: 52,  cue: '상위 23% · 준킬러 안정화' },
            { label: '4등급',   pct: 36,  cue: '상위 40% · 기출 진입' },
            { label: '노베이스', pct: 12,  cue: '개념 체력 재건' },
          ].map(({ label, pct, cue }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 10px',
              borderBottom: '1px solid rgba(26,26,14,0.1)',
              fontSize: '12px', fontFamily: 'inherit',
            }}>
              <span style={{ minWidth: '58px', fontWeight: 700 }}>{label}</span>
              <div style={{ flex: 1, height: '4px', background: 'rgba(26,26,14,0.1)' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--ink)' }} />
              </div>
              <span style={{ fontSize: '10px', opacity: .5, minWidth: '100px', textAlign: 'right', letterSpacing: '.03em' }}>{cue}</span>
            </div>
          ))}

          {LANDING_STORYLINES.map((item) => (
            <article key={item.headline} className="landing__story-card" style={{ marginTop: '16px' }}>
              <h3 className="landing__story-title">{item.headline}</h3>
              <p className="landing__story-detail">{item.detail}</p>
            </article>
          ))}
        </section>

      </div>{/* end .landing__hero */}

      {/* Feature chips row — below left col */}
      <div className="landing__chips" role="list" aria-label="주요 기능">
        {[
          ['∫', '미적분 · 확통 · 기하'],
          ['◎', '등급별 맞춤 전략'],
          ['◈', '근거 기반 교재 추천'],
          ['◉', 'AI 주간 코칭'],
        ].map(([icon, label]) => (
          <div key={label} className="landing__chip" role="listitem">
            <span className="landing__chip-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Bottom strip */}
      <div className="landing__fade" aria-hidden="true">
        {['confidence badge 출처 시스템', '등급대별 주간보고 분기', 'Accordion 플랜 UI', 'AI 수학 컨설팅', 'Playwright E2E 6+'].map((t) => (
          <span key={t} style={{ padding: '10px 20px', borderRight: '1px solid rgba(245,240,232,.15)', fontSize: '11px', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{t}</span>
        ))}
      </div>

    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function EvidenceBadge({ confidence, sourceRefs }) {
  const meta = CONFIDENCE_META[confidence] || CONFIDENCE_META['community'];
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
      {hasRef && (
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
  const confidence = book.confidence || 'community';
  const sourceRefs = book.sourceRefs || [];

  return (
    <div className="book-card" role="article">
      <div className="book-card__header">
        <span className="book-card__title">{book.title}</span>
        <EvidenceBadge confidence={confidence} sourceRefs={sourceRefs} />
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
        className="accordion-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="accordion-header__left">
          {icon && <span className="accordion-icon" aria-hidden="true">{icon}</span>}
          <span className="accordion-title">{title}</span>
          {count != null && (
            <span className="accordion-count" aria-label={`${count}개`}>{count}</span>
          )}
        </span>
        <span className="accordion-chevron" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      <div id={id} className="accordion-body" role="region" aria-label={title} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

function LoadingSpinner({ message = '분석 중...' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="loading-message">{message}</p>
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
    '1': {
      topics: '예: 수능 킬러문항 유형 A 풀이 / 사설모고 29번 반복',
      difficulties: '예: 추론형 문제에서 논리 비약 발생',
    },
    '2-3': {
      topics: '예: 수학2 적분 기본 완성 / 교재 N제 1회독',
      difficulties: '예: 복합함수 미분에서 실수 빈번',
    },
    '4+': {
      topics: '예: 수학1 수열 개념 복습 / 기본 유형 반복',
      difficulties: '예: 공식 암기 후 적용 혼동',
    },
  };
  const ph = gradePlaceholders[gradeBand] || gradePlaceholders['2-3'];

  const gradeLabel =
    gradeBand === '1' ? '1등급' : gradeBand === '4+' ? '4등급 이하' : '2~3등급';

  return (
    <div className="tab-content report-tab">
      <div className="tab-header">
        <h2 className="tab-title">주간 학습 보고</h2>
        <span className="grade-badge">목표 {gradeLabel}</span>
      </div>

      <div className="form-stack">
        <div className="form-group">
          <label className="form-label-sm" htmlFor="completedTopics">
            이번 주 완료한 학습
          </label>
          <textarea
            id="completedTopics"
            className="form-textarea"
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
            className="form-textarea"
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
            className="form-input"
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
          <h3 className="report-result__title">주간 리포트</h3>
          <div
            className="report-result__body"
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
          className="form-textarea form-textarea--lg"
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
          <h3 className="consult-result__title">AI 답변</h3>
          <div
            className="consult-result__body"
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

