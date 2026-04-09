# STRIDE Threat Modeling Overview

## What is STRIDE?

STRIDE is a mature threat modeling methodology developed by Microsoft that provides a structured approach to identifying security threats. Each letter represents a category of threat that maps to a desirable security property being violated.

## STRIDE Categories with Emojis

Use these emojis consistently in all threat tables:

| Category | Emoji | Security Property Violated | Description |
|----------|-------|---------------------------|-------------|
| **Spoofing** | 🎭 | Authentication | Pretending to be someone or something else |
| **Tampering** | 🔧 | Integrity | Modifying data or code without authorization |
| **Repudiation** | 🙈 | Non-repudiation | Denying having performed an action |
| **Information Disclosure** | 📤 | Confidentiality | Exposing information to unauthorized parties |
| **Denial of Service** | 🚫 | Availability | Preventing legitimate access to a service |
| **Elevation of Privilege** | ⬆️ | Authorization | Gaining capabilities beyond what is permitted |

## STRIDE Examples by Component Type

### For Services/APIs

| Threat | Example |
|--------|---------|
| 🎭 Spoofing | Attacker impersonates legitimate API client using stolen credentials |
| 🔧 Tampering | Man-in-the-middle modifies API request/response payloads |
| 🙈 Repudiation | User denies making an API call that performed a sensitive action |
| 📤 Info Disclosure | Error messages reveal internal system details or stack traces |
| 🚫 DoS | Flood of requests overwhelms service capacity |
| ⬆️ Elevation | Exploiting vulnerability to gain admin access from user role |

### For Data Stores

| Threat | Example |
|--------|---------|
| 🎭 Spoofing | Attacker uses stolen database credentials |
| 🔧 Tampering | SQL injection modifies data records |
| 🙈 Repudiation | Changes to records without audit trail |
| 📤 Info Disclosure | Database backup exposed or query returns excessive data |
| 🚫 DoS | Resource exhaustion through complex queries |
| ⬆️ Elevation | Database user gains DBA privileges |

### For MCP Components (AI Systems)

| Threat | Example |
|--------|---------|
| 🎭 Spoofing | Malicious MCP server impersonates legitimate tool provider |
| 🔧 Tampering | Prompt injection modifies AI behavior |
| 🙈 Repudiation | AI decision without explainability/audit trail |
| 📤 Info Disclosure | Model leaks training data or PII in responses |
| 🚫 DoS | Denial of Wallet - excessive token consumption |
| ⬆️ Elevation | AI agent gains unauthorized tool access |

### For External Entities/Users

| Threat | Example |
|--------|---------|
| 🎭 Spoofing | Phishing attack to steal user credentials |
| 🔧 Tampering | Browser extension modifies user requests |
| 🙈 Repudiation | User claims they didn't authorize a transaction |
| 📤 Info Disclosure | Shoulder surfing or screen sharing exposure |
| 🚫 DoS | Account lockout through repeated failed logins |
| ⬆️ Elevation | Social engineering to gain elevated access |

## Threat Modeling Process

### 1. What are we working on?
- Review the CALM architecture/pattern
- Understand nodes, relationships, and data flows
- Identify trust boundaries

### 2. What can go wrong?
- Apply STRIDE to each component and trust boundary crossing
- Consider threats specific to the technology stack
- For AI systems, apply FINOS AI risk catalogue

### 3. What are we going to do about it?
- Document existing CALM controls as mitigations
- Identify gaps where controls are needed
- Prioritize based on risk

### 4. Did we do a good job?
- Review with stakeholders (dev, security, compliance)
- Ensure all trust boundaries are covered
- Validate mitigations are adequate

## Threat Prioritization

Use this simple risk matrix when documenting threats:

| Likelihood → | Low | Medium | High |
|--------------|-----|--------|------|
| **Impact ↓** | | | |
| High | Medium | High | Critical |
| Medium | Low | Medium | High |
| Low | Low | Low | Medium |

## Key Resources

- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [Microsoft STRIDE](https://learn.microsoft.com/en-us/previous-versions/commerce-server/ee823878(v=cs.20))
- [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/)
