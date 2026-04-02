# Sprint Contract 33

Date: 2026-04-01
Project: ui-data-priority-20260330
Phase: 5 (UI Elevation · Strict Evaluator 97+)

## PLANER Scope

### P1. Landing Hero 강화
- 부유 Orb 애니메이션 (`floatOrb`) 적용
- CTA 버튼 gradient + shimmer 반짝임 강화
- 통계 숫자 gradient text 적용
- Story card 상단 accent 라인 + hover lift

### P2. 탭 Nav 애니메이션
- 활성 탭 indicator를 pill shape CSS 애니메이션으로 교체 (`scaleX + opacity`)
- `tab-nav__btn::after` pseudo element 기반 스프링 트랜지션

### P3. Book Card 레이아웃 개선
- 카드 hover 시 left accent stripe 노출 (`::before`)
- translateY(-3px) 리프트 + box-shadow 강화
- Tag 색상 hover 연동

### P4. Evidence Badge 마감
- 폰트 사이즈/weight 세밀 조정 (10px 700)
- hover glow 강화 (per-badge color)
- badge-source-link 타이포 개선

### P5. Design Token 정비
- `--gradient-cta`, `--gradient-title`, `--gradient-surface` 도입
- `--color-accent-deep` (8% opacity) 추가로 active state 일관화
- `--shadow-accent` 추가

## 완료 기준
- [x] Landing orb 애니메이션
- [x] CTA hover lift + glow
- [x] Tab nav animated pill indicator
- [x] Book card left accent stripe on hover
- [x] Badge hover glow per confidence type
- [x] Design token 일관성
- [x] Mobile 375px 대응 (landing story single col)

## 평가 기준 (100점)
| 항목 | 배점 |
|------|------|
| 시각적 독창성/완성도 | 40 |
| 컴포넌트 일관성 (토큰 사용) | 25 |
| 인터랙션 품질 (hover/transition) | 20 |
| 반응형 + 접근성 | 15 |
| **합계** | **100** |

## 프로세스 정책
- sandbox fallback pass 금지
- 최소 5회 반복, target score 97
- 문서 누락 금지
