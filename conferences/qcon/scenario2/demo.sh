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

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Scenario 2: Re-deploy with MCP Guardrail            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    echo -e "${BLUE}📊 Mode: Verbose (showing all details)${NC}"
else
    echo -e "${BLUE}⚡ Mode: Concise (focused on key outcomes)${NC}"
fi
echo ""

heading "Step 1: Verify existing deployment"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Checking for running pods..."
    command_verbose "kubectl get pods"
fi
kubectl get pods 2>/dev/null || {
    echo "Error: No kubernetes cluster found. Please run scenario 1 first."
    exit 1
}
if [ "$VERBOSE_MODE" == "false" ]; then
    success "✓ Cluster verified"
fi
echo ""

heading "Step 2: Display the MCP Guardrail Control"
info "The control defines the denied trading symbols..."
command "cat calm/controls/mcp-guardrail.config.json"
cat calm/controls/mcp-guardrail.config.json
echo ""
echo ""
info "How the architecture links to the control (mcp-server node):"
echo -e "${BLUE}The mcp-server node references the control via requirement-url and config-url:${NC}"
echo ""
# Extract just the controls section from mcp-server node
sed -n '/"unique-id": "mcp-server"/,/"unique-id": "trades-api"/p' calm/trades-api-and-mcp.architecture.json | sed -n '/"controls":/,/^      }/p'
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    echo "Press Enter to continue..."
    read
else
    sleep 2
fi

heading "Step 3: Generate infrastructure from CALM architecture"
info "Extracting denied symbols from control configuration..."
command "calm template --architecture calm/trades-api-and-mcp.architecture.json --bundle bundle --output infrastructure"
calm template \
  --architecture calm/trades-api-and-mcp.architecture.json \
  --output infrastructure \
  --bundle bundle \
  --clear-output-directory 2>&1 | grep -v "Failed to dereference" | grep -v "Unable to resolve reference" || true
echo ""

heading "Step 4: Show generated ConfigMap"
info "ConfigMap generated from control:"
command "cat infrastructure/kubernetes/denied-symbols-configmap.yaml"
cat infrastructure/kubernetes/denied-symbols-configmap.yaml
echo ""
if [ "$VERBOSE_MODE" == "true" ]; then
    echo "Press Enter to apply the configuration..."
    read
else
    sleep 2
fi

heading "Step 5: Apply the new configuration"
command "kubectl apply -k infrastructure/kubernetes"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Applying updated Kubernetes resources..."
    kubectl apply -k infrastructure/kubernetes
    kubectl rollout restart deployments
else
    info "⚙️  Applying updated Kubernetes resources..."
    kubectl apply -k infrastructure/kubernetes > /dev/null 2>&1
    kubectl rollout restart deployments > /dev/null 2>&1
    success "✓ Configuration applied"
fi
echo ""

heading "Step 6: Wait for pods to be ready"
command "kubectl wait --for=condition=ready pod --all --timeout=90s"
if [ "$VERBOSE_MODE" == "true" ]; then
    info "Waiting for all pods to be ready..."
    kubectl wait --for=condition=ready pod --all --timeout=90s
else
    info "⚙️  Waiting for pods to restart..."
    kubectl wait --for=condition=ready pod --all --timeout=90s > /dev/null 2>&1
    success "✓ All pods ready"
fi
echo ""

heading "Step 7: Verify deployment"
info "Current pods:"
command "kubectl get pods -o wide"
kubectl get pods -o wide
echo ""
# info "ConfigMap in cluster:"
# kubectl get configmap denied-symbols -o yaml
# echo ""

if [ "$VERBOSE_MODE" == "false" ]; then
    sleep 2
fi

success "Scenario 2 complete!"