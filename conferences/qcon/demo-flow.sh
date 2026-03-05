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

# ============================================================================
# MODE SELECTION
# ============================================================================

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   Select Demo Mode                               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Choose your experience:${NC}"
echo ""
echo -e "  ${GREEN}1${NC} - ${YELLOW}Concise Mode${NC} (Recommended for presentations)"
echo "      • Show all technical commands (calm, kubectl, minikube, calmhub)"
echo "      • Focus on WHAT is happening, not WHY"
echo "      • Streamlined for live demos"
echo ""
echo -e "  ${GREEN}2${NC} - ${YELLOW}Story Mode${NC} (Recommended for learning/teaching)"
echo "      • Show all technical commands AND explanations"
echo "      • Context about why each step matters"
echo "      • Full narrative for understanding"
echo ""
read -p "Enter your choice (1 or 2) [default: 1]: " MODE_CHOICE

# Default to concise mode
MODE_CHOICE=${MODE_CHOICE:-1}

if [ "$MODE_CHOICE" == "2" ]; then
    export VERBOSE_MODE="true"
    echo -e "${GREEN}✓ Story mode enabled${NC}"
else
    export VERBOSE_MODE="false"
    echo -e "${GREEN}✓ Concise mode enabled${NC}"
fi
echo ""
sleep 1

clear

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║      APIs for Agents                                             ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║  Scenario 1: Deploy API & MCP Architecture                       ║${NC}"
echo -e "${BLUE}║  Scenario 2: Self-Service Agent Guardrails                       ║${NC}"
echo -e "${BLUE}║  Scenario 3: Automated Governance Gates                          ║${NC}"
echo -e "${BLUE}║  Scenario 4: Platform Opinion has changed                        ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
sleep 2

if [ "$VERBOSE_MODE" == "true" ]; then
    info "APIs aren't just consumed by human developers anymore —"
    info "they're consumed by tools and autonomous agents."
    echo ""
    info "This demo shows how Architecture as Code enables:"
    echo "  1️⃣  Deploy standardized API infrastructure"
    echo "  2️⃣  Self-service guardrails for agent-safe APIs (MCP compliance)"
    echo "  3️⃣  Automated governance without central gatekeeping"
    echo "  4️⃣  Platform evolution through bundle versioning"
    echo ""
    info "The Challenge:"
    echo "   • 200+ APIs need consistent security controls"
    echo "   • Agent consumers require runtime guardrails"
    echo "   • Teams must move fast without creating drift"
    echo ""
    info "The Solution:"
    echo "   • Codify architectural patterns in CALM"
    echo "   • Self-service controls teams can apply immediately"
    echo "   • Automated validation gates that scale"
    echo ""
    echo -e "${CYAN}Note: Port-forwarding is handled by ./port-forward.sh${NC}"
    echo -e "${CYAN}Start it in a separate terminal after Scenario 1 completes.${NC}"
    echo ""
fi
read -p "Press Enter to begin..."

# ============================================================================
# SCENARIO 1: Basic Deployment
# ============================================================================

section "SCENARIO 1: Deploy API & MCP Architecture"

if [ "$VERBOSE_MODE" == "true" ]; then
    info "Starting Scenario 1: The Foundation"
    info "Deploying a Trades API with MCP server for agent consumption"
    echo ""
fi

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
if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${GREEN}Achievement: API infrastructure deployed from architecture definition${NC}"
    echo ""
    echo -e "${CYAN}Reminder: Start port-forwarding in separate terminal if you haven't already:${NC}"
    echo -e "${GREEN}  ./port-forward.sh${NC}"
    echo ""
fi
echo -e "${YELLOW_BOLD}Press Enter to continue to Scenario 2...${NC}"
read

# ============================================================================
# TRANSITION
# ============================================================================

section "SCENARIO 2: Self-Service Agent Guardrails"

if [ "$VERBOSE_MODE" == "true" ]; then
    info "Starting Scenario 2: MCP Guardrails Without Gatekeeping"
    echo ""
fi

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
success "✅ Scenario 2 Complete!"
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${GREEN}Achievement: Self-service guardrails protecting agent interactions${NC}"
    echo -e "${GREEN}Agents calling this API now respect compliance rules — no central review needed${NC}"
    echo ""
fi
echo -e "${YELLOW_BOLD}Press Enter to continue to Scenario 3...${NC}"
read

# ============================================================================
# TRANSITION TO SCENARIO 3
# ============================================================================

section "SCENARIO 3: Automated Governance Gates"

if [ "$VERBOSE_MODE" == "true" ]; then
    info "Starting Scenario 3: Governance Without Bureaucracy"
    echo ""
fi

cd scenario3

# Check if demo.sh exists
if [ ! -f "demo.sh" ]; then
    error "Error: scenario3/demo.sh not found!"
    exit 1
fi

# Make sure it's executable
chmod +x demo.sh

# Run scenario 3
./demo.sh

# Check if scenario 3 completed successfully
if [ $? -ne 0 ]; then
    error "Scenario 3 failed."
    exit 1
fi

cd ..

echo ""
success "✅ Scenario 3 Complete!"
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${GREEN}Achievement: Governance that scales without central gatekeeping${NC}"
    echo -e "${YELLOW}Non-compliant architectures blocked automatically — no tickets, no delays${NC}"
    echo ""
fi
echo -e "${YELLOW_BOLD}Press Enter to continue to Scenario 4...${NC}"
read

# ============================================================================
# TRANSITION TO SCENARIO 4
# ============================================================================

section "SCENARIO 4: Platform Opinion Has Changed"

if [ "$VERBOSE_MODE" == "true" ]; then
    info "Starting Scenario 4: Bundle-as-Platform-Opinion"
    echo ""
fi

cd scenario4

# Check if demo.sh exists
if [ ! -f "demo.sh" ]; then
    error "Error: scenario4/demo.sh not found!"
    exit 1
fi

# Make sure it's executable
chmod +x demo.sh

# Run scenario 4
./demo.sh

# Check if scenario 4 completed successfully
if [ $? -ne 0 ]; then
    error "Scenario 4 failed."
    exit 1
fi

cd ..

echo ""
success "✅ Scenario 4 Complete!"
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${GREEN}Achievement: Platform pushes changes without teams modifying architectures${NC}"
    echo -e "${YELLOW}Bundle evolution (HOW) independent from architecture (WHAT)${NC}"
    echo ""
fi
sleep 3
