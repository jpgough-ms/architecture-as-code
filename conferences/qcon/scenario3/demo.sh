#!/bin/bash

export BAT_THEME="zenburn"

# Check if verbose mode is set (from parent script)
VERBOSE_MODE=${VERBOSE_MODE:-"true"}

# ANSI color codes
YELLOW='\033[0;33m'
YELLOW_BOLD='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

heading() {
    local text=$1
    echo -e "${YELLOW_BOLD}${text}${NC}\n"
}

info() {
    local text=$1
    echo -e "${YELLOW}${text}${NC}\n"
}

run_command() {
    local text=$1
    echo -e "${GREEN}> ${text}${NC}"
}

run_command_verbose() {
    local text=$1
    if [ "$VERBOSE_MODE" == "true" ]; then
        echo -e "${GREEN}> ${text}${NC}"
    fi
}

error_msg() {
    local text=$1
    echo -e "${RED}${text}\033[0m\n"
}

success() {
    local text=$1
    echo -e "${GREEN}${text}${NC}\n"
}

stage() {
    local text=$1
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  ${text}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Ensure we're in the scenario3 directory
cd "$(dirname "$0")"


if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${CYAN}� Mode: Story (commands + explanations)${NC}"
else
    echo -e "${CYAN}⚡ Mode: Concise (commands only)${NC}"
fi
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${CYAN}📈 The Challenge:${NC}"
    echo "   200+ API teams need to deploy the Trades API with MCP support."
    echo "   Each deployment must meet security standards."
    echo ""
    echo -e "${RED}The Old Way:${NC}"
    echo "   • Architecture review meeting (2 weeks wait)"
    echo "   • Security team approval (1 week wait)"
    echo "   • Manual configuration verification"
    echo "   • Result: 3+ weeks per deployment, governance becomes a bottleneck"
    echo ""
    echo -e "${GREEN}The Architecture as Code Way:${NC}"
    echo "   • Governance requirements codified in CALM patterns"
    echo "   • Automated validation gates (instant feedback)"
    echo "   • Self-service compliance checking"
    echo "   • Result: Teams move fast, governance scales, security measurable"
fi
echo ""
echo -e "${YELLOW}This demo shows three governance gates:${NC}"
echo -e "${YELLOW}   Gate 1:${NC} Pattern Validation (architecture must follow approved patterns from CALM Hub)"
echo -e "${YELLOW}   Gate 2:${NC} Infrastructure Requirements (secure cluster, network segmentation)"
echo -e "${YELLOW}   Gate 3:${NC} Architecture Controls (micro-segmentation, permitted connections, MCP guardrails)"
echo ""
echo ""
echo "Press Enter to begin..."
read

# ============================================================================
# Attempt 1: Pattern not in CALM Hub
# ============================================================================

clear
stage "Attempt 1 — First Deployment Try"

heading " Gate 1: Pattern Validation"
info "Checking if pattern is registered in CALMHub, central artifact store..."
# run_command "curl http://localhost:8080/calm/namespaces/qcon2026/patterns"
echo ""

# Check if pattern exists in CALM Hub
EXISTING_PATTERNS=$(curl -s http://localhost:8080/calm/namespaces/qcon2026/patterns 2>/dev/null)
if echo "$EXISTING_PATTERNS" | grep -q "Trades API and MCP Pattern"; then
    success "✅ Pattern found in CALM Hub (namespace: qcon2026)"
    info "Pattern is centrally managed - all 200+ teams reference the same validated pattern"    
else
    error_msg "❌ GATE 1 REJECTED: Pattern 'Trades API and MCP Pattern' not found in CALM Hub"
    if [ "$VERBOSE_MODE" == "true" ]; then
        info "Governance requirement: All patterns must be pre-approved and registered"
        info "Why this matters: Prevents teams from creating one-off architectures that bypass platform standards"
    fi
fi
echo ""
echo "Press Enter to continue..."
read

# ============================================================================
# Attempt 2: Use approved pattern from CALM Hub
# ============================================================================

clear
stage "Attempt 2 — Use Approved Pattern"

heading "🔄 Switch to Approved Pattern"
info "Team reviews available patterns in CALM Hub..."
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Found approved pattern: ID=2, version=1.0.0 (Trades API & MCP Pattern)"
else
    info "Found: 'Trades API & MCP Pattern' (ID=2, v1.0.0)"
fi
# echo ""
# run_command "curl http://localhost:8080/calm/namespaces/qcon2026/patterns/2/versions/1.0.0"
# echo ""

# Fetch pattern from CALM Hub
PATTERN_RESPONSE=$(curl -s http://localhost:8080/calm/namespaces/qcon2026/patterns/2/versions/1.0.0 2>/dev/null)
if [ -n "$PATTERN_RESPONSE" ] && echo "$PATTERN_RESPONSE" | grep -q "patternId"; then
    success "✅ GATE 1 PASSED: Pattern retrieved from CALM Hub"
    if [ "$VERBOSE_MODE" == "true" ]; then
        info "This architecture follows an approved pattern (namespace: qcon2026, patternId: 2)"
        info "Team can proceed to infrastructure validation"
    fi
fi
echo ""
echo "Press Enter to continue..."
read

clear
heading "📦 Generate Deployment Scripts"
info "Pattern approved - generating deployment resources..."
run_command "calm template --architecture calm/trades-api-and-mcp-conforming.architecture.json --bundle bundle --output generated"
calm template \
  --architecture calm/trades-api-and-mcp-conforming.architecture.json \
  --output generated \
  --bundle bundle \
  --clear-output-directory > /dev/null 2>&1
cp generated/deployer.sh . && chmod +x deployer.sh
echo ""
success "✅ Generated deployment resources:"
run_command "tree generated"
tree generated
echo ""
echo "Press Enter to continue..."
read

# ============================================================================
# Attempt 3: Deploy without meeting infrastructure requirements
# ============================================================================

clear
stage "Attempt 3 — Infrastructure Validation"

heading "🚦 Gate 2: Infrastructure Requirements"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Checking if cluster meets security requirements..."
    run_command_verbose "bash deployer.sh"
    echo ""
fi
bash deployer.sh || true
echo ""
error_msg "❌ GATE 2 REJECTED: Secure cluster profile required"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Why it failed: Cluster must have network segmentation enabled (Calico CNI)"
    info "Impact: Without automated gates, this would slip through to production"
fi
echo "Press Enter to continue..."
read

# ============================================================================
# Attempt 4: Fix infrastructure
# ============================================================================

clear
stage "Attempt 4 — Fix Infrastructure"

if [ "$VERBOSE_MODE" == "true" ]; then
    heading "🔧 Remediate Infrastructure"
    info "Team switches to secure cluster with network segmentation..."
    run_command_verbose "minikube stop --profile insecure && minikube start --profile secure --cni calico"
    minikube stop --profile insecure > /dev/null 2>&1
    minikube start --profile secure --cni calico > /dev/null 2>&1
    minikube profile secure > /dev/null 2>&1
    success "Secure cluster with Calico CNI ready (profile: secure)"
else
    heading "🔧 Remediate Infrastructure"
    info "⚙️  Switching to secure cluster with Calico CNI..."
    minikube stop --profile insecure > /dev/null 2>&1
    minikube start --profile secure --cni calico > /dev/null 2>&1
    minikube profile secure > /dev/null 2>&1
    success "✓ Secure cluster ready (profile: secure)"
    echo ""
fi
echo "Press Enter to continue..."
read

clear
heading "📦 Regenerate Deployment"
run_command "calm template --architecture calm/trades-api-and-mcp-conforming.architecture.json --bundle bundle --output generated"
calm template \
  --architecture calm/trades-api-and-mcp-conforming.architecture.json \
  --output generated \
  --bundle bundle \
  --clear-output-directory > /dev/null 2>&1
cp generated/deployer.sh . && chmod +x deployer.sh
echo ""
success "✅ Generated deployment resources:"
run_command "tree generated"
tree generated
echo ""
echo "Press Enter to continue..."
read

clear

heading "🚦 Gate 2: Infrastructure Requirements - Retry"
if [ "$VERBOSE_MODE" == "true" ]; then
    run_command_verbose "bash deployer.sh"
    echo ""
fi
bash deployer.sh
echo ""
success "✅ GATE 2 PASSED: Infrastructure approved"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Team fixed infrastructure in minutes with instant feedback"
    info "No waiting for architecture review meeting"
    echo "Press Enter to continue..."
    read
fi

# ============================================================================
# Attempt 5: Architecture missing required controls
# ============================================================================

clear
stage "Attempt 5 — Architecture Controls Validation"

heading "🚦 Gate 3: Architecture Controls"
info "Our pattern enforces three control types:"
echo -e "${CYAN}  1. micro-segmentation${NC} on k8s-cluster (netsec-001)"
echo -e "${CYAN}  2. permitted-connection${NC} on all relationships (netsec-002)"
echo -e "${CYAN}  3. mcp-guardrail${NC} on mcp-server (mcp-001)"
echo ""
echo "Press Enter to examine these control requirements..."
read
echo ""
info "Let's examine these control requirements..."
echo ""
echo -e "${CYAN}═══ Control 1: micro-segmentation.requirement.json ═══${NC}"
cat calm/controls/micro-segmentation.requirement.json | bat --language json --style=plain --color=always
echo ""
echo "Press Enter to continue..."
read
echo ""
echo -e "${CYAN}═══ Control 2: permitted-connection.requirement.json ═══${NC}"
cat calm/controls/permitted-connection.requirement.json | bat --language json --style=plain --color=always
echo ""
echo "Press Enter to continue..."
read
echo ""
echo -e "${CYAN}═══ Control 3: mcp-guardrail.requirement.json ═══${NC}"
cat calm/controls/mcp-guardrail.requirement.json | bat --language json --style=plain --color=always
echo ""
echo "Press Enter to continue..."
read
echo ""

clear
info "Validating architecture against pattern requirements..."

heading "📋 Validate Architecture"
run_command "calm validate --pattern calm/trades-api-and-mcp.pattern.json --architecture calm/trades-api-and-mcp-non-conforming.architecture.json --format json"
echo ""
calm validate \
  --pattern calm/trades-api-and-mcp.pattern.json \
  --architecture calm/trades-api-and-mcp-non-conforming.architecture.json \
  --format json 2>&1 | bat --language json --style=plain --color=always || true
echo ""
error_msg "❌ GATE 3 REJECTED: Missing permitted-connection control"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Violation: /relationships/0 (mcp-client-to-mcp-server) lacks required control"
    info "The old way: Wait days for security review to catch this"
    info "The new way: Instant feedback, team can fix immediately"
else
    info "Violation: Missing permitted-connection on mcp-client-to-mcp-server relationship"
fi
# echo ""
# info "Let's compare the control declarations..."
# echo ""
# echo -e "${RED}Non-Conforming Architecture:${NC} (missing control on first relationship)"
# echo -e "${CYAN}  relationships[0] mcp-client-to-mcp-server: NO controls declared ❌${NC}"
# echo -e "${CYAN}  relationships[1] mcp-server-to-trades-api: permitted-connection ✓${NC}"
# echo ""
# echo -e "${GREEN}Conforming Architecture:${NC} (all connection relationships have controls)"
# echo -e "${CYAN}  relationships[0] mcp-client-to-mcp-server: permitted-connection ✓${NC}"
# echo -e "${CYAN}  relationships[1] mcp-server-to-trades-api: permitted-connection ✓${NC}"
# echo ""
# info "Additionally:"
# echo -e "${CYAN}  • mcp-server node: mcp-guardrail control ✓${NC}"
# echo -e "${CYAN}  • k8s-cluster node: micro-segmentation control ✓${NC}"
# echo ""
# echo "Press Enter to continue..."
# read

# ============================================================================
# Attempt 6: Fully conforming architecture
# ============================================================================

clear
stage "Attempt 6 — Complete Architecture"

heading "🔧 Add Missing Controls"
info "Team updates architecture to declare all required controls..."
echo -e "${CYAN}Updated Architecture:${NC}"
echo -e "  • micro-segmentation on k8s-cluster ✓"
echo -e "  • permitted-connection on both connect relationships ✓"
echo -e "  • mcp-guardrail on mcp-server ✓"
echo ""
echo "Press Enter to see the conforming architecture..."
read

heading "📋 Conforming Architecture - Controls Highlighted"
info "Let's examine where controls are declared in the architecture..."
echo ""
info "Displaying the FULL architecture with controls sections highlighted:"
echo -e "${CYAN}  • Lines 28-38: mcp-server node with mcp-guardrail control${NC}"
echo -e "${CYAN}  • Lines 70-80: k8s-cluster node with micro-segmentation control${NC}"
echo -e "${CYAN}  • Lines 101-111: mcp-client-to-mcp-server relationship with permitted-connection${NC}"
echo -e "${CYAN}  • Lines 130-140: mcp-server-to-trades-api relationship with permitted-connection${NC}"
echo ""
cat calm/trades-api-and-mcp-conforming.architecture.json | bat --language json --style=plain --color=always --highlight-line 28:38 --highlight-line 70:80 --highlight-line 101:111 --highlight-line 130:140
echo ""
info "All controls are now present in the architecture"
echo "Press Enter to validate..."
read

clear
heading "🚦 Gate 3: Architecture Controls - Retry"
run_command "calm validate --pattern calm/trades-api-and-mcp.pattern.json --architecture calm/trades-api-and-mcp-conforming.architecture.json --format json"
echo ""
calm validate \
  --pattern calm/trades-api-and-mcp.pattern.json \
  --architecture calm/trades-api-and-mcp-conforming.architecture.json \
  --format json 2>&1 | bat --language json --style=plain --color=always
echo ""
success "✅ GATE 3 PASSED: All controls validated"
echo ""
if [ "$VERBOSE_MODE" == "false" ]; then
    info "All required controls declared (micro-segmentation, permitted-connection, mcp-guardrail)"
fi
if [ "$VERBOSE_MODE" == "true" ]; then
    info "MCP Guardrail Policy: Denies trades in VOD, GME, AMC"
    info "This architecture is now compliant and ready for deployment"
    info "Total time from first attempt to approval: Minutes, not weeks"
fi
echo "Press Enter to continue..."
read

# ============================================================================
# Journey Complete: Deployment Approved
# ============================================================================

if [ "$VERBOSE_MODE" == "true" ]; then
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║            🎉 DEPLOYMENT APPROVED 🎉                           ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}The Journey Through Three Governance Gates:${NC}"
    echo ""
    echo -e "${CYAN}  Attempt 1${NC} → ❌ Gate 1: Custom pattern not in CALM Hub"
    echo -e "${CYAN}  Attempt 2${NC} → ✅ Gate 1: Switched to approved 'Trades API & MCP Pattern' — INSTANT FEEDBACK"
    echo ""
    echo -e "${CYAN}  Attempt 3${NC} → ❌ Gate 2: Infrastructure not secure (standard cluster)"
    echo -e "${CYAN}  Attempt 4${NC} → ✅ Gate 2: Team added Calico CNI — INSTANT FEEDBACK"
    echo ""
    echo -e "${CYAN}  Attempt 5${NC} → ❌ Gate 3: Missing required controls (permitted-connection)"
    echo -e "${CYAN}  Attempt 6${NC} → ✅ Gate 3: All controls declared — DEPLOYMENT APPROVED"
    echo ""
    echo -e "${GREEN}Three Governance Checkpoints:${NC}"
    echo "   1. Gate 1 - Pattern: Architecture must follow approved patterns from CALM Hub"
    echo "   2. Gate 2 - Infrastructure: Secure cluster with network segmentation"
    echo "   3. Gate 3 - Controls: All required security controls must be declared"
    echo ""
    echo -e "${YELLOW}The Impact at Scale:${NC}"
    echo "   When you need to roll out a new security requirement across 200 APIs:"
    echo ""
    echo -e "${GREEN}   The Architecture as Code Way:${NC}"
    echo "     • Update the CALM pattern once"
    echo "     • All 200 teams get instant feedback on next deployment"
    echo "     • Teams self-service compliance — no coordination needed"
    echo "     • Governance scales, security stays measurable"
    echo ""
    echo -e "${CYAN}Key Insight:${NC}"
    echo "   In the MCP era, governance must be codified, automated, and self-service."
    echo "   Architecture as Code transforms compliance from a bottleneck into a platform capability."
    echo ""
fi

# success "Scenario 3 Complete!"
# echo ""
# echo "Press Enter to continue..."
# read
