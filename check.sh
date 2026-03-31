#!/bin/bash
# validate-build.sh - Check all new/modified files exist and have valid syntax
# Usage: ./scripts/validate-build.sh

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 PocketDevAI Build Validator"
echo "==============================="

ERRORS=0
WARNINGS=0

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
    echo -e "  ${RED}✗${NC} $file ${YELLOW}(MISSING)${NC}"
    ((ERRORS++))
  fi
done

# === 2. Check for Common Syntax Errors ===
echo -e "\n🔧 Checking for common syntax issues..."

check_syntax_issues() {
  local file=$1
  local issues=0
  
  # Check for missing colons in object properties: "key value" instead of "key: value"
  if grep -nE '^\s*[a-zA-Z_][a-zA-Z0-9_]*\s+[A-Z][a-zA-Z_]' "$file" 2>/dev/null | grep -vE '(import|export|return|if|while|for|function|const|let|var)'; then
    echo -e "  ${YELLOW}⚠${NC} $file: Possible missing colon in object property"
    ((issues++))
  fi
  
  # Check for incomplete object syntax: "key {" instead of "key: {"
  if grep -nE '^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\{' "$file" 2>/dev/null | grep -vE '(function|if|while|for|switch|catch|class|interface|type)'; then
    echo -e "  ${YELLOW}⚠${NC} $file: Possible missing colon before object"
    ((issues++))
  fi
  
  # Check for trailing commas before closing braces (usually OK, but flag for review)
  # This is actually valid in modern JS, so just informational
  
  return $issues
}

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    check_syntax_issues "$file" || ((WARNINGS+=$?))
  fi
done

# === 3. Check Import Paths ===
echo -e "\n🔗 Checking import statements..."

check_imports() {
  local file=$1
  
  # Extract relative imports
  grep -oE "from ['\"]\.[^'\"]+['\"]" "$file" 2>/dev/null | while read -r import; do
    local path=$(echo "$import" | sed "s/from ['\"]//g; s/['\"]//g")
    local dir=$(dirname "$file")
    local resolved="$dir/$path"
    
    # Handle index files
    if [ ! -f "$resolved" ] && [ ! -f "$resolved.js" ] && [ ! -f "$resolved.ts" ] && [ ! -f "$resolved/index.js" ] && [ ! -f "$resolved/index.ts" ]; then
      # Check if it's a node module (doesn't start with .)
      if [[ "$path" == .* ]]; then
        echo -e "  ${RED}✗${NC} $file: Cannot resolve import $path"
        return 1
      fi
    fi
  done
}

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    check_imports "$file" || ((ERRORS++))
  fi
done

# === 4. Quick Node Syntax Check (if node available) ===
echo -e "\n⚡ Quick syntax validation with Node..."

if command -v node &> /dev/null; then
  for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
      # Use node --check for syntax validation (Node 10+)
      if node --check "$file" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $file: Syntax OK"
      else
        echo -e "  ${RED}✗${NC} $file: ${YELLOW}Syntax error detected${NC}"
        ((ERRORS++))
        # Show the error
        node --check "$file" 2>&1 | head -3 | sed 's/^/    /'
      fi
    fi
  done
else
  echo -e "  ${YELLOW}⚠${NC} Node not found, skipping syntax check"
  ((WARNINGS++))
fi

# === 5. Check for Export Statements ===
echo -e "\n📤 Checking exports..."

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    if grep -qE 'export (default|const|function|class|\{)' "$file"; then
      echo -e "  ${GREEN}✓${NC} $file: Has exports"
    else
      echo -e "  ${YELLOW}⚠${NC} $file: No exports found (may be intentional)"
      ((WARNINGS++))
   
