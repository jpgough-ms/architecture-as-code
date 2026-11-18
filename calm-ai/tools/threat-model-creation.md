# CALM Threat Model Creation Guide

## Critical Requirements

🚨 **ALWAYS read this guide fully before creating a threat model**
🚨 **A threat model is a decorator. It is a standalone document and does NOT change the architecture or the flow**
🚨 **NEVER invent facts about controls.** A control that the architecture does not declare is a gap, not a mitigation
🚨 **NEVER invent an approver.** `accepted-by` is a named person or role that the user gives you

## What You Build

A decorator of `type: threat-model` that records trust boundaries and STRIDE threats for **one flow**.
It conforms to the draft standards in `calm/draft/2026-03/standards/threat-model/`:

| Standard | `$schema` |
|---|---|
| STRIDE (use this one) | `https://calm.finos.org/draft/2026-03/standards/threat-model/stride.threat-model.decorator.standard.json` |
| Method-neutral base | `https://calm.finos.org/draft/2026-03/standards/threat-model/threat-model.decorator.standard.json` |

A complete worked example is `examples/payments-api/submit-payment.stride.decorator.json`.

## Inputs

Ask for these before you start. Do not guess them.

1. The architecture JSON, with its nodes, relationships and controls
2. The flow JSON, or the `unique-id` of the flow in the architecture
3. The people who approve accepted risks, if any threat will be accepted

## Process

### 1. Read the flow

List each transition: sequence number, relationship id, source node, destination node, protocol and
direction. A relationship can appear twice (request and return). Threats attach to the
**relationship**, not to the step.

### 2. Find the trust boundaries

A trust boundary is where data passes between zones that trust each other differently. Look for:

- An actor or a web client calling a service (usually the internet to the platform)
- A change of protocol or of network zone between two nodes (for example HTTPS to mTLS to JDBC)
- A `deployed-in` or `composed-of` container that changes between the two ends
- A call to a node outside the organisation

Give each boundary a short name ("Internet to DMZ") and list the relationship ids that cross it.
A relationship inside one zone has no boundary. Do not add boundaries to fill space.

### 3. Walk each relationship with STRIDE

| Category | Ask |
|---|---|
| Spoofing | Can a caller pretend to be someone else? |
| Tampering | Can data change in transit or at rest? |
| Repudiation | Can a party deny an action, and is there a record? |
| Information disclosure | Can data reach someone who must not see it? |
| Denial of service | Can the caller exhaust the destination? |
| Elevation of privilege | Can the caller do more than it should? |

Write only threats that are real for this relationship. Prefer five specific threats to thirty generic
ones. `classification` is `{ "scheme": "STRIDE", "value": "<category>" }` and the value must be exactly
one of: `Spoofing`, `Tampering`, `Repudiation`, `Information disclosure`, `Denial of service`,
`Elevation of privilege`.

### 4. Connect threats to controls

For each threat, look for a control that addresses it in this order:

1. The source node and the destination node (`controls`)
2. The relationship (`controls`)
3. The architecture (top-level `controls`)

`mitigations[].control` is the **key** of the control (the property name under `controls`), not its name.

| Situation | What to write |
|---|---|
| A declared control fully addresses the threat | `status: mitigated`, mitigation `state: implemented` |
| A declared control covers part of the threat | `status: partially-mitigated`, say what is not covered in `note` |
| A control is needed and not declared | `status: identified`, mitigation `state: planned` with a new control key. The tool shows it as a gap |
| Nothing is proposed | `status: identified`, no mitigations |
| The owner accepts the risk | `status: accepted` with `residual-risk` and `accepted-by` |

Use `state: verified` only when the user gives you evidence that the control works.

### 5. Rate and write the document

Rate `likelihood` and `impact` as `low`, `medium`, `high` or `critical`. Keep descriptions to one
sentence. Use this shape:

```json
{
    "$schema": "https://calm.finos.org/draft/2026-03/standards/threat-model/stride.threat-model.decorator.standard.json",
    "unique-id": "submit-payment-stride-threat-model",
    "type": "threat-model",
    "target": ["<URL or path of the flow document>"],
    "applies-to": ["<flow unique-id>", "<every relationship id the threats and boundaries use>"],
    "data": {
        "methodology": "STRIDE",
        "trust-boundaries": [
            { "unique-id": "tb-internet-dmz", "name": "Internet to DMZ", "relationships": ["mobile-app-to-api-gateway"] }
        ],
        "threats": [
            {
                "unique-id": "t-token-replay",
                "name": "Access token replay",
                "classification": [{ "scheme": "STRIDE", "value": "Spoofing" }],
                "applies-to": { "relationships": ["mobile-app-to-api-gateway"] },
                "likelihood": "medium",
                "impact": "high",
                "status": "mitigated",
                "mitigations": [{ "control": "oauth2-authentication", "state": "implemented" }]
            }
        ]
    }
}
```

Do not add `target-type`. `flow` is not an allowed value, and the field is optional.

## Checks before you finish

- [ ] Every relationship id in `applies-to`, `trust-boundaries` and `threats` is in the flow
- [ ] The flow `unique-id` is in the top-level `applies-to`
- [ ] Every `mitigations[].control` is a control key, or is a deliberate gap you told the user about
- [ ] `mitigated` threats have a mitigation. `accepted` threats have `residual-risk` with `rating` and `accepted-by`
- [ ] Every STRIDE `value` is spelled exactly as in the table
- [ ] You told the user which controls are gaps and which risks need an owner

The CLI cannot validate decorators yet. To check against the standard, use a JSON Schema 2020-12
validator with `decorators.json` and both standards loaded. The `$schema` property is rejected by the
base decorator schema today. That is a known gap, and the examples keep `$schema` for CALM Hub.

## Common Mistakes

- **A threat for every STRIDE letter on every relationship.** The output is noise. Write the real ones
- **A control name in `mitigations[].control`.** Use the key
- **Marking a threat `mitigated` because a control exists.** Check what the control actually covers
- **Putting the threat on the node.** Threats apply to relationships in this standard
- **Editing the architecture to add the missing control.** Report the gap. The owner decides
