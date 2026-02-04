#!/usr/bin/env node
/**
 * ChatShot - WhatsApp conversation screenshot generator
 */

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const Handlebars = require('handlebars');
const { renderConversation } = require('./renderer');

program
  .name('chatshot')
  .description('Generate realistic WhatsApp conversation screenshots')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate screenshot from conversation file')
  .argument('<input>', 'Input YAML or JSON file')
  .option('-o, --output <file>', 'Output file (default: output.png)')
  .option('-v, --variables <json>', 'JSON string of variables to substitute')
  .option('-f, --variables-file <file>', 'JSON/YAML file with variables')
  .option('--width <pixels>', 'Screenshot width', '390')
  .option('--dark', 'Use dark mode')
  .option('--android', 'Use Android style (default: iOS)')
  .action(async (input, options) => {
    try {
      // Read input file
      const inputPath = path.resolve(input);
      const content = fs.readFileSync(inputPath, 'utf8');
      
      // Parse based on extension
      let config;
      if (inputPath.endsWith('.yaml') || inputPath.endsWith('.yml')) {
        config = yaml.parse(content);
      } else {
        config = JSON.parse(content);
      }

      // Load variables
      let variables = config.variables || {};
      
      if (options.variablesFile) {
        const varContent = fs.readFileSync(options.variablesFile, 'utf8');
        const fileVars = options.variablesFile.endsWith('.json') 
          ? JSON.parse(varContent) 
          : yaml.parse(varContent);
        variables = { ...variables, ...fileVars };
      }
      
      if (options.variables) {
        const cliVars = JSON.parse(options.variables);
        variables = { ...variables, ...cliVars };
      }

      // Apply variable substitution to conversation
      const configStr = JSON.stringify(config);
      const template = Handlebars.compile(configStr);
      const processedConfig = JSON.parse(template(variables));

      // Determine output path
      const outputPath = options.output || 
        processedConfig.output?.filename || 
        'output.png';
      
      // Apply variables to output filename too
      const outputTemplate = Handlebars.compile(outputPath);
      const finalOutput = outputTemplate(variables).replace(/[<>:"/\\|?*]/g, '_');

      // Render
      console.log(`Generating screenshot: ${finalOutput}`);
      await renderConversation(processedConfig, {
        output: finalOutput,
        width: parseInt(options.width) || processedConfig.output?.width || 390,
        darkMode: options.dark || processedConfig.output?.darkMode || false,
        android: options.android || processedConfig.output?.android || false
      });
      
      console.log(`Done: ${finalOutput}`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Generate multiple screenshots from CSV/JSON data')
  .argument('<template>', 'Conversation template file')
  .argument('<data>', 'CSV or JSON file with variable data')
  .option('-o, --output-dir <dir>', 'Output directory', './output')
  .option('--width <pixels>', 'Screenshot width', '390')
  .option('--dark', 'Use dark mode')
  .action(async (template, data, options) => {
    try {
      const templateContent = fs.readFileSync(template, 'utf8');
      const templateConfig = yaml.parse(templateContent);
      
      const dataContent = fs.readFileSync(data, 'utf8');
      const records = JSON.parse(dataContent);
      
      if (!fs.existsSync(options.outputDir)) {
        fs.mkdirSync(options.outputDir, { recursive: true });
      }
      
      for (let i = 0; i < records.length; i++) {
        const variables = records[i];
        const configStr = JSON.stringify(templateConfig);
        const compiled = Handlebars.compile(configStr);
        const config = JSON.parse(compiled(variables));
        
        const filename = config.output?.filename || `output-${i + 1}.png`;
        const filenameTemplate = Handlebars.compile(filename);
        const finalFilename = filenameTemplate(variables).replace(/[<>:"/\\|?*]/g, '_');
        const outputPath = path.join(options.outputDir, finalFilename);
        
        console.log(`[${i + 1}/${records.length}] Generating: ${finalFilename}`);
        await renderConversation(config, {
          output: outputPath,
          width: parseInt(options.width),
          darkMode: options.dark
        });
      }
      
      console.log(`Done! Generated ${records.length} screenshots.`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('example')
  .description('Generate an example conversation file')
  .option('-o, --output <file>', 'Output file', 'example.yaml')
  .action((options) => {
    const example = `# ChatShot Example Conversation
# Run: chatshot generate example.yaml -o demo.png

conversation:
  platform: whatsapp
  contact:
    name: "{{contact_name}}"
    phone: "+34 612 345 678"
  messages:
    - from: contact
      text: "Hola, me interesa el asistente de IA"
      time: "10:30"
    - from: me
      text: "¡Hola {{contact_name}}! 👋"
      time: "10:31"
    - from: me
      text: "Claro, te cuento. Nuestro asistente puede responder consultas de clientes 24/7, gestionar citas y mucho más."
      time: "10:31"
    - from: contact
      text: "Suena genial. ¿Cómo funciona?"
      time: "10:32"
    - from: me
      text: "Se integra directamente con WhatsApp Business. Tus clientes chatean normal y el asistente responde al instante."
      time: "10:33"

variables:
  contact_name: "María García"

output:
  filename: "demo-{{contact_name}}.png"
  width: 390
  darkMode: false
`;
    
    fs.writeFileSync(options.output, example);
    console.log(`Example saved to: ${options.output}`);
    console.log('Run: chatshot generate example.yaml -o demo.png');
  });

program.parse();
