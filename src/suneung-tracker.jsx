import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8787";
const ELECTIVES = ["확률과통계", "미적분", "기하"];
const TAGS = ["개념", "기출", "N제", "모의고사", "오답복기", "EBS", "시간관리"];
const GRADE_INFO = {
  1: { label: "1등급", range: "96~100", color: "#ef4444" },
  2: { label: "2등급", range: "89~95", color: "#f97316" },
  3: { label: "3등급", range: "77~88", color: "#f59e0b" },
  4: { label: "4등급", range: "60~76", color: "#eab308" },
  5: { label: "5등급", range: "40~59", color: "#22c55e" },
  6: { label: "6등급", range: "23~39", color: "#14b8a6" },
  7: { label: "7등급", range: "12~22", color: "#3b82f6" },
  8: { label: "8등급", range: "4~11", color: "#64748b" },
  9: { label: "9등급", range: "3점 이하", color: "#475569" },
};

const BAND = {
  "9-7": { focus: "개념 공백 + 쉬운 기출 연결", core: "강의보다 개념 출력과 즉시 적용이 우선", weekly: "주 10~12시간" },
  "7-5": { focus: "개념 마무리 + 기출 전환", core: "개념 회독을 길게 끌지 말고 기출에서 재현", weekly: "주 12~15시간" },
  "5-3": { focus: "중난도 처리력 + 시나리오 설계", core: "계산 전에 조건 구조를 먼저 읽는 습관", weekly: "주 15~18시간" },
  "3-1": { focus: "실전 안정화 + 실수 제거", core: "문제량보다 루틴 고정과 실수 제거가 핵심", weekly: "주 18시간+" },
};

const FALLBACK_PERIOD = {
  "9-7": [
    { period: "3~6모 전", goal: "개념 출력 고정", actions: ["매일 개념 20분 출력", "쉬운 기출 10~15문항", "오답 분류"], caution: "강의만 듣지 말기" },
    { period: "6~9모", goal: "기출 정착", actions: ["유형별 반복", "문항당 시간 제한", "주 1회 실전 세트"], caution: "한 문제 과몰입 금지" },
    { period: "9모~수능 전", goal: "실전 안정화", actions: ["주 2회 실전", "반복 실수 3개 이내", "풀이 순서 고정"], caution: "새 교재 확장 금지" },
  ],
  "7-5": [
    { period: "3~6모 전", goal: "공통 개념 마무리", actions: ["개념 후 즉시 기출", "풀이 재현 복기", "선택과목 취약 보완"], caution: "개념만 회독 금지" },
    { period: "6~9모", goal: "중난도 확장", actions: ["중난도 비중 확대", "주 2회 실전", "오답 라벨링"], caution: "오답복기 생략 금지" },
    { period: "9모~수능 전", goal: "점수 안정", actions: ["주 2~3회 모의", "반복 실수 보정", "압축노트 1권"], caution: "새 인강 과다 추가 금지" },
  ],
  "5-3": [
    { period: "3~6모 전", goal: "준킬러 기반", actions: ["조건 해석 우선", "선택과목 빈출 완성", "오답 3회 복기"], caution: "계산부터 시작 금지" },
    { period: "6~9모", goal: "N제 + 실전 운영", actions: ["주간 N제 15~20", "포기 기준 고정", "검산 5분"], caution: "정답률 집착 금지" },
    { period: "9모~수능 전", goal: "안정화", actions: ["주 3회 모의", "킬러 기대값 전략", "실수 패턴 제거"], caution: "막판 방식 변경 금지" },
  ],
  "3-1": [
    { period: "3~6모 전", goal: "고난도 루틴", actions: ["킬러 40분 자력", "시나리오 비교", "계산 정확도 훈련"], caution: "즉시 해설 의존 금지" },
    { period: "6~9모", goal: "실전 최적화", actions: ["주 3~4회 실전", "킬러 선택 전략", "계산 실수 보정"], caution: "문제량만 늘리지 않기" },
    { period: "9모~수능 전", goal: "최종 안정", actions: ["새 교재 중단", "EBS/기출 점검", "당일 루틴 리허설"], caution: "컨디션 관리 실패 주의" },
  ],
};

