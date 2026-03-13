#!/bin/bash

export BAT_THEME="zenburn"

# Check if verbose mode is set (from parent script)
VERBOSE_MODE=${VERBOSE_MODE:-"false"}

# Configuration
CALM_HUB_URL="http://localhost:8085"
NAMESPACE="QCon"

# ANSI color codes
YELLOW='\033[0;33m'
YELLOW_BOLD='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

heading() {
    echo -e "${YELLOW_BOLD}${1}${NC}"
}

info() {
    echo -e "${YELLOW}${1}${NC}"
}

info_verbose() {
    if [ "$VERBOSE_MODE" == "true" ]; then
        echo -e "${YELLOW}${1}${NC}"
    fi
}

success() {
    echo -e "${GREEN}${1}${NC}"
}

error_msg() {
    echo -e "${RED}${1}${NC}"
}

stage() {
    echo ""
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}${BOLD}  ${1}${NC}"
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

section() {
    echo ""
    echo -e "${CYAN}${BOLD}▶ ${1}${NC}"
    echo ""
}

# Ensure we're in the scenario3 directory
cd "$(dirname "$0")"

# Clean up any previous generated files
if [ -d "generated-deployer" ]; then
    rm -rf generated-deployer
fi

# ============================================================================
# Prerequisite: CALM Hub Check
# ============================================================================

stage "Prerequisite: CALM Hub Connectivity"

info "Checking if CALM Hub is running..."
if curl -sf "${CALM_HUB_URL}/q/swagger-ui/" > /dev/null 2>&1; then
    success "✅ CALM Hub is accessible at ${CALM_HUB_URL}"
else
    error_msg "❌ CALM Hub is not accessible at ${CALM_HUB_URL}"
    echo ""
    echo "Please start CALM Hub:"
    echo "  cd calm-hub/deploy-qcon"
    echo "  docker-compose up"
    exit 1
fi
echo ""
echo "Press Enter to continue..."
read

# ============================================================================
# Step 1: Generate Deployer from Template Bundle
# ============================================================================

clear
stage "Step 1: Generate Deployer from Template Bundle"

if [ "$VERBOSE_MODE" == "true" ]; then
    info "📖 About Template Bundles:"
    echo "   • Template bundles contain reusable deployer patterns"
    echo "   • calm template generates customized deployers"
    echo "   • Each deployer enforces governance through validation gates"
    echo ""
fi

heading "Template Bundle: bundle"
echo ""

info "Running: calm template --architecture calm/qcon.architecture.json --bundle bundle --output generated-deployer"
echo ""

# Run calm template silently, only show errors if it fails
if calm template --architecture calm/qcon.architecture.json --bundle bundle --output generated-deployer > /dev/null 2>&1; then
    success "✅ Deployer generated in: generated-deployer/"
else
    error_msg "❌ Failed to generate deployer"
    exit 1
fi
echo ""

info "Generated structure:"
echo ""
tree generated-deployer 2>/dev/null || find generated-deployer -print | sed -e 's;[^/]*/;|____;g;s;____|; |;g'
echo ""

# echo "Press Enter to examine the deployer..."
# read

# clear
# section "Examining Deployer Script"

# if [ "$VERBOSE_MODE" == "true" ]; then
#     heading "Key Functions in deployer.sh"
#     echo ""
# fi

# info "Let's look at Gate 1 implementation..."
# echo ""
# echo -e "${YELLOW}> bat generated-deployer/deployer.sh --line-range 91:149${NC}"
# bat generated-deployer/deployer.sh --line-range 91:149 --language bash 2>/dev/null || \
#     sed -n '91,149p' generated-deployer/deployer.sh
# echo ""

echo "Press Enter to test the deployer gates..."
read

# ============================================================================
# Gate 1: Pattern Registration Check
# ============================================================================

clear
stage "Gate 1: Pattern Registration Check"

if [ "$VERBOSE_MODE" == "true" ]; then
    info "📖 What this gate checks:"
    echo "   • Architecture references a pattern (via \$schema field)"
    echo "   • Pattern is registered in CALM Hub"
    echo "   • This ensures only approved patterns are used"
    echo ""
fi
echo "Press Enter to test with architecture using UNAPPROVED pattern..."
read

clear
section "❌ Testing Gate 1 with Unapproved Pattern"

heading "Architecture: qcon.architecture.json"
echo ""

info "Looking at the architecture's \$schema field..."
echo ""
echo -e "${YELLOW}> bat calm/qcon.architecture.json --line-range 1:10${NC}"
bat calm/qcon.architecture.json --line-range 1:10 --language json 2>/dev/null || \
    jq '. | {"$schema": ."$schema", "title": .title}' calm/qcon.architecture.json
