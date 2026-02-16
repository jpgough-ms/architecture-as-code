## QCon Demo Plan

Slides
- Who are we? (A)
- Story since last QCon (J)
    - MCP
    - Update on the CALM Project

## Scenario 1: Demo Recap and Introduction of MCP (J**)

- Claude example, tie back to 2025 QCon
- Key concepts introduction CALM, how deployments work (visual)
- Brief demo of trades where Jim does something shady

Slides
- How has platform helped (handover)

Slides (A)
- Ethos of Platform (A)
- Components that Support Controls in CALM and Architecture (A)
- Pattern composition, building on the foundation of APIs

## Sceario 2: Architecture Controls (A)

- Where do things sit consistently - what is the governance?
- Demonstrate CALM Hub, Simple Registry, Deployment controls
- Introduce inspector, now try deploy previous architecture
- Platform Ethos 

Slides
- Concerns of MCP vs API Security

## Secenario 3: Enforcment of MCP Controls (J)

- Have a control
- Control is deployed 
- Deploy architecture from the pattern


Scaling API Program Slides (J)
- How CALM has scaled at MS
- API Program growth -> KPIs
- Changes

## Scenario 4: Operational Rollouts (A)
- Based on slides...
- Trigger events:
    - log4j
    - Platform Drift
    - Multiple version problem
    - Infra/control upgrades

Slides Future Proofing (J)
- How have we adopted MCP in a regulated environment at speed
- How do we adapt to future change
- API Annotations, into generated MCP Server with tool specs

## Scenario 5: Generated from OpenAPI Spec

Work
- Jim to deploy Trades API
- Jim to deploy Trades MCP
- Andreea to work on Deployment Validation Tool
- Jim MCP Controls, add a control, deployment validation tool to reject 
- CALM Composite Patterns, Controls + CalmHub
- MCP Generated from annotations