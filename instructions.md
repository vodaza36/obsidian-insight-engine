# Project Requirements Document
## Prupose
The pupose of this project is to develop an Obsidian plugin that handles the Tag management based
on an AI driven approach. Following requirements must be met: 
- To keep everything private and secure an Ollama local LLM is used to classify the notes.
- The plugin should be available at the Obsidian marketplace.

## Features
- Scan the vault and generate a list of tags
- Scan the vault and assign tags to notes based on the existings tags

## UI
- On the plugin settings page the user must confirm to scan the vault for tags
- Using Obsidian's native UI components and APIs for:
    - Settings page implementation
    - Modals and notifications
    - Consistent look and feel with the Obsidian app
- No external UI framework needed to maintain simplicity and reduce bundle size

## Technology Stack
- [Obsidian](https://obsidian.md/) - Knowledge management application
- [TypeScript](https://www.typescriptlang.org/) - Programming language for type-safe JavaScript
- [Obsidian API](https://github.com/obsidianmd/obsidian-api) - Native UI components and plugin APIs
- [LangChain.js](https://js.langchain.com/) - Framework for developing LLM-powered applications
- [Ollama](https://github.com/ollama/ollama) - Run large language models locally
    - Using Llama2 as the base model for text generation and analysis