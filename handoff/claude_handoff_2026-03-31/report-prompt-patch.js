// server/index.js — Sprint 31 patch: grade-band report prompt differentiation
// 3AGENT + GSD: ui-data-priority-20260330
// MERGE NOTE: 이 파일의 getReportSystemPrompt / getReportUserPrompt 함수를
// 기존 server/index.js의 /api/tracker/report 핸들러 안에 통합하세요.

// ─── Grade-band Prompt Builder ─────────────────────────────────────────────

/**
 * 목표 등급대에 따른 주간보고 시스템 프롬프트 반환
 * @param {string} targetGrade - '1' | '2-3' | '4+' | undefined
 * @returns {string}
 */
function getReportSystemPrompt(targetGrade) {
  const base = `당신은 수능 수학 전문 코치입니다. 
학생의 주간 학습 기록을 바탕으로 구체적이고 실행 가능한 피드백을 제공합니다.
근거 기반으로 답변하며, 막연한 격려보다 구체적인 개선 방향을 제시합니다.`;

  const gradeInstructions = {
    '1': `
[1등급 목표 학생 특화 지침]
- 변별력 문항(준킬러/킬러) 풀이 접근법에 집중하세요.
- 심화 사고력이 필요한 부분을 구체적으로 짚어주세요.
- 만점/1등급 경계에서 발생하는 실수 패턴에 주목하세요.
- 사설 모의고사와 수능 기출의 차이를 분석해주세요.
- 추가 N제나 심화 교재 제안 시 구체적 이유를 명시하세요.`,
    '2-3': `
[2~3등급 목표 학생 특화 지침]
- 취약 유형 보완과 실전 감각 향상을 균형 있게 다루세요.
- 빈출 유형에서 반복되는 실수 패턴을 분석하세요.
- 기본 개념 응용력과 계산 정확도를 함께 점검하세요.
- 시간 배분 전략과 문제 순서 전략을 포함하세요.
- 현실적인 1~2등급 도약 경로를 제시하세요.`,
    '4+': `
[4등급 이하 목표 학생 특화 지침]
- 기초 개념 완성과 반복 훈련을 최우선으로 강조하세요.
- 개념 이해 없이 문제만 푸는 패턴이 있다면 지적하세요.
- 쉬운 유형에서 점수를 확실히 확보하는 전략을 제시하세요.
- 동기 부여와 지속 가능한 학습 루틴에 대해 언급하세요.
- 단계적인 교재 진행 로드맵을 구체적으로 제시하세요.`,
  };

  const gradeInstruction = gradeInstructions[targetGrade] || gradeInstructions['2-3'];
  return `${base}\n${gradeInstruction}`;
}

/**
 * 주간보고 사용자 프롬프트 생성
 * @param {object} profile
 * @param {object} weekInput
 * @returns {string}
 */
function getReportUserPrompt(profile, weekInput) {
  const gradeBandLabel = {
    '1': '1등급',
    '2-3': '2~3등급',
    '4+': '4등급 이하',
  }[profile.targetGrade] || '2~3등급';

  const electiveLabel = {
    calculus: '미적분',
    probability: '확률과 통계',
    geometry: '기하',
  }[profile.elective] || profile.elective || '미선택';

  return `[학생 정보]
- 현재 등급: ${profile.currentGrade || '미입력'}
- 목표 등급: ${gradeBandLabel}
- 선택과목: ${electiveLabel}
- 주간 학습시간: ${profile.weeklyHours || '미입력'}시간

[이번 주 학습 내용]
${weekInput.completedTopics || '(미입력)'}

[어려웠던 점]
${weekInput.difficulties || '(미입력)'}

[모의고사 점수]
${weekInput.mockScore ? `${weekInput.mockScore}점` : '미입력'}

위 내용을 바탕으로 주간 학습 리포트를 작성해주세요.
다음 형식으로 답변해주세요:

1. **이번 주 학습 평가** (2~3문장)
2. **핵심 개선 포인트** (3개, 구체적으로)
3. **다음 주 학습 전략** (구체적 행동 계획)
4. **추천 학습 자료** (있다면 1~2개, 근거 포함)`;
}

