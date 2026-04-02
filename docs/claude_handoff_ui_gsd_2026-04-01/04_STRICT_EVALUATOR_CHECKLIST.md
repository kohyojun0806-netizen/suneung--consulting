# Strict Evaluator Checklist

## Functional Contracts (must pass)
- [ ] 시작 버튼은 `시작하기` 텍스트로 접근 가능
- [ ] 온보딩 완료 후 `.plan-tab` 진입 가능
- [ ] 탭 이동: `프로필/플랜/주간보고/컨설팅` 정상 동작
- [ ] `로드맵 생성` 버튼 동작 유지
- [ ] `#currentGrade`, `#targetGrade`, `input[name="electiveVisible"]`, `#weeklyHours` 유지
- [ ] `.accordion-section` 3개 유지 + toggle 시 `aria-expanded` 변화
- [ ] `.book-card` 또는 `추천 교재 없음` 상태 정상
- [ ] `.evidence-badge` 렌더링 계약 유지
- [ ] `.badge-source-link` 외부 링크(`noopener`) 유지
- [ ] 주간보고 생성 후 `.report-result` 유지
- [ ] 컨설팅 생성 후 `.consult-result` 유지

## Visual Quality
- [ ] 랜딩, 탭, 카드, 폼이 같은 디자인 시스템으로 보임
- [ ] 과한 색/애니메이션/장식 없이 고급스럽고 안정적인 톤
- [ ] 타이포 계층 명확(제목/본문/메타)
- [ ] 간격 리듬 일관(섹션 간 호흡 동일)
- [ ] 카드 밀도와 정보 우선순위가 직관적

## Mobile Quality
- [ ] 375px/390px 폭에서 가로 스크롤 없음
- [ ] 탭 버튼, 칩, CTA 터치 영역 충분
- [ ] 텍스트 겹침/잘림 없음

## Verification Commands
```bash
npm run build
npx playwright test
```

