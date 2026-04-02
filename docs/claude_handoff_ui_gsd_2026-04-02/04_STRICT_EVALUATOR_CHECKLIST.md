# Strict Evaluator Checklist (UI Sprint)

## Regression Contracts
- [ ] 시작하기 버튼으로 온보딩 진입 가능
- [ ] 로드맵 생성 후 `.plan-tab` 진입
- [ ] 탭 이동(프로필/플랜/주간보고/컨설팅) 정상
- [ ] `.accordion-section` 개수 3 유지
- [ ] `추천 교재 없음` fallback 계약 유지
- [ ] `.evidence-badge` / `.badge-source-link` 계약 유지
- [ ] 모바일 overflow 없음 (375, 390 기준)

## Cohesion Quality
- [ ] 랜딩과 앱 본문이 동일 제품 톤으로 보임
- [ ] CTA/카드/폼/타이포의 시각 문법이 일관됨
- [ ] 색/효과 과잉 없이 고급스럽고 명확함

## Success-case Quality
- [ ] 랜딩에서 성공사례 스냅샷 노출
- [ ] 플랜에서 성공사례 패턴 노출
- [ ] 사례 텍스트가 행동 지침으로 읽힘

## Command Gates
```bash
npm run verify:ingest
npm run verify:catalog -- --strict
npm run build
npx playwright test
npm run gsd:verify-work -- --project ui-data-priority-20260330 --strict-evaluator true --with-e2e true --sandbox-fallback false
```

