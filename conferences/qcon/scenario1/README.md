# Scenario 1: Secure MCP with Network Policies

This scenario demonstrates how to deploy a secure Model Context Protocol (MCP) server with Kubernetes network policies.

## 1. Run the Demo

The `demo.sh` script will:
1.  Start a Minikube cluster with the Calico CNI for network policy support.
2.  Load the required Docker images into the cluster.
3.  Generate Kubernetes manifests from the CALM architecture model using the `calm` CLI.
4.  Deploy the `trades-api` and `trades-mcp-server` to the cluster.
5.  Apply network policies to restrict traffic and a default-deny policy to secure the namespace.

To run the demo, execute the script from this directory:

```bash
./demo.sh
```

## 2. Expose the MCP Server for Claude

To allow an external service like Claude to interact with your local MCP server, you need to expose it to the public internet. We will use `kubectl port-forward` and `ngrok`.

### Step 2.1: Port-Forward the MCP Service

First, find the running `trades-mcp-server` pod and forward its port `8080` to your local machine.

Open a new terminal and run the following command:

```bash
# Forward the mcp-server service port 8080 to your local machine
kubectl port-forward service/trades-mcp-server 8080:8080
```

This will make the service available at `http://localhost:8080`.

### Step 2.2: Create a Public Tunnel with ngrok

Now, use `ngrok` to create a secure public URL that tunnels traffic to your local port `8080`.

If you don't have it, [install ngrok](https://ngrok.com/download) and make sure you have authenticated your agent.

In another new terminal, run:

```bash
ngrok http 8080
```

`ngrok` will provide you with a public HTTPS URL (e.g., `https://<unique-id>.ngrok-free.app`).

### Step 2.3: Provide the URL to Claude

You can now use this public `ngrok` URL as the endpoint for Claude to connect to your MCP server. When Claude makes requests to this URL, `ngrok` will securely forward them to your local `trades-mcp-server` running in Minikube.
