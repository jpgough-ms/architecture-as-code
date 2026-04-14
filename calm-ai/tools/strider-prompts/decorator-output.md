# Decorator Output Format for CalmHub

## Overview

After completing a STRIDE threat model, the findings should be captured as a **threat-model decorator** and POSTed to CalmHub. This document describes the decorator payload format and the workflow for creating decorators via the CalmHub MCP tools or REST API.

## Threat-Model Decorator Schema

A threat-model decorator associates STRIDE threat analysis with a specific architecture in CalmHub.

### Decorator JSON Structure

```json
{
  "$schema": "https://raw.githubusercontent.com/finos/architecture-as-code/main/calm/draft/2026-03/standards/threat-model/threat-model.decorator.standard.json",
  "unique-id": "threat-model-<architecture-id>-<timestamp>",
  "type": "threat-model",
  "target": ["/calm/namespaces/<namespace>/architectures/<numericId>/versions/<version-with-dashes>"],
  "target-type": ["architecture"],
  "applies-to": ["<namespace>"],
  "data": {
    "summary": {
      "date": "YYYY-MM-DD",
      "methodology": "STRIDE",
      "overall-risk": "critical|high|medium|low",
      "total-threats": 0,
      "unmitigated-threats": 0,
      "partially-mitigated-threats": 0,
      "mitigated-threats": 0
    },
    "trust-boundaries": [
      {
        "id": "TB-1",
        "name": "Descriptive boundary name",
        "from": "source-node-unique-id",
        "to": "destination-node-unique-id",
        "protocol": "HTTPS",
        "criticality": "critical|high|medium|low"
      }
    ],
    "threats": [
      {
        "id": "T-1.1",
        "trust-boundary": "TB-1",
        "stride-category": "spoofing|tampering|repudiation|information-disclosure|denial-of-service|elevation-of-privilege",
        "description": "Specific threat description",
        "risk": "high|medium|low",
        "mitigation-status": "mitigated|partial|unmitigated",
        "existing-controls": ["control-requirement-url-if-mapped"],
        "notes": "Additional context"
      }
    ],
    "recommendations": [
      {
        "id": "R-1",
        "priority": "critical|high|medium|low",
        "threats": ["T-1.1", "T-1.2"],
        "description": "What needs to be done",
        "implementation": "How to implement it"
      }
    ],
    "domain-controls-evaluated": {
      "domain": "api-threats",
      "controls-mapped": [
        {
          "control-id": "bola",
          "control-name": "Broken Object Level Authorization",
          "threats-mitigated": ["T-2.1"],
          "status": "applied|not-applicable|gap"
        }
      ]
    }
  }
}
```

## Target Path Format (Critical)

The `target` field **must** contain a CalmHub API path — not a bare architecture name or unique-id. The CalmHub UI uses this path to look up decorators, and the backend performs an **exact match**. If the path is wrong, the decorator will be stored but never displayed.

### Constructing the target path

Use the **namespace**, **numeric architecture ID**, and **version** returned by the MCP `listArchitectures` / `getArchitecture` tools:

```
/calm/namespaces/{namespace}/architectures/{numericId}/versions/{version-with-dashes}
```

**Version format**: replace dots with dashes — `1.0.0` → `1-0-0`.

**Examples**:
| Namespace | Architecture ID | Version | Target Path |
|-----------|----------------|---------|-------------|
| `workshop` | `1` | `1.0.0` | `/calm/namespaces/workshop/architectures/1/versions/1-0-0` |
| `finos` | `42` | `2.1.0` | `/calm/namespaces/finos/architectures/42/versions/2-1-0` |

## Creating Decorators via MCP

When CalmHub MCP is available, use the tools directly:

### Step 1: Verify the architecture exists

Use `listArchitectures` to find the target architecture and note the **numeric ID**:
```
Namespace: workshop
Architecture ID: 1   ← use this numeric ID in the target path
Version: 1.0.0
```

### Step 2: Check existing decorators

Use `listDecorators` with type filter `threat-model` to avoid duplicates.

### Step 3: Load domain controls

Use `getControlsForDomain` for the `api-threats` domain to map controls to threats.

### Step 4: Construct the target path

Build the target from Step 1 values:
```
/calm/namespaces/workshop/architectures/1/versions/1-0-0
```

### Step 5: Create the decorator

Use `createDecorator` with the threat-model JSON payload, ensuring the `target` array contains the path from Step 4.

## Creating Decorators via REST API

If MCP is not available, use the CalmHub REST API directly:

### POST Decorator
```
POST http://localhost:8080/calm/namespaces/{namespace}/decorators
Content-Type: application/json

{
  "$schema": "...",
  "unique-id": "threat-model-...",
  "type": "threat-model",
  ...
}
```

### Verify
```
GET http://localhost:8080/calm/namespaces/{namespace}/decorators?type=threat-model
```

## STRIDE Category Values

Use these exact lowercase values in the `stride-category` field:

