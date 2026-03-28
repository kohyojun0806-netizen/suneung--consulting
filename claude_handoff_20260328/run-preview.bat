@echo off
cd /d %~dp0
set PREVIEW_PORT=3001
echo [preview] starting at http://localhost:%PREVIEW_PORT%
node server\preview.js
