import { useCallback, useEffect, useMemo, useState } from "react";
import "./suneung-tracker.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8787";
const ELECTIVES = ["확률과통계", "미적분", "기하"];
const TAGS = ["개념", "기출", "N제", "모의고사", "오답복기", "EBS", "시간관리"];
const TABS = [
  { id: "dashboard", label: "대시보드" },
  { id: "plan", label: "학습 설계" },
  { id: "log", label: "누적 기록" },
  { id: "report", label: "주간 리포트" },
  { id: "consult", label: "AI 코치" },
  { id: "settings", label: "설정" },
];
const SOURCE_CHANNELS = [
  "오르비 칼럼/후기",
  "포만한/수만휘 커뮤니티",
  "유튜브 키워드 영상",
  "강사 OT·커리큘럼",
  "수강후기·교재 정보",
  "KICE 공식 정보",
];
const QUICK_QUESTIONS = [
  "이번 주 내 취약 단원 1개만 확실히 올리는 루틴 짜줘",
  "오답복기 시간을 줄이면서 효과를 유지하는 방법 알려줘",
  "등급 상승에 직접 영향이 큰 과제 3개만 추려줘",
  "실모에서 시간 배분이 무너질 때 즉시 복구 루틴이 뭐야?",
];

const GRADE_INFO = {
  1: { label: "1등급", range: "96~100" },
  2: { label: "2등급", range: "89~95" },
  3: { label: "3등급", range: "77~88" },
  4: { label: "4등급", range: "60~76" },
  5: { label: "5등급", range: "40~59" },
  6: { label: "6등급", range: "23~39" },
  7: { label: "7등급", range: "12~22" },
  8: { label: "8등급", range: "4~11" },
  9: { label: "9등급", range: "3점 이하" },
};

const BAND = {
  "9-7": {
    focus: "개념 공백 + 쉬운 기출 연결",
    core: "강의보다 개념 출력과 즉시 적용이 우선",
    weekly: "주 10~12시간",
  },
  "7-5": {
    focus: "개념 마무리 + 기출 전환",
    core: "개념 회독을 길게 끌지 말고 기출에서 재현",
    weekly: "주 12~15시간",
  },
  "5-3": {
    focus: "중난도 처리력 + 시나리오 설계",
    core: "계산 전에 조건 구조를 먼저 읽는 습관",
    weekly: "주 15~18시간",
  },
  "3-1": {
    focus: "실전 안정화 + 실수 제거",
    core: "문제량보다 루틴 고정과 실수 제거가 핵심",
    weekly: "주 18시간+",
  },
};

const FALLBACK_PERIOD = {
  "9-7": [
    {
      period: "3~6모 전",
      goal: "개념 출력 고정",
      actions: ["매일 개념 20분 출력", "쉬운 기출 10~15문항", "오답 분류"],
      caution: "강의만 듣지 말기",
    },
    {
      period: "6~9모",
      goal: "기출 정착",
      actions: ["유형별 반복", "문항당 시간 제한", "주 1회 실전 세트"],
      caution: "한 문제 과몰입 금지",
    },
    {
      period: "9모~수능 전",
      goal: "실전 안정화",
      actions: ["주 2회 실전", "반복 실수 3개 이내", "풀이 순서 고정"],
      caution: "새 교재 확장 금지",
    },
  ],
  "7-5": [
    {
      period: "3~6모 전",
      goal: "공통 개념 마무리",
      actions: ["개념 후 즉시 기출", "풀이 재현 복기", "선택과목 취약 보완"],
      caution: "개념만 회독 금지",
    },
    {
      period: "6~9모",
      goal: "중난도 확장",
      actions: ["중난도 비중 확대", "주 2회 실전", "오답 라벨링"],
      caution: "오답복기 생략 금지",
    },
    {
      period: "9모~수능 전",
      goal: "점수 안정",
      actions: ["주 2~3회 모의", "반복 실수 보정", "압축노트 1권"],
      caution: "새 인강 과다 추가 금지",
    },
  ],
  "5-3": [
    {
      period: "3~6모 전",
      goal: "준킬러 기반",
      actions: ["조건 해석 우선", "선택과목 빈출 완성", "오답 3회 복기"],
      caution: "계산부터 시작 금지",
    },
    {
      period: "6~9모",
      goal: "N제 + 실전 운영",
      actions: ["주간 N제 15~20", "포기 기준 고정", "검산 5분"],
      caution: "정답률 집착 금지",
    },
    {
      period: "9모~수능 전",
      goal: "안정화",
      actions: ["주 3회 모의", "킬러 기대값 전략", "실수 패턴 제거"],
      caution: "막판 방식 변경 금지",
    },
  ],
  "3-1": [
    {
      period: "3~6모 전",
      goal: "고난도 루틴",
      actions: ["킬러 40분 자력", "시나리오 비교", "계산 정확도 훈련"],
      caution: "즉시 해설 의존 금지",
    },
    {
      period: "6~9모",
      goal: "실전 최적화",
      actions: ["주 3~4회 실전", "킬러 선택 전략", "계산 실수 보정"],
      caution: "문제량만 늘리지 않기",
    },
    {
      period: "9모~수능 전",
      goal: "최종 안정",
      actions: ["새 교재 중단", "EBS/기출 점검", "당일 루틴 리허설"],
      caution: "컨디션 관리 실패 주의",
    },
  ],
};

