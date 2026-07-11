@echo off
title ARIA GO-LIVE
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\go-live.ps1"
echo.
pause