| Display | JSON Value |
|---------|-----------|
| 🎭 Spoofing | `spoofing` |
| 🔧 Tampering | `tampering` |
| 🙈 Repudiation | `repudiation` |
| 📤 Information Disclosure | `information-disclosure` |
| 🚫 Denial of Service | `denial-of-service` |
| ⬆️ Elevation of Privilege | `elevation-of-privilege` |

## Mapping api-threats Domain Controls

The `api-threats` domain in CalmHub contains OWASP API Security controls. Map them to STRIDE threats:

| Control ID | Control Name | Primary STRIDE Categories |
|-----------|-------------|--------------------------|
| `bola` | Broken Object Level Authorization | 🎭 Spoofing, ⬆️ Elevation |
| `broken-authentication` | Broken Authentication | 🎭 Spoofing |
| `bopla` | Broken Object Property Level Authorization | ⬆️ Elevation, 📤 Info Disclosure |
| `unrestricted-resource-consumption` | Unrestricted Resource Consumption | 🚫 DoS |
| `bfla` | Broken Function Level Authorization | ⬆️ Elevation |
| `ssrf` | Server Side Request Forgery | 🔧 Tampering, 📤 Info Disclosure |
| `security-misconfiguration` | Security Misconfiguration | All categories |
| `lack-of-protection-from-automated-threats` | Lack of Protection from Automated Threats | 🚫 DoS, 🎭 Spoofing |
| `improper-inventory-management` | Improper Inventory Management | 📤 Info Disclosure |
| `unsafe-consumption-of-apis` | Unsafe Consumption of APIs | 🔧 Tampering, ⬆️ Elevation |

## Example: Complete Threat-Model Decorator

```json
{
  "$schema": "https://raw.githubusercontent.com/finos/architecture-as-code/main/calm/draft/2026-03/standards/threat-model/threat-model.decorator.standard.json",
  "unique-id": "threat-model-mcp-demo-20250101",
  "type": "threat-model",
  "target": ["/calm/namespaces/workshop/architectures/1/versions/1-0-0"],
  "target-type": ["architecture"],
  "applies-to": ["workshop"],
  "data": {
    "summary": {
      "date": "2025-01-01",
      "methodology": "STRIDE",
      "overall-risk": "high",
      "total-threats": 12,
      "unmitigated-threats": 6,
      "partially-mitigated-threats": 3,
      "mitigated-threats": 3
    },
    "trust-boundaries": [
      {
        "id": "TB-1",
        "name": "MCP Client to Server",
        "from": "claude-mcp-client",
        "to": "reports-mcp-server",
        "protocol": "HTTPS",
        "criticality": "critical"
      },
      {
        "id": "TB-2",
        "name": "MCP Server to Backend API",
        "from": "reports-mcp-server",
        "to": "reports-api",
        "protocol": "mTLS",
        "criticality": "high"
      }
    ],
    "threats": [
      {
        "id": "T-1.1",
        "trust-boundary": "TB-1",
        "stride-category": "spoofing",
        "description": "Malicious MCP client impersonates legitimate client to access tools",
        "risk": "high",
        "mitigation-status": "unmitigated",
        "existing-controls": [],
        "notes": "No client authentication mechanism identified"
      },
      {
        "id": "T-1.2",
        "trust-boundary": "TB-1",
        "stride-category": "tampering",
        "description": "Prompt injection modifies intended tool invocation behavior",
        "risk": "high",
        "mitigation-status": "unmitigated",
        "existing-controls": [],
        "notes": "No input validation on MCP tool parameters"
      },
      {
        "id": "T-2.1",
        "trust-boundary": "TB-2",
        "stride-category": "elevation-of-privilege",
        "description": "MCP server accesses APIs beyond its intended scope",
        "risk": "high",
        "mitigation-status": "partial",
        "existing-controls": ["bfla"],
        "notes": "Network policies exist but tool permissions not enforced"
      }
    ],
    "recommendations": [
      {
        "id": "R-1",
        "priority": "critical",
        "threats": ["T-1.1"],
        "description": "Implement mutual authentication for MCP connections",
        "implementation": "Use OAuth2 token-based authentication with short-lived tokens for MCP client identity verification"
      },
      {
        "id": "R-2",
        "priority": "critical",
        "threats": ["T-1.2"],
        "description": "Add input validation and prompt filtering for MCP tool calls",
        "implementation": "Implement server-side validation of all tool parameters; add prompt injection detection middleware"
      }
    ],
    "domain-controls-evaluated": {
      "domain": "api-threats",
      "controls-mapped": [
        {
          "control-id": "bfla",
          "control-name": "Broken Function Level Authorization",
          "threats-mitigated": ["T-2.1"],
          "status": "applied"
        },
        {
          "control-id": "broken-authentication",
          "control-name": "Broken Authentication",
          "threats-mitigated": ["T-1.1"],
          "status": "gap"
        }
      ]
    }
  }
}
```

## Workflow Summary

1. **Complete STRIDE threat model** using strider-prompts guides
2. **Structure findings** into the decorator JSON format above
3. **Map api-threats controls** to identified threats
4. **POST decorator** to CalmHub via MCP `create_decorator` tool or REST API
5. **Verify** the decorator appears in CalmHub UI under the Threats tab
