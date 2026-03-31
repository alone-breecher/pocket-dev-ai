#!/bin/bash
# check.sh - PocketDevAI Build Validator (Fixed Version)
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 PocketDevAI Build Validator"
echo "==============================="

ERRORS=0

# === 1. Check Required Files Exist ===
echo -e "\n📁 Checking required files..."
REQUIRED_FILES=(
  "src/services/OllamaService.js"
  "src/services/ModelRouter.js"
  "src/services/AgentService.js"
  "src/services/SkillsService.js"
  "src/hooks/useChat.js"
  "src/screens/ChatScreen.js"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (MISSING)"
    ((ERRORS++))
  fi
done

# === 2. Node Syntax Check ===
echo -e "\n⚡ Syntax validation with Node..."
if command -v node &> /dev/null; then
  for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
      if node --check "$file" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $file: Syntax OK"
      else
        echo -e "  ${RED}✗${NC} $file: Syntax error"
        node --check "$file" 2>&1 | head -2 | sed 's/^/    /'
        ((ERRORS++))
      fi
    fi
  done
else
  echo -e "  ${YELLOW}⚠${NC} Node not found, skipping syntax check"
fi

# === 3. Check Critical Imports ===
echo -e "\n🔗 Checking critical imports..."
if grep -q "from './ModelRouter'" src/services/AgentService.js 2>/dev/null; then
  if [ -f "src/services/ModelRouter.js" ]; then
    echo -e "  ${GREEN}✓${NC} ModelRouter import resolves"
  else
    echo -e "  ${RED}✗${NC} ModelRouter.js missing but imported"
    ((ERRORS++))
  fi
fi

if grep -q "from './SkillsService'" src/services/AgentService.js 2>/dev/null; then
  if [ -f "src/services/SkillsService.js" ]; then
    echo -e "  ${GREEN}✓${NC} SkillsService import resolves"
  else
    echo -e "  ${RED}✗${NC} SkillsService.js missing but imported"
    ((ERRORS++))
  fi
fi

# === Summary ===
echo -e "\n==============================="
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! Ready to build.${NC}"
  echo -e "\n💡 Next: git add . && git commit -m 'fix: services' && git push"
  exit 0
else
  echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
  exit 1
fi
