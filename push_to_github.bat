@echo off
echo 🚀 SkillVouchAI GitHub Push Script
echo ==================================
echo.
echo Step 1: Get your Personal Access Token
echo --------------------------------------
echo 1. Go to: https://github.com/settings/tokens
echo 2. Click 'Generate new token (classic)'
echo 3. Select scopes: repo (full control)
echo 4. Copy the generated token
echo.
echo Step 2: Enter your token below
echo ---------------------------------
set /p token="Enter your GitHub Personal Access Token: "
echo.
echo Step 3: Pushing to GitHub...
echo ------------------------------
git remote set-url origin https://meruvanithin27:%token%@github.com/meruvanithin27/SkillVouchAI.git
git push -u origin main
echo.
echo ✅ Push complete! Visit: https://github.com/meruvanithin27/SkillVouchAI
pause
