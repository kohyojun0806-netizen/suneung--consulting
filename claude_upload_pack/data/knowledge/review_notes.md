# 운영자 검토 메모 (2026-03-27)

## 1) 등급별 학습법 반영 상태

- `9-7`: 개념 입력형 학습을 출력형(백지복습/설명)으로 전환
- `7-5`: 개념 기간을 제한하고 기출 적용량을 늘리는 구조
- `5-3`: 준킬러에서 시나리오 매핑(조건 해석 우선) 강조
- `3-1`: 킬러 독립 접근(최소 40분) + 실모 원인분류로 안정화

원본 데이터:
- `data/knowledge/grade_study_methods.json`
- `data/knowledge/knowledge_base.json`

## 2) 강사-커리큘럼 매칭 교정

- 교정: `미친개념`은 `김범준`이 아니라 `이미지`로 매칭
- 반영 파일:
  - `src/suneung-curriculum-v5.jsx`
  - `data/knowledge/instructor_curriculum_map.json`

## 3) 소스 목록

- 로컬 유튜브 자막:
  - `data/subs/이거 딱 2개만 하면 '수학 재능'이 바뀐다 ｜ 수학 만점자 공부법.en.srt`
- 오르비 칼럼:
  - `https://orbi.kr/00073261962`
  - `https://orbi.kr/00077975282/[칼럼]-수학-문제를-대하는-태도`
- 공식 페이지:
  - `https://www.sdij.com/aca/schd/`
  - `https://bundangdugak.dshw.co.kr/teacher/teacher.htm?subject=2`

## 4) 직접 수정 포인트(운영자)

- `grade_study_methods.json`의 단계별 액션이 과한지/약한지
- `instructor_curriculum_map.json`의 강사별 코스명 정확도
- `knowledge_base.json`의 문장 톤(너무 길거나 추상적이면 축약)
