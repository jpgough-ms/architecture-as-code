# QCon CALM Demos

This directory contains demonstration scenarios for the FINOS CALM (Common Architecture Language Model) project presented at QCon.

This orchestrates the complete demo experience:
1. **Scenario 1**: Deploy basic MCP server and Trades API
2. **Scenario 2**: Add CALM control-based guardrails

The `port-forward.sh` script runs independently and provides access to both services on localhost.

## Individual Scenarios

### Scenario 1: Basic MCP Deployment

Demonstrates deploying a Model Context Protocol (MCP) server with Kubernetes network policies.

```bash
cd scenario1
./demo.sh
```

**What it does:**
- Starts Minikube cluster with Calico CNI
- Deploys MCP server and Trades API
- Applies network policies for micro-segmentation
- Shows generated infrastructure

**After deployment**, start port-forwarding in a separate terminal:
```bash
./port-forward.sh
```

### Scenario 2: CALM Control-Based Guardrails

Demonstrates how CALM controls define and enforce security policies through infrastructure generation.

```bash
cd scenario2
./demo.sh
```

**What it does:**
- Displays the MCP Guardrail control configuration
- Shows architecture-to-control linkage
- Generates ConfigMap from control (denied trading symbols: VOD, GME, AMC)
- Re-deploys with guardrail enforcement

**Note:** Scenario 2 expects Scenario 1 to be running. Start port-forwarding separately using `./port-forward.sh` before testing with Claude.

## Architecture Overview

Both scenarios use the FINOS CALM specification to:
- Define architecture in JSON format
- Link controls to architecture components
- Generate Kubernetes infrastructure from architecture models
- Enforce security policies through configuration

## Key Features Demonstrated

- **Architecture as Code**: Complete infrastructure defined in CALM JSON
- **Control Integration**: Security controls linked directly to architecture components
- **Pattern-Based Generation**: Kubernetes manifests generated from CALM patterns
- **MCP Integration**: Model Context Protocol for AI-driven interactions
- **Network Security**: Kubernetes network policies for micro-segmentation
- **Guardrails**: Trading symbol restrictions enforced via controls

## Requirements

- `minikube`
- `kubectl`
- `calm` CLI (`npm install -g @finos/calm-cli`)
- `bat` (for syntax highlighting)
- `tree` (for directory visualization)
- `ngrok` (optional, for exposing MCP server to Claude)

## Port Forwarding

The `port-forward.sh` script provides access to both services:

```bash
./port-forward.sh
```

This starts port-forwards for:
- **MCP Server**: http://localhost:8080
- **Trades API**: http://localhost:8081

Run this in a separate terminal and keep it running during the demo. Press Ctrl+C to stop.

## Connecting Claude

After running Scenario 1 and starting port-forwarding, the MCP server is available at `http://localhost:8080`. To connect Claude:

1. Start port-forwarding: `./port-forward.sh` (runs in one terminal)
2. In another terminal, run: `ngrok http 8080`
3. Copy the ngrok HTTPS URL
4. Configure Claude to use that URL as the MCP server endpoint

**Important:** After running Scenario 2, the MCP server will enforce the guardrail - queries for denied symbols (VOD, GME, AMC) will be rejected.

## Cleanup

To tear down the demo environment:

```bash
kubectl delete -k scenario2/infrastructure/kubernetes
minikube stop --profile secure
```

## Learn More

- [FINOS CALM Specification](https://calm.finos.org)
- [CALM GitHub Repository](https://github.com/finos/architecture-as-code)
- [Model Context Protocol](https://modelcontextprotocol.io)
