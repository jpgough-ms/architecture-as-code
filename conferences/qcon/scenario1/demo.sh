#!/bin/bash

export BAT_THEME="zenburn"

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

REQUIRED_COMMANDS=("minikube" "kubectl" "calm" "bat" "tree")
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
        bat)
            version_output=$(bat --version 2>&1 | awk '{print $2}')
            ;;
        tree)
            version_output=$(tree --version 2>&1 | head -1 | grep -o 'v[0-9.]*' | head -1)
            ;;
        *)
            version_output="installed"
            ;;
    esac

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

    if [ "$status" = "✓" ]; then
        printf "${GREEN}%-15s %-8s${NC} %-40s\n" "$cmd" "$status" "$version"
    else
        printf "${RED}%-15s %-8s${NC} %-40s\n" "$cmd" "$status" "$version"
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         QCon Trades Demo Environment Verification             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW_BOLD}Checking Required Dependencies...${NC}"
echo ""

printf "%-15s %-8s %-40s\n" "Command" "Status" "Version/Details"
echo "────────────────────────────────────────────────────────────────────"

for cmd in "${REQUIRED_COMMANDS[@]}"; do
    check_and_display_command "$cmd"
done

echo ""
echo "────────────────────────────────────────────────────────────────────"

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
    echo "  - bat:      brew install bat"
    echo "  - tree:     brew install tree"
    echo ""
    echo -e "${RED}Cannot proceed without all required dependencies. Exiting.${NC}"
    exit 1
else
    echo -e "${GREEN}✓ All dependencies are installed${NC}"
    echo ""
    echo -e "${GREEN}Environment is ready for the QCon Trades Demo!${NC}"
    echo ""
    echo "Press Enter to begin the demo..."
    read
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Starting QCon Trades Demo                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
sleep 2

# ============================================================================
# END DEPENDENCY VERIFICATION
# ============================================================================

heading() {
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

# ============================================================================
# STEP 1: Start Minikube
# ============================================================================

heading "Starting the Kubernetes Cluster"
info "Starting Minikube..."
command "minikube start --profile secure --cni calico"
minikube start --profile secure --cni calico
read

# ============================================================================
# STEP 2: Load Docker images (hidden from output)
# ============================================================================

heading "Preparing Docker Images"
info "Pulling latest images from DockerHub..."

info "Loading images into Minikube's daemon — imagePullPolicy: Never means images must be available locally"

minikube image load jpgough/trades-mcp-server:latest --profile secure
minikube image load jpgough/trades-rest-server:latest --profile secure
 
echo ""
success "Images ready in Minikube's daemon"
read

# ============================================================================
# STEP 3: Generate Infrastructure via calm template
# ============================================================================

calm template \
  --architecture calm/trades-api-and-mcp.architecture.json \
  --output infrastructure \
  --bundle bundle \
  --clear-output-directory 

# ============================================================================
# STEP 4: Deploy
# ============================================================================

heading "Deploying to Kubernetes"
kubectl apply -k infrastructure/kubernetes

# ============================================================================
# STEP 6: Generated Artifacts
# ============================================================================

heading "Generated Infrastructure Artifacts"
tree infrastructure
read

# ============================================================================
# STEP 7: Active Pods
# ============================================================================

heading "Active Pods"
kubectl wait --for=condition=ready pod --all --timeout=90s
kubectl get pods -o wide
read

# ============================================================================
# STEP 8: Cleanup
# ============================================================================

echo -e "${YELLOW_BOLD}Cleanup: would you like to tear down the deployment? (y/n)${NC}"
read -r CLEANUP
if [[ "$CLEANUP" == "y" || "$CLEANUP" == "Y" ]]; then
    kubectl delete -k infrastructure/kubernetes
    rm -rf infrastructures
    eval $(minikube docker-env --unset) > /dev/null 2>&1
    minikube stop --profile secure
    success "Demo complete — cluster stopped."
else
    success "Demo complete — cluster still running."
fi