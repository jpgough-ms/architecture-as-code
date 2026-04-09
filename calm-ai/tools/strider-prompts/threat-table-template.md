# STRIDE Threat Table Template

## Overview

Create a STRIDE threat table for each identified trust boundary. Tables should be scannable, actionable, and encourage discussion.

## Table Structure

### Per Trust Boundary Table

```markdown
### TB-X: [Trust Boundary Name]

**Boundary Details:**
- **From:** [Source Component]
- **To:** [Destination Component]
- **Protocol:** [Communication Protocol]
- **Criticality:** [🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low]

| STRIDE | Threat | Risk | Existing Control | Mitigation Status |
|--------|--------|------|------------------|-------------------|
| 🎭 Spoofing | [Specific threat] | [H/M/L] | [Control if present] | [✅/⚠️/❌] |
| 🔧 Tampering | [Specific threat] | [H/M/L] | [Control if present] | [✅/⚠️/❌] |
| 🙈 Repudiation | [Specific threat] | [H/M/L] | [Control if present] | [✅/⚠️/❌] |
| 📤 Info Disclosure | [Specific threat] | [H/M/L] | [Control if present] | [✅/⚠️/❌] |
| 🚫 DoS | [Specific threat] | [H/M/L] | [Control if present] | [✅/⚠️/❌] |
| ⬆️ Elevation | [Specific threat] | [H/M/L] | [Control if present] | [✅/⚠️/❌] |
```

## Mitigation Status Icons

| Icon | Meaning | Description |
|------|---------|-------------|
| ✅ | Mitigated | Control exists and adequately addresses threat |
| ⚠️ | Partial | Control exists but may not fully address threat |
| ❌ | Unmitigated | No control identified; needs attention |
| 🔄 | In Progress | Mitigation planned or being implemented |
| ➖ | N/A | Threat not applicable to this boundary |

## Risk Levels

| Level | Meaning | Criteria |
|-------|---------|----------|
| **H** (High) | Likely to occur, significant impact | External-facing, sensitive data, no controls |
| **M** (Medium) | Possible, moderate impact | Internal boundary, some controls in place |
| **L** (Low) | Unlikely or low impact | Strong controls, low-value target |

## Example: MCP Client to Server Boundary

```markdown
### TB-1: MCP Client to MCP Server (AI Tool Boundary)

**Boundary Details:**
- **From:** Claude (MCP Client)
- **To:** Reports MCP Server
- **Protocol:** HTTPS
- **Criticality:** 🔴 Critical - AI agent accessing organizational tools

| STRIDE | Threat | Risk | Existing Control | Mitigation Status |
|--------|--------|------|------------------|-------------------|
| 🎭 Spoofing | Malicious client impersonates legitimate MCP client to access tools | H | None identified | ❌ |
| 🎭 Spoofing | Rogue MCP server provides malicious tool responses | H | None identified | ❌ |
| 🔧 Tampering | Prompt injection modifies intended tool behavior | H | None identified | ❌ |
| 🔧 Tampering | Man-in-the-middle modifies tool requests/responses | M | HTTPS encryption | ⚠️ |
| 🙈 Repudiation | AI actions cannot be traced to specific user/session | M | None identified | ❌ |
| 📤 Info Disclosure | Sensitive data leaked in prompts or tool responses | H | None identified | ❌ |
| 📤 Info Disclosure | MCP server logs contain sensitive information | M | None identified | ❌ |
| 🚫 DoS | Excessive tool calls exhaust server resources | M | None identified | ❌ |
| 🚫 DoS | Denial of Wallet - excessive token/API consumption | H | None identified | ❌ |
| ⬆️ Elevation | AI gains access to tools beyond intended scope | H | None identified | ❌ |
| ⬆️ Elevation | Tool chain manipulation allows unauthorized actions | H | None identified | ❌ |

**Discussion Points:**
- How is the MCP client authenticated to the server?
- What audit logging exists for tool invocations?
- Are there rate limits on tool calls?
- How are tool permissions defined and enforced?
```

## Example: Service to Database Boundary

```markdown
### TB-2: Reports API to Database

**Boundary Details:**
- **From:** Reports API (service)
- **To:** Reports Database
- **Protocol:** TLS (PostgreSQL)
- **Criticality:** 🟠 High - data persistence layer

| STRIDE | Threat | Risk | Existing Control | Mitigation Status |
|--------|--------|------|------------------|-------------------|
| 🎭 Spoofing | Attacker uses stolen database credentials | M | Connection pooling with rotated credentials | ⚠️ |
| 🔧 Tampering | SQL injection modifies data | H | Parameterized queries | ✅ |
| 🔧 Tampering | Direct database access bypasses app controls | M | Network policies | ✅ |
| 🙈 Repudiation | Data changes without audit trail | M | Database audit logging | ✅ |
| 📤 Info Disclosure | Query results expose more data than needed | M | Row-level security | ⚠️ |
| 📤 Info Disclosure | Database backups unencrypted | H | Encrypted backups at rest | ✅ |
| 🚫 DoS | Resource exhaustion via expensive queries | M | Query timeouts, connection limits | ✅ |
| ⬆️ Elevation | App service account has excessive privileges | M | Least privilege DB role | ✅ |

**Discussion Points:**
- Is database credential rotation automated?
- Are there alerts for unusual query patterns?
- How often are DB permissions audited?
```

## Threat Description Guidelines

Write threats that are:
- **Specific**: Not "attacker compromises system" but "attacker uses stolen JWT to access API"
- **Actionable**: Clear what needs to be mitigated
- **Contextual**: Relevant to the specific architecture
- **Testable**: Could be validated with security testing

### Good vs Bad Examples

| ❌ Bad | ✅ Good |
|--------|---------|
| "Attacker hacks the system" | "Attacker exploits unauthenticated API endpoint to enumerate user data" |
| "Data is stolen" | "Database credentials in environment variables are exposed via container inspection" |
| "DoS attack happens" | "Unbounded query allows attacker to exhaust database connections" |

## Summary Table

After all trust boundary tables, include a summary:

```markdown
## Threat Summary

| Trust Boundary | 🎭 | 🔧 | 🙈 | 📤 | 🚫 | ⬆️ | Overall |
|----------------|----|----|----|----|----|----|---------|
| TB-1: MCP Client → Server | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 Critical |
| TB-2: API → Database | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ | 🟡 Medium |
| TB-3: Isolated Secret API | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | 🟢 Low |

**Legend:** ✅ Mitigated | ⚠️ Partial | ❌ Unmitigated
```
