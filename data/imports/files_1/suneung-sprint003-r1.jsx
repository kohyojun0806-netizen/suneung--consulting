import { useState, useEffect, useCallback, useRef } from "react";

// ─── STORAGE ────────────────────────────────────────────────────
const DB = {
  async get(k) {
    try {
      if (window?.storage?.get) { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; }
      const raw = localStorage.getItem(`sn3:${k}`); return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  async set(k, v) {
    try {
      if (window?.storage?.set) { await window.storage.set(k, JSON.stringify(v)); return; }
      localStorage.setItem(`sn3:${k}`, JSON.stringify(v));
    } catch {}
  },
};

// ─── KNOWLEDGE BASE (정제 데이터) ────────────────────────────────
const KB = {
  "9-7": {
    principle: "출력 없는 입력은 실력이 되지 않는다",
    core: "강의를 듣는 것으로 공부를 끝내면 안 된다. 개념을 말과 글로 꺼낼 수 없으면 문제에 쓸 수 없다. 백지 복습과 쉬운 기출 즉시 적용이 이 등급대 탈출의 핵심이다.",
    communityEvidence: "\"개념 강의 10번 봐도 안 되던 게 백지에 한 번 써보고 나서 바뀌었어요\" — 오르비 9→6등급 후기",
    steps: [
      { title: "백지 복습", detail: "수업 직후 15~20분, 책 덮고 핵심 정의·공식을 직접 작성" },
      { title: "기출 즉시 적용", detail: "개념 강의 직후 쉬운 기출 10~20문항으로 당일 적용" },
      { title: "오답 분류", detail: "개념 오류 / 해석 실수 / 계산 실수로 분류해 당일 재풀이" },
    ],
    periods: {
      "3_6": { label:"3~6월", goal:"개념 공백 제거 + 출력 루틴 정착", actions:["단원별 핵심 공식 백지에 직접 작성 (15~20분/일)","쉬운 기출 10~20문항으로 즉시 적용","오답 당일 재풀이 루틴 고정"], check:"개념 노트 없이 핵심 공식 설명 가능 · 기초 기출 정답률 60%+" },
      "6_9": { label:"6~9월", goal:"수I·수II 기본 유형 + 시간 관리", actions:["수I·수II 기본 유형 단원별 3개 이상","문항당 2~3분 시간 제한 도입","틀린 문제 3일 안에 재풀이 루틴"], check:"기본 유형 정답률 70%+ · 시간 초과 문항 수 감소" },
      "9S": { label:"9모~수능", goal:"실전 감각 + 실수 패턴 제거", actions:["기출 기본 문항 정확도 안정화","실모 주 1~2회 입문","반복 실수 패턴 3개 이하로 축소"], check:"모의고사 40점대 안정 · 실수 패턴 3개 이하" },
    },
    daily: "하루 2시간 · 개념출력 40% + 문제적용 40% + 오답복기 20%",
    caution: "강의 시청만으로 공부를 끝내지 마세요. 출력이 없는 입력은 시간 낭비입니다.",
  },
  "7-5": {
    principle: "개념 기간에 기한을 두고 기출로 넘어가야 한다",
    core: "개념을 완벽히 하려다 기출 시작이 늦어지는 게 이 등급대의 가장 흔한 실패 패턴이다. 개념 기간은 4~8주로 제한하고, 기출은 답 확인이 아니라 풀이 과정을 재현하는 복기로 공부해야 한다.",
    communityEvidence: "\"개념 3회독 하다가 N제 시작도 못 하고 수능 봤어요. 개념은 기출 하면서 보완하세요\" — 수만휘 7→5등급 경험담",
    steps: [
      { title: "개념 기간 제한", detail: "공통(수I·수II) 개념 정리는 4~8주로 끝내고 기출로 이동" },
      { title: "기출 사고 재현", detail: "답 확인이 아닌 풀이 과정과 사고 흐름을 재현하는 복기" },
      { title: "선택과목 취약 유형", detail: "확통·미적·기하 중 선택 과목의 취약 유형 집중" },
    ],
    periods: {
      "3_6": { label:"3~6월", goal:"공통 개념 마무리 + 기출 사고 흐름 형성", actions:["공통 개념 4~8주 기간 제한 후 기출로 이동","쉬운 기출 유형 단원별 분류 (풀이 재현)","선택과목 취약 유형 집중"], check:"공통 개념 1차 완료 · 기출 기본형 정답률 65%+" },
      "6_9": { label:"6~9월", goal:"중난도 기출 확장 + 실전 세트", actions:["중난도 기출 비중 확대 (준킬러 이하)","주 2~3회 실전 세트 — 시간 배분 고정","오답 복기: 틀린 이유를 유형별로 정리"], check:"중난도 기출 70%+ · 실전 세트 시간 초과 감소" },
      "9S": { label:"9모~수능", goal:"실모 누적 + 반복 실수 제거", actions:["실모 주 2~3회 누적","반복 실수 패턴 제거 — 오답 노트 기반","파이널 복습 노트 압축 (핵심 1페이지)"], check:"모의고사 60점대 안정 · 반복 실수 2개 이하" },
    },
    daily: "하루 2.5시간 · 개념·기출 50% + 유형풀이 30% + 오답복기 20%",
    caution: "개념 완벽을 추구하다 기출 시작이 늦어지는 패턴을 조심하세요.",
  },
  "5-3": {
    principle: "계산보다 조건 해석이 먼저다",
    core: "준킬러에서 계산을 먼저 시작하는 순간 시간이 무너진다. 조건·목표·제약을 먼저 정리하고 풀이 경로 2~3개를 비교한 뒤 계산을 시작하는 시나리오 매핑 습관이 핵심이다.",
    communityEvidence: "\"준킬러를 계산부터 시작했더니 시간이 날아갔어요. 조건 먼저 정리하고 풀이 루트 고른 다음에 계산했더니 속도가 붙었습니다\" — 오르비 5→2등급 후기",
    steps: [
      { title: "시나리오 매핑", detail: "조건 구조화 → 풀이 경로 선택 → 계산 순서 고정" },
      { title: "준킬러 3회 오답", detail: "준킬러 오답은 반드시 3회 반복해야 끊인다" },
      { title: "검산 루틴", detail: "마지막 5분은 검산 전용으로 고정" },
    ],
    periods: {
      "3_6": { label:"3~6월", goal:"준킬러 기본형 정리 + 선택과목 빈출 유형", actions:["준킬러: 조건 구조화 → 경로 선택 → 계산 순서 고정","선택과목 빈출 유형 완성","복기 템플릿 고정 (조건·경로·오답 기록)"], check:"준킬러 기본형 자력 풀이 가능 · 선택과목 빈출 75%+" },
      "6_9": { label:"6~9월", goal:"중난도 N제 + 실전 시간 관리", actions:["중난도 N제 하루 15~20문항","실모 문항 회수 규칙 훈련 (막히면 넘기기)","검산 루틴 도입 (마지막 5분 전용)"], check:"중난도 N제 75%+ · 실모 시간 관리 안정" },
      "9S": { label:"9모~수능", goal:"실모 안정화 + 킬러 접근 패턴 교정", actions:["실모 주 3~4회 — 점수 변동폭 최소화","킬러 접근 실패 패턴 교정","시험장 풀이 순서 전략 확정"], check:"모의고사 70점대 안정 · 킬러 접근 시도율 상승" },
    },
    daily: "하루 3시간 · 기출·유형 40% + N제풀이 40% + 오답복기 20%",
    caution: "준킬러를 계산부터 시작하는 습관이 남아있으면 3등급 진입이 어렵습니다.",
  },
  "3-1": {
    principle: "새 문제량보다 실전 루틴 고정과 실수 제거가 먼저다",
    core: "상위권의 점수 차이는 문제 풀이량이 아니라 실전 루틴 고정과 반복 실수 제거에서 결정된다. 킬러 문항은 최소 40분 독립 접근이 원칙이고, 실모 오답은 개념·해석·계산·시간 실수로 분류해 재발 방지 규칙을 만들어야 한다.",
    communityEvidence: "\"실모 매일 풀었는데 점수가 안 올랐어요. 풀고 나서 오답 원인 분류를 안 했던 게 문제였습니다\" — 오르비 3→1등급 후기",
    steps: [
      { title: "킬러 40분 원칙", detail: "킬러 문항은 최소 40분 자력 접근 — 해설 보기 전 완전 고민" },
      { title: "실수 분류", detail: "실모 오답: 개념/해석/계산/시간 실수로 분류 후 재발 방지 규칙" },
      { title: "루틴 고정", detail: "시험장에서 사용할 풀이 순서를 모의고사마다 동일하게 반복" },
    ],
    periods: {
      "3_6": { label:"3~6월", goal:"준킬러·킬러 접근법 표준화", actions:["킬러 문항 최소 40분 독립 접근 정착","기출 고난도 풀이 논리 재정리","계산 정확도 훈련 — 매일 30분 루틴화"], check:"킬러 40분 유지 · 준킬러 정답률 85%+" },
      "6_9": { label:"6~9월", goal:"실전 세트 최적화 + 킬러 기댓값 전략", actions:["실전 세트 주 3~4회 — 시간 운영 최적화","킬러: 완주보다 점수 기댓값 중심 접근","반복 계산 실수 패턴 집중 보정"], check:"실전 세트 95점+ 안정 · 킬러 정답률 40%+" },
      "9S": { label:"9모~수능", goal:"실수 제로화 + EBS 연계 최종 확인", actions:["새 교재 확장 중단 — 기존 자료 완성도 극대화","EBS·기출 연계 포인트 최종 점검","시험 당일 루틴 확정 (풀이 순서·검산 타이밍)"], check:"모의고사 95점+ 안정 · 반복 실수 제로" },
    },
    daily: "하루 4시간 · 킬러접근 40% + 실모풀이 30% + 오답정밀복기 30%",
    caution: "수능 직전 새 문제를 욕심내지 마세요. 아는 것을 실수 없이 푸는 것이 핵심입니다.",
  },
};

const INSTRUCTORS = [
  { name:"현우진", platform:"메가스터디", onlineOffline:"인강", fit:["5-3","3-1"], subjects:["공통","미적분","기하"],
    path:["시발점","뉴런","수분감","드릴","킬링캠프"],
    review:"기출 분석 구조가 촘촘하고 밀도 높다는 후기 다수. 기초 부족 시 뉴런 전 시발점 선수강 권장.",
    bestFor:"중상위권 → 준킬러/킬러 전환 학생", tip:"뉴런+수분감 병행 후 드릴 심화, 9모 이후 킬링캠프" },
  { name:"정승제", platform:"이투스", onlineOffline:"인강", fit:["9-7","7-5"], subjects:["공통","확률과통계"],
    path:["개념때려잡기","담금질","기출끝","N제/모의"],
    review:"노베이스~중하위권 개념 공백 해소에 효과적. 반복 복습 루틴과 병행 시 체감 큼.",
    bestFor:"기초 약하고 개념 정리가 먼저 필요한 학생", tip:"개때잡으로 틀 잡은 후 기출끝으로 빠르게 전환" },
  { name:"이미지", platform:"대성마이맥", onlineOffline:"인강", fit:["7-5","5-3"], subjects:["공통","확률과통계","미적분"],
    path:["세젤쉬","미친개념","미친기분","N티켓"],
    review:"개념을 빠르게 잡고 문제로 넘기기 좋다는 평. 강의 속도가 빨라 예복습 필요.",
    bestFor:"개념은 알지만 문제 적용 속도가 느린 학생", tip:"개념 수강 후 같은 주차에 기출·유형 세트 즉시 적용" },
  { name:"시대인재 수학스쿨", platform:"시대인재 대치", onlineOffline:"현강", fit:["7-5","5-3","3-1"], subjects:["공통","확률과통계","미적분","기하"],
    path:["정규 단과반","취약 단원 특강","서바이벌/파이널"],
    review:"자체 모의고사·파이널 자료 퀄리티 높다는 평. 경쟁 환경 속 실전 감각 단기 향상.",
    bestFor:"체계적 관리와 파이널 자료가 필요한 학생", tip:"정규 단과반 후 파이널 서바이벌 연계" },
];

const BOOKS = [
  { title:"개념원리 수학I·II", type:"개념서", fit:["9-7","7-5"], diff:"하~중", why:"개념 기초 완성", when:"3~5월 개념 초반" },
  { title:"RPM 수학I·II", type:"유형서", fit:["9-7","7-5"], diff:"중", why:"유형 반복 훈련", when:"개념 이후" },
  { title:"자이스토리 수학I·II", type:"기출서", fit:["7-5","5-3","3-1"], diff:"중~상", why:"기출 유형 분석·반복", when:"5~8월 기출 단계" },
  { title:"마더텅 수능기출문제집", type:"기출서", fit:["7-5","5-3","3-1"], diff:"중~상", why:"연도별 기출 풀이", when:"기출 학습 단계" },
  { title:"EBS 수능특강 수학", type:"연계교재 ★", fit:["9-7","7-5","5-3","3-1"], diff:"중", why:"연계율 70% 필수 대비", when:"3월~수능 연간 병행" },
  { title:"EBS 수능완성 수학", type:"연계교재", fit:["7-5","5-3","3-1"], diff:"중~상", why:"실전 연계 완성", when:"6월 이후" },
  { title:"뉴런 수학I·II", type:"심화개념", fit:["5-3","3-1"], diff:"상", why:"개념 심화+실전 연결", when:"4~7월 심화 단계" },
  { title:"수분감", type:"기출서", fit:["5-3","3-1"], diff:"상", why:"고난도 기출 사고 흐름 분석", when:"5~8월 기출 심화" },
  { title:"드릴", type:"N제", fit:["3-1"], diff:"상", why:"킬러 수준 반복 훈련", when:"7~9월 고난도 양치기" },
  { title:"미적분 기출/N제 세트", type:"선택과목", fit:["7-5","5-3","3-1"], diff:"상", why:"미적분 심화 완성", when:"선택과목 집중 단계", subj:"미적분" },
  { title:"확통 기출/N제 세트", type:"선택과목", fit:["7-5","5-3","3-1"], diff:"중~상", why:"확통 기출 완성", when:"선택과목 집중 단계", subj:"확률과통계" },
  { title:"기하 기출/N제 세트", type:"선택과목", fit:["7-5","5-3","3-1"], diff:"상", why:"기하 심화 완성", when:"선택과목 집중 단계", subj:"기하" },
];

const GI = {
  1:{l:"1등급",r:"96~100",c:"#EF4444"},2:{l:"2등급",r:"89~95",c:"#F97316"},
  3:{l:"3등급",r:"77~88",c:"#F59E0B"},4:{l:"4등급",r:"60~76",c:"#EAB308"},
  5:{l:"5등급",r:"40~59",c:"#22C55E"},6:{l:"6등급",r:"23~39",c:"#14B8A6"},
  7:{l:"7등급",r:"12~22",c:"#3B82F6"},8:{l:"8등급",r:"4~11",c:"#64748B"},
  9:{l:"9등급",r:"3이하",c:"#475569"},
};
const ELECTIVES = ["확률과통계","미적분","기하"];
const STUDY_TAGS = ["개념 강의","백지복습","기출 풀이","N제","실모","오답 분석","선택과목","EBS"];

function ck(c,t){ if(c>=8&&t>=6)return"9-7"; if(c>=6&&t>=4)return"7-5"; if(c>=4&&t>=2)return"5-3"; return"3-1"; }
function getInst(key,elec){ return INSTRUCTORS.filter(i=>i.fit.includes(key)&&(i.subjects.includes("공통")||i.subjects.includes(elec))); }
function getBooks(key,elec){ return BOOKS.filter(b=>b.fit.includes(key)&&(!b.subj||b.subj===elec)); }
function wl(n=0){ const d=new Date(); d.setDate(d.getDate()-d.getDay()+1+n*7); return`${d.getMonth()+1}/${d.getDate()}주`; }
function tod(){ return new Date().toISOString().slice(0,10); }
function daysSince(s){ return Math.floor((Date.now()-new Date(s))/86400000)||0; }
function streak(logs){ let n=0; for(let i=0;i<logs.length;i++){ if(logs[i]?.week===wl(-i))n++; else break; } return n; }

// ─── DESIGN TOKENS (시대인재N 스타일) ────────────────────────────
const V = {
  bg:"#09090B", s0:"#0F0F11", s1:"#141416", s2:"#1A1A1E",
  b0:"rgba(255,255,255,0.06)", b1:"rgba(255,255,255,0.12)", b2:"rgba(255,255,255,0.2)",
  t0:"#FAFAFA", t1:"#A1A1AA", t2:"#52525B", t3:"#3F3F46",
  red:"#EF4444", redA:"rgba(239,68,68,0.1)", redB:"rgba(239,68,68,0.25)",
  gold:"#D4A853", goldA:"rgba(212,168,83,0.1)", goldB:"rgba(212,168,83,0.25)",
  blue:"#3B82F6",
};

// 글로벌 CSS 주입
if (!document.getElementById("snN-css")) {
  const el = document.createElement("style");
  el.id = "snN-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    :root { color-scheme: dark; }
    body { margin:0; background:${V.bg}; font-family:'Noto Sans KR',sans-serif; -webkit-font-smoothing:antialiased; }
    ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:${V.t3}; border-radius:2px; }
    @keyframes snFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes snSpin { to{transform:rotate(360deg)} }
    @keyframes snPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .sn-fade { animation:snFade 0.35s ease both; }
    .sn-hover-card { transition:border-color 0.2s,transform 0.2s; }
    .sn-hover-card:hover { border-color:${V.b2}!important; transform:translateY(-1px); }
    .sn-btn-hover { transition:opacity 0.15s,transform 0.15s; }
    .sn-btn-hover:hover { opacity:0.88; transform:translateY(-1px); }
    .sn-tab-hover { transition:color 0.15s; }
    .sn-tab-hover:hover:not(.active) { color:${V.t0}!important; }
    .sn-grade-hover { transition:all 0.15s; }
    .sn-grade-hover:hover:not(:disabled) { transform:translateY(-2px); border-color:${V.b2}!important; }
    .sn-tag-hover { transition:all 0.15s; }
    .sn-tag-hover:hover { border-color:${V.red}!important; color:${V.red}!important; }
    input:focus, textarea:focus { outline:none; border-color:${V.b2}!important; }
    input::placeholder, textarea::placeholder { color:${V.t3}; }
  `;
  document.head.appendChild(el);
}

// ─── ROOT ────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("loading");
  const [profile, setProfile] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("home");

  useEffect(() => {
    (async () => {
      const p = await DB.get("profile"), l = await DB.get("logs") || [];
      if (p) { setProfile(p); setLogs(l); setScreen("main"); } else setScreen("setup");
    })();
  }, []);

  const saveProfile = useCallback(async p => { await DB.set("profile",p); setProfile(p); setScreen("main"); setTab("home"); }, []);
  const addLog = useCallback(async log => { const n=[log,...logs].slice(0,52); await DB.set("logs",n); setLogs(n); }, [logs]);
  const updateProfile = useCallback(async p => { await DB.set("profile",p); setProfile(p); }, []);

  if (screen==="loading") return <Loader />;
  if (screen==="setup") return <SetupScreen onSave={saveProfile} />;
  return <MainApp profile={profile} logs={logs} tab={tab} setTab={setTab} addLog={addLog} updateProfile={updateProfile} />;
}

function Loader() {
  return <div style={{minHeight:"100vh",background:V.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:28,height:28,border:`2px solid ${V.b0}`,borderTop:`2px solid ${V.red}`,borderRadius:"50%",animation:"snSpin 0.8s linear infinite"}} />
  </div>;
}

// ─── SETUP ───────────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [name,setName]=useState(""); const [cur,setCur]=useState(null);
  const [tgt,setTgt]=useState(null); const [elec,setElec]=useState("미적분"); const [err,setErr]=useState("");

  function submit(){
    if(!name.trim()){setErr("이름을 입력해주세요.");return;}
    if(!cur||!tgt){setErr("등급을 선택해주세요.");return;}
    if(tgt>=cur){setErr("목표 등급은 현재 등급보다 높아야 합니다.");return;}
    onSave({name:name.trim(),currentGrade:cur,targetGrade:tgt,elective:elec,startDate:tod()});
  }

  return (
    <div style={{minHeight:"100vh",background:V.bg,display:"flex"}}>
      {/* 좌측 브랜드 패널 */}
      <div style={{width:"40%",minWidth:300,background:V.s0,borderRight:`1px solid ${V.b0}`,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"48px 40px"}}>
        <div>
          <div style={{fontWeight:900,fontSize:13,letterSpacing:"0.14em",color:V.red,marginBottom:48}}>SUNEUNG<span style={{color:V.t0}}>N</span></div>
          <h1 style={{margin:"0 0 16px",fontSize:"clamp(28px,3vw,42px)",fontWeight:900,lineHeight:1.15,letterSpacing:"-0.02em"}}>
            수능 수학<br/>학습 코치
          </h1>
          <p style={{color:V.t1,fontSize:14,lineHeight:1.8,margin:"0 0 40px"}}>
            현재 등급에서 목표 등급까지.<br/>
            실제 성과를 이룬 표본들의 데이터를 기반으로<br/>
            맞춤형 학습 전략을 제공합니다.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {["오르비·수만휘·포만한 커뮤니티 실제 후기 기반","강사 OT·커리큘럼·수강 후기 분석","시기별 (3~6모 / 6~9모 / 9모~수능) 맞춤 계획","주간 누적 기록 + AI 코치"].map((f,i)=>
              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:5,height:5,background:V.red,borderRadius:"50%",flexShrink:0}} />
                <span style={{fontSize:13,color:V.t1}}>{f}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{fontSize:11,color:V.t2}}>© 2026 SUNEUNG N — 수능 정시 학습 컨설팅</div>
      </div>

      {/* 우측 입력 */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <div className="sn-fade" style={{width:"100%",maxWidth:480}}>
          <h2 style={{margin:"0 0 32px",fontSize:22,fontWeight:800}}>학습 프로필 설정</h2>

          <FLabel label="이름 (닉네임)">
            <FInput value={name} onChange={e=>setName(e.target.value)} placeholder="예: 김수능" />
          </FLabel>

          <FLabel label="현재 등급">
            <GGrid selected={cur} onSelect={setCur} />
          </FLabel>

          <FLabel label="목표 등급">
            <GGrid selected={tgt} onSelect={setTgt} disabledFrom={cur} />
          </FLabel>

          <FLabel label="선택과목">
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {ELECTIVES.map(e=>(
                <button key={e} onClick={()=>setElec(e)} className="sn-grade-hover" style={{border:`1px solid ${elec===e?V.red:V.b0}`,borderRadius:8,padding:12,background:elec===e?V.redA:V.s1,color:elec===e?V.t0:V.t1,cursor:"pointer",fontWeight:elec===e?700:400,fontSize:14,fontFamily:"inherit"}}>
                  {e}
                </button>
              ))}
            </div>
          </FLabel>

          {err && <p style={{color:V.red,fontSize:13,margin:"0 0 16px"}}>{err}</p>}
          <button onClick={submit} className="sn-btn-hover" style={{width:"100%",padding:"14px",background:V.red,color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.01em"}}>
            컨설팅 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
function MainApp({ profile, logs, tab, setTab, addLog, updateProfile }) {
  const TABS = [["home","홈"],["plan","학습 계획"],["log","기록"],["report","주간 리포트"],["coach","AI 코치"],["settings","설정"]];
  const key = ck(profile.currentGrade, profile.targetGrade);

  return (
    <div style={{minHeight:"100vh",background:V.bg,color:V.t0}}>
      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,height:52,background:"rgba(9,9,11,0.9)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${V.b0}`,display:"flex",alignItems:"center"}}>
        <div style={{maxWidth:1100,width:"100%",margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",gap:0}}>
          <div style={{fontWeight:900,fontSize:13,letterSpacing:"0.14em",color:V.t0,marginRight:40}}>
            SUNEUNG<span style={{color:V.red}}>N</span>
          </div>
          <div style={{display:"flex",gap:0,flex:1}}>
            {TABS.map(([id,label])=>(
              <button key={id} className={`sn-tab-hover${tab===id?" active":""}`} onClick={()=>setTab(id)} style={{
                background:"none",border:"none",borderBottom:`2px solid ${tab===id?V.red:"transparent"}`,
                padding:"15px 14px 13px",cursor:"pointer",fontSize:12,fontWeight:tab===id?700:400,
                color:tab===id?V.t0:V.t1,fontFamily:"inherit",letterSpacing:"0.01em",
              }}>{label}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:V.t2,fontFamily:"'DM Mono',monospace"}}>{profile.name}</span>
            <div style={{width:1,height:14,background:V.b1}} />
            <span style={{fontSize:11,color:GI[profile.currentGrade]?.c,fontFamily:"'DM Mono',monospace"}}>{GI[profile.currentGrade]?.l}</span>
            <span style={{fontSize:11,color:V.t3}}>→</span>
            <span style={{fontSize:11,color:GI[profile.targetGrade]?.c,fontFamily:"'DM Mono',monospace"}}>{GI[profile.targetGrade]?.l}</span>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"72px 24px 80px"}}>
        {tab==="home" && <HomeTab profile={profile} logs={logs} setTab={setTab} kkey={key} />}
        {tab==="plan" && <PlanTab profile={profile} kkey={key} />}
        {tab==="log" && <LogTab profile={profile} logs={logs} onAdd={addLog} />}
        {tab==="report" && <ReportTab profile={profile} logs={logs} kkey={key} />}
        {tab==="coach" && <CoachTab profile={profile} logs={logs} kkey={key} />}
        {tab==="settings" && <SettingsTab profile={profile} onUpdate={updateProfile} />}
      </div>
    </div>
  );
}

