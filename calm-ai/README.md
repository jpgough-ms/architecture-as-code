# CALM AI Tools

This project contains AI tools and prompts for working with FINOS Common Architecture Language Model (CALM) architectures, including STRIDER threat modeling capabilities.

## Overview

The CALM AI tools provide specialized prompts and guidance for AI assistants to help users create, validate, and document CALM architectures. These tools are designed to be embedded in development environments like VS Code to provide context-aware assistance.

### Chatmodes

- **CALM.chatmode.md** - Primary chatmode for CALM architecture development with lazy-loaded STRIDER capabilities
- **STRIDER.chatmode.md** - Dedicated chatmode for STRIDE threat modeling on CALM architectures

## Structure

### CALM Tool Prompts

- `tools/` - Individual CALM tool prompt files
    - `architecture-creation.md` - Guide for creating CALM architecture documents
    - `calm-cli-instructions.md` - Summary of CALM CLI commands and usage flags
    - `control-creation.md` - Guide for control requirements and configurations
    - `documentation-creation.md` - Guide for generating documentation
    - `flow-creation.md` - Guide for business process flows
    - `interface-creation.md` - Critical guidance for interface oneOf constraints
    - `metadata-creation.md` - Guide for metadata array requirements
    - `node-creation.md` - Guide for creating nodes with proper validation
    - `pattern-creation.md` - Guide for reusable architectural patterns
    - `relationship-creation.md` - Guide for creating relationships between nodes
    - `standards-creation.md` - Guide for creating JSON Schema Standards that extend CALM components with organizational requirements

### STRIDER Threat Modeling Prompts

- `tools/strider-prompts/` - STRIDE threat modeling methodology for CALM architectures
    - `stride-overview.md` - Overview of STRIDE threat categories
    - `trust-boundary-identification.md` - Identifying trust boundaries in CALM architectures
    - `dataflow-diagram.md` - Generating data flow diagrams with security boundaries
    - `threat-table-template.md` - STRIDE threat analysis table templates
    - `ai-governance-integration.md` - FINOS AI Governance Framework integration for AI/MCP systems
    - `threat-model-output.md` - Threat model document generation guidelines

## Usage

These tool prompts are automatically included in the CALM CLI distribution and used by the `calm copilot-chatmode` command to set up AI-powered development environments.

### Installing CALM and STRIDER Chatmodes

Run the CALM CLI command to install both chatmodes:

```bash
calm copilot-chatmode
```

This creates:
- `.github/chatmodes/CALM.chatmode.md` - Primary CALM architecture assistant
- `.github/chatmodes/STRIDER.chatmode.md` - Dedicated STRIDE threat modeling assistant
- `.github/chatmodes/calm-prompts/` - CALM tool prompt files
- `.github/chatmodes/strider-prompts/` - STRIDER threat modeling prompt files

### Using STRIDER Threat Modeling

**Option 1: Lazy-load in CALM chatmode (recommended)**
- Start a chat with the CALM chatmode
- Request threat modeling using phrases like:
  - "Create a threat model for this architecture"
  - "Perform STRIDE analysis"
  - "Run security analysis"
  - "Generate a threat model"
- CALM automatically loads STRIDER capabilities on-demand

**Option 2: Use STRIDER chatmode directly**
- Switch to the STRIDER chatmode in VS Code
- Provide the CALM architecture file path
- STRIDER performs dedicated threat modeling analysis

## Contributing

To contribute to the AI tools:

1. Edit the relevant tool prompt file in the `tools/` directory
2. Follow the existing structure and format
3. Include practical examples and validation guidance
4. Test changes by running `calm copilot-chatmode` and verifying the generated prompts

## Validation

Tool prompts should:

- Include critical validation requirements
- Provide working examples
- Reference CALM schema v1.0
- Emphasize common pitfalls and solutions
- Follow consistent markdown formatting