echo ""

info "Extracting pattern name from \$schema field..."
PATTERN_NAME_BAD=$(jq -r '.["$schema"] // empty' calm/qcon.architecture.json | sed 's/.*\///;s/\.pattern\.json$//')

if [ -z "$PATTERN_NAME_BAD" ]; then
    error_msg "❌ No pattern found in architecture"
    exit 1
fi

echo "Pattern referenced: ${PATTERN_NAME_BAD}"
echo ""

info "Checking CALM Hub for pattern '${PATTERN_NAME_BAD}'..."
PATTERNS_RESPONSE=$(curl -s "${CALM_HUB_URL}/calm/namespaces/${NAMESPACE}/patterns" 2>/dev/null || echo "[]")

if [ -z "$PATTERNS_RESPONSE" ] || [ "$PATTERNS_RESPONSE" = "[]" ]; then
    error_msg "❌ Cannot retrieve patterns from CALM Hub"
    exit 1
fi

PATTERN_IDS=$(echo "$PATTERNS_RESPONSE" | jq -r '.values[]' 2>/dev/null)
PATTERN_FOUND=""

for pattern_id in $PATTERN_IDS; do
    PATTERN_DATA=$(curl -s "${CALM_HUB_URL}/calm/namespaces/${NAMESPACE}/patterns/${pattern_id}/versions/1.0.0" 2>/dev/null)
    EXTRACTED_NAME=$(echo "$PATTERN_DATA" | jq -r '."$id"' 2>/dev/null | xargs basename 2>/dev/null | sed 's/.pattern.json//')
    
    if [ "$EXTRACTED_NAME" = "$PATTERN_NAME_BAD" ]; then
        PATTERN_FOUND="yes"
        break
    fi
done

if [ -n "$PATTERN_FOUND" ]; then
    success "✅ Pattern found in CALM Hub"
else
    error_msg "❌ GATE 1 REJECTED: Pattern '${PATTERN_NAME_BAD}' NOT FOUND in CALM Hub"
    echo ""
    if [ "$VERBOSE_MODE" == "true" ]; then
        info "Governance requirement: Teams must use pre-approved patterns"
        info "Why it failed: The 'qcon' pattern is not registered as an approved pattern"
    fi
fi

echo ""
echo "Press Enter to fix by using an approved pattern..."
read

clear
section "✅ Testing Gate 1 with Approved Pattern"

heading "Architecture: trades-api-and-mcp-conforming.architecture.json"
echo ""

info "Looking at the architecture's \$schema field..."
echo ""
echo -e "${YELLOW}> bat calm/trades-api-and-mcp-conforming.architecture.json --line-range 1:10${NC}"
bat calm/trades-api-and-mcp-conforming.architecture.json --line-range 1:10 --language json 2>/dev/null || \
    jq '. | {"$schema": ."$schema", "title": .title}' calm/trades-api-and-mcp-conforming.architecture.json
echo ""

info "Extracting pattern name from \$schema field..."
PATTERN_NAME=$(jq -r '.["$schema"] // empty' calm/trades-api-and-mcp-conforming.architecture.json | sed 's/.*\///;s/\.pattern\.json$//')

if [ -z "$PATTERN_NAME" ]; then
    error_msg "❌ No pattern found in architecture"
    exit 1
fi

echo "Pattern referenced: ${PATTERN_NAME}"
echo ""

info "Checking CALM Hub for pattern '${PATTERN_NAME}'..."
PATTERNS_RESPONSE=$(curl -s "${CALM_HUB_URL}/calm/namespaces/${NAMESPACE}/patterns" 2>/dev/null || echo "[]")

if [ -z "$PATTERNS_RESPONSE" ] || [ "$PATTERNS_RESPONSE" = "[]" ]; then
    error_msg "❌ Cannot retrieve patterns from CALM Hub"
    exit 1
fi

PATTERN_IDS=$(echo "$PATTERNS_RESPONSE" | jq -r '.values[]' 2>/dev/null)
PATTERN_FOUND=""

for pattern_id in $PATTERN_IDS; do
    PATTERN_DATA=$(curl -s "${CALM_HUB_URL}/calm/namespaces/${NAMESPACE}/patterns/${pattern_id}/versions/1.0.0" 2>/dev/null)
    EXTRACTED_NAME=$(echo "$PATTERN_DATA" | jq -r '."$id"' 2>/dev/null | xargs basename 2>/dev/null | sed 's/.pattern.json//')
    
    if [ "$EXTRACTED_NAME" = "$PATTERN_NAME" ]; then
        PATTERN_FOUND="yes"
        break
    fi
done

