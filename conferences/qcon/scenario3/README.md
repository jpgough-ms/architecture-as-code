# Scenario 3: CALM Governance and Architecture Controls

This scenario demonstrates **two-level governance enforcement** using CALM architecture controls:

1. **Runtime Infrastructure Validation** - Checking actual cluster state before deployment
2. **Design-Time Pattern Validation** - Ensuring architecture conforms to required controls

## Control Types

This scenario enforces three types of CALM controls:

### 1. Micro-Segmentation Control (security-001)

**Applied to**: Kubernetes cluster node  
**Purpose**: Ensures the cluster supports network policy enforcement

```json
{
  "permit-ingress": true,   // Allow external traffic to services
  "permit-egress": false    // Block inter-service traffic by default
}
```

This control requires the cluster to have a CNI that supports network policies (e.g., Calico).

### 2. Permitted Connection Control (security-002)

**Applied to**: All `connects` relationships  
**Purpose**: Explicitly authorizes each connection between services

```json
{
  "reason": "Business justification for this connection",
  "protocol": "HTTP"  // HTTP, HTTPS, JDBC, gRPC, etc.
}
```

This implements "zero-trust networking" where all connections must be declared and justified.

### 3. MCP Guardrail Control (mcp-001)

**Applied to**: MCP Server node  
**Purpose**: Restricts access to specific trading symbols

```json
{
  "denied-symbols": ["VOD", "GME", "AMC"],
  "enforcement-point": "mcp-server"
}
```

This prevents the MCP server from querying high-risk or restricted securities.

## Files

### Control Definitions

- `calm/controls/micro-segmentation.requirement.json` - Schema for cluster network policy requirement
- `calm/controls/micro-segmentation.config.json` - Configuration (deny-all with ingress)
- `calm/controls/permitted-connection.requirement.json` - Schema for connection authorization
- `calm/controls/permitted-connection-http.config.json` - HTTP connection authorization
- `calm/controls/mcp-guardrail.requirement.json` - Schema for data access restrictions
- `calm/controls/mcp-guardrail.config.json` - Denied trading symbols

### Pattern and Architectures

- `calm/trades-api-and-mcp.pattern.json` - Pattern enforcing all three control types
- `calm/trades-api-and-mcp-conforming.architecture.json` - ✅ Architecture with all controls (passes validation)
- `calm/trades-api-and-mcp-non-conforming.architecture.json` - ❌ Architecture missing controls (fails validation)

### Governance Infrastructure

- `bundle/governance-transformer.js` - Validates runtime cluster state and architecture controls
- `bundle/deployer.hbs` - Generates deployment validation script
- `bundle/index.json` - Bundle configuration

## Running the Demo

```bash
./demo.sh
```

The demo demonstrates:

1. **Runtime Governance - Insecure Cluster** ❌
   - Starts default minikube cluster (no Calico)
   - Runs governance checks
   - Deployment is **blocked** due to missing network policy support

2. **Runtime Governance - Secure Cluster** ✅
   - Starts secure minikube cluster with Calico CNI
   - Runs governance checks
   - All infrastructure requirements are **met**

3. **Pattern Validation - Non-Conforming** ❌
   - Validates architecture missing permitted-connection control
   - Validation **fails** as expected

4. **Pattern Validation - Conforming** ✅
   - Validates architecture with all required controls
   - Validation **passes**

## How It Works

### Runtime Validation

The governance transformer (`governance-transformer.js`):

1. Reads the architecture and extracts cluster requirements
2. Executes `minikube profile list` to check actual cluster state
3. Validates:
   - Cluster type is 'minikube'
   - Cluster profile is 'secure'
   - Cluster is running
   - Micro-segmentation control is present
   - All connections have permitted-connection controls
   - MCP Guardrail is configured
4. Returns validation results and `deploymentReady` flag

The deployer template (`deployer.hbs`):

1. Receives governance validation results
2. Generates `deployer.sh` script with:
   - ✅ Success message if all checks pass (exit 0)
   - ❌ Failure message with remediation steps (exit 1)

### Design-Time Validation

The pattern validation (`calm validate`):

1. Compares architecture against pattern schema
2. Checks that required controls are present:
   - k8s-cluster **MUST** have micro-segmentation control
   - All connects relationships **MUST** have permitted-connection controls
   - mcp-server **MUST** have mcp-guardrail control
3. Reports validation errors if controls are missing

## Key Takeaways

- **Shift-Left Governance**: Controls are enforced **before** deployment, not after
- **Two-Level Validation**: Both infrastructure state (runtime) and architecture design (pattern) are validated
- **Automated Compliance**: Governance checks are automated through transformers and validators
- **Clear Remediation**: Failures provide specific instructions on how to fix issues
- **Architecture as Code**: Controls are declared in architecture YAML/JSON, version-controlled and auditable

## Cleanup

```bash
# Stop secure cluster
minikube stop --profile=secure

# Delete clusters
minikube delete --profile=default
minikube delete --profile=secure

# Remove generated files
rm -f deployer.sh
```

