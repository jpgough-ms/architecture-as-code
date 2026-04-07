---
title: Micro Segmentation.requirement.json
---
### Specification

```json
{
  "id": "micro-segmentation.requirement.json",
  "content": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://calm.finos.org/workshop/controls/micro-segmentation.requirement.json",
    "title": "Micro-segmentation configured Kubernetes Cluster",
    "type": "object",
    "allOf": [
      {
        "$ref": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "$id": "https://calm.finos.org/draft/2025-03/meta/control-requirement.json",
          "title": "Common Architecture Language Model Control Requirement",
          "description": "Schema for defining control requirements within the Common Architecture Language Model.",
          "type": "object",
          "properties": {
            "control-id": {
              "type": "string",
              "description": "The unique identifier of this control, which has the potential to be used for linking evidence"
            },
            "name": {
              "type": "string",
              "description": "The name of the control requirement that provides contextual meaning within a given domain"
            },
            "description": {
              "type": "string",
              "description": "A more detailed description of the control and information on what a developer needs to consider"
            }
          },
          "required": [
            "control-id",
            "name",
            "description"
          ],
          "examples": [
            {
              "control-id": "CR-001",
              "name": "Access Control",
              "description": "Ensure that access to sensitive information is restricted."
            }
          ]
        }
      }
    ],
    "properties": {
      "control-id": {
        "const": "security-001"
      },
      "name": {
        "const": "Micro-segmentation of Kubernetes Cluster"
      },
      "description": {
        "const": "Micro-segmentation in place to prevent lateral movement outside of permitted flows"
      },
      "permit-ingress": {
        "type": "boolean"
      },
      "permit-egress": {
        "type": "boolean"
      }
    },
    "required": [
      "control-id",
      "name",
      "description",
      "permit-ingress",
      "permit-egress"
    ]
  },
  "domain": "security"
}
```