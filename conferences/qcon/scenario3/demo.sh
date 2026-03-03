#!/bin/bash

export BAT_THEME="zenburn"

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

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         QCon Trades Demo — CALM as a Governance Gate          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# Stage 1: Wrong cluster profile — deployer blocks deployment
# ============================================================================

stage "Stage 1 — Wrong Cluster Profile"

heading "Starting Insecure Cluster"
run_command "minikube start --profile insecure"
minikube start --profile insecure > /dev/null 2>&1
minikube profile insecure > /dev/null 2>&1
success "Cluster started (profile: insecure)"
echo "Press Enter to continue..."
read

heading "Generate Deployer with Governance Checks"
run_command "calm template --architecture calm/trades-api-and-mcp-conforming.architecture.json --bundle bundle --output generated"
calm template \
  --architecture calm/trades-api-and-mcp-conforming.architecture.json \
  --output generated \
  --bundle bundle \
  --clear-output-directory > /dev/null 2>&1
cp generated/deployer.sh . && chmod +x deployer.sh
echo ""
echo "Press Enter to continue..."
read

heading "Run Deployer: Infrastructure Check"
run_command "bash deployer.sh"
echo ""
bash deployer.sh || true
echo ""
error_msg "✗ BLOCKED: Wrong cluster profile active"
echo "Press Enter to continue..."
read

# ============================================================================
# Stage 2: Fix the cluster — deployer passes
# ============================================================================

stage "Stage 2 — Secure Cluster Profile"

heading "Switch to Secure Profile"
run_command "minikube stop --profile insecure && minikube start --profile secure --cni calico"
minikube stop --profile insecure > /dev/null 2>&1
minikube start --profile secure --cni calico > /dev/null 2>&1
minikube profile secure > /dev/null 2>&1
success "Secure cluster running with Calico CNI (profile: secure)"
echo "Press Enter to continue..."
read

heading "Regenerate Deployer"
run_command "calm template --architecture calm/trades-api-and-mcp-conforming.architecture.json --bundle bundle --output generated"
calm template \
  --architecture calm/trades-api-and-mcp-conforming.architecture.json \
  --output generated \
  --bundle bundle \
  --clear-output-directory > /dev/null 2>&1
cp generated/deployer.sh . && chmod +x deployer.sh
echo "Press Enter to continue..."
read

heading "Run Deployer: Infrastructure Check"
run_command "bash deployer.sh"
echo ""
bash deployer.sh
echo ""
success "✓ Infrastructure ready - now we validate architecture controls"
echo "Press Enter to continue..."
read

# ============================================================================
# Stage 3: Architecture fails validation — missing controls
# ============================================================================

stage "Stage 3 — Validate Non-Conforming Architecture"

heading "Pattern Requires Three Control Types:"
echo -e "${CYAN}  1. micro-segmentation${NC} on k8s-cluster (netsec-001)"
echo -e "${CYAN}  2. permitted-connection${NC} on all relationships (netsec-002)"
echo -e "${CYAN}  3. mcp-guardrail${NC} on mcp-server (mcp-001)"
echo ""
echo "Press Enter to continue..."
read

heading "Validate Architecture: Non-Conforming"
run_command "calm validate --pattern calm/trades-api-and-mcp.pattern.json --architecture calm/trades-api-and-mcp-non-conforming.architecture.json --format json"
echo ""
calm validate \
  --pattern calm/trades-api-and-mcp.pattern.json \
  --architecture calm/trades-api-and-mcp-non-conforming.architecture.json \
  --format json 2>&1 | bat --language json --style=plain --color=always || true
echo ""
error_msg "✗ VALIDATION FAILED: Missing permitted-connection on /relationships/0 (mcp-client-to-mcp-server)"
echo "Press Enter to continue..."
read

# ============================================================================
# Stage 4: Conforming architecture — validation passes
# ============================================================================

stage "Stage 4 — Validate Conforming Architecture"

heading "Validate Architecture: Conforming (All Controls Declared)"
run_command "calm validate --pattern calm/trades-api-and-mcp.pattern.json --architecture calm/trades-api-and-mcp-conforming.architecture.json --format json"
echo ""
calm validate \
  --pattern calm/trades-api-and-mcp.pattern.json \
  --architecture calm/trades-api-and-mcp-conforming.architecture.json \
  --format json 2>&1 | bat --language json --style=plain --color=always
echo ""
success "✓ VALIDATION PASSED: All required controls present"
echo ""
echo -e "${CYAN}Controls on Architecture:${NC}"
echo -e "  • micro-segmentation (k8s-cluster)"
echo -e "  • permitted-connection (all 3 relationships)"
echo -e "  • mcp-guardrail (mcp-server) — denies: VOD, GME, AMC"
echo "Press Enter to continue..."
read

# ============================================================================
# Summary
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Governance Gate — End to End                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}  1. Wrong Cluster${NC} → Deployer blocks deployment"
echo -e "${CYAN}  2. Secure Cluster${NC} → Infrastructure checks pass"
echo -e "${CYAN}  3. Missing Controls${NC} → Pattern validation fails (JSON shows violations)"
echo -e "${CYAN}  4. Controls Declared${NC} → Architecture approved"
echo ""
success "The governance gate held. The architecture is the contract."
echo ""
