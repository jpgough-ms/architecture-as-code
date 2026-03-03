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

After the deployment completes, start port-forwarding in a separate terminal:

```bash
cd ..
./port-forward.sh
```

## 2. Expose the MCP Server for Claude

The `port-forward.sh` script automatically makes the MCP server available at `http://localhost:8080`. To connect Claude:

### Step 2.1: Create a Public Tunnel with ngrok

Use `ngrok` to create a secure public URL that tunnels traffic to your local port `8080`.

If you don't have it, [install ngrok](https://ngrok.com/download) and make sure you have authenticated your agent.

Run:

```bash
ngrok http 8080
```

`ngrok` will provide you with a public HTTPS URL (e.g., `https://<unique-id>.ngrok-free.app`).

### Step 2.2: Provide the URL to Claude

You can now use this public `ngrok` URL as the endpoint for Claude to connect to your MCP server. When Claude makes requests to this URL, `ngrok` will securely forward them to your local `trades-mcp-server` running in Minikube.
