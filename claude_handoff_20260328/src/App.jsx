import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8787";

const GRADE_INFO = {
  1: { label: "1등급", range: "96~100점", color: "#ef4444" },
  2: { label: "2등급", range: "89~95점", color: "#f97316" },
  3: { label: "3등급", range: "77~88점", color: "#f59e0b" },
  4: { label: "4등급", range: "60~76점", color: "#eab308" },
  5: { label: "5등급", range: "40~59점", color: "#22c55e" },
  6: { label: "6등급", range: "23~39점", color: "#14b8a6" },
  7: { label: "7등급", range: "12~22점", color: "#3b82f6" },
  8: { label: "8등급", range: "4~11점", color: "#64748b" },
  9: { label: "9등급", range: "3점 이하", color: "#475569" },
};

const ELECTIVES = ["확률과통계", "미적분", "기하"];

const EMPTY_SUMMARY = {
  categories: {
    study_methods: [],
    lecture_and_books: { instructors: [], books: [] },
    learning_routines: [],
  },
};

export default function App() {
  const [currentGrade, setCurrentGrade] = useState(null);
  const [targetGrade, setTargetGrade] = useState(null);
  const [electiveSubject, setElectiveSubject] = useState("미적분");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const canSubmit =
    Number.isFinite(currentGrade) &&
    Number.isFinite(targetGrade) &&
    targetGrade < currentGrade;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/knowledge/summary`);
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.categories) {
          setSummary(data);
        }
      } catch {
        // summary loading failure should not block analyze flow
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const knowledgeBuckets = useMemo(() => {
    if (plan?.knowledge_buckets) {
      return plan.knowledge_buckets;
    }
    const lectureSeeds = [
      ...((summary.categories.lecture_and_books.instructors || []).slice(0, 4).map(
        (i) => `${i.name} (${i.platform}) - ${i.bestFor}`
      )),
      ...((summary.categories.lecture_and_books.books || []).slice(0, 4).map(
        (b) => `${b.title} [${b.type}] - ${b.purpose}`
      )),
    ];
    return {
      math_study_methods: summary.categories.study_methods || [],
      lecture_and_books: lectureSeeds,
      learning_routines: summary.categories.learning_routines || [],
    };
  }, [plan, summary]);

  async function handleAnalyze() {
    if (!Number.isFinite(currentGrade) || !Number.isFinite(targetGrade)) {
      setError("현재 등급과 목표 등급을 먼저 선택해 주세요.");
      return;
    }
    if (targetGrade >= currentGrade) {
      setError("목표 등급은 현재 등급보다 높아야 합니다.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentGrade, targetGrade, electiveSubject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "분석 요청에 실패했습니다.");
      setPlan(data.plan || null);
    } catch (e) {
      setError(e?.message || "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setCurrentGrade(null);
    setTargetGrade(null);
    setElectiveSubject("미적분");
    setPlan(null);
    setError("");
  }

  return (
    <div className="consulting-app">
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      <main className="layout">
        <header className="hero">
          <p className="eyebrow">정시 학습 컨설팅 서비스</p>
          <h1>
            등급을 입력하면, 지금 해야 할 공부를
            <span> 단계별 로드맵</span>으로 보여줍니다
          </h1>
          <p className="hero-sub">
            학습 데이터는 <strong>수학 공부법 / 강의·교재 / 학습 루틴</strong> 3개 축으로 구성되어
            결과에 반영됩니다.
          </p>
        </header>

        <section className="grid-top">
          <article className="panel control-panel">
            <h2>입력 설정</h2>
            <div className="field">
              <label>현재 등급</label>
              <GradeGrid selected={currentGrade} onSelect={setCurrentGrade} />
            </div>
            <div className="field">
              <label>목표 등급</label>
              <GradeGrid selected={targetGrade} onSelect={setTargetGrade} disabledFrom={currentGrade} />
            </div>
            <div className="field">
              <label>선택 과목</label>
              <div className="pill-row">
                {ELECTIVES.map((subject) => (
                  <button
                    key={subject}
                    className={`pill ${electiveSubject === subject ? "active" : ""}`}
                    onClick={() => setElectiveSubject(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {error ? <div className="error-box">{error}</div> : null}

            <div className="action-row">
              <button
                className="btn primary"
                disabled={!canSubmit || loading}
                onClick={handleAnalyze}
              >
                {loading ? "분석 중..." : "맞춤 플랜 생성"}
              </button>
              <button className="btn ghost" onClick={handleReset}>
                초기화
              </button>
            </div>
          </article>

          <article className="panel data-panel">
            <h2>학습 데이터 3축</h2>
            <BucketBlock
              title="수학 공부법"
              items={knowledgeBuckets.math_study_methods}
              emptyText="분석 전입니다."
            />
            <BucketBlock
              title="참고 강의·교재"
              items={knowledgeBuckets.lecture_and_books}
              emptyText="분석 전입니다."
            />
            <BucketBlock
              title="학습 루틴"
              items={knowledgeBuckets.learning_routines}
              emptyText="분석 전입니다."
            />
          </article>
        </section>

        {plan ? (
          <section className="result-grid">
            <article className="panel result-main">
              <h2>학생 맞춤 피드백</h2>
              <p className="feedback">{plan.student_feedback}</p>

              <div className="focus-card">
                <p className="focus-title">{plan.current_focus?.headline}</p>
                <p className="focus-why">{plan.current_focus?.why_now}</p>
                <ul>
                  {(plan.current_focus?.actions || []).map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
                <p className="meta">일일 계획: {plan.current_focus?.daily_plan}</p>
                <p className="warn">주의: {plan.current_focus?.caution}</p>
              </div>
            </article>

            <article className="panel">
              <h2>시기별 학습 단계</h2>
              <div className="timeline">
                {(plan.period_plan || []).map((period) => (
                  <div key={period.period} className="timeline-item">
                    <p className="timeline-period">{period.period}</p>
                    <p className="timeline-goal">{period.goal}</p>
                    <ul>
                      {(period.actions || []).map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                    <p className="meta">
                      체크포인트: {(period.checkpoints || []).join(" / ")}
                    </p>
                    <p className="warn">주의: {period.caution}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <h2>추천 강의(강사)</h2>
              <ul className="rich-list">
                {(plan.recommended_instructors || []).map((item, index) => (
                  <li key={index}>
                    <strong>
                      {item.name} <span>· {item.platform}</span>
                    </strong>
                    <p>추천 대상: {item.best_for}</p>
                    <p>추천 이유: {item.reason}</p>
                    {item.style_summary ? <p>수업 스타일: {item.style_summary}</p> : null}
                    {item.curriculum_path?.length ? (
                      <div className="inline-block">
                        <p>대표 커리큘럼</p>
                        <ul>
                          {item.curriculum_path.slice(0, 4).map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {item.review_points?.length ? (
                      <div className="inline-block">
                        <p>수강생 후기 요약</p>
                        <ul>
                          {item.review_points.slice(0, 3).map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <p>사용법: {item.usage}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="panel">
              <h2>추천 교재</h2>
              <ul className="rich-list">
                {(plan.recommended_books || []).map((book, index) => (
                  <li key={index}>
                    <strong>
                      {book.title} <span>· {book.type}</span>
                    </strong>
                    <p>난이도: {book.difficulty}</p>
                    <p>활용 시기: {book.when_to_use}</p>
                    <p>목적: {book.purpose}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="panel">
              <h2>과목별 학습 가이드</h2>
              <div className="curriculum-grid">
                {(plan.subject_curriculum || []).map((teacher, index) => (
                  <div key={`${teacher.name}-${index}`} className="curriculum-card">
                    <p className="teacher-name">
                      {teacher.name} <span>{teacher.platform}</span>
                    </p>
                    <p className="tag">수학I</p>
                    <ul>
                      {(teacher.common_subjects?.["수학I"] || []).slice(0, 3).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    <p className="tag">수학II</p>
                    <ul>
                      {(teacher.common_subjects?.["수학II"] || []).slice(0, 3).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    <p className="tag">{teacher.elective_subject?.subject}</p>
                    <ul>
                      {(teacher.elective_subject?.strategy || []).slice(0, 3).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel placeholder-panel">
              <h2>정시지원 컨설팅 (수능 이후)</h2>
              <p>
                현재는 학습 컨설팅에 집중하고 있습니다. 수능 이후 버전에서 대학/학과별 지원 전략,
                리스크 분산 지원안, 최종 원서 조합 기능을 추가할 예정입니다.
              </p>
              <p className="final-tip">최종 조언: {plan.final_tip}</p>
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function BucketBlock({ title, items, emptyText }) {
  return (
    <section className="bucket-block">
      <p className="bucket-title">{title}</p>
      {items?.length ? (
        <ul>
          {items.slice(0, 6).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="bucket-empty">{emptyText}</p>
      )}
    </section>
  );
}

function GradeGrid({ selected, onSelect, disabledFrom = null }) {
  return (
    <div className="grade-grid">
      {Object.entries(GRADE_INFO).map(([grade, info]) => {
        const g = Number(grade);
        const disabled = disabledFrom !== null && g >= disabledFrom;
        const active = selected === g;
        return (
          <button
            key={grade}
            type="button"
            onClick={() => !disabled && onSelect(g)}
            disabled={disabled}
            className={`grade-btn ${active ? "active" : ""}`}
            style={{ "--grade-color": info.color }}
          >
            <span>{info.label}</span>
            <small>{info.range}</small>
          </button>
        );
      })}
    </div>
  );
}
