@echo off
REM One-command production deploy for the Spectra landing page.
REM Requires the Vercel CLI to be authenticated once (vercel login).
REM After that, double-clicking this file redeploys with no prompts.
cd /d "%~dp0"
vercel deploy --prod --yes
pause
