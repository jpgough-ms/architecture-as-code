#!/bin/bash

# ANSI color codes
YELLOW='\033[0;33m'
YELLOW_BOLD='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

success() {
    local text=$1
    echo -e "${GREEN}${text}${NC}\n"
}

error() {
    local text=$1
    echo -e "${RED}${text}${NC}\n"
}

section() {
    local text=$1
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $text"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║         QCon CALM Demo                                           ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║  Scenario 1: Basic MCP Deployment with Network Policies          ║${NC}"
echo -e "${BLUE}║  Scenario 2: Add CALM Control-Based Guardrails                   ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
sleep 2

info "This demo will guide you through two scenarios:"
echo "  1️⃣  Deploy a basic MCP server and Trades API to Kubernetes"
echo "  2️⃣  Add CALM control-based guardrails to restrict trading symbols"
echo ""
echo -e "${YELLOW}The demo will run continuously. The cluster will stay running between scenarios.${NC}"
echo ""
echo -e "${CYAN}Note: Port-forwarding is handled by a separate script (./port-forward.sh)${NC}"
echo -e "${CYAN}Start it in a separate terminal after Scenario 1 completes.${NC}"
echo ""
read -p "Press Enter to begin with Scenario 1..."

# ============================================================================
# SCENARIO 1: Basic Deployment
# ============================================================================

section "SCENARIO 1: Basic MCP Deployment"

info "Starting Scenario 1..."
echo ""

cd scenario1

# Check if demo.sh exists
if [ ! -f "demo.sh" ]; then
    error "Error: scenario1/demo.sh not found!"
    exit 1
fi

# Make sure it's executable
chmod +x demo.sh

# Run scenario 1
./demo.sh

# Check if scenario 1 completed successfully
if [ $? -ne 0 ]; then
    error "Scenario 1 failed. Exiting."
    exit 1
fi

cd ..

echo ""
success "✅ Scenario 1 Complete!"
echo ""
echo -e "${YELLOW}The basic MCP deployment is now running in Kubernetes.${NC}"
echo -e "${YELLOW}The cluster will remain active for Scenario 2.${NC}"
echo ""
sleep 3

# ============================================================================
# TRANSITION
# ============================================================================

section "TRANSITION: Moving to Scenario 2"

info "Next, we'll add CALM control-based guardrails to the deployment."
echo ""
echo -e "${CYAN}What we'll do in Scenario 2:${NC}"
echo "  • Display the MCP Guardrail control configuration"
echo "  • Show how the architecture links to the control"
echo "  • Generate a ConfigMap from the control (denied symbols: VOD, GME, AMC)"
echo "  • Re-deploy with the guardrail enforcement"
echo ""
echo -e "${YELLOW}Reminder: Start port-forwarding if you haven't already:${NC}"
echo -e "${GREEN}  ./port-forward.sh${NC}"
echo ""
read -p "Press Enter to continue to Scenario 2..."

# ============================================================================
# SCENARIO 2: Control-Based Guardrails
# ============================================================================

section "SCENARIO 2: CALM Control-Based Guardrails"

info "Starting Scenario 2..."
echo ""

cd scenario2

# Check if demo.sh exists
if [ ! -f "demo.sh" ]; then
    error "Error: scenario2/demo.sh not found!"
    exit 1
fi

# Make sure it's executable
chmod +x demo.sh

# Run scenario 2
./demo.sh

# Check if scenario 2 completed successfully
if [ $? -ne 0 ]; then
    error "Scenario 2 failed."
    exit 1
fi

cd ..

echo ""
section "DEMO COMPLETE"