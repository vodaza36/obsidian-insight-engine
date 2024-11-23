# Obsidian Tag Agent

An AI-powered Obsidian plugin that helps manage and suggest tags for your notes using LangChain.js and OpenAI.

## Resources
The following list of resources were used to develop this plugin:
- [Obsidian Plugin Development](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)

## Features

- Automatically analyzes note content and suggests relevant tags
- Uses OpenAI's language models through LangChain.js
- Simple settings interface for API key management

## Installation

1. Download the latest release from the releases page
2. Extract the files to your Obsidian plugins folder: `.obsidian/plugins/obsidian-tag-agent/`
3. Enable the plugin in Obsidian's settings
4. Add your OpenAI API key in the plugin settings

## Usage

1. Open any note you want to analyze
2. Use the command palette (Cmd/Ctrl + P) and search for "Analyze Current Note"
3. The plugin will analyze your note content and suggest relevant tags

## Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. For development with hot reload:
   ```bash
   npm run dev
   ```

## Requirements

- Obsidian v0.15.0 or higher
- OpenAI API key
