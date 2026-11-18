# Threat Model Decorator Examples

| Example | Standard | Shows |
|---|---|---|
| `submit-payment.stride.decorator.json` | STRIDE | A payment flow with three trust boundaries and six threats: two mitigated, two partly mitigated, one identified, one accepted |

The decorator is for the flow in `examples/payments-api/`. That folder is the source of truth for
the whole example. Keep this copy in step with it.

The threats use these controls. `rate-limiting` is not declared anywhere, so a tool shows it as a gap.

| Control | Declared on |
|---|---|
| `oauth2-authentication` | API Gateway node |
| `authorization-checks` | Payments API node |
| `encryption-at-rest` | Payments DB node |
| `transport-security`, `mutual-tls` | relationships |
| `audit-logging` | architecture |
| `rate-limiting` | nowhere (gap) |
