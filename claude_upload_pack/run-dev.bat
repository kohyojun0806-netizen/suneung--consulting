@echo off
cd /d %~dp0
start "suneung-api" cmd /k "set SERVER_PORT=8787&&node server\index.js"
start "suneung-web" cmd /k "set PORT=3000&&npm start"
echo [dev] api: http://localhost:8787
echo [dev] web: http://localhost:3000
