## Kubernetes

Manifests are in the `kubernetes/` directory. The MCP server connects to the REST API via the `trades` Kubernetes service (`http://trades`).

**Note:** The Kubernetes manifests use `imagePullPolicy: Never`, so images must be available in the local Docker daemon that your cluster uses. 
For minikube
> ```bash
> minikube image load jpgough/trades-rest-server:latest
> minikube image load jpgough/trades-mcp-server:latest
> ```

### Deploy

```bash
kubectl apply -k kubernetes/
```

This creates:

| Resource   | Kind       | Description                        |
|------------|------------|------------------------------------|
| `trades`   | Deployment | REST API (1 replica)               |
| `trades`   | Service    | ClusterIP on port 80 → 8080       |
| `trades-mcp-server` | Deployment | MCP server (1 replica) |
| `trades-mcp-server` | Service    | ClusterIP on port 80 → 8080 |

### Verify

```bash
kubectl get pods
kubectl get svc
```

### Remove

```bash
kubectl delete -k kubernetes/
```
