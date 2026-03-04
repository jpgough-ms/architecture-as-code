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
    echo -e "${RED}${text}${NC}\n"
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

# Ensure we're in the scenario5 directory
cd "$(dirname "$0")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       QCon Agent Demo — Autonomous Trade Rebalancer          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# Stage 1: Start Minikube and Load Images
# ============================================================================

stage "Stage 1 — Setup Minikube Cluster"

heading "Starting Minikube"
run_command "minikube start"
minikube start
success "Minikube cluster started"
echo "Press Enter to continue..."
read

heading "Verify Cluster"
run_command "kubectl cluster-info"
kubectl cluster-info
echo ""
echo "Press Enter to continue..."
read

heading "Pull Docker Images from Docker Hub"
info "Pulling pre-built images for trades, rebalancer agent, and UI..."
echo ""
run_command "docker pull --platform linux/amd64 jpgough/trades-rest-server:latest"
docker pull --platform linux/amd64 jpgough/trades-rest-server:latest
echo ""
run_command "docker pull --platform linux/amd64 jpgough/trades-a2a-server:latest"
docker pull --platform linux/amd64 jpgough/trades-a2a-server:latest
echo ""
run_command "docker pull --platform linux/amd64 jpgough/rebalancer-agent:latest"
docker pull --platform linux/amd64 jpgough/rebalancer-agent:latest
echo ""
run_command "docker pull --platform linux/amd64 jpgough/qcon-agent-ui:latest"
docker pull --platform linux/amd64 jpgough/qcon-agent-ui:latest
success "All images pulled successfully"
echo "Press Enter to continue..."
read

heading "Load Images into Minikube"
info "Loading images into minikube's container runtime..."
echo ""
run_command "minikube image load jpgough/trades-rest-server:latest"
minikube image load jpgough/trades-rest-server:latest
echo ""
run_command "minikube image load jpgough/trades-a2a-server:latest"
minikube image load jpgough/trades-a2a-server:latest
success "Images loaded into minikube"
echo "Press Enter to continue..."
read

# ============================================================================
# Stage 2: Deploy to Kubernetes
# ============================================================================

stage "Stage 2 — Deploy Trade Management Platform"

heading "Deploy Kubernetes Manifests"
run_command "kubectl apply -k ."
kubectl apply -k .
success "Manifests applied"
echo "Press Enter to continue..."
read

heading "Wait for Pods to be Ready"
info "Watching pod status (press Ctrl+C when all pods are Running)..."
echo ""
run_command "kubectl get pods -w"
kubectl get pods
echo ""
info "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=trades --timeout=120s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=trades-a2a-server --timeout=120s 2>/dev/null || true
echo ""
run_command "kubectl get pods"
kubectl get pods
success "All pods are ready"
echo "Press Enter to continue..."
read

# ============================================================================
# Stage 3: Start Port Forwarding
# ============================================================================

stage "Stage 3 — Setup Port Forwarding"

heading "Start A2A Server Port Forward"
info "Starting port-forward for A2A server on port 9103..."
echo ""
run_command "kubectl port-forward svc/trades-a2a-server 9103:80 &"
kubectl port-forward svc/trades-a2a-server 9103:80 > /dev/null 2>&1 &
PF_PID=$!
sleep 2
success "Port-forward started (PID: $PF_PID)"
echo "Press Enter to continue..."
read

heading "Verify A2A Server is Accessible"
run_command "curl -s http://localhost:9103/.well-known/agent.json | head -10"
echo ""
curl -s http://localhost:9103/.well-known/agent.json | head -10
echo ""
success "A2A server is responding"
echo "Press Enter to continue..."
read

# ============================================================================
# Stage 4: Run the Rebalancer Agent
# ============================================================================

stage "Stage 4 — Start Autonomous Rebalancer Agent"

