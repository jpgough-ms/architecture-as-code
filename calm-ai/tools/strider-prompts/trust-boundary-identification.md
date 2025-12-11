# Trust Boundary Identification Guide

## What is a Trust Boundary?

A trust boundary is a conceptual line where the level of trust changes. Data crossing a trust boundary should be validated, and security controls should be applied at these points.

## Identifying Trust Boundaries in CALM Architectures

### 1. Node Type Transitions

Trust boundaries exist when relationships connect nodes of different types:

| Source Node Type | Destination Node Type | Trust Boundary? | Rationale |
|------------------|----------------------|-----------------|-----------|
| `actor` / `user` | `service` | ✅ Yes | External user interacting with system |
| `mcp-client` | `service` (mcp-server) | ✅ Yes | AI client invoking tools |
| `service` | `database` | ✅ Yes | Application to data tier |
| `service` | `service` | ⚠️ Maybe | Depends on deployment context |
| `service` | `external-system` | ✅ Yes | Internal to external boundary |
| `internal` | `external` | ✅ Yes | Network boundary |

### 2. Protocol Changes

Trust boundaries exist when protocols change, indicating different security contexts:

```json
// Example: Protocol transition indicates trust boundary
{
  "relationships": [
    {
      "unique-id": "public-to-gateway",
      "protocol": "HTTPS",  // Public internet
      "relationship-type": { "connects": {...} }
    },
    {
      "unique-id": "gateway-to-service",
      "protocol": "mTLS",  // Internal mutual TLS
      "relationship-type": { "connects": {...} }
    }
  ]
}
```

| Protocol Transition | Trust Boundary Type |
|--------------------|---------------------|
| HTTP → HTTPS | Encryption boundary |
| HTTPS → mTLS | Mutual authentication boundary |
| REST → gRPC | Internal service mesh boundary |
| Any → Message Queue | Async processing boundary |

### 3. Deployment Boundaries

The `deployed-in` relationship type explicitly defines deployment contexts:

```json
{
  "relationship-type": {
    "deployed-in": {
      "container": "k8s-cluster",
      "nodes": ["mcp-server", "reports-api", "secret-api"]
    }
  }
}
```

**Trust boundaries from deployment:**
- Components inside vs outside the deployment container
- Different namespaces within the same cluster
- Different clusters or cloud regions
- On-premises vs cloud deployments

### 4. Control-Based Boundaries

Nodes with security controls often indicate trust boundaries:

```json
{
  "unique-id": "secret-api",
  "controls": {
    "security": {
      "description": "Lock down an individual POD workload",
      "requirements": [...]
    }
  }
}
```

**Controls that suggest boundaries:**
- Network policies (micro-segmentation)
- Authentication/authorization controls
- Encryption requirements
- Audit logging requirements

### 5. Metadata Indicators

CALM metadata can indicate security-relevant boundaries:

```json
{
  "metadata": [
    {
      "kubernetes": {
        "namespace": "production"  // vs "staging" namespace
      }
    },
    {
      "data-classification": "confidential"  // Data sensitivity
    }
  ]
}
```

### 6. AI/MCP-Specific Boundaries

For systems with AI components, additional trust boundaries apply:

| Boundary | Description |
|----------|-------------|
| MCP Client ↔ MCP Server | Tool invocation boundary |
| MCP Server ↔ Tools/APIs | Agent-to-resource boundary |
| Model ↔ External Data | RAG/retrieval boundary |
| User ↔ AI Agent | Human-AI interaction boundary |
| Agent ↔ Agent | Multi-agent trust boundary |

## Trust Boundary Classification

Classify each boundary for threat analysis:

### Boundary Criticality Levels

| Level | Description | Examples |
|-------|-------------|----------|
| 🔴 **Critical** | Crosses network perimeter or handles highly sensitive data | Internet-facing APIs, payment systems |
| 🟠 **High** | Crosses internal security zones | Service mesh to database, AI to tools |
| 🟡 **Medium** | Same zone, different components | Microservice to microservice |
| 🟢 **Low** | Same component, different functions | Internal function calls (usually out of scope) |

## CALM Architecture Analysis Checklist

When analyzing a CALM architecture for trust boundaries:

1. **List all nodes** and categorize by type
2. **Map all relationships** and note protocols
3. **Identify deployment containers** (deployed-in relationships)
4. **Find nodes with controls** - these often guard boundaries
5. **Check for external entities** - always a trust boundary
6. **Look for AI/MCP components** - special boundary considerations
7. **Review metadata** for security-relevant information

## Output Format

Document discovered trust boundaries in this format:

```markdown
## Trust Boundaries

| ID | Boundary Name | From | To | Criticality | Notes |
|----|---------------|------|-----|-------------|-------|
| TB-1 | Internet Edge | External User | API Gateway | 🔴 Critical | Public internet exposure |
| TB-2 | Service Mesh | API Gateway | Backend Service | 🟠 High | mTLS protected |
| TB-3 | AI Tool Boundary | MCP Client | MCP Server | 🔴 Critical | AI agent tool invocation |
| TB-4 | Data Layer | Service | Database | 🟠 High | Encrypted connection |
```

## Questions to Ask if Unclear

If the CALM architecture doesn't provide enough information:

1. **Authentication**: "How do components authenticate with each other?"
2. **Network**: "Are these components in the same network zone?"
3. **Data Sensitivity**: "What classification of data flows between these?"
4. **External Access**: "Is this component accessible from the internet?"
5. **AI Context**: "What tools/resources can the AI agent access?"
