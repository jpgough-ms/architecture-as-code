# Data Flow Diagram Generation Guide

## Overview

Generate Mermaid flowchart diagrams from CALM architectures that clearly show:
- System components (nodes)
- Data flows (relationships)
- Trust boundaries (as subgraphs)

## Mermaid Flowchart Structure

Use `flowchart TB` (top-to-bottom) or `flowchart LR` (left-to-right) with subgraphs for trust boundaries.

### Basic Template

```mermaid
flowchart TB
    subgraph TB1["🔴 Trust Boundary: External"]
        User[("👤 User")]
    end
    
    subgraph TB2["🟠 Trust Boundary: DMZ"]
        Gateway["🌐 API Gateway"]
    end
    
    subgraph TB3["🟡 Trust Boundary: Internal"]
        Service["⚙️ Backend Service"]
        DB[("💾 Database")]
    end
    
    User -->|"HTTPS"| Gateway
    Gateway -->|"mTLS"| Service
    Service -->|"TLS"| DB
```

## Node Shape Mapping

Map CALM node types to Mermaid shapes:

| CALM Node Type | Mermaid Shape | Icon | Example |
|----------------|---------------|------|---------|
| `actor` / `user` | `(( ))` Stadium | 👤 | `User(("👤 User"))` |
| `service` | `[ ]` Rectangle | ⚙️ | `API["⚙️ API Service"]` |
| `database` | `[( )]` Cylinder | 💾 | `DB[("💾 Database")]` |
| `mcp-client` | `{{ }}` Hexagon | 🤖 | `Claude{{"🤖 Claude"}}` |
| `mcp-server` | `[ ]` Rectangle | 🔧 | `MCP["🔧 MCP Server"]` |
| `system` | `[[ ]]` Subroutine | 🏗️ | `K8s[["🏗️ K8s Cluster"]]` |
| `external-system` | `> ]` Flag | 🌍 | `Ext>"🌍 External API"]` |
| `queue` | `[/ /]` Parallelogram | 📬 | `Queue[/"📬 Message Queue"/]` |

## Trust Boundary Styling

Use subgraph styling to indicate criticality:

```mermaid
flowchart TB
    subgraph Critical["🔴 Critical: Internet Edge"]
        style Critical fill:#ffcccc,stroke:#cc0000
        A["Component A"]
    end
    
    subgraph High["🟠 High: Service Layer"]
        style High fill:#ffe6cc,stroke:#cc6600
        B["Component B"]
    end
    
    subgraph Medium["🟡 Medium: Data Layer"]
        style Medium fill:#ffffcc,stroke:#cccc00
        C["Component C"]
    end
```

## Converting CALM to Mermaid

### Step 1: Extract Nodes

From CALM:
```json
{
  "nodes": [
    {"unique-id": "mcp-client", "name": "Claude", "node-type": "mcp-client"},
    {"unique-id": "mcp-server", "name": "Reports MCP Server", "node-type": "service"},
    {"unique-id": "reports-api", "name": "Reports API", "node-type": "service"}
  ]
}
```

To Mermaid:
```mermaid
Claude{{"🤖 Claude"}}
MCP["🔧 Reports MCP Server"]
Reports["⚙️ Reports API"]
```

### Step 2: Extract Relationships

From CALM:
```json
{
  "relationships": [
    {
      "unique-id": "mcp-client-mcp-server",
      "protocol": "HTTPS",
      "relationship-type": {
        "connects": {
          "source": {"node": "mcp-client"},
          "destination": {"node": "mcp-server"}
        }
      }
    }
  ]
}
```

To Mermaid:
```mermaid
Claude -->|"HTTPS"| MCP
```

### Step 3: Identify and Create Trust Boundary Subgraphs

Based on the trust boundary analysis, group nodes:

```mermaid
flowchart TB
    subgraph External["🔴 External: AI Client"]
        Claude{{"🤖 Claude"}}
    end
    
    subgraph K8s["🟠 Kubernetes Cluster"]
        MCP["🔧 Reports MCP Server"]
        Reports["⚙️ Reports API"]
        Secret["🔒 Secret API"]
    end
    
    Claude -->|"HTTPS"| MCP
    MCP -->|"mTLS"| Reports
```

### Step 4: Add Deployment Context

For `deployed-in` relationships, use nested subgraphs:

```mermaid
flowchart TB
    subgraph External["🔴 External"]
        Client{{"🤖 Client"}}
    end
    
    subgraph K8sCluster["🏗️ Kubernetes Cluster"]
        subgraph Namespace["📦 Namespace: conference"]
            Service1["⚙️ Service 1"]
            Service2["⚙️ Service 2"]
        end
    end
    
    Client --> Service1
    Service1 --> Service2
```

## Protocol Styling

Use link styles to indicate security level:

```mermaid
flowchart LR
    A -->|"HTTP ⚠️"| B
    B -->|"HTTPS 🔒"| C
    C -->|"mTLS 🔐"| D
    
    linkStyle 0 stroke:#ff0000,stroke-width:2px
    linkStyle 1 stroke:#00cc00,stroke-width:2px
    linkStyle 2 stroke:#0066cc,stroke-width:2px
```

| Protocol | Style | Icon |
|----------|-------|------|
| HTTP | Red dashed | ⚠️ |
| HTTPS | Green solid | 🔒 |
| mTLS | Blue bold | 🔐 |
| gRPC | Purple | 🔄 |

## Complete Example

For a CALM architecture with MCP components:

```mermaid
flowchart TB
    subgraph External["🔴 Trust Boundary: External AI Client"]
        style External fill:#ffeeee,stroke:#cc0000,stroke-width:2px
        Claude{{"🤖 Claude<br/>MCP Client"}}
    end
    
    subgraph K8s["🟠 Trust Boundary: Kubernetes Cluster"]
        style K8s fill:#fff5ee,stroke:#cc6600,stroke-width:2px
        
        subgraph Allowed["🟢 Allowed Communication"]
            MCP["🔧 Reports MCP Server<br/>Port: 8080"]
            Reports["⚙️ Reports API<br/>Port: 8080"]
        end
        
        subgraph Isolated["🔒 Network Isolated"]
            style Isolated fill:#ffe6e6,stroke:#990000,stroke-dasharray: 5 5
            Secret["🚫 Secret API<br/>Micro-segmented"]
        end
    end
    
    Claude -->|"HTTPS 🔒"| MCP
    MCP -->|"mTLS 🔐"| Reports
    MCP -.-x|"❌ Blocked"| Secret
    
    linkStyle 0 stroke:#00cc00,stroke-width:2px
    linkStyle 1 stroke:#0066cc,stroke-width:2px
    linkStyle 2 stroke:#cc0000,stroke-width:2px,stroke-dasharray: 5 5
```

## Diagram Best Practices

1. **Keep it readable**: Limit to 10-15 nodes per diagram; create sub-diagrams for complex systems
2. **Consistent orientation**: Use TB for hierarchical, LR for flow-based architectures
3. **Label everything**: Include protocols, ports, and key security indicators
4. **Color coding**: Use consistent colors for trust boundary criticality
5. **Show what's blocked**: Use dashed lines with ❌ to show denied connections
6. **Include legends**: Add a legend for complex diagrams

## Legend Template

Add this below complex diagrams:

```markdown
**Legend:**
- 🔴 Critical trust boundary (internet-facing)
- 🟠 High trust boundary (internal zones)
- 🟡 Medium trust boundary (same zone)
- 🔒 HTTPS encrypted
- 🔐 mTLS mutual authentication
- ❌ Blocked/denied connection
```