if [ -n "$PATTERN_FOUND" ]; then
    success "✅ GATE 1 PASSED: Pattern '${PATTERN_NAME}' found in CALM Hub"
    if [ "$VERBOSE_MODE" == "true" ]; then
        info "   Pattern is registered in namespace: ${NAMESPACE}"
    fi
else
    error_msg "❌ GATE 1 REJECTED: Pattern '${PATTERN_NAME}' NOT FOUND in CALM Hub"
    echo ""
    if [ "$VERBOSE_MODE" == "true" ]; then
        info "Why it failed: The 'trades-api-and-mcp' pattern is not registered as an approved pattern"
        info "Teams must fix their architecture to use an approved pattern"
    fi
fi

echo ""
echo "Press Enter to move to Gate 2..."
read

# ============================================================================
# Gate 2: Architecture Control Validation
# ============================================================================

clear
stage "Gate 2: Architecture Control Validation"

if [ "$VERBOSE_MODE" == "true" ]; then
    info "📖 What this gate checks:"
    echo "   • Architecture conforms to pattern requirements"
    echo "   • All required controls are present"
    echo "   • Pattern-specific rules are satisfied"
    echo ""
fi
echo "Press Enter to test with architecture MISSING CONTROLS..."
read

clear
section "❌ Testing Gate 2 with Non-Conforming Architecture"

heading "Architecture: trades-api-and-mcp-non-conforming.architecture.json"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "This architecture is MISSING the 'permitted-connection' control"
fi
echo ""

info "Let's review the complete architecture to see all nodes, relationships, and controls..."
echo ""
echo -e "${YELLOW}> bat calm/trades-api-and-mcp-non-conforming.architecture.json${NC}"
echo ""
bat calm/trades-api-and-mcp-non-conforming.architecture.json --language json 2>/dev/null || \
    jq -C '.' calm/trades-api-and-mcp-non-conforming.architecture.json
echo ""

error_msg "⚠️  Notice: The 'mcp-client-to-mcp-server' relationship (line ~88) has NO controls!"
error_msg "   Pattern requires 'permitted-connection' control on all connections"
echo ""

info "Running CALM validation..."
echo "" 

# Extract pattern file path from $schema  
PATTERN_NAME_NONCONF=$(jq -r '.["$schema"] // empty' calm/trades-api-and-mcp-non-conforming.architecture.json | sed 's/.*\///;s/\.pattern\.json$//')
PATTERN_FILE_NONCONF="calm/${PATTERN_NAME_NONCONF}.pattern.json"

if calm validate --pattern "$PATTERN_FILE_NONCONF" --architecture calm/trades-api-and-mcp-non-conforming.architecture.json 2>&1; then
    success "Validation passed (unexpected)"
else
    error_msg "❌ GATE 2 REJECTED: Architecture does not conform to pattern"
fi

echo ""
echo "Press Enter to fix the architecture..."
read

clear
section "✅ Testing Gate 2 with Conforming Architecture"

heading "Architecture: trades-api-and-mcp-conforming.architecture.json"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "This architecture HAS all required controls"
fi
echo ""

info "Let's review the complete architecture to see all nodes, relationships, and controls..."
echo ""
echo -e "${YELLOW}> bat calm/trades-api-and-mcp-conforming.architecture.json${NC}"
echo ""
bat calm/trades-api-and-mcp-conforming.architecture.json --language json 2>/dev/null || \
    jq -C '.' calm/trades-api-and-mcp-conforming.architecture.json
echo ""

success "✅ Notice: All relationships now include the required 'permitted-connection' control"
echo ""

info "Running CALM validation..."
echo ""

# Extract pattern file path from $schema of conforming architecture
PATTERN_NAME_CONF=$(jq -r '.["$schema"] // empty' calm/trades-api-and-mcp-conforming.architecture.json | sed 's/.*\///;s/\.pattern\.json$//')
PATTERN_FILE_CONF="calm/${PATTERN_NAME_CONF}.pattern.json"

if calm validate --pattern "$PATTERN_FILE_CONF" --architecture calm/trades-api-and-mcp-conforming.architecture.json 2>&1; then
    success "✅ GATE 2 PASSED: Architecture conforms to pattern"
else
    error_msg "Validation failed (unexpected)"
fi

echo ""
success "✅ BOTH GATES PASSED"
echo ""
echo "Press Enter to see summary..."
read

# ============================================================================
# Summary
# ============================================================================

clear
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   ✓ Scenario 3 Complete!                          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}✅ Gate 1: Pattern Registration - PASSED${NC}"
echo -e "${GREEN}✅ Gate 2: Architecture Control Validation - PASSED${NC}"
echo ""