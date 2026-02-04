---
name: chatshot
description: Generate realistic WhatsApp conversation screenshots for sales demos. Use when you need to create mockup screenshots of WhatsApp conversations with customizable contact names, messages, and timestamps. Supports variable substitution for batch generation.
---

# ChatShot - WhatsApp Screenshot Generator

Generate pixel-perfect WhatsApp conversation screenshots from YAML/JSON templates.

## Quick Start

```bash
# Generate from template
chatshot generate conversation.yaml -o output.png

# With variable override
chatshot generate conversation.yaml -v '{"contact_name": "John Doe"}' -o john.png

# Dark mode
chatshot generate conversation.yaml --dark -o dark-mode.png

# Create example template
chatshot example -o my-conversation.yaml
```

## Conversation Template Format

Create a YAML file with this structure:

```yaml
conversation:
  platform: whatsapp
  contact:
    name: "{{contact_name}}"
    phone: "+34 612 345 678"
  messages:
    - from: contact
      text: "Hello, I'm interested in your product"
      time: "10:30"
    - from: me
      text: "Hi {{contact_name}}! 👋"
      time: "10:31"
    - from: me
      text: "Happy to help. What would you like to know?"
      time: "10:31"
    - from: contact
      text: "How does it work?"
      time: "10:32"

variables:
  contact_name: "María García"

output:
  filename: "demo-{{contact_name}}.png"
  width: 390
  darkMode: false
```

## Commands

### generate

Generate a screenshot from a conversation file.

```bash
chatshot generate <input> [options]

Options:
  -o, --output <file>         Output filename (default: output.png)
  -v, --variables <json>      JSON string of variables to substitute
  -f, --variables-file <file> Load variables from JSON/YAML file
  --width <pixels>            Screenshot width (default: 390)
  --dark                      Use dark mode theme
```

### batch

Generate multiple screenshots from a data file.

```bash
chatshot batch <template> <data> [options]

Options:
  -o, --output-dir <dir>  Output directory (default: ./output)
  --width <pixels>        Screenshot width (default: 390)
  --dark                  Use dark mode
```

Example data file (contacts.json):
```json
[
  {"contact_name": "María García", "company": "Acme Corp"},
  {"contact_name": "Juan López", "company": "Tech Inc"}
]
```

### example

Generate an example conversation template file.

```bash
chatshot example -o template.yaml
```

## Variable Substitution

ChatShot uses Handlebars templating. Variables can be:

1. **Defined in the YAML** under `variables:`
2. **Passed via CLI** with `-v '{"key": "value"}'`
3. **Loaded from file** with `-f variables.json`

CLI variables override file variables, which override YAML variables.

## Output

- Default format: PNG (use `.jpg` extension for JPEG)
- Default width: 390px (iPhone width)
- Retina resolution: 2x device pixel ratio

## Common Use Cases

### Sales Demo Screenshots

Create personalized WhatsApp mockups for each prospect:

```bash
# Create template with {{prospect_name}} placeholders
# Then batch generate for all prospects
chatshot batch demo-template.yaml prospects.json -o ./demos
```

### Feature Demonstrations

Show what an AI assistant conversation looks like:

```yaml
messages:
  - from: contact
    text: "Can I book an appointment?"
    time: "14:00"
  - from: me
    text: "Of course! I have availability tomorrow at 10am or 3pm. Which works better for you?"
    time: "14:00"
```

### A/B Testing Different Scripts

Generate multiple versions with different messaging:

```bash
chatshot generate script-a.yaml -o version-a.png
chatshot generate script-b.yaml -o version-b.png
```
