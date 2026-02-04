# ChatShot

CLI tool to generate realistic WhatsApp conversation screenshots for sales demos.

## Features

- 📱 Pixel-perfect WhatsApp iOS style
- 🌙 Dark mode support
- 📝 YAML/JSON input format
- 🔄 Variable substitution with Handlebars
- 📊 Batch generation from CRM data
- 🖼️ PNG/JPG output

## Installation

### Using Nix (recommended)

```bash
# Run directly
nix run github:tinkeringmachines/chatshot -- generate conversation.yaml

# Enter dev shell
nix develop github:tinkeringmachines/chatshot

# Install to profile
nix profile install github:tinkeringmachines/chatshot
```

### Using npm

```bash
git clone https://github.com/tinkeringmachines/chatshot.git
cd chatshot
npm install
npm link  # optional: makes 'chatshot' available globally
```

## Quick Start

```bash
# Generate example conversation file
chatshot example -o demo.yaml

# Generate screenshot
chatshot generate demo.yaml -o screenshot.png

# With dark mode
chatshot generate demo.yaml -o screenshot-dark.png --dark

# With variable override
chatshot generate demo.yaml -v '{"contact_name": "John Doe"}'
```

## Conversation Format

```yaml
conversation:
  platform: whatsapp
  contact:
    name: "{{contact_name}}"
    phone: "+34 612 345 678"
  messages:
    - from: contact
      text: "Hello, I'm interested in your AI assistant"
      time: "10:30"
    - from: me
      text: "Hi {{contact_name}}! 👋"
      time: "10:31"
    - from: me
      text: "Our assistant can handle customer queries 24/7"
      time: "10:31"

variables:
  contact_name: "María García"

output:
  filename: "demo-{{contact_name}}.png"
  width: 390
  darkMode: false
```

## Batch Generation

Generate personalized screenshots for multiple contacts:

```bash
chatshot batch template.yaml contacts.json -o ./output
```

`contacts.json`:
```json
[
  {"contact_name": "María García", "company": "Acme Corp"},
  {"contact_name": "Juan López", "company": "Tech Inc"}
]
```

## CLI Options

### generate

```
chatshot generate <input> [options]

Options:
  -o, --output <file>         Output file (default: output.png)
  -v, --variables <json>      JSON string of variables
  -f, --variables-file <file> Variables from file
  --width <pixels>            Screenshot width (default: 390)
  --dark                      Dark mode
  --android                   Android style (coming soon)
```

### batch

```
chatshot batch <template> <data> [options]

Options:
  -o, --output-dir <dir>  Output directory (default: ./output)
  --width <pixels>        Screenshot width (default: 390)
  --dark                  Dark mode
```

## Development

```bash
# Enter dev shell with all dependencies
nix develop

# Install npm dependencies
npm install

# Run CLI
node src/index.js generate example.yaml
```

## License

MIT