// ─── Fallback Report Generator ─────────────────────────────────────────────

/**
 * AI 호출 실패 시 등급대별 기본 리포트 반환
 */
function getFallbackReport(profile, weekInput) {
  const targetGrade = profile.targetGrade || '2-3';
  const gradeBandLabel = { '1': '1등급', '2-3': '2~3등급', '4+': '4등급 이하' }[targetGrade];

  const templates = {
    '1': `[${gradeBandLabel} 목표 주간 리포트]

1. **이번 주 학습 평가**
이번 주 학습 내용을 성실하게 기록해주셨습니다. 1등급 목표를 위해서는 변별력 문항 대응력을 지속적으로 키우는 것이 핵심입니다.

2. **핵심 개선 포인트**
- 킬러/준킬러 문항에서 풀이 시간 단축 연습
- 고난도 빈출 유형의 풀이 패턴 체화
- 실수 유형 분류 노트 작성 권장

3. **다음 주 학습 전략**
기출 킬러 문항 5문제를 정해 각 30분 내 완전 풀이 목표로 연습하세요. 틀린 문제는 반드시 3가지 풀이법을 비교해보세요.

4. **추천 학습 자료**
시대인재 현장강의 교재 또는 최근 사설 모의고사 심화 편 풀이를 권장합니다.`,
    '2-3': `[${gradeBandLabel} 목표 주간 리포트]

1. **이번 주 학습 평가**
꾸준한 학습 기록을 남겨주셨습니다. 2~3등급에서 1등급으로 도약하기 위해서는 취약 유형을 체계적으로 공략하는 것이 중요합니다.

2. **핵심 개선 포인트**
- 어려웠던 유형의 개념부터 재점검
- 시간 배분 전략 수립 (쉬운 문제 먼저 확보)
- 주 2회 실전 시간 재기 연습

3. **다음 주 학습 전략**
틀린 문제 유형을 분류하고, 같은 유형 3문제씩 추가 풀이하세요. 모의고사 풀이 후 오답 분석 30분을 루틴으로 잡으세요.

4. **추천 학습 자료**
N제 교재를 활용한 유형별 집중 훈련을 권장합니다.`,
    '4+': `[${gradeBandLabel} 목표 주간 리포트]

1. **이번 주 학습 평가**
학습을 지속하고 있다는 것 자체가 중요합니다. 기초를 탄탄히 하는 것이 장기적으로 가장 효과적인 전략입니다.

2. **핵심 개선 포인트**
- 공식 암기보다 개념 원리 이해 우선
- 같은 유형 문제를 완전히 이해할 때까지 반복
- 일일 학습량 현실적으로 설정

3. **다음 주 학습 전략**
개념서 한 단원을 끝내고 기본 문제 5개씩 완전 이해 목표로 풀어보세요. 모르면 건너뛰지 말고 반드시 해결하고 넘어가세요.

4. **추천 학습 자료**
개념 중심 기본서(수학의 바이블, 개념원리 등) 1회독 완성을 먼저 권장합니다.`,
  };

  return templates[targetGrade] || templates['2-3'];
}

// ─── Express Route Patch ────────────────────────────────────────────────────
// 기존 server/index.js의 app.post('/api/tracker/report', ...) 핸들러를
// 아래와 같이 교체하세요:

/*
app.post('/api/tracker/report', async (req, res) => {
  const { profile = {}, weekInput = {} } = req.body;
  const targetGrade = profile.targetGrade || '2-3';

  try {
    if (!process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
      return res.json({ report: getFallbackReport(profile, weekInput) });
    }

    const systemPrompt = getReportSystemPrompt(targetGrade);
    const userPrompt = getReportUserPrompt(profile, weekInput);

    // OpenAI / AI SDK 호출 (기존 코드 구조 유지)
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const report = completion.choices[0]?.message?.content || getFallbackReport(profile, weekInput);
    res.json({ report });
  } catch (err) {
    console.error('[/api/tracker/report] error:', err.message);
    res.json({ report: getFallbackReport(profile, weekInput) });
  }
});
*/

module.exports = {
  getReportSystemPrompt,
  getReportUserPrompt,
  getFallbackReport,
};
