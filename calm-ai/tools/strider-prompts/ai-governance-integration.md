# AI Governance Integration Guide

## Overview

When threat modeling AI/MCP systems, supplement STRIDE with AI-specific risk considerations. This guide maps AI governance concepts to STRIDE and CALM controls.

## AI-Specific STRIDE Considerations

### 🎭 Spoofing in AI Systems

| AI Risk | STRIDE Mapping | Example |
|---------|---------------|---------|
| Model impersonation | Spoofing | Malicious model mimics legitimate AI assistant |
| Tool spoofing | Spoofing | Rogue MCP server provides fake tools |
| Identity confusion | Spoofing | User cannot distinguish AI from human responses |
| Deepfake generation | Spoofing | AI-generated content impersonates real people |

### 🔧 Tampering in AI Systems

| AI Risk | STRIDE Mapping | Example |
|---------|---------------|---------|
| Prompt injection | Tampering | Adversarial input modifies model behavior |
| Training data poisoning | Tampering | Contaminated data produces biased outputs |
| Model manipulation | Tampering | Fine-tuning introduces malicious behavior |
| Tool chain modification | Tampering | Intercepting tool calls to alter results |
| Indirect prompt injection | Tampering | Malicious content in retrieved documents alters AI behavior |

### 🙈 Repudiation in AI Systems

| AI Risk | STRIDE Mapping | Example |
|---------|---------------|---------|
| Decision opacity | Repudiation | AI decisions cannot be explained |
| Action non-attribution | Repudiation | Cannot determine if human or AI performed action |
| Missing audit trail | Repudiation | Tool invocations not logged |
| Stochastic behavior | Repudiation | Non-deterministic outputs complicate audit |

### 📤 Information Disclosure in AI Systems

| AI Risk | STRIDE Mapping | Example |
|---------|---------------|---------|
| Training data leakage | Info Disclosure | Model reveals PII from training data |
| Context window exposure | Info Disclosure | Sensitive conversation context accessible |
| Tool result leakage | Info Disclosure | Tool responses contain more data than needed |
| Model extraction | Info Disclosure | Adversary reverse-engineers model capabilities |
| Cross-session leakage | Info Disclosure | Information from one session leaks to another |

### 🚫 Denial of Service in AI Systems

| AI Risk | STRIDE Mapping | Example |
|---------|---------------|---------|
| Denial of Wallet | DoS | Excessive API calls exhaust budget |
| Token exhaustion | DoS | Long prompts consume rate limits |
| Recursive tool calls | DoS | AI enters infinite tool invocation loop |
| Resource starvation | DoS | Compute-intensive queries block legitimate use |

### ⬆️ Elevation of Privilege in AI Systems

| AI Risk | STRIDE Mapping | Example |
|---------|---------------|---------|
| Tool scope escalation | Elevation | AI accesses tools beyond intended permissions |
| Permission inheritance | Elevation | AI inherits user permissions without scoping |
| Agent autonomy | Elevation | AI takes actions without human approval |
| Jailbreaking | Elevation | Adversarial prompts bypass safety guardrails |
| Multi-step exploitation | Elevation | Chain of tool calls achieves unauthorized outcome |

## CALM Control Mapping for AI Systems

Map AI-specific threats to CALM control requirements:

### Recommended Controls by Category

```json
{
  "controls": {
    "ai-governance": {
      "description": "AI-specific security and governance controls",
      "requirements": [
        {
          "control-requirement-url": "ai-input-validation",
          "name": "Input Validation & Prompt Filtering",
          "description": "Validate and sanitize all inputs to AI models to prevent prompt injection"
        },
        {
          "control-requirement-url": "ai-output-filtering",
          "name": "Output Filtering & Safety",
          "description": "Filter AI outputs for harmful, biased, or sensitive content"
        },
        {
          "control-requirement-url": "ai-audit-logging",
          "name": "AI Decision Audit Trail",
          "description": "Log all AI decisions, tool invocations, and reasoning chains"
        },
        {
          "control-requirement-url": "ai-rate-limiting",
          "name": "AI Resource & Cost Controls",
          "description": "Implement rate limits and budget caps for AI API consumption"
        },
        {
          "control-requirement-url": "ai-tool-permissions",
          "name": "Tool Permission Boundaries",
          "description": "Define and enforce least-privilege tool access for AI agents"
        },
        {
          "control-requirement-url": "ai-human-oversight",
          "name": "Human-in-the-Loop",
          "description": "Require human approval for sensitive or irreversible AI actions"
        }
      ]
    }
  }
}
```

## Regulatory Considerations

When threat modeling AI systems, consider relevant regulatory frameworks:

| Framework | Key Requirements | STRIDE Relevance |
|-----------|-----------------|------------------|
| EU AI Act | Risk classification, transparency, human oversight | All categories |
| NIST AI RMF | Govern, Map, Measure, Manage | All categories |
| OWASP ML Top 10 | ML-specific vulnerabilities | Tampering, Info Disclosure, Elevation |
| FINOS AI Readiness | Financial services AI governance | All categories |

## Integration with CALM Architecture

When documenting AI threats in CALM:

1. **Nodes**: Clearly label AI components with `mcp-client`, `mcp-server`, or custom `ai-agent` types
2. **Relationships**: Note bidirectional data flows (prompts and responses)
3. **Controls**: Use `ai-governance` control category
4. **Metadata**: Include model details, training data provenance, deployment context
5. **Trust Boundaries**: Always mark AI component boundaries as 🔴 Critical or 🟠 High

## Questions for AI System Threat Modeling

Ask these during the threat modeling session:

### Architecture & Design
- What AI models/providers are used?
- What tools/APIs can the AI access?
- Is there a human-in-the-loop for sensitive operations?

### Data & Privacy
- What data enters the AI system (prompts, context)?
- What data can the AI access via tools?
- Is PII or sensitive data involved?

### Security Controls
- How are AI tool permissions defined?
- What audit logging exists for AI actions?
- Are there rate limits on AI API usage?

### Governance
- Who is accountable for AI decisions?
- How are AI outputs validated?
- What incident response plan exists for AI failures?
