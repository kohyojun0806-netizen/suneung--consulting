# Suneung Roadmap App (Operator Pretrained)

Users do not train the system directly.
You (operator) ingest sources in advance, then users only consume generated roadmaps.

## Flow

1) Operator ingest (`npm run ingest`)
- Register sources in `data/knowledge/sources.json`
- Supported source types:
  - `youtubeUrl` (single video)
  - `playlistUrl` (expand to all playlist videos)
  - `webUrl` (page text + optional image VLM)
  - `subtitlePath` (local subtitle file)
  - `transcript` (manual text)
- Output: `data/knowledge/knowledge_base.json`

2) User service (`npm run server`, `npm start`)
- User inputs current/target grades only
- Server generates curriculum from knowledge base

## .env

```env
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4.1-mini
SERVER_PORT=8787
FRONTEND_ORIGIN=http://localhost:3000

KNOWLEDGE_FILE=data/knowledge/knowledge_base.json
KNOWLEDGE_SOURCES_FILE=data/knowledge/sources.json

YTDLP_SUB_LANGS=ko.*,ko
YTDLP_RETRIES=5
YTDLP_SLEEP_REQUESTS=1
YTDLP_COOKIES_FILE=
YTDLP_PLAYLIST_MAX=0
YTDLP_VIDEO_FORMAT=best[height<=480]/best

INGEST_USE_THUMBNAIL=false
INGEST_USE_VIDEO_FRAMES=true
VIDEO_FRAME_INTERVAL_SECONDS=60
VIDEO_FRAME_MAX_COUNT=6
FFMPEG_PATH=

WEB_MAX_IMAGES=3
WEB_TEXT_MAX_CHARS=30000
```

`YTDLP_PLAYLIST_MAX=0` means no limit (all videos in playlist).

## sources.json example

```json
[
  {
    "id": "yt-01",
    "title": "YouTube Single Video",
    "youtubeUrl": "https://www.youtube.com/watch?v=...",
    "includeVideoFrames": true
  },
  {
    "id": "yt-playlist-01",
    "title": "YouTube Playlist",
    "playlistUrl": "https://www.youtube.com/playlist?list=PL...",
    "includeVideoFrames": true
  },
  {
    "id": "web-01",
    "title": "Web Study Page",
    "webUrl": "https://example.com/math-study",
    "includeImages": true
  },
  {
    "id": "text-01",
    "title": "Manual Transcript",
    "transcript": "Concepts must be converted from input to output practice..."
  }
]
```

## Commands

```bash
npm run ingest
npm run server
npm start
```

## Notes

- If YouTube returns 429, increase `YTDLP_SLEEP_REQUESTS` and retry later.
- If `ffmpeg` is missing, frame-VLM is skipped automatically.
- OpenAI quota errors will trigger fallback logic, but quality improves when quota is available.

## Continue In Claude

- Open this project folder in Claude Code.
- Claude context file: `CLAUDE.md`
- Copy/paste starter prompt: `docs/claude_start_prompt.txt`
- Security: keep `.env` private and never share API keys in chat.
