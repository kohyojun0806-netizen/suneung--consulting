import { useState, useEffect, useCallback } from "react";
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8787";

// ══════════════════════════════════════════════════════════════
// 📦 STORAGE — Artifact persistent storage (Supabase 연동 전 로컬 대체)
// ══════════════════════════════════════════════════════════════
const DB = {
  async get(key) {
    try {
      if (window?.storage?.get) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : null;
      }
      const raw = window.localStorage.getItem(`tracker:${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async set(key, val) {
    try {
      if (window?.storage?.set) {
        await window.storage.set(key, JSON.stringify(val));
        return;
      }
      window.localStorage.setItem(`tracker:${key}`, JSON.stringify(val));
    } catch {}
  },
};

// ══════════════════════════════════════════════════════════════
// 📊 상수 데이터
// ══════════════════════════════════════════════════════════════
const GRADE_INFO = {
  1:{label:"1등급",range:"96~100점",color:"#ef4444"},2:{label:"2등급",range:"89~95점",color:"#f97316"},
  3:{label:"3등급",range:"77~88점",color:"#f59e0b"},4:{label:"4등급",range:"60~76점",color:"#eab308"},
  5:{label:"5등급",range:"40~59점",color:"#22c55e"},6:{label:"6등급",range:"23~39점",color:"#14b8a6"},
  7:{label:"7등급",range:"12~22점",color:"#3b82f6"},8:{label:"8등급",range:"4~11점",color:"#64748b"},
  9:{label:"9등급",range:"3점 이하",color:"#475569"},
};

const ELECTIVES = ["확률과통계","미적분","기하"];

const STUDY_TAGS = ["개념 강의","백지복습","기출 풀이","N제","실모","오답 분석","선택과목","EBS"];

const GRADE_METHODS = {
  "9-7": { focus:"개념 출력 습관 + 쉬운 기출 연결", core:"강의를 많이 듣는 것보다 개념을 말과 글로 꺼내는 연습이 먼저예요.", weeklyGoal:"하루 2시간: 개념 출력 40% + 문제 적용 40% + 오답 복기 20%" },
  "7-5": { focus:"개념 완성 이후 기출 적용량 확보", core:"개념 기간을 4~8주로 제한하고 유형·기출 적용 비중을 늘려야 등급이 올라요.", weeklyGoal:"하루 2.5시간: 개념·기출 50% + 유형 풀이 30% + 오답 복기 20%" },
  "5-3": { focus:"준킬러 접근 구조화 + 시나리오 매핑", core:"준킬러는 계산을 먼저 시작하지 말고 조건을 구조화한 뒤 풀이 경로를 선택해야 해요.", weeklyGoal:"하루 3시간: 기출·유형 40% + N제 40% + 오답 복기 20%" },
  "3-1": { focus:"킬러 독립 접근 + 실모 원인 분류로 안정화", core:"상위권의 점수 차이는 새 문제량보다 실전 루틴 고정과 반복 실수 제거에서 결정돼요.", weeklyGoal:"하루 4시간: 킬러 접근 40% + 실모 풀이 30% + 오답 정밀 복기 30%" },
};

function getKey(c, t) {
  if (c >= 8 && t >= 6) return "9-7";
  if (c >= 6 && t >= 4) return "7-5";
  if (c >= 4 && t >= 2) return "5-3";
  return "3-1";
}

function getWeekLabel(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
  const m = d.getMonth() + 1, w = d.getDate();
  return `${m}/${w}주`;
}

function today() { return new Date().toISOString().slice(0,10); }

// ══════════════════════════════════════════════════════════════
// 🎨 스타일
// ══════════════════════════════════════════════════════════════
const C = {
  bg:"#07090f", card:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.1)",
  text:"#e2e8f0", muted:"#64748b", accent:"#6366f1", accentLight:"rgba(99,102,241,0.15)",
  green:"#22c55e", red:"#ef4444", amber:"#f59e0b", teal:"#14b8a6",
};

const s = {
  root:{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Pretendard','Noto Sans KR',sans-serif", position:"relative" },
  bg:{ position:"fixed", inset:0, background:"radial-gradient(circle at 15% 15%, rgba(99,102,241,0.1),transparent 40%), radial-gradient(circle at 85% 80%, rgba(239,68,68,0.08),transparent 40%), linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize:"auto,auto,40px 40px,40px 40px", pointerEvents:"none" },
  wrap:{ maxWidth:900, margin:"0 auto", padding:"32px 20px 80px", position:"relative", zIndex:1 },
  card:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:12 },
  badge:{ display:"inline-block", border:"1px solid rgba(99,102,241,0.5)", background:"rgba(99,102,241,0.12)", color:"#a5b4fc", padding:"4px 12px", borderRadius:999, fontSize:11, letterSpacing:1, marginBottom:12 },
  title:{ margin:"0 0 6px", fontSize:"clamp(22px,4vw,36px)", lineHeight:1.2, letterSpacing:-0.5 },
  accent:{ background:"linear-gradient(135deg,#818cf8,#38bdf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
  sub:{ color:C.muted, fontSize:13, margin:"0 0 24px" },
  tabBar:{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 },
  tab:{ padding:"7px 14px", borderRadius:20, border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:12, fontWeight:600, cursor:"pointer" },
  tabActive:{ background:"rgba(99,102,241,0.15)", borderColor:"rgba(99,102,241,0.4)", color:"#a5b4fc" },
  label:{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:6, display:"block" },
  input:{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" },
  textarea:{ width:"100%", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, outline:"none", resize:"vertical", minHeight:80, boxSizing:"border-box" },
  btn:{ border:"none", borderRadius:12, padding:"11px 20px", fontWeight:700, fontSize:14, cursor:"pointer" },
  btnPrimary:{ background:"linear-gradient(135deg,#6366f1,#3b82f6)", color:"#fff" },
  btnGhost:{ background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, color:C.text },
  gradeGrid:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 },
  gradeBtn:{ border:"1px solid", borderRadius:12, padding:"10px 6px", display:"flex", flexDirection:"column", gap:3, alignItems:"center", cursor:"pointer", transition:"all .15s" },
  sectionTitle:{ fontSize:15, fontWeight:700, margin:"0 0 12px", color:C.text },
  muted:{ color:C.muted, fontSize:13 },
  row:{ display:"flex", alignItems:"center", gap:8 },
  pill:{ borderRadius:999, padding:"3px 10px", fontSize:11, fontWeight:700 },
};

// ══════════════════════════════════════════════════════════════
// 메인 앱
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("loading"); // loading|setup|main
  const [profile, setProfile] = useState(null);     // { name, currentGrade, targetGrade, elective, startDate }
  const [logs, setLogs] = useState([]);              // 주간 학습 기록 배열
  const [tab, setTab] = useState("dashboard");
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // 초기 데이터 로드
  useEffect(() => {
    (async () => {
      const p = await DB.get("profile");
      const l = await DB.get("logs") || [];
      if (p) { setProfile(p); setLogs(l); setScreen("main"); }
      else setScreen("setup");
    })();
  }, []);

  const saveProfile = useCallback(async (p) => {
    await DB.set("profile", p);
    setProfile(p);
    setScreen("main");
    setTab("dashboard");
  }, []);

  const addLog = useCallback(async (log) => {
    const next = [log, ...logs].slice(0, 52); // 최대 52주
    await DB.set("logs", next);
    setLogs(next);
  }, [logs]);

  const updateProfile = useCallback(async (p) => {
    await DB.set("profile", p);
    setProfile(p);
  }, []);

  useEffect(() => {
    (async () => {
      if (!profile?.currentGrade || !profile?.targetGrade) return;
      const cacheKey = `analysis:${profile.currentGrade}-${profile.targetGrade}-${profile.elective || "???"}`;
      const cached = await DB.get(cacheKey);
      if (cached) {
        setAnalysis(cached);
      }

      setAnalysisLoading(true);
      setAnalysisError("");
      try {
        const live = await requestAnalyzePlan(profile);
        if (live) {
          setAnalysis(live);
          await DB.set(cacheKey, live);
        }
      } catch {
        const fallback = buildAnalyzeFallback(profile);
        setAnalysis(fallback);
        setAnalysisError("?? API ??? ????? ?? ????? ?? ????.");
      } finally {
        setAnalysisLoading(false);
      }
    })();
  }, [profile]);

  if (screen === "loading") return <div style={{ ...s.root, display:"flex", alignItems:"center", justifyContent:"center" }}><Spinner /></div>;

  return (
    <div style={s.root}>
      <div style={s.bg} />
      <div style={s.wrap}>
        <Header />
        {screen === "setup" && <SetupScreen onSave={saveProfile} />}
        {screen === "main" && profile && (
          <>
            <ProfileBar profile={profile} logs={logs} onEdit={() => setScreen("setup")} />
            <div style={s.tabBar}>
              {[["dashboard","📊 대시보드"],["log","✏️ 학습 기록"],["report","📋 주간 리포트"],["consult","🤖 AI 컨설팅"],["settings","⚙️ 설정"]].map(([id,label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ ...s.tab, ...(tab===id ? s.tabActive : {}) }}>{label}</button>
              ))}
            </div>
            {tab === "dashboard" && (
              <Dashboard
                profile={profile}
                logs={logs}
                analysis={analysis}
                analysisLoading={analysisLoading}
                analysisError={analysisError}
              />
            )}
            {tab === "log" && <LogScreen profile={profile} logs={logs} onAdd={addLog} />}
            {tab === "report" && <ReportScreen profile={profile} logs={logs} />}
            {tab === "consult" && <ConsultScreen profile={profile} logs={logs} />}
            {tab === "settings" && <SettingsScreen profile={profile} onUpdate={updateProfile} />}
          </>
        )}
      </div>
    </div>
  );
}

// ── 헤더 ──────────────────────────────────────────────────────
function Header() {
  return (
    <header style={{ textAlign:"center", marginBottom:28 }}>
      <div style={s.badge}>수능 정시 학습 컨설팅</div>
      <h1 style={s.title}>나만의 <span style={s.accent}>수학 학습 코치</span></h1>
      <p style={s.sub}>현재 → 목표 등급까지 · 주간 리포트 · AI 맞춤 피드백</p>
    </header>
  );
}

// ── 프로필 바 ─────────────────────────────────────────────────
function ProfileBar({ profile, logs, onEdit }) {
  const streak = calcStreak(logs);
  return (
    <div style={{ ...s.card, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", marginBottom:16 }}>
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ fontWeight:800, fontSize:16 }}>{profile.name || "학생"}</div>
        <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
          <span style={{ ...s.pill, background:GRADE_INFO[profile.currentGrade]?.color, color:"#fff" }}>{profile.currentGrade}등급</span>
          <span style={{ color:C.muted }}>→</span>
          <span style={{ ...s.pill, background:GRADE_INFO[profile.targetGrade]?.color, color:"#fff" }}>{profile.targetGrade}등급</span>
          <span style={{ ...s.pill, background:"rgba(99,102,241,0.2)", border:"1px solid rgba(99,102,241,0.4)", color:"#a5b4fc" }}>{profile.elective}</span>
        </div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:24, fontWeight:800, color:streak > 0 ? C.amber : C.muted }}>🔥 {streak}</div>
        <div style={{ fontSize:11, color:C.muted }}>주 연속 기록</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:24, fontWeight:800, color:C.accent }}>{logs.length}</div>
        <div style={{ fontSize:11, color:C.muted }}>총 기록 주수</div>
      </div>
      <button onClick={onEdit} style={{ ...s.btn, ...s.btnGhost, fontSize:12, padding:"7px 12px" }}>수정</button>
    </div>
  );
}

// ── 셋업 화면 ─────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [name, setName] = useState("");
  const [cur, setCur] = useState(null);
  const [tgt, setTgt] = useState(null);
  const [elec, setElec] = useState("미적분");
  const [err, setErr] = useState("");

  function submit() {
    if (!name.trim()) { setErr("이름을 입력해주세요."); return; }
    if (!cur || !tgt) { setErr("등급을 선택해주세요."); return; }
    if (tgt >= cur) { setErr("목표 등급은 현재 등급보다 높아야 해요."); return; }
    onSave({ name:name.trim(), currentGrade:cur, targetGrade:tgt, elective:elec, startDate:today() });
  }

  return (
    <div style={s.card}>
      <div style={s.sectionTitle}>📝 학습 프로필 설정</div>
      <p style={s.muted}>한 번만 입력하면 이후부터는 자동으로 기억해요.</p>

      <div style={{ marginBottom:20 }}>
        <label style={s.label}>이름 (닉네임)</label>
        <input style={s.input} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 김수능" />
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={s.label}>현재 등급</label>
        <div style={s.gradeGrid}>
          {Object.entries(GRADE_INFO).map(([g, info]) => (
            <button key={g} onClick={() => setCur(Number(g))} style={{ ...s.gradeBtn, background:cur===Number(g)?info.color:"rgba(255,255,255,0.05)", borderColor:cur===Number(g)?info.color:C.border, color:cur===Number(g)?"#fff":C.muted }}>
              <span style={{ fontWeight:700, fontSize:13 }}>{info.label}</span>
              <span style={{ fontSize:10, opacity:0.8 }}>{info.range}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={s.label}>목표 등급</label>
        <div style={s.gradeGrid}>
          {Object.entries(GRADE_INFO).map(([g, info]) => {
            const disabled = cur && Number(g) >= cur;
            return (
              <button key={g} onClick={() => !disabled && setTgt(Number(g))} style={{ ...s.gradeBtn, background:tgt===Number(g)?info.color:"rgba(255,255,255,0.05)", borderColor:tgt===Number(g)?info.color:C.border, color:tgt===Number(g)?"#fff":disabled?"#2d3748":C.muted, opacity:disabled?0.35:1, cursor:disabled?"not-allowed":"pointer" }}>
                <span style={{ fontWeight:700, fontSize:13 }}>{info.label}</span>
                <span style={{ fontSize:10, opacity:0.8 }}>{info.range}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={s.label}>선택과목</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {ELECTIVES.map(e => (
            <button key={e} onClick={() => setElec(e)} style={{ ...s.gradeBtn, background:elec===e?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.05)", borderColor:elec===e?"rgba(99,102,241,0.6)":C.border, color:elec===e?"#c7d2fe":C.muted, padding:"12px" }}>
              <span style={{ fontWeight:700 }}>{e}</span>
            </button>
          ))}
        </div>
      </div>

      {err && <div style={{ color:C.red, fontSize:13, marginBottom:12 }}>⚠️ {err}</div>}
      <button onClick={submit} style={{ ...s.btn, ...s.btnPrimary, width:"100%" }}>컨설팅 시작하기</button>
    </div>
  );
}

// ── 대시보드 ──────────────────────────────────────────────────
function Dashboard({ profile, logs, analysis, analysisLoading, analysisError }) {
  const key = getKey(profile.currentGrade, profile.targetGrade);
  const method = GRADE_METHODS[key];
  const plan = analysis?.plan || analysis || null;
  const thisWeek = logs[0];
  const lastWeek = logs[1];
  const totalHours = logs.slice(0,4).reduce((a,l) => a + (l.hours||0), 0);
  const avgScore = logs.slice(0,4).filter(l=>l.mockScore).reduce((a,l,_,arr) => a + l.mockScore/arr.length, 0);

  // 주차별 시간 그래프용 (최근 8주)
  const chartData = logs.slice(0,8).reverse();

  return (
    <div>
      {/* 핵심 지표 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10, marginBottom:12 }}>
        <StatCard icon="⏱" label="최근 4주 총 학습" value={`${totalHours}시간`} color={C.accent} />
        <StatCard icon="📊" label="최근 4주 평균 모의" value={avgScore ? `${Math.round(avgScore)}점` : "-"} color={C.green} />
        <StatCard icon="📅" label="이번 주 기록" value={thisWeek ? `${thisWeek.hours}시간` : "미입력"} color={thisWeek ? C.teal : C.muted} />
        <StatCard icon="🗓" label="시작일로부터" value={`${daysSince(profile.startDate)}일`} color={C.amber} />
      </div>

      {/* 핵심 학습 방향 */}
      <div style={s.card}>
        <div style={s.sectionTitle}>🎯 핵심 학습 방향</div>
        <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:12, padding:14, marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#818cf8", marginBottom:4 }}>이 등급대의 핵심</div>
          <p style={{ margin:0, fontSize:14, lineHeight:1.7, color:"#c7d2fe" }}>{method.core}</p>
        </div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:4, fontWeight:700 }}>하루 권장 루틴</div>
        <p style={{ margin:0, fontSize:13, color:C.text }}>{method.weeklyGoal}</p>
      </div>

      <div style={s.card}>
        <div style={s.sectionTitle}>AI ?? ???</div>
        {analysisLoading && <p style={s.muted}>?? ????...</p>}
        {analysisError && <p style={{ ...s.muted, color: C.amber }}>{analysisError}</p>}
        {!analysisLoading && plan?.student_feedback && (
          <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:12, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:12, color:"#818cf8", fontWeight:700, marginBottom:4 }}>?? ???</div>
            <p style={{ margin:0, fontSize:13, lineHeight:1.7 }}>{plan.student_feedback}</p>
          </div>
        )}
        {!analysisLoading && plan?.current_focus && (
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:6, fontWeight:700 }}>?? ?? ? ??</div>
            <p style={{ margin:"0 0 6px", fontSize:13, color:C.text }}>{plan.current_focus.headline}</p>
            {plan.current_focus.actions?.length > 0 && (
              <ul style={{ margin:0, paddingLeft:16 }}>
                {plan.current_focus.actions.slice(0, 4).map((x, i) => <li key={i} style={{ fontSize:12, lineHeight:1.7 }}>{x}</li>)}
              </ul>
            )}
          </div>
        )}
        {!analysisLoading && plan?.period_plan?.length > 0 && (
          <div style={{ display:"grid", gap:8 }}>
            {plan.period_plan.slice(0, 3).map((p, i) => (
              <div key={i} style={{ border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:10, background:"rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#93c5fd", marginBottom:4 }}>{p.period}</div>
                <div style={{ fontSize:12, marginBottom:4 }}>{p.goal}</div>
                {p.actions?.length > 0 && (
                  <div style={{ fontSize:11, color:C.muted }}>{p.actions.slice(0, 2).join(" / ")}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!analysisLoading && plan && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={s.card}>
            <div style={s.sectionTitle}>?? ??</div>
            {plan.recommended_instructors?.slice(0, 3).map((t, i) => (
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{t.name}</div>
                <div style={{ fontSize:11, color:C.muted }}>{t.platform} ? {t.best_for}</div>
              </div>
            ))}
          </div>
          <div style={s.card}>
            <div style={s.sectionTitle}>?? ??</div>
            {plan.recommended_books?.slice(0, 4).map((b, i) => (
              <div key={i} style={{ marginBottom:8 }}>
                <div style={{ fontSize:13 }}>{b.title}</div>
                <div style={{ fontSize:11, color:C.muted }}>{b.type} ? {b.when_to_use}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 8주 학습 시간 그래프 */}
      <div style={s.card}>
        <div style={s.sectionTitle}>📈 최근 8주 학습 시간</div>
        {chartData.length === 0 ? (
          <p style={s.muted}>학습 기록을 입력하면 그래프가 생성돼요.</p>
        ) : (
          <MiniBarChart data={chartData} />
        )}
      </div>

      {/* 이번 주 vs 지난 주 */}
      {thisWeek && (
        <div style={s.card}>
          <div style={s.sectionTitle}>📋 이번 주 기록 요약</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>학습 시간</div>
              <div style={{ fontSize:22, fontWeight:800 }}>{thisWeek.hours}h
                {lastWeek && <span style={{ fontSize:12, color:thisWeek.hours>=lastWeek.hours?C.green:C.red, marginLeft:6 }}>
                  {thisWeek.hours>=lastWeek.hours?"▲":"▼"}{Math.abs(thisWeek.hours-lastWeek.hours)}h
                </span>}
              </div>
            </div>
            {thisWeek.mockScore && (
              <div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>모의고사 점수</div>
                <div style={{ fontSize:22, fontWeight:800 }}>{thisWeek.mockScore}점
                  {lastWeek?.mockScore && <span style={{ fontSize:12, color:thisWeek.mockScore>=lastWeek.mockScore?C.green:C.red, marginLeft:6 }}>
                    {thisWeek.mockScore>=lastWeek.mockScore?"▲":"▼"}{Math.abs(thisWeek.mockScore-lastWeek.mockScore)}점
                  </span>}
                </div>
              </div>
            )}
          </div>
          {thisWeek.memo && (
            <div style={{ marginTop:12, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:12 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>이번 주 메모</div>
              <p style={{ margin:0, fontSize:13, lineHeight:1.7 }}>{thisWeek.memo}</p>
            </div>
          )}
        </div>
      )}

      {!thisWeek && (
        <div style={{ ...s.card, textAlign:"center", padding:30 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>✏️</div>
          <div style={{ fontWeight:700, marginBottom:6 }}>이번 주 학습 기록이 없어요</div>
          <p style={s.muted}>학습 기록 탭에서 이번 주 공부 내용을 입력해보세요.</p>
        </div>
      )}
    </div>
  );
}

// ── 학습 기록 입력 ────────────────────────────────────────────
function LogScreen({ profile, logs, onAdd }) {
  const [hours, setHours] = useState("");
  const [tags, setTags] = useState([]);
  const [mockScore, setMockScore] = useState("");
  const [memo, setMemo] = useState("");
  const [weakPoints, setWeakPoints] = useState("");
  const [done, setDone] = useState(false);

  const thisWeekLabel = getWeekLabel(0);
  const alreadyLogged = logs[0]?.week === thisWeekLabel;

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);
  }

  async function submit() {
    if (!hours) return;
    const log = {
      week: thisWeekLabel,
      date: today(),
      hours: Number(hours),
      tags,
      mockScore: mockScore ? Number(mockScore) : null,
      memo: memo.trim(),
      weakPoints: weakPoints.trim(),
    };
    await onAdd(log);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    setHours(""); setTags([]); setMockScore(""); setMemo(""); setWeakPoints("");
  }

  return (
    <div>
      {alreadyLogged && (
        <div style={{ ...s.card, borderColor:"rgba(34,197,94,0.3)", background:"rgba(34,197,94,0.06)", marginBottom:12 }}>
          <div style={{ color:C.green, fontWeight:700, marginBottom:4 }}>✅ 이번 주 기록 완료</div>
          <p style={s.muted}>이미 이번 주 기록이 있어요. 새로 입력하면 덮어쓰여요.</p>
        </div>
      )}

      <div style={s.card}>
        <div style={s.sectionTitle}>✏️ 이번 주 학습 기록 ({thisWeekLabel})</div>

        <div style={{ marginBottom:18 }}>
          <label style={s.label}>총 학습 시간 (시간)</label>
          <input style={s.input} type="number" min="0" max="100" value={hours} onChange={e=>setHours(e.target.value)} placeholder="예: 15" />
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={s.label}>이번 주 주요 학습 내용 (복수 선택)</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {STUDY_TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)} style={{ ...s.btn, padding:"6px 14px", fontSize:12, background:tags.includes(t)?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.05)", border:`1px solid ${tags.includes(t)?"rgba(99,102,241,0.5)":C.border}`, color:tags.includes(t)?"#a5b4fc":C.muted }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={s.label}>모의고사 점수 (없으면 비워도 돼요)</label>
          <input style={s.input} type="number" min="0" max="100" value={mockScore} onChange={e=>setMockScore(e.target.value)} placeholder="예: 72" />
        </div>

        <div style={{ marginBottom:18 }}>
          <label style={s.label}>이번 주 어려웠던 점 / 취약 단원</label>
          <textarea style={s.textarea} value={weakPoints} onChange={e=>setWeakPoints(e.target.value)} placeholder="예: 미적분 합성함수 미분에서 계속 실수함, 수열 귀납적 정의 문제 막힘" />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={s.label}>이번 주 메모 / 느낀 점</label>
          <textarea style={s.textarea} value={memo} onChange={e=>setMemo(e.target.value)} placeholder="예: 백지복습 루틴 정착됨. 다음 주는 N제 시작 예정." />
        </div>

        <button onClick={submit} disabled={!hours} style={{ ...s.btn, ...s.btnPrimary, width:"100%", opacity:hours?1:0.4 }}>
          {done ? "✅ 저장 완료!" : "이번 주 기록 저장"}
        </button>
      </div>

      {/* 과거 기록 */}
      {logs.length > 0 && (
        <div style={s.card}>
          <div style={s.sectionTitle}>📜 과거 기록</div>
          {logs.slice(0,8).map((log, i) => (
            <div key={i} style={{ borderBottom:`1px solid ${C.border}`, paddingBottom:12, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontWeight:700 }}>{log.week}</span>
                <div style={{ display:"flex", gap:8 }}>
                  <span style={{ ...s.pill, background:"rgba(99,102,241,0.15)", color:"#a5b4fc" }}>{log.hours}시간</span>
                  {log.mockScore && <span style={{ ...s.pill, background:"rgba(34,197,94,0.15)", color:"#86efac" }}>{log.mockScore}점</span>}
                </div>
              </div>
              {log.tags?.length > 0 && <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:4 }}>
                {log.tags.map(t => <span key={t} style={{ fontSize:11, color:C.muted, background:"rgba(255,255,255,0.05)", padding:"2px 8px", borderRadius:999 }}>{t}</span>)}
              </div>}
              {log.weakPoints && <p style={{ margin:0, fontSize:12, color:C.muted }}>취약: {log.weakPoints}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 주간 리포트 ───────────────────────────────────────────────
function ReportScreen({ profile, logs }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(null);

  useEffect(() => {
    DB.get("last_report").then(r => { if (r) setCached(r); });
  }, []);

  async function generateReport() {
    if (logs.length === 0) return;
    setLoading(true);

    const recent = logs.slice(0, 3);
    const totalHours = recent.reduce((a,l)=>a+(l.hours||0),0);
    const avgScore = recent.filter(l=>l.mockScore).reduce((a,l,_,arr)=>a+l.mockScore/arr.length,0);
    const allWeakPoints = shortenText(recent.flatMap(l=>l.weakPoints?[l.weakPoints]:[]).join(" / "), 160);
    const allMemos = shortenText(recent.flatMap(l=>l.memo?[l.memo]:[]).join(" / "), 220);
    const key = getKey(profile.currentGrade, profile.targetGrade);
    const method = GRADE_METHODS[key];

    try {
      const reportData = await requestWeeklyReport(profile, recent, method, {
        totalHours,
        avgScore,
        allWeakPoints,
        allMemos,
      });
      setReport(reportData);
      await DB.set("last_report", reportData);
      setCached(reportData);
    } catch {
      const fallback = buildWeeklyReportFallback(profile, recent, method, {
        totalHours,
        avgScore,
        allWeakPoints,
      });
      setReport(fallback);
      await DB.set("last_report", fallback);
      setCached(fallback);
    }
    setLoading(false);
  }

  const displayReport = report || cached;

  return (
    <div>
      <div style={s.card}>
        <div style={s.sectionTitle}>📋 AI 주간 리포트</div>
        <p style={s.muted}>최근 4주 학습 기록을 AI가 분석해서 맞춤 피드백을 드려요.</p>
        {logs.length < 1 && <p style={{ color:C.amber }}>⚠️ 학습 기록이 최소 1주 이상 필요해요.</p>}
        <button onClick={generateReport} disabled={loading || logs.length===0}
          style={{ ...s.btn, ...s.btnPrimary, width:"100%", opacity:logs.length===0?0.4:1 }}>
          {loading ? <><Spinner small /> 분석 중...</> : "📊 이번 주 리포트 생성"}
        </button>
      </div>

      {displayReport && (
        <div>
          <div style={{ ...s.card, borderColor:"rgba(99,102,241,0.3)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={s.sectionTitle}>🤖 AI 분석 결과</div>
              <span style={{ fontSize:11, color:C.muted }}>{displayReport.generatedAt} 생성</span>
            </div>

            {/* 전체 평가 */}
            <div style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#818cf8", marginBottom:6 }}>📈 전체 흐름</div>
              <p style={{ margin:0, fontSize:14, lineHeight:1.75 }}>{displayReport.overall}</p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#86efac", marginBottom:8 }}>✅ 잘하고 있는 것</div>
                <ul style={{ margin:0, paddingLeft:16 }}>
                  {displayReport.strengths?.map((s_,i) => <li key={i} style={{ fontSize:13, lineHeight:1.7, color:"#d1fae5" }}>{s_}</li>)}
                </ul>
              </div>
              <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#fca5a5", marginBottom:8 }}>🔧 개선 포인트</div>
                <ul style={{ margin:0, paddingLeft:16 }}>
                  {displayReport.improvements?.map((s_,i) => <li key={i} style={{ fontSize:13, lineHeight:1.7, color:"#fee2e2" }}>{s_}</li>)}
                </ul>
              </div>
            </div>

            {/* 다음 주 계획 */}
            <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:12, padding:14, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#fcd34d", marginBottom:8 }}>📅 다음 주 실천 계획</div>
              <ol style={{ margin:0, paddingLeft:18 }}>
                {displayReport.next_week_plan?.map((p_,i) => <li key={i} style={{ fontSize:13, lineHeight:1.8 }}>{p_}</li>)}
              </ol>
            </div>

            {displayReport.caution && (
              <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:12, marginBottom:12 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#fca5a5" }}>⚠️ 주의 </span>
                <span style={{ fontSize:13 }}>{displayReport.caution}</span>
              </div>
            )}
            {displayReport.encouragement && (
              <div style={{ background:"rgba(99,102,241,0.08)", borderRadius:10, padding:12, textAlign:"center" }}>
                <span style={{ fontSize:14, color:"#c7d2fe", fontStyle:"italic" }}>💙 {displayReport.encouragement}</span>
              </div>
            )}
          </div>

          {/* 과거 리포트 안내 */}
          {cached && !report && (
            <p style={{ ...s.muted, textAlign:"center" }}>위는 마지막으로 생성된 리포트예요. 새 리포트를 생성하려면 버튼을 눌러주세요.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI 컨설팅 (1회성 심층 분석) ──────────────────────────────
function ConsultScreen({ profile, logs }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const QUICK = [
    "지금 시기에 내가 해야 할 가장 중요한 것 하나만 알려줘",
    `${profile.elective} 선택과목 어떻게 공부해야 해?`,
    "내 취약점 분석해줘",
    "목표 등급 달성 가능성 솔직하게 말해줘",
  ];

  async function ask(q) {
    const query = shortenText(q || question, 140);
    if (!query.trim()) return;
    setLoading(true); setAnswer(null);

    const key = getKey(profile.currentGrade, profile.targetGrade);
    const method = GRADE_METHODS[key];
    const recent = logs.slice(0,3);
    const summary = recent.length > 0
      ? shortenText(`최근 학습: ${recent.map(l=>`${l.week} ${l.hours}h${l.mockScore?` ${l.mockScore}점`:""}`).join(", ")}. 취약: ${recent.flatMap(l=>l.weakPoints?[l.weakPoints]:[]).join(" / ") || "없음"}`, 240)
      : "학습 기록 없음";

    try {
      const text = await requestConsultAnswer({
        profile,
        question: query,
        summary,
        methodCore: method.core,
      });
      setAnswer(text || "답변 생성에 실패했어요.");
    } catch {
      setAnswer(buildConsultFallbackAnswer(profile, query, summary, method.core));
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={s.card}>
        <div style={s.sectionTitle}>🤖 AI 맞춤 컨설팅</div>
        <p style={s.muted}>궁금한 것을 물어보세요. 학습 데이터를 바탕으로 답해드려요.</p>

        <div style={{ marginBottom:12 }}>
          <label style={s.label}>빠른 질문</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {QUICK.map((q,i) => (
              <button key={i} onClick={() => ask(q)} style={{ ...s.btn, ...s.btnGhost, fontSize:12, padding:"7px 12px" }}>{q}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={s.label}>직접 질문</label>
          <textarea style={s.textarea} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="예: 개념을 이해했는데 왜 기출에서 틀리는지 모르겠어요" />
        </div>
        <button onClick={() => ask(question)} disabled={loading || !question.trim()}
          style={{ ...s.btn, ...s.btnPrimary, width:"100%", opacity:!question.trim()?0.4:1 }}>
          {loading ? <><Spinner small /> 분석 중...</> : "질문하기"}
        </button>
      </div>

      {answer && (
        <div style={{ ...s.card, borderColor:"rgba(99,102,241,0.3)" }}>
          <div style={s.sectionTitle}>💬 AI 답변</div>
          <div style={{ fontSize:14, lineHeight:1.85, whiteSpace:"pre-wrap" }}>{answer}</div>
        </div>
      )}
    </div>
  );
}

// ── 설정 ──────────────────────────────────────────────────────
function SettingsScreen({ profile, onUpdate }) {
  const [cur, setCur] = useState(profile.currentGrade);
  const [tgt, setTgt] = useState(profile.targetGrade);
  const [elec, setElec] = useState(profile.elective);
  const [saved, setSaved] = useState(false);

  async function save() {
    await onUpdate({ ...profile, currentGrade:cur, targetGrade:tgt, elective:elec });
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  }

  return (
    <div style={s.card}>
      <div style={s.sectionTitle}>⚙️ 프로필 수정</div>
      <p style={s.muted}>등급이 변경됐거나 선택과목을 바꾸고 싶을 때 수정하세요.</p>

      <div style={{ marginBottom:18 }}>
        <label style={s.label}>현재 등급 업데이트</label>
        <div style={s.gradeGrid}>
          {Object.entries(GRADE_INFO).map(([g, info]) => (
            <button key={g} onClick={() => setCur(Number(g))} style={{ ...s.gradeBtn, background:cur===Number(g)?info.color:"rgba(255,255,255,0.05)", borderColor:cur===Number(g)?info.color:C.border, color:cur===Number(g)?"#fff":C.muted }}>
              <span style={{ fontWeight:700, fontSize:13 }}>{info.label}</span>
              <span style={{ fontSize:10, opacity:0.8 }}>{info.range}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:18 }}>
        <label style={s.label}>목표 등급</label>
        <div style={s.gradeGrid}>
          {Object.entries(GRADE_INFO).map(([g, info]) => {
            const disabled = cur && Number(g) >= cur;
            return (
              <button key={g} onClick={() => !disabled && setTgt(Number(g))} style={{ ...s.gradeBtn, background:tgt===Number(g)?info.color:"rgba(255,255,255,0.05)", borderColor:tgt===Number(g)?info.color:C.border, color:tgt===Number(g)?"#fff":disabled?"#2d3748":C.muted, opacity:disabled?0.35:1 }}>
                <span style={{ fontWeight:700, fontSize:13 }}>{info.label}</span>
                <span style={{ fontSize:10, opacity:0.8 }}>{info.range}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={s.label}>선택과목</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {ELECTIVES.map(e => (
            <button key={e} onClick={() => setElec(e)} style={{ ...s.gradeBtn, background:elec===e?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.05)", borderColor:elec===e?"rgba(99,102,241,0.6)":C.border, color:elec===e?"#c7d2fe":C.muted, padding:"12px" }}>
              <span style={{ fontWeight:700 }}>{e}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={save} style={{ ...s.btn, ...s.btnPrimary, width:"100%" }}>
        {saved ? "✅ 저장 완료!" : "변경 저장"}
      </button>
    </div>
  );
}

// ── 서브 컴포넌트들 ───────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...s.card, textAlign:"center", padding:16 }}>
      <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{label}</div>
    </div>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d=>d.hours||0), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ fontSize:10, color:C.muted }}>{d.hours}h</div>
          <div style={{ width:"100%", background:"rgba(99,102,241,0.6)", borderRadius:"4px 4px 0 0", height:`${Math.max((d.hours/max)*60, 4)}px`, transition:"height .3s" }} />
          <div style={{ fontSize:9, color:C.muted, whiteSpace:"nowrap" }}>{d.week}</div>
        </div>
      ))}
    </div>
  );
}

function Spinner({ small }) {
  const size = small ? 14 : 32;
  return <div style={{ width:size, height:size, border:`2px solid rgba(99,102,241,0.3)`, borderTop:`2px solid #6366f1`, borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block", marginRight:small?6:0 }} />;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function shortenText(value, maxLen = 200) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

async function requestAnalyzePlan(profile) {
  const res = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentGrade: Number(profile?.currentGrade),
      targetGrade: Number(profile?.targetGrade),
      electiveSubject: profile?.elective,
    }),
  }, 15000);

  const data = await res.json();
  if (!res.ok || !data?.plan) throw new Error(data?.error || "analyze api failed");
  return data;
}

