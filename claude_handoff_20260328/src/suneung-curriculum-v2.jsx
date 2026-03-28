import { useState } from "react";

// ══════════════════════════════════════════════════
// 📦 커리큘럼 데이터 (엑셀 초안 기반 — 직접 수정 가능)
// ══════════════════════════════════════════════════
const CURRICULUM_DATA = {
  "9-7": {
    duration: "8주",
    summary: "수학 기초가 흔들리는 상태에서 수I 입문까지 끌어올리는 단계예요. 조급하지 말고 개념 하나씩 확실히 잡는 게 핵심이에요.",
    phases: [
      {
        phase: 1, title: "수학 기초 회복", duration: "4주",
        goal: "연산·방정식·함수 기초 완성",
        topics: ["자연수/정수/유리수 연산", "방정식·부등식 기초", "함수 개념 입문", "좌표평면 이해"],
        youtube_queries: ["수학 기초 완성 강의", "중학수학 총정리", "방정식 개념 쉽게"],
        daily_plan: "하루 1.5시간 — 개념 40분 + 문제 50분",
        checkpoints: ["기초 문제집 1회독 완료", "오답률 50% 이하"],
        caution: "암기식으로 공식만 외우면 금방 무너져요. 왜 그렇게 되는지 이해 위주로 공부하세요.",
      },
      {
        phase: 2, title: "수I 필수 개념", duration: "4주",
        goal: "지수·로그·수열 기초 입문",
        topics: ["지수법칙과 지수함수", "로그 정의와 성질", "등차수열", "등비수열 기초"],
        youtube_queries: ["지수로그 기초 강의", "수열 개념 입문", "고1 수학 핵심 정리"],
        daily_plan: "하루 1.5시간 — 개념 50분 + 문제 40분",
        checkpoints: ["수I 기본 문제 풀이 가능", "개념 노트 완성"],
        caution: "로그 계산에서 밑 조건(양수, 1 아님)을 자주 빠뜨려요. 체크 습관을 만드세요.",
      },
    ],
    books: ["개념원리 수학(상)(하)", "RPM 수학I", "개념원리 수학I"],
    final_tip: "지금 느려도 괜찮아요. 기초가 탄탄해야 나중에 빠르게 올라갈 수 있어요.",
  },

  "7-5": {
    duration: "10주",
    summary: "수I 개념을 완성하고 수II까지 입문하는 단계예요. 개념→유형→기출 순서를 철저히 지키면 10주 안에 5등급 안착 가능해요.",
    phases: [
      {
        phase: 1, title: "수I 전범위 정리", duration: "4주",
        goal: "수I 개념 완성 및 유형 적응",
        topics: ["지수·로그 함수 그래프", "삼각함수 정의와 그래프", "등차·등비수열", "수열의 합(Σ)"],
        youtube_queries: ["수I 전범위 개념 강의", "삼각함수 기초 쉽게", "수열 완성 강의"],
        daily_plan: "하루 2시간 — 개념 1시간 + 유형 풀이 1시간",
        checkpoints: ["수I 기출 풀기 시작 가능", "개념 문제 정답률 70%+"],
        caution: "삼각함수 값 암기를 미루는 학생이 많아요. 30·45·60도 값은 반드시 외우세요.",
      },
      {
        phase: 2, title: "수II 입문", duration: "3주",
        goal: "극한·미분 기초 완성",
        topics: ["함수의 극한과 연속", "다항함수 미분", "접선의 방정식", "함수의 증가·감소"],
        youtube_queries: ["수II 극한 개념 강의", "미분 기초 쉽게", "수능 수II 입문"],
        daily_plan: "하루 2시간 — 개념 50분 + 풀이 70분",
        checkpoints: ["다항함수 미분 자유자재", "극한값 계산 가능"],
        caution: "미분 공식을 외우는 데 그치면 안 돼요. 접선·극값 문제에 적용하는 연습이 필수예요.",
      },
      {
        phase: 3, title: "기출 적응 훈련", duration: "3주",
        goal: "실전 시간 관리 적응",
        topics: ["최근 5개년 5~6등급 수준 기출", "시간 배분 훈련", "오답 패턴 분석"],
        youtube_queries: ["수능 수학 기출 해설", "4등급 컷 문제 풀이", "수능 시간관리법"],
        daily_plan: "주 3회 실전 풀이(40분) + 나머지 날 오답 분석",
        checkpoints: ["60분 안에 공통과목 완료", "오답 노트 10회분 완성"],
        caution: "풀다가 막히면 바로 넘기는 습관을 지금부터 들이세요. 한 문제에 10분 이상 쓰면 안 돼요.",
      },
    ],
    books: ["수학의 정석 수I·수II (기본편)", "마플 시너지 수학I", "자이스토리 수학I"],
    final_tip: "5등급은 기초 개념만 잡아도 충분히 넘을 수 있어요. 포기하지 말고 꾸준히 하세요.",
  },

  "5-3": {
    duration: "14주",
    summary: "개념 완성 → 유형 훈련 → 실전 반복의 3단계가 핵심이에요. 준킬러 문제를 자력으로 풀기 시작하면 3등급은 현실이 돼요.",
    phases: [
      {
        phase: 1, title: "개념 완성", duration: "4주",
        goal: "수I·수II 전체 개념 재정리",
        topics: ["수I 취약 단원 집중 보완", "수II 미분·적분 전범위", "선택과목(확통/미적/기하) 개념"],
        youtube_queries: ["현우진 개념의 이해", "수II 미분 완성 강의", "확률통계 단기완성"],
        daily_plan: "하루 3시간 — 개념 1.5시간 + 유형 1.5시간",
        checkpoints: ["개념 문제 정답률 85%+", "단원별 오답 정리 완료"],
        caution: "이 단계에서 기출을 너무 많이 풀려고 하면 개념이 흔들려요. 개념 먼저 잡고 기출은 다음 단계에서 해요.",
      },
      {
        phase: 2, title: "유형 집중 훈련", duration: "5주",
        goal: "준킬러 유형 자력 풀이",
        topics: ["준킬러 문항 유형 분석", "조건 해석 훈련", "미적분 선택 심화", "확통 조건부확률·이항분포"],
        youtube_queries: ["수능 준킬러 공략법", "수학 유형 분석 강의", "확률 통계 핵심 문제"],
        daily_plan: "하루 3시간 — 유형 풀이 2시간 + 오답 분석 1시간",
        checkpoints: ["준킬러 문제 정답률 60%+", "주요 유형 15가지 완성"],
        caution: "같은 유형을 반복하지 않고 새 문제만 풀면 실력이 안 늘어요. 오답을 3번 이상 반복하세요.",
      },
      {
        phase: 3, title: "실전 모의고사", duration: "3주",
        goal: "시간 배분 및 실수 제로화",
        topics: ["수능 실전 풀이 훈련", "시간 배분 전략", "실수 패턴 분석"],
        youtube_queries: ["수능 실전 전략 강의", "수학 시간관리 비법", "오답 분석법"],
        daily_plan: "주 3회 실전 모의고사(100분) + 오답 분석 2시간",
        checkpoints: ["모의고사 70점대 안정", "30번 이전 문제 실수 0"],
        caution: "점수가 안 오른다고 모의고사를 더 많이 푸는 건 역효과예요. 오답 분석이 더 중요해요.",
      },
      {
        phase: 4, title: "파이널 점검", duration: "2주",
        goal: "핵심 압축 복습 + 컨디션 관리",
        topics: ["개념 압축 노트 복습", "자주 틀리는 유형 재점검", "멘탈 관리"],
        youtube_queries: ["수능 전 마지막 정리", "수능 당일 전략"],
        daily_plan: "하루 2.5시간 — 복습 2시간 + 쉬는 시간 확보",
        checkpoints: ["목표 점수 달성 확인", "오답 노트 최종 점검"],
        caution: "마지막 2주에 새 내용 공부하면 독이 돼요. 아는 것을 완벽하게 만드는 시간이에요.",
      },
    ],
    books: ["수능특강 수학영역 (EBS)", "뉴런 수학I·II", "자이스토리 수학I·II"],
    final_tip: "3등급과 4등급의 차이는 준킬러 2~3문제예요. 그것만 잡으면 돼요.",
  },

  "3-1": {
    duration: "16주",
    summary: "킬러 문항 공략이 핵심이에요. 개념 심화 → 30번 유형 분석 → 실전 반복으로 만점에 가까운 실력을 만들어요.",
    phases: [
      {
        phase: 1, title: "고난도 개념 심화", duration: "4주",
        goal: "킬러 문항에 필요한 개념 완성",
        topics: ["합성함수·역함수 미분", "음함수·매개변수 미분", "수열의 극한·급수", "급수의 합 테크닉"],
        youtube_queries: ["킬러 문항 개념 강의", "미적분 심화 강의", "수열 극한 완성"],
        daily_plan: "하루 4시간 — 개념 2시간 + 고난도 풀이 2시간",
        checkpoints: ["킬러 개념 완벽 이해", "관련 준킬러 자력 풀이"],
        caution: "개념을 얕게 넓게 보면 킬러에서 무너져요. 하나를 깊게 파는 것이 훨씬 효과적이에요.",
      },
      {
        phase: 2, title: "킬러 문항 공략", duration: "5주",
        goal: "28~30번 수준 자력 풀이",
        topics: ["30번 유형 분류 및 분석", "조건 해석 → 그래프 추론", "도형+미적분 융합 문제", "경우의 수 완전탐색"],
        youtube_queries: ["수능 30번 공략 강의", "킬러 문항 해설", "고난도 함수 문제 풀이"],
        daily_plan: "하루 4시간 — 킬러 풀이 2.5시간 + 복기 1.5시간",
        checkpoints: ["킬러 문항 정답률 40%+", "풀이 과정 논리 정연하게 서술 가능"],
        caution: "킬러 못 풀었을 때 해설 바로 보지 마세요. 최소 40분은 스스로 고민해야 실력이 늘어요.",
      },
      {
        phase: 3, title: "실전 반복 훈련", duration: "4주",
        goal: "실제 수능 기준 95점+ 안정화",
        topics: ["최근 7개년 수능 실전 풀이", "풀이 속도 향상", "오답 원인 분류(개념/실수/시간)"],
        youtube_queries: ["수능 수학 연도별 풀이", "실전 감각 훈련 강의", "1등급 오답 분석"],
        daily_plan: "주 4회 실전(100분) + 매일 오답 분석 1.5시간",
        checkpoints: ["실제 수능 기준 95점+ 안정", "30번 정답률 50%+"],
        caution: "실전에서 시간이 부족한 건 계산이 느린 것보다 풀이 순서가 잘못된 경우가 많아요. 전략을 점검하세요.",
      },
      {
        phase: 4, title: "마무리 전략", duration: "3주",
        goal: "빠른 풀이 정착 + EBS 연계 확인",
        topics: ["빠른 풀이법 정착", "EBS 수능완성 연계 확인", "실수 제로화 훈련"],
        youtube_queries: ["수능 수학 만점 전략", "EBS 연계 분석", "수능 당일 전략"],
        daily_plan: "하루 3시간 — 기출 복습 2시간 + EBS 연계 1시간",
        checkpoints: ["모의 만점 또는 1문제 이내 오류", "EBS 연계 문제 완벽 숙지"],
        caution: "마지막까지 새 문제 욕심내지 마세요. 아는 것을 실수 없이 푸는 연습이 더 중요해요.",
      },
    ],
    books: ["수능완성 수학영역 (EBS)", "킬러 문항 공략집 (시대인재/대성)", "역대 수능 기출문제집 (최근 7개년)"],
    final_tip: "1등급의 차이는 킬러 1~2문제예요. 포기하지 않고 끝까지 고민하는 습관이 만점을 만들어요.",
  },
};

