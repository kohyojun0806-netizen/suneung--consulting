# Rollback Points

## Recommended Rollback Commits
- `4af32a7` 데이터 품질 필터 + 정제 데이터 반영
- `abda3a4` 불필요 핸드오프 산출물 정리
- `ebe082c` 트래커 UI/구조 정제

## How To Roll Back (Non-destructive)
1. 임시 브랜치 생성
   - `git checkout -b rollback-test`
2. 원하는 커밋 상태 확인
   - `git checkout <commit_sha> -- .`
3. 로컬 실행 점검 후 새 커밋
   - `git add -A && git commit -m "rollback to <sha> baseline"`

## Notes
- `git reset --hard` 대신 파일 단위 checkout 방식 사용 권장
- 배포 반영 전 `npm run build` + API 스모크 테스트 필수