function buildAnalyzeFallback(profile) {
  const key = getKey(profile?.currentGrade || 9, profile?.targetGrade || 5);
  const method = GRADE_METHODS[key] || GRADE_METHODS["7-5"];
  return {
    plan: {
      student_feedback: `${profile?.currentGrade || "??"}???? ${profile?.targetGrade || "??"}???? ????? ????? ?? ??? ?????.`,
      current_focus: {
        headline: "?? ?? + ?? ?? ?? ??",
        actions: [
          "??? ? ? 15~20? ?? ??",
          "?? ?? ??? ?? ?? 10~20?? ??",
          "??? ??/??/???? ??? ???",
        ],
      },
      period_plan: [
        { period: "3~6? ?", goal: "?? ??? ?? ?? ??", actions: ["??-?? ?? ??", "?? ?? ?? ??"] },
        { period: "6~9?", goal: "?? ??? ??? ??", actions: ["? 2~3? ?? ??", "?? ?? ?? ??"] },
        { period: "9?~?? ?", goal: "?? ???? ?? ???", actions: ["? ?? ?? ???", "?? ?? ?? ??"] },
      ],
      recommended_instructors: [
        { name: "???", platform: "?????", best_for: "????~???" },
        { name: "???", platform: "???", best_for: "??~???" },
      ],
      recommended_books: [
        { title: "?????", type: "??", when_to_use: "6~9?" },
        { title: "EBS ????", type: "??", when_to_use: "6~9?" },
      ],
      final_tip: method?.weeklyGoal || "?? ??? ?????.",
    },
    meta: { usedModel: false, model: null },
  };
}
async function requestWeeklyReport(profile, recent, method, metrics) {
  const res = await fetchWithTimeout(`${API_BASE}/api/tracker/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile,
      logs: recent,
      method,
      metrics,
    }),
  }, 12000);
  const data = await res.json();
  if (!res.ok || !data?.report) throw new Error(data?.error || "report api failed");
  return data.report;
}

async function requestConsultAnswer({ profile, question, summary, methodCore }) {
  const res = await fetchWithTimeout(`${API_BASE}/api/tracker/consult`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile,
      question,
      summary,
      methodCore,
    }),
  }, 12000);
  const data = await res.json();
  if (!res.ok || !data?.answer) throw new Error(data?.error || "consult api failed");
  return data.answer;
}

function buildWeeklyReportFallback(profile, recent, method, metrics) {
  const avg = metrics.avgScore ? `${Math.round(metrics.avgScore)}점` : "미측정";
  const thisWeek = recent[0]?.hours || 0;
  const prevWeek = recent[1]?.hours || 0;
  const diff = thisWeek - prevWeek;
  const trend = diff > 0 ? `지난주보다 +${diff}시간 증가` : diff < 0 ? `지난주보다 ${diff}시간 감소` : "주간 학습시간이 비슷하게 유지";

  return {
    overall: `최근 4주 총 ${metrics.totalHours}시간 학습했고 평균 모의 점수는 ${avg}예요. ${trend} 흐름이 보이며, ${method.focus}에 계속 집중하면 목표 등급 접근 가능성이 높아요.`,
    strengths: [
      recent.length >= 3 ? "기록을 3주 이상 유지하며 학습 루틴을 지키고 있어요." : "학습 기록을 남기기 시작한 점이 매우 좋아요.",
      metrics.totalHours >= 8 ? "주간 학습량이 실전 준비에 필요한 최소량을 확보하고 있어요." : "부담 없는 범위에서 꾸준히 학습을 이어가고 있어요.",
    ],
    improvements: [
      "취약 단원을 매주 1~2개로 좁혀 집중 보완하세요.",
      "오답 복기 시간을 고정(주 3회 이상)해 같은 실수를 줄이세요.",
    ],
    next_week_plan: [
      "월·수·금: 개념 출력 + 쉬운 기출 연결 90분 루틴",
      "화·목: 취약 단원 집중 보완 + 오답 재풀이",
      "주말: 1회 실전 세트 + 40분 복기 작성",
    ],
    caution: "강의만 듣고 문제 적용을 미루면 점수 정체가 길어질 수 있어요.",
    encouragement: `${profile.name || "학생"}님은 이미 루틴을 만들고 있어요. 다음 주는 '취약 단원 축소 + 오답 복기 고정'만 지켜도 체감이 분명히 올 거예요.`,
    generatedAt: today(),
    weekRange: `${getWeekLabel(-3)} ~ ${getWeekLabel(0)}`,
  };
}

function buildConsultFallbackAnswer(profile, question, summary, methodCore) {
  return [
    `${profile.currentGrade}등급에서 ${profile.targetGrade}등급으로 가려면 핵심은 "${methodCore}" 입니다.`,
    `현재 상황 요약: ${summary}`,
    `질문 "${question}"에 대한 실행 답변: 오늘부터 1) 개념 출력 20분 2) 기출 적용 40분 3) 오답 복기 20분을 고정하세요. 일주일만 유지해도 학습 밀도가 달라집니다.`,
    "다음 점검 기준: 이번 주에 '같은 유형 오답 재발 횟수'가 줄었는지 확인해보세요.",
  ].join("\n\n");
}

// ── 헬퍼 함수들 ──────────────────────────────────────────────
function calcStreak(logs) {
  if (!logs.length) return 0;
  let streak = 0;
  const thisWeek = getWeekLabel(0);
  for (let i = 0; i < logs.length; i++) {
    const expected = getWeekLabel(-i);
    if (logs[i]?.week === expected || (i===0 && logs[0]?.week === thisWeek)) streak++;
    else break;
  }
  return streak;
}

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

// CSS 애니메이션
const st = document.createElement("style");
st.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
document.head.appendChild(st);
