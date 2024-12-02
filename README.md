# Obsidian Insight Engine Plugin

[![License](https://img.shields.io/github/license/username/obsidian-insight-engine)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/username/obsidian-insight-engine/total)](https://github.com/username/obsidian-insight-engine/releases)

Transform your Obsidian vault with AI-powered insights while keeping your privacy intact. The Insight Engine plugin enhances your note-taking experience by leveraging privacy-focused local processing with Ollama.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/vodaza36)
## ✨ Key Features

### 🏷️ Intelligent Tag Generation
- Scan individual notes to generate contextually relevant tags
- Consider existing tags in your vault for consistency
- Suggest new tags when existing ones don't fit the content

### 📝 Note Summarization
- Generate concise summaries of your notes
- Support for Markdown formatting in summaries
- Easy one-click copy to clipboard functionality

### ❓ Question Generation
- Extract key questions from your note content
- Questions formatted in Markdown for better readability
- Quick copy-to-clipboard feature for generated questions

### 🔒 Privacy-First Architecture
- Utilizes Ollama for local LLM processing
- Keep all your data secure and private
- Full control over your note analysis

## 🚀 Installation

### Community Plugin Store (Recommended)
1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Insight Engine"
4. Install the plugin and enable it

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/username/obsidian-insight-engine/releases)
2. Extract the ZIP file into your vault's `.obsidian/plugins` folder
3. Reload Obsidian
4. Enable the plugin in Community Plugins settings

## ⚙️ Setup

### Ollama Setup
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull your preferred model: `ollama pull llama2`
3. Start Ollama
4. In plugin settings:
   - Set Host URL (default: http://localhost:11434)
   - Choose your model (default: llama2)

## 📖 Usage

### Basic Commands
- `Cmd/Ctrl + P` → "Generate Tags" to analyze current note
- Configure tag style and location in settings
- Tags can be added as YAML frontmatter or inline

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Setup Development Environment
1. Clone the repository
```bash
git clone https://github.com/username/obsidian-insight-engine.git
cd obsidian-insight-engine
```

2. Install dependencies
```bash
npm install
```

3. Build for development
```bash
npm run dev
```

4. For production build
```bash
npm run build
```

### Testing
- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- E2E tests: `npm run test:e2e`

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
