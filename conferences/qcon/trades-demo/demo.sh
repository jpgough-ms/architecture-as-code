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

# ============================================================================
# STEP 1: Start Minikube
# ============================================================================

heading "Starting the Kubernetes Cluster"
info "Starting Minikube..."
command "minikube start --profile insecure"
minikube start --profile insecure
read

# ============================================================================
# STEP 2: Load Docker images (hidden from output)
# ============================================================================

heading "Preparing Docker Images"
info "Loading images into Minikube's daemon — imagePullPolicy: Never means images must be available locally"
# needs images to be in the local docker daemon for minikube to load them

minikube image load jpgough/trades-mcp-server:latest --profile insecure
minikube image load jpgough/trades-rest-server:latest --profile insecure
 
echo ""
success "Images ready in Minikube's daemon"
read

# ============================================================================
# STEP 3: Trades API Pattern
# ============================================================================

heading "The Trades API Pattern"
info "We start with a focused base pattern — a REST API service deployed in a Kubernetes cluster"
info "Patterns are JSON Schema: they use 'const' to lock down node IDs and types"
info "The interface placeholders (image, port) are left open for the architecture to fill in"
command "bat calm/trades-api.pattern.json"
bat calm/trades-api.pattern.json --line-range 1:50 --highlight-line 20:39
read

# ============================================================================
# STEP 4: Trades API Architecture
# ============================================================================

heading "The Trades API Architecture"
info "The architecture is a concrete instantiation — placeholders filled with real values"
info "The interface block now has the actual image name and port number"
command "bat calm/trades-api.architecture.json"
bat calm/trades-api.architecture.json --highlight-line 12:20
read

# ============================================================================
# STEP 5: MCP + Trades Pattern
# ============================================================================

heading "The MCP + Trades Pattern"
info "Now we extend: the MCP pattern adds an AI client and MCP server on top of the Trades API"
info "The trades-api node declares a 'required-pattern' link — it must conform to the Trades API pattern"
info "This is CALM's way of composing patterns hierarchically"
command "bat calm/trades-api-and-mcp.pattern.json"
bat calm/trades-api-and-mcp.pattern.json --line-range 55:95 --highlight-line 61:69 --highlight-line 70:91
read

# ============================================================================
# STEP 6: MCP + Trades Architecture
# ============================================================================

heading "The MCP + Trades Architecture"
info "The trades-api node carries a 'detailed-architecture' link"
info "This connects two architectures — you can drill down into the Trades API from here"
command "bat calm/trades-api-and-mcp.architecture.json"
bat calm/trades-api-and-mcp.architecture.json --highlight-line 18:26 --highlight-line 34:46
read

# # ============================================================================
# # STEP 7: Validate
# # ============================================================================

heading "Validating the Architectures"
info "calm validate checks each architecture against its pattern — catching drift early"

command "calm validate -p calm/trades-api.pattern.json -a calm/trades-api.architecture.json"
calm validate -p calm/trades-api.pattern.json -a calm/trades-api.architecture.json
read

command "calm validate -p calm/trades-api-and-mcp.pattern.json -a calm/trades-api-and-mcp.architecture.json"
calm validate -p calm/trades-api-and-mcp.pattern.json -a calm/trades-api-and-mcp.architecture.json
read

# ============================================================================
# STEP 8: Show the Template Bundle
# ============================================================================

heading "The Template Bundle"
info "The bundle transforms the CALM architecture into Kubernetes manifests using Handlebars templates"
info "A transformer extracts values from the architecture JSON and passes them to the templates"
command "tree bundle"
tree bundle
read

info "The image and port are injected directly from the CALM architecture node interfaces"
command "bat bundle/trades-deployment.yaml --highlight-line 19:22"
bat bundle/trades-deployment.yaml --highlight-line 19:22
read

# ============================================================================
# STEP 9: Generate Infrastructure
# ============================================================================

heading "Generating Infrastructure from Architecture"
info "calm template reads the architecture, runs the transformer, and renders all templates"
command "calm template \\
  --architecture calm/trades-api-and-mcp.architecture.json \\
  --output infrastructure \\
  --bundle bundle \\
  --clear-output-directory"

calm template \
  --architecture calm/trades-api-and-mcp.architecture.json \
  --output infrastructure \
  --bundle bundle \
  --clear-output-directory
read

# ============================================================================
# STEP 10: Show Generated Output
# ============================================================================

heading "Generated Infrastructure"
info "From a single CALM architecture file, we have a complete set of Kubernetes manifests"
command "tree infrastructure"
tree infrastructure
read

info "The image name was injected from the CALM architecture — no manual editing required"
command "bat infrastructure/kubernetes/trades-deployment.yaml"
bat infrastructure/kubernetes/trades-deployment.yaml --highlight-line 19:22
read

# ============================================================================
# STEP 11: Deploy
# ============================================================================

heading "Deploying to Kubernetes"
info "Apply all generated manifests using Kustomize"
command "kubectl apply -k infrastructure/kubernetes"
kubectl apply -k infrastructure/kubernetes
read

info "Waiting for pods to come up..."
command "kubectl get pods"
kubectl get pods
read

# ============================================================================
# STEP 12: Cleanup
# ============================================================================

heading "Cleanup"
command "kubectl delete -k infrastructure/kubernetes"
kubectl delete -k infrastructure/kubernetes
rm -rf infrastructure

eval $(minikube docker-env --unset) > /dev/null 2>&1
minikube stop --profile insecure

success "Demo complete!"
