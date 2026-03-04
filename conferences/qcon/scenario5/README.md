# Kubernetes Deployment Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [minikube](https://minikube.sigs.k8s.io/docs/start/) installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed

## 1. Start Minikube

```bash
minikube start
```

Verify the cluster is running:

```bash
kubectl cluster-info
```

## 2. Load Docker Images into Minikube

Since the deployments use `imagePullPolicy: Never`, images must be loaded manually into minikube's container runtime.

### Build the images (from the repo root)

```bash
docker build -f rest/src/main/docker/Dockerfile -t jpgough/trades-rest-server:latest .
docker build -f mcp/src/main/docker/Dockerfile -t jpgough/trades-mcp-server:latest .
docker build -f a2a/src/main/docker/Dockerfile -t jpgough/trades-a2a-server:latest .
```

### Load into minikube

```bash
minikube image load jpgough/trades-rest-server:latest
minikube image load jpgough/trades-mcp-server:latest
minikube image load jpgough/trades-a2a-server:latest
```

## 3. Deploy to Kubernetes

```bash
kubectl apply -k kubernetes/
```

Verify all pods are running:

```bash
kubectl get pods
```

You should see three pods:

| Pod | Description |
|-----|-------------|
| `trades-*` | REST API (trade CRUD) |
| `trades-mcp-server-*` | MCP server (LLM tool-use) |
| `trades-a2a-server-*` | A2A server (agent-to-agent) |

## 4. Port Forwarding

The services are ClusterIP-only, so you need port-forwards to access them from your machine.

### REST API (port 9090)

```bash
kubectl port-forward svc/trades 9090:80
```

- Swagger UI: http://localhost:9090/q/swagger-ui
- Health check: http://localhost:9090/q/health

### MCP Server (port 9102)

```bash
kubectl port-forward svc/trades-mcp-server 9102:80
```

### A2A Server (port 9103)

```bash
kubectl port-forward svc/trades-a2a-server 9103:80
```

- Agent Card: http://localhost:9103/.well-known/agent.json

## 5. Start the QCon Agent UI

The UI runs as a Docker container outside minikube. It connects to the A2A server via the port-forward above.

### Run the UI

```bash
docker run -d \
  --name qcon-agent-ui \
  -p 3000:80 \
  -e A2A_URL=http://host.docker.internal:9103 \
  jpgough/qcon-agent-ui:latest
```

Open http://localhost:3000 in your browser, then click **Connect**.

> **Note:** `host.docker.internal` resolves to your host machine from inside Docker on macOS and Windows. On Linux, use `--network host` and set `A2A_URL=http://localhost:9103` instead.

### Stop the UI

```bash
docker rm -f qcon-agent-ui
```

## Quick Start (all commands)

```bash
# Start cluster
minikube start

# Build and load images
docker build -f rest/src/main/docker/Dockerfile -t jpgough/trades-rest-server:latest .
docker build -f mcp/src/main/docker/Dockerfile -t jpgough/trades-mcp-server:latest .
docker build -f a2a/src/main/docker/Dockerfile -t jpgough/trades-a2a-server:latest .
minikube image load jpgough/trades-rest-server:latest
minikube image load jpgough/trades-mcp-server:latest
minikube image load jpgough/trades-a2a-server:latest

# Deploy
kubectl apply -k kubernetes/

# Port forwards (run each in a separate terminal)
kubectl port-forward svc/trades 9090:80
kubectl port-forward svc/trades-mcp-server 9102:80
kubectl port-forward svc/trades-a2a-server 9103:80

# Start UI
docker run -d --name qcon-agent-ui -p 3000:80 \
  -e A2A_URL=http://host.docker.internal:9103 \
  jpgough/qcon-agent-ui:latest
```

Then open http://localhost:3000.