const K = {
  profile: "tracker:profile",
  logs: "tracker:logs",
  plan: "tracker:plan",
  planHistory: "tracker:plan_history",
  report: "tracker:report",
  reportHistory: "tracker:report_history",
  consult: "tracker:consult",
  checklist: "tracker:checklist",
  coachMemory: "tracker:coach_memory",
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

const bandKey = (c, t) =>
  c >= 8 && t >= 6 ? "9-7" : c >= 6 && t >= 4 ? "7-5" : c >= 4 && t >= 2 ? "5-3" : "3-1";

const calcStreak = (logs) => {
  if (!logs.length) return 0;
  for (let i = 0; i < logs.length; i += 1) {
    if (logs[i].week !== weekLabel(-i)) return i;
  }
  return logs.length;
};

function createChecklist(currentBand, activePlan) {
  const seed = [
    ...(activePlan?.current_focus?.actions || []),
    ...(FALLBACK_PERIOD[currentBand]?.[0]?.actions || []),
    "오답복기 2회 이상 실행",
    "주간 실전 세트 1회 진행",
    "학습 기록 탭 업데이트",
  ];
  const unique = [];
  for (const line of seed) {
    const text = String(line || "").trim();
    if (!text) continue;
    if (unique.includes(text)) continue;
    unique.push(text);
    if (unique.length >= 5) break;
  }
  return unique.map((label, idx) => ({
    id: `mission-${idx + 1}`,
    label,
    done: false,
  }));
}

function toPlanExportText(profile, currentBand, planData) {
  const plan = planData?.plan || {};
  const period = Array.isArray(plan?.period_plan) ? plan.period_plan : FALLBACK_PERIOD[currentBand];
  const lines = [
    `# 수학 전략 내보내기`,
    `- 학생: ${profile.name || "학생"}`,
    `- 현재/목표: ${profile.currentGrade}등급 -> ${profile.targetGrade}등급`,
    `- 선택과목: ${profile.elective}`,
    `- 생성일: ${new Date().toLocaleString()}`,
    ``,
    `## 현재 핵심`,
    `${plan?.current_focus?.headline || BAND[currentBand].focus}`,
    `${plan?.current_focus?.why_now || BAND[currentBand].core}`,
    ``,
    `## 시기별 전략`,
  ];
  for (const p of period) {
    lines.push(`### ${p.period}`);
    lines.push(`- 목표: ${p.goal}`);
    for (const action of p.actions || []) lines.push(`- 실행: ${action}`);
    lines.push(`- 주의: ${p.caution}`);
    lines.push(``);
  }
  if (Array.isArray(plan?.success_case_insights) && plan.success_case_insights.length) {
    lines.push(`## 실제 성과 사례 인사이트`);
    for (const line of plan.success_case_insights) lines.push(`- ${line}`);
    lines.push(``);
  }
  if (Array.isArray(plan?.question_trend_insights) && plan.question_trend_insights.length) {
    lines.push(`## 학생 질문 트렌드`);
    for (const line of plan.question_trend_insights) lines.push(`- ${line}`);
    lines.push(``);
  }
  return lines.join("\n");
}

function toReportExportText(profile, reportData) {
  const report = reportData?.report || {};
  const lines = [
    `# 주간 리포트 내보내기`,
    `- 학생: ${profile.name || "학생"}`,
    `- 생성일: ${new Date().toLocaleString()}`,
    ``,
    `## Overall`,
    `${report.overall || "-"}`,
    ``,
    `## 강점`,
    ...(report.strengths || []).map((x) => `- ${x}`),
    ``,
    `## 개선`,
    ...(report.improvements || []).map((x) => `- ${x}`),
    ``,
    `## 다음 주`,
    ...(report.next_week_plan || []).map((x) => `- ${x}`),
    ``,
    `## 주의`,
    `${report.caution || "-"}`,
  ];
  return lines.join("\n");
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function callApi(url, body, timeout = 13000) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: c.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "API 오류");
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function callGet(url, timeout = 10000) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), timeout);
  try {
    const res = await fetch(url, { method: "GET", signal: c.signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "GET 오류");
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
      success_case_insights: [],
      question_trend_insights: [],
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
  const [planHistory, setPlanHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [consult, setConsult] = useState([]);
  const [checklist, setChecklist] = useState(null);
  const [coachMemory, setCoachMemory] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState({ analyze: false, report: false, consult: false });
  const [health, setHealth] = useState({ loading: false, error: "", data: null, summary: null });
  const currentBand = useMemo(
    () => (profile ? bandKey(profile.currentGrade, profile.targetGrade) : "7-5"),
    [profile]
  );

  useEffect(() => {
    (async () => {
      const [p, l, pl, ph, r, rh, c, m, cm] = await Promise.all([
        DB.get(K.profile),
        DB.get(K.logs),
        DB.get(K.plan),
        DB.get(K.planHistory),
        DB.get(K.report),
        DB.get(K.reportHistory),
        DB.get(K.consult),
        DB.get(K.checklist),
        DB.get(K.coachMemory),
      ]);
      if (!p) {
        setScreen("setup");
        return;
      }
      setProfile(p);
      setLogs(l || []);
      setPlan(pl);
      setPlanHistory(ph || []);
      setReport(r);
      setReportHistory(rh || []);
      setConsult(c || []);
      setChecklist(m || null);
      setCoachMemory(cm || "");
      setScreen("main");
    })();
  }, []);

  useEffect(() => {
    if (screen !== "main") return;
    (async () => {
      setHealth((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const [apiHealth, summary] = await Promise.all([
          callGet(`${API_BASE}/api/health`, 9000),
          callGet(`${API_BASE}/api/knowledge/summary`, 9000),
        ]);
        setHealth({ loading: false, error: "", data: apiHealth, summary });
      } catch (e) {
        setHealth({ loading: false, error: e.message, data: null, summary: null });
      }
    })();
  }, [screen]);

  useEffect(() => {
    if (screen !== "main" || !profile) return;
    const thisWeek = weekLabel(0);
    if (checklist?.week === thisWeek) return;
    const next = {
      week: thisWeek,
      items: createChecklist(currentBand, plan?.plan),
    };
    setChecklist(next);
    DB.set(K.checklist, next);
  }, [screen, profile, checklist?.week, currentBand, plan?.updatedAt, plan?.plan]);

  const saveProfile = useCallback(async (p) => {
    await DB.set(K.profile, p);
    setProfile(p);
    setScreen("main");
  }, []);

  const addLog = useCallback(
    async (item) => {
      const next = [item, ...logs].slice(0, 52);
      await DB.set(K.logs, next);
      setLogs(next);
    },
    [logs]
  );

  const runAnalyze = useCallback(async () => {
    setBusy((x) => ({ ...x, analyze: true }));
    setErr("");
    try {
      const data = await callApi(
        `${API_BASE}/api/analyze`,
        {
          currentGrade: Number(profile.currentGrade),
          targetGrade: Number(profile.targetGrade),
          electiveSubject: profile.elective,
        },
        16000
      );
      const next = { ...data, updatedAt: today() };
      await DB.set(K.plan, next);
      setPlan(next);

      const nextHistory = [
        {
          date: today(),
          headline: next?.plan?.current_focus?.headline || BAND[currentBand].focus,
          model: next?.meta?.model || "fallback",
        },
        ...planHistory,
      ].slice(0, 20);
      await DB.set(K.planHistory, nextHistory);
      setPlanHistory(nextHistory);
    } catch (e) {
      const next = { ...fallbackPlan(profile), updatedAt: today() };
      await DB.set(K.plan, next);
      setPlan(next);
      setErr(`${e.message} (fallback 사용)`);
    } finally {
      setBusy((x) => ({ ...x, analyze: false }));
    }
  }, [profile, currentBand, planHistory]);

  const runReport = useCallback(async () => {
    if (!logs.length) return;
    setBusy((x) => ({ ...x, report: true }));
    setErr("");
    const k = bandKey(profile.currentGrade, profile.targetGrade);
    const recent = logs.slice(0, 4);
    const metrics = {
      totalHours: recent.reduce((s, x) => s + Number(x.hours || 0), 0),
      avgScore: (() => {
        const scores = recent
          .filter((x) => Number.isFinite(x.score))
          .map((x) => Number(x.score));
        return scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;
      })(),
      allWeakPoints: recent.map((x) => x.weakPoint).filter(Boolean).join(", "),
      allMemos: recent.map((x) => x.memo).filter(Boolean).join(" / "),
    };
    try {
      const data = await callApi(`${API_BASE}/api/tracker/report`, {
        profile,
        logs: recent,
        method: BAND[k],
        metrics,
      });
      const next = { report: data.report, updatedAt: today() };
      await DB.set(K.report, next);
      setReport(next);

      const nextHistory = [
        {
          date: today(),
          overall: String(data?.report?.overall || "주간 요약"),
        },
        ...reportHistory,
      ].slice(0, 20);
      await DB.set(K.reportHistory, nextHistory);
      setReportHistory(nextHistory);
    } catch (e) {
      const next = {
        report: {
          overall: "리포트 생성에 실패해 기본 리포트를 표시합니다.",
          strengths: ["기록 유지"],
          improvements: ["취약 단원 1~2개 압축"],
          next_week_plan: ["월/수/금 개념+기출", "화/목 취약+오답", "주말 실전 1세트"],
          caution: "오답복기 누락 주의",
          encouragement: "이번 주는 루틴 고정에 집중하세요.",
        },
        updatedAt: today(),
      };
      await DB.set(K.report, next);
      setReport(next);
      setErr(`${e.message} (fallback 사용)`);
    } finally {
      setBusy((x) => ({ ...x, report: false }));
    }
  }, [logs, profile, reportHistory]);

  const runConsult = useCallback(
    async (question) => {
      if (!question.trim()) return;
      setBusy((x) => ({ ...x, consult: true }));
      setErr("");
      const k = bandKey(profile.currentGrade, profile.targetGrade);
      const summary = `최근 학습시간 ${logs
        .slice(0, 3)
        .reduce((s, x) => s + Number(x.hours || 0), 0)}시간`;
      try {
        const data = await callApi(`${API_BASE}/api/tracker/consult`, {
          profile,
          question,
          summary,
          methodCore: BAND[k].core,
        });
        const next = [{ q: question, a: data.answer, d: today() }, ...consult].slice(0, 20);
        await DB.set(K.consult, next);
        setConsult(next);
      } catch (e) {
        const next = [
          {
            q: question,
            a: `핵심은 ${BAND[k].focus}. 오늘은 개념 출력 20분 → 기출 40분 → 오답 20분 루틴으로 진행하세요.`,
            d: today(),
            fallback: true,
          },
          ...consult,
        ].slice(0, 20);
        await DB.set(K.consult, next);
        setConsult(next);
        setErr(`${e.message} (fallback 사용)`);
      } finally {
        setBusy((x) => ({ ...x, consult: false }));
      }
    },
    [consult, logs, profile]
  );

  const resetAll = useCallback(async () => {
    await Promise.all(Object.values(K).map((key) => DB.remove(key)));
    setProfile(null);
    setLogs([]);
    setPlan(null);
    setPlanHistory([]);
    setReport(null);
    setReportHistory([]);
    setConsult([]);
    setChecklist(null);
    setCoachMemory("");
    setScreen("setup");
  }, []);

  const toggleChecklist = useCallback(
    async (id) => {
      if (!checklist) return;
      const next = {
        ...checklist,
        items: checklist.items.map((item) =>
          item.id === id ? { ...item, done: !item.done } : item
        ),
      };
      setChecklist(next);
      await DB.set(K.checklist, next);
    },
    [checklist]
  );

  const refreshChecklist = useCallback(async () => {
    const next = {
      week: weekLabel(0),
      items: createChecklist(currentBand, plan?.plan),
    };
    setChecklist(next);
    await DB.set(K.checklist, next);
  }, [currentBand, plan?.plan]);

  const saveCoachMemory = useCallback(
    async (value) => {
      setCoachMemory(value);
      await DB.set(K.coachMemory, value);
    },
    []
  );

  const dashboardStats = useMemo(() => {
    const hours4 = logs.slice(0, 4).reduce((sum, x) => sum + Number(x.hours || 0), 0);
    const scores = logs
      .slice(0, 4)
      .filter((x) => Number.isFinite(x.score))
      .map((x) => Number(x.score));
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    return {
      hours4,
      avgScore,
      streak: calcStreak(logs),
    };
  }, [logs]);

  const checklistProgress = useMemo(() => {
    const items = checklist?.items || [];
    const total = items.length;
    const done = items.filter((item) => item.done).length;
    const ratio = total ? Math.round((done / total) * 100) : 0;
    return { total, done, ratio };
  }, [checklist]);

  const riskSignals = useMemo(() => {
    const recent = logs.slice(0, 4);
    const lowHours = recent.filter((x) => Number(x.hours || 0) < 8).length;
    const weakMissing = recent.filter((x) => !String(x.weakPoint || "").trim()).length;
    const memoMissing = recent.filter((x) => !String(x.memo || "").trim()).length;
    return [
      {
        label: "주간 학습시간 부족",
        score: Math.min(100, lowHours * 25),
      },
      {
        label: "취약 단원 기록 누락",
        score: Math.min(100, weakMissing * 25),
      },
      {
        label: "복기 메모 누락",
        score: Math.min(100, memoMissing * 25),
      },
    ];
  }, [logs]);

  if (screen === "loading") {
    return <div className="loading-view">학생 코칭 엔진을 준비하고 있습니다...</div>;
  }

  if (screen === "setup") {
    return <SetupGate onSave={saveProfile} />;
  }

  const activePlan = plan?.plan;

  return (
    <div className="tracker-shell">
      <div className="tracker-glow tracker-glow--one" />
      <div className="tracker-glow tracker-glow--two" />
      <main className="tracker-container">
        <header className="hero">
          <p className="hero__eyebrow">SUNEUNG MATH STRATEGY STUDIO</p>
          <h1>
            {profile.currentGrade}등급에서 {profile.targetGrade}등급까지,
            <br />
            데이터 근거 기반 누적 코칭
          </h1>
          <p className="hero__desc">
            학생의 현재 등급/목표 등급, 실제 학습 기록, 커뮤니티·OT·커리큘럼 데이터까지
            묶어서 매주 학습 전략을 업데이트합니다.
          </p>
          <div className="hero__meta">
            <span>{profile.name || "학생"}</span>
            <span>{profile.elective}</span>
            <span>코칭 시작일 {profile.startDate}</span>
          </div>
        </header>

        <nav className="tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={`tab-btn ${tab === item.id ? "is-active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {err ? <div className="banner-error">{err}</div> : null}

        {tab === "dashboard" ? (
          <DashboardPanel
            stats={dashboardStats}
            profile={profile}
            currentBand={currentBand}
            health={health}
            checklist={checklist}
            checklistProgress={checklistProgress}
            riskSignals={riskSignals}
            planHistory={planHistory}
            reportHistory={reportHistory}
            coachMemory={coachMemory}
            onToggleChecklist={toggleChecklist}
            onRefreshChecklist={refreshChecklist}
            runAnalyze={runAnalyze}
            busyAnalyze={busy.analyze}
          />
        ) : null}

        {tab === "plan" ? (
          <PlanPanel
            profile={profile}
            planData={plan}
            activePlan={activePlan}
            currentBand={currentBand}
            fallbackPeriod={FALLBACK_PERIOD[currentBand]}
          />
        ) : null}

        {tab === "log" ? <LogPanel logs={logs} onAdd={addLog} /> : null}

        {tab === "report" ? (
          <ReportPanel
            profile={profile}
            report={report}
            runReport={runReport}
            busyReport={busy.report}
            hasLogs={logs.length > 0}
            reportHistory={reportHistory}
          />
        ) : null}

        {tab === "consult" ? (
          <ConsultPanel
            onAsk={runConsult}
            history={consult}
            busy={busy.consult}
            coachMemory={coachMemory}
          />
        ) : null}

        {tab === "settings" ? (
          <SettingsPanel
            coachMemory={coachMemory}
            onSaveCoachMemory={saveCoachMemory}
            resetAll={resetAll}
          />
        ) : null}
      </main>
    </div>
  );
}

function SetupGate({ onSave }) {
  const [name, setName] = useState("");
  const [currentGrade, setCurrentGrade] = useState(null);
  const [targetGrade, setTargetGrade] = useState(null);
  const [elective, setElective] = useState("미적분");
  const valid = currentGrade && targetGrade && targetGrade < currentGrade;

  return (
    <div className="tracker-shell tracker-shell--setup">
      <main className="setup-card">
        <p className="hero__eyebrow">SPRINT SETUP</p>
        <h2>학생 맞춤 수학 코칭 시작</h2>
        <p className="setup-desc">
          초기 설정을 바탕으로 시기별 학습법, 강사/교재 추천, 주간 코칭이 누적됩니다.
        </p>

        <label className="field-label" htmlFor="student-name">
          이름(선택)
        </label>
        <input
          id="student-name"
          className="field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 김수학"
        />

        <label className="field-label">현재 등급</label>
        <GradePick value={currentGrade} onPick={setCurrentGrade} disabledFrom={null} />

        <label className="field-label">목표 등급</label>
        <GradePick value={targetGrade} onPick={setTargetGrade} disabledFrom={currentGrade} />

        <label className="field-label">선택과목</label>
        <div className="chip-row">
          {ELECTIVES.map((item) => (
            <button
              key={item}
              className={`chip ${item === elective ? "is-active" : ""}`}
              onClick={() => setElective(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {!valid ? (
          <p className="field-warn">목표 등급은 현재 등급보다 높아야 합니다.</p>
        ) : null}

        <button
          className="primary-btn"
          disabled={!valid}
          onClick={() =>
            onSave({
              name: name.trim() || "학생",
              currentGrade,
              targetGrade,
              elective,
              startDate: today(),
            })
          }
        >
          저장하고 코칭 시작
        </button>
      </main>
    </div>
  );
}

function DashboardPanel({
  stats,
  profile,
  currentBand,
  health,
  checklist,
  checklistProgress,
  riskSignals,
  planHistory,
  reportHistory,
  coachMemory,
  onToggleChecklist,
  onRefreshChecklist,
  runAnalyze,
  busyAnalyze,
}) {
  const gradeInfo = GRADE_INFO[profile.currentGrade] || {};
  const targetInfo = GRADE_INFO[profile.targetGrade] || {};

  return (
    <section className="panel-stack">
      <div className="grid-3">
        <MetricCard title="최근 4주 학습 시간" value={`${stats.hours4}h`} sub="실행량 누적" />
        <MetricCard
          title="최근 4주 평균 점수"
          value={stats.avgScore ? `${stats.avgScore}점` : "미측정"}
          sub="실전 성과 추적"
        />
        <MetricCard title="연속 주간 기록" value={`${stats.streak}주`} sub="지속성 지표" />
      </div>

      <article className="glass-card">
        <div className="card-headline">
          <h3>현재 구간 전략</h3>
          <span className="tiny-badge">
            {gradeInfo.label} ({gradeInfo.range}) → {targetInfo.label}
          </span>
        </div>
        <p className="card-key">{BAND[currentBand].focus}</p>
        <p className="card-muted">{BAND[currentBand].core}</p>
        <div className="progress-strip">
          <span>이번 주 실행도</span>
          <strong>{checklistProgress.ratio}%</strong>
        </div>
        <div className="progress-bar">
          <div style={{ width: `${checklistProgress.ratio}%` }} />
        </div>
        <button className="primary-btn" onClick={runAnalyze} disabled={busyAnalyze}>
          {busyAnalyze ? "맞춤 분석 생성 중..." : "지금 시점 맞춤 전략 생성"}
        </button>
      </article>

      <article className="glass-card">
        <div className="card-headline">
          <h3>주간 미션 계약</h3>
          <span className="tiny-badge">{checklist?.week || weekLabel(0)}</span>
        </div>
        <div className="item-stack">
          {(checklist?.items || []).map((item) => (
            <button
              key={item.id}
              className={`mission-item ${item.done ? "is-done" : ""}`}
              onClick={() => onToggleChecklist(item.id)}
            >
              <span>{item.done ? "완료" : "진행"}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
        <button className="ghost-btn" onClick={onRefreshChecklist}>
          이번 주 미션 다시 생성
        </button>
      </article>

      <article className="glass-card">
        <div className="card-headline">
          <h3>학습 데이터 근거</h3>
          <span className="tiny-badge">지속 업데이트</span>
        </div>
        <div className="chip-row">
          {SOURCE_CHANNELS.map((item) => (
            <span key={item} className="chip chip-static">
              {item}
            </span>
          ))}
        </div>

        {health.loading ? <p className="card-muted">데이터 상태를 확인하는 중입니다...</p> : null}
        {health.error ? (
          <p className="field-warn">데이터 상태 확인 실패: {health.error}</p>
        ) : null}
        {health.data ? (
          <div className="data-grid">
            <div>
              <strong>{health.data.knowledgeItems}</strong>
              <span>학습 지식 항목</span>
            </div>
            <div>
              <strong>{health.data.recommendationInstructors}</strong>
              <span>강사 추천 후보</span>
            </div>
            <div>
              <strong>{health.data.recommendationBooks}</strong>
              <span>교재 추천 후보</span>
            </div>
            <div>
              <strong>{health.data.studentSuccessCases || 0}</strong>
              <span>성과 사례 데이터</span>
            </div>
            <div>
              <strong>{health.data.questionSignals || 0}</strong>
              <span>질문 트렌드 데이터</span>
            </div>
            <div>
              <strong>{health.data.knowledgeUpdatedAt?.slice(0, 10) || "-"}</strong>
              <span>지식 갱신일</span>
            </div>
          </div>
        ) : null}
        {health.summary?.categories ? (
          <div className="data-grid">
            <div>
              <strong>{(health.summary.categories.study_methods || []).length}</strong>
              <span>공부법 근거 문장</span>
            </div>
            <div>
              <strong>{(health.summary.categories.learning_routines || []).length}</strong>
              <span>루틴 근거 문장</span>
            </div>
            <div>
              <strong>{(health.summary.categories.lecture_and_books?.instructors || []).length}</strong>
              <span>강사 요약 항목</span>
            </div>
            <div>
              <strong>{(health.summary.categories.lecture_and_books?.books || []).length}</strong>
              <span>교재 요약 항목</span>
            </div>
            <div>
              <strong>{(health.summary.categories.student_success_cases || []).length}</strong>
              <span>성과 사례 요약</span>
            </div>
            <div>
              <strong>{(health.summary.categories.question_signals || []).length}</strong>
              <span>질문 트렌드 요약</span>
            </div>
          </div>
        ) : null}
      </article>

      <div className="grid-2">
        <article className="glass-card">
          <div className="card-headline">
            <h3>리스크 레이더</h3>
          </div>
          <div className="item-stack">
            {riskSignals.map((risk) => (
              <div key={risk.label}>
                <div className="progress-strip">
                  <span>{risk.label}</span>
                  <strong>{risk.score}</strong>
                </div>
                <div className="progress-bar is-risk">
                  <div style={{ width: `${risk.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card">
          <div className="card-headline">
            <h3>코칭 누적 히스토리</h3>
          </div>
          <div className="history-list">
            <div className="history-line">
              <span>전략 생성</span>
              <strong>{planHistory.length}회</strong>
            </div>
            <div className="history-line">
              <span>리포트 생성</span>
              <strong>{reportHistory.length}회</strong>
            </div>
            <div className="history-line">
              <span>코치 메모</span>
              <strong>{coachMemory ? "등록됨" : "미등록"}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function PlanPanel({ profile, planData, activePlan, currentBand, fallbackPeriod }) {
  const periodPlan = activePlan?.period_plan || fallbackPeriod;
  const focusActions = activePlan?.current_focus?.actions || [
    "개념 출력",
    "쉬운 기출 즉시 적용",
    "오답복기 루틴 고정",
  ];
  const instructors = activePlan?.recommended_instructors || [];
  const books = activePlan?.recommended_books || [];
  const successInsights = activePlan?.success_case_insights || [];
  const questionInsights = activePlan?.question_trend_insights || [];

  return (
    <section className="panel-stack">
      <article className="glass-card">
        <div className="card-headline">
          <h3>근본 학습법</h3>
          <span className="tiny-badge">현재 우선순위</span>
        </div>
        {activePlan?.student_feedback ? <p>{activePlan.student_feedback}</p> : null}
        <p className="card-key">
          {activePlan?.current_focus?.headline || `지금 핵심: ${BAND[currentBand].focus}`}
        </p>
        <p className="card-muted">{activePlan?.current_focus?.why_now || BAND[currentBand].core}</p>
        <ul className="plain-list">
          {focusActions.map((action, idx) => (
            <li key={`${action}-${idx}`}>{action}</li>
          ))}
        </ul>
        <button
          className="ghost-btn"
          onClick={() =>
            downloadTextFile(
              `plan-${today()}.md`,
              toPlanExportText(profile, currentBand, planData)
            )
          }
        >
          전략 내보내기(.md)
        </button>
      </article>

      <article className="glass-card">
        <div className="card-headline">
          <h3>시기별 로드맵</h3>
          <span className="tiny-badge">3~6모 / 6~9모 / 9모~수능</span>
        </div>
        <div className="timeline">
          {periodPlan.map((item, idx) => (
            <div className="timeline-item" key={`${item.period}-${idx}`}>
              <h4>{item.period}</h4>
              <p>목표: {item.goal}</p>
              <ul className="plain-list">
                {(item.actions || []).map((action, actionIdx) => (
                  <li key={`${action}-${actionIdx}`}>{action}</li>
                ))}
              </ul>
              <p className="warn-text">주의: {item.caution}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="grid-2">
        <article className="glass-card">
          <div className="card-headline">
            <h3>추천 강사/강의</h3>
          </div>
          {instructors.length ? (
            <div className="item-stack">
              {instructors.map((inst, idx) => (
                <div key={`${inst.name}-${idx}`} className="sub-card">
                  <strong>
                    {inst.name} ({inst.platform})
                  </strong>
                  <p>{inst.reason}</p>
                  <p className="card-muted">{inst.best_for}</p>
                  {inst.usage ? <p className="card-muted">활용: {inst.usage}</p> : null}
                  {inst.curriculum_path?.length ? (
                    <ul className="plain-list">
                      {inst.curriculum_path.slice(0, 3).map((line, lineIdx) => (
                        <li key={`${inst.name}-curriculum-${lineIdx}`}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                  {inst.seasonal_plan?.length ? (
                    <>
                      <strong>시기별 수강 계약</strong>
                      <ul className="plain-list">
                        {inst.seasonal_plan.slice(0, 3).map((line, lineIdx) => (
                          <li key={`${inst.name}-seasonal-${lineIdx}`}>{line}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="card-muted">분석 생성 후 추천 강사가 표시됩니다.</p>
          )}
        </article>

        <article className="glass-card">
          <div className="card-headline">
            <h3>추천 교재</h3>
          </div>
          {books.length ? (
            <div className="item-stack">
              {books.map((book, idx) => (
                <div key={`${book.title}-${idx}`} className="sub-card">
                  <strong>
                    {book.title} <span className="card-muted">[{book.type}]</span>
                  </strong>
                  <p>{book.reason || book.purpose}</p>
                  <p className="card-muted">{book.when_to_use}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="card-muted">분석 생성 후 추천 교재가 표시됩니다.</p>
          )}
        </article>
      </div>

      <div className="grid-2">
        <article className="glass-card">
          <div className="card-headline">
            <h3>실제 성과 사례 인사이트</h3>
            <span className="tiny-badge">커뮤니티 근거</span>
          </div>
          {successInsights.length ? (
            <ul className="plain-list">
              {successInsights.map((line, idx) => (
                <li key={`success-insight-${idx}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="card-muted">성과 사례 데이터가 누적되면 이 구간이 자동으로 채워집니다.</p>
          )}
        </article>

        <article className="glass-card">
          <div className="card-headline">
            <h3>학생 질문 트렌드</h3>
            <span className="tiny-badge">유튜브/커뮤니티</span>
          </div>
          {questionInsights.length ? (
            <ul className="plain-list">
              {questionInsights.map((line, idx) => (
                <li key={`question-insight-${idx}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="card-muted">질문 데이터가 누적되면 자주 묻는 패턴이 표시됩니다.</p>
          )}
        </article>
      </div>

      <article className="glass-card">
        <div className="card-headline">
          <h3>최종 운영 팁</h3>
        </div>
        <p className="card-muted">{activePlan?.final_tip || "같은 실수를 줄이는 구조가 점수를 올립니다."}</p>
      </article>
    </section>
  );
}

function LogPanel({ logs, onAdd }) {
  const [week, setWeek] = useState(weekLabel(0));
  const [hours, setHours] = useState(10);
  const [score, setScore] = useState("");
  const [weakPoint, setWeakPoint] = useState("");
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState([]);

  const toggleTag = (tag) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );

  return (
    <section className="panel-stack">
      <article className="glass-card">
        <h3>학습 기록 입력</h3>
        <label className="field-label" htmlFor="week">
          주차
        </label>
        <input
          id="week"
          className="field-input"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
        />

        <div className="grid-2">
          <div>
            <label className="field-label" htmlFor="hours">
              학습 시간
            </label>
            <input
              id="hours"
              className="field-input"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="score">
              점수(선택)
            </label>
            <input
              id="score"
              className="field-input"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
        </div>

        <label className="field-label" htmlFor="weak-point">
          취약 단원
        </label>
        <input
          id="weak-point"
          className="field-input"
          value={weakPoint}
          onChange={(e) => setWeakPoint(e.target.value)}
          placeholder="예: 미적분 접선/도함수 활용"
        />

        <label className="field-label" htmlFor="memo">
          메모
        </label>
        <textarea
          id="memo"
          className="field-textarea"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="이번 주 실수 패턴, 다음 주 수정 포인트"
        />

        <div className="chip-row">
          {TAGS.map((tag) => (
            <button
              key={tag}
              className={`chip ${tags.includes(tag) ? "is-active" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            onAdd({
              week,
              date: today(),
              hours: Number(hours || 0),
              score: score === "" ? null : Number(score),
              weakPoint,
              memo,
              tags,
            });
            setWeakPoint("");
            setMemo("");
            setTags([]);
          }}
        >
          기록 저장
        </button>
      </article>

      <article className="glass-card">
        <h3>최근 누적 기록</h3>
        {!logs.length ? (
          <p className="card-muted">아직 기록이 없습니다.</p>
        ) : (
          <div className="item-stack">
            {logs.map((item, idx) => (
              <div key={`${item.week}-${idx}`} className="sub-card">
                <strong>
                  {item.week} · {item.hours}h ·{" "}
                  {Number.isFinite(item.score) ? `${item.score}점` : "미측정"}
                </strong>
                {item.weakPoint ? <p>취약 단원: {item.weakPoint}</p> : null}
                {item.memo ? <p className="card-muted">{item.memo}</p> : null}
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function ReportPanel({ profile, report, runReport, busyReport, hasLogs, reportHistory }) {
  return (
    <section className="panel-stack">
      <article className="glass-card">
        <div className="card-headline">
          <h3>주간 리포트 생성</h3>
        </div>
        <p className="card-muted">
          누적 기록을 바탕으로 강점/개선점/다음 주 계획을 자동 요약합니다.
        </p>
        <button
          className="primary-btn"
          onClick={runReport}
          disabled={busyReport || !hasLogs}
        >
          {busyReport ? "리포트 생성 중..." : "주간 리포트 업데이트"}
        </button>
        {report?.report ? (
          <button
            className="ghost-btn"
            onClick={() =>
              downloadTextFile(`report-${today()}.md`, toReportExportText(profile, report))
            }
          >
            리포트 내보내기(.md)
          </button>
        ) : null}
      </article>

      <article className="glass-card">
        <h3>리포트 결과</h3>
        {report?.report ? (
          <>
            <p>{report.report.overall}</p>
            <SimpleList title="강점" items={report.report.strengths} />
            <SimpleList title="개선 포인트" items={report.report.improvements} />
            <SimpleList title="다음 주 실행" items={report.report.next_week_plan} />
            <p className="warn-text">주의: {report.report.caution}</p>
            <p className="card-muted">{report.report.encouragement}</p>
          </>
        ) : (
          <p className="card-muted">리포트가 없습니다. 먼저 주간 기록을 입력해 주세요.</p>
        )}
      </article>

      <article className="glass-card">
        <h3>리포트 누적 이력</h3>
        {!reportHistory.length ? (
          <p className="card-muted">아직 이력이 없습니다.</p>
        ) : (
          <ul className="plain-list">
            {reportHistory.slice(0, 8).map((item, idx) => (
              <li key={`${item.date}-${idx}`}>
                {item.date}: {item.overall}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

function ConsultPanel({ onAsk, history, busy, coachMemory }) {
  const [question, setQuestion] = useState("");

  return (
    <section className="panel-stack">
      <article className="glass-card">
        <h3>AI 코치 상담</h3>
        <p className="card-muted">
          1회성 답변이 아니라 누적 기록과 현재 구간 전략을 반영해 제안합니다.
        </p>
        <textarea
          className="field-textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 미적분 30번에서 막히는 패턴을 줄이고 싶어요."
        />
        <div className="chip-row">
          {QUICK_QUESTIONS.map((item) => (
            <button key={item} className="chip" onClick={() => setQuestion(item)}>
              {item}
            </button>
          ))}
        </div>
        <button
          className="primary-btn"
          disabled={busy}
          onClick={() => {
            onAsk(question);
            setQuestion("");
          }}
        >
          {busy ? "답변 생성 중..." : "질문하기"}
        </button>
        {coachMemory ? (
          <p className="card-muted">코치 메모 반영 중: {coachMemory}</p>
        ) : null}
      </article>

      <article className="glass-card">
        <h3>상담 기록</h3>
        {!history.length ? (
          <p className="card-muted">아직 상담 기록이 없습니다.</p>
        ) : (
          <div className="item-stack">
            {history.map((item, idx) => (
              <div key={`${item.d}-${idx}`} className="sub-card">
                <strong>Q. {item.q}</strong>
                <p>A. {item.a}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function SettingsPanel({ coachMemory, onSaveCoachMemory, resetAll }) {
  const [draft, setDraft] = useState(coachMemory || "");

  useEffect(() => {
    setDraft(coachMemory || "");
  }, [coachMemory]);

  return (
    <section className="panel-stack">
      <article className="glass-card">
        <h3>설정</h3>
        <p className="card-muted">
          프로필/기록/리포트/상담 내역을 초기화하면 시작 설정부터 다시 진행됩니다.
        </p>
        <label className="field-label" htmlFor="coach-memory">
          코치 메모(지속 지시사항)
        </label>
        <textarea
          id="coach-memory"
          className="field-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="예: 기출 복기 먼저 점검하고, 설명은 짧고 강하게"
        />
        <button className="ghost-btn" onClick={() => onSaveCoachMemory(draft.trim())}>
          코치 메모 저장
        </button>
        <button className="danger-btn" onClick={resetAll}>
          전체 데이터 초기화
        </button>
      </article>
    </section>
  );
}

function GradePick({ value, onPick, disabledFrom }) {
  return (
    <div className="grade-grid">
      {Object.entries(GRADE_INFO).map(([grade, info]) => {
        const n = Number(grade);
        const disabled = disabledFrom ? n >= disabledFrom : false;
        return (
          <button
            key={grade}
            className={`grade-chip ${value === n ? "is-active" : ""}`}
            disabled={disabled}
            onClick={() => onPick(n)}
          >
            <strong>{info.label}</strong>
            <span>{info.range}</span>
          </button>
        );
      })}
    </div>
  );
}

function SimpleList({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <>
      <strong>{title}</strong>
      <ul className="plain-list">
        {items.map((item, idx) => (
          <li key={`${item}-${idx}`}>{item}</li>
        ))}
      </ul>
    </>
  );
}

function MetricCard({ title, value, sub }) {
  return (
    <article className="metric-card">
      <p>{title}</p>
      <strong>{value}</strong>
      <span>{sub}</span>
    </article>
  );
}