// 등급 범위 매핑 (AI 보완용)
function getCurriculumKey(current, target) {
  if (current >= 8 && target >= 6) return "9-7";
  if (current >= 6 && target >= 4) return "7-5";
  if (current >= 4 && target >= 2) return "5-3";
  if (current >= 2 && target >= 1) return "3-1";
  return null;
}

const GRADE_INFO = {
  1: { label: "1등급", color: "#FF4757", range: "96~100점" },
  2: { label: "2등급", color: "#FF6B35", range: "89~95점" },
  3: { label: "3등급", color: "#FFA502", range: "77~88점" },
  4: { label: "4등급", color: "#ECCC68", range: "60~76점" },
  5: { label: "5등급", color: "#7BED9F", range: "40~59점" },
  6: { label: "6등급", color: "#70A1FF", range: "23~39점" },
  7: { label: "7등급", color: "#A29BFE", range: "12~22점" },
  8: { label: "8등급", color: "#B2BEC3", range: "4~11점" },
  9: { label: "9등급", color: "#636E72", range: "3점 이하" },
};

export default function App() {
  const [currentGrade, setCurrentGrade] = useState(null);
  const [targetGrade, setTargetGrade] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("select");
  const [mode, setMode] = useState(null); // "preset" | "ai"

  const handleGenerate = async () => {
    if (!currentGrade || !targetGrade) return;
    if (targetGrade >= currentGrade) {
      setError("목표 등급은 현재 등급보다 높아야 해요 (숫자가 작을수록 높은 등급)");
      return;
    }
    setError(null);
    setStep("result");

    const key = getCurriculumKey(currentGrade, targetGrade);

    if (key && CURRICULUM_DATA[key]) {
      // 프리셋 데이터 사용
      setMode("preset");
      setCurriculum(CURRICULUM_DATA[key]);
    } else {
      // AI 생성
      setMode("ai");
      setLoading(true);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `수능 수학 ${currentGrade}등급 → ${targetGrade}등급 커리큘럼을 JSON으로만 반환해주세요. 마크다운 없이 순수 JSON만.
{"summary":"...","duration":"...","phases":[{"phase":1,"title":"...","duration":"...","goal":"...","topics":["..."],"youtube_queries":["..."],"daily_plan":"...","checkpoints":["..."],"caution":"..."}],"books":["..."],"final_tip":"..."}`
            }],
          }),
        });
        const data = await res.json();
        const text = data.content.map(i => i.text || "").join("");
        setCurriculum(JSON.parse(text.replace(/```json|```/g, "").trim()));
      } catch {
        setError("생성 오류가 발생했어요. 다시 시도해주세요.");
        setStep("select");
      } finally {
        setLoading(false);
      }
    }
  };

  const reset = () => {
    setCurrentGrade(null); setTargetGrade(null);
    setCurriculum(null); setStep("select");
    setError(null); setMode(null);
  };

  return (
    <div style={s.root}>
      <div style={s.bgGrid} />
      <div style={s.glow1} /><div style={s.glow2} />

      <div style={s.wrap}>
        <header style={s.header}>
          <div style={s.badge}>수능 수학 AI 커리큘럼</div>
          <h1 style={s.title}>등급별 <span style={s.accent}>맞춤 로드맵</span></h1>
          <p style={s.sub}>검증된 데이터 + AI 분석으로 나만의 학습 계획을</p>
        </header>

        {step === "select" && (
          <div style={s.card}>
            <Section label="📊 현재 내 등급">
              <GradeGrid grades={GRADE_INFO} selected={currentGrade} onSelect={setCurrentGrade} disabledFrom={null} />
            </Section>
            <Section label="🎯 목표 등급">
              <GradeGrid grades={GRADE_INFO} selected={targetGrade} onSelect={setTargetGrade} disabledFrom={currentGrade} />
            </Section>
            {error && <div style={s.err}>{error}</div>}
            <button onClick={handleGenerate} disabled={!currentGrade || !targetGrade}
              style={{ ...s.cta, opacity: (!currentGrade || !targetGrade) ? 0.4 : 1 }}>
              {currentGrade && targetGrade ? `${currentGrade}등급 → ${targetGrade}등급 커리큘럼 보기` : "등급을 선택해주세요"}
            </button>
          </div>
        )}

        {step === "result" && (
          <>
            {loading ? <LoadingBox current={currentGrade} target={targetGrade} /> :
              curriculum ? <Result curriculum={curriculum} current={currentGrade} target={targetGrade} mode={mode} onReset={reset} /> : null}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return <div style={{ marginBottom: 28 }}>
    <div style={s.secLabel}>{label}</div>
    {children}
  </div>;
}

function GradeGrid({ grades, selected, onSelect, disabledFrom }) {
  return <div style={s.grid}>
    {Object.entries(grades).map(([g, info]) => {
      const disabled = disabledFrom && Number(g) >= disabledFrom;
      return <button key={g} onClick={() => !disabled && onSelect(Number(g))}
        style={{
          ...s.gBtn,
          background: selected === Number(g) ? info.color : "rgba(255,255,255,0.05)",
          borderColor: selected === Number(g) ? info.color : "rgba(255,255,255,0.1)",
          color: selected === Number(g) ? "#fff" : disabled ? "#333" : "#aaa",
          opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer",
          transform: selected === Number(g) ? "scale(1.07)" : "scale(1)",
        }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{g}등급</span>
        <span style={{ fontSize: 10, opacity: 0.75 }}>{info.range}</span>
      </button>;
    })}
  </div>;
}

function LoadingBox({ current, target }) {
  return <div style={{ textAlign: "center", padding: "80px 20px" }}>
    <div style={s.spin} />
    <p style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>커리큘럼 생성 중...</p>
    <p style={{ color: "#666", fontSize: 14 }}>{current}등급 → {target}등급 맞춤 전략을 세우고 있어요</p>
  </div>;
}

function Result({ curriculum, current, target, mode, onReset }) {
  const phaseColors = ["#FF6B6B", "#FFA502", "#7BED9F", "#70A1FF"];
  return <div>
    {/* 배지 */}
    <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
      <span style={{ ...s.pill, background: GRADE_INFO[current]?.color }}>{current}등급</span>
      <span style={{ color: "#444", fontSize: 18 }}>→</span>
      <span style={{ ...s.pill, background: GRADE_INFO[target]?.color }}>{target}등급</span>
      <span style={{ marginLeft: "auto", color: "#888", fontSize: 13 }}>⏱ {curriculum.duration}</span>
      {mode === "preset" && <span style={s.verifiedBadge}>✅ 검증된 데이터</span>}
    </div>

    {/* 요약 */}
    <div style={s.summaryCard}>
      <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.75, margin: 0 }}>{curriculum.summary}</p>
    </div>

    {/* Phases */}
    {curriculum.phases?.map((ph, i) => (
      <div key={i} style={s.phaseCard}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ ...s.phaseTag, background: phaseColors[i % 4] }}>PHASE {ph.phase}</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{ph.title}</div>
            <div style={{ color: "#888", fontSize: 12 }}>{ph.duration} · {ph.goal}</div>
          </div>
        </div>
        <div style={s.twoCol}>
          <div>
            <div style={s.colTitle}>📌 핵심 주제</div>
            <ul style={s.ul}>{ph.topics?.map((t, j) => <li key={j} style={s.li}>{t}</li>)}</ul>
          </div>
          <div>
            <div style={s.colTitle}>📺 유튜브 검색어</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ph.youtube_queries?.map((q, j) => (
                <a key={j} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`}
                  target="_blank" rel="noreferrer" style={s.ytTag}>🔍 {q}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={s.twoCol}>
          <div>
            <div style={s.colTitle}>📅 하루 계획</div>
            <p style={{ color: "#bbb", fontSize: 13, lineHeight: 1.7, margin: 0 }}>{ph.daily_plan}</p>
          </div>
          <div>
            <div style={s.colTitle}>✅ 완료 기준</div>
            <ul style={s.ul}>{ph.checkpoints?.map((c, j) => <li key={j} style={s.li}>{c}</li>)}</ul>
          </div>
        </div>
        {ph.caution && (
          <div style={s.caution}>⚠️ <strong>주의</strong> — {ph.caution}</div>
        )}
      </div>
    ))}

    {/* 하단 */}
    <div style={s.twoCol}>
      <div style={s.bookCard}>
        <div style={s.colTitle}>📚 추천 교재</div>
        <ul style={s.ul}>{curriculum.books?.map((b, i) => <li key={i} style={s.li}>{b}</li>)}</ul>
      </div>
      <div style={s.tipCard}>
        <div style={s.colTitle}>💬 최종 조언</div>
        <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{curriculum.final_tip}</p>
      </div>
    </div>

    <button onClick={onReset} style={s.resetBtn}>↩ 처음으로</button>
  </div>;
}

const s = {
  root: { minHeight: "100vh", background: "#080810", color: "#fff", fontFamily: "'Apple SD Gothic Neo','Malgun Gothic',sans-serif", position: "relative", overflow: "hidden" },
  bgGrid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" },
  glow1: { position: "fixed", top: "-20%", right: "-10%", width: 600, height: 600, background: "radial-gradient(circle,rgba(255,71,87,0.1) 0%,transparent 70%)", pointerEvents: "none" },
  glow2: { position: "fixed", bottom: "-20%", left: "-10%", width: 500, height: 500, background: "radial-gradient(circle,rgba(112,161,255,0.08) 0%,transparent 70%)", pointerEvents: "none" },
  wrap: { maxWidth: 760, margin: "0 auto", padding: "40px 20px 80px", position: "relative", zIndex: 1 },
  header: { textAlign: "center", marginBottom: 40 },
  badge: { display: "inline-block", background: "rgba(255,71,87,0.15)", border: "1px solid rgba(255,71,87,0.4)", color: "#FF4757", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, letterSpacing: 2, marginBottom: 16 },
  title: { fontSize: "clamp(34px,8vw,56px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 10px", letterSpacing: -1 },
  accent: { background: "linear-gradient(135deg,#FF4757,#FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  sub: { color: "#666", fontSize: 14 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, backdropFilter: "blur(10px)" },
  secLabel: { fontSize: 12, fontWeight: 700, color: "#666", letterSpacing: 1, marginBottom: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 },
  gBtn: { border: "1px solid", borderRadius: 12, padding: "11px 8px", transition: "all 0.18s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
  err: { background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "#FF4757", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 14 },
  cta: { width: "100%", padding: 16, background: "linear-gradient(135deg,#FF4757,#FF6B35)", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer" },
  spin: { width: 44, height: 44, border: "3px solid rgba(255,71,87,0.2)", borderTop: "3px solid #FF4757", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" },
  pill: { padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#fff" },
  verifiedBadge: { background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ECC71", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  summaryCard: { background: "rgba(255,71,87,0.06)", border: "1px solid rgba(255,71,87,0.15)", borderRadius: 14, padding: "18px 20px", marginBottom: 18 },
  phaseCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22, marginBottom: 14 },
  phaseTag: { color: "#fff", padding: "5px 11px", borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: 1, whiteSpace: "nowrap", marginTop: 2 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 },
  colTitle: { fontSize: 11, fontWeight: 700, color: "#FF6B35", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" },
  ul: { margin: 0, paddingLeft: 16 },
  li: { color: "#ccc", fontSize: 13, lineHeight: 1.85 },
  ytTag: { background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)", color: "#FF4757", padding: "3px 9px", borderRadius: 20, fontSize: 11, textDecoration: "none" },
  caution: { background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.2)", color: "#FFA502", padding: "10px 14px", borderRadius: 10, fontSize: 13, lineHeight: 1.6 },
  bookCard: { background: "rgba(112,161,255,0.05)", border: "1px solid rgba(112,161,255,0.12)", borderRadius: 14, padding: 18, marginBottom: 16 },
  tipCard: { background: "rgba(123,237,159,0.05)", border: "1px solid rgba(123,237,159,0.12)", borderRadius: 14, padding: 18, marginBottom: 16 },
  resetBtn: { width: "100%", padding: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#777", borderRadius: 12, fontSize: 14, cursor: "pointer" },
};

const st = document.createElement("style");
st.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
document.head.appendChild(st);
