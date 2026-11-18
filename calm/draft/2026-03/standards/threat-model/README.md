# Threat Model Decorator Standards

Decorator standards that record a threat model against a CALM flow. They add trust boundaries and
threats to a flow without a change to the core schema.

Related issue: [#3343](https://github.com/finos/architecture-as-code/issues/3343).

## Standards

| Standard | Purpose |
|---|---|
| `threat-model.decorator.standard.json` | Method-neutral shape: trust boundaries, threats, mitigations, residual risk |
| `stride.threat-model.decorator.standard.json` | Extends the base. Fixes `methodology` to `STRIDE` and restricts the six categories |

```
decorators.json (base decorator)
  └── threat-model.decorator.standard.json
        └── stride.threat-model.decorator.standard.json
```

Another method (for example LINDDUN) adds its own standard that extends the base in the same way.

## How a threat model maps to a flow

- **Target.** `target` names the flow document. `applies-to` lists the flow `unique-id` and the
  relationship ids it uses. `target-type` is left out, because `flow` is not an allowed value.
- **Trust boundary.** A named crossing, marked on the relationships that cross it.
- **Threat.** A threat applies to one or more relationships. A relationship can appear twice in a
  flow (request and return), so `sequence-numbers` can narrow a threat to some transitions.
- **Mitigation.** `mitigations[].control` is the key of a control. A tool looks the key up on the
  source and destination nodes, on the relationship, and on the architecture. A key found nowhere is
  a gap.

## Rules in the schema

| Rule | Where |
|---|---|
| `status: mitigated` needs at least one mitigation | `threats[]` |
| `status: accepted` needs `residual-risk` with `rating` and `accepted-by` | `threats[]` |
| A trust boundary names at least one relationship | `trust-boundaries[]` |
| The STRIDE standard restricts `classification` to the six STRIDE categories | STRIDE standard |

Checks that need the architecture (a relationship id exists, a control is declared) cannot be done
in JSON Schema. A tool must do them.

## Known gaps

- `decorators.json` has no `$schema` property and sets `additionalProperties: false`. A decorator
  with `$schema` fails validation against its standard. The deployment examples have the same
  problem. These examples keep `$schema`, because CALM Hub uses it.
- The CLI cannot validate a decorator today.
- A flow transition has no `unique-id`. A threat uses the relationship id and, where needed, the
  sequence number.

## Example

See [examples](./examples/README.md).
