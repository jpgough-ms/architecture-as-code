# Payments API example

A small payments architecture used to show a threat model on a CALM flow.

| File | Purpose |
|---|---|
| `payments-api.architecture.json` | Mobile app, API gateway, payments API and database, with controls on nodes, relationships and the architecture |
| `submit-payment.flow.json` | The "Submit Payment" flow, a straight line through the four nodes |
| `submit-payment.stride.decorator.json` | STRIDE threat model for the flow: three trust boundaries, six threats |

The decorator follows the [threat model decorator standards](../../calm/draft/2026-03/standards/threat-model/README.md).
A copy sits in that folder. This folder is the source of truth.

The flow and the architecture are separate documents, as in `examples/fluxnova`. CALM Hub seed scripts
load these files. Keep the seed scripts in step with them.
