---
title: Permitted Connection.requirement.json
---
### Specification

```json
{
  "id": "permitted-connection.requirement.json",
  "content": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://calm.finos.org/workshop/controls/permitted-connection.requirement.json",
    "title": "Permits a connection between two components in the architecture",
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
        "const": "security-002"
      },
      "name": {
        "const": "Permitted Connection"
      },
      "description": {
        "const": "Permits a connection on a relationship specified in the architecture"
      },
      "reason": {
        "type": "string",
        "description": "Reason for permitting the connection"
      },
      "protocol": {
        "enum": [
          "HTTP",
          "HTTPS",
          "FTP",
          "SFTP",
          "JDBC",
          "WebSocket",
          "SocketIO",
          "LDAP",
          "AMQP",
          "TLS",
          "mTLS",
          "TCP"
        ]
      }
    },
    "required": [
      "control-id",
      "name",
      "description",
      "reason",
      "protocol"
    ],
    "defs": {
      "protocol": {
        "enum": [
          "HTTP",
          "HTTPS",
          "FTP",
          "SFTP",
          "JDBC",
          "WebSocket",
          "SocketIO",
          "LDAP",
          "AMQP",
          "TLS",
          "mTLS",
          "TCP"
        ]
      }
    }
  },
  "domain": "security"
}
```