// ─── HOME TAB ────────────────────────────────────────────────────
function HomeTab({ profile, logs, setTab, kkey }) {
  const kb = KB[kkey];
  const str = streak(logs);
  const recent4 = logs.slice(0,4);
  const totalH = recent4.reduce((a,l)=>a+(l.hours||0),0);
  const scores = recent4.filter(l=>l.mockScore).map(l=>l.mockScore);
  const avgS = scores.length ? Math.round(scores.reduce((a,b)=>a+b)/scores.length) : null;
  const thisWeek = logs[0];
  const lastWeek = logs[1];

  return (
    <div className="sn-fade">
      {/* 히어로 */}
      <div style={{marginBottom:40,paddingBottom:32,borderBottom:`1px solid ${V.b0}`}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.14em",color:V.red,marginBottom:12}}>DASHBOARD</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16}}>
          <div>
            <h1 style={{margin:"0 0 10px",fontSize:"clamp(24px,3.5vw,38px)",fontWeight:900,letterSpacing:"-0.02em",lineHeight:1.2}}>
              {profile.name}<span style={{color:V.t1,fontWeight:300}}>의 학습 현황</span>
            </h1>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <GBadge grade={profile.currentGrade} />
              <span style={{color:V.t3,fontSize:13}}>→</span>
              <GBadge grade={profile.targetGrade} />
              <div style={{width:1,height:14,background:V.b1}} />
              <span style={{fontSize:12,color:V.t1,fontFamily:"'DM Mono',monospace"}}>{profile.elective}</span>
              <div style={{width:1,height:14,background:V.b1}} />
              <span style={{fontSize:12,color:V.t2,fontFamily:"'DM Mono',monospace"}}>Day {daysSince(profile.startDate)}</span>
            </div>
          </div>
          {!thisWeek && (
            <button onClick={()=>setTab("log")} className="sn-btn-hover" style={{background:V.red,color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              이번 주 기록 입력 →
            </button>
          )}
        </div>
      </div>

      {/* KPI 카드 행 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
        <KpiCard label="연속 기록" value={str>0?`${str}주`:"–"} sub="streak" accent={str>2?V.gold:null} />
        <KpiCard label="최근 4주 학습" value={`${totalH}h`} sub="total hours" />
        <KpiCard label="평균 모의" value={avgS?`${avgS}점`:"–"} sub="recent avg" accent={avgS>=80?V.gold:null} />
        <KpiCard label="이번 주" value={thisWeek?`${thisWeek.hours}h`:"미입력"} sub="this week" accent={thisWeek?V.red:null} />
      </div>

      {/* 2열 그리드 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {/* 핵심 원칙 */}
        <Card>
          <CLabel>CORE PRINCIPLE</CLabel>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:V.red,marginBottom:10,lineHeight:1.5}}>
            "{kb.principle}"
          </div>
          <p style={{color:V.t1,fontSize:13,lineHeight:1.8,margin:"0 0 14px"}}>{kb.core}</p>
          <div style={{borderTop:`1px solid ${V.b0}`,paddingTop:12,fontSize:11,color:V.t2,fontStyle:"italic",lineHeight:1.6}}>{kb.communityEvidence}</div>
        </Card>

        {/* 이번 주 현황 */}
        <Card>
          <CLabel>THIS WEEK · {wl(0)}</CLabel>
          {thisWeek ? (
            <div>
              <div style={{display:"flex",gap:24,marginBottom:14}}>
                <div>
                  <div style={{fontSize:36,fontWeight:900,letterSpacing:"-0.02em",lineHeight:1}}>{thisWeek.hours}</div>
                  <div style={{fontSize:11,color:V.t2,marginTop:3}}>학습 시간 (h)</div>
                </div>
                {thisWeek.mockScore && <div>
                  <div style={{fontSize:36,fontWeight:900,color:V.gold,letterSpacing:"-0.02em",lineHeight:1}}>{thisWeek.mockScore}</div>
                  <div style={{fontSize:11,color:V.t2,marginTop:3}}>모의 점수</div>
                </div>}
                {lastWeek && <div style={{alignSelf:"flex-end",marginLeft:"auto"}}>
                  <div style={{fontSize:11,color:V.t2,marginBottom:4}}>전주 대비</div>
                  <div style={{fontSize:14,fontWeight:700,color:thisWeek.hours>=lastWeek.hours?V.gold:V.red}}>
                    {thisWeek.hours>=lastWeek.hours?"+":""}{thisWeek.hours-lastWeek.hours}h
                  </div>
                </div>}
              </div>
              {thisWeek.tags?.length>0 && <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>{thisWeek.tags.map(t=><Chip key={t}>{t}</Chip>)}</div>}
              {thisWeek.weakPoints && <div style={{fontSize:12,color:V.t2,borderTop:`1px solid ${V.b0}`,paddingTop:10}}>취약: {thisWeek.weakPoints}</div>}
            </div>
          ) : (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 0",gap:12}}>
              <div style={{fontSize:28,opacity:0.3}}>📝</div>
              <p style={{color:V.t2,fontSize:13,margin:0,textAlign:"center"}}>이번 주 기록이 없어요</p>
            </div>
          )}
        </Card>
      </div>

      {/* 최근 8주 차트 + 학습 단계 */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <Card>
          <CLabel>WEEKLY HOURS — 최근 8주</CLabel>
          {logs.length>0 ? <BarChart data={logs.slice(0,8).reverse()} /> : <p style={{color:V.t2,fontSize:13,margin:0}}>학습 기록을 입력하면 그래프가 생성됩니다.</p>}
        </Card>
        <Card>
          <CLabel>하루 권장 루틴</CLabel>
          <p style={{color:V.t0,fontSize:13,fontWeight:600,lineHeight:1.6,margin:"0 0 12px"}}>{kb.daily}</p>
          <div style={{borderTop:`1px solid ${V.b0}`,paddingTop:12}}>
            {kb.steps.map((st,i)=>(
              <div key={i} style={{marginBottom:i<kb.steps.length-1?10:0}}>
                <div style={{fontSize:11,fontWeight:700,color:V.red,marginBottom:2}}>STEP {i+1} · {st.title}</div>
                <div style={{fontSize:12,color:V.t1,lineHeight:1.6}}>{st.detail}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PLAN TAB ────────────────────────────────────────────────────
function PlanTab({ profile, kkey }) {
  const kb = KB[kkey];
  const inst = getInst(kkey, profile.elective);
  const bks = getBooks(kkey, profile.elective);
  const periods = Object.entries(kb.periods);
  const [activeP, setActiveP] = useState(periods[0][0]);
  const pd = kb.periods[activeP];

  return (
    <div className="sn-fade">
      <PageHeader sub="STUDY PLAN">맞춤 학습 계획</PageHeader>

      {/* 시기 탭 */}
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${V.b0}`,marginBottom:24}}>
        {periods.map(([k,p])=>(
          <button key={k} onClick={()=>setActiveP(k)} style={{
            background:"none",border:"none",borderBottom:`2px solid ${activeP===k?V.red:"transparent"}`,
            padding:"10px 20px 8px",color:activeP===k?V.t0:V.t1,fontWeight:activeP===k?700:400,
            fontSize:13,cursor:"pointer",fontFamily:"inherit",
          }}>{p.label}</button>
        ))}
      </div>

      {/* 시기별 내용 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:V.red,letterSpacing:"0.1em",marginBottom:8}}>GOAL</div>
          <div style={{fontSize:17,fontWeight:700,marginBottom:16,lineHeight:1.4}}>{pd.goal}</div>
          <div style={{fontSize:11,fontWeight:700,color:V.t2,letterSpacing:"0.08em",marginBottom:10}}>ACTION ITEMS</div>
          <ol style={{margin:0,paddingLeft:18,display:"flex",flexDirection:"column",gap:8}}>
            {pd.actions.map((a,i)=><li key={i} style={{fontSize:13,color:V.t1,lineHeight:1.7}}>{a}</li>)}
          </ol>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <div style={{fontSize:11,fontWeight:700,color:V.gold,letterSpacing:"0.08em",marginBottom:8}}>CHECKPOINT</div>
            <p style={{margin:0,fontSize:13,color:V.t1,lineHeight:1.75}}>{pd.check}</p>
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:700,color:V.t2,letterSpacing:"0.08em",marginBottom:8}}>CAUTION</div>
            <p style={{margin:0,fontSize:13,color:"#FCA5A5",lineHeight:1.75}}>{kb.caution}</p>
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:700,color:V.t2,letterSpacing:"0.08em",marginBottom:8}}>COMMUNITY EVIDENCE</div>
            <p style={{margin:0,fontSize:12,color:V.t2,lineHeight:1.7,fontStyle:"italic"}}>{kb.communityEvidence}</p>
          </Card>
        </div>
      </div>

      <Divider />

      {/* 강사 추천 */}
      <PageHeader sub="RECOMMENDED INSTRUCTORS" size="sm">추천 강의</PageHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:32}}>
        {inst.map((inst,i)=>(
          <div key={i} className="sn-hover-card" style={{background:V.s1,border:`1px solid ${V.b0}`,borderRadius:10,padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontWeight:800,fontSize:16,marginBottom:2}}>{inst.name}</div>
                <div style={{fontSize:11,color:V.t2}}>{inst.platform}</div>
              </div>
              <span style={{fontSize:10,padding:"3px 8px",borderRadius:4,border:`1px solid ${inst.onlineOffline==="인강"?"rgba(59,130,246,0.4)":V.goldB}`,color:inst.onlineOffline==="인강"?V.blue:V.gold,background:inst.onlineOffline==="인강"?"rgba(59,130,246,0.08)":V.goldA,fontFamily:"'DM Mono',monospace"}}>{inst.onlineOffline}</span>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
              {inst.path.map((p,j)=><span key={j} style={{fontSize:10,background:V.s2,border:`1px solid ${V.b0}`,borderRadius:3,padding:"2px 7px",color:V.t2,fontFamily:"'DM Mono',monospace"}}>{p}</span>)}
            </div>
            <p style={{margin:"0 0 10px",fontSize:12,color:V.t2,lineHeight:1.65}}>{inst.review}</p>
            <div style={{borderTop:`1px solid ${V.b0}`,paddingTop:10,fontSize:12}}>
              <span style={{color:V.red,fontWeight:700,marginRight:6}}>TIP</span>
              <span style={{color:V.t1}}>{inst.tip}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 교재 추천 */}
      <PageHeader sub="RECOMMENDED BOOKS" size="sm">추천 교재</PageHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
        {bks.map((b,i)=>(
          <div key={i} className="sn-hover-card" style={{
            background:V.s1,border:`1px solid ${V.b0}`,
            borderLeft:`3px solid ${b.type.includes("★")?V.gold:b.type.includes("N제")||b.type.includes("선택")?V.red:V.t3}`,
            borderRadius:"0 8px 8px 0",padding:"14px 16px",
          }}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{b.title}</div>
            <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{fontSize:10,color:V.t2,fontFamily:"'DM Mono',monospace"}}>{b.type}</span>
              <span style={{fontSize:10,color:V.t3}}>·</span>
              <span style={{fontSize:10,color:V.t2}}>난도 {b.diff}</span>
            </div>
            <p style={{margin:"0 0 5px",fontSize:12,color:V.t1}}>{b.why}</p>
            <p style={{margin:0,fontSize:11,color:V.t2}}>시기: {b.when}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOG TAB ─────────────────────────────────────────────────────
function LogTab({ profile, logs, onAdd }) {
  const [hours,setHours]=useState(""); const [tags,setTags]=useState([]);
  const [mock,setMock]=useState(""); const [weak,setWeak]=useState("");
  const [memo,setMemo]=useState(""); const [saved,setSaved]=useState(false);

  const tw = wl(0), already = logs[0]?.week===tw;
  function tog(t){setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);}

  async function submit(){
    if(!hours)return;
    await onAdd({week:tw,date:tod(),hours:Number(hours),tags,mockScore:mock?Number(mock):null,weakPoints:weak.trim(),memo:memo.trim()});
    setSaved(true);setTimeout(()=>setSaved(false),2000);
    setHours("");setTags([]);setMock("");setWeak("");setMemo("");
  }

  return (
    <div className="sn-fade">
      <PageHeader sub="WEEKLY LOG">학습 기록</PageHeader>

      {already && <Notice color="amber">이번 주 기록이 이미 있어요. 새로 입력하면 덮어써집니다.</Notice>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"start"}}>
        {/* 입력 폼 */}
        <Card>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:V.red,marginBottom:20}}>{tw} ENTRY</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <FLabel label="학습 시간 (h)">
              <FInput type="number" value={hours} onChange={e=>setHours(e.target.value)} placeholder="예: 15" />
            </FLabel>
            <FLabel label="모의고사 점수">
              <FInput type="number" value={mock} onChange={e=>setMock(e.target.value)} placeholder="예: 76" />
            </FLabel>
          </div>

          <FLabel label="주요 학습 내용">
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {STUDY_TAGS.map(t=>(
                <button key={t} onClick={()=>tog(t)} className="sn-tag-hover" style={{border:`1px solid ${tags.includes(t)?V.red:V.b0}`,borderRadius:5,padding:"5px 11px",background:tags.includes(t)?V.redA:V.s2,color:tags.includes(t)?V.t0:V.t2,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:tags.includes(t)?600:400}}>
                  {t}
                </button>
              ))}
            </div>
          </FLabel>

          <FLabel label="취약 단원 / 어려웠던 것">
            <FTextarea value={weak} onChange={e=>setWeak(e.target.value)} placeholder="예: 합성함수 미분, 수열 귀납적 정의" rows={2} />
          </FLabel>

          <FLabel label="메모 / 한 주 소감">
            <FTextarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="예: 백지복습 루틴 정착. 다음 주 N제 시작 예정." rows={2} />
          </FLabel>

          <button onClick={submit} disabled={!hours} className="sn-btn-hover" style={{
            width:"100%",padding:"12px",background:hours?V.red:"rgba(239,68,68,0.25)",
            color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:hours?"pointer":"not-allowed",fontFamily:"inherit",
          }}>{saved?"✓ 저장 완료":"이번 주 기록 저장"}</button>
        </Card>

        {/* 히스토리 */}
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:V.t2,marginBottom:12}}>HISTORY</div>
          {logs.length===0 ? <p style={{color:V.t2,fontSize:13}}>아직 기록이 없어요.</p> : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {logs.slice(0,8).map((l,i)=>(
                <div key={i} style={{background:V.s1,border:`1px solid ${V.b0}`,borderRadius:8,padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:l.tags?.length||l.weakPoints?8:0}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:V.t2,minWidth:40}}>{l.week}</span>
                    <span style={{fontWeight:800,fontSize:18}}>{l.hours}<span style={{fontSize:11,fontWeight:400,color:V.t2}}>h</span></span>
                    {l.mockScore&&<span style={{fontWeight:700,fontSize:16,color:V.gold}}>{l.mockScore}<span style={{fontSize:11,fontWeight:400,color:V.t2}}>점</span></span>}
                    {i===0&&<span style={{marginLeft:"auto",fontSize:10,color:V.red,fontWeight:700}}>LATEST</span>}
                  </div>
                  {l.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:l.weakPoints?6:0}}>{l.tags.map(t=><Chip key={t}>{t}</Chip>)}</div>}
                  {l.weakPoints&&<div style={{fontSize:11,color:V.t2}}>취약: {l.weakPoints}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REPORT TAB ──────────────────────────────────────────────────
function ReportTab({ profile, logs, kkey }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ DB.get("report").then(r=>{if(r)setReport(r);}); },[]);

  async function gen(){
    if(!logs.length)return;
    setLoading(true);
    const kb=KB[kkey], r4=logs.slice(0,4);
    const totalH=r4.reduce((a,l)=>a+(l.hours||0),0);
    const scores=r4.filter(l=>l.mockScore).map(l=>l.mockScore);
    const avgS=scores.length?Math.round(scores.reduce((a,b)=>a+b)/scores.length):null;
    const weaks=r4.flatMap(l=>l.weakPoints?[l.weakPoints]:[]).join(" / ")||"없음";
    const weekly=r4.map(l=>`${l.week} ${l.hours}h${l.mockScore?` ${l.mockScore}점`:""}`).join(", ");

    const prompt=`수능 수학 학습 코치로서 주간 리포트를 작성해. JSON만 반환해. 마크다운 코드블록 없이 순수 JSON.

학생: ${profile.name} · ${profile.currentGrade}등급→${profile.targetGrade}등급 · ${profile.elective}
핵심 원칙: ${kb.principle}
최근 4주: 총 ${totalH}h, 평균 모의 ${avgS||"미측정"}점
주별: ${weekly}
취약: ${weaks}

등급대(${kkey}) 문체: ${kkey==="3-1"||kkey==="5-3"?"간결하고 직설적":" 친절하지만 구체적"}

{
  "headline": "이번 주 핵심 한 줄 (20자 이내)",
  "score": 0~100,
  "trend": "up" | "flat" | "down",
  "strengths": ["강점1", "강점2"],
  "improvements": ["개선1", "개선2"],
  "next_plan": ["다음주 행동1", "다음주 행동2", "다음주 행동3"],
  "caution": "지금 가장 조심해야 할 것 (한 문장)",
  "message": "등급대에 맞는 진심 어린 격려 (한 문장)"
}`;

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:prompt}]})});
      const d=await res.json();
      const text=d.content?.map(i=>i.text||"").join("").replace(/```json|```/g,"").trim();
      const r={...JSON.parse(text),generatedAt:tod()};
      setReport(r); await DB.set("report",r);
    }catch{setReport({headline:"리포트 생성 오류",score:0,trend:"flat",strengths:[],improvements:[],next_plan:[],caution:"",message:"",generatedAt:tod()});}
    setLoading(false);
  }

  const trendIcon = report?.trend==="up"?"▲":report?.trend==="down"?"▼":"–";
  const trendColor = report?.trend==="up"?V.gold:report?.trend==="down"?V.red:V.t2;

  return (
    <div className="sn-fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:32}}>
        <PageHeader sub="WEEKLY REPORT" noMargin>주간 리포트</PageHeader>
        <button onClick={gen} disabled={loading||!logs.length} className="sn-btn-hover" style={{
          background:logs.length?V.red:"rgba(239,68,68,0.2)",color:"#fff",border:"none",borderRadius:8,
          padding:"10px 20px",fontSize:13,fontWeight:700,cursor:logs.length?"pointer":"not-allowed",
          fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,
        }}>
          {loading&&<SpinIcon />}{loading?"분석 중...":"리포트 생성"}
        </button>
      </div>

      {!logs.length && <Notice color="amber">학습 기록이 최소 1주 이상 필요합니다.</Notice>}

      {report && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* 헤더 카드 */}
          <div style={{background:V.s1,border:`1px solid ${V.b0}`,borderRadius:10,padding:24,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:V.red,marginBottom:8}}>AI ANALYSIS · {report.generatedAt}</div>
              <div style={{fontSize:20,fontWeight:800,lineHeight:1.3}}>{report.headline}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:40,fontWeight:900,color:report.score>=80?V.gold:report.score>=60?V.t0:V.t1,lineHeight:1}}>{report.score}</div>
              <div style={{fontSize:11,color:V.t2,marginTop:4}}>종합 점수</div>
              <div style={{fontSize:14,fontWeight:700,color:trendColor,marginTop:4}}>{trendIcon} {report.trend==="up"?"상승":report.trend==="down"?"하락":"유지"}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card>
              <div style={{fontSize:11,fontWeight:700,color:"#4ADE80",letterSpacing:"0.1em",marginBottom:12}}>STRENGTHS</div>
              <ul style={{margin:0,paddingLeft:16,display:"flex",flexDirection:"column",gap:6}}>{report.strengths?.map((s,i)=><li key={i} style={{fontSize:13,color:V.t1,lineHeight:1.7}}>{s}</li>)}</ul>
            </Card>
            <Card>
              <div style={{fontSize:11,fontWeight:700,color:V.red,letterSpacing:"0.1em",marginBottom:12}}>IMPROVEMENTS</div>
              <ul style={{margin:0,paddingLeft:16,display:"flex",flexDirection:"column",gap:6}}>{report.improvements?.map((s,i)=><li key={i} style={{fontSize:13,color:V.t1,lineHeight:1.7}}>{s}</li>)}</ul>
            </Card>
          </div>

          <Card>
            <div style={{fontSize:11,fontWeight:700,color:V.gold,letterSpacing:"0.1em",marginBottom:12}}>NEXT WEEK PLAN</div>
            <ol style={{margin:0,paddingLeft:18,display:"flex",flexDirection:"column",gap:8}}>{report.next_plan?.map((p,i)=><li key={i} style={{fontSize:14,color:V.t1,lineHeight:1.8}}>{p}</li>)}</ol>
          </Card>

          {report.caution&&<div style={{background:V.redA,border:`1px solid ${V.redB}`,borderRadius:8,padding:"12px 16px",fontSize:13,color:"#FCA5A5"}}><span style={{fontWeight:700,marginRight:6}}>⚠</span>{report.caution}</div>}
          {report.message&&<div style={{background:V.goldA,border:`1px solid ${V.goldB}`,borderRadius:8,padding:"14px 16px",textAlign:"center",fontSize:14,color:V.gold,fontStyle:"italic"}}>{report.message}</div>}
        </div>
      )}
    </div>
  );
}

// ─── COACH TAB ───────────────────────────────────────────────────
function CoachTab({ profile, logs, kkey }) {
  const [q,setQ]=useState(""); const [answer,setAnswer]=useState(null); const [loading,setLoading]=useState(false);
  const QUICK=[
    "지금 당장 가장 중요한 것 한 가지만",
    `${profile.elective} 어떻게 공부해야 해?`,
    "내 취약점 분석해줘",
    "목표 등급 달성 가능성 솔직하게",
    "기출과 N제 배분을 어떻게 해야 해?",
  ];

  async function ask(query){
    const text=query||q; if(!text.trim())return;
    setLoading(true);setAnswer(null);
    const kb=KB[kkey], r4=logs.slice(0,4);
    const sum=r4.length>0?`최근: ${r4.map(l=>`${l.week} ${l.hours}h${l.mockScore?` ${l.mockScore}점`:""}`).join(", ")}. 취약: ${r4.flatMap(l=>l.weakPoints?[l.weakPoints]:[]).join(" / ")||"없음"}`:"기록 없음";

    const prompt=`수능 수학 전문 코치. 솔직하고 구체적으로 답해. 최대 300자.

학생: ${profile.currentGrade}등급→${profile.targetGrade}등급 · ${profile.elective}
원칙: ${kb.principle}
${sum}

질문: ${text}`;

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:prompt}]})});
      const d=await res.json();
      setAnswer(d.content?.map(i=>i.text||"").join("")||"오류가 발생했습니다.");
    }catch{setAnswer("오류가 발생했습니다. 다시 시도해주세요.");}
    setLoading(false);
  }

  return (
    <div className="sn-fade">
      <PageHeader sub="AI COACH">AI 수학 코치</PageHeader>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
        <div>
          <Card style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:V.t2,letterSpacing:"0.08em",marginBottom:12}}>QUICK QUESTIONS</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {QUICK.map((qt,i)=>(
                <button key={i} onClick={()=>ask(qt)} className="sn-btn-hover" style={{background:V.s2,border:`1px solid ${V.b0}`,borderRadius:6,padding:"9px 14px",color:V.t1,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                  {qt}
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{fontSize:11,fontWeight:700,color:V.t2,letterSpacing:"0.08em",marginBottom:12}}>CUSTOM QUESTION</div>
            <FTextarea value={q} onChange={e=>setQ(e.target.value)} rows={3} placeholder="예: 개념은 이해했는데 기출에서 계속 틀리는 이유가 뭔가요?" style={{marginBottom:12}} />
            <button onClick={()=>ask(q)} disabled={loading||!q.trim()} className="sn-btn-hover" style={{width:"100%",padding:"11px",background:q.trim()?V.red:"rgba(239,68,68,0.2)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:q.trim()?"pointer":"not-allowed",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {loading&&<SpinIcon />}{loading?"분석 중...":"질문하기"}
            </button>
          </Card>
        </div>
        <div>
          {answer ? (
            <Card>
              <div style={{fontSize:11,fontWeight:700,color:V.red,letterSpacing:"0.1em",marginBottom:16}}>AI RESPONSE</div>
              <div style={{fontSize:14,color:V.t1,lineHeight:1.9,whiteSpace:"pre-wrap"}}>{answer}</div>
            </Card>
          ) : (
            <div style={{background:V.s1,border:`1px solid ${V.b0}`,borderRadius:10,padding:40,textAlign:"center",color:V.t2,fontSize:13}}>
              {loading ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}><SpinIcon large /><span>분석 중...</span></div> : "질문을 선택하거나 직접 입력해보세요."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ────────────────────────────────────────────────
function SettingsTab({ profile, onUpdate }) {
  const [cur,setCur]=useState(profile.currentGrade); const [tgt,setTgt]=useState(profile.targetGrade);
  const [elec,setElec]=useState(profile.elective); const [saved,setSaved]=useState(false);

  async function save(){
    await onUpdate({...profile,currentGrade:cur,targetGrade:tgt,elective:elec});
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div className="sn-fade">
      <PageHeader sub="SETTINGS">프로필 설정</PageHeader>
      <div style={{maxWidth:560}}>
        <Card>
          <FLabel label="현재 등급 업데이트"><GGrid selected={cur} onSelect={setCur} /></FLabel>
          <FLabel label="목표 등급"><GGrid selected={tgt} onSelect={setTgt} disabledFrom={cur} /></FLabel>
          <FLabel label="선택과목">
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {ELECTIVES.map(e=><button key={e} onClick={()=>setElec(e)} className="sn-grade-hover" style={{border:`1px solid ${elec===e?V.red:V.b0}`,borderRadius:8,padding:12,background:elec===e?V.redA:V.s1,color:elec===e?V.t0:V.t1,cursor:"pointer",fontWeight:elec===e?700:400,fontSize:14,fontFamily:"inherit"}}>{e}</button>)}
            </div>
          </FLabel>
          <button onClick={save} className="sn-btn-hover" style={{width:"100%",padding:"13px",background:V.red,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {saved?"✓ 저장 완료":"변경 저장"}
          </button>
        </Card>
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────
function Card({ children, style={} }) {
  return <div style={{background:V.s1,border:`1px solid ${V.b0}`,borderRadius:10,padding:20,...style}}>{children}</div>;
}
function CLabel({ children }) {
  return <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.14em",color:V.t2,marginBottom:12}}>{children}</div>;
}
function GBadge({ grade }) {
  const g=GI[grade];
  return <span style={{fontSize:12,fontWeight:700,color:g?.c,border:`1px solid ${g?.c}44`,padding:"2px 10px",borderRadius:4,fontFamily:"'DM Mono',monospace"}}>{g?.l}</span>;
}
function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="sn-hover-card" style={{background:V.s1,border:`1px solid ${V.b0}`,borderRadius:10,padding:"18px 20px"}}>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:V.t2,letterSpacing:"0.1em",marginBottom:8}}>{label}</div>
      <div style={{fontSize:28,fontWeight:900,letterSpacing:"-0.02em",color:accent||V.t0,lineHeight:1}}>{value}</div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:V.t3,marginTop:4}}>{sub}</div>
    </div>
  );
}
function BarChart({ data }) {
  const max=Math.max(...data.map(d=>d.hours||0),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:8,height:80}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:V.t2}}>{d.hours}</span>
          <div style={{width:"100%",background:V.red,borderRadius:"2px 2px 0 0",height:`${Math.max((d.hours/max)*56,2)}px`,opacity:0.5+i*0.06}} />
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:V.t3,whiteSpace:"nowrap"}}>{d.week}</span>
        </div>
      ))}
    </div>
  );
}
function Chip({ children }) {
  return <span style={{fontSize:10,color:V.t2,background:V.s2,border:`1px solid ${V.b0}`,padding:"2px 7px",borderRadius:3,fontFamily:"'DM Mono',monospace"}}>{children}</span>;
}
function Divider() { return <div style={{borderTop:`1px solid ${V.b0}`,margin:"32px 0"}} />; }
function Notice({ children, color }) {
  const c=color==="amber"?{bg:"rgba(245,158,11,0.08)",border:"rgba(245,158,11,0.25)",text:"#FCD34D"}:{bg:V.redA,border:V.redB,text:"#FCA5A5"};
  return <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:8,padding:"11px 16px",fontSize:13,color:c.text,marginBottom:16}}>{children}</div>;
}
function PageHeader({ children, sub, size="lg", noMargin=false }) {
  return (
    <div style={{marginBottom:noMargin?0:32}}>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.16em",color:V.red,marginBottom:8}}>{sub}</div>
      <h2 style={{margin:0,fontSize:size==="lg"?"clamp(22px,3vw,32px)":18,fontWeight:900,letterSpacing:"-0.02em"}}>{children}</h2>
    </div>
  );
}
function GGrid({ selected, onSelect, disabledFrom=null }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
      {Object.entries(GI).map(([g,info])=>{
        const n=Number(g), dis=disabledFrom&&n>=disabledFrom;
        return (
          <button key={g} onClick={()=>!dis&&onSelect(n)} className={dis?"":"sn-grade-hover"} style={{
            border:`1px solid ${selected===n?info.c:V.b0}`,borderRadius:7,padding:"9px 6px",
            display:"flex",flexDirection:"column",gap:2,alignItems:"center",
            cursor:dis?"not-allowed":"pointer",background:selected===n?`${info.c}18`:V.s2,
            color:selected===n?info.c:dis?"#27272A":V.t2,opacity:dis?0.25:1,
          }}>
            <span style={{fontWeight:700,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{info.l}</span>
            <span style={{fontSize:9,color:"inherit",opacity:0.7}}>{info.r}</span>
          </button>
        );
      })}
    </div>
  );
}
function FLabel({ label, children }) {
  return <div style={{marginBottom:18}}><label style={{display:"block",fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:V.t2,marginBottom:8}}>{label}</label>{children}</div>;
}
function FInput({ style={}, ...props }) {
  return <input {...props} style={{width:"100%",background:V.s2,border:`1px solid ${V.b0}`,borderRadius:7,padding:"10px 14px",color:V.t0,fontSize:14,fontFamily:"inherit",...style}} />;
}
function FTextarea({ style={}, ...props }) {
  return <textarea {...props} style={{width:"100%",background:V.s2,border:`1px solid ${V.b0}`,borderRadius:7,padding:"10px 14px",color:V.t0,fontSize:13,fontFamily:"inherit",resize:"vertical",...style}} />;
}
function SpinIcon({ large }) {
  const sz=large?28:14;
  return <div style={{width:sz,height:sz,border:`2px solid rgba(255,255,255,0.15)`,borderTop:"2px solid #fff",borderRadius:"50%",animation:"snSpin 0.7s linear infinite",flexShrink:0}} />;
}
