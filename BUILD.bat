@echo off
chcp 65001 >nul
title Heredit — Build

:: ── Auto-élévation en administrateur ──────────────────────────────
net session >nul 2>&1
if %errorLevel% neq 0 (
  echo Relancement en administrateur...
  powershell -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b
)

set GIT_BASH=
if exist "%ProgramFiles%\Git\bin\bash.exe"                   set "GIT_BASH=%ProgramFiles%\Git\bin\bash.exe"
if exist "%ProgramFiles(x86)%\Git\bin\bash.exe"              set "GIT_BASH=%ProgramFiles(x86)%\Git\bin\bash.exe"
if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe"          set "GIT_BASH=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
if exist "%USERPROFILE%\scoop\apps\git\current\bin\bash.exe" set "GIT_BASH=%USERPROFILE%\scoop\apps\git\current\bin\bash.exe"
if not defined GIT_BASH where bash >nul 2>&1 && set "GIT_BASH=bash"

if not defined GIT_BASH (
  echo [ERREUR] Git Bash introuvable.
  pause & exit /b 1
)

"%GIT_BASH%" --login -i -c "cd '%~dp0' && npm install && npm run build; read -p 'Appuyez sur Entree...'"
