#!/bin/bash

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

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Scenario 2: Re-deploy with MCP Guardrail            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

heading "Step 1: Verify existing deployment"
info "Checking for running pods..."
kubectl get pods 2>/dev/null || {
    echo "Error: No kubernetes cluster found. Please run scenario 1 first."
    exit 1
}
echo ""

heading "Step 2: Display the MCP Guardrail Control"
info "The control defines the denied trading symbols..."
cat calm/controls/mcp-guardrail.config.json
echo ""
echo ""
info "How the architecture links to the control (mcp-server node):"
echo -e "${BLUE}The mcp-server node references the control via requirement-url and config-url:${NC}"
echo ""
# Extract just the controls section from mcp-server node
sed -n '/"unique-id": "mcp-server"/,/"unique-id": "trades-api"/p' calm/trades-api-and-mcp.architecture.json | sed -n '/"controls":/,/^      }/p'
echo ""
read -p "Press Enter to continue..."

heading "Step 3: Generate infrastructure from CALM architecture"
info "Extracting denied symbols from control configuration..."
calm template \
  --architecture calm/trades-api-and-mcp.architecture.json \
  --output infrastructure \
  --bundle bundle \
  --clear-output-directory
echo ""

heading "Step 4: Show generated ConfigMap"
info "ConfigMap generated from control:"
cat infrastructure/kubernetes/denied-symbols-configmap.yaml
echo ""
read -p "Press Enter to apply the configuration..."

heading "Step 5: Apply the new configuration"
info "Applying updated Kubernetes resources..."
kubectl apply -k infrastructure/kubernetes
kubectl rollout restart deployments     
echo ""

heading "Step 6: Wait for pods to be ready"
info "Waiting for all pods to be ready..."
kubectl wait --for=condition=ready pod --all --timeout=90s
echo ""

heading "Step 7: Verify deployment"
info "Current pods:"
kubectl get pods -o wide
echo ""
# info "ConfigMap in cluster:"
# kubectl get configmap denied-symbols -o yaml
# echo ""

success "Scenario 2 complete!"