const K = {
  profile: "tracker:profile",
  logs: "tracker:logs",
  plan: "tracker:plan",
  report: "tracker:report",
  consult: "tracker:consult",
};

const DB = {
  async get(key) {
    try {
      if (window?.storage?.get) {
        const r = await window.storage.get(key);
        return r?.value ? JSON.parse(r.value) : null;
      }
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      if (window?.storage?.set) return window.storage.set(key, JSON.stringify(value));
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  async remove(key) {
    try {
      if (window?.storage?.delete) return window.storage.delete(key);
      localStorage.removeItem(key);
    } catch {}
  },
};

const today = () => new Date().toISOString().slice(0, 10);
const weekLabel = (n = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + n * 7);
  return `${d.getMonth() + 1}/${d.getDate()}주`;
};
const bandKey = (c, t) => (c >= 8 && t >= 6 ? "9-7" : c >= 6 && t >= 4 ? "7-5" : c >= 4 && t >= 2 ? "5-3" : "3-1");
const streak = (logs) => logs.findIndex((x, i) => x.week !== weekLabel(-i)) === -1 ? logs.length : Math.max(0, logs.findIndex((x, i) => x.week !== weekLabel(-i)));

async function callApi(url, body, timeout = 13000) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), timeout);
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: c.signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "API 오류");
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function fallbackPlan(profile) {
  const k = bandKey(profile.currentGrade, profile.targetGrade);
  return {
    plan: {
      student_feedback: `${profile.currentGrade}등급에서 ${profile.targetGrade}등급으로 가려면 학습 구조 고정이 먼저입니다.`,
      current_focus: {
        headline: `지금 핵심: ${BAND[k].focus}`,
        why_now: BAND[k].core,
        actions: ["개념 출력", "쉬운 기출 즉시 적용", "오답복기 3회"],
        daily_plan: BAND[k].weekly,
        caution: "강의 시청 시간이 문제 적용 시간을 넘지 않게 하세요.",
      },
      period_plan: FALLBACK_PERIOD[k],
      recommended_instructors: [],
      recommended_books: [],
      final_tip: "같은 실수를 줄이는 루틴이 점수를 올립니다.",
    },
    meta: { usedModel: false, model: null },
  };
}

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [tab, setTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [plan, setPlan] = useState(null);
  const [report, setReport] = useState(null);
  const [consult, setConsult] = useState([]);
  const [busy, setBusy] = useState({ analyze: false, report: false, consult: false });
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const [p, l, pl, r, c] = await Promise.all([DB.get(K.profile), DB.get(K.logs), DB.get(K.plan), DB.get(K.report), DB.get(K.consult)]);
      if (!p) return setScreen("setup");
      setProfile(p); setLogs(l || []); setPlan(pl); setReport(r); setConsult(c || []); setScreen("main");
    })();
  }, []);

  const saveProfile = useCallback(async (p) => { await DB.set(K.profile, p); setProfile(p); setScreen("main"); }, []);
  const addLog = useCallback(async (item) => {
    const next = [item, ...logs].slice(0, 52);
    await DB.set(K.logs, next); setLogs(next);
  }, [logs]);

  const runAnalyze = useCallback(async () => {
    setBusy((x) => ({ ...x, analyze: true })); setErr("");
    try {
      const data = await callApi(`${API_BASE}/api/analyze`, { currentGrade: Number(profile.currentGrade), targetGrade: Number(profile.targetGrade), electiveSubject: profile.elective }, 16000);
      const next = { ...data, updatedAt: today() }; await DB.set(K.plan, next); setPlan(next);
    } catch (e) {
      const next = { ...fallbackPlan(profile), updatedAt: today() }; await DB.set(K.plan, next); setPlan(next); setErr(`${e.message} (fallback 사용)`);
    } finally { setBusy((x) => ({ ...x, analyze: false })); }
  }, [profile]);

  const runReport = useCallback(async () => {
    if (!logs.length) return;
    setBusy((x) => ({ ...x, report: true })); setErr("");
    const k = bandKey(profile.currentGrade, profile.targetGrade);
    const recent = logs.slice(0, 4);
    const metrics = {
      totalHours: recent.reduce((s, x) => s + Number(x.hours || 0), 0),
      avgScore: (() => { const s = recent.filter((x) => Number.isFinite(x.score)).map((x) => Number(x.score)); return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null; })(),
      allWeakPoints: recent.map((x) => x.weakPoint).filter(Boolean).join(", "),
      allMemos: recent.map((x) => x.memo).filter(Boolean).join(" / "),
    };
    try {
      const data = await callApi(`${API_BASE}/api/tracker/report`, { profile, logs: recent, method: BAND[k], metrics });
      const next = { report: data.report, updatedAt: today() }; await DB.set(K.report, next); setReport(next);
    } catch (e) {
      const next = { report: { overall: "리포트 생성에 실패해 기본 리포트를 표시합니다.", strengths: ["기록 유지"], improvements: ["취약 단원 1~2개 압축"], next_week_plan: ["월/수/금 개념+기출", "화/목 취약+오답", "주말 실전 1세트"], caution: "오답복기 누락 주의", encouragement: "이번 주는 루틴 고정에 집중하세요." }, updatedAt: today() };
      await DB.set(K.report, next); setReport(next); setErr(`${e.message} (fallback 사용)`);
    } finally { setBusy((x) => ({ ...x, report: false })); }
  }, [logs, profile]);

  const runConsult = useCallback(async (question) => {
    if (!question.trim()) return;
    setBusy((x) => ({ ...x, consult: true })); setErr("");
    const k = bandKey(profile.currentGrade, profile.targetGrade);
    const summary = `최근 학습시간 ${logs.slice(0, 3).reduce((s, x) => s + Number(x.hours || 0), 0)}시간`;
    try {
      const data = await callApi(`${API_BASE}/api/tracker/consult`, { profile, question, summary, methodCore: BAND[k].core });
      const next = [{ q: question, a: data.answer, d: today() }, ...consult].slice(0, 20); await DB.set(K.consult, next); setConsult(next);
    } catch (e) {
      const next = [{ q: question, a: `핵심은 ${BAND[k].focus}. 오늘은 개념 출력 20분 → 기출 40분 → 오답 20분 루틴으로 진행하세요.`, d: today(), fallback: true }, ...consult].slice(0, 20);
      await DB.set(K.consult, next); setConsult(next); setErr(`${e.message} (fallback 사용)`);
    } finally { setBusy((x) => ({ ...x, consult: false })); }
  }, [consult, logs, profile]);

  const resetAll = useCallback(async () => {
    await Promise.all(Object.values(K).map((key) => DB.remove(key)));
    setProfile(null); setLogs([]); setPlan(null); setReport(null); setConsult([]); setScreen("setup");
  }, []);

  if (screen === "loading") return <div style={s.loading}>로딩 중...</div>;
  if (screen === "setup") return <Setup onSave={saveProfile} />;

  const k = bandKey(profile.currentGrade, profile.targetGrade);
  const hours4 = logs.slice(0, 4).reduce((sum, x) => sum + Number(x.hours || 0), 0);
  const scores = logs.slice(0, 4).filter((x) => Number.isFinite(x.score)).map((x) => Number(x.score));
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <div style={s.root}>
      <div style={s.wrap}>
        <h1 style={s.h1}>정시 수학 컨설팅 트래커</h1>
        <p style={s.sub}>{profile.currentGrade}등급 → {profile.targetGrade}등급 · {profile.elective}</p>
        <div style={s.tabs}>{["dashboard", "plan", "log", "report", "consult", "settings"].map((x) => <button key={x} style={{ ...s.tab, ...(tab === x ? s.tabOn : null) }} onClick={() => setTab(x)}>{x}</button>)}</div>
        {err && <div style={s.err}>{err}</div>}

        {tab === "dashboard" && <div style={s.card}>
          <div style={s.grid3}><Stat title="최근 4주 시간" value={`${hours4}h`} /><Stat title="평균 점수" value={avg ? `${avg}점` : "미측정"} /><Stat title="연속 기록" value={`${streak(logs)}주`} /></div>
          <p><b>현재 핵심:</b> {BAND[k].focus}</p><p style={s.muted}>{BAND[k].core}</p>
          <button style={s.btn} onClick={runAnalyze} disabled={busy.analyze}>{busy.analyze ? "분석 중..." : "맞춤 분석 생성"}</button>
        </div>}

        {tab === "plan" && <div style={s.card}>
          <h3>현재 전략</h3>
          <p><b>{plan?.plan?.current_focus?.headline || `지금 핵심: ${BAND[k].focus}`}</b></p>
          <p style={s.muted}>{plan?.plan?.current_focus?.why_now || BAND[k].core}</p>
          <ul>{(plan?.plan?.current_focus?.actions || ["개념 출력", "기출 적용", "오답복기"]).map((x, i) => <li key={i}>{x}</li>)}</ul>
          {(plan?.plan?.period_plan || FALLBACK_PERIOD[k]).map((p, i) => <div key={i} style={s.block}><b>{p.period}</b><p>목표: {p.goal}</p><ul>{(p.actions || []).map((x, j) => <li key={j}>{x}</li>)}</ul><p style={s.warn}>주의: {p.caution}</p></div>)}
        </div>}

        {tab === "log" && <LogForm onAdd={addLog} logs={logs} />}

        {tab === "report" && <div style={s.card}>
          <button style={s.btn} onClick={runReport} disabled={busy.report || !logs.length}>{busy.report ? "생성 중..." : "주간 리포트 생성"}</button>
          {report?.report ? <div style={s.block}><p>{report.report.overall}</p><List t="강점" arr={report.report.strengths} /><List t="개선" arr={report.report.improvements} /><List t="다음 주" arr={report.report.next_week_plan} /><p style={s.warn}>주의: {report.report.caution}</p></div> : <p style={s.muted}>리포트가 없습니다.</p>}
        </div>}

        {tab === "consult" && <ConsultBox onAsk={runConsult} history={consult} busy={busy.consult} />}

        {tab === "settings" && <div style={s.card}>
          <h3>설정</h3>
          <p style={s.muted}>프로필 수정을 원하면 초기화 후 다시 설정하세요.</p>
          <button style={s.danger} onClick={resetAll}>전체 데이터 초기화</button>
        </div>}
      </div>
    </div>
  );
}

function Setup({ onSave }) {
  const [name, setName] = useState("");
  const [c, setC] = useState(null);
  const [t, setT] = useState(null);
  const [e, setE] = useState("미적분");
  const ok = c && t && t < c;
  return <div style={s.root}><div style={s.wrap}><div style={s.card}><h2>시작 설정</h2><label>이름(선택)</label><input style={s.input} value={name} onChange={(x) => setName(x.target.value)} />
    <label>현재 등급</label><GradePick v={c} set={setC} />
    <label>목표 등급</label><GradePick v={t} set={setT} dis={c} />
    <label>선택과목</label><div>{ELECTIVES.map((x) => <button key={x} style={{ ...s.chip, ...(x === e ? s.chipOn : null) }} onClick={() => setE(x)}>{x}</button>)}</div>
    {!ok && <p style={s.warn}>목표 등급은 현재 등급보다 높아야 합니다.</p>}
    <button style={s.btn} disabled={!ok} onClick={() => onSave({ name: name.trim() || "학생", currentGrade: c, targetGrade: t, elective: e, startDate: today() })}>저장하고 시작</button>
  </div></div></div>;
}

function GradePick({ v, set, dis }) {
  return <div style={s.grade}>{Object.entries(GRADE_INFO).map(([g, i]) => { const n = Number(g); const d = dis && n >= dis; return <button key={g} disabled={d} style={{ ...s.gbtn, background: v === n ? i.color : "#1f2937", opacity: d ? 0.4 : 1 }} onClick={() => set(n)}>{i.label}</button>; })}</div>;
}

