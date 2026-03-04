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
if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${BLUE}📊 Mode: Verbose (showing all details)${NC}"
else
    echo -e "${BLUE}⚡ Mode: Concise (focused on key outcomes)${NC}"
fi
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

command_verbose() {
    local text=$1
    if [ "$VERBOSE_MODE" == "true" ]; then
        echo -e "${GREEN}> ${text}${NC}\n"
    fi
}

# ============================================================================
# STEP 1: Start Minikube
# ============================================================================

heading "Starting the Kubernetes Cluster"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Starting Minikube..."
    command_verbose "minikube start --profile secure --cni calico"
    minikube start --profile secure --cni calico
    read
else
    info "⚙️  Starting Minikube cluster with secure profile and Calico CNI..."
    minikube start --profile secure --cni calico > /dev/null 2>&1
    success "✓ Cluster ready"
    sleep 1
fi

# ============================================================================
# STEP 2: Load Docker images (hidden from output)
# ============================================================================

heading "Preparing Docker Images"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Pulling latest images from DockerHub..."
    info "Loading images into Minikube's daemon — imagePullPolicy: Never means images must be available locally"
    minikube image load jpgough/trades-mcp-server:latest --profile secure
    minikube image load jpgough/trades-rest-server:latest --profile secure
    echo ""
    success "Images ready in Minikube's daemon"
    read
else
    info "⚙️  Loading Docker images into Minikube..."
    minikube image load jpgough/trades-mcp-server:latest --profile secure > /dev/null 2>&1
    minikube image load jpgough/trades-rest-server:latest --profile secure > /dev/null 2>&1
    success "✓ Images loaded"
    sleep 1
fi

# ============================================================================
# STEP 3: Generate Infrastructure via calm template
# ============================================================================

heading "Generate Infrastructure from CALM Architecture"
info "Using CALM to generate Kubernetes manifests..."
command "calm template --architecture calm/trades-api-and-mcp.architecture.json --bundle bundle --output infrastructure"
calm template \
  --architecture calm/trades-api-and-mcp.architecture.json \
  --output infrastructure \
  --bundle bundle \
  --clear-output-directory
echo "" 

# ============================================================================
# STEP 4: Deploy
# ============================================================================

heading "Deploying to Kubernetes"
command "kubectl apply -k infrastructure/kubernetes"
if [ "$VERBOSE_MODE" == "true" ]; then
    kubectl apply -k infrastructure/kubernetes
else
    kubectl apply -k infrastructure/kubernetes > /dev/null 2>&1
    success "✓ Resources deployed"
fi
echo ""

# ============================================================================
# STEP 6: Generated Artifacts
# ============================================================================

heading "Generated Infrastructure Artifacts"
command "tree infrastructure"
tree infrastructure
if [ "$VERBOSE_MODE" == "true" ]; then
    read
else
    sleep 2
fi

# ============================================================================
# STEP 7: Active Pods
# ============================================================================

heading "Active Pods"
command "kubectl wait --for=condition=ready pod --all --timeout=90s"
if [ "$VERBOSE_MODE" == "true" ]; then
    kubectl wait --for=condition=ready pod --all --timeout=90s
else
    kubectl wait --for=condition=ready pod --all --timeout=90s > /dev/null 2>&1
    success "✓ All pods ready"
fi
command "kubectl get pods -o wide"
kubectl get pods -o wide
if [ "$VERBOSE_MODE" == "true" ]; then
    read
else
    sleep 2
fi

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================

heading "Scenario 1 Deployment Complete!"
success "✓ Minikube cluster running with Calico CNI"
success "✓ Trades API and MCP server deployed"
success "✓ Network policies applied"
echo ""