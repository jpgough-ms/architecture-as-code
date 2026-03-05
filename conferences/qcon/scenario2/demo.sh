#!/bin/bash

# Check if verbose mode is set (from parent script)
VERBOSE_MODE=${VERBOSE_MODE:-"true"}

# ANSI color codes
YELLOW='\033[0;33m'
YELLOW_BOLD='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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


if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${BLUE}📖 Mode: Story (commands + explanations)${NC}"
else
    echo -e "${BLUE}⚡ Mode: Concise (commands only)${NC}"
fi
echo ""

heading "Step 1: Verify existing deployment"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Checking for running pods from Scenario 1..."
    info "Why: Scenario 2 builds on the infrastructure from Scenario 1"
fi
command "kubectl get pods"
kubectl get pods 2>/dev/null || {
    echo "Error: No kubernetes cluster found. Please run scenario 1 first."
    exit 1
}
echo ""
success "✓ Cluster verified"
echo ""
echo "Press Enter to continue..."
read

heading "Step 2: Display the MCP Guardrail Control"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "The control defines denied trading symbols (VOD, GME, AMC)..."
    info "Why: CALM controls codify governance requirements declaratively"
fi
command "cat calm/controls/mcp-guardrail.config.json"
cat calm/controls/mcp-guardrail.config.json
echo ""
info "Where is this control applied in the architecture?"
echo ""
echo -e "${BLUE}In the trades-api-and-mcp.architecture.json, the mcp-server node declares:${NC}"
echo ""
sed -n '/"unique-id": "mcp-server"/,/^    },$/p' calm/trades-api-and-mcp.architecture.json | bat --language json --style=plain --color=always
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Note: The controls section links to both requirement and config files"
    info "This declaratively ties governance policy to the service"
fi
echo ""
echo "Press Enter to continue..."
read

heading "Step 3: Generate infrastructure from CALM architecture"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Using CALM to extract denied symbols from control configuration..."
    info "Why: CALM transforms declarative controls into executable artifacts"
fi
command "calm template --architecture calm/trades-api-and-mcp.architecture.json --bundle bundle --output infrastructure"
calm template \
  --architecture calm/trades-api-and-mcp.architecture.json \
  --output infrastructure \
  --bundle bundle \
  --clear-output-directory 2>&1 | grep -v "Failed to dereference" | grep -v "Unable to resolve reference" || true
echo ""
success "✓ Infrastructure generated"
echo ""
echo "Press Enter to continue..."
read

heading "Step 4: Show generated ConfigMap"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "ConfigMap generated from control configuration:"
    info "Why: The bundle transforms CALM controls into Kubernetes resources"
fi
command "cat infrastructure/kubernetes/denied-symbols-configmap.yaml"
cat infrastructure/kubernetes/denied-symbols-configmap.yaml
echo ""
echo "Press Enter to apply the configuration..."
read

heading "Step 5: Apply the new configuration"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Applying updated Kubernetes resources with MCP guardrail..."
    info "Why: kubectl apply updates the ConfigMap and restarts deployments"
fi
command "kubectl apply -k infrastructure/kubernetes"
kubectl apply -k infrastructure/kubernetes
command "kubectl rollout restart deployments"
kubectl rollout restart deployments
echo ""
success "✓ Configuration applied"
echo ""
echo "Press Enter to continue..."
read

heading "Step 6: Wait for pods to be ready"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Waiting for deployments to complete rollout..."
    info "Why: Deployments need time to mount new ConfigMaps and pass readiness checks"
fi
command "kubectl rollout status deployment/trades deployment/trades-mcp-server"
kubectl rollout status deployment/trades --timeout=90s
kubectl rollout status deployment/trades-mcp-server --timeout=90s
echo ""
success "✓ All deployments rolled out successfully"
echo ""
echo "Press Enter to continue..."
read

heading "Step 7: Verify deployment"
info "Current pods:"
command "kubectl get pods -o wide"
kubectl get pods -o wide
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    info "The MCP guardrail is now active, blocking trades for VOD, GME, AMC"
fi
echo ""
echo "Press Enter to continue..."
read

# ============================================================================
# STEP 8: Verify Port Forwarding After Restart
# ============================================================================

heading "Step 8: Verify Port Forwarding"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "After restarting deployments, we need to ensure port-forwards are still active..."
    info "Why: Pod restarts may require re-establishing port-forward connections"
fi
echo ""
info "Checking port-forwards from ./port-forward.sh..."
echo ""
MCP_OK=false
TRADES_OK=false

if curl -s http://localhost:8080/health > /dev/null 2>&1 || curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MCP Server accessible at localhost:8080${NC}"
    MCP_OK=true
else
    echo -e "${RED}✗ MCP Server NOT accessible at localhost:8080${NC}"
fi

if curl -s http://localhost:8081/health > /dev/null 2>&1 || curl -s http://localhost:8081/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Trades API accessible at localhost:8081${NC}"
    TRADES_OK=true
else
    echo -e "${RED}✗ Trades API NOT accessible at localhost:8081${NC}"
fi

echo ""
if [ "$MCP_OK" = false ] || [ "$TRADES_OK" = false ]; then
    echo -e "${YELLOW}REMINDER: You may need to restart port-forward.sh in a separate terminal:${NC}"
    echo -e "  ${CYAN}./port-forward.sh${NC}"
    echo ""
    echo "Press Enter once port-forwarding is running..."
    read
    
    # Re-check after user confirmation
    if curl -s http://localhost:8080/ > /dev/null 2>&1 && curl -s http://localhost:8081/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Port-forwards are now active${NC}"
    else
        echo -e "${RED}✗ Still cannot reach services. Please verify ./port-forward.sh is running.${NC}"
        echo "Press Enter to continue anyway..."
        read
    fi
else
    success "✓ All port-forwards active"
fi
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    echo "Press Enter to continue..."
    read
else
    sleep 2
fi

success "Scenario 2 Complete!"
echo ""

# ============================================================================
# Preparing for Scenario 3
# ============================================================================

heading "🔧 Preparing for Scenario 3"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Setting up insecure cluster for next scenario..."
    info "Why: Scenario 3 demonstrates governance gates starting with non-compliant infrastructure"
fi

command_verbose "minikube start --profile insecure"
minikube start --profile insecure > /dev/null 2>&1
minikube profile insecure > /dev/null 2>&1

success "✓ Insecure cluster ready for Scenario 3"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "This cluster will be used to demonstrate infrastructure governance requirements"
fi