function LogForm({ onAdd, logs }) {
  const [w, setW] = useState(weekLabel(0)), [h, setH] = useState(10), [score, setScore] = useState(""), [weak, setWeak] = useState(""), [memo, setMemo] = useState(""), [tags, setTags] = useState([]);
  const tg = (x) => setTags((p) => p.includes(x) ? p.filter((v) => v !== x) : [...p, x]);
  return <div style={s.card}><h3>학습 기록</h3><input style={s.input} value={w} onChange={(e) => setW(e.target.value)} placeholder="주차" />
    <input style={s.input} type="number" value={h} onChange={(e) => setH(e.target.value)} placeholder="시간" />
    <input style={s.input} type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="점수(선택)" />
    <input style={s.input} value={weak} onChange={(e) => setWeak(e.target.value)} placeholder="취약 단원" />
    <textarea style={s.ta} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모" />
    <div>{TAGS.map((x) => <button key={x} style={{ ...s.chip, ...(tags.includes(x) ? s.chipOn : null) }} onClick={() => tg(x)}>{x}</button>)}</div>
    <button style={s.btn} onClick={() => { onAdd({ week: w, date: today(), hours: Number(h || 0), score: score === "" ? null : Number(score), weakPoint: weak, memo, tags }); setWeak(""); setMemo(""); setTags([]); }}>기록 저장</button>
    <div style={s.block}><h4>최근 기록</h4>{!logs.length ? <p style={s.muted}>없음</p> : logs.map((x, i) => <p key={i}>{x.week} · {x.hours}h · {Number.isFinite(x.score) ? `${x.score}점` : "미측정"} {x.weakPoint ? `· ${x.weakPoint}` : ""}</p>)}</div>
  </div>;
}

