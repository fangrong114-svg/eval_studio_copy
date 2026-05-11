@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" -OpenBrowser
if errorlevel 1 (
  echo.
  echo Local start failed. See .codex-vite.out.log and .codex-vite.err.log.
)
pause
