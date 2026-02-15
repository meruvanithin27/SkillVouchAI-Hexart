#!/bin/bash

echo "🚀 SkillVouchAI GitHub Push Script"
echo "=================================="
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GitHub token"
    echo "Usage: ./PUSH_WITH_TOKEN.sh your_github_token"
    echo ""
    echo "To get a token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token"
    exit 1
fi

TOKEN="$1"
REPO_URL="https://meruvanithin27:$TOKEN@github.com/meruvanithin27/SkillVouchAI-Hexart.git"

echo "🔧 Setting remote with token..."
git remote set-url origin $REPO_URL

echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Project pushed to GitHub!"
    echo "🌐 Repository: https://github.com/meruvanithin27/SkillVouchAI-Hexart"
    echo ""
    echo "🔒 Cleaning up token from remote URL..."
    git remote set-url origin https://github.com/meruvanithin27/SkillVouchAI-Hexart.git
    echo "✅ Token removed from Git config"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. Token is valid and has 'repo' scope"
    echo "2. Repository exists"
    echo "3. You have push permissions"
fi
