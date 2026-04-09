# Threat Model Output Format

## Overview

The final threat model output should be a comprehensive, actionable document that can be reviewed by stakeholders and used to drive security improvements.

## Document Template

```markdown
# Threat Model: [Architecture Name]

**Date:** [Date]  
**Version:** [Version]  
**Modeling Tool:** STRIDER (STRIDE + CALM)  
**Architecture Source:** [CALM namespace/architecture/version]

## 1. Executive Summary

Brief overview of the architecture, scope of the threat model, and key findings.

- **Total Trust Boundaries Identified:** [N]
- **Total Threats Identified:** [N]
- **Critical/Unmitigated Threats:** [N]
- **Overall Risk Posture:** [🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low]

## 2. Architecture Overview

### 2.1 System Description
[Brief description of the system being modeled]

### 2.2 Data Flow Diagram
[Mermaid diagram generated using dataflow-diagram.md guide]

### 2.3 Components
| Component | Type | Description | Sensitivity |
|-----------|------|-------------|-------------|
| [name] | [CALM node type] | [description] | [H/M/L] |

## 3. Trust Boundary Analysis

### 3.1 Identified Trust Boundaries
| ID | Boundary | From → To | Protocol | Criticality |
|----|----------|-----------|----------|-------------|
| TB-1 | [name] | [source → dest] | [protocol] | [level] |

### 3.2 Trust Boundary Details
[Detailed analysis for each boundary - see trust-boundary-identification.md]

## 4. Threat Analysis

### 4.1 Threat Tables by Trust Boundary
[STRIDE tables for each trust boundary - see threat-table-template.md]

### 4.2 Threat Summary Matrix
| Trust Boundary | 🎭 | 🔧 | 🙈 | 📤 | 🚫 | ⬆️ | Status |
|----------------|----|----|----|----|----|----|--------|
| TB-1 | [status] | ... | ... | ... | ... | ... | [level] |

## 5. AI/MCP-Specific Analysis
[If applicable - see ai-governance-integration.md]

## 6. Existing Controls Mapping
| Control ID | Control Name | Threats Mitigated | Effectiveness |
|-----------|-------------|-------------------|---------------|
| [CALM control ref] | [name] | [threat refs] | [✅/⚠️/❌] |

## 7. Recommendations

### 7.1 Critical (Immediate Action Required)
1. [Recommendation with specific implementation guidance]

### 7.2 High Priority
1. [Recommendation]

### 7.3 Medium Priority
1. [Recommendation]

### 7.4 Low Priority / Nice to Have
1. [Recommendation]

## 8. Assumptions & Limitations
- [List assumptions made during the analysis]
- [Note any areas not covered]

## 9. Review & Sign-off
| Role | Name | Date | Status |
|------|------|------|--------|
| Architect | | | ⬜ Pending |
| Security | | | ⬜ Pending |
| Development Lead | | | ⬜ Pending |
```

## Output Formatting Guidelines

### Use Consistent Notation
- Trust boundary IDs: TB-1, TB-2, etc.
- Threat IDs: T-1.1, T-1.2 (boundary.threat-number)
- Control IDs: C-1, C-2 or CALM control references
- Risk levels: H (High), M (Medium), L (Low)

### Include Actionable Recommendations
Each recommendation should specify:
1. **What** needs to be done
2. **Why** (which threats it mitigates)
3. **How** (specific implementation approach)
4. **Priority** (based on risk)

### Cross-Reference Everything
- Link threats to trust boundaries
- Link controls to threats they mitigate
- Link recommendations to specific unmitigated threats

## Machine-Readable Output

For integration with CALM, also produce a structured summary:

```json
{
  "threat-model": {
    "architecture": "[namespace]/[name]/[version]",
    "date": "YYYY-MM-DD",
    "trust-boundaries": [
      {
        "id": "TB-1",
        "name": "MCP Client to Server",
        "from": "mcp-client",
        "to": "mcp-server",
        "criticality": "critical"
      }
    ],
    "threats": [
      {
        "id": "T-1.1",
        "trust-boundary": "TB-1",
        "stride-category": "spoofing",
        "description": "Malicious client impersonates legitimate MCP client",
        "risk": "high",
        "mitigation-status": "unmitigated"
      }
    ],
    "recommendations": [
      {
        "id": "R-1",
        "priority": "critical",
        "threats": ["T-1.1", "T-1.2"],
        "description": "Implement mutual TLS authentication for MCP connections"
      }
    ]
  }
}
```

## Quality Checklist

Before finalizing the threat model:

- [ ] All trust boundaries identified and documented
- [ ] All six STRIDE categories evaluated per boundary
- [ ] Existing CALM controls mapped to threats
- [ ] Recommendations include specific implementation guidance
- [ ] AI-specific threats addressed (if applicable)
- [ ] Data flow diagram is accurate and complete
- [ ] Summary statistics are correct
- [ ] Document is ready for stakeholder review
