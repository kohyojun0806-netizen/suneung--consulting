// src/suneung-tracker.jsx
// Sprint 31 — Evidence Badge UI + Plan Structure + Grade-band Report
// 3AGENT + GSD: ui-data-priority-20260330

import React, { useState, useCallback, useRef } from 'react';
import './suneung-tracker.css';

// ─── Constants ─────────────────────────────────────────────────────────────

const CONFIDENCE_META = {
  official: {
    label: '공식',
    icon: '🏛',
    className: 'badge--official',
    ariaLabel: '공식 검증 출처',
  },
  community: {
    label: '커뮤니티',
    icon: '💬',
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
  { value: '1', label: '1등급 (상위 4%)' },
  { value: '2-3', label: '2~3등급 (상위 5~23%)' },
  { value: '4+', label: '4등급 이하' },
];

const ELECTIVE_SUBJECTS = [
  { value: 'calculus', label: '미적분' },
  { value: 'probability', label: '확률과 통계' },
  { value: 'geometry', label: '기하' },
];

// ─── Sub-components ────────────────────────────────────────────────────────

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
      {book.reason && (
        <p className="book-card__reason">{book.reason}</p>
      )}
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
        <span className="accordion-chevron" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>
      <div
        id={id}
        className="accordion-body"
        role="region"
        aria-label={title}
        hidden={!open}
      >
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
      <span className="empty-state__icon" aria-hidden="true">{icon || '📭'}</span>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__desc">{description}</p>}
    </div>
  );
}

// ─── Tab: Onboarding ───────────────────────────────────────────────────────

