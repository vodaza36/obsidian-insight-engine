# Project Requirements Document
## Prupose
The pupose of this project is to develop an Obsidian plugin that handles the Tag management based
on an AI driven approach. Following requirements must be met: 
- To keep everything private and secure an Ollama local LLM is used to classify the notes.
- The plugin should be available at the Obsidian marketplace.

## Features
- Scan the vault and generate a list of tags
- Scan the vault and assign tags to notes based on the existings tags

## Technology Stack
- [Obsidian](https://obsidian.md/)
- [Ollama](https://github.com/ollama/ollama)
    - llama3.1 as LLM model