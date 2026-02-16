#!/bin/bash

# ANSI color codes
YELLOW='\033[0;33m'
YELLOW_BOLD='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
# Reset color
NC='\033[0m'

# ============================================================================
# DEPENDENCY VERIFICATION
# ============================================================================

# Track dependency status (using arrays compatible with bash 3.2+)
REQUIRED_COMMANDS=("minikube" "kubectl" "calm" "bash")
MISSING_DEPS=()
MISSING_CRITICAL=0

get_version() {
    local cmd=$1
    local version_output=""
    
    case "$cmd" in
        minikube)
            version_output=$(minikube version --short 2>&1)
            ;;
        kubectl)
            version_output=$(kubectl version --client 2>&1 | head -1 | awk '{print $3}')
            ;;
        calm)
            version_output=$(calm --version 2>&1)
            ;;
        bash)
            version_output=$(bash --version 2>&1 | head -1 | sed -n 's/.*version \([0-9.]*\).*/\1/p')
            ;;
*)
            version_output="installed"
            ;;
    esac
    
    # Trim whitespace
    version_output=$(echo "$version_output" | xargs)
    
    if [ -z "$version_output" ]; then
        echo "installed"
    else
        echo "$version_output"
    fi
}

check_and_display_command() {
    local cmd=$1
    local status="✗"
    local version="NOT FOUND"
    
    if command -v "$cmd" &> /dev/null; then
        status="✓"
        version=$(get_version "$cmd")
    else
        MISSING_DEPS+=("$cmd")
        MISSING_CRITICAL=1
    fi
    
    # Display immediately
    if [ "$status" = "✓" ]; then
        printf "${GREEN}%-15s %-8s${NC} %-40s\n" "$cmd" "$status" "$version"
    else
        printf "${RED}%-15s %-8s${NC} %-40s\n" "$cmd" "$status" "$version"
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         QCon Workshop Environment Verification                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check all required dependencies and display report
echo -e "${YELLOW_BOLD}Checking Required Dependencies...${NC}"
echo ""

printf "%-15s %-8s %-40s\n" "Command" "Status" "Version/Details"
echo "────────────────────────────────────────────────────────────────────"

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    check_and_display_command "$cmd"
done

echo ""
echo "────────────────────────────────────────────────────────────────────"

# Summary
if [ "$MISSING_CRITICAL" -eq 1 ]; then
    echo -e "${RED}✗ REQUIRED DEPENDENCIES MISSING${NC}"
    echo ""
    echo "The following required dependencies are missing:"
    for dep in "${MISSING_DEPS[@]}"; do
        echo -e "  ${RED}• $dep${NC}"
    done
    echo ""
    echo "Installation instructions:"
    echo "  - minikube: https://minikube.sigs.k8s.io/docs/start/"
    echo "  - kubectl:  https://kubernetes.io/docs/tasks/tools/"
    echo "  - calm:     npm install -g @finos/calm-cli"
    echo ""
    echo -e "${RED}Cannot proceed without all required dependencies. Exiting.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All dependencies are installed${NC}"
    echo ""
    echo -e "${GREEN}Environment is ready for the QCon workshop!${NC}"
    echo ""
    echo "Press Enter to begin the demo..."
    read
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Starting QCon Workshop Demo                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
sleep 2

# ============================================================================
# END DEPENDENCY VERIFICATION
# ============================================================================

heading() {
    clear
    local text=$1
    echo -e "${YELLOW_BOLD}${text}${NC}\n"
}

info() {
    local text=$1
    echo -e "${YELLOW}${text}${NC}\n"
}

error() {
    local text=$1
    echo -e "${RED}${text}\033[0m\n"
}

success() {
    local text=$1
    echo -e "${GREEN}${text}${NC}\n"
}

command() {
    local text=$1
    echo -e "${GREEN}> ${text}${NC}\n"
}

heading "Preparing the environment for the demo..."
info "Destroy Previous Deployments"...
minikube stop --profile secure

minikube start --profile secure

heading "Generate Kubernetes Bundle"
command "calm template --architecture segmented-mcp.architecture.json --output infrastructure --bundle ./bundle"
read
calm template --architecture segmented-mcp.architecture.json --output infrastructure --bundle ./bundle
read

heading "Launch the CALM Deployed Version"
command "kubectl apply -k infrastructure/kubernetes"
read
kubectl apply -k infrastructure/kubernetes
read

minikube stop --profile secure

info "Ready to Clean Up"
read
kubectl delete -f infrastructure/kubernetes/