function ConsultBox({ onAsk, history, busy }) {
  const [q, setQ] = useState("");
  return <div style={s.card}><h3>AI 코치</h3><textarea style={s.ta} value={q} onChange={(e) => setQ(e.target.value)} placeholder="질문 입력" />
    <button style={s.btn} disabled={busy} onClick={() => { onAsk(q); setQ(""); }}>{busy ? "답변 생성 중..." : "질문하기"}</button>
    <div style={s.block}><h4>기록</h4>{!history.length ? <p style={s.muted}>없음</p> : history.map((x, i) => <div key={i} style={{ marginBottom: 8 }}><b>Q.</b> {x.q}<br /><b>A.</b> {x.a}</div>)}</div>
  </div>;
}

function List({ t, arr = [] }) { if (!arr.length) return null; return <><b>{t}</b><ul>{arr.map((x, i) => <li key={i}>{x}</li>)}</ul></>; }
function Stat({ title, value }) { return <div style={s.stat}><div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div><div style={s.muted}>{title}</div></div>; }

const s = {
  root: { minHeight: "100vh", background: "#07090f", color: "#e2e8f0", fontFamily: "'Noto Sans KR',sans-serif" },
  loading: { minHeight: "100vh", background: "#07090f", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" },
  wrap: { maxWidth: 940, margin: "0 auto", padding: "24px 14px 60px" },
  h1: { margin: "0 0 6px" }, sub: { color: "#94a3b8", margin: "0 0 10px" },
  tabs: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }, tab: { border: "1px solid #334155", background: "#111827", color: "#cbd5e1", borderRadius: 999, padding: "6px 10px", cursor: "pointer" }, tabOn: { background: "#1d4ed8", borderColor: "#1d4ed8" },
  card: { background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: 14, marginBottom: 10 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }, stat: { border: "1px solid #334155", borderRadius: 10, padding: 10, textAlign: "center", background: "#111827" },
  block: { border: "1px solid #334155", borderRadius: 10, padding: 10, marginTop: 8, background: "#111827" },
  btn: { marginTop: 8, border: "none", borderRadius: 10, padding: "9px 12px", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" },
  danger: { marginTop: 8, border: "1px solid #ef4444", borderRadius: 10, padding: "9px 12px", background: "rgba(239,68,68,0.12)", color: "#fecaca", fontWeight: 700, cursor: "pointer" },
  input: { width: "100%", marginBottom: 8, background: "#111827", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", padding: "9px 10px" },
  ta: { width: "100%", minHeight: 80, marginBottom: 8, background: "#111827", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", padding: "9px 10px", resize: "vertical" },
  grade: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, marginBottom: 8 }, gbtn: { border: "1px solid #334155", borderRadius: 10, padding: "8px 6px", color: "#fff", cursor: "pointer" },
  chip: { border: "1px solid #334155", borderRadius: 999, padding: "5px 9px", margin: "0 6px 6px 0", background: "#111827", color: "#cbd5e1", cursor: "pointer" }, chipOn: { background: "#1d4ed8", borderColor: "#1d4ed8", color: "#fff" },
  err: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fecaca", borderRadius: 10, padding: "8px 10px", marginBottom: 10 },
  muted: { color: "#94a3b8" }, warn: { color: "#fca5a5" },
};
