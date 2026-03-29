# Project State

## Overview
- Service: `정시 수학 학습 컨설팅/트래커`
- Frontend: React (CRA)
- Backend: Express (`server/index.js`)
- Deploy:
  - Frontend: `https://suneung-consulting.vercel.app/`
  - Backend: Render (API base via `REACT_APP_API_BASE`)

## Core Flows
- 초기 설정: 현재 등급 / 목표 등급 / 선택과목
- 분석: `POST /api/analyze`
- 주간 리포트: `POST /api/tracker/report`
- AI 코치: `POST /api/tracker/consult`

## Key Data Files
- `data/knowledge/knowledge_base.json`
- `data/knowledge/recommendation_catalog.json`
- `data/knowledge/sources.json`

## Current Quality Guard
- 깨진 텍스트/무의미 텍스트 필터 강화
- 카탈로그 최소 개수 미달 시 기본 추천셋 보강
- 분석/리포트/상담 API fallback 유지

## Recent Stable Commit
- `4af32a7` improve: harden knowledge quality filters and refresh curated datasets

