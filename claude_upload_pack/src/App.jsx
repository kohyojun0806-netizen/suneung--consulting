import { useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8787";

const GRADE_INFO = {
  1: { label: "1등급", color: "#ef4444", range: "96~100점" },
  2: { label: "2등급", color: "#f97316", range: "89~95점" },
  3: { label: "3등급", color: "#f59e0b", range: "77~88점" },
  4: { label: "4등급", color: "#eab308", range: "60~76점" },
  5: { label: "5등급", color: "#22c55e", range: "40~59점" },
  6: { label: "6등급", color: "#3b82f6", range: "23~39점" },
  7: { label: "7등급", color: "#6366f1", range: "12~22점" },
  8: { label: "8등급", color: "#64748b", range: "4~11점" },
  9: { label: "9등급", color: "#475569", range: "3점 이하" },
};

const ELECTIVES = ["확률과통계", "미적분", "기하"];

export default function App() {
  const [currentGrade, setCurrentGrade] = useState(null);
  const [targetGrade, setTargetGrade] = useState(null);
  const [electiveSubject, setElectiveSubject] = useState("미적분");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);

  const canSubmit =
    Number.isFinite(currentGrade) &&
    Number.isFinite(targetGrade) &&
    targetGrade < currentGrade;

  async function handleAnalyze() {
    if (!Number.isFinite(currentGrade) || !Number.isFinite(targetGrade)) {
      setError("현재 등급과 목표 등급을 먼저 선택해주세요.");
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
      setError(e?.message || "오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setCurrentGrade(null);
    setTargetGrade(null);
    setElectiveSubject("미적분");
    setPlan(null);
    setError("");
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.header}>
          <div style={s.badge}>정시 학습 컨설팅</div>
          <h1 style={s.title}>현재 등급에서 목표 등급까지, 단계별 로드맵</h1>
          <p style={s.subtitle}>
            각 시기별 학습법과 추천 강의/교재를 한 번에 제안합니다.
          </p>
        </header>

        <section style={s.card}>
          <div style={s.sectionTitle}>1) 현재 등급</div>
          <GradeGrid selected={currentGrade} onSelect={setCurrentGrade} />

          <div style={s.sectionTitle}>2) 목표 등급</div>
          <GradeGrid selected={targetGrade} onSelect={setTargetGrade} disabledFrom={currentGrade} />

          <div style={s.sectionTitle}>3) 선택과목</div>
          <div style={s.row}>
            {ELECTIVES.map((subject) => (
              <button
                key={subject}
                onClick={() => setElectiveSubject(subject)}
                style={{
                  ...s.pillButton,
                  background: electiveSubject === subject ? "#0f172a" : "#fff",
                  color: electiveSubject === subject ? "#fff" : "#111827",
                  borderColor: electiveSubject === subject ? "#0f172a" : "#d1d5db",
                }}
              >
                {subject}
              </button>
            ))}
          </div>

          {error ? <div style={s.error}>{error}</div> : null}

          <div style={s.row}>
            <button
              onClick={handleAnalyze}
              disabled={!canSubmit || loading}
              style={{
                ...s.primary,
                opacity: !canSubmit || loading ? 0.5 : 1,
                cursor: !canSubmit || loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "분석 중..." : "학습 컨설팅 받기"}
            </button>
            <button onClick={resetAll} style={s.secondary}>
              초기화
            </button>
          </div>
        </section>

        {plan ? (
          <section style={s.resultWrap}>
            <Panel title="맞춤 피드백">
              <p style={s.text}>{plan.student_feedback}</p>
            </Panel>

            <Panel title="지금 해야 할 공부">
              <h4 style={s.h4}>{plan.current_focus?.headline}</h4>
              <p style={s.text}>{plan.current_focus?.why_now}</p>
              <ul style={s.ul}>
                {(plan.current_focus?.actions || []).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
              <p style={s.meta}>일일 루틴: {plan.current_focus?.daily_plan}</p>
              <p style={s.warn}>주의: {plan.current_focus?.caution}</p>
            </Panel>

            <Panel title="시기별 단계 계획">
              {(plan.period_plan || []).map((p, i) => (
                <div key={i} style={s.phaseBox}>
                  <h4 style={s.h4}>{p.period}</h4>
                  <p style={s.text}>목표: {p.goal}</p>
                  <ul style={s.ul}>
                    {(p.actions || []).map((a, j) => (
                      <li key={j}>{a}</li>
                    ))}
                  </ul>
                  <p style={s.meta}>체크포인트: {(p.checkpoints || []).join(" / ")}</p>
                  <p style={s.warn}>주의: {p.caution}</p>
                </div>
              ))}
            </Panel>

            <Panel title="추천 강의(강사)">
              <ul style={s.ul}>
                {(plan.recommended_instructors || []).map((t, i) => (
                  <li key={i}>
                    <strong>{t.name}</strong> ({t.platform}) - {t.best_for}
                    <br />
                    이유: {t.reason}
                    <br />
                    활용: {t.usage}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="추천 교재">
              <ul style={s.ul}>
                {(plan.recommended_books || []).map((b, i) => (
                  <li key={i}>
                    <strong>{b.title}</strong> [{b.type}] / 난이도: {b.difficulty}
                    <br />
                    목적: {b.purpose}
                    <br />
                    사용 시기: {b.when_to_use}
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="정시지원 컨설팅 (수능 이후)">
              <p style={s.text}>
                현재는 학습 컨설팅 기능만 제공 중입니다. 수능 이후 정시지원 컨설팅 기능은
                추후 업데이트 예정입니다.
              </p>
            </Panel>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section style={s.panel}>
      <h3 style={s.panelTitle}>{title}</h3>
      {children}
    </section>
  );
}

function GradeGrid({ selected, onSelect, disabledFrom = null }) {
  return (
    <div style={s.grid}>
      {Object.entries(GRADE_INFO).map(([grade, info]) => {
        const g = Number(grade);
        const disabled = disabledFrom !== null && g >= disabledFrom;
        return (
          <button
            key={grade}
            onClick={() => !disabled && onSelect(g)}
            style={{
              ...s.gradeBtn,
              background: selected === g ? info.color : "#fff",
              color: selected === g ? "#fff" : disabled ? "#9ca3af" : "#111827",
              borderColor: selected === g ? info.color : "#d1d5db",
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <span style={s.gradeMain}>{info.label}</span>
            <span style={s.gradeSub}>{info.range}</span>
          </button>
        );
      })}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "24px 16px 48px",
    color: "#0f172a",
  },
  container: { maxWidth: 980, margin: "0 auto" },
  header: { marginBottom: 18 },
  badge: {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    color: "#1d4ed8",
    background: "#dbeafe",
    border: "1px solid #bfdbfe",
    borderRadius: 999,
    padding: "4px 10px",
    marginBottom: 8,
  },
  title: { margin: "0 0 6px", fontSize: "clamp(24px,4vw,34px)", lineHeight: 1.2 },
  subtitle: { margin: 0, color: "#475569" },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: 700, margin: "10px 0 8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 8 },
  gradeBtn: {
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    transition: "all .12s",
  },
  gradeMain: { fontSize: 13, fontWeight: 700 },
  gradeSub: { fontSize: 11, opacity: 0.8 },
  row: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
  pillButton: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    fontSize: 13,
    fontWeight: 700,
    background: "#fff",
  },
  error: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 13,
    marginTop: 10,
  },
  primary: {
    border: "none",
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    padding: "10px 14px",
  },
  secondary: {
    border: "1px solid #d1d5db",
    borderRadius: 10,
    background: "#fff",
    color: "#111827",
    fontSize: 14,
    fontWeight: 700,
    padding: "10px 14px",
    cursor: "pointer",
  },
  resultWrap: { display: "grid", gap: 12 },
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
  },
  panelTitle: { margin: "0 0 10px", fontSize: 17 },
  h4: { margin: "0 0 6px", fontSize: 15 },
  text: { margin: 0, color: "#334155", lineHeight: 1.6 },
  ul: { margin: "8px 0 0", paddingLeft: 18, color: "#334155", lineHeight: 1.7 },
  meta: { margin: "8px 0 0", color: "#475569", fontSize: 13 },
  warn: { margin: "6px 0 0", color: "#b45309", fontSize: 13 },
  phaseBox: {
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
};
