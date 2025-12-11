# FINOS AI Governance Framework Integration

## Overview

When a CALM architecture contains AI components (MCP clients, MCP servers, AI agents, LLM services), apply the FINOS AI Governance Framework for specialized threat analysis.

**Framework URL:** https://air-governance-framework.finos.org

## Detecting AI Components

Scan the CALM architecture for these indicators:

### Node Type Indicators
- `mcp-client` - MCP Client node type
- `mcp-server` - MCP Server (may be `service` with MCP in name)
- `ai-agent` - AI Agent node type
- `llm-service` - Large Language Model service

### Name/Description Keywords
Look for these terms in node `name` or `description`:
- AI, Artificial Intelligence
- LLM, Large Language Model
- MCP, Model Context Protocol
- Agent, Agentic
- Claude, GPT, Anthropic, OpenAI
- Tool, Tool Call, Function Call
- RAG, Retrieval, Embedding

### Example Detection

```json
{
  "nodes": [
    {
      "unique-id": "mcp-client",
      "name": "Claude",
      "description": "MCP Client for querying for reports",
      "node-type": "mcp-client"  // ← AI indicator
    },
    {
      "unique-id": "mcp-server",
      "name": "Reports MCP Server",  // ← "MCP" in name
      "description": "MCP Server that presents tools...",  // ← "tools"
      "node-type": "service"
    }
  ]
}
```

**Result:** AI components detected → Apply FINOS AI Governance Framework

## FINOS AI Risk Catalogue Mapping

When AI components are present, add a dedicated section mapping to relevant AI risks:

### Security Risks (AIR-SEC)

| Risk ID | Risk Name | Relevance to MCP/Agentic Systems |
|---------|-----------|----------------------------------|
| AIR-SEC-024 | Prompt Injection | 🔴 Critical - Direct/indirect prompt attacks |
| AIR-SEC-025 | Agent Action Authorization Bypass | 🔴 Critical - Agents exceeding intended scope |
| AIR-SEC-026 | Tool Chain Manipulation | 🔴 Critical - Malicious tool selection/parameters |
| AIR-SEC-027 | MCP Server Supply Chain Compromise | 🔴 Critical - Compromised MCP servers |
| AIR-SEC-028 | Agent State Persistence Poisoning | 🟠 High - Corrupted agent memory |
| AIR-SEC-029 | Agent Credential Harvesting | 🔴 Critical - Credential discovery attacks |
| AIR-SEC-002 | Information Leaked to Vector Store | 🟠 High - RAG data exposure |
| AIR-SEC-009 | Tampering With Foundational Model | 🟠 High - Model supply chain |
| AIR-SEC-010 | Data Poisoning | 🟠 High - Training/fine-tuning attacks |

### Operational Risks (AIR-OP)

| Risk ID | Risk Name | Relevance to MCP/Agentic Systems |
|---------|-----------|----------------------------------|
| AIR-OP-005 | Hallucination | 🔴 Critical - Inaccurate tool selection/responses |
| AIR-OP-006 | Foundation Model Versioning | 🟠 High - Unpredictable behavior changes |
| AIR-OP-007 | Non-Deterministic Behaviour | 🟠 High - Inconsistent decisions |
| AIR-OP-014 | Availability of Foundational Model | 🟠 High - Third-party dependency |
| AIR-OP-016 | Inadequate System Alignment | 🟠 High - Misaligned agent behavior |
| AIR-OP-028 | Multi-Agent Trust Boundary Violations | 🔴 Critical - Agent-to-agent attacks |

### Regulatory Risks (AIR-RC)

| Risk ID | Risk Name | Relevance to MCP/Agentic Systems |
|---------|-----------|----------------------------------|
| AIR-RC-001 | Information Leaked to Hosted Model | 🔴 Critical - Data sent to external models |
| AIR-RC-002 | Regulatory Compliance | 🟠 High - AI-specific regulations |
| AIR-RC-003 | Intellectual Property | 🟠 High - Model training data concerns |

## AI-Specific STRIDE Mapping

Map traditional STRIDE to AI-specific threats:

### 🎭 Spoofing (AI Context)

| Threat | FINOS Risk | Mitigation |
|--------|------------|------------|
| Malicious MCP server impersonation | AIR-SEC-027 | MCP Server Security Governance |
| Fake tool provider | AIR-SEC-027 | Supply chain verification |
| Compromised agent identity | AIR-SEC-025 | Agent authentication |

### 🔧 Tampering (AI Context)

| Threat | FINOS Risk | Mitigation |
|--------|------------|------------|
| Prompt injection | AIR-SEC-024 | Input/output filtering |
| Tool chain manipulation | AIR-SEC-026 | Tool chain validation |
| Agent state poisoning | AIR-SEC-028 | State integrity checks |
| Data poisoning | AIR-SEC-010 | Data quality controls |