function OnboardingTab({ profile, setProfile, onSubmit, loading }) {
  const handleChange = useCallback((field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, [setProfile]);

  return (
    <div className="tab-content onboarding-tab">
      <div className="tab-header">
        <h2 className="tab-title">학습 프로필 설정</h2>
        <p className="tab-subtitle">현재 수준과 목표를 입력하면 맞춤 로드맵을 생성합니다</p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="currentGrade">현재 등급</label>
          <select
            id="currentGrade"
            className="form-select"
            value={profile.currentGrade}
            onChange={(e) => handleChange('currentGrade', e.target.value)}
          >
            <option value="">선택하세요</option>
            {GRADE_BANDS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="targetGrade">목표 등급</label>
          <select
            id="targetGrade"
            className="form-select"
            value={profile.targetGrade}
            onChange={(e) => handleChange('targetGrade', e.target.value)}
          >
            <option value="">선택하세요</option>
            {GRADE_BANDS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group form-group--full">
          <label className="form-label" htmlFor="elective">선택 과목</label>
          <div className="radio-group" role="radiogroup" aria-labelledby="elective-label">
            {ELECTIVE_SUBJECTS.map((s) => (
              <label key={s.value} className="radio-label">
                <input
                  type="radio"
                  name="elective"
                  value={s.value}
                  checked={profile.elective === s.value}
                  onChange={() => handleChange('elective', s.value)}
                  className="radio-input"
                />
                <span className="radio-text">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group form-group--full">
          <label className="form-label" htmlFor="weeklyHours">주간 학습 시간 (시간)</label>
          <input
            id="weeklyHours"
            type="number"
            className="form-input"
            min={1}
            max={40}
            value={profile.weeklyHours}
            onChange={(e) => handleChange('weeklyHours', e.target.value)}
          />
        </div>
      </div>

      <button
        className="btn btn--primary btn--lg"
        onClick={onSubmit}
        disabled={loading || !profile.currentGrade || !profile.targetGrade || !profile.elective}
        aria-busy={loading}
      >
        {loading ? '분석 중...' : '📊 로드맵 생성'}
      </button>
    </div>
  );
}

// ─── Tab: Plan ─────────────────────────────────────────────────────────────

function PlanTab({ plan, loading }) {
  if (loading) return <LoadingSpinner message="맞춤 플랜 분석 중..." />;
  if (!plan) {
    return (
      <EmptyState
        icon="🗺"
        title="아직 플랜이 없습니다"
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
        {plan.gradeBand && (
          <span className="grade-badge">{plan.gradeBand}</span>
        )}
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

      {/* Layer 1: 로드맵 */}
      <AccordionSection title="학습 로드맵" icon="🗺" count={roadmap.length} defaultOpen>
        {roadmap.length === 0
          ? <EmptyState icon="📭" title="로드맵 항목 없음" />
          : (
            <ol className="roadmap-list">
              {roadmap.map((step, i) => (
                <li key={i} className="roadmap-item">
                  <span className="roadmap-step-num" aria-hidden="true">{i + 1}</span>
                  <div className="roadmap-step-body">
                    <strong className="roadmap-step-title">{step.phase || step.title}</strong>
                    {step.description && (
                      <p className="roadmap-step-desc">{step.description}</p>
                    )}
                    {step.duration && (
                      <span className="roadmap-step-duration">⏱ {step.duration}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )
        }
      </AccordionSection>

      {/* Layer 2: 추천 교재 */}
      <AccordionSection title="추천 교재" icon="📚" count={books.length} defaultOpen>
        {books.length === 0
          ? <EmptyState icon="📭" title="추천 교재 없음" />
          : (
            <div className="book-grid">
              {books.map((book, i) => (
                <BookCard key={book.id || i} book={book} />
              ))}
            </div>
          )
        }
      </AccordionSection>

      {/* Layer 3: 추천 강사 */}
      <AccordionSection title="추천 강사" icon="👨‍🏫" count={instructors.length}>
        {instructors.length === 0
          ? <EmptyState icon="📭" title="추천 강사 없음" />
          : (
            <div className="instructor-list">
              {instructors.map((inst, i) => (
                <div key={inst.name || i} className="instructor-card">
                  <div className="instructor-card__header">
                    <strong className="instructor-name">{inst.name}</strong>
                    {inst.platform && (
                      <span className="instructor-platform">{inst.platform}</span>
                    )}
                  </div>
                  {inst.reason && (
                    <p className="instructor-reason">{inst.reason}</p>
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
          )
        }
      </AccordionSection>
    </div>
  );
}

// ─── Tab: Weekly Report ────────────────────────────────────────────────────

function WeeklyReportTab({ profile, report, setReport, onSubmit, loading }) {
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

  return (
    <div className="tab-content report-tab">
      <div className="tab-header">
        <h2 className="tab-title">주간 학습 보고</h2>
        <span className="grade-badge">목표 {gradeBand === '1' ? '1등급' : gradeBand === '4+' ? '4등급↑' : '2~3등급'}</span>
      </div>

      <div className="form-grid">
        <div className="form-group form-group--full">
          <label className="form-label" htmlFor="completedTopics">이번 주 완료한 학습 내용</label>
          <textarea
            id="completedTopics"
            className="form-textarea"
            rows={3}
            placeholder={ph.topics}
            value={weekInput.completedTopics}
            onChange={(e) => setWeekInput((v) => ({ ...v, completedTopics: e.target.value }))}
          />
        </div>

        <div className="form-group form-group--full">
          <label className="form-label" htmlFor="difficulties">어려웠던 점</label>
          <textarea
            id="difficulties"
            className="form-textarea"
            rows={2}
            placeholder={ph.difficulties}
            value={weekInput.difficulties}
            onChange={(e) => setWeekInput((v) => ({ ...v, difficulties: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="mockScore">모의고사 점수 (선택)</label>
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
        {loading ? '분석 중...' : '📋 주간 리포트 생성'}
      </button>

      {loading && <LoadingSpinner message="리포트 생성 중..." />}

      {report && !loading && (
        <div className="report-result" role="region" aria-label="주간 리포트 결과">
          <h3 className="report-result__title">📋 주간 리포트</h3>
          <div
            className="report-result__body"
            dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Tab: AI Consult ───────────────────────────────────────────────────────

function ConsultTab({ consult, setConsult, onSubmit, loading }) {
  const [question, setQuestion] = useState('');

  return (
    <div className="tab-content consult-tab">
      <div className="tab-header">
        <h2 className="tab-title">AI 수학 컨설팅</h2>
        <p className="tab-subtitle">교재 선택, 학습 전략, 취약 유형 개선 등을 질문하세요</p>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="consultQuestion">질문</label>
        <textarea
          id="consultQuestion"
          className="form-textarea"
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
        {loading ? '답변 생성 중...' : '💬 컨설팅 받기'}
      </button>

      {loading && <LoadingSpinner message="AI 컨설팅 분석 중..." />}

      {consult && !loading && (
        <div className="consult-result" role="region" aria-label="AI 컨설팅 답변">
          <h3 className="consult-result__title">💬 AI 답변</h3>
          <div
            className="consult-result__body"
            dangerouslySetInnerHTML={{ __html: consult.replace(/\n/g, '<br/>') }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'onboarding', label: '프로필', icon: '👤' },
  { id: 'plan', label: '플랜', icon: '🗺' },
  { id: 'report', label: '주간보고', icon: '📋' },
  { id: 'consult', label: '컨설팅', icon: '💬' },
];

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function SuneungTracker() {
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

  const handleError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleAnalyzePlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      setPlan(data.plan || data);
      setActiveTab('plan');
    } catch (e) {
      handleError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile, handleError]);

  const handleWeeklyReport = useCallback(async (weekInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tracker/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, weekInput }),
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      setReport(data.report || data.message || JSON.stringify(data));
    } catch (e) {
      handleError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile, handleError]);

  const handleConsult = useCallback(async (question) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tracker/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, question }),
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      setConsult(data.answer || data.message || JSON.stringify(data));
    } catch (e) {
      handleError(e.message);
    } finally {
      setLoading(false);
    }
  }, [profile, handleError]);

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-logo">
            <span className="app-logo__icon" aria-hidden="true">📐</span>
            <span className="app-logo__name">수능수학 코칭</span>
          </div>
          <span className="app-header__tagline">근거 기반 맞춤 전략</span>
        </div>
      </header>

      {/* Error Toast */}
      {error && (
        <div className="error-toast" role="alert" aria-live="assertive">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="error-toast__close" aria-label="닫기">✕</button>
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
        {activeTab === 'plan' && (
          <PlanTab plan={plan} loading={loading} />
        )}
        {activeTab === 'report' && (
          <WeeklyReportTab
            profile={profile}
            report={report}
            setReport={setReport}
            onSubmit={handleWeeklyReport}
            loading={loading}
          />
        )}
        {activeTab === 'consult' && (
          <ConsultTab
            consult={consult}
            setConsult={setConsult}
            onSubmit={handleConsult}
            loading={loading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 수능수학 코칭 — 근거 기반 추천 시스템</p>
      </footer>
    </div>
  );
}
