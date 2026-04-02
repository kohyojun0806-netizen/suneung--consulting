# 데이터 수집 워크플로우 (정시 수학 컨설팅)

## 1) 소스 등록
`data/knowledge/sources.json`에 소스를 추가합니다.

핵심 필드:
- `type`: `youtube`, `youtube_playlist`, `community_column`, `community_review`, `official_curriculum`, `official_guideline`, `manual_text`
- `bucket`: `study_methods`, `lecture_books`, `learning_routines`
- `platform`: 예) `youtube`, `orbi`, `megastudy`, `sdij`, `dugak`
- `tags`: 분석 키워드 배열

## 2) 지식 베이스 생성
```bash
npm run ingest
```

생성 결과:
- `data/knowledge/knowledge_base.json`
- 각 item에 `bucket`, `applies_to`, `meta`가 저장됨

## 3) 추천/분석 반영
서버 분석 API:
- `POST /api/analyze`
- 입력: `currentGrade`, `targetGrade`, `electiveSubject`
- 출력: 현재 피드백 + 시기별 계획(3~6모, 6~9모, 9모~수능) + 강사/교재 추천

## 4) 누적 지도
트래커 API:
- `POST /api/tracker/report` (주간 리포트)
- `POST /api/tracker/consult` (질문형 코칭)

권장 운영:
- 주 1회 리포트 생성
- 오답/취약단원 로그를 반드시 기록
- 4주 단위로 루틴 수정

## 5) 품질 관리 체크
- 같은 내용 중복 소스는 `tags`로 구분 후 병합
- 커뮤니티 글은 과장/광고 가능성 고려해 공식 소스와 교차검증
- 강사 커리큘럼은 OT/공식 페이지 기준으로 우선 반영