### 🙈 Repudiation (AI Context)

| Threat | FINOS Risk | Mitigation |
|--------|------------|------------|
| Unexplainable AI decisions | AIR-OP-016 | Agent decision audit |
| Missing tool invocation logs | - | Comprehensive logging |
| Untraced agent actions | - | Action attribution |

### 📤 Information Disclosure (AI Context)

| Threat | FINOS Risk | Mitigation |
|--------|------------|------------|
| Data leaked to hosted model | AIR-RC-001 | Data filtering |
| PII in prompts/responses | AIR-RC-001 | PII detection/redaction |
| Training data extraction | AIR-SEC-010 | Model access controls |
| Credential harvesting | AIR-SEC-029 | Credential protection |

### 🚫 Denial of Service (AI Context)

| Threat | FINOS Risk | Mitigation |
|--------|------------|------------|
| Denial of Wallet (token exhaustion) | AIR-OP-014 | Spend monitoring, alerts |
| Model availability outage | AIR-OP-014 | Fallback strategies |
| Agent loop/deadlock | AIR-OP-007 | Timeout controls |

### ⬆️ Elevation of Privilege (AI Context)

| Threat | FINOS Risk | Mitigation |
|--------|------------|------------|
| Agent authorization bypass | AIR-SEC-025 | Least privilege framework |
| Tool privilege escalation | AIR-SEC-026 | Tool access controls |
| Multi-agent trust violation | AIR-OP-028 | Agent isolation |

## FINOS Mitigation Reference

Map to FINOS mitigations when applicable:

| Mitigation ID | Mitigation Name | When to Apply |
|---------------|-----------------|---------------|
| AIR-PREV-005 | User/App/Model Firewalling | All AI interfaces |
| AIR-PREV-019 | Agent Authority Least Privilege | Agent tool access |
| AIR-PREV-020 | Tool Chain Validation | Tool invocations |
| AIR-PREV-021 | MCP Server Security Governance | MCP server connections |
| AIR-PREV-023 | Multi-Agent Isolation | Multi-agent systems |
| AIR-DET-004 | AI Data Leakage Prevention | Data handling |
| AIR-DET-011 | DoW Spend Monitoring | Token consumption |
| AIR-DET-013 | Human Feedback Loop | AI output review |

## AI Governance Section Template

When AI components are detected, add this section to the threat model:

```markdown
## FINOS AI Governance Framework Analysis

This architecture contains AI/MCP components. The following analysis applies the 
[FINOS AI Governance Framework](https://air-governance-framework.finos.org).

### AI Components Identified

| Component | Type | Description |
|-----------|------|-------------|
| [name] | [MCP Client/Server/Agent] | [description] |

### Applicable AI Risks

| Risk ID | Risk Name | Impact | Current Controls | Status |
|---------|-----------|--------|------------------|--------|
| AIR-SEC-024 | Prompt Injection | 🔴 High | None identified | ❌ |
| AIR-SEC-026 | Tool Chain Manipulation | 🔴 High | None identified | ❌ |
| [etc.] | | | | |

### Recommended AI-Specific Mitigations

Based on the FINOS AI Governance Framework:

1. **Input/Output Filtering (AIR-PREV-005)**
   - Implement prompt injection detection
   - Filter sensitive data from model interactions

2. **Agent Least Privilege (AIR-PREV-019)**
   - Define explicit tool permissions for each agent
   - Implement dynamic privilege de-escalation

3. **MCP Server Governance (AIR-PREV-021)**
   - Verify MCP server supply chain
   - Implement secure communication channels

4. **Spend Monitoring (AIR-DET-011)**
   - Set token consumption alerts
   - Implement rate limiting

### AI Trust Boundaries

In addition to standard trust boundaries, AI systems introduce:

| Boundary | Description | Special Considerations |
|----------|-------------|----------------------|
| Human ↔ AI | User interaction with AI agent | Prompt injection, output safety |
| AI ↔ Tools | Agent tool invocation | Authorization, input validation |
| AI ↔ Data | RAG/retrieval access | Data leakage, access control preservation |
| AI ↔ AI | Multi-agent communication | Trust propagation, isolation |
```

## Questions for AI Architectures

When analyzing AI architectures, ask these clarifying questions if unclear:

1. **Model Hosting**: "Is the AI model self-hosted or a third-party service?"
2. **Data Sensitivity**: "What classification of data is sent to the AI model?"
3. **Tool Scope**: "What tools/APIs can the AI agent invoke?"
4. **Human Oversight**: "Is there human-in-the-loop for critical actions?"
5. **Agent Autonomy**: "What actions can the agent take autonomously?"
6. **Multi-Agent**: "Do multiple AI agents interact with each other?"