heading "Run Rebalancer Agent in Background"
info "The rebalancer monitors portfolio every 8 seconds: OBSERVE → DECIDE → ACT"
echo ""
run_command "docker run -d --name rebalancer-agent -e A2A_URL=http://host.docker.internal:9103 jpgough/rebalancer-agent:latest rebalancer"
docker run -d \
  --name rebalancer-agent \
  -e A2A_URL=http://host.docker.internal:9103 \
  jpgough/rebalancer-agent:latest rebalancer
success "Rebalancer agent started"
echo "Press Enter to continue..."
read

heading "View Agent Logs"
run_command "docker logs rebalancer-agent"
echo ""
docker logs rebalancer-agent
echo ""
info "Agent is now monitoring the portfolio..."
echo "Press Enter to continue..."
read

# ============================================================================
# Stage 5: Start Agent UI
# ============================================================================

stage "Stage 5 — Launch Agent UI"

heading "Start QCon Agent UI"
run_command "docker run -d --name qcon-agent-ui -p 3000:80 -e A2A_URL=http://host.docker.internal:9103 jpgough/qcon-agent-ui:latest"
docker run -d \
  --name qcon-agent-ui \
  -p 3000:80 \
  -e A2A_URL=http://host.docker.internal:9103 \
  jpgough/qcon-agent-ui:latest
success "Agent UI started"
echo ""
info "Open http://localhost:3000 in your browser and click Connect"
echo ""
echo "Press Enter to continue to flood the portfolio..."
read

# ============================================================================
# Stage 6: Inject Portfolio Imbalance
# ============================================================================

stage "Stage 6 — Flood Portfolio with NVDA Trades"

heading "Create Portfolio Imbalance"
info "Booking 20 trades of 5,000 NVDA shares each (100k total)..."
info "This will trigger the rebalancer agent to detect and correct the imbalance."
info "Watch the UI at http://localhost:3000 to see the rebalancing in real-time!"
echo ""
run_command "docker run --rm -e A2A_URL=http://host.docker.internal:9103 jpgough/rebalancer-agent:latest flood NVDA 20 5000"
docker run --rm \
  -e A2A_URL=http://host.docker.internal:9103 \
  jpgough/rebalancer-agent:latest flood NVDA 20 5000
success "Imbalance injected — rebalancer will now correct it"
echo "Press Enter to continue..."
read

heading "Watch Rebalancer Agent Correct the Imbalance"
info "The agent detects the imbalance and autonomously rebalances the portfolio."
echo ""
run_command "docker logs -f rebalancer-agent"
echo ""
info "Press Ctrl+C after ~30 seconds to stop watching logs..."
docker logs -f rebalancer-agent &
LOGS_PID=$!
sleep 30
kill $LOGS_PID 2>/dev/null || true
echo ""
success "Rebalancer has corrected the portfolio imbalance"
echo "Press Enter when ready to see cleanup instructions..."
read

# ============================================================================
# Summary
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Demo Complete — What You've Seen                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}  1. Minikube Cluster${NC} → Trade Management platform deployed"
echo -e "${CYAN}  2. Rebalancer Agent${NC} → Autonomous monitoring (OBSERVE → DECIDE → ACT)"
echo -e "${CYAN}  3. Portfolio Flood${NC} → 100k NVDA shares injected"
echo -e "${CYAN}  4. Auto-Rebalance${NC} → Agent detected and corrected imbalance"
echo -e "${CYAN}  5. Agent UI${NC} → Web interface at http://localhost:3000"
echo ""
success "The autonomous agent is continuously monitoring the portfolio."
echo ""

echo -e "${YELLOW_BOLD}Cleanup Commands:${NC}"
echo ""
echo "  # Stop containers"
echo "  docker rm -f rebalancer-agent qcon-agent-ui"
echo ""
echo "  # Stop port-forward"
echo "  kill $PF_PID"
echo ""
echo "  # Delete Kubernetes resources"
echo "  kubectl delete -k ."
echo ""
echo "  # Stop minikube"
echo "  minikube stop"
echo ""
echo -e "${YELLOW}Run these commands when you're done with the demo.${NC}"
echo ""
