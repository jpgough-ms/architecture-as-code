# QCon CALM Demos

This directory contains five demonstration scenarios for the FINOS CALM (Common Architecture Language Model) project presented at QCon. Run all scenarios in sequence using the orchestrator, or individually from each scenario directory.

## Quick Start: Full Demo Flow

```bash
cd conferences/qcon
./demo-flow.sh
```

The flow guides you through all 5 scenarios with interactive prompts and a choice of **Concise** (presentation) or **Story** (learning) mode.

---

## Scenarios

### Scenario 1: Deploy API & MCP Architecture

Deploys the Trades REST API, MCP server, and A2A server onto a Kubernetes cluster.

```bash
cd scenario1 && ./demo.sh
```

**What it does:**
- Starts Minikube with the `secure` profile and Calico CNI (network policy support)
- Loads pre-built Docker images into Minikube
- Generates Kubernetes manifests from CALM architecture using `calm template`
- Deploys all services to the cluster
- Verifies pod readiness

**After deployment**, start port-forwarding in a separate terminal:

```bash
# From scenario1/
./port-forward.sh
```

Services available at:
- **MCP Server**: http://localhost:8080
- **Trades API**: http://localhost:8081
- **A2A Server**: http://localhost:9103

---

### Scenario 2: Introducing Controls and Governance

Adds a declarative MCP guardrail control that restricts access to specific trading symbols, showing how CALM controls translate directly into deployed configuration.

```bash
cd scenario2 && ./demo.sh
```

**What it does:**
- Displays the MCP Guardrail control (`denied-symbols: VOD, GME, AMC`)
- Shows how the control is linked to the MCP server node in the architecture
- Regenerates infrastructure with `calm template` — produces a Kubernetes ConfigMap from the control
- Re-deploys and restarts the MCP server to load the new guardrail

**Prerequisite:** Scenario 1 must be running. Port-forwards from `scenario1/port-forward.sh` should remain active.

---

### Scenario 3: Gating Deployments

Demonstrates governance gates powered by CALM Hub. Deployments are blocked unless the architecture uses an approved pattern and conforms to it.

```bash
cd scenario3 && ./demo.sh
```

**Prerequisite:** CALM Hub must be running. The demo will detect if it's not running and offer to start it automatically via Docker Compose:

```bash
# To start manually:
cd calm-hub/deploy-qcon && docker-compose up -d
```

**What it does:**
1. **Generates a deployer** from the template bundle using `calm template`
2. **Gate 1 — Pattern Registration**: checks CALM Hub (`http://localhost:8085`) to verify the pattern referenced by the architecture is registered under the `qcon` namespace — rejects if not found
3. **Gate 2 — Architecture Validation**: runs `calm validate` to confirm the architecture conforms to the pattern (all required controls present) — rejects a non-conforming architecture, passes a conforming one

CALM Hub has a retry mechanism: up to 3 attempts with options to auto-start, retry, or quit.

---

### Scenario 4: Scaling Deployments and Operational Change

Shows how a platform-wide change (adding resource limits) is rolled out automatically by releasing a new bundle version — without changing any team-owned architecture files.

```bash
cd scenario4 && ./demo.sh
```

**What it does:**
- Inspects running pods from Scenario 3 — no CPU/memory limits defined
- Shows the diff between `bundle-v1` and `bundle-v2` (new resource limits added)
- Regenerates infrastructure using `calm template` with `bundle-v2` — same architecture, new platform defaults injected
- Deploys and verifies that resource limits are now enforced

**Key insight:** Architecture = WHAT (team-owned, stable). Bundle = HOW (platform-owned, evolves independently).

---

### Scenario 5: Rapid Platform Adoption (A2A)

Demonstrates the Agent-to-Agent (A2A) protocol: an autonomous rebalancer agent that observes portfolio state, makes decisions, and corrects imbalances without human input.

```bash
cd scenario5 && ./demo.sh
```

**What it does:**
- Verifies the running Minikube cluster
- Generates and applies Kubernetes manifests via `calm template`
- Starts port-forwarding for the A2A server on `:9103`
- Launches the QCon Agent UI Docker container at http://localhost:3000
- Floods the portfolio with trades via `run-flood.sh`
- Starts the autonomous rebalancer agent via `run-rebalancer.sh` — watch it correct imbalances in real time

**Port-forwards needed:**
```bash
# Required — A2A server (started automatically by demo.sh):
./port-forward-a2a.sh

# Optional — Trades API debug access:
kubectl port-forward svc/trades 8081:80 --namespace default
```

---

## Requirements

| Tool | Purpose |
|------|---------|
| `minikube` | Local Kubernetes cluster |
| `kubectl` | Cluster management |
| `calm` | Architecture-to-infrastructure generation (`npm install -g @finos/calm-cli`) |
| `bat` | Syntax-highlighted file display (`brew install bat`) |
| `tree` | Directory visualisation (`brew install tree`) |
| `jq` | JSON processing (`brew install jq`) |
| `docker` / `docker-compose` | CALM Hub (Scenario 3) and Agent UI (Scenario 5) |
| `ngrok` | Optional — expose MCP server to Claude |

---

## Connecting Claude to the MCP Server

After Scenario 1 (or 2) is running with port-forwarding active:

1. In a separate terminal: `ngrok http 8080`
2. Copy the ngrok HTTPS URL
3. Configure Claude to use that URL as the MCP server endpoint

After Scenario 2, the MCP server enforces the guardrail — queries for `VOD`, `GME`, `AMC` will be rejected.

---

## Cleanup

```bash
# Stop Kubernetes resources
kubectl delete -k scenario4/generated/kubernetes
minikube stop --profile secure
minikube delete --profile secure

# Stop CALM Hub
cd calm-hub/deploy-qcon && docker-compose down

# Stop Agent UI
docker rm -f qcon-agent-ui
```

---

## Learn More

- [FINOS CALM Specification](https://calm.finos.org)
- [CALM GitHub Repository](https://github.com/finos/architecture-as-code)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Agent-to-Agent Protocol](https://google.github.io/A2